const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  const valid = [STATIC_CACHE, DYNAMIC_CACHE];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !valid.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const offline = await caches.match('./offline.html');
    return offline ?? new Response('Офлайн', { status: 503 });
  }
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }

  const isStatic = /\.(css|js|svg|png|jpg|ico|woff2?)$/i.test(url.pathname);
  e.respondWith(isStatic ? cacheFirst(e.request) : networkFirst(e.request));
});
