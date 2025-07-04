import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyAuth } from "@/lib/middleware/api-key-auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Restrict to development mode only
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error: "Not found",
        message: "This debug endpoint is only available to developers.",
      },
      { status: 404 }
    );
  }

  try {
    // Extract the Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "No Authorization header found",
          headers: Object.fromEntries(request.headers.entries()),
        },
        { status: 401 }
      );
    }

    // Test API key validation
    const authContext = await validateApiKeyAuth(request);

    if (!authContext) {
      return NextResponse.json(
        {
          error: "API key validation failed",
          authHeader: authHeader.substring(0, 10) + "...", // Only show first 10 chars for security
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key is valid",
      userId: authContext.userId,
      keyId: authContext.keyId,
      isApiKeyAuth: authContext.isApiKeyAuth,
    });
  } catch (error) {
    console.error("Debug API key error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
