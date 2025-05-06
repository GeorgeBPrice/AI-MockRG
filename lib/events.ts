import { 
  addToStream,
  readFromStream,
  getStreamLength,
  trimStream,
  createConsumerGroup,
  readFromGroup,
  acknowledgeMessage
} from './redis-client';

// Event keys - these are the keys used to store the events in Redis
const GENERATION_EVENTS_STREAM = 'generation:events';
const USER_ACTIVITY_STREAM = 'user:activity';

export type GenerationEvent = {
  userId: string;
  schemaId?: string;
  schemaName?: string;
  recordsCount: number;
  format: string;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
};

export type UserActivityEvent = {
  userId: string;
  action: 'login' | 'logout' | 'save_schema' | 'delete_schema' | 'update_schema' | 'generate';
  details?: string;
  timestamp: string;
};

// Record a generation event
export async function recordGenerationEvent(event: Omit<GenerationEvent, 'timestamp'>) {
  const timestamp = new Date().toISOString();
  
  // Convert all values to strings as required by Redis Streams
  const data: Record<string, string> = {
    userId: event.userId,
    schemaId: event.schemaId || '',
    schemaName: event.schemaName || '',
    recordsCount: event.recordsCount.toString(),
    format: event.format,
    success: event.success.toString(),
    errorMessage: event.errorMessage || '',
    timestamp
  };
  
  await addToStream(GENERATION_EVENTS_STREAM, data);
  
  // redis stream length - if it gets too large, trim it (only so much a log should have)
  const streamLength = await getStreamLength(GENERATION_EVENTS_STREAM);
  if (streamLength > 1000) {
    await trimStream(GENERATION_EVENTS_STREAM, 500);
  }
  
  return { ...event, timestamp };
}

export async function recordUserActivity(event: Omit<UserActivityEvent, 'timestamp'>) {
  const timestamp = new Date().toISOString();
  
  const data: Record<string, string> = {
    userId: event.userId,
    action: event.action,
    details: event.details || '',
    timestamp
  };
  
  await addToStream(USER_ACTIVITY_STREAM, data);
  
  const streamLength = await getStreamLength(USER_ACTIVITY_STREAM);
  if (streamLength > 5000) {
    await trimStream(USER_ACTIVITY_STREAM, 1000);
  }
  
  return { ...event, timestamp };
}

export async function getRecentGenerationEvents(count = 10) {
  const results = await readFromStream(GENERATION_EVENTS_STREAM, { count });
  
  if (!results || !results[0] || !results[0].messages) return [];
  
  // Parse stream entries into GenerationEvent objects
  return results[0].messages.map(message => {
    const { id, message: data } = message;
    
    return {
      id,
      userId: data.userId,
      schemaId: data.schemaId || undefined,
      schemaName: data.schemaName || undefined,
      recordsCount: parseInt(data.recordsCount),
      format: data.format,
      success: data.success === 'true',
      errorMessage: data.errorMessage || undefined,
      timestamp: data.timestamp
    };
  });
}

// Get recent generation events for a specific user
export async function getUserGenerationEvents(userId: string, count = 10) {
  if (!userId) return [];
  
  try {
    const { kv } = await import('./kv-adapter');
    
    // Check if Vercel KV is available
    if (typeof kv !== "undefined") {

      const key = `user:${userId}:history`;
      
      const historyJson = await kv.lrange(key, 0, count - 1);
      if (!historyJson || !Array.isArray(historyJson) || historyJson.length === 0) {
        return [];
      }
      
      // Parse the JSON strings from Redis, or use the object if it's already an object
      return historyJson.map(item => {
        try {
          let parsed;
          if (typeof item === 'object' && item !== null) {
            parsed = item;
          } else {
            parsed = JSON.parse(String(item));
          }
          
          return {
            id: parsed.id,
            userId,
            schemaId: parsed.schemaId,
            schemaName: parsed.schemaName,
            recordsCount: parsed.recordsCount || 0,
            format: parsed.format || 'unknown',
            success: parsed.success !== false,
            errorMessage: parsed.errorMessage,
            timestamp: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : new Date().toISOString()
          };
        } catch (e) {
          console.error(`Failed to parse event item for user ID ${userId}:`, item, e);
          return null;
        }
      }).filter(event => event !== null);
    }
    
    // Fallback to the original implementation if KV isn't available
    const allEvents = await getRecentGenerationEvents(100);
    const userEvents = allEvents.filter(event => event.userId === userId);
    return userEvents.slice(0, count);
  } catch (error) {
    console.error(`Error fetching events for user ID ${userId}:`, error);
    return [];
  }
}

// Setup consumer group for processing generation events
// Consumer groups in Redis Streams allow multiple consumers to process events cooperatively.
// Each message is delivered to only one consumer within a group, enabling parallel processing
// while ensuring each event is handled exactly once. Consumer groups also track acknowledgments,
// allowing unacknowledged messages to be reprocessed if a consumer fails.
export async function setupGenerationEventsConsumer(groupName: string) {
  await createConsumerGroup(GENERATION_EVENTS_STREAM, groupName);
}

// Process generation events in a consumer group
export async function processGenerationEvents(
  groupName: string,
  consumerName: string,
  handler: (event: GenerationEvent & { id: string }) => Promise<void>,
  options = { count: 5, blockMs: 2000 }
) {
  const results = await readFromGroup(
    GENERATION_EVENTS_STREAM,
    groupName,
    consumerName,
    options
  );
  
  if (!results || results === 0) return 0;
  
  let processedCount = 0;
  
  for (const message of results[0].messages) {
    const { id, message: data } = message;
    
    const event = {
      id,
      userId: data.userId,
      schemaId: data.schemaId || undefined,
      schemaName: data.schemaName || undefined,
      recordsCount: parseInt(data.recordsCount),
      format: data.format,
      success: data.success === 'true',
      errorMessage: data.errorMessage || undefined,
      timestamp: data.timestamp
    };
    
    try {
      await handler(event);
      await acknowledgeMessage(GENERATION_EVENTS_STREAM, groupName, id);
      processedCount++;
    } catch (error) {
      console.error('Error processing generation event:', error);
    }
  }
  
  return processedCount;
} 