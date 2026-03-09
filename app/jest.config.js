/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testMatch: ["<rootDir>/src/**/*.test.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native|expo)/)",
  ],
  testEnvironment: "node",
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
};
