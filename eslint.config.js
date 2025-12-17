// eslint.config.js
"use strict";

// Import the ESLint plugin for Jest
const jestPlugin = require("eslint-plugin-jest");

module.exports = [
  {
    // Base configuration for all files
    ignores: ["tampermonkey/unpacked/**", "scripts/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        // Browser and Node.js globals
        ...require("globals").browser,
        ...require("globals").node,
        // Tampermonkey globals
        GM_registerMenuCommand: "readonly",
        GM_addStyle: "readonly",
        GM_info: "readonly",
        unsafeWindow: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "semi": ["error", "always"],
    },
  },
  {
    // Configuration for test files
    files: ["**/*.test.js", "jest.setup.js"],
    ...jestPlugin.configs["flat/recommended"],
    rules: {
      ...jestPlugin.configs["flat/recommended"].rules,
      // Add any additional Jest-specific rules here
    },
  },
];
