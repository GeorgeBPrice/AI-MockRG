import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revokeApiKey } from "@/lib/api-keys";

/**
 * DELETE /api/user/api-keys/{keyId} - Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await params;
    
    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    // Revoke the API key
    await revokeApiKey(session.user.id, keyId);
    
    return NextResponse.json({
      success: true,
      message: "API key revoked successfully"
    });
  } catch (error) {
    console.error("Error revoking API key:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
} 