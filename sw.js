/**
 * NEXUS Service Worker — Beta v1.0
 * Full offline support for PWA/APK.
 */

const CACHE = 'nexus-beta-1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/animations.css',
  './css/mobile-polish.css',
  './js/config.js',
  './js/state.js',
  './js/engine.js',
  './js/cards.js',
  './js/carousel.js',
  './js/achievements.js',
  './js/cosmetics.js',
  './js/skilltree.js',
  './js/sounds.js',
  './js/render.js',
  './js/profile.js',
  './js/shop.js',
  './js/app.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable.png',
  './assets/apple-touch-icon.png',
  './assets/icon.svg',
];

// Install — pre-cache all app assets
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => null)))
    )
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app, network-first for fonts/external
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // External (fonts, CDN) — network first, cache fallback
  if (!url.pathname.startsWith('/') || url.hostname !== self.location.hostname) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // App assets — cache first, network fallback, offline = index.html
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
