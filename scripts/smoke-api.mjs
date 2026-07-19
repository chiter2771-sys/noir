import { spawn } from 'node:child_process';

const server = spawn(process.execPath, ['noir-project/server.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
try {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const health = await fetch('http://127.0.0.1:3000/health').then((r) => r.json());
  const catalog = await fetch('http://127.0.0.1:3000/api/catalog?sort=rating').then((r) => r.json());
  const search = await fetch('http://127.0.0.1:3000/api/search?q=дюна').then((r) => r.json());
  const playback = await fetch('http://127.0.0.1:3000/api/playback/dune-part-two').then((r) => r.json());
  if (!health.ok || catalog.total < 4 || search.total < 1 || playback.status !== 'ready_for_balancer') {
    throw new Error('Smoke API assertions failed');
  }
  console.log('smoke api ok');
} finally {
  server.kill();
}
