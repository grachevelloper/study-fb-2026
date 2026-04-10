"use strict";
const sw = self;
const CACHE_NAME = "notes-cache-v3";
const DYNAMIC_CACHE_NAME = "dynamic-content-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/assets/icon.svg",
  "/content/home.html",
  "/content/about.html"
];
sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting())
  );
});
sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(
      (keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => sw.clients.claim())
  );
});
sw.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== sw.location.origin) return;
  if (url.pathname.startsWith("/socket.io/") || url.pathname.startsWith("/subscribe") || url.pathname.startsWith("/unsubscribe") || url.pathname.startsWith("/vapid-public-key")) {
    return;
  }
  if (url.pathname.startsWith("/content/")) {
    event.respondWith(
      fetch(event.request).then((networkRes) => {
        const clone = networkRes.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkRes;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const home = await caches.match("/content/home.html");
        return home ?? new Response("\u041E\u0444\u043B\u0430\u0439\u043D", { status: 503 });
      })
    );
    return;
  }
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
    })
  );
});
sw.addEventListener("push", (event) => {
  let data = { title: "\u041D\u043E\u0432\u043E\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435", body: "" };
  if (event.data) {
    data = event.data.json();
  }
  const options = {
    body: data.body,
    icon: "/assets/icon.svg",
    badge: "/assets/icon.svg"
  };
  event.waitUntil(sw.registration.showNotification(data.title, options));
});
