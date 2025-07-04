import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createApiKey, listApiKeys, CreateApiKeyRequest } from "@/lib/api-keys";
import { z } from "zod";

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required").max(100, "Key name too long"),
});

// Utility function for standardized API error responses
function handleApiError(
  error: unknown,
  defaultMessage: string,
  defaultStatus: number = 500
) {
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(
    { error: defaultMessage },
    { status: defaultStatus }
  );
}

/**
 * POST /api/user/api-keys - Generate a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const result = createApiKeySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const createRequest: CreateApiKeyRequest = result.data;

    // Create the API key
    const response = await createApiKey(session.user.id, createRequest);

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Failed to create API key", 500);
  }
}

/**
 * GET /api/user/api-keys - List all API keys for the user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await listApiKeys(session.user.id);

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, "Failed to list API keys", 500);
  }
}
