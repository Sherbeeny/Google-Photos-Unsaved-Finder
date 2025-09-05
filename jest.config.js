/** @type {import('jest').Config} */
module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-jsdom',

  // A map from regular expressions to paths to transformers
  // The default transformer works well with CommonJS (which our 'eval' approach uses)
  transform: {},

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};
