module.exports = {
  // Use ts-jest to process TypeScript files
  preset: 'ts-jest', 
  
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/tests/**/*.test.ts"
  ],

  // Root directory of the project
  rootDir: './',

  // Directory that contains the source files (useful for code coverage)
  roots: [
    "<rootDir>/src",
    "<rootDir>/tests"
  ],

  // Ignore files in node_modules and the generated Prisma client
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/generated/"
  ],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Set the location of your TypeScript configuration file
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },

  // --- ENHANCEMENTS START HERE ---

  // 1. Code Coverage Configuration
  // This tells Jest to collect coverage data and where to look for source files
  collectCoverage: true,
  collectCoverageFrom: [
    // Include all .ts files in the src directory, but exclude the generated Prisma client
    "src/**/*.ts", 
    "!src/generated/**"
  ],
  // Output format for coverage reports
  coverageDirectory: "coverage",
  // Minimum coverage thresholds (adjust as your project grows)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // 2. Module Name Mapping
  // This helps Jest resolve modules that use absolute paths (e.g., '@src/services/group-service')
  // Note: This often mirrors the "paths" setting in your tsconfig.json.
  moduleNameMapper: {
    // If you used '@src' as an alias in tsconfig.json:
    // "^@src/(.*)$": "<rootDir>/src/$1" 
  },
};
