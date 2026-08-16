/**
 * Offline shell for the hub.
 *
 * Two strategies, chosen by what the file is:
 *
 *  - Code and markup (navigations, CSS, JS, the manifest) are **network-first**, so a
 *    deploy actually reaches an installed home-screen copy on the next launch. v1 was
 *    cache-first here, which pinned installed copies to the version they were first
 *    opened with.
 *  - Images and the font are **cache-first**: they are large, effectively immutable, and
 *    change only via a new filename.
 *
 * Bump CACHE whenever the shell list changes; old caches are dropped on activate.
 */

const CACHE = 'cet10hub-v4';

/** How long to wait for the network before falling back to cache, in ms. */
const NETWORK_TIMEOUT = 3000;

const SHELL = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'assets/css/styles.css',
  'assets/js/app.js',
  'assets/js/i18n.js',
  'assets/data/gyms.js',
  'assets/data/hours.js',
  'assets/data/feedback.js',
  'assets/fonts/roboto-latin-var.woff2',
  'assets/img/bdr.webp',
  'assets/img/jupiter.webp',
  'assets/img/maresme.webp',
  'assets/img/qr.svg',
  'assets/img/icon-192.png',
  'assets/img/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Only ever delete our own caches. The bare `key !== CACHE` this replaced
      // would wipe every cache on the origin, which matters if anything else is
      // ever served from the same host.
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('cet10hub-') && key !== CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

/** Assets safe to serve from cache indefinitely. */
const isImmutable = (pathname) => /\.(webp|png|jpg|svg|woff2?)$/i.test(pathname);

async function put(request, response) {
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  return put(request, await fetch(request));
}

async function networkFirst(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
  try {
    // A slow or captive network should not out-wait the cached copy.
    // `no-store` bypasses the browser's own HTTP cache, which otherwise happily
    // re-serves stale code here and defeats the whole point of network-first.
    const response = await fetch(request, { signal: controller.signal, cache: 'no-store' });
    return await put(request, response);
  } catch {
    return (await caches.match(request))
      ?? (await caches.match('index.html'))
      ?? Response.error();
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Portal links and anything else off-origin must always hit the network untouched.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    isImmutable(url.pathname) ? cacheFirst(request) : networkFirst(request),
  );
});
