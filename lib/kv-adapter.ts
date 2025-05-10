import { createClient } from "@vercel/kv";

function cleanRestApiUrl(url: string | undefined): string {
  if (!url) return "";

  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (e) {
    console.error("Error parsing REST API URL:", e);
    return url;
  }
}

// Check if we have the required environment variables
const hasRequiredEnvVars =
  typeof process !== "undefined" &&
  (process.env.REDIS_UPSTASH_URL_KV_REST_API_URL ||
    process.env.KV_REST_API_URL) &&
  (process.env.REDIS_UPSTASH_URL_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN);

// Create the client only if we have the environment variables
const kvClient = hasRequiredEnvVars
  ? createClient({
      url:
        cleanRestApiUrl(
          process.env.REDIS_UPSTASH_URL_KV_REST_API_URL ||
            process.env.KV_REST_API_URL
        ) || "",
      token:
        process.env.REDIS_UPSTASH_URL_KV_REST_API_TOKEN ||
        process.env.KV_REST_API_TOKEN ||
        "",
    })
  : null;

// Export the KV client or a mock implementation if not available
// used to mocking the kv client for testing purposes
export const kv = kvClient || {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get: async <TData>(_key: string) => null as TData | null,
  set: async () => null,
  del: async () => 0,
  exists: async () => 0,
  hgetall: async () => null,
  hget: async () => null,
  hset: async () => 0,
  hdel: async () => 0,
  sadd: async () => 0,
  srem: async () => 0,
  smembers: async () => [],
  scard: async () => 0,
  lpush: async () => 0,
  lpop: async () => null,
  lrange: async () => [],
  lrem: async () => 0,
  ltrim: async () => "OK",
  incr: async () => 1,
  expire: async () => "OK",
  multi: () => ({
    exec: async () => [],
    get: () => null,
    set: () => null,
    del: () => 0,
    exists: () => 0,
    hgetall: () => null,
    hget: () => null,
    hset: () => 0,
    hdel: () => 0,
    sadd: () => 0,
    srem: () => 0,
    smembers: () => [],
    scard: () => 0,
    lpush: () => 0,
    lpop: () => null,
    lrange: () => [],
    lrem: () => 0,
    ltrim: () => "OK",
    incr: () => 1,
    expire: () => "OK",
  }),
};
