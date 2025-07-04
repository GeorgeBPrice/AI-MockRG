import { NextRequest, NextResponse } from "next/server";
import {
  withApiKeyAuth,
  ApiKeyAuthContext,
} from "@/lib/middleware/api-key-auth";
import { generateMockData } from "@/lib/openai";
import { recordGeneration } from "@/lib/storage";
import { recordGenerationEvent, recordUserActivity } from "@/lib/events";
import { checkDailyLimit, incrementDailyUsage } from "@/lib/daily-rate-limit";
import { z } from "zod";

/**
 * Extract clean records from AI response
 * Removes explanatory text and markdown formatting
 */
function extractRecordsFromResponse(response: string, format: string): string {
  // For JSON format, look for JSON array between ```json and ```
  if (format === "json") {
    const jsonMatch = response.match(
      /```json\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/
    );
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // Fallback: try to find JSON array without markdown
    const jsonArrayMatch = response.match(/(\[[\s\S]*?\])/);
    if (jsonArrayMatch) {
      return jsonArrayMatch[1].trim();
    }
  }

  // For SQL format, look for SQL statements between ```sql and ```
  if (format === "sql") {
    const sqlMatch = response.match(/```sql\s*([\s\S]*?)\s*```/);
    if (sqlMatch) {
      return sqlMatch[1].trim();
    }

    // Fallback: try to find INSERT statements
    const insertMatch = response.match(/(INSERT[\s\S]*?;)/g);
    if (insertMatch) {
      return insertMatch.join("\n");
    }
  }

  // For CSV format, look for CSV data between ```csv and ```
  if (format === "csv") {
    const csvMatch = response.match(/```csv\s*([\s\S]*?)\s*```/);
    if (csvMatch) {
      return csvMatch[1].trim();
    }
  }

  // For XML format, look for XML data between ```xml and ```
  if (format === "xml") {
    const xmlMatch = response.match(/```xml\s*([\s\S]*?)\s*```/);
    if (xmlMatch) {
      return xmlMatch[1].trim();
    }
  }

  // For HTML format, look for HTML data between ```html and ```
  if (format === "html") {
    const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }
  }

  // For txt format, look for data between ```txt and ```
  if (format === "txt") {
    const txtMatch = response.match(/```txt\s*([\s\S]*?)\s*```/);
    if (txtMatch) {
      return txtMatch[1].trim();
    }
  }

  // If no markdown blocks found, return the response as-is
  // This handles cases where the AI returns clean data without formatting
  return response.trim();
}

// Validation schema for external API requests
const externalGenerateSchema = z.object({
  schema: z.string().min(1, "Schema is required"),
  schemaType: z.enum(["sql", "nosql"]).default("sql"),
  count: z.number().int().min(1).max(100).default(10),
  format: z.enum(["json", "csv", "sql", "xml", "html", "txt"]).default("json"),
  examples: z.string().optional(),
  additionalInstructions: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(100).max(100000).optional(),
});

export interface ExternalGenerateRequest {
  schema: string;
  schemaType: "sql" | "nosql";
  count: number;
  format: "json" | "csv" | "sql" | "xml" | "html" | "txt";
  examples?: string;
  additionalInstructions?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ExternalGenerateResponse {
  success: boolean;
  result?: string;
  error?: string;
  usage: {
    limit: number;
    remaining: number;
    resetTimestamp: number;
  };
}

/**
 * External API endpoint for generating mock data
 * Requires API key authentication via Bearer token
 */
async function handleGenerateRequest(
  request: NextRequest,
  authContext: ApiKeyAuthContext
): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = externalGenerateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      schema,
      schemaType,
      count,
      format,
      examples,
      additionalInstructions,
      temperature = 0.7,
      maxTokens = 4000,
    } = validation.data;

    // Check daily rate limit for the user
    const dailyLimitResult = await checkDailyLimit({
      identifier: authContext.userId,
      usesOwnApiKey: false, // API key users use the same limits as regular users
    });

    if (!dailyLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily rate limit exceeded. You have used all ${dailyLimitResult.limit} of your free generations for today.`,
          usage: {
            limit: dailyLimitResult.limit,
            remaining: dailyLimitResult.remaining,
            resetTimestamp: dailyLimitResult.resetTimestamp,
          },
        },
        { status: 429 }
      );
    }

    // validate openai api key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Generate mock data using the existing logic
    const result = await generateMockData({
      schema,
      schemaType,
      count,
      format,
      examples,
      additionalInstructions,
      apiKey: openaiApiKey || "",
      model: process.env.OPENAI_API_DEFAULT_MODEL || "gpt-4o-mini",
      baseUrl: process.env.OPENAI_API_BASE_URL,
      temperature,
      maxTokens,
      headers: {},
    });

    // Increment usage counter after successful generation
    await incrementDailyUsage(authContext.userId);

    // Record the generation event
    try {
      await recordGenerationEvent({
        userId: authContext.userId,
        schemaId: "",
        schemaName: "External API Generation",
        recordsCount: count,
        format,
        success: true,
        errorMessage: "",
      });

      await recordUserActivity({
        userId: authContext.userId,
        action: "generate",
        details: `External API: Generated ${count} ${schemaType} records in ${format} format`,
      });

      // Save generation to user's history
      await recordGeneration(authContext.userId, {
        schemaId: "",
        schemaName: "External API Generation",
        schemaType,
        recordsCount: count,
        format,
        success: true,
        errorMessage: "",
      });
    } catch (recordError) {
      console.error("Failed to record generation event:", recordError);
      // Don't fail the request if recording fails
    }

    // Extract clean records from the AI response
    const cleanResult = extractRecordsFromResponse(result, format);

    // Return success response with updated usage info
    const updatedUsage = await checkDailyLimit({
      identifier: authContext.userId,
      usesOwnApiKey: false,
    });

    return NextResponse.json({
      success: true,
      result: cleanResult,
      usage: {
        limit: updatedUsage.limit,
        remaining: updatedUsage.remaining,
        resetTimestamp: updatedUsage.resetTimestamp,
      },
    });
  } catch (error) {
    console.error("Error in external generate endpoint:", error);

    // Try to get current usage info for error response
    let usageInfo = {
      limit: 5,
      remaining: 0,
      resetTimestamp: Math.floor(Date.now() / 1000) + 86400,
    };

    try {
      const currentUsage = await checkDailyLimit({
        identifier: authContext.userId,
        usesOwnApiKey: false,
      });
      usageInfo = {
        limit: currentUsage.limit,
        remaining: currentUsage.remaining,
        resetTimestamp: currentUsage.resetTimestamp,
      };
    } catch (usageError) {
      console.error("Failed to get usage info:", usageError);
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate mock data: ${(error as Error).message}`,
        usage: usageInfo,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/generate - External API endpoint for generating mock data
 * Requires API key authentication
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return withApiKeyAuth(request, handleGenerateRequest);
}
