import { createClient } from 'redis';

// Create Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    // Create new Redis client if it doesn't exist
    redisClient = createClient({
      url: process.env.REDIS_URL,
      // Add authentication if needed
    });

    // Handle connection errors
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    // Connect to Redis
    await redisClient.connect();
  }

  return redisClient;
}

// Helper functions for common Redis operations
export async function redisGet(key: string) {
  const client = await getRedisClient();
  return client.get(key);
}

export async function redisSet(key: string, value: string, expireInSeconds?: number) {
  const client = await getRedisClient();
  if (expireInSeconds) {
    return client.set(key, value, { EX: expireInSeconds });
  }
  return client.set(key, value);
}

export async function redisIncr(key: string) {
  const client = await getRedisClient();
  return client.incr(key);
}

export async function redisExpire(key: string, expireInSeconds: number) {
  const client = await getRedisClient();
  return client.expire(key, expireInSeconds);
}

// Get all free generation count keys for admin purposes
export async function getAllFreeUsageKeys() {
  const client = await getRedisClient();
  return client.keys('free-gen:*');
}

// Get remaining time in seconds until key expires
export async function getKeyTTL(key: string) {
  const client = await getRedisClient();
  return client.ttl(key);
} 