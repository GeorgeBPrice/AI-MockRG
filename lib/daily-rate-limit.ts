import { redisGet, redisIncr, redisExpire } from './redis-adapter';
import { getGlobalSettings } from './storage';

export interface DailyLimitContext {
  identifier: string; // User ID or IP address
  usesOwnApiKey: boolean; // Whether the user is using their own API key
}

// Get the timestamp for the next midnight UTC (in seconds)
function getNextMidnightTimestamp(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return Math.floor(tomorrow.getTime() / 1000);
}

// Get the current date string in YYYY-MM-DD format for the key
function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Check if a user has free generations left
export async function checkDailyLimit({
  identifier,
  usesOwnApiKey
}: DailyLimitContext): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  resetTimestamp: number;
}> {
  // Users with their own API key are not subject to daily limits
  if (usesOwnApiKey) {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      resetTimestamp: 0 // No reset needed
    };
  }

  const settings = await getGlobalSettings();
  const dailyLimit = settings.rateLimits.anonymous || 5; // Default to 5 daily generations
  const currentDate = getCurrentDateString();
  const resetTimestamp = getNextMidnightTimestamp();
  
  // Key for daily generation limit
  const key = `free-gen:${identifier}:${currentDate}`;
  
  // Get current usage count
  const current = parseInt(await redisGet(key) || '0', 10);
  
  // Calculate remaining uses
  const remaining = Math.max(0, dailyLimit - current);
  
  // Success if still under limit
  const success = current < dailyLimit;
  
  // Set expiry to next midnight UTC if needed
  if (success && current === 0) {
    // If this is the first use today, set expiry
    const secondsUntilReset = resetTimestamp - Math.floor(Date.now() / 1000);
    await redisExpire(key, secondsUntilReset);
  }
  
  return {
    success,
    limit: dailyLimit,
    remaining,
    resetTimestamp
  };
}

// Increment usage count after a successful generation
export async function incrementDailyUsage(identifier: string): Promise<void> {
  const currentDate = getCurrentDateString();
  const key = `free-gen:${identifier}:${currentDate}`;
  
  await redisIncr(key);
  
  // Ensure the TTL is set (in case it wasn't set before)
  const resetTimestamp = getNextMidnightTimestamp();
  const secondsUntilReset = resetTimestamp - Math.floor(Date.now() / 1000);
  await redisExpire(key, secondsUntilReset);
}

// Get current usage without checking against limits
export async function getCurrentDailyUsage(identifier: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetTimestamp: number;
}> {
  const settings = await getGlobalSettings();
  const dailyLimit = settings.rateLimits.anonymous || 5;
  const currentDate = getCurrentDateString();
  const key = `free-gen:${identifier}:${currentDate}`;
  
  // Get current usage count
  const used = parseInt(await redisGet(key) || '0', 10);
  const remaining = Math.max(0, dailyLimit - used);
  const resetTimestamp = getNextMidnightTimestamp();
  
  return {
    used,
    limit: dailyLimit,
    remaining,
    resetTimestamp
  };
} 