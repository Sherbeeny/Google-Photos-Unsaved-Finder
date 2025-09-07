const https = require('https');
const express = require('express');
const selfsigned = require('selfsigned');
const path = require('path');

const app = express();
const port = 8443;

// --- Generate Self-Signed Certificate ---
// Attributes for the certificate
const attrs = [{ name: 'commonName', value: '127.0.0.1' }];
// Generate the certificate.
// The pems object contains private, public, and cert.
const pems = selfsigned.generate(attrs, {
  days: 365, // Certificate validity
  algorithm: 'sha256',
  keySize: 2048,
});

const credentials = {
  key: pems.private,
  cert: pems.cert,
};

// --- Static File Serving ---
// Define the directories to serve files from
const mocksDir = path.join(__dirname, '..', 'mocks');
const scriptsDir = path.join(__dirname, '..', 'scripts');
const rootDir = path.join(__dirname, '..'); // Serve from root for userscript installation

console.log(`Serving files from the following directories:`);
console.log(`- Mocks: ${mocksDir}`);
console.log(`- Scripts: ${scriptsDir}`);
console.log(`- Root: ${rootDir}`);


// Configure express to serve static files from multiple directories
app.use(express.static(mocksDir));
app.use(express.static(scriptsDir));
app.use(express.static(rootDir)); // Allows accessing userscripts from root path

// --- API Mocking for Album Data ---
// This will be used later to test the userscript's data fetching.
app.get('/api/albums', (req, res) => {
    // This matches the CRITICAL DATA structure from the prompt.
    const mockAlbumData = {
        "items": [
            { "mediaKey": "KEY_1", "title": "test 1" },
            { "mediaKey": "KEY_2", "title": "test 2" }
        ],
        "nextPageId": null
    };
    res.json(mockAlbumData);
});


// --- Start HTTPS Server ---
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, '127.0.0.1', () => {
  console.log(`Mock HTTPS server running at https://127.0.0.1:${port}/`);
  console.log(`- Serving photos.html at https://127.0.0.1:${port}/photos.html`);
  console.log(`- Serving test GPTK script at https://127.0.0.1:${port}/gptk.test.user.js`);
});

// Handle server errors
httpsServer.on('error', (e) => {
  console.error('Server error:', e);
});
