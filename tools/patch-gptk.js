const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '..', 'scripts', 'gptk.original.user.js');
const patchedPath = path.join(__dirname, '..', 'scripts', 'gptk.test.user.js');
const patchString = `// @match        *://127.0.0.1/*`;

try {
  console.log(`Reading original script from: ${originalPath}`);
  const originalContent = fs.readFileSync(originalPath, 'utf8');

  if (originalContent.includes(patchString)) {
    console.log('Script is already patched. Overwriting anyway.');
  }

  const patchedContent = originalContent.replace(
    '// ==/UserScript==',
    `${patchString}\n// ==/UserScript==`
  );

  console.log(`Writing patched script to: ${patchedPath}`);
  fs.writeFileSync(patchedPath, patchedContent);

  console.log('Successfully patched GPTK for testing.');

} catch (error) {
  console.error('Failed to patch GPTK script:', error);
}
