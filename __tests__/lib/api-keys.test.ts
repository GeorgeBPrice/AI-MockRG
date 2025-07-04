/**
 * @jest-environment node
 */

import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  validateApiKey,
  updateApiKeyUsage,
  hasActiveApiKeys,
  type CreateApiKeyRequest,
} from "@/lib/api-keys";
import * as kvAdapter from "@/lib/kv-adapter";

// Mock the KV adapter
jest.mock("@/lib/kv-adapter", () => ({
  kv: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    hset: jest.fn(),
    expire: jest.fn(),
    multi: jest.fn(() => ({
      exec: jest.fn(),
      hset: jest.fn(),
      hdel: jest.fn(),
    })),
  },
}));

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn((encoding) => {
      if (encoding === "base64url") return "mock-api-key-base64url";
      if (encoding === "hex") return "mock-salt-hex";
      return "mock-bytes";
    }),
  })),
  pbkdf2Sync: jest.fn(() => ({
    toString: jest.fn(() => "mock-hash-hex"),
  })),
  timingSafeEqual: jest.fn(() => true),
  randomUUID: jest.fn(() => "mock-uuid-123"),
}));

describe("API Key Management", () => {
  const mockKv = kvAdapter.kv as jest.Mocked<typeof kvAdapter.kv>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockKv.set.mockResolvedValue(null);
    mockKv.sadd.mockResolvedValue(1);
    mockKv.expire.mockResolvedValue("OK" as never);
    mockKv.get.mockResolvedValue(null);
    mockKv.del.mockResolvedValue(1);
    mockKv.srem.mockResolvedValue(1);
    mockKv.smembers.mockResolvedValue([]);
    mockKv.hset.mockResolvedValue(1);
  });

  describe("generateApiKey", () => {
    it("should generate a cryptographically secure API key", async () => {
      const apiKey = await generateApiKey();
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe("string");
      expect(apiKey).toMatch(/^[A-Za-z0-9_-]+$/); // Base64url pattern
    });
  });

  describe("hashApiKey", () => {
    it("should hash an API key using PBKDF2", async () => {
      const apiKey = "test-api-key";
      const hash = await hashApiKey(apiKey);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).toContain(":");
    });
  });

  describe("verifyApiKey", () => {
    it("should verify a valid API key against its hash", async () => {
      const apiKey = "test-api-key";
      const hash = "testsalt123:testhash456";
      const result = await verifyApiKey(apiKey, hash);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("createApiKey", () => {
    it("should create a new API key with proper storage", async () => {
      const userId = "user123";
      const request: CreateApiKeyRequest = { name: "Test API Key" };

      const result = await createApiKey(userId, request);

      expect(result.success).toBe(true);
      expect(result.apiKey).toBeDefined();
      expect(result.keyId).toBeDefined();
      expect(result.name).toBe("Test API Key");
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should reject requests without user ID", async () => {
      const request: CreateApiKeyRequest = { name: "Test API Key" };

      await expect(createApiKey("", request)).rejects.toThrow(
        "User ID and key name are required"
      );
    });

    it("should reject requests without key name", async () => {
      const userId = "user123";
      const request: CreateApiKeyRequest = { name: "" };

      await expect(createApiKey(userId, request)).rejects.toThrow(
        "User ID and key name are required"
      );
    });

    it("should handle storage errors gracefully", async () => {
      const userId = "user123";
      const request: CreateApiKeyRequest = { name: "Test API Key" };

      mockKv.set.mockRejectedValue(new Error("Storage error"));

      await expect(createApiKey(userId, request)).rejects.toThrow(
        "Failed to create API key"
      );
    });

    it("should set proper expiration time", async () => {
      const userId = "user123";
      const request: CreateApiKeyRequest = { name: "Test API Key" };

      const result = await createApiKey(userId, request);

      const expectedExpiry = Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 days
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(result.expiresAt).toBeLessThanOrEqual(expectedExpiry);
    });
  });

  describe("listApiKeys", () => {
    it("should return empty array when user has no API keys", async () => {
      const userId = "user123";

      const result = await listApiKeys(userId);

      expect(result.success).toBe(true);
      expect(result.keys).toHaveLength(0);
    });

    it("should list API keys when user has them", async () => {
      const userId = "user123";
      const mockKeyIds = ["key1", "key2"];
      const mockRecord = {
        id: "key1",
        userId: "user123",
        keyHash: "hash1",
        name: "Key 1",
        createdAt: 1000000000000,
        expiresAt: 1000000000000 + 90 * 24 * 60 * 60 * 1000,
        usageCount: 5,
      };

      mockKv.smembers.mockResolvedValue(mockKeyIds as never);
      mockKv.get.mockResolvedValue(mockRecord);

      const result = await listApiKeys(userId);

      expect(result.success).toBe(true);
      expect(mockKv.smembers).toHaveBeenCalledWith("user:user123:api-keys");
    });

    it("should handle storage errors gracefully", async () => {
      const userId = "user123";

      mockKv.smembers.mockRejectedValue(new Error("Storage error"));

      await expect(listApiKeys(userId)).rejects.toThrow(
        "Failed to list API keys"
      );
    });

    it("should filter out expired keys", async () => {
      const userId = "user123";
      const mockKeyIds = ["key1", "key2", "key3"];
      const mockRecord1 = {
        id: "key1",
        userId: "user123",
        keyHash: "hash1",
        name: "Valid Key",
        createdAt: 1000000000000,
        expiresAt: Date.now() + 86400000, // Valid
        usageCount: 5,
      };
      const mockRecord2 = {
        id: "key2",
        userId: "user123",
        keyHash: "hash2",
        name: "Expired Key",
        createdAt: 1000000000000,
        expiresAt: Date.now() - 86400000, // Expired
        usageCount: 3,
      };
      const mockRecord3 = {
        id: "key3",
        userId: "user123",
        keyHash: "hash3",
        name: "Another Valid Key",
        createdAt: 1000000000000,
        expiresAt: Date.now() + 86400000, // Valid
        usageCount: 7,
      };

      mockKv.smembers.mockResolvedValue(mockKeyIds as never);
      mockKv.get
        .mockResolvedValueOnce(mockRecord1)
        .mockResolvedValueOnce(mockRecord2)
        .mockResolvedValueOnce(mockRecord3);

      const result = await listApiKeys(userId);

      expect(result.success).toBe(true);
      expect(result.keys).toHaveLength(2); // Only valid keys
      expect(result.keys.map((k) => k.name)).toEqual([
        "Valid Key",
        "Another Valid Key",
      ]);
    });
  });

  describe("revokeApiKey", () => {
    it("should revoke an API key successfully", async () => {
      const userId = "user123";
      const keyId = "key1";

      mockKv.get.mockResolvedValue({
        id: "key1",
        userId: "user123",
        keyHash: "hash1",
        name: "Test Key",
        createdAt: 1000000000000,
        expiresAt: 1000000000000 + 90 * 24 * 60 * 60 * 1000,
        usageCount: 5,
      });

      const result = await revokeApiKey(userId, keyId);

      expect(result).toBe(true);
      expect(mockKv.srem).toHaveBeenCalledWith("user:user123:api-keys", keyId);
    });

    it("should reject revocation of non-existent key", async () => {
      const userId = "user123";
      const keyId = "nonexistent";

      mockKv.get.mockResolvedValue(null);

      await expect(revokeApiKey(userId, keyId)).rejects.toThrow(
        "API key not found"
      );
    });
  });

  describe("validateApiKey", () => {
    it("should return null for invalid API keys", async () => {
      const apiKey = "invalid-api-key";

      const result = await validateApiKey(apiKey);

      expect(result).toBeNull();
    });

    it("should return null for expired API keys", async () => {
      const apiKey = "valid-api-key";
      const mockRecord = {
        id: "key1",
        userId: "user123",
        keyHash: "mock-salt-hex:mock-hash-hex",
        name: "Test Key",
        createdAt: 1000000000000,
        expiresAt: Date.now() - 86400000, // Expired 1 day ago
        usageCount: 5,
      };

      mockKv.get.mockResolvedValue(mockRecord);

      const result = await validateApiKey(apiKey);

      expect(result).toBeNull();
    });

    it("should handle storage errors gracefully", async () => {
      const apiKey = "valid-api-key";

      mockKv.get.mockRejectedValue(new Error("Storage error"));

      const result = await validateApiKey(apiKey);

      expect(result).toBeNull();
    });
  });

  describe("updateApiKeyUsage", () => {
    it("should handle missing records gracefully", async () => {
      const keyId = "nonexistent";

      mockKv.get.mockResolvedValue(null);

      // Should not throw
      await expect(updateApiKeyUsage(keyId)).resolves.toBeUndefined();
    });

    it("should update usage count for existing keys", async () => {
      const keyId = "key1";
      const mockRecord = {
        id: "key1",
        userId: "user123",
        keyHash: "hash1",
        name: "Test Key",
        createdAt: 1000000000000,
        expiresAt: Date.now() + 86400000,
        usageCount: 5,
      };

      mockKv.get.mockResolvedValue(mockRecord);
      mockKv.set.mockResolvedValue(null);

      await updateApiKeyUsage(keyId);

      expect(mockKv.set).toHaveBeenCalledWith(
        `api-key:${keyId}`,
        expect.objectContaining({
          lastUsed: expect.any(Number),
          usageCount: 6,
        })
      );
    });

    it("should handle storage errors gracefully", async () => {
      const keyId = "key1";

      mockKv.get.mockRejectedValue(new Error("Storage error"));

      // Should not throw
      await expect(updateApiKeyUsage(keyId)).resolves.toBeUndefined();
    });
  });

  describe("hasActiveApiKeys", () => {
    it("should return false when user has no API keys", async () => {
      const userId = "user123";

      const result = await hasActiveApiKeys(userId);

      expect(result).toBe(false);
    });

    it("should return true when user has active API keys", async () => {
      const userId = "user123";

      mockKv.smembers.mockResolvedValue(["key1", "key2"] as never);

      const result = await hasActiveApiKeys(userId);

      expect(result).toBe(true);
      expect(mockKv.smembers).toHaveBeenCalledWith("user:user123:api-keys");
    });
  });
});
