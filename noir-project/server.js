import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const root = join(appDir, 'src');
const port = Number(process.env.PORT || 3000);
const catalog = JSON.parse(readFileSync(join(root, 'data/catalog.json'), 'utf8'));
const rateBuckets = new Map();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const imageProxyHosts = new Set(['image.tmdb.org']);
const csp = "default-src 'self'; img-src 'self' https: data:; media-src 'self' https: blob:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com";
const oauthProviders = {
  google: { clientId: process.env.GOOGLE_CLIENT_ID, callbackPath: '/auth/google/callback', authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', scopes: ['openid', 'email', 'profile'] },
  yandex: { clientId: process.env.YANDEX_CLIENT_ID, callbackPath: '/auth/yandex/callback', authorizeUrl: 'https://oauth.yandex.ru/authorize', scopes: ['login:email', 'login:info'] },
  vk: { clientId: process.env.VK_CLIENT_ID, callbackPath: '/auth/vk/callback', authorizeUrl: 'https://oauth.vk.com/authorize', scopes: ['email'] }
};

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(body));
}

function setSecurityHeaders(res) {
  res.setHeader('content-security-policy', csp);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('x-frame-options', 'SAMEORIGIN');
}

function clientKey(req) {
  return `${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local'}:${new URL(req.url, 'http://noir.local').pathname}`;
}

function rateLimit(req, res, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const key = clientKey(req);
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (bucket.resetAt < now) Object.assign(bucket, { count: 0, resetAt: now + windowMs });
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  res.setHeader('ratelimit-limit', String(limit));
  res.setHeader('ratelimit-remaining', String(Math.max(0, limit - bucket.count)));
  if (bucket.count > limit) {
    sendJson(res, 429, { error: 'rate_limited', retryAfterMs: bucket.resetAt - now });
    return false;
  }
  return true;
}

function sanitize(value) {
  return String(value || '').replace(/[<>"'`]/g, '').trim().slice(0, 120);
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const [key, ...rest] = part.trim().split('=');
    return [key, decodeURIComponent(rest.join('='))];
  }));
}

function ensureCsrf(req, res) {
  const cookies = parseCookies(req);
  const token = cookies['__Host-noir_csrf'] || randomBytes(24).toString('hex');
  res.setHeader('set-cookie', `__Host-noir_csrf=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`);
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || 'GET')) return true;
  const headerToken = req.headers['x-csrf-token'];
  if (headerToken !== token) {
    sendJson(res, 403, { error: 'csrf_failed' });
    return false;
  }
  return true;
}

