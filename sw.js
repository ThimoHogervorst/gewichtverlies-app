const CACHE_NAME = 'gewicht-tracker-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Cache first strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(response => {
                // Cache new requests
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // Fallback for offline
                return caches.match(event.request);
            });
        })
    );
});
