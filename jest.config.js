module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  verbose: true,
  collectCoverage: true,
  coverageReporters: ["json", "text", "lcov", "clover"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/coverage/"
  ],
};
