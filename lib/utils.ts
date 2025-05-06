import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGenerationHistory, getRecentSchemas } from "@/lib/storage";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user stats (recent schemas, generation history)
    const [recentSchemas, generationHistory] = await Promise.all([
      getRecentSchemas(session.user.id),
      getGenerationHistory(session.user.id),
    ]);

    // Get query parameter to determine what data to return
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("data");

    if (dataType === "schemas") {
      return NextResponse.json({ schemas: recentSchemas });
    }

    if (dataType === "history") {
      return NextResponse.json({ history: generationHistory });
    }

    // Return all data by default
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      stats: {
        totalSchemas: recentSchemas.length,
        totalGenerations: generationHistory.length,
      },
      recentSchemas,
      generationHistory,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);

    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
