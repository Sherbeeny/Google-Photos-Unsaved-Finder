const unzip = require('unzip-crx-3');
const fs = require('fs');
const path = require('path');

const crxPath = path.join(__dirname, '..', 'tampermonkey', 'tampermonkey.crx');
const outputPath = path.join(__dirname, '..', 'tampermonkey', 'unpacked');

// Ensure the output directory exists and is empty to prevent errors
if (fs.existsSync(outputPath)) {
  fs.rmSync(outputPath, { recursive: true, force: true });
}
// The library expects the directory to exist.
fs.mkdirSync(outputPath, { recursive: true });

(async () => {
  try {
    console.log(`Unzipping ${crxPath} to ${outputPath}...`);
    await unzip(crxPath, outputPath);
    console.log('Successfully unzipped your crx file.');
  } catch (error) {
    console.error('An error occurred during unzipping:', error);
  }
})();
