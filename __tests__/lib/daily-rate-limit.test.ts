import { checkDailyLimit, incrementDailyUsage, getCurrentDailyUsage } from '@/lib/daily-rate-limit';
import * as redisAdapter from '@/lib/redis-adapter';
import * as storage from '@/lib/storage';

// Mock the Redis adapter
jest.mock('@/lib/redis-adapter', () => ({
  redisGet: jest.fn(),
  redisIncr: jest.fn(),
  redisExpire: jest.fn(),
}));

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  getGlobalSettings: jest.fn(),
}));

describe('Daily Rate Limit', () => {
  const originalDate = global.Date;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Date to return a fixed timestamp
    const mockDate = new Date('2023-05-15T12:00:00Z');
    global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
    global.Date.now = jest.fn(() => mockDate.getTime());
    (storage.getGlobalSettings as jest.Mock).mockResolvedValue({
      rateLimits: {
        anonymous: 5,
        authenticated: 20,
      },
    });
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });
  
  describe('checkDailyLimit', () => {
    it('should bypass limits for users with their own API key', async () => {
      const result = await checkDailyLimit({
        identifier: 'user123',
        usesOwnApiKey: true,
      });
      
      expect(result).toEqual({
        success: true,
        limit: Infinity,
        remaining: Infinity,
        resetTimestamp: 0,
      });
      expect(redisAdapter.redisGet).not.toHaveBeenCalled();
    });
    
    it('should return success when under the limit', async () => {
      (redisAdapter.redisGet as jest.Mock).mockResolvedValue('3');
      
      const result = await checkDailyLimit({
        identifier: 'user123',
        usesOwnApiKey: false,
      });
      
      // Verify mocks were called
      expect(redisAdapter.redisGet).toHaveBeenCalledWith('free-gen:user123:2023-05-15');
      
      expect(result).toEqual({
        success: true,
        limit: 5,
        remaining: 2,
        resetTimestamp: expect.any(Number),
      });
    });
    
    it('should set expiry when this is the first request of the day', async () => {
      (redisAdapter.redisGet as jest.Mock).mockResolvedValue('0');
      
      await checkDailyLimit({
        identifier: 'user123',
        usesOwnApiKey: false,
      });
      
      expect(redisAdapter.redisExpire).toHaveBeenCalledWith(
        'free-gen:user123:2023-05-15',
        expect.any(Number)
      );
    });
    
    it('should return failure when over the limit', async () => {
      (redisAdapter.redisGet as jest.Mock).mockResolvedValue('5');
      
      const result = await checkDailyLimit({
        identifier: 'user123',
        usesOwnApiKey: false,
      });
      
      expect(result).toEqual({
        success: false,
        limit: 5,
        remaining: 0,
        resetTimestamp: expect.any(Number),
      });
    });
  });
  
  describe('incrementDailyUsage', () => {
    it('should increment usage count and set expiry', async () => {
      (redisAdapter.redisIncr as jest.Mock).mockResolvedValue(1);
      (redisAdapter.redisExpire as jest.Mock).mockResolvedValue(1);
      
      await incrementDailyUsage('user123');
      
      expect(redisAdapter.redisIncr).toHaveBeenCalledWith('free-gen:user123:2023-05-15');
      expect(redisAdapter.redisExpire).toHaveBeenCalledWith(
        'free-gen:user123:2023-05-15',
        expect.any(Number)
      );
    });
  });
  
  describe('getCurrentDailyUsage', () => {
    it('should return current usage data', async () => {
      (redisAdapter.redisGet as jest.Mock).mockResolvedValue('2');
      
      const result = await getCurrentDailyUsage('user123');
      
      expect(redisAdapter.redisGet).toHaveBeenCalledWith('free-gen:user123:2023-05-15');
      
      expect(result).toEqual({
        used: 2,
        limit: 5,
        remaining: 3,
        resetTimestamp: expect.any(Number),
      });
    });
    
    it('should handle no existing usage data', async () => {
      (redisAdapter.redisGet as jest.Mock).mockResolvedValue(null);
      
      const result = await getCurrentDailyUsage('user123');
      
      expect(result).toEqual({
        used: 0,
        limit: 5,
        remaining: 5,
        resetTimestamp: expect.any(Number),
      });
    });
  });
}); 