import { get } from 'https';
import { writeFile, copyFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const gptkUrl = 'https://github.com/xob0t/Google-Photos-Toolkit/releases/latest/download/google_photos_toolkit.user.js';
const gptkDest = 'scripts/gptk.original.user.js';
const ourScriptSrc = 'dist/gpsf.user.js';
const ourScriptDest = 'scripts/saved-finder.user.js';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`Failed to download ${url}: Status ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          await mkdir(dirname(dest), { recursive: true });
          await writeFile(dest, body);
          console.log(`Downloaded ${url} to ${dest}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Failed to download ${url}: ${err.message}`));
    });
  });
}

async function main() {
  try {
    await download(gptkUrl, gptkDest);
    await mkdir(dirname(ourScriptDest), { recursive: true });
    await copyFile(ourScriptSrc, ourScriptDest);
    console.log(`Copied ${ourScriptSrc} to ${ourScriptDest}`);
  } catch (error) {
    console.error('Failed to fetch userscripts:', error);
    process.exit(1);
  }
}

main();
