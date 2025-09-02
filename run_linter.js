const fs = require('fs');
const path = require('path');
const { ESLint } = require('./vendor/eslint');
(async function main() {
    console.log('--- Custom Linter ---');
    const eslint = new ESLint({
        overrideConfig: {
            parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
            env: { browser: true, es2021: true },
            globals: { GM_registerMenuCommand: 'readonly', GM_addStyle: 'readonly' },
            rules: {
                'no-unused-vars': 'warn', 'no-undef': 'error',
                'semi': ['error', 'always'], 'quotes': ['error', 'single', { 'avoidEscape': true }],
                'no-console': 'off'
            }
        },
        useEslintrc: false
    });
    const results = await eslint.lintFiles(['src/**/*.js']);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = await formatter.format(results);
    if (resultText) {
        console.error(resultText);
        process.exit(1);
    } else {
        console.log('✔ No linting issues found.');
    }
})().catch((error) => {
    process.exitCode = 1;
    console.error(error);
});
