import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'src');
const port = Number(process.env.PORT || 3000);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const csp = "default-src 'self'; img-src 'self' https: data:; media-src 'self' https: blob:; frame-src https:; connect-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com";

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

createServer((req, res) => {
  res.setHeader('content-security-policy', csp);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  if (req.url === '/health') return sendJson(res, 200, { ok: true, service: 'noir', version: '1.0.0' });
  if (req.url === '/api/auth/providers') return sendJson(res, 200, { providers: ['google', 'yandex', 'vk'], configured: {
    google: Boolean(process.env.GOOGLE_CLIENT_ID), yandex: Boolean(process.env.YANDEX_CLIENT_ID), vk: Boolean(process.env.VK_CLIENT_ID)
  }});
  if (req.url === '/api/video-balancers') return sendJson(res, 200, { active: process.env.VIDEO_BALANCER_PROVIDER || 'stub-adapter', fallback: true });

  const urlPath = req.url === '/' ? '/noir_streaming.html' : decodeURIComponent(req.url.split('?')[0]);
  const safePath = normalize(urlPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(root, safePath);
  const finalPath = existsSync(filePath) ? filePath : join(root, 'noir_streaming.html');
  res.writeHead(200, { 'content-type': mime[extname(finalPath)] || 'application/octet-stream', 'cache-control': finalPath.endsWith('.html') ? 'no-store' : 'public, max-age=31536000, immutable' });
  createReadStream(finalPath).pipe(res);
}).listen(port, '0.0.0.0', () => console.log(`NOIR listening on ${port}`));
