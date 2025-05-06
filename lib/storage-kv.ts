import { kv } from "./kv-adapter";
import { get } from "@vercel/edge-config";

export type SavedSchema = {
  id: string;
  name: string;
  description?: string;
  schema: string;
  schemaType: "sql" | "nosql";
  createdAt: number;
  updatedAt: number;
};

export type RecentGeneration = {
  id: string;
  schemaName?: string;
  schemaType: "sql" | "nosql";
  recordsCount: number;
  timestamp: number;
};

// Save a schema for a user
export async function saveSchema(
  userId: string,
  schema: Omit<SavedSchema, "id" | "createdAt" | "updatedAt">
): Promise<SavedSchema> {
  const id = crypto.randomUUID();
  const timestamp = Date.now();

  const savedSchema: SavedSchema = {
    ...schema,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Create a clean object without null values
  const cleanSchema: Record<string, string | number | boolean | object> = {};
  Object.entries(savedSchema).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      cleanSchema[key] = value;
    }
  });

  await kv.hset(`user:${userId}:schemas`, {
    [id]: JSON.stringify(cleanSchema),
  });

  // Update recents list
  await addToRecentSchemas(userId, id);

  return savedSchema;
}

// Get a specific schema by ID
export async function getSchema(
  userId: string,
  schemaId: string
): Promise<SavedSchema | null> {
  const schemaStr = await kv.hget(`user:${userId}:schemas`, schemaId);

  if (!schemaStr) return null;

  return JSON.parse(schemaStr as string) as SavedSchema;
}

// Get all schemas for a user
export async function getSchemas(userId: string): Promise<SavedSchema[]> {
  const schemas = await kv.hgetall(`user:${userId}:schemas`);

  if (!schemas) return [];

  return Object.values(schemas).map(
    (schema) => JSON.parse(schema as string) as SavedSchema
  );
}

// Delete a schema
export async function deleteSchema(
  userId: string,
  schemaId: string
): Promise<boolean> {
  const deleted = await kv.hdel(`user:${userId}:schemas`, schemaId);
  return deleted > 0;
}

// Update a schema
export async function updateSchema(
  userId: string,
  schemaId: string,
  updates: Partial<Omit<SavedSchema, "id" | "createdAt" | "updatedAt">>
): Promise<SavedSchema | null> {
  const existing = await getSchema(userId, schemaId);

  if (!existing) return null;

  // Remove null or undefined values from updates
  const cleanUpdates: Record<string, string | number | boolean | object> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  const updated: SavedSchema = {
    ...existing,
    ...cleanUpdates,
    updatedAt: Date.now(),
  };

  await kv.hset(`user:${userId}:schemas`, {
    [schemaId]: JSON.stringify(updated),
  });

  return updated;
}

// Add to recent schemas list
async function addToRecentSchemas(
  userId: string,
  schemaId: string
): Promise<void> {
  await kv.lpush(`user:${userId}:recent_schemas`, schemaId);
  await kv.ltrim(`user:${userId}:recent_schemas`, 0, 9); // Keep last 10
}

// Get recent schemas
export async function getRecentSchemas(userId: string): Promise<SavedSchema[]> {
  const recentIds = await kv.lrange(`user:${userId}:recent_schemas`, 0, 9);

  if (!recentIds || recentIds.length === 0) return [];

  const schemas: SavedSchema[] = [];

  for (const id of recentIds) {
    const schema = await getSchema(userId, id as string);
    if (schema) schemas.push(schema);
  }

  return schemas;
}

// Record a generation in history
export async function recordGeneration(
  userId: string,
  generation: Omit<RecentGeneration, "id" | "timestamp">
): Promise<RecentGeneration> {
  const id = crypto.randomUUID();
  const timestamp = Date.now();

  const record: RecentGeneration = {
    ...generation,
    id,
    timestamp,
  };

  await kv.lpush(`user:${userId}:history`, JSON.stringify(record));

  // Keep last 20 generations
  await kv.ltrim(`user:${userId}:history`, 0, 19);

  // Set TTL for history (30 days)
  await kv.expire(`user:${userId}:history`, 60 * 60 * 24 * 30);

  return record;
}

// Get generation history
export async function getGenerationHistory(
  userId: string
): Promise<RecentGeneration[]> {
  const history = await kv.lrange(`user:${userId}:history`, 0, 19);

  if (!history) return [];

  return history.map((item) => JSON.parse(item as string) as RecentGeneration);
}

// Get global settings from Edge Config
export async function getGlobalSettings() {
  try {
    return {
      rateLimits: {
        anonymous: ((await get("rateLimit.anonymous")) as number) || 5,
        authenticated: ((await get("rateLimit.authenticated")) as number) || 20,
      },
      supportedFormats: ((await get("supportedFormats")) as string[]) || [
        "json",
        "sql",
        "csv",
      ],
      maxRecords: ((await get("maxRecords")) as number) || 100,
    };
  } catch (error) {
    // Fallback defaults if Edge Config is not available
    return {
      rateLimits: {
        anonymous: 5,
        authenticated: 20,
      },
      supportedFormats: ["json", "sql", "csv"],
      maxRecords: 100,
      error,
    };
  }
}
