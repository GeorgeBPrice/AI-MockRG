import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, updateApiKeyUsage } from "@/lib/api-keys";

export interface ApiKeyAuthContext {
  userId: string;
  keyId: string;
  isApiKeyAuth: boolean;
}

/**
 * Extract API key from Authorization header
 */
function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) return null;

  // Check for Bearer token format
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Validate API key and return user context
 */
export async function validateApiKeyAuth(
  request: NextRequest
): Promise<ApiKeyAuthContext | null> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return null;
  }

  try {
    const validation = await validateApiKey(apiKey);

    if (!validation) {
      return null;
    }

    // Update usage statistics (don't await to avoid blocking)
    updateApiKeyUsage(validation.keyId).catch((error) => {
      console.error("Failed to update API key usage:", error);
    });

    return {
      userId: validation.userId,
      keyId: validation.keyId,
      isApiKeyAuth: true,
    };
  } catch (error) {
    console.error("Error validating API key:", error);
    return null;
  }
}

/**
 * Middleware function to handle API key authentication
 * This can be used in route handlers to validate API keys
 */
export async function withApiKeyAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    context: ApiKeyAuthContext
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  const authContext = await validateApiKeyAuth(request);

  if (!authContext) {
    return NextResponse.json(
      {
        error: "Invalid or missing API key",
        message: "Please provide a valid API key in the Authorization header",
      },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Bearer realm="AI Mocker API"',
        },
      }
    );
  }

  return handler(request, authContext);
}

/**
 * Helper function to check if a request is using API key authentication
 */
export function isApiKeyRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ?? false;
}

/**
 * Get user ID from either session or API key
 * This integrates with the existing authentication system
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  // First check for API key authentication
  const apiKeyContext = await validateApiKeyAuth(request);
  if (apiKeyContext) {
    return apiKeyContext.userId;
  }

  return null;
}
