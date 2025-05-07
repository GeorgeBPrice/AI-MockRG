import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCurrentDailyUsage } from '../../../lib/daily-rate-limit';
import rateLimit from '../../../lib/middleware/rate-limit';

// Apply rate limit middleware
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Apply rate limiting to the API endpoint itself
    try {
      await limiter.check(res, 10, 'daily_usage_api'); // 10 requests per minute, with specific identifier
    } catch (error) {
      // If rate limit is hit, return a default response instead of failing
      console.warn('Rate limit hit on daily usage API:', error);
      return res.status(200).json({
        used: 0,
        limit: 5,
        remaining: 5,
        resetTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        error: 'Rate limited, showing default data'
      });
    }

    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    // Determine identifier (user ID or IP)
    const identifier = session?.user?.email || 
                      req.headers['x-forwarded-for'] as string || 
                      req.socket.remoteAddress || 
                      'unknown';
    
    // Get usage data
    try {
      const usageData = await getCurrentDailyUsage(identifier);
      return res.status(200).json(usageData);
    } catch (redisError) {
      // If Redis fails, return a default response
      console.error('Redis error in daily usage API:', redisError);
      return res.status(200).json({
        used: 0,
        limit: 5,
        remaining: 5,
        resetTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        error: 'Storage error, showing default data'
      });
    }
  } catch (error) {
    console.error('Error fetching daily usage:', error);
    
    return res.status(200).json({
      used: 0,
      limit: 5,
      remaining: 5,
      resetTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      error: 'Unknown error, showing default data'
    });
  }
} 