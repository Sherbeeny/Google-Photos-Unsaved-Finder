import { readFile, writeFile } from 'fs/promises';

const originalPath = 'scripts/gptk.original.user.js';
const testPath = 'scripts/gptk.test.user.js';
const matchLine = '// @match *://127.0.0.1/*';

async function patchGptk() {
  try {
    const originalContent = await readFile(originalPath, 'utf8');
    const lines = originalContent.split('\n');

    // Find the end of the metadata block
    const metadataEndIndex = lines.findIndex(line => line.trim() === '// ==/UserScript==');

    if (metadataEndIndex === -1) {
      throw new Error('Could not find UserScript metadata block in GPTK script.');
    }

    // Insert the new @match directive before the end of the metadata block
    lines.splice(metadataEndIndex, 0, matchLine);

    const newContent = lines.join('\n');
    await writeFile(testPath, newContent);

    console.log(`Successfully patched GPTK for testing. New file created at ${testPath}`);

  } catch (error) {
    console.error('Failed to patch GPTK script:', error);
    process.exit(1);
  }
}

patchGptk();
