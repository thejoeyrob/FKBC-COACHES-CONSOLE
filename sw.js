/* FKBC Coaches Console — service worker (offline use). Bump CACHE when any file changes. */
const CACHE = 'fkbc-console-v52';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './assets/sfx.js', './assets/live.js', './assets/timetable.js', './assets/bushido.js', './assets/timer-layout.js', './assets/timer-layout.css', './assets/bushido.css', './assets/live-config.js', './assets/vendor/supabase.js', './assets/library-data.js', './assets/img/gym-bg.webp', './assets/img/bg-arena.webp', './assets/img/bg-gym.webp', './assets/img/bg-streets.webp',
  './assets/bushido/bg-pad.jpg', './assets/bushido/bg-phone.jpg', './assets/bushido/bg-red.jpg', './assets/bushido/bg-timer.jpg', './assets/bushido/bg-wide.jpg', './assets/bushido/btn-glow.webp', './assets/bushido/btn-glow-f.webp', './assets/bushido/btn-idle.webp', './assets/bushido/btn-idle-f.webp', './assets/bushido/frame-banner.jpg', './assets/bushido/frame-portrait.jpg', './assets/bushido/frame-section.jpg', './assets/bushido/frame-wide.jpg', './assets/bushido/icon-192.png',
  './assets/bushido/fonts/kanit-600-italic.woff2', './assets/bushido/fonts/kanit-800-italic.woff2',
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
