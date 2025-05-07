import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { incrementDailyUsage, checkDailyLimit } from '../../../lib/daily-rate-limit';
import rateLimit from '../../../lib/middleware/rate-limit';

// Apply rate limit middleware
const limiter = rateLimit({
  interval: 60 * 1000,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply rate limiting to the API endpoint itself
    try {
      await limiter.check(res, 10, 'increment_usage_api'); // 10 requests per minute
    } catch (error) {
      // Log the error but continue - we don't want to block generation due to rate limit
      console.warn('Rate limit hit on increment API:', error);
    }

    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    // Check if user is using their own API key
    const { usesOwnApiKey = false } = req.body;
    
    // If using own API key, allow without checking limits
    if (usesOwnApiKey) {
      return res.status(200).json({
        success: true,
        limitInfo: {
          success: true,
          limit: Infinity,
          remaining: Infinity,
          resetTimestamp: 0
        }
      });
    }
    
    // Determine identifier (user ID or IP)
    const identifier = session?.user?.email || 
                      req.headers['x-forwarded-for'] as string || 
                      req.socket.remoteAddress || 
                      'unknown';
    
    try {
      // First check if user has hit limit
      const limitCheck = await checkDailyLimit({
        identifier,
        usesOwnApiKey
      });
      
      // If limit is exceeded
      if (!limitCheck.success) {
        return res.status(429).json({
          error: 'Daily generation limit exceeded',
          limitInfo: limitCheck,
        });
      }
      
      // Increment usage if user didn't hit limit and is not using own API key
      if (!usesOwnApiKey) {
        await incrementDailyUsage(identifier);
      }
      
      // Get updated usage data
      const updatedCheck = await checkDailyLimit({
        identifier,
        usesOwnApiKey
      });
      
      return res.status(200).json({
        success: true,
        limitInfo: updatedCheck
      });
    } catch (redisError) {
      // If Redis fails, still allow the request (fail open)
      console.error('Redis error in increment API:', redisError);
      return res.status(200).json({
        success: true,
        limitInfo: {
          success: true,
          limit: 5,
          remaining: 4, // Assume 1 used to be cautious
          resetTimestamp: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
        }
      });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
    
    // Fail open - allow the request even on error
    return res.status(200).json({
      success: true,
      limitInfo: {
        success: true,
        limit: 5,
        remaining: 4, // Assume 1 used to be cautious
        resetTimestamp: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
      },
      error: 'An error occurred, but generation is allowed'
    });
  }
} 