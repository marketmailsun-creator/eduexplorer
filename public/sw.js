// Service Worker for EduExplorer PWA - Mobile & POST Request Fix
const CACHE_NAME = 'eduexplorer-v3'; // Increment version
const urlsToCache = [
  '/login',
  '/explore',
  '/offline',
  '/manifest.json',
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - FIXED for POST requests and mobile
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ============================================
  // CRITICAL: Never cache these
  // ============================================

  // 1. External domains (Google, etc.)
  if (!url.origin.includes(self.location.origin)) {
    return; // Let external requests go through untouched
  }

  // 2. POST requests (can't be cached)
  if (request.method !== 'GET') {
    return; // Let POST/PUT/DELETE go through normally
  }

  // 3. API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. Auth routes
  if (url.pathname.startsWith('/auth/')) {
    return;
  }

  // 5. Next.js internal routes
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // ============================================
  // Handle root page (/) - always fetch fresh
  // ============================================
  if (url.pathname === '/') {
    event.respondWith(
      fetch(request, { 
        redirect: 'follow',
        credentials: 'same-origin'
      })
        .catch(() => {
          return caches.match('/offline') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }
  if (request.mode === 'navigate') {
    return; // browser handles redirects safely
  }
  
  // ============================================
  // For other GET requests, use cache-first
  // ============================================
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📂 Serving from cache:', request.url);
          return cachedResponse;
        }

        // Fetch from network
        return fetch(request, { 
          redirect: 'follow',
          credentials: 'same-origin'
        })
          .then((networkResponse) => {
            // Only cache successful GET responses
            if (!networkResponse || 
                networkResponse.status !== 200 || 
                networkResponse.type === 'opaqueredirect' ||
                networkResponse.redirected ||
                request.method !== 'GET') {
              return networkResponse;
            }

            // Clone and cache
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Double-check it's a GET request before caching
                if (request.method === 'GET') {
                  cache.put(request, responseToCache)
                    .catch(err => {
                      console.warn('Failed to cache:', request.url, err);
                    });
                }
              })
              .catch(err => {
                console.warn('Cache open failed:', err);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('🌐 Network failed:', error);
            // Try offline page
            return caches.match('/offline') || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'EduExplorer';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});