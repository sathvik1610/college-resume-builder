// Cache-first app shell with background refresh, so the tool works offline after the first visit.
// Bump VERSION whenever any cached file changes.
const VERSION = 'crb-v5';
const SHELL = [
  './', 'index.html', 'css/app.css', 'css/resume.css',
  'js/config.js', 'js/app.js', 'manifest.webmanifest', 'icon.svg', 'assets/logo.jpg',
  'fonts/cmunrm.woff', 'fonts/cmunbx.woff', 'fonts/cmunti.woff', 'fonts/cmunbi.woff',
  'fonts/plex-sans-400.woff2', 'fonts/plex-sans-500.woff2', 'fonts/plex-sans-600.woff2', 'fonts/plex-sans-700.woff2',
  'fonts/plex-serif-600.woff2', 'fonts/plex-serif-700.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        const net = fetch(req).then(res => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => hit || cache.match('index.html'));
        return hit || net;
      })
    )
  );
});
