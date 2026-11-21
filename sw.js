const CACHE = 'rmk-v2';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const NO_CACHE = /api\.telegram\.org|identitytoolkit|firebaseio\.com|firebasedatabase\.app|script\.google\.com|tile\.openstreetmap\.org/;
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || NO_CACHE.test(req.url)) return;
  const url = new URL(req.url);
  // App page: network first (so updates arrive), fall back to cache offline
  if (req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html|staff\.html)?$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./'))));
    return;
  }
  // Everything else (fonts, icons, libraries): cache first, refresh in background
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
