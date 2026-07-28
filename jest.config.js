/**
 * The liveness reducer is pure TypeScript with no React or native imports, so
 * it runs under the plain node preset — no jest-expo transform needed, which
 * keeps the test run fast enough to use while tuning thresholds.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
