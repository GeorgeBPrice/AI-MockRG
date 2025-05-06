import { NextRequest, NextResponse } from "next/server";
import { generateMockData } from "@/lib/openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { recordGeneration } from "@/lib/storage";
import { recordGenerationEvent, recordUserActivity } from "@/lib/events";
// Note: No longer importing getUserAiSettings as we'll use localStorage functionality

/**
 * API route handler for generating mock data
 * Accepts schema definitions and configuration options to generate realistic mock data
 * Supports both SQL and NoSQL schema formats, or any text sample data
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session or default to anonymous
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous';
    const schemaName = session?.user ? undefined : 'Anonymous Generation';

    // Parse request body
    const body = await request.json();
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

    // Determine which API settings to use
    let finalApiKey, finalModel, finalBaseUrl, finalTemperature, finalMaxTokens, finalHeaders;
    
    if (useUserSettings) {
      // If useUserSettings is true but we can't access localStorage server-side
      // We should use any provided settings in the request or fall back to env vars
      finalApiKey = overrideApiKey || process.env.OPENAI_API_KEY;
      finalModel = overrideModel || process.env.OPENAI_API_DEFAULT_MODEL;
      finalBaseUrl = overrideBaseUrl || process.env.OPENAI_API_BASE_URL;
      finalTemperature = overrideTemperature ?? 0.7;
      finalMaxTokens = overrideMaxTokens ?? 4000;
      finalHeaders = overrideHeaders || {};
    } else {
      // Otherwise use priority: request override > environment variables
      finalApiKey = overrideApiKey || process.env.OPENAI_API_KEY;
      finalModel = overrideModel || process.env.OPENAI_API_DEFAULT_MODEL;
      finalBaseUrl = overrideBaseUrl || process.env.OPENAI_API_BASE_URL;
      finalTemperature = overrideTemperature ?? 0.7;
      finalMaxTokens = overrideMaxTokens ?? 4000;
      finalHeaders = overrideHeaders || {};
    }

    // Validate required inputs
    if (!schema) {
      return NextResponse.json({ error: "Schema is required" }, { status: 400 });
    }
    
    if (!finalApiKey) {
      console.error("API Key Configuration Error: No key found in request body, user settings, or environment variables.");
      return NextResponse.json(
        { error: "AI API key is not configured." },
        { status: 500 }
      );
    }
    
    // Normalize input parameters
    const effectiveSchemaType = ["sql", "nosql"].includes(schemaType) ? schemaType : "sql";
    const effectiveFormat = format || "json";
    
    // Validate record count (between 1-100)
    const recordCount = parseInt(count, 10) || 10;
    if (isNaN(recordCount) || recordCount < 1 || recordCount > 100) {
      return NextResponse.json({ error: "Record count must be between 1 and 100" }, { status: 400 });
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
    } catch (generateError) {
      success = false;
      errorMessage = (generateError as Error).message;
      throw generateError;
    } finally {
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
