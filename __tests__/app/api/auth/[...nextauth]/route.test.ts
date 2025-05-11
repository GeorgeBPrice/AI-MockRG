/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/auth/[...nextauth]/route';
import { mockRequest, mockResponse } from '@/lib/test-utils';
import { getServerSession } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock next-auth default export and getServerSession
jest.mock('next-auth', () => {
  // This is the core mock handler that NextAuth() will produce.
  const mockHandlerInstance = jest.fn(async (req: NextApiRequest, res: NextApiResponse) => {
    const { authOptions: mockedAuthOptions } = jest.requireMock('@/lib/auth');
    const url = typeof req.url === 'string' ? req.url : '';

    if (url.includes('session')) {
      const session = await getServerSession(mockedAuthOptions);
      if (session) {
        return res.status(200).json(session);
      }
      return res.status(401).json({ error: 'Unauthorized: No session from mockNextAuthHandlerInstance' });
    }
    if (req.method === 'POST') {
      return res.status(200).json({ message: 'POST action handled by mock' });
    }
    return res.status(200).json({ message: `Mock NextAuth handler for ${req.method} ${url}` });
  });

  return {
    __esModule: true,
    default: jest.fn(() => mockHandlerInstance),
    getServerSession: jest.fn(),
  };
});

// The imported GET and POST are the handler instance from NextAuth(authOptions).
describe('NextAuth API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/[...nextauth]', () => {
    it.skip('should return 401 when no session exists (via mocked handler)', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const req = mockRequest() as NextApiRequest;
      req.url = '/api/auth/session';
      const res = mockResponse() as NextApiResponse;
      
      await GET(req, res); 
      
      expect(GET).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Unauthorized') }));
    });

    it.skip('should return session data when authenticated (via mocked handler)', async () => {
      const sessionData = { user: { id: '123' }, expires: 'tomorrow' };
      (getServerSession as jest.Mock).mockResolvedValue(sessionData);
      
      const req = mockRequest() as NextApiRequest;
      req.url = '/api/auth/session';
      const res = mockResponse() as NextApiResponse;
      
      await GET(req, res);
      
      expect(GET).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sessionData);
    });
  });

  describe('POST /api/auth/[...nextauth]', () => {
    it.skip('should handle sign in request (via mocked handler)', async () => {
      const req = mockRequest({ method: 'POST', body: { action: 'signin' } }) as NextApiRequest;
      req.url = '/api/auth/signin';
      const res = mockResponse() as NextApiResponse;
      
      await POST(req, res); 
      
      expect(POST).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'POST action handled by mock' });
    });

    it.skip('should handle sign out request', async () => {
      const req = mockRequest({
        method: 'POST',
        body: {
          action: 'signout',
        },
      }) as NextApiRequest;
      req.url = '/api/auth/signout';
      const res = mockResponse() as NextApiResponse;
      
      await POST(req, res);
      
      expect(POST).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'POST action handled by mock' });
    });
  });
}); 