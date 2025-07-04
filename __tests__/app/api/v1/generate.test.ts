/**
 * @jest-environment node
 */

import { POST } from "@/app/api/v1/generate/route";
import * as apiKeyAuth from "@/lib/middleware/api-key-auth";
import * as dailyRateLimit from "@/lib/daily-rate-limit";
import * as openai from "@/lib/openai";
import * as events from "@/lib/events";
import * as storage from "@/lib/storage";

// Mock NextRequest and NextResponse
const mockJson = jest.fn();
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((body) => ({
    json: () => Promise.resolve(body || {}),
    headers: new Map(),
  })),
  NextResponse: {
    json: (...args: unknown[]) => {
      mockJson(...args);
      return {
        status: mockJson.mock.calls[mockJson.mock.calls.length - 1][1]?.status || 200,
        json: () => mockJson.mock.calls[mockJson.mock.calls.length - 1][0],
      };
    },
  },
}));

// Mock dependencies
jest.mock("@/lib/middleware/api-key-auth", () => ({
  withApiKeyAuth: jest.fn(),
}));

jest.mock("@/lib/daily-rate-limit", () => ({
  checkDailyLimit: jest.fn(),
  incrementDailyUsage: jest.fn(),
}));

jest.mock("@/lib/openai", () => ({
  generateMockData: jest.fn(),
}));

jest.mock("@/lib/events", () => ({
  recordGenerationEvent: jest.fn(),
  recordUserActivity: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  recordGeneration: jest.fn(),
}));

describe("External API Generate Endpoint", () => {
  const mockAuthContext = {
    userId: "user123",
    keyId: "key456",
    isApiKeyAuth: true,
  };

  const createRequest = (body = {}) => {
    const defaultBody = {
      schema: "CREATE TABLE users (id INT, name TEXT, email TEXT)",
      schemaType: "sql",
      count: 10,
      format: "json",
    };

    return new (jest.requireMock("next/server").NextRequest)({
      ...defaultBody,
      ...body,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (apiKeyAuth.withApiKeyAuth as jest.Mock).mockImplementation(async (request, handler) => {
      return handler(request, mockAuthContext);
    });

    (openai.generateMockData as jest.Mock).mockResolvedValue(
      JSON.stringify([{ id: 1, name: "Test User", email: "test@example.com" }])
    );

    (dailyRateLimit.checkDailyLimit as jest.Mock).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      resetTimestamp: Math.floor(Date.now() / 1000) + 86400,
    });

    (dailyRateLimit.incrementDailyUsage as jest.Mock).mockResolvedValue(undefined);

    (events.recordGenerationEvent as jest.Mock).mockResolvedValue({});
    (events.recordUserActivity as jest.Mock).mockResolvedValue({});
    (storage.recordGeneration as jest.Mock).mockResolvedValue({});

    // Set environment variables
    process.env.OPENAI_API_KEY = "mock-api-key";
    process.env.OPENAI_API_DEFAULT_MODEL = "gpt-4o-mini";

    // Reset mock calls
    mockJson.mockReset();
  });

  it("should generate mock data with valid API key and request", async () => {
    const request = createRequest();
    const response = await POST(request);

    expect(response.status).toBe(200);
    const responseData = await response.json();

    expect(responseData.success).toBe(true);
    expect(responseData.result).toBeDefined();
    expect(responseData.usage).toBeDefined();
    expect(responseData.usage.limit).toBe(20);
    expect(responseData.usage.remaining).toBe(19);

    // Verify the generation was called
    expect(openai.generateMockData).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: "CREATE TABLE users (id INT, name TEXT, email TEXT)",
        schemaType: "sql",
        count: 10,
        format: "json",
      })
    );

    // Verify usage was incremented
    expect(dailyRateLimit.incrementDailyUsage).toHaveBeenCalledWith("user123");

    // Verify events were recorded
    expect(events.recordGenerationEvent).toHaveBeenCalled();
    expect(events.recordUserActivity).toHaveBeenCalled();
    expect(storage.recordGeneration).toHaveBeenCalled();
  });

  it("should return 429 when daily rate limit is exceeded", async () => {
    (dailyRateLimit.checkDailyLimit as jest.Mock).mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      resetTimestamp: Math.floor(Date.now() / 1000) + 86400,
    });

    const request = createRequest();
    const response = await POST(request);

    expect(response.status).toBe(429);
    const responseData = await response.json();

    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain("Daily rate limit exceeded");
    expect(responseData.usage.limit).toBe(20);
    expect(responseData.usage.remaining).toBe(0);

    // Verify generation was NOT called
    expect(openai.generateMockData).not.toHaveBeenCalled();
  });

  it("should validate request schema and return 400 for invalid data", async () => {
    const request = createRequest({
      schema: "", // Invalid: empty schema
      count: 150, // Invalid: exceeds max
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();

    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("Invalid request data");
    expect(responseData.details).toBeDefined();

    // Verify generation was NOT called
    expect(openai.generateMockData).not.toHaveBeenCalled();
  });

  it("should handle different schema types", async () => {
    const request = createRequest({
      schema: '{"type": "object", "properties": {"name": {"type": "string"}}}',
      schemaType: "nosql",
      format: "csv",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const responseData = await response.json();

    expect(responseData.success).toBe(true);

    // Verify the generation was called with correct parameters
    expect(openai.generateMockData).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaType: "nosql",
        format: "csv",
      })
    );
  });

  it("should handle optional parameters", async () => {
    const request = createRequest({
      examples: "Example data",
      additionalInstructions: "Make it realistic",
      temperature: 0.8,
      maxTokens: 2000,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const responseData = await response.json();

    expect(responseData.success).toBe(true);

    // Verify the generation was called with optional parameters
    expect(openai.generateMockData).toHaveBeenCalledWith(
      expect.objectContaining({
        examples: "Example data",
        additionalInstructions: "Make it realistic",
        temperature: 0.8,
        maxTokens: 2000,
      })
    );
  });

  it("should handle generation errors gracefully", async () => {
    (openai.generateMockData as jest.Mock).mockRejectedValue(
      new Error("AI service unavailable")
    );

    const request = createRequest();
    const response = await POST(request);

    expect(response.status).toBe(500);
    const responseData = await response.json();

    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain("Failed to generate mock data");
    expect(responseData.usage).toBeDefined();
  });

  it("should handle event recording failures without breaking the request", async () => {
    (events.recordGenerationEvent as jest.Mock).mockRejectedValue(
      new Error("Event recording failed")
    );

    const request = createRequest();
    const response = await POST(request);

    // Should still succeed even if event recording fails
    expect(response.status).toBe(200);
    const responseData = await response.json();

    expect(responseData.success).toBe(true);
    expect(responseData.result).toBeDefined();
  });

  it("should return proper usage information in success response", async () => {
    const request = createRequest();
    const response = await POST(request);

    expect(response.status).toBe(200);
    const responseData = await response.json();

    expect(responseData.usage).toEqual({
      limit: 20,
      remaining: 19,
      resetTimestamp: expect.any(Number),
    });
  });

  it("should return proper usage information in error response", async () => {
    (openai.generateMockData as jest.Mock).mockRejectedValue(
      new Error("Generation failed")
    );

    const request = createRequest();
    const response = await POST(request);

    expect(response.status).toBe(500);
    const responseData = await response.json();

    expect(responseData.usage).toEqual({
      limit: 20,
      remaining: 19,
      resetTimestamp: expect.any(Number),
    });
  });

  it("should use default values for optional parameters", async () => {
    const request = createRequest({
      schema: "CREATE TABLE users (id INT, name TEXT)",
      // Omit optional parameters to test defaults
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify default values were used
    expect(openai.generateMockData).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaType: "sql",
        format: "json",
        temperature: 0.7,
        maxTokens: 4000,
      })
    );
  });
}); 