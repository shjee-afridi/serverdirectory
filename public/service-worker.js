const CACHE_VERSION = 'v1.2';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-48x48.png',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-192x192.png',
  '/icon-256x256.png',
  '/icon-512x512.png',
  '/offline.html', // Add offline fallback page
  // Add more static files if needed
];

// Pre-cache static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => ![STATIC_CACHE, API_CACHE].includes(key)).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// Fetch event: caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // API caching (stale-while-revalidate)
  if (
    url.pathname.startsWith('/api/servers') ||
    url.pathname.startsWith('/api/servers/search') ||
    url.pathname.startsWith('/api/reviews') ||
    url.pathname.startsWith('/api/discord/guilds') ||
    url.pathname.startsWith('/api/discord/guild-info') ||
    url.pathname.startsWith('/api/servers/by-user') ||
    url.pathname.startsWith('/api/servers/user-server') ||
    url.pathname.startsWith('/api/servers/stat')
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
              limitCacheSize(API_CACHE, 50); // Increase API cache size
            }
            return response;
          })
          .catch(() => cached); // fallback to cache if offline
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets: cache-first
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(response => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Navigation requests: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push event received:', event);
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    data: data.url ? { url: data.url } : undefined
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click:', event);
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  // Try to focus or open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
