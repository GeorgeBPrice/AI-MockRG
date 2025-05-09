import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
  }),
}));

jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    signIn: jest.fn(),
    signOut: jest.fn(),
    useSession: jest.fn(() => {
      return { data: null, status: 'unauthenticated' };
    }),
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

jest.mock('redis', () => {
  return {
    createClient: jest.fn(() => ({
      on: jest.fn(),
      connect: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      ttl: jest.fn().mockResolvedValue(3600),
    })),
  };
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
); 