/**
 * Serves the site on an ephemeral port and runs every suite against it.
 *
 * The suites are plain node scripts that exit non-zero on failure, so this
 * runner just sequences them and reports. No test framework, matching the
 * no-dependencies spirit of the site itself.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(testsDir, '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');

    // Never serve anything outside the repo.
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
console.log(`serving ${root} at ${base}\n`);

const suites = readdirSync(testsDir).filter((f) => f.endsWith('.test.mjs')).sort();
const failed = [];

for (const suite of suites) {
  process.stdout.write(`── ${suite}\n`);
  const code = await new Promise((resolve) => {
    spawn(process.execPath, [path.join(testsDir, suite)], {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: base },
    }).on('close', resolve);
  });
  if (code !== 0) failed.push(suite);
  process.stdout.write('\n');
}

server.close();

console.log('='.repeat(56));
console.log(`${suites.length - failed.length}/${suites.length} suites passed`);
if (failed.length) {
  console.log('failed:', failed.join(', '));
  process.exit(1);
}
