module.exports = {
    preset: 'ts-jest',

    testEnvironment: 'node',

    testMatch: [
        "**/tests/**/*.test.ts"
    ],

    rootDir: './',

    roots: [
        "<rootDir>/src",
        "<rootDir>/tests"
    ],

    testPathIgnorePatterns: [
        "/node_modules/",
        "/src/generated/"
    ],

    clearMocks: true,

    transform: {
            '^.+\\.tsx?$': [
                'ts-jest', 
                {
                    tsconfig: 'tsconfig.json',
                }
            ],
        },

    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/generated/**"
    ],

    coverageDirectory: "coverage",

    coverageThreshold:{
        global:{
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    moduleNameMapper:{

    }, 
};