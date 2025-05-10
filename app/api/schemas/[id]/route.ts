// Modified route.ts file with Promise params
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getSchema,
  updateSchema,
  deleteSchema,
  SavedSchema,
} from "@/lib/storage";
import { z } from "zod";

const schemaUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  schema: z.string().min(1).optional(),
  schemaType: z.enum(["sql", "nosql"]).optional(),
  additionalInstructions: z.string().optional(),
  preferredFormat: z.string().optional(),
  preferredRecordCount: z.number().min(1).max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const schemaId = resolvedParams.id;
  if (!schemaId) {
    return NextResponse.json(
      { error: "Schema ID is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const schema = await getSchema(userId, schemaId);

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json({ schema });
  } catch (error) {
    console.error("Error fetching schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch schema", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const schemaId = resolvedParams.id;
  if (!schemaId) {
    return NextResponse.json(
      { error: "Schema ID is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();

    // Validate the request body
    const result = schemaUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    // Filter out undefined values before passing to updateSchema
    const updates: Partial<
      Omit<SavedSchema, "id" | "createdAt" | "updatedAt" | "userId">
    > = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.description !== undefined)
      updates.description = result.data.description;
    if (result.data.schema !== undefined) updates.schema = result.data.schema;
    if (result.data.schemaType !== undefined)
      updates.schemaType = result.data.schemaType;
    if (result.data.additionalInstructions !== undefined)
      updates.additionalInstructions = result.data.additionalInstructions;
    if (result.data.preferredFormat !== undefined)
      updates.preferredFormat = result.data.preferredFormat;
    if (result.data.preferredRecordCount !== undefined)
      updates.preferredRecordCount = result.data.preferredRecordCount;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedSchema = await updateSchema(userId, schemaId, updates);

    if (!updatedSchema) {
      return NextResponse.json(
        { error: "Schema not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ schema: updatedSchema });
  } catch (error) {
    console.error("Error updating schema:", error);
    return NextResponse.json(
      { error: "Failed to update schema", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const schemaId = resolvedParams.id;
  if (!schemaId) {
    return NextResponse.json(
      { error: "Schema ID is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const success = await deleteSchema(userId, schemaId);

    if (!success) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting schema:", error);
    return NextResponse.json(
      { error: "Failed to delete schema", message: (error as Error).message },
      { status: 500 }
    );
  }
}
