// TODO: improve this test, eslint is disabled for several lines
import rateLimit from '@/lib/middleware/rate-limit';
import * as redisAdapter from '@/lib/redis-adapter';
import type { NextApiResponse } from 'next';

// Mock the Redis adapter
jest.mock('@/lib/redis-adapter', () => ({
  redisIncr: jest.fn(),
  redisExpire: jest.fn(),
}));

// Create a type that matches just what we need for the tests
type MockResponse = Pick<NextApiResponse, 'setHeader'>;

describe('Rate Limit Middleware', () => {
  let res: MockResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    res = {
      setHeader: jest.fn(),
    };
  });
  
  it('should allow requests within rate limit', async () => {
    (redisAdapter.redisIncr as jest.Mock).mockResolvedValue('5');
    (redisAdapter.redisExpire as jest.Mock).mockResolvedValue(1);
    
    const limiter = rateLimit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await limiter.check(res as any, 10, 'test');
    
    // Assertions
    expect(result.success).toBe(true);
    expect(redisAdapter.redisIncr).toHaveBeenCalledWith('ratelimit_middleware_test');
    expect(redisAdapter.redisExpire).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
  });
  
  it('should set expiry for first request in window', async () => {
    // Setup mocks
    (redisAdapter.redisIncr as jest.Mock).mockResolvedValue('1');
    (redisAdapter.redisExpire as jest.Mock).mockResolvedValue(1);
    
    const limiter = rateLimit({ interval: 60000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await limiter.check(res as any, 10, 'test');
    
    // Assertions
    expect(result.success).toBe(true);
    expect(redisAdapter.redisIncr).toHaveBeenCalledWith('ratelimit_middleware_test');
    expect(redisAdapter.redisExpire).toHaveBeenCalledWith('ratelimit_middleware_test', 60);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
  });
  
  it('should handle requests over rate limit', async () => {
    // Setup mocks to simulate rate limit exceeded
    (redisAdapter.redisIncr as jest.Mock).mockResolvedValue('100');
    
    const limiter = rateLimit();
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await limiter.check(res as any, 10, 'test');
      // verify headers were set
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    } catch (error) {
      expect((error as Error).message).toContain('Rate limit exceeded');
    }
  });
  
  it('should allow requests despite Redis errors', async () => {
    // Setup mocks
    (redisAdapter.redisIncr as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    const limiter = rateLimit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await limiter.check(res as any, 10, 'test');
    
    expect(result.success).toBe(true);
  });
}); 