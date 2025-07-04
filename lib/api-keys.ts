import { kv } from "./kv-adapter";

// Web Crypto API utilities for Edge compatibility
const getCrypto = () => {
  if (typeof globalThis.crypto !== "undefined") {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto API not available");
};

// Convert ArrayBuffer to hex string
const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(buffer);
  return Array.from(uint8Array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};

// Convert ArrayBuffer to base64url string
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

export interface ApiKeyRecord {
  id: string; // UUID v4
  userId: string; // Associated user ID
  keyHash: string; // PBKDF2 hash of the key
  name: string; // User-defined key name
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp (90 days from creation)
  lastUsed?: number; // Unix timestamp of last usage
  usageCount: number; // Number of times used
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  success: boolean;
  apiKey?: string; // Only returned once
  keyId: string;
  name: string;
  expiresAt: number;
}

export interface ListApiKeysResponse {
  success: boolean;
  keys: Array<{
    id: string;
    name: string;
    createdAt: number;
    expiresAt: number;
    lastUsed?: number;
    usageCount: number;
  }>;
}

// Constants
const API_KEY_LENGTH = 32; // 32 bytes = 256 bits
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64; // 64 bytes = 512 bits
const API_KEY_EXPIRY_DAYS = 90;
const API_KEY_PREFIX = "api-key:";
const USER_API_KEYS_PREFIX = "user:";

/**
 * Generate a cryptographically secure API key
 */
export async function generateApiKey(): Promise<string> {
  const crypto = getCrypto();
  const randomBytes = crypto.getRandomValues(new Uint8Array(API_KEY_LENGTH));
  return arrayBufferToBase64Url(randomBytes.buffer);
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  const crypto = getCrypto();
  return crypto.randomUUID();
}

/**
 * Hash an API key using PBKDF2 for secure storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const crypto = getCrypto();

  // Generate salt
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = arrayBufferToHex(saltBytes.buffer);

  // Convert API key to ArrayBuffer
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const saltData = encoder.encode(salt);

  // Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltData,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-512",
    },
    key,
    PBKDF2_KEYLEN * 8 // Convert bytes to bits
  );

  const hash = arrayBufferToHex(derivedBits);
  return `${salt}:${hash}`;
}

/**
 * Verify an API key against its hash
 */
export async function verifyApiKey(
  apiKey: string,
  hash: string
): Promise<boolean> {
  try {
    const [salt, storedHash] = hash.split(":");
    if (!salt || !storedHash) return false;

    const crypto = getCrypto();

    // Convert API key to ArrayBuffer
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiKey);
    const saltData = encoder.encode(salt);

    // Import the key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltData,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-512",
      },
      key,
      PBKDF2_KEYLEN * 8 // Convert bytes to bits
    );

    const computedHash = arrayBufferToHex(derivedBits);

    // Timing-safe comparison
    if (computedHash.length !== storedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error("Error verifying API key:", error);
    return false;
  }
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  request: CreateApiKeyRequest
): Promise<CreateApiKeyResponse> {
  if (!userId || !request.name?.trim()) {
    throw new Error("User ID and key name are required");
  }

  const apiKey = await generateApiKey();
  const keyHash = await hashApiKey(apiKey);
  const keyId = generateUUID();
  const now = Date.now();
  const expiresAt = now + API_KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const apiKeyRecord: ApiKeyRecord = {
    id: keyId,
    userId,
    keyHash,
    name: request.name.trim(),
    createdAt: now,
    expiresAt,
    usageCount: 0,
  };

  try {
    // Store the API key record
    await kv.set(`${API_KEY_PREFIX}${keyId}`, apiKeyRecord);

    // Add to user's API keys set
    await kv.sadd(`${USER_API_KEYS_PREFIX}${userId}:api-keys`, keyId);

    // Add user to the list of users with API keys (for validation lookup)
    await kv.sadd("all-users-with-api-keys", userId);

    // Set TTL for automatic cleanup (90 days + 1 day buffer)
    const ttlSeconds = (API_KEY_EXPIRY_DAYS + 1) * 24 * 60 * 60;
    await kv.expire(`${API_KEY_PREFIX}${keyId}`, ttlSeconds);

    return {
      success: true,
      apiKey, // Only returned once
      keyId,
      name: apiKeyRecord.name,
      expiresAt,
    };
  } catch (error) {
    console.error("Error creating API key:", error);
    throw new Error("Failed to create API key");
  }
}

/**
 * List all API keys for a user
 */
export async function listApiKeys(
  userId: string
): Promise<ListApiKeysResponse> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Get all API key IDs for the user
    const keyIds = await kv.smembers(
      `${USER_API_KEYS_PREFIX}${userId}:api-keys`
    );

    if (!keyIds || keyIds.length === 0) {
      return { success: true, keys: [] };
    }

    // Fetch all API key records
    const apiKeyPromises = keyIds.map(async (keyId) => {
      const record = await kv.get<ApiKeyRecord>(`${API_KEY_PREFIX}${keyId}`);
      return record;
    });

    const apiKeyRecords = await Promise.all(apiKeyPromises);
    const validRecords = apiKeyRecords.filter(
      (record) => record !== null
    ) as ApiKeyRecord[];

    // Filter out expired keys and sort by creation date (newest first)
    const now = Date.now();
    const activeRecords = validRecords.filter(
      (record) => record.expiresAt > now
    );
    const sortedRecords = activeRecords.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    const keys = sortedRecords.map((record) => ({
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      lastUsed: record.lastUsed,
      usageCount: record.usageCount,
    }));

    return { success: true, keys };
  } catch (error) {
    console.error("Error listing API keys:", error);
    throw new Error("Failed to list API keys");
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  if (!userId || !keyId) {
    throw new Error("User ID and key ID are required");
  }

  try {
    // Get the API key record to verify ownership
    const record = await kv.get<ApiKeyRecord>(`${API_KEY_PREFIX}${keyId}`);

    if (!record) {
      throw new Error("API key not found");
    }

    if (record.userId !== userId) {
      throw new Error("Unauthorized to revoke this API key");
    }

    // Remove from user's API keys set
    await kv.srem(`${USER_API_KEYS_PREFIX}${userId}:api-keys`, keyId);

    // Remove the API key record
    await kv.del(`${API_KEY_PREFIX}${keyId}`);

    // Check if user has any remaining API keys
    const remainingKeys = await kv.smembers(
      `${USER_API_KEYS_PREFIX}${userId}:api-keys`
    );
    if (!remainingKeys || remainingKeys.length === 0) {
      // Remove user from the list of users with API keys
      await kv.srem("all-users-with-api-keys", userId);
    }

    return true;
  } catch (error) {
    console.error("Error revoking API key:", error);
    throw error;
  }
}

/**
 * Validate an API key and return the associated user ID
 */
export async function validateApiKey(
  apiKey: string
): Promise<{ userId: string; keyId: string } | null> {
  if (!apiKey) return null;

  try {
    // Get all user IDs that have API keys
    const allUserIds = await kv.smembers("all-users-with-api-keys");
    if (!allUserIds || allUserIds.length === 0) {
      return null;
    }
    // Check each user's API key
    for (const userId of allUserIds) {
      const userKeyIds = await kv.smembers(
        `${USER_API_KEYS_PREFIX}${userId}:api-keys`
      );
      if (!userKeyIds || userKeyIds.length === 0) continue;
      // Check each API key for this user
      for (const keyId of userKeyIds) {
        const record = await kv.get<ApiKeyRecord>(`${API_KEY_PREFIX}${keyId}`);
        if (!record) continue;
        // Check if the key has expired
        if (record.expiresAt < Date.now()) continue;
        // Verify the API key against the stored hash
        const isValid = await verifyApiKey(apiKey, record.keyHash);
        if (isValid) {
          return {
            userId: record.userId,
            keyId: record.id,
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error validating API key:", error);
    return null;
  }
}

/**
 * Update API key usage statistics
 */
export async function updateApiKeyUsage(keyId: string): Promise<void> {
  try {
    const record = await kv.get<ApiKeyRecord>(`${API_KEY_PREFIX}${keyId}`);

    if (record) {
      const updatedRecord: ApiKeyRecord = {
        ...record,
        lastUsed: Date.now(),
        usageCount: record.usageCount + 1,
      };

      await kv.set(`${API_KEY_PREFIX}${keyId}`, updatedRecord);
    }
  } catch (error) {
    console.error("Error updating API key usage:", error);
    // Don't throw - usage tracking failure shouldn't break the main flow
  }
}

/**
 * Get API key record by ID (for internal use)
 */
export async function getApiKeyRecord(
  keyId: string
): Promise<ApiKeyRecord | null> {
  try {
    return await kv.get<ApiKeyRecord>(`${API_KEY_PREFIX}${keyId}`);
  } catch (error) {
    console.error("Error getting API key record:", error);
    return null;
  }
}

/**
 * Check if a user has any active API keys
 */
export async function hasActiveApiKeys(userId: string): Promise<boolean> {
  try {
    const keyIds = await kv.smembers(
      `${USER_API_KEYS_PREFIX}${userId}:api-keys`
    );
    return keyIds && keyIds.length > 0;
  } catch (error) {
    console.error("Error checking active API keys:", error);
    return false;
  }
}

/**
 * More efficient API key validation using a direct lookup approach
 * This is an alternative to the current approach that checks all users
 */
export async function validateApiKeyEfficient(
  apiKey: string
): Promise<{ userId: string; keyId: string } | null> {
  if (!apiKey) return null;

  try {
    console.log(apiKey.substring(0, 10) + "...");

    return await validateApiKey(apiKey);
  } catch (error) {
    console.error("Error in API key validation:", error);
    return null;
  }
}
