import { kv } from "./kv-adapter";
import { getGlobalSettings } from "./storage";

export interface RateLimitContext {
  identifier: string;
  isAuthenticated: boolean;
  endpoint: string;
}

// In-memory storage for rate limiting in development
const mockRateLimits: Record<string, { count: number; expires: number }> = {};

// Function to check if a request should be rate limited
export async function checkRateLimit({
  identifier,
  isAuthenticated,
  endpoint,
}: RateLimitContext): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const settings = await getGlobalSettings();
  const hourlyLimit = isAuthenticated
    ? settings.rateLimits.authenticated
    : settings.rateLimits.anonymous;

  // Current time in seconds
  const now = Math.floor(Date.now() / 1000);
  // Reset time (1 hour from now in seconds)
  const resetTime = Math.floor(now / 3600) * 3600 + 3600;
  // Key for rate limiting
  const key = `ratelimit:${identifier}:${endpoint}:${Math.floor(now / 3600)}`;

  // Check if we're in development mode
  const useMockStorage =
    process.env.NODE_ENV === "development" ||
    !process.env.KV_REST_API_URL ||
    process.env.KV_REST_API_URL.includes("your-kv");

  let current = 0;

  if (useMockStorage) {
    // Use in-memory rate limit tracking
    if (mockRateLimits[key]) {
      // Check if the current rate limit has expired
      if (mockRateLimits[key].expires < now) {
        mockRateLimits[key] = { count: 0, expires: resetTime };
      }
      current = mockRateLimits[key].count;
    } else {
      mockRateLimits[key] = { count: 0, expires: resetTime };
    }
  } else {
    // Use Vercel KV for rate limit tracking
    current = (await kv.get<number>(key)) || 0;
  }

  // If under limit, increment and allow
  if (current < hourlyLimit) {
    if (useMockStorage) {
      mockRateLimits[key].count += 1;
    } else {
      await kv.incr(key);
      await kv.expire(key, resetTime - now); // Set TTL until reset
    }

    return {
      success: true,
      limit: hourlyLimit,
      remaining: hourlyLimit - current - 1,
      reset: resetTime,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    limit: hourlyLimit,
    remaining: 0,
    reset: resetTime,
  };
}
