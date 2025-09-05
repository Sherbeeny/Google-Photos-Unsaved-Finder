import globals from 'globals';
import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/', '.pnpm-store/', 'coverage/'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        GM_registerMenuCommand: 'readonly',
        GM_addStyle: 'readonly',
        GM_info: 'readonly',
        unsafeWindow: 'readonly',
        global: 'readonly',
        process: 'readonly',
        testingExports: 'writable',
      },
    },
    rules: {
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-unused-vars': ['warn', { 'args': 'none', 'varsIgnorePattern': '^(start|loadAlbumData|sourceSelect)$' }],
    },
  },
  {
    files: ['src/google_photos_unsaved_finder.user.js'],
    languageOptions: {
      sourceType: 'script',
    },
  },
  {
    files: ['tests/**/*.test.js', 'jest.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
];
