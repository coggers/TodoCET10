/**
 * Cache-first shell so the hub opens instantly from the home screen, and still
 * opens with no network (the portals themselves obviously need one).
 *
 * Bump CACHE when any shell file changes; the old cache is dropped on activate.
 */

const CACHE = 'cet10hub-v1';

const SHELL = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'assets/css/styles.css',
  'assets/js/app.js',
  'assets/js/i18n.js',
  'assets/data/gyms.js',
  'assets/fonts/roboto-latin-var.woff2',
  'assets/img/bdr.webp',
  'assets/img/jupiter.webp',
  'assets/img/maresme.webp',
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
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever serve our own origin from cache — portal links must hit the network.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit ?? fetch(request).then((response) => {
      // Stash successful same-origin responses so first-visit misses warm up too.
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match('index.html'))),
  );
});
