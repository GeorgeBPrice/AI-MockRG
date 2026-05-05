// Per-identity in-flight concurrency cap (P2-3).
//
// Backed by a Redis counter so it survives across serverless instances. The
// counter is keyed per identifier (user-id, API-key-id, or `anon:<ip>`) and
// each acquired slot has a short TTL as a safety net in case the request
// crashes between acquire/release. Every release also DECRs explicitly.
//
// Usage:
//   const slot = await acquireSlot(`user:${userId}`);
//   if (!slot.ok) return 429-with-message;
//   try { ... } finally { await releaseSlot(slot); }

import { getRedisClient } from "./redis-client";

const KEY_PREFIX = "inflight:";
const SLOT_TTL_SECONDS = 120; // safety net — generations should finish well before this
export const MAX_INFLIGHT_PER_IDENTITY = 2;

export interface SlotHandle {
  ok: boolean;
  key?: string;
  /** Current count after acquire (only meaningful when ok=true). */
  count?: number;
}

export async function acquireSlot(identifier: string): Promise<SlotHandle> {
  const key = KEY_PREFIX + identifier;
  try {
    const client = await getRedisClient();
    const count = await client.incr(key);
    // Refresh TTL on every acquire so the key can't get stuck if a previous
    // crash left it elevated. EXPIRE returns 1 on success, ignore.
    await client.expire(key, SLOT_TTL_SECONDS);

    if (count > MAX_INFLIGHT_PER_IDENTITY) {
      // Roll back this acquisition immediately.
      await client.decr(key);
      return { ok: false };
    }
    return { ok: true, key, count };
  } catch (err) {
    // Fail open: if Redis is unavailable, don't block legitimate traffic.
    console.warn("acquireSlot: Redis unavailable, skipping concurrency cap", err);
    return { ok: true };
  }
}

export async function releaseSlot(slot: SlotHandle): Promise<void> {
  if (!slot.ok || !slot.key) return;
  try {
    const client = await getRedisClient();
    const remaining = await client.decr(slot.key);
    // Counter went negative (e.g. TTL expired then DECR ran): clamp to 0.
    if (remaining < 0) {
      await client.set(slot.key, "0", { EX: SLOT_TTL_SECONDS });
    }
  } catch (err) {
    console.warn("releaseSlot: Redis unavailable, skipping decrement", err);
  }
}
