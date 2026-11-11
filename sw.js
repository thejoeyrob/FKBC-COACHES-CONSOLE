/* FKBC Coaches Console — service worker (offline use). Bump CACHE when any file changes. */
const CACHE = 'fkbc-console-v33';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './assets/sfx.js',
  './assets/sounds/bell.wav', './assets/sounds/bleep.wav', './assets/sounds/klaxon.wav',
  './assets/img/fkbc-logo-dark.png', './assets/img/fkbc-logo-light.png',
  './assets/img/icon-192.png', './assets/img/icon-512.png', './assets/img/apple-touch-icon.png',
  ...['joe', 'jack', 'paul', 'bigjohn', 'justin', 'gracie', 'john', 'eden'].flatMap(c => [`./assets/coaches/${c}-full.webp`, `./assets/coaches/${c}-portrait.webp`])
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('fkbc-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {            // always try for the newest app, fall back to the offline copy
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })));
});
