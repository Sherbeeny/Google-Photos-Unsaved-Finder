module.exports = {
  transform: {},
  testEnvironment: 'jest-environment-jsdom',
  // Ignore Playwright tests, as they have their own runner
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
