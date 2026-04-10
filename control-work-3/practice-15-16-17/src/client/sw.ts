/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'notes-cache-v4';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

const ASSETS: string[] = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/assets/icon.svg',
  '/content/home.html',
  '/content/about.html',
];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== sw.location.origin) return;

  if (
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/subscribe') ||
    url.pathname.startsWith('/unsubscribe') ||
    url.pathname.startsWith('/vapid-public-key') ||
    url.pathname.startsWith('/snooze')
  ) {
    return;
  }

  // Динамические страницы — Network First
  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const home = await caches.match('/content/home.html');
          return home ?? new Response('Офлайн', { status: 503 });
        }),
    );
    return;
  }

  // Статика App Shell — Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkRes) => {
        if (networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      });
    }),
  );
});

sw.addEventListener('push', (event) => {
  let data: { title: string; body: string; reminderId?: string | null } = {
    title: 'Новое уведомление',
    body: '',
    reminderId: null,
  };
  if (event.data) {
    data = event.data.json() as typeof data;
  }
  const options: NotificationOptions & { actions?: { action: string; title: string }[] } = {
    body: data.body,
    icon: '/assets/icon.svg',
    badge: '/assets/icon.svg',
    data: { reminderId: data.reminderId ?? null },
  };

  if (data.reminderId) {
    options.actions = [{ action: 'snooze', title: 'Отложить на 5 минут' }];
  }

  event.waitUntil(sw.registration.showNotification(data.title, options));
});

sw.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'snooze') {
    const reminderId = (notification.data as { reminderId: string }).reminderId;
    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
        .then(() => notification.close())
        .catch((err) => console.error('Snooze failed:', err)),
    );
  } else {
    notification.close();
    event.waitUntil(
      sw.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          sw.clients.openWindow('/');
        }
      }),
    );
  }
});
