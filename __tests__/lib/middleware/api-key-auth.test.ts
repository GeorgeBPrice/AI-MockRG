/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import {
  validateApiKeyAuth,
  withApiKeyAuth,
  isApiKeyRequest,
  getUserIdFromRequest,
} from "@/lib/middleware/api-key-auth";
import * as apiKeys from "@/lib/api-keys";

// Mock the API keys module
jest.mock("@/lib/api-keys", () => ({
  validateApiKey: jest.fn(),
  updateApiKeyUsage: jest.fn().mockResolvedValue(undefined),
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextRequest: jest.requireActual("next/server").NextRequest,
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: jest.fn(() => Promise.resolve(data)),
      headers: init?.headers || {},
    })),
  },
}));

// Create a proper NextRequest mock
const createMockNextRequest = (url: string, headers: Record<string, string> = {}) => {
  const mockRequest = {
    url,
    headers: {
      get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
      has: jest.fn((name: string) => name.toLowerCase() in headers),
    },
  } as unknown as NextRequest;
  
  return mockRequest;
};

describe("API Key Authentication Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateApiKeyAuth", () => {
    it("should return null when no authorization header is present", async () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate");

      const result = await validateApiKeyAuth(request);

      expect(result).toBeNull();
      expect(apiKeys.validateApiKey).not.toHaveBeenCalled();
    });

    it("should return null when authorization header is not Bearer format", async () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Basic dXNlcjpwYXNz",
      });

      const result = await validateApiKeyAuth(request);

      expect(result).toBeNull();
      expect(apiKeys.validateApiKey).not.toHaveBeenCalled();
    });

    it("should validate API key and return auth context when valid", async () => {
      const mockValidation = {
        userId: "user123",
        keyId: "key456",
      };

      (apiKeys.validateApiKey as jest.Mock).mockResolvedValue(mockValidation);

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer valid-api-key-here",
      });

      const result = await validateApiKeyAuth(request);

      expect(result).toEqual({
        userId: "user123",
        keyId: "key456",
        isApiKeyAuth: true,
      });

      expect(apiKeys.validateApiKey).toHaveBeenCalledWith("valid-api-key-here");
      expect(apiKeys.updateApiKeyUsage).toHaveBeenCalledWith("key456");
    });

    it("should return null when API key validation fails", async () => {
      (apiKeys.validateApiKey as jest.Mock).mockResolvedValue(null);

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer invalid-api-key",
      });

      const result = await validateApiKeyAuth(request);

      expect(result).toBeNull();
      expect(apiKeys.validateApiKey).toHaveBeenCalledWith("invalid-api-key");
      expect(apiKeys.updateApiKeyUsage).not.toHaveBeenCalled();
    });

    it("should handle validation errors gracefully", async () => {
      (apiKeys.validateApiKey as jest.Mock).mockRejectedValue(
        new Error("Validation error")
      );

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer api-key-with-error",
      });

      const result = await validateApiKeyAuth(request);

      expect(result).toBeNull();
    });
  });

  describe("withApiKeyAuth", () => {
    it("should call handler when API key is valid", async () => {
      const mockValidation = {
        userId: "user123",
        keyId: "key456",
      };

      (apiKeys.validateApiKey as jest.Mock).mockResolvedValue(mockValidation);

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer valid-api-key",
      });

      const mockResponse = { status: 200, json: jest.fn() };
      const mockHandler = jest.fn().mockResolvedValue(mockResponse);

      const result = await withApiKeyAuth(request, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(request, {
        userId: "user123",
        keyId: "key456",
        isApiKeyAuth: true,
      });

      expect(result.status).toBe(200);
    });

    it("should return 401 when API key is invalid", async () => {
      (apiKeys.validateApiKey as jest.Mock).mockResolvedValue(null);

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer invalid-api-key",
      });

      const mockHandler = jest.fn();

      const result = await withApiKeyAuth(request, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);

      const responseData = await result.json();
      expect(responseData.error).toBe("Invalid or missing API key");
      expect(responseData.message).toBe(
        "Please provide a valid API key in the Authorization header"
      );
    });

    it("should return 401 when no authorization header is present", async () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate");

      const mockHandler = jest.fn();

      const result = await withApiKeyAuth(request, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
    });
  });

  describe("isApiKeyRequest", () => {
    it("should return true for requests with Bearer authorization", () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer api-key-here",
      });

      const result = isApiKeyRequest(request);

      expect(result).toBe(true);
    });

    it("should return false for requests without authorization header", () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate");

      const result = isApiKeyRequest(request);

      expect(result).toBe(false);
    });

    it("should return false for requests with non-Bearer authorization", () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Basic dXNlcjpwYXNz",
      });

      const result = isApiKeyRequest(request);

      expect(result).toBe(false);
    });
  });

  describe("getUserIdFromRequest", () => {
    it("should return user ID from API key when valid", async () => {
      const mockValidation = {
        userId: "user123",
        keyId: "key456",
      };

      (apiKeys.validateApiKey as jest.Mock).mockResolvedValue(mockValidation);

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer valid-api-key",
      });

      const result = await getUserIdFromRequest(request);

      expect(result).toBe("user123");
    });

    it("should return null when API key is invalid", async () => {
      (apiKeys.validateApiKey as jest.Mock).mockResolvedValue(null);

      const request = createMockNextRequest("http://localhost:3000/api/v1/generate", {
        authorization: "Bearer invalid-api-key",
      });

      const result = await getUserIdFromRequest(request);

      expect(result).toBe(null);
    });

    it("should return null when no authorization header is present", async () => {
      const request = createMockNextRequest("http://localhost:3000/api/v1/generate");

      const result = await getUserIdFromRequest(request);

      expect(result).toBe(null);
    });
  });
}); 