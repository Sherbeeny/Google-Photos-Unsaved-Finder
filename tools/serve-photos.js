import { createServer } from 'https';
import { generate } from 'selfsigned';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join, extname } from 'path';

const port = 8080;
const host = '127.0.0.1';

const contentTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

async function serveFile(res, filePath) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      const ext = extname(filePath);
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server Error: ${error.message}`);
    }
  }
}

async function requestHandler(req, res) {
  console.log(`[Server] Received request: ${req.method} ${req.url}`);
  const url = req.url === '/' ? '/photos.html' : req.url;

  // Prioritize mocks directory, then scripts
  const mockPath = join(process.cwd(), 'mocks', url);
  const scriptPath = join(process.cwd(), 'scripts', url);

  try {
    await stat(mockPath);
    return serveFile(res, mockPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If not in mocks, try scripts
      return serveFile(res, scriptPath);
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server Error: ${error.message}`);
    }
  }
}

async function startServer() {
  const attrs = [{ name: 'commonName', value: '127.0.0.1' }];
  const pems = generate(attrs, {
    keySize: 2048,
    algorithm: 'sha256',
    days: 30,
    extensions: [{ name: 'subjectAltName', altNames: [{ type: 2, value: '127.0.0.1' }] }],
  });

  const options = {
    key: pems.private,
    cert: pems.cert,
  };

  const server = createServer(options, requestHandler);

  server.listen(port, host, () => {
    console.log(`Mock HTTPS server running at https://${host}:${port}/`);
    console.log('Serving files from ./mocks and ./scripts');
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

startServer();
