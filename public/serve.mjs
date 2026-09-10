import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

const server = http.createServer(async (req, res) => {
  try {
    const rawPath = req.url ? req.url.split('?')[0] : '/';
    const decodedPath = decodeURIComponent(rawPath);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const safePath = normalize(join(root, relativePath));

    if (!safePath.startsWith(root)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' });
      res.end('not found');
      return;
    }

    const ext = extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const data = await readFile(safePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' });
    res.end('not found');
  }
});

const PORT = Number(process.env.PORT) || 8123;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