function proxiedImage(url) {
  if (!url) return '';
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function publicTitle(title) {
  const watchable = title.externalIds?.balancer ? 'external-balancer' : 'metadata-only';
  return {
    ...title,
    posterUrl: proxiedImage(title.posterUrl),
    backdropUrl: proxiedImage(title.backdropUrl),
    sourcePosterUrl: title.posterUrl,
    sourceBackdropUrl: title.backdropUrl,
    playbackStatus: watchable
  };
}

async function proxyRemoteImage(res, rawUrl) {
  let remote;
  try {
    remote = new URL(rawUrl || '');
  } catch {
    sendJson(res, 400, { error: 'invalid_image_url' });
    return;
  }
  if (remote.protocol !== 'https:' || !imageProxyHosts.has(remote.hostname)) {
    sendJson(res, 403, { error: 'image_host_not_allowed' });
    return;
  }
  try {
    const upstream = await fetch(remote, { headers: { accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } });
    if (!upstream.ok || !upstream.body) {
      sendJson(res, 502, { error: 'image_unavailable' });
      return;
    }
    res.writeHead(200, {
      'content-type': upstream.headers.get('content-type') || 'image/jpeg',
      'cache-control': 'public, max-age=604800, stale-while-revalidate=86400',
      'x-content-type-options': 'nosniff'
    });
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch {
    sendJson(res, 502, { error: 'image_unavailable' });
  }
}

async function handleApi(req, res, url) {
  if (!rateLimit(req, res, url.pathname.startsWith('/api/search') ? 60 : 120)) return true;
  if (!ensureCsrf(req, res)) return true;

  if (url.pathname === '/health') return sendJson(res, 200, { ok: true, service: 'noir', version: '1.2.0' }), true;
  if (url.pathname === '/api/image') {
    await proxyRemoteImage(res, url.searchParams.get('url'));
    return true;
  }
  if (url.pathname === '/api/auth/providers') {
    return sendJson(res, 200, { providers: Object.fromEntries(Object.entries(oauthProviders).map(([name, cfg]) => [name, { configured: Boolean(cfg.clientId), callbackPath: cfg.callbackPath, scopes: cfg.scopes }])) }), true;
  }
  if (url.pathname.startsWith('/auth/') && !url.pathname.endsWith('/callback')) {
    const provider = url.pathname.split('/')[2];
    const cfg = oauthProviders[provider];
    if (!cfg) return sendJson(res, 404, { error: 'unknown_provider' }), true;
    if (!cfg.clientId) return sendJson(res, 501, { error: 'oauth_provider_not_configured', provider, requiredEnv: `${provider.toUpperCase()}_CLIENT_ID` }), true;
    const state = createHash('sha256').update(randomBytes(32)).digest('hex');
    res.writeHead(302, { location: `${cfg.authorizeUrl}?client_id=${encodeURIComponent(cfg.clientId)}&redirect_uri=${encodeURIComponent(`${process.env.PUBLIC_APP_URL || 'http://localhost:3000'}${cfg.callbackPath}`)}&response_type=code&scope=${encodeURIComponent(cfg.scopes.join(' '))}&state=${state}` });
    res.end();
    return true;
  }
  if (url.pathname.endsWith('/callback') && url.pathname.startsWith('/auth/')) {
    return sendJson(res, 202, { status: 'accepted', message: 'OAuth callback route is reserved; token exchange is enabled after provider secrets are configured.' }), true;
  }
  if (url.pathname === '/api/catalog') {
    const type = sanitize(url.searchParams.get('type'));
    const genre = sanitize(url.searchParams.get('genre'));
    const sort = sanitize(url.searchParams.get('sort')) || 'popularity';
    const items = catalog.filter((item) => (!type || type === 'all' || item.type === type) && (!genre || genre === 'all' || item.genres.includes(genre)));
    items.sort((a, b) => sort === 'rating' ? b.rating - a.rating : sort === 'year' ? b.year - a.year : b.popularity - a.popularity);
    return sendJson(res, 200, { items: items.map(publicTitle), total: items.length }), true;
  }
  if (url.pathname === '/api/search') {
    const query = sanitize(url.searchParams.get('q')).toLowerCase();
    if (query.length < 2) return sendJson(res, 200, { items: [], suggestions: ['Дюна', 'Оппенгеймер', 'Во все тяжкие', 'Тьма'] }), true;
    const items = catalog.filter((item) => `${item.title} ${item.originalTitle} ${item.genres.join(' ')} ${item.people.actors.join(' ')}`.toLowerCase().includes(query));
    return sendJson(res, 200, { items: items.map(publicTitle), total: items.length }), true;
  }
  if (url.pathname.startsWith('/api/playback/')) {
    const id = sanitize(url.pathname.split('/').pop());
    const item = catalog.find((title) => title.id === id);
    if (!item) return sendJson(res, 404, { error: 'title_not_found' }), true;
    return sendJson(res, 200, { titleId: item.id, provider: process.env.VIDEO_BALANCER_PROVIDER || 'stub-adapter', externalId: item.externalIds?.balancer, translations: ['Русский', 'Оригинал'], qualities: item.quality, status: item.externalIds?.balancer ? 'ready_for_balancer' : 'missing_video' }), true;
  }
  if (url.pathname === '/api/video-balancers') return sendJson(res, 200, { active: process.env.VIDEO_BALANCER_PROVIDER || 'stub-adapter', fallback: true, supports: ['translations', 'episodes', 'qualities', 'watch-position'] }), true;
  return false;
}

createServer(async (req, res) => {
  setSecurityHeaders(res);
  const url = new URL(req.url || '/', 'http://noir.local');
  if (await handleApi(req, res, url)) return;

  const urlPath = url.pathname === '/' ? '/noir_streaming.html' : decodeURIComponent(url.pathname);
  const safePath = normalize(urlPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(root, safePath);
  const finalPath = existsSync(filePath) ? filePath : join(root, 'noir_streaming.html');
  res.writeHead(200, { 'content-type': mime[extname(finalPath)] || 'application/octet-stream', 'cache-control': finalPath.endsWith('.html') ? 'no-store' : 'public, max-age=31536000, immutable' });
  createReadStream(finalPath).pipe(res);
}).listen(port, '0.0.0.0', () => console.log(`NOIR listening on ${port}`));
