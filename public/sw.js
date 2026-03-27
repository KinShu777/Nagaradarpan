const CACHE_NAME = 'nagardarpan-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/nagardarpan-logo.png',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((fetchResponse) => {
        // Cache new local assets on the fly
        if (event.request.url.startsWith(self.location.origin)) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
        // Offline fallback for navigations
        if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
        }
    })
  );
});
