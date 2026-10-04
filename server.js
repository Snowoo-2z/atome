const http = require('node:http');
const { createReadStream, existsSync } = require('node:fs');
const { stat } = require('node:fs/promises');
const path = require('node:path');

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 4173);
const PING_INTERVAL_MS = 10 * 60 * 1000;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.htm': 'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function getRequestedFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT_DIR, requestedPath);

  if (!filePath.startsWith(`${ROOT_DIR}${path.sep}`) && filePath !== ROOT_DIR) {
    return null;
  }

  const relativePath = path.relative(ROOT_DIR, filePath);
  if (relativePath.split(path.sep).some((segment) => segment.startsWith('.'))) {
    return null;
  }

  return filePath;
}

const server = http.createServer(async (request, response) => {
  if (request.url === '/health') {
    sendJson(response, 200, { status: 'ok', service: 'atome' });
    return;
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  let filePath;
  try {
    filePath = getRequestedFile(request.url);
  } catch {
    sendJson(response, 400, { error: 'Invalid request path' });
    return;
  }

  if (!filePath || !existsSync(filePath)) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  try {
    let fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      if (!existsSync(filePath)) {
        sendJson(response, 404, { error: 'Not found' });
        return;
      }
      fileStats = await stat(filePath);
    }

    if (!fileStats.isFile()) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'Content-Length': fileStats.size,
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error('Unable to serve request:', error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: 'Internal server error' });
    } else {
      response.destroy(error);
    }
  }
});

function getSelfPingUrl() {
  const baseUrl = process.env.SELF_PING_URL || process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return null;

  try {
    return new URL('/health', baseUrl).toString();
  } catch {
    console.warn('Self-ping disabled: SELF_PING_URL is not a valid URL.');
    return null;
  }
}

async function pingSelf(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    console.log(`[keep-alive] ${response.status} ${url}`);
  } catch (error) {
    console.warn(`[keep-alive] Request failed: ${error.message}`);
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Atome website is listening on port ${PORT}`);

  const selfPingUrl = getSelfPingUrl();
  if (!selfPingUrl) {
    console.log('Keep-alive is inactive locally. It will use RENDER_EXTERNAL_URL on Render.');
    return;
  }

  console.log(`Keep-alive enabled: ${selfPingUrl} every 10 minutes.`);
  setTimeout(() => pingSelf(selfPingUrl), 30_000);
  setInterval(() => pingSelf(selfPingUrl), PING_INTERVAL_MS);
});
