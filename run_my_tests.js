const fs = require('fs');
const path = require('path');
const getMetadata = () => {
    const scriptPath = path.resolve(__dirname, 'src', 'main.user.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const header = scriptContent.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
    if (!header) return {};
    const meta = {};
    const lines = header[1].match(/@\S+\s+.*/g) || [];
    lines.forEach(line => { const [, key, value] = line.match(/@(\S+)\s+(.*)/); meta[key] = value.trim(); });
    return meta;
};
console.log('--- Custom Test Runner ---');
const testDir = path.resolve(__dirname, 'tests');
let testsPassed = 0; let testsFailed = 0; let totalTests = 0;
fs.readdirSync(testDir).filter(file => file.endsWith('.js')).forEach(file => {
    console.log(`\n▶ Running suite: ${file}`);
    const testSuitePath = path.join(testDir, file);
    try {
        const { tests } = require(testSuitePath);
        const metadata = file.includes('metadata') ? getMetadata() : undefined;
        for (const testName in tests) {
            totalTests++;
            try { tests[testName](metadata); console.log(`  ✔ PASS: ${testName}`); testsPassed++; }
            catch (error) { console.error(`  ✖ FAIL: ${testName}`); console.error(error.stack.replace(/^/gm, '    ')); testsFailed++; }
        }
    } catch (suiteError) { console.error(`\n✖ ERROR: Could not load test suite ${file}.`); console.error(suiteError); testsFailed++; }
});
console.log('\n-------------------');
console.log(`Test Run Summary:`);
console.log(`  Total Tests: ${totalTests}, ✔ Passed: ${testsPassed}, ✖ Failed: ${testsFailed}`);
console.log('-------------------\n');
if (testsFailed > 0) { process.exit(1); }
