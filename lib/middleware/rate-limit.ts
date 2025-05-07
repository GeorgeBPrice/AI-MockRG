import type { NextApiResponse } from 'next';
import { redisIncr, redisExpire } from '../redis-adapter';

export default function rateLimit({
  interval = 60 * 1000, // 1 minute in milliseconds
} = {}) {
  // Create a new limiter
  return {
    check: async (res: NextApiResponse, limit: number, identifier?: string) => {
      const tokenIdentifier = identifier || 'GLOBAL';
      const tokenKey = `ratelimit_middleware_${tokenIdentifier}`;
      
      // Increase limit in development
      const isDev = process.env.NODE_ENV === 'development';
      const effectiveLimit = isDev ? Math.max(limit * 5, 50) : limit;
      
      try {
        // Get current count from Redis and increment
        const count = parseInt(await redisIncr(tokenKey) as unknown as string, 10);
        
        // Set expiry if this is the first request in the window
        if (count === 1) {
          await redisExpire(tokenKey, Math.floor(interval / 1000));
        }
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', effectiveLimit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, effectiveLimit - count));
        
        // If over limit, reject the request
        if (count > effectiveLimit) {
          res.setHeader('Retry-After', Math.floor(interval / 1000));
          console.warn(`Rate limit exceeded for ${tokenIdentifier}, count: ${count}, limit: ${effectiveLimit}`);
          
          // In development, optionally still allow the request to go through
          if (isDev) {
            console.log('Rate limit bypassed in development mode');
            return { success: true };
          }
          
          throw new Error(`Rate limit exceeded for ${tokenIdentifier}`);
        }
        
        return { success: true };
      } catch (error) {
        // Only rethrow if it's a rate limit error and we're not in dev
        if (error instanceof Error && 
            error.message.includes('Rate limit exceeded') && 
            !isDev) {
          throw error;
        }
        
        // If Redis fails or we're in dev, still allow the request (fail open/fail safe...or something like that)
        console.error('Error in rate limit middleware:', error);
        return { success: true };
      }
    },
  };
} 