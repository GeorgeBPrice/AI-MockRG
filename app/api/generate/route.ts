import { NextRequest, NextResponse } from "next/server";
import { generateMockData } from "@/lib/openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { recordGeneration } from "@/lib/storage";
import { recordGenerationEvent, recordUserActivity } from "@/lib/events";
import { checkDailyLimit, incrementDailyUsage } from "@/lib/daily-rate-limit";
import {
  checkUserInput,
  isOffTopicSentinel,
} from "@/lib/prompt-security";
import {
  acquireSlot,
  releaseSlot,
  MAX_INFLIGHT_PER_IDENTITY,
} from "@/lib/concurrency-limit";
import { z } from "zod";

const internalGenerateSchema = z.object({
  schema: z.string().min(1, "Schema is required").max(8192),
  schemaType: z.enum(["sql", "nosql"]).optional(),
  count: z.union([z.number(), z.string()]).optional(),
  format: z.string().max(32).optional(),
  examples: z.string().max(4096).optional(),
  additionalInstructions: z.string().max(1024).optional(),
  overrideModel: z.string().max(128).optional(),
  overrideApiKey: z.string().max(512).optional(),
  overrideBaseUrl: z.string().url().max(512).optional(),
  overrideTemperature: z.number().min(0).max(2).optional(),
  overrideMaxTokens: z.number().int().min(1).max(8000).optional(),
  overrideHeaders: z.record(z.string(), z.string()).optional(),
  useUserSettings: z.boolean().optional(),
  schemaId: z.string().optional(),
});

/**
 * API route handler for generating mock data
 * Accepts schema definitions and configuration options to generate realistic mock data
 * Supports both SQL and NoSQL schema formats, or any text sample data
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Parse and validate request body
    const rawBody = await request.json();
    const parsed = internalGenerateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const {
      schema,
      schemaType,
      count,
      format,
      examples,
      additionalInstructions,
      overrideModel,
      overrideApiKey,
      overrideBaseUrl,
      overrideTemperature,
      overrideMaxTokens,
      overrideHeaders,
      useUserSettings,
    } = body;

    const hasOwnKey = !!overrideApiKey;

    // additionalInstructions is BYO-key only. Free-tier / server-key callers
    // can't smuggle freeform instructions to the model.
    if (!hasOwnKey && additionalInstructions && additionalInstructions.trim()) {
      return NextResponse.json(
        {
          error: "additionalInstructions is only available when using your own API key. Provide overrideApiKey, or remove additionalInstructions from the request.",
          field: "additionalInstructions",
          reason: "byo_key_required",
        },
        { status: 400 }
      );
    }

    // SSRF guard: a caller-chosen baseUrl or headers may only be paired with a
    // caller-supplied API key. Otherwise the server would forward its own
    // OPENAI_API_KEY to an attacker-controlled endpoint.
    if ((overrideBaseUrl || (overrideHeaders && Object.keys(overrideHeaders).length > 0)) && !hasOwnKey) {
      return NextResponse.json(
        { error: "overrideBaseUrl and overrideHeaders require a user-supplied overrideApiKey." },
        { status: 400 }
      );
    }

    // Pre-flight intent check on free-text fields (P1-3). Schema is left
    // permissive on purpose — informal "name, age, dob, address" is valid.
    const intent = checkUserInput({ schema, examples, additionalInstructions });
    if (!intent.ok) {
      return NextResponse.json(
        {
          error: `Request rejected: ${intent.field} contains ${intent.reason === "jailbreak_phrase" ? "a phrase that looks like a prompt-injection attempt" : "an off-topic request"}. This service only generates synthetic mock records.`,
          field: intent.field,
          reason: intent.reason,
        },
        { status: 400 }
      );
    }

    // Per-IP bucket for anonymous callers so a single shared 'anonymous' identifier
    // can't be drained by the whole internet. Falls back to 'anonymous' only if no
    // forwarding header is present (e.g. local dev).
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const userId = session?.user?.id || `anon:${clientIp}`;
    const userEmail = session?.user?.email || `anon:${clientIp}`;
    const schemaName = session?.user ? undefined : 'Anonymous Generation';

    // Resolve effective AI settings: caller overrides win, otherwise env defaults.
    const finalApiKey = overrideApiKey || process.env.OPENAI_API_KEY;
    const finalModel = overrideModel || process.env.OPENAI_API_DEFAULT_MODEL || "gpt-4o-mini";
    const finalBaseUrl = overrideBaseUrl || process.env.OPENAI_API_BASE_URL;
    const finalTemperature = overrideTemperature ?? 0.7;
    // P2-4: tighter default for the common no-instructions case. BYO-key
    // callers can opt-in to higher via overrideMaxTokens (capped at 8000 by zod).
    const hasInstructions = !!(additionalInstructions && additionalInstructions.trim());
    const defaultMaxTokens = hasInstructions ? 4000 : 2000;
    const finalMaxTokens = overrideMaxTokens ?? defaultMaxTokens;
    const finalHeaders = overrideHeaders || {};

    if (!finalApiKey) {
      console.error("API Key Configuration Error: No key found in request body, user settings, or environment variables.");
      return NextResponse.json(
        { error: "AI API key is not configured." },
        { status: 500 }
      );
    }
    
    // Normalize input parameters
    const effectiveSchemaType: "sql" | "nosql" =
      schemaType === "nosql" ? "nosql" : "sql";
    const effectiveFormat = format || "json";

    // Validate record count (between 1-100)
    const recordCount =
      typeof count === "number"
        ? count
        : parseInt(typeof count === "string" ? count : "", 10) || 10;
    if (isNaN(recordCount) || recordCount < 1 || recordCount > 100) {
      return NextResponse.json({ error: "Record count must be between 1 and 100" }, { status: 400 });
    }
    
    // Check if user has hit their daily generation limit
    const usesOwnApiKey = !!overrideApiKey && !!useUserSettings;
    const dailyLimitResult = await checkDailyLimit({
      identifier: userEmail,
      usesOwnApiKey
    });

    // If user has reached their limit, return a 403 Forbidden response
    if (!dailyLimitResult.success) {
      return NextResponse.json({
        error: `Daily rate limit exceeded. You have used all ${dailyLimitResult.limit} of your free generations for today.`,
        limit: dailyLimitResult.limit,
        remaining: dailyLimitResult.remaining,
        resetTimestamp: dailyLimitResult.resetTimestamp
      }, { status: 403 });
    }

    // P2-3: per-identity in-flight cap. Stops Postman from firing N parallel
    // generations and draining the daily quota faster than checkDailyLimit can
    // react. Identifier mirrors the rate-limit identifier so it covers both
    // signed-in users and per-IP anonymous callers.
    const slot = await acquireSlot(userEmail);
    if (!slot.ok) {
      return NextResponse.json(
        {
          error: `Too many concurrent generations. Limit is ${MAX_INFLIGHT_PER_IDENTITY} in-flight. Wait for an existing request to finish.`,
          reason: "concurrency_limit",
        },
        { status: 429 }
      );
    }

    // Attempt to validate SQL schema if no examples provided
    if (effectiveSchemaType === "sql" && !examples) {
      try {
        const { parseSQLSchema } = await import('@/lib/sql-parser');
        const parsedSchema = parseSQLSchema(schema);
        if (!parsedSchema.valid) {
          console.warn(`SQL validation skipped or warnings found: ${parsedSchema.errors.join(", ")}`);
        }
      } catch (validationError) {
        console.warn("SQL validation error:", validationError);
      }
    }

    let result;
    let success = true;
    let errorMessage;

    try {
      // Generate the mock data using the AI provider
      result = await generateMockData({
        schema,
        schemaType: effectiveSchemaType,
        count: recordCount,
        format: effectiveFormat,
        examples,
        additionalInstructions,
        apiKey: finalApiKey,
        model: finalModel,
        baseUrl: finalBaseUrl,
        temperature: finalTemperature,
        maxTokens: finalMaxTokens,
        headers: finalHeaders,
      });

      // Off-topic sentinel: model refused per the system prompt's contract.
      // Treat as a 422 and DON'T charge it against the daily quota.
      if (isOffTopicSentinel(result)) {
        success = false;
        errorMessage = "off_topic_refusal";
        return NextResponse.json(
          {
            error: "The request was not recognised as a mock-data generation task and was refused. Rephrase your schema/instructions and try again.",
            reason: "off_topic_refusal",
          },
          { status: 422 }
        );
      }

      // Increment usage counter after successful generation
      if (!usesOwnApiKey) {
        await incrementDailyUsage(userEmail);
      }
    } catch (generateError) {
      success = false;
      errorMessage = (generateError as Error).message;
      throw generateError;
    } finally {
      // Release the in-flight slot regardless of outcome.
      await releaseSlot(slot);
      try {
        // Attempt to extract a meaningful schema name from the schema definition
        let extractedSchemaName = schemaName;
        
        if (!extractedSchemaName) {
          if (effectiveSchemaType === 'sql') {
            // Extract table name from SQL CREATE TABLE statement
            const tableMatch = schema.match(/CREATE\s+TABLE\s+["'`]?(\w+)["'`]?/i);
            if (tableMatch && tableMatch[1]) {
              extractedSchemaName = `${tableMatch[1]} records`;
            }
          } else if (effectiveSchemaType === 'nosql') {
            // Try to extract collection/type name from NoSQL schema
            const collectionMatch = schema.match(/["']?(collection|type|name)["']?\s*:\s*["'](\w+)["']/i);
            if (collectionMatch && collectionMatch[2]) {
              extractedSchemaName = `${collectionMatch[2]} records`;
            } else {
              // Look for entity name in JSON structure
              const entityMatch = schema.match(/["']?(\w+)["']?\s*:\s*{/);
              if (entityMatch && entityMatch[1] && !['properties', 'required', 'type', 'items'].includes(entityMatch[1].toLowerCase())) {
                extractedSchemaName = `${entityMatch[1]} records`;
              }
            }
          }
          
          // Fallback name if extraction failed
          if (!extractedSchemaName) {
            extractedSchemaName = `${effectiveSchemaType.toUpperCase()} records`;
          }
        }

        // Record generation event for analytics
        await recordGenerationEvent({
          userId,
          schemaId: body.schemaId || '',
          schemaName: extractedSchemaName || 'Untitled Schema',
          recordsCount: recordCount,
          format: effectiveFormat,
          success,
          errorMessage,
        });

        // For authenticated users, record to events log
        if (session?.user?.id) {
          await recordUserActivity({
            userId,
            action: 'generate',
            details: `Generated ${recordCount} ${effectiveSchemaType} records in ${effectiveFormat} format`,
          });
          
          // Save generation to user's history
          await recordGeneration(session.user.id, {
            schemaId: body.schemaId || '',
            schemaName: extractedSchemaName || 'Untitled Schema',
            schemaType: effectiveSchemaType,
            recordsCount: recordCount,
            format: effectiveFormat,
            success,
            errorMessage,
          });
        }
      } catch (recordError) {
        console.error(`Failed to record generation event:`, recordError);
      }
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error("Error generating mock data:", error);
    return NextResponse.json(
      {
        error: `Failed to generate mock data: ${error}`,
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
