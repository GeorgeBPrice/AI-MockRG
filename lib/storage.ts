import { kv } from "./kv-adapter";
import { get } from "@vercel/edge-config";

export interface SavedSchema {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  schema: string;
  schemaType: "sql" | "nosql";
  additionalInstructions?: string;
  preferredFormat?: string;
  preferredRecordCount?: number;
  createdAt: number;
  updatedAt: number;
}

export type RecentGeneration = {
  id: string;
  schemaId?: string;
  schemaName?: string;
  schemaType: "sql" | "nosql";
  recordsCount: number;
  format?: string;
  success?: boolean;
  errorMessage?: string;
  timestamp: number;
};

export interface UserAiSettings {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
  updatedAt?: number;
}

// Helper to check if we're in a server environment
const isServerEnvironment = () => {
  const isServer = typeof window === "undefined";
  return isServer;
};

// Check if Vercel KV client is properly configured and available
const kvConfigured = typeof kv !== "undefined" && kv !== null && !!Object.keys(kv).length;

// Use mock storage ONLY if KV is NOT configured
const useMockStorage = !kvConfigured;

// Only warn if we're in a server environment and KV is not configured
if (useMockStorage && isServerEnvironment()) {
    console.warn("Vercel KV not available. Using mock in-memory storage.");
}

// Cross-request persistent storage solution for development
// This uses a global variable in Node.js which persists between requests
// but is reset when the server restarts

interface SchemaStorage {
  __schemaStorage: {
    schemas: object;
    recentSchemas: object;
    history: object;
  };
}

const globalServerStorage: SchemaStorage = global as unknown as SchemaStorage;

// Initialize the storage if it doesn't exist
if (!globalServerStorage.__schemaStorage) {
  globalServerStorage.__schemaStorage = {
    schemas: {},
    recentSchemas: {},
    history: {},
  };
}

// In-memory storage for server environment (temporary, will be lost between server restarts)
// This is a global variable that persists between API requests in the same server instance
const serverMemoryStorage: {
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

// =====================================================================
// ==================== USER AI SETTINGS OPERATIONS ====================
// =====================================================================

// Get user-specific AI settings
export async function getUserAiSettings(userId: string): Promise<UserAiSettings | null> {
  if (!userId) return null;
  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const settings = await kv.hgetall(`user:${userId}:ai_settings`);
      // Ensure we return null if no settings are found, not an empty object
      if (settings && Object.keys(settings).length > 0) {
        // Parse the headers JSON string if it exists
        if (settings.headers && typeof settings.headers === 'string') {
          try {
            settings.headers = JSON.parse(settings.headers);
          } catch (e) {
            console.error(`Error parsing headers JSON for user ${userId}:`, e);
            settings.headers = {};
          }
        }
        
        // Convert numeric fields from strings to numbers
        if (settings.temperature && typeof settings.temperature === 'string') {
          settings.temperature = parseFloat(settings.temperature);
        }
        
        if (settings.maxTokens && typeof settings.maxTokens === 'string') {
          settings.maxTokens = parseInt(settings.maxTokens, 10);
        }
        
        return settings as UserAiSettings;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching AI settings from KV for user ${userId}:`, error);
      return null;
    }
  }

  // Mock storage not implemented for AI settings
   if (isServer) {
     console.warn(`getUserAiSettings called with mock storage active for user ${userId}. Returning null.`);
     return null;
   } else {
     console.error("getUserAiSettings called unexpectedly in client environment");
     return null;
   }
}

// Save or update user-specific AI settings
export async function saveUserAiSettings(userId: string, settings: Partial<UserAiSettings>): Promise<boolean> {
   if (!userId) return false;
   if (!settings || Object.keys(settings).length === 0) return false; // No settings to save
   const isServer = isServerEnvironment();

   // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const key = `user:${userId}:ai_settings`;

      // Prepare the data to save. Undefined means don't change/set.
      // Empty string for apiKey/model/baseUrl means CLEAR the setting.
      let needsUpdate = false;

      // Use HSET for individual fields. Use HDEL for fields set to empty string.
      const tx = kv.multi();

      if (settings.apiKey !== undefined) {
          if(settings.apiKey === '') {
              tx.hdel(key, 'apiKey');
          } else {
              tx.hset(key, { apiKey: settings.apiKey });
          }
          needsUpdate = true;
      }
      if (settings.model !== undefined) {
           if(settings.model === '') {
              tx.hdel(key, 'model');
          } else {
              tx.hset(key, { model: settings.model });
          }
           needsUpdate = true;
      }
      if (settings.baseUrl !== undefined) {
          if(settings.baseUrl === '') {
              tx.hdel(key, 'baseUrl');
          } else {
              tx.hset(key, { baseUrl: settings.baseUrl });
          }
           needsUpdate = true;
      }
      
      // Handle new fields
      if (settings.headers !== undefined) {
          if(settings.headers === null || Object.keys(settings.headers).length === 0) {
              tx.hdel(key, 'headers');
          } else {
              tx.hset(key, { headers: JSON.stringify(settings.headers) });
          }
          needsUpdate = true;
      }
      
      if (settings.temperature !== undefined) {
          if(settings.temperature === null) {
              tx.hdel(key, 'temperature');
          } else {
              tx.hset(key, { temperature: settings.temperature });
          }
          needsUpdate = true;
      }
      
      if (settings.maxTokens !== undefined) {
          if(settings.maxTokens === null) {
              tx.hdel(key, 'maxTokens');
          } else {
              tx.hset(key, { maxTokens: settings.maxTokens });
          }
           needsUpdate = true;
      }

      // Always update the timestamp if any other field was updated
      if (needsUpdate) {
          tx.hset(key, { updatedAt: Date.now() });
          await tx.exec();
          return true;
      } else {
          return true; // Indicate success as no update was needed
      }

    } catch (error) {
      console.error(`Error saving AI settings to KV for user ${userId}:`, error);
      return false;
    }
   }

  // Mock storage not implemented for AI settings
  if (isServer) {
      console.warn(`saveUserAiSettings called with mock storage active for user ${userId}. Operation skipped.`);
      return false;
  } else {
       console.error("saveUserAiSettings called unexpectedly in client environment");
      return false;
  }
}

// =====================================================================
// ==================== SCHEMA OPERATIONS ==============================
// =====================================================================

// Utility function to clean objects before sending to Redis
// Removes null and undefined values that Redis doesn't support
function cleanObjectForRedis<T extends Record<string, unknown>>(obj: T): Record<string, string | number | boolean | object> {
  const cleanObj: Record<string, string | number | boolean | object> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip null and undefined values
    if (value === null || value === undefined) continue;
    
    // For objects (except Date, which is handled as a value), recursively clean
    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      cleanObj[key] = cleanObjectForRedis(value as Record<string, unknown>);
    } else {
      cleanObj[key] = value as string | number | boolean | object;
    }
  }
  
  return cleanObj;
}

// Save a schema for a user
export async function saveSchema(
  userId: string,
  schema: Omit<SavedSchema, "id" | "createdAt" | "updatedAt" | "userId">
): Promise<SavedSchema> {
  if (!userId || userId.trim() === "") {
    throw new Error("Valid userId is required to save a schema");
  }
  if (!schema || !schema.name || !schema.schema) {
    throw new Error("Invalid schema data provided");
  }

  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const now = Date.now();
      const id = `sch_${now}_${Math.random().toString(36).substring(2, 7)}`;
      
      // For type safety, create the full schema object
      const newSchema: SavedSchema = {
        id,
        userId,
        name: schema.name,
        schema: schema.schema,
        schemaType: schema.schemaType,
        createdAt: now,
        updatedAt: now,
        ...(schema.description ? { description: schema.description } : {}),
        ...(schema.additionalInstructions ? { additionalInstructions: schema.additionalInstructions } : {}),
        ...(schema.preferredFormat ? { preferredFormat: schema.preferredFormat } : {}),
        ...(schema.preferredRecordCount ? { preferredRecordCount: schema.preferredRecordCount } : {})
      };
      
      // Clean object for Redis (removes null/undefined)
      const cleanedSchema = cleanObjectForRedis(newSchema as unknown as Record<string, unknown>);

      const tx = kv.multi();
      tx.hset(`schema:${id}`, cleanedSchema);
      tx.sadd(`user:${userId}:schemas`, id);
      await tx.exec();

      await addToRecentSchemas(userId, id);
      return newSchema;

    } catch (error) {
      console.error(`Error saving schema to KV for user ${userId}:`, error);
      throw new Error(`Failed to save schema to KV storage: ${(error as Error).message}`);
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    console.log(`Using mock storage for saveSchema (User: ${userId})`);
    const now = Date.now();
    const id = `sch_${now}_${Math.random().toString(36).substring(2, 7)}`;
    if (!serverMemoryStorage.schemas[userId]) serverMemoryStorage.schemas[userId] = {};
    const newSchema: SavedSchema = { 
        id, 
        userId, 
        ...schema, 
        createdAt: now, 
        updatedAt: now 
    };
    serverMemoryStorage.schemas[userId][id] = newSchema;
    await addToRecentSchemas(userId, id);
    return newSchema;
  } else {
    console.error("saveSchema called unexpectedly in client environment");
    throw new Error("Schema saving is only supported on the server.");
  }
}

// Get a specific schema for a user
export async function getSchema(
  userId: string,
  schemaId: string
): Promise<SavedSchema | null> {
  if (!userId || !schemaId) return null;
  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const schemaData = await kv.hgetall(`schema:${schemaId}`);
      
      if (!schemaData) { 
        return null; 
      }

      const schema = schemaData as unknown as SavedSchema;
      
      // Get the owner ID from the schema data and normalize to string
      const ownerId = String(schema.userId || '');
      const requesterId = String(userId);

      // Verify ownership with normalized string comparison
      if (!ownerId || ownerId !== requesterId) {
          return null;
      }

      return schema;
      
    } catch (error) {
      console.error(`Error fetching schema ${schemaId} from KV:`, error);
      return null;
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
     console.log(`[Storage getSchema Mock] Checking mock storage for User: ${userId}, Schema: ${schemaId}`);
     const mockSchema = serverMemoryStorage.schemas[userId]?.[schemaId] || null;
     console.log(`[Storage getSchema Mock] Result:`, mockSchema ? 'Found' : 'Not Found');
     return mockSchema;
  } else {
    return null;
  }
}

// Get all schemas for a user
export async function getSchemas(userId: string): Promise<SavedSchema[]> {
  if (!userId) return [];
  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const schemaIds = await kv.smembers(`user:${userId}:schemas`);
      if (!schemaIds || schemaIds.length === 0) return [];
      const validIds = schemaIds.filter(id => typeof id === 'string') as string[];
      if (validIds.length === 0) return [];
      const schemasData = await Promise.all(validIds.map(id => kv.hgetall(`schema:${id}`)));
      return schemasData
        .filter((s): s is Record<string, unknown> => s !== null)
        .map(s => s as unknown as SavedSchema);
    } catch (error) {
      console.error(`Error fetching schemas from KV for user ${userId}:`, error);
      return [];
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    return Object.values(serverMemoryStorage.schemas[userId] || {});
  } else {
    return [];
  }
}

// Update an existing schema
export async function updateSchema(
  userId: string,
  schemaId: string,
  updates: Partial<Omit<SavedSchema, "id" | "createdAt" | "updatedAt" | "userId">>
): Promise<SavedSchema | null> {
  if (!userId || !schemaId || !updates || Object.keys(updates).length === 0) {
    return null;
  }

  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const key = `schema:${schemaId}`;
      const exists = await kv.exists(key);
      if (!exists) return null;

      // Verify ownership with normalized string comparison
      const ownerIdRaw = await kv.hget(key, 'userId');
      const ownerId = String(ownerIdRaw || '');
      const requesterId = String(userId);
      
      if (!ownerId || ownerId !== requesterId) {
          return null; 
      }

      const now = Date.now();
      
      // Add updatedAt to updates
      const updateWithTimestamp = { ...updates, updatedAt: now };
      
      // Clean object for Redis (removes null/undefined)
      const cleanUpdates = cleanObjectForRedis(updateWithTimestamp as unknown as Record<string, unknown>);
      
      // Update only provided fields using hset
      await kv.hset(key, cleanUpdates);

      const updatedSchemaData = await kv.hgetall(key);

      // Check if data was retrieved before asserting type
      if (!updatedSchemaData) {
          return null;
      }

      return updatedSchemaData as unknown as SavedSchema;

    } catch (error) {
      console.error(`Error updating schema in KV for user ${userId}, schema ${schemaId}:`, error);
      throw new Error(`Failed to update schema in KV storage: ${(error as Error).message}`);
    }
  }
  
  // Use mock/memory storage otherwise
  // TODO: move local browser storage.
  if (isServer) {
    console.log(`Using mock storage for updateSchema (User: ${userId}, Schema: ${schemaId})`);
    if (!serverMemoryStorage.schemas[userId]?.[schemaId]) {
        return null;
    }
    const now = Date.now();
    // Merge updates including additionalInstructions
    const updatedSchema = { 
        ...serverMemoryStorage.schemas[userId][schemaId], 
        ...updates, 
        updatedAt: now 
    };
    serverMemoryStorage.schemas[userId][schemaId] = updatedSchema;
    return updatedSchema;
  } else {
    return null;
  }
}

// Delete a schema
export async function deleteSchema(
  userId: string,
  schemaId: string
): Promise<boolean> {
  if (!userId || !schemaId) return false;
  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      // Verify ownership with normalized string comparison
      const ownerIdRaw = await kv.hget(`schema:${schemaId}`, 'userId');
      const ownerId = String(ownerIdRaw || '');
      const requesterId = String(userId);
      
      if (!ownerId || ownerId !== requesterId) {
        return false;
      }

      const tx = kv.multi();
      tx.del(`schema:${schemaId}`);
      tx.srem(`user:${userId}:schemas`, schemaId);
      tx.lrem(`user:${userId}:recent_schemas`, 0, schemaId);
      await tx.exec();

      return true;

    } catch (error) {
      console.error(`Error deleting schema ${schemaId} from KV:`, error);
      return false;
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    console.log(`Using mock storage for deleteSchema (User: ${userId}, Schema: ${schemaId})`);
    if (!serverMemoryStorage.schemas[userId]?.[schemaId]) return false;
    delete serverMemoryStorage.schemas[userId][schemaId];
    if (serverMemoryStorage.recentSchemas[userId]) {
      serverMemoryStorage.recentSchemas[userId] =
        serverMemoryStorage.recentSchemas[userId].filter((id) => id !== schemaId);
    }
    return true;
  } else {
    return false;
  }
}

// ======================================================================
// ==================== RECENT SCHEMAS OPERATIONS =======================
// ======================================================================

// Add to recent schemas list
export async function addToRecentSchemas(
  userId: string,
  schemaId: string
): Promise<void> {
  if (!userId || !schemaId) return;
  const isServer = isServerEnvironment();
  const MAX_RECENT = 10;

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const key = `user:${userId}:recent_schemas`;
      const tx = kv.multi();
      tx.lrem(key, 0, schemaId);
      tx.lpush(key, schemaId);
      tx.ltrim(key, 0, MAX_RECENT - 1);
      await tx.exec();
    } catch (error) {
      console.error(`Error updating recent schemas in KV for user ${userId}:`, error);
    }
    return;
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    if (!serverMemoryStorage.recentSchemas[userId]) serverMemoryStorage.recentSchemas[userId] = [];
    serverMemoryStorage.recentSchemas[userId] = serverMemoryStorage.recentSchemas[userId].filter(id => id !== schemaId);
    serverMemoryStorage.recentSchemas[userId].unshift(schemaId);
    serverMemoryStorage.recentSchemas[userId] = serverMemoryStorage.recentSchemas[userId].slice(0, MAX_RECENT);
  }
}

// Get recent schemas
export async function getRecentSchemas(userId: string): Promise<SavedSchema[]> {
  if (!userId) return [];
  const isServer = isServerEnvironment();
  const MAX_RECENT = 10;

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const recentIds = await kv.lrange(`user:${userId}:recent_schemas`, 0, MAX_RECENT - 1);
      if (!recentIds || recentIds.length === 0) return [];
      const validIds = recentIds.filter(id => typeof id === 'string') as string[];
      if (validIds.length === 0) return [];
      const schemasData = await Promise.all(validIds.map(id => kv.hgetall(`schema:${id}`)));
      return schemasData
        .filter((s): s is Record<string, unknown> => s !== null && s.userId === userId) // Filter nulls and ensure ownership
        .map(s => s as unknown as SavedSchema);
    } catch (error) {
      console.error(`Error getting recent schemas from KV for user ${userId}:`, error);
      return [];
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  if (isServer) {
    const recentIds = serverMemoryStorage.recentSchemas[userId] || [];
    return recentIds
      .map(id => serverMemoryStorage.schemas[userId]?.[id])
      .filter((schema): schema is SavedSchema => !!schema);
  } else {
    return [];
  }
}

// ======================================================================
// ==================== GENERATION HISTORY OPERATIONS ===================
// ======================================================================

// Record a generation in history
export async function recordGeneration(
  userId: string,
  generation: Omit<RecentGeneration, "id" | "timestamp">
): Promise<RecentGeneration> {
  if (!userId) {
     throw new Error("Valid userId is required to record generation");
  }
  const isServer = isServerEnvironment();
  const MAX_HISTORY = 20;
  const now = Date.now();
  
  // Ensure all fields are present with defaults if not provided
  const newGeneration: RecentGeneration = {
    id: `gen_${now}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now,
    schemaId: generation.schemaId || '',
    schemaName: generation.schemaName || (generation.schemaType === 'sql' ? 'SQL Schema' : 'NoSQL Schema'),
    schemaType: generation.schemaType,
    recordsCount: generation.recordsCount,
    format: generation.format || 'json',
    success: generation.success !== undefined ? generation.success : true,
    errorMessage: generation.errorMessage || '',
  };

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const key = `user:${userId}:history`;
      const generationJson = JSON.stringify(newGeneration);
      const tx = kv.multi();
      tx.lpush(key, generationJson);
      tx.ltrim(key, 0, MAX_HISTORY - 1);
      await tx.exec();
      return newGeneration;
    } catch (error) {
      console.error(`Error recording generation to KV for user ${userId}:`, error);
      throw new Error("Failed to record generation history in KV.");
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    console.log(`Using mock storage for recordGeneration (User: ${userId})`);
    if (!serverMemoryStorage.history[userId]) serverMemoryStorage.history[userId] = [];
    serverMemoryStorage.history[userId].unshift(newGeneration);
    serverMemoryStorage.history[userId] = serverMemoryStorage.history[userId].slice(0, MAX_HISTORY);
    return newGeneration;
  } else {
    throw new Error("Recording generation is only supported on the server.");
  }
}

// Get generation history
export async function getGenerationHistory(
  userId: string
): Promise<RecentGeneration[]> {
  if (!userId) return [];
  const isServer = isServerEnvironment();
  const MAX_HISTORY = 20;

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      const historyJson = await kv.lrange(`user:${userId}:history`, 0, MAX_HISTORY - 1);
      if (!historyJson || historyJson.length === 0) return [];
      return historyJson.map(item => {
        try {
          return JSON.parse(String(item)) as RecentGeneration;
        } catch (e) {
          console.error("Failed to parse history item:", item, e);
          return null;
        }
      }).filter((item): item is RecentGeneration => item !== null);
    } catch (error) {
      console.error(`Error getting generation history from KV for user ${userId}:`, error);
      return [];
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    return serverMemoryStorage.history[userId] || [];
  } else {
    return [];
  }
}

// ======================================================================
// ==================== GLOBAL SETTINGS OPERATIONS ======================
// ======================================================================
// Fetches from Vercel Edge Config (not KV)
// TODO: remove this and use KV, if we don't need to support Edge Config anymore
export async function getGlobalSettings() {
  // Check if Edge Config client is available
  if (typeof get !== "undefined" && process.env.EDGE_CONFIG) {
    try {
      console.log("Fetching global settings from Edge Config");
      const [anonLimit, authLimit, formats, maxRec] = await Promise.all([
        get("rateLimitAnonymous"),
        get("rateLimitAuthenticated"),
        get("supportedFormats"),
        get("maxRecords"),
      ]);
      return {
        rateLimits: {
          anonymous: (typeof anonLimit === 'number' ? anonLimit : 5),
          authenticated: (typeof authLimit === 'number' ? authLimit : 20),
        },
        supportedFormats: (Array.isArray(formats) ? formats : ["json", "sql", "csv"]) as string[],
        maxRecords: (typeof maxRec === 'number' ? maxRec : 100),
      };
    } catch (error) {
      console.error("Error fetching global settings from Edge Config:", error);
      // Fallback defaults if Edge Config fetch fails
      return { rateLimits: { anonymous: 5, authenticated: 20 }, supportedFormats: ["json", "sql", "csv"], maxRecords: 100, error: (error as Error).message };
    }
  } else {
       console.log("Using default global settings (Edge Config not available)");
       // Defaults if Edge Config is not configured
      return { rateLimits: { anonymous: 5, authenticated: 20 }, supportedFormats: ["json", "sql", "csv"], maxRecords: 100 };
  }
}

// ======================================================================
// ==================== UTILITY FUNCTIONS ===============================
// ======================================================================

// Get schema count for a user
export async function getSchemaCount(userId: string): Promise<number> {
  if (!userId) return 0;
  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
      try {
          return await kv.scard(`user:${userId}:schemas`);
      } catch (error) {
          console.error(`Error getting schema count from KV for user ${userId}:`, error);
          return 0;
      }
  }
  // Use mock/memory storage otherwise
  // TODO: move local browser storage.
  if (isServerEnvironment()) {
      return Object.keys(serverMemoryStorage.schemas[userId] || {}).length;
  } else {
      return 0;
  }
}

// Check if a schema exists (and belongs to user)
export async function schemaExists(
  userId: string,
  schemaId: string
): Promise<boolean> {
  if (!userId || !schemaId) return false;
  const schema = await getSchema(userId, schemaId);
  return schema !== null;
}

// Helper to clear user-specific schemas from storage
export async function clearUserSchemas(userId: string): Promise<boolean> {
  if (!userId) return false;
  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      console.log(`Using Vercel KV to clear schemas for user ${userId}`);
      const schemaIds = await kv.smembers(`user:${userId}:schemas`);
      const tx = kv.multi();
      if (schemaIds && schemaIds.length > 0) {
        const validIds = schemaIds.filter(id => typeof id === 'string') as string[];
        validIds.forEach(id => tx.del(`schema:${id}`));
      }
      tx.del(`user:${userId}:schemas`);
      tx.del(`user:${userId}:recent_schemas`);
      await tx.exec();
      console.log(`Cleared Vercel KV schemas for user ${userId}`);
      // Also clear from memory if in server context
      if (isServer) {
        delete serverMemoryStorage.schemas[userId];
        delete serverMemoryStorage.recentSchemas[userId];
      }
      return true;
    } catch (error) {
      console.error(`Error clearing schemas from KV for user ${userId}:`, error);
      return false;
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    console.log(`Clearing mock storage schemas for user ${userId}`);
    if (serverMemoryStorage.schemas[userId]) serverMemoryStorage.schemas[userId] = {};
    if (serverMemoryStorage.recentSchemas[userId]) serverMemoryStorage.recentSchemas[userId] = [];
    return true;
  } else {
    return false;
  }
}

// Helper to clear user-specific generation history from storage
export async function clearUserHistory(userId: string): Promise<boolean> {
  if (!userId) return false;
  const isServer = isServerEnvironment();

  // Use Vercel KV if configured
  if (!useMockStorage && typeof kv !== "undefined") {
    try {
      console.log(`Using Vercel KV to clear history for user ${userId}`);
      await kv.del(`user:${userId}:history`);
      console.log(`Cleared Vercel KV history for user ${userId}`);
      // Also clear from memory if in server context
      if (isServer) {
        delete serverMemoryStorage.history[userId];
      }
      return true;
    } catch (error) {
      console.error(`Error clearing history from KV for user ${userId}:`, error);
      return false;
    }
  }

  // Use mock/memory storage otherwise (only in server environment)
  // TODO: move local browser storage.
  if (isServer) {
    console.log(`Clearing mock storage history for user ${userId}`);
    if (serverMemoryStorage.history[userId]) serverMemoryStorage.history[userId] = [];
    return true;
  } else {
    return false;
  }
}

// Helper to clear everything (MOCK STORAGE ONLY - DOES NOT TOUCH KV)
export async function clearAllStorage(): Promise<boolean> {
  const isServer = isServerEnvironment();
  // Only clear mock storage, never clear actual KV this way
  if (useMockStorage && isServer) {
    console.log("Clearing ALL server memory mock storage...");
    serverMemoryStorage.schemas = {};
    serverMemoryStorage.recentSchemas = {};
    serverMemoryStorage.history = {};
    return true;
  } else if (!useMockStorage) {
    console.warn("clearAllStorage called with Vercel KV configured. Operation deliberately skipped to prevent data loss.");
    return false;
  } else {
    console.warn("clearAllStorage called in client environment, operation skipped.");
    return false;
  }
}

// Test KV connection by setting and getting a test value
// TODO: remove this when not needed anymore
export async function testKvConnection(): Promise<boolean> {
  if (useMockStorage) {
    console.log("Using mock storage - KV connection test skipped");
    return false;
  }
  
  try {
    const testKey = `kv:connection:test:${Date.now()}`;
    const testValue = `Connection test at ${new Date().toISOString()}`;
    
    await kv.set(testKey, testValue);
    const retrievedValue = await kv.get(testKey);
    
    // Clean up
    await kv.del(testKey);
    
    if (retrievedValue === testValue) {
      console.log("KV Connection Test: SUCCESS");
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("KV Connection Test: ERROR", error);
    return false;
  }
}
