import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserAiSettings } from "@/lib/storage";
import { z } from "zod";

// We no longer interact with Redis directly, client will handle localStorage

const settingsSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(100000).optional(),
  headers: z.record(z.string()).optional(),
}).partial();

// GET to fetch user settings - now just returns success, client handles localStorage
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Client should load settings from localStorage" 
    });
  } catch (error) {
    console.error("Error in settings GET endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process request", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST user settings - now just validates, client handles localStorage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate the request body
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }

    // We don't save to Redis anymore, just validate and return success
    // The client will save to localStorage
    return NextResponse.json({ 
      success: true,
      message: "Validation successful, save to localStorage"
    });

  } catch (error) {
    console.error("Error in settings POST endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process request", message: (error as Error).message },
      { status: 500 }
    );
  }
} 