import https from 'https';
import fs from 'fs';
import path from 'path';
import selfsigned from 'selfsigned';

const pems = selfsigned.generate(
  [{ name: 'commonName', value: 'photos.google.com' }],
  {
    days: 365,
    keySize: 2048,
    algorithm: 'sha256',
    // Add SAN for localhost
    altNames: [{ type: 2, value: 'localhost' }]
  }
);

const options = {
  key: pems.private,
  cert: pems.cert
};

const PORT = 8443;
let server;

function start() {
  return new Promise((resolve) => {
    server = https.createServer(options, (req, res) => {
      const url = new URL(req.url, `https://localhost:${PORT}`);
      let filePath = path.join(process.cwd(), 'mocks', url.pathname);

      if (url.pathname === '/') {
        filePath = path.join(process.cwd(), 'mocks', 'photos.html');
      }

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }
        res.writeHead(200);
        res.end(content);
      });
    });

    server.listen(PORT, () => {
      console.log(`Mock server running at https://localhost:${PORT}`);
      resolve();
    });
  });
}

function stop() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Mock server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export { start, stop };
