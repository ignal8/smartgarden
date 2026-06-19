// ─────────────────────────────────────────────────────────────────────────────
// Toi Santuy — Service Worker (PWA)
// Strategi: Cache-first untuk aset statis, Network-first untuk API
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_NAME = 'toisantuy-v1';
const SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — cache aset statis
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network-first untuk /api/, Cache-first untuk aset statis
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API requests — selalu ke network, jangan cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/api')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // Aset statis — cache first, fallback ke network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        // Update cache untuk aset shell
        if (SHELL.includes(url.pathname)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/'));
    })
  );
});
