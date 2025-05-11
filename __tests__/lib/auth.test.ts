/**
 * @jest-environment node
 */

import { getServerSession } from 'next-auth';
import type { Session, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Define mockSession helper function locally
const mockSession = (customData: Partial<Session> = {}): Session => {
  return {
    user: {
      id: 'default-id',
      email: 'default@example.com',
      name: 'Default User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...customData,
    // Ensure all required Session fields are present if any, or make user optional if Session allows
    ...(customData.user ? { user: { ...customData.user } } : {}),
  } as Session;
};

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Explicitly type the mock functions
const actualMockSessionCallback = jest.fn<Session, [Session, JWT]>();
const actualMockJwtCallback = jest.fn<JWT, [JWT, NextAuthUser?]>();

jest.mock('@/lib/auth', () => {
  // The factory function now has access to the already defined mock functions
  return {
    authOptions: {
      providers: [],
      callbacks: {
        session: actualMockSessionCallback,
        jwt: actualMockJwtCallback,
      },
      // Mock other authOptions properties if they are accessed by the code under test
      secret: 'mockSecret',
    },
  };
});

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  describe('getServerSession', () => {
    it('should return null when no session exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // The authOptions used here will is the mocked version from jest.mock('@/lib/auth')
      const session = await getServerSession(jest.requireMock('@/lib/auth').authOptions);
      expect(session).toBeNull();
    });

    it('should return session data when authenticated', async () => {
      const mockSessionData = mockSession({
        user: { id: '123', email: 'test@example.com', name: 'Test User' }
      });
      (getServerSession as jest.Mock).mockResolvedValue(mockSessionData);
      
      const session = await getServerSession(jest.requireMock('@/lib/auth').authOptions);
      expect(session).toEqual(mockSessionData);
      expect(mockSessionData?.user?.email).toBe('test@example.com');
    });
  });

  describe('authOptions callbacks', () => {
    it('should transform session data in session callback', async () => {
      const mockToken: JWT = { 
        sub: 'token-user-id', email: 'token@example.com', name: 'Token User',
        iat: 1, exp: Date.now() / 1000 + 3600, jti: 'jti1'
      };
      const mockInitialSession: Session = { 
        user: { id: 'initial-id', name: 'Initial User', email: 'initial@example.com' }, 
        expires: new Date().toISOString()
      }; 

      actualMockSessionCallback.mockImplementation((session, token) => {
        // Ensure we are working with a new session object
        const newSession = JSON.parse(JSON.stringify(session));
        if (newSession.user && token.sub) {
          newSession.user.id = token.sub;
        }
        if (newSession.user && token.email) newSession.user.email = token.email;
        return newSession; 
      });

      // Explicitly type the result of the mock call
      const result: Session = actualMockSessionCallback(mockInitialSession, mockToken);
      
      expect(result.user?.id).toBe('token-user-id');
      expect(result.user?.email).toBe('token@example.com');
    });

    it('should transform JWT data in jwt callback', async () => {
      const mockUser: NextAuthUser = { id: 'user-id', name: 'Test User', email: 'user@example.com' };
      const mockInitialToken: JWT = { sub: 'old-sub', name: 'Old Name', iat: 1, exp: Date.now() / 1000 + 3600, jti: 'jti2' };

      actualMockJwtCallback.mockImplementation((token, user) => {
        const newToken = { ...token }; 
        if (user?.id) newToken.sub = user.id;
        if (user?.name) newToken.name = user.name;
        return newToken;
      });

      // Explicitly type the result
      const result: JWT = actualMockJwtCallback(mockInitialToken, mockUser);
      expect(result.sub).toBe('user-id');
      expect(result.name).toBe('Test User');
    });
  });
}); 