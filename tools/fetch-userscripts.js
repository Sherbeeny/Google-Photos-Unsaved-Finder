const axios = require('axios');
const fs = require('fs');
const path = require('path');

const url = 'https://github.com/xob0t/Google-Photos-Toolkit/releases/latest/download/google_photos_toolkit.user.js';
const outputPath = path.join(__dirname, '..', 'scripts', 'gptk.original.user.js');

async function downloadFile() {
  console.log(`Downloading GPTK from ${url}...`);
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Successfully downloaded and saved to ${outputPath}`);
        resolve();
      });
      writer.on('error', (err) => {
        console.error('Error writing to file:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error.message);
    process.exit(1);
  }
}

downloadFile();
