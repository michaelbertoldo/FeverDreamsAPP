module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|@expo|expo|@expo/(.*)|react-clone-referenced-element|@react-native-community|@react-navigation)',
    ],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
    testMatch: [
      '<rootDir>/src/tests/**/*.(test|spec).(ts|tsx|js|jsx)',
    ],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/tests/**/*',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    testEnvironment: 'jsdom',
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };