const CACHE_VERSION = 'v3'; // ✨ Increment this to force update
const STATIC_CACHE = `eduexplorer-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `eduexplorer-images-${CACHE_VERSION}`;

// Only cache these static assets
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

// ✨ CRITICAL: Dynamic routes that should NEVER be cached
const SKIP_CACHE_PATTERNS = [
  '/api/',
  '/results/',
  '/explore/',
  '/groups/',
  '/library/',
  '/query/',
  '/profile/',
  '/_next/data/',
  '?_rsc=', // Next.js RSC requests
];

// Check if URL should skip cache
function shouldSkipCache(url) {
  const urlString = url.toString();
  return SKIP_CACHE_PATTERNS.some(pattern => urlString.includes(pattern));
}

// Install - cache static assets only
self.addEventListener('install', (event) => {
  console.log('✅ SW: Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 SW: Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('❌ SW: Failed to cache assets:', err);
      });
    })
  );
  
  // Force activate immediately
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that doesn't match current version
          if (cacheName.startsWith('eduexplorer-') && 
              !cacheName.includes(CACHE_VERSION)) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ SW: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✨ CRITICAL: Never cache dynamic routes - always fetch fresh
  if (shouldSkipCache(url)) {
    console.log('🔄 SW: Network only (skip cache):', url.pathname);
    event.respondWith(
      fetch(request).catch(error => {
        console.error('❌ SW: Network error:', error);
        // Return a basic error response
        return new Response('Offline', { 
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }

  // ✨ Only cache GET requests for static assets
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // ✨ Cache strategy for static assets only
  // Images - cache first
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📷 SW: Image from cache:', url.pathname);
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // ✨ For everything else - network first, then cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses to static assets
        if (response.status === 200 && 
            (url.pathname.includes('/_next/static/') || 
             url.pathname.includes('/static/'))) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache as fallback only for static assets
        return caches.match(request);
      })
  );
});

// ✨ Message handler for manual cache clearing
self.addEventListener('message', (event) => {
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ SW: Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});