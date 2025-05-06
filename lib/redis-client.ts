import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!client) {
    const redisUrl = process.env.REDIS_UPSTASH_URL_KV_URL || process.env.REDIS_UPSTASH_URL_REDIS_URL;
    
    client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });
    
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
  }
  
  return client;
}

export async function closeRedisClient() {
  if (client) {
    await client.quit();
    client = null;
  }
}

export async function addToStream(
  streamKey: string, 
  data: Record<string, string>
) {
  const client = await getRedisClient();
  return client.xAdd(streamKey, '*', data);
}

export async function readFromStream(
  streamKey: string,
  options: {
    count?: number;
    blockMs?: number;
    id?: string;
  } = {}
) {
  const client = await getRedisClient();
  const { count = 10, blockMs = 0, id = '0' } = options;
  
  if (blockMs > 0) {
    return client.xRead(
      [{ key: streamKey, id }],
      { COUNT: count, BLOCK: blockMs }
    );
  }
  
  return client.xRead(
    [{ key: streamKey, id }],
    { COUNT: count }
  );
}

export async function createConsumerGroup(
  streamKey: string,
  groupName: string,
  id: string = '$'
) {
  const client = await getRedisClient();
  try {
    return await client.xGroupCreate(streamKey, groupName, id, { MKSTREAM: true });
  } catch (err: Error | unknown) {
    if (err instanceof Error && err.message.includes('BUSYGROUP')) {
      return true;
    }
    throw err;
  }
}

export async function readFromGroup(
  streamKey: string,
  groupName: string,
  consumerName: string,
  options: {
    count?: number;
    blockMs?: number;
    id?: string;
  } = {}
) {
  const client = await getRedisClient();
  const { count = 10, blockMs = 0, id = '>' } = options;
  
  if (blockMs > 0) {
    return client.xReadGroup(
      groupName,
      consumerName,
      [{ key: streamKey, id }],
      { COUNT: count, BLOCK: blockMs }
    );
  }
  
  return client.xReadGroup(
    groupName,
    consumerName,
    [{ key: streamKey, id }],
    { COUNT: count }
  );
}

export async function acknowledgeMessage(
  streamKey: string,
  groupName: string,
  id: string
) {
  const client = await getRedisClient();
  return client.xAck(streamKey, groupName, id);
}

export async function getStreamLength(streamKey: string) {
  const client = await getRedisClient();
  return client.xLen(streamKey);
}

export async function trimStream(streamKey: string, maxLen: number) {
  const client = await getRedisClient();
  
  try {
    const currentLength = await getStreamLength(streamKey);
    
    if (currentLength <= maxLen) {
      return 0;
    }
    
    return client.sendCommand(['XTRIM', streamKey, 'MAXLEN', maxLen.toString()]);
  } catch (error) {
    console.error('Error trimming stream:', error);
    throw error;
  }
} 