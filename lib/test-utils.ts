import { Session } from 'next-auth';
import { NextApiRequest, NextApiResponse } from 'next';

interface MockSessionOptions {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
  expires?: string;
}

export function mockSession(options: MockSessionOptions = {}): Session {
  return {
    user: {
      id: options.user?.id || '123',
      email: options.user?.email || 'test@example.com',
      name: options.user?.name || 'Test User',
      image: options.user?.image || null,
    },
    expires: options.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function mockRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
} = {}): Partial<NextApiRequest> {
  return {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
  };
}

export function mockResponse(): Partial<NextApiResponse> {
  const res: Partial<NextApiResponse> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
} 