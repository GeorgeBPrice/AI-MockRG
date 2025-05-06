import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSchemas, saveSchema } from "@/lib/storage";
import { z } from "zod";

const schemaRequestSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  schema: z.string().min(1),
  schemaType: z.enum(["sql", "nosql"]),
  additionalInstructions: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const schemas = await getSchemas(userId);

    // Use the request parameter to access the request headers
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const headers = request.headers;

    return NextResponse.json({ schemas });
  } catch (error) {
    console.error("Error fetching schemas:", error);

    return NextResponse.json(
      { error: "Failed to fetch schemas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();

    // Validate the request body
    const result = schemaRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const savedSchema = await saveSchema(userId, {
      name: result.data.name,
      description: result.data.description,
      schema: result.data.schema,
      schemaType: result.data.schemaType,
      additionalInstructions: result.data.additionalInstructions,
    });

    return NextResponse.json({ schema: savedSchema }, { status: 201 });
  } catch (error) {
    console.error("Error saving schema:", error);

    return NextResponse.json(
      { error: "Failed to save schema", message: (error as Error).message },
      { status: 500 }
    );
  }
}
