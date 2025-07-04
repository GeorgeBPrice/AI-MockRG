import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getToken } from "next-auth/jwt";
import { validateApiKeyAuth } from "@/lib/middleware/api-key-auth";

// Define routes that require authentication
const protectedRoutes = ["/saved", "/settings", "/dashboard", "/api-keys"];

// Define API routes that require authentication
const protectedApiRoutes = ["/api/user"];

// Define API routes that need rate limiting
const rateLimitedApiRoutes = ["/api/generate", "/api/v1/generate"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check authentication for protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getToken({ req: request });

    // If not authenticated, redirect to login
    if (!token) {
      const url = new URL("/auth/signin", request.url);
      url.searchParams.set("callbackUrl", encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Check authentication for protected API routes
  if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getToken({ req: request });

    // If not authenticated, return 401 Unauthorized
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return NextResponse.next();
  }

  // Handle rate limiting for API routes
  const extractClientIp = (request: NextRequest): string => {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "anonymous"
    );
  };

  // Handle rate limiting for API routes
  if (rateLimitedApiRoutes.some((route) => pathname.startsWith(route))) {
    let identifier: string;
    let isAuthenticated: boolean;

    // For external API routes, check API key authentication first
    if (pathname.startsWith("/api/v1/")) {
      const apiKeyContext = await validateApiKeyAuth(request);
      if (apiKeyContext) {
        // Use API key user ID for rate limiting
        identifier = apiKeyContext.userId;
        isAuthenticated = true;
      } else {
        // Invalid API key - use IP for rate limiting
        identifier = extractClientIp(request);
        isAuthenticated = false;
      }
    } else {
      // For regular routes, use session authentication
      const token = await getToken({ req: request });
      identifier = token?.sub || extractClientIp(request);
      isAuthenticated = !!token;
    }
    // Check rate limit
    const rateLimit = await checkRateLimit({
      identifier,
      isAuthenticated,
      endpoint: pathname,
    });

    // If rate limited, return 429 Too Many Requests
    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          limit: rateLimit.limit,
          reset: new Date(rateLimit.reset * 1000).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.reset),
          },
        }
      );
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.reset));

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all protected routes
     */
    "/saved/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
    "/api-keys/:path*",
    /*
     * Match all API routes that need authentication
     */
    "/api/user/:path*",
    /*
     * Match all API routes that need rate limiting
     */
    "/api/generate/:path*",
    "/api/v1/generate/:path*",
  ],
};
