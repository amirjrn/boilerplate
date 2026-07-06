module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/generated/**',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    // '^(.*)\\.js$': '$1', // Removed as it breaks node_modules imports like ipaddr.js
    '^jose$': '<rootDir>/test/__mocks__/jose.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jose|superjson|copy-anything|is-what)/)',
  ],
  setupFiles: ['<rootDir>/test/jest-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-teardown-hooks.ts'],
  // Custom sequencer ensures integration tests run after unit tests
  testSequencer: '<rootDir>/test/jest-sequencer.js',
};
