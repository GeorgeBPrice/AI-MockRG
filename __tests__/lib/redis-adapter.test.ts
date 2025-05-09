import { getRedisClient, redisGet, redisSet, redisIncr, redisExpire, getKeyTTL } from '@/lib/redis-adapter';

// Mock the redis client
jest.mock('redis', () => {
  const mockClient = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
  };
  return {
    createClient: jest.fn(() => mockClient),
  };
});

describe('Redis Adapter', () => {
  let mockRedisClient: {
    on: jest.Mock;
    connect: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    incr: jest.Mock;
    expire: jest.Mock;
    ttl: jest.Mock;
    keys: jest.Mock;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRedisClient = jest.requireMock('redis').createClient();
  });
  
  describe('getRedisClient', () => {
    it('should create a new client if none exists', async () => {
      const client = await getRedisClient();
      
      // verify the connection was called once
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
      expect(client).toBeDefined();
    });
    
    it('should reuse existing client on subsequent calls', async () => {
      const client1 = await getRedisClient();
      
      // Reset the connection mock to verify it's not called again
      mockRedisClient.connect.mockReset();
      
      const client2 = await getRedisClient();
      
      // The connect method should not be called again
      expect(mockRedisClient.connect).not.toHaveBeenCalled();
      expect(client1).toBe(client2);
    });
  });
  
  describe('redisGet', () => {
    it('should call the get method on the Redis client', async () => {
      mockRedisClient.get.mockResolvedValue('test-value');
      
      const result = await redisGet('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });
  });
  
  describe('redisSet', () => {
    it('should call the set method on the Redis client without expiry', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      
      const result = await redisSet('test-key', 'test-value');
      
      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
      expect(result).toBe('OK');
    });
    
    it('should call the set method with expiry when provided', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      
      const result = await redisSet('test-key', 'test-value', 60);
      
      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value', { EX: 60 });
      expect(result).toBe('OK');
    });
  });
  
  describe('redisIncr', () => {
    it('should call the incr method on the Redis client', async () => {
      mockRedisClient.incr.mockResolvedValue(1);
      
      const result = await redisIncr('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(result).toBe(1);
    });
  });
  
  describe('redisExpire', () => {
    it('should call the expire method on the Redis client', async () => {
      mockRedisClient.expire.mockResolvedValue(1);
      
      const result = await redisExpire('test-key', 60);
      
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 60);
      expect(result).toBe(1);
    });
  });
  
  describe('getKeyTTL', () => {
    it('should call the ttl method on the Redis client', async () => {
      mockRedisClient.ttl.mockResolvedValue(60);
      
      const result = await getKeyTTL('test-key');
      
      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test-key');
      expect(result).toBe(60);
    });
  });
}); 