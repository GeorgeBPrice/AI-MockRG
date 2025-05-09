import { POST } from "@/app/api/generate/route";
import * as dailyRateLimit from "@/lib/daily-rate-limit";
import * as nextAuth from "next-auth/next";
import * as openai from "@/lib/openai";

// Mock NextRequest and NextResponse
const mockJson = jest.fn();
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((body) => ({
    json: () => Promise.resolve(body || {}),
  })),
  NextResponse: {
    json: (...args) => {
      mockJson(...args);
      return {
        status:
          mockJson.mock.calls[mockJson.mock.calls.length - 1][1]?.status || 200,
        json: () => mockJson.mock.calls[mockJson.mock.calls.length - 1][0],
      };
    },
  },
}));

// Mock dependencies
jest.mock("@/lib/daily-rate-limit", () => ({
  checkDailyLimit: jest.fn(),
  incrementDailyUsage: jest.fn(),
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/openai", () => ({
  generateMockData: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  recordGeneration: jest.fn(),
}));

jest.mock("@/lib/events", () => ({
  recordGenerationEvent: jest.fn(),
  recordUserActivity: jest.fn(),
}));

describe("Generate API Route", () => {
  /**
   * Common request setup used for testing the API route.
   * This function creates a mock request with a default body that simulates a typical schema generation request.
   *
   * SQL is used here as the `schemaType` to test the functionality of generating mock data based on SQL schema definitions.
   * SQL schemas define structured data in table format, which is common in relational databases.
   * This setup helps ensure that the API can correctly parse SQL schemas and produce the corresponding mock data.
   */
  const createRequest = (body = {}) => {
    const defaultBody = {
      schema: "CREATE TABLE users (id INT, name TEXT, email TEXT)",
      schemaType: "sql",
      count: 10,
      format: "json",
      examples: "",
      additionalInstructions: "",
      useUserSettings: false,
    };

    return new (jest.requireMock("next/server").NextRequest)({
      ...defaultBody,
      ...body,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (nextAuth.getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    });

    (openai.generateMockData as jest.Mock).mockResolvedValue([
      { id: 1, name: "Test User", email: "test@example.com" },
    ]);

    (dailyRateLimit.checkDailyLimit as jest.Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      resetTimestamp: 1715980800,
    });

    // Set environment variables
    process.env.OPENAI_API_KEY = "mock-api-key";
    process.env.OPENAI_API_DEFAULT_MODEL = "gpt-3.5-turbo";

    // Reset mock calls
    mockJson.mockReset();
  });

  it("should return 403 Forbidden when user has no generations left", async () => {
    // Mock that user has reached their limit
    (dailyRateLimit.checkDailyLimit as jest.Mock).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      resetTimestamp: 1715980800,
    });

    const request = createRequest();
    const response = await POST(request);

    // Verify response
    expect(response.status).toBe(403);
    const responseData = await response.json();

    expect(responseData).toHaveProperty("error");
    expect(responseData.error).toContain("rate limit");
    expect(responseData).toHaveProperty("limit", 5);
    expect(responseData).toHaveProperty("remaining", 0);
    expect(responseData).toHaveProperty("resetTimestamp", 1715980800);

    // Verify the generate function was NOT called, like for example the 5 free generations are used up
    expect(openai.generateMockData).not.toHaveBeenCalled();
  });

  it("should bypass rate limits for users with their own API key", async () => {
    // Setup request with custom API key
    const request = createRequest({
      overrideApiKey: "custom-api-key",
      useUserSettings: true,
    });

    await POST(request);

    // Verify the daily limit check was called with usesOwnApiKey=true
    expect(dailyRateLimit.checkDailyLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        usesOwnApiKey: true,
      })
    );

    // Verify the API was called with the custom key
    expect(openai.generateMockData).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "custom-api-key",
      })
    );
  });

  it("should increment usage after successful generation", async () => {
    const request = createRequest();
    await POST(request);

    // Verify the rate limit was incremented with the user's email
    expect(dailyRateLimit.incrementDailyUsage).toHaveBeenCalledWith(
      "test@example.com"
    );
  });
});
