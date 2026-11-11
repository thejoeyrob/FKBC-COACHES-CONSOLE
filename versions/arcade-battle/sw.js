const CACHE='fkbc-fight-complete-v5';
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);const m=await fetch('./assets.json').then(r=>r.json());const base=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets.json','./icon-192.png','./icon-512.png'];await c.addAll([...new Set([...base,...m.allAssets.map(x=>'./'+x)])]);self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request))));
