const fs = require('fs');
const path = require('path');

console.log('--- Custom Test Runner ---');

const testDir = path.resolve(__dirname, 'tests');
let testsPassed = 0;
let testsFailed = 0;
let totalTests = 0;

// Find and run all test files in the 'tests' directory
fs.readdirSync(testDir)
    .filter(file => file.endsWith('.js'))
    .forEach(file => {
        console.log(`\n▶ Running suite: ${file}`);
        const testSuitePath = path.join(testDir, file);
        try {
            const { tests } = require(testSuitePath);
            for (const testName in tests) {
                totalTests++;
                try {
                    tests[testName]();
                    console.log(`  ✔ PASS: ${testName}`);
                    testsPassed++;
                } catch (error) {
                    console.error(`  ✖ FAIL: ${testName}`);
                    // Indent error for readability
                    const indentedError = error.stack.replace(/^/gm, '    ');
                    console.error(indentedError);
                    testsFailed++;
                }
            }
        } catch (suiteError) {
            console.error(`\n✖ ERROR: Could not load test suite ${file}.`);
            console.error(suiteError);
            // If the suite fails to load, we count it as a major failure.
            testsFailed++;
        }
    });

console.log('\n-------------------');
console.log(`Test Run Summary:`);
console.log(`  Total Tests: ${totalTests}`);
console.log(`  ✔ Passed: ${testsPassed}`);
console.log(`  ✖ Failed: ${testsFailed}`);
console.log('-------------------\n');

// Exit with a non-zero code if any tests failed, for CI/automation purposes.
if (testsFailed > 0) {
    process.exit(1);
}
