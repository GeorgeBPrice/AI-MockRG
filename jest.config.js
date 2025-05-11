import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Expanded transformIgnorePatterns to include more ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|next-auth|@panva|jose|openid-client)/)' 
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/public/',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 9,
      functions: 9,
      lines: 10,
      statements: 10,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};

export default createJestConfig(customJestConfig);