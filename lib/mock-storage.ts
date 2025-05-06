// TODO: move local browser storage.
// FOR TESTING ONLY
import { SavedSchema, RecentGeneration } from "./storage";

const mockStorage: {
  schemas: {
    [userId: string]: {
      [schemaId: string]: SavedSchema;
    };
  };
  recentSchemas: {
    [userId: string]: string[];
  };
  history: {
    [userId: string]: RecentGeneration[];
  };
} = {
  schemas: {},
  recentSchemas: {},
  history: {},
};

export async function mockSaveSchema(
  userId: string,
  schema: Omit<SavedSchema, "id" | "createdAt" | "updatedAt">
): Promise<SavedSchema> {
  if (!userId) {
    throw new Error("userId is required");
  }

  // Initialize user's schemas if needed
  if (!mockStorage.schemas[userId]) {
    mockStorage.schemas[userId] = {};
  }

  const timestamp = Date.now();
  const id = `mock_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

  const savedSchema: SavedSchema = {
    id,
    ...schema,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Save the schema
  mockStorage.schemas[userId][id] = savedSchema;

  // Update recent schemas
  await mockAddToRecentSchemas(userId, id);

  return savedSchema;
}

// Mock implementation for getSchema
export async function mockGetSchema(
  userId: string,
  schemaId: string
): Promise<SavedSchema | null> {
  if (!userId || !schemaId) {
    return null;
  }

  return mockStorage.schemas[userId]?.[schemaId] || null;
}

// Mock implementation for getSchemas
export async function mockGetSchemas(userId: string): Promise<SavedSchema[]> {
  if (!userId) {
    return [];
  }

  return Object.values(mockStorage.schemas[userId] || {});
}

// Mock implementation for updateSchema
export async function mockUpdateSchema(
  userId: string,
  schemaId: string,
  updates: Partial<Omit<SavedSchema, "id" | "createdAt" | "updatedAt">>
): Promise<SavedSchema | null> {
  if (!userId || !schemaId) {
    return null;
  }

  const existingSchema = mockStorage.schemas[userId]?.[schemaId];
  if (!existingSchema) {
    return null;
  }

  const updatedSchema: SavedSchema = {
    ...existingSchema,
    ...updates,
    updatedAt: Date.now(),
  };

  mockStorage.schemas[userId][schemaId] = updatedSchema;

  return updatedSchema;
}

// Mock implementation for deleteSchema
export async function mockDeleteSchema(
  userId: string,
  schemaId: string
): Promise<boolean> {
  if (!userId || !schemaId) {
    return false;
  }

  if (!mockStorage.schemas[userId]?.[schemaId]) {
    return false;
  }

  delete mockStorage.schemas[userId][schemaId];
  return true;
}

// Helper for adding to recent schemas
async function mockAddToRecentSchemas(
  userId: string,
  schemaId: string
): Promise<void> {
  if (!mockStorage.recentSchemas[userId]) {
    mockStorage.recentSchemas[userId] = [];
  }

  // Add to the beginning and remove duplicates
  mockStorage.recentSchemas[userId] = [
    schemaId,
    ...mockStorage.recentSchemas[userId].filter((id) => id !== schemaId),
  ].slice(0, 10);
}

// Mock implementation for getRecentSchemas
export async function mockGetRecentSchemas(
  userId: string
): Promise<SavedSchema[]> {
  if (!userId) {
    return [];
  }

  const recentIds = mockStorage.recentSchemas[userId] || [];
  const schemas: SavedSchema[] = [];

  for (const id of recentIds) {
    const schema = await mockGetSchema(userId, id);
    if (schema) {
      schemas.push(schema);
    }
  }

  return schemas;
}

// Mock implementation for recordGeneration
export async function mockRecordGeneration(
  userId: string,
  generation: Omit<RecentGeneration, "id" | "timestamp">
): Promise<RecentGeneration> {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!mockStorage.history[userId]) {
    mockStorage.history[userId] = [];
  }

  const id = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();

  const record: RecentGeneration = {
    ...generation,
    id,
    timestamp,
  };

  mockStorage.history[userId] = [record, ...mockStorage.history[userId]].slice(
    0,
    20
  );

  return record;
}

// Mock implementation for getGenerationHistory
export async function mockGetGenerationHistory(
  userId: string
): Promise<RecentGeneration[]> {
  if (!userId) {
    return [];
  }

  return mockStorage.history[userId] || [];
}

// Mock implementation for getGlobalSettings
export async function mockGetGlobalSettings() {
  return {
    rateLimits: {
      anonymous: 5,
      authenticated: 20,
    },
    supportedFormats: ["json", "sql", "csv"],
    maxRecords: 100,
  };
}

// Clear all mock storage (useful for testing)
export async function mockClearAllStorage(): Promise<void> {
  Object.keys(mockStorage.schemas).forEach((userId) => {
    mockStorage.schemas[userId] = {};
  });

  Object.keys(mockStorage.recentSchemas).forEach((userId) => {
    mockStorage.recentSchemas[userId] = [];
  });

  Object.keys(mockStorage.history).forEach((userId) => {
    mockStorage.history[userId] = [];
  });
}
