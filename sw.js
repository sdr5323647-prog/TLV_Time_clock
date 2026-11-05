// Offline support. Network-first: when online the newest files are always used (and cached);
// when offline the cached copy is used. Bump CACHE when files are added or removed.
const CACHE = 'timeclock-v5';
const FILES = ['./', './index.html', './manifest.webmanifest', './jszip.min.js', './icon-192.png', './icon-512.png', './sync-config.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // never touch Google traffic
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
