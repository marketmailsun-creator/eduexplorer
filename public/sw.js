const CACHE_VERSION = 'v4';
const STATIC_CACHE = `eduexplorer-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `eduexplorer-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

// ─────────────────────────────────────────────────────────────
// BUG 1 FIX: chrome-extension:// URLs crash cache.put()
//   Root cause: the image-caching branch calls cache.put(request, ...)
//   without checking the URL scheme. Chrome extensions inject
//   requests with chrome-extension:// which is not cacheable.
//   Fix: bail out at the top of fetch handler for non-http URLs.
//
// BUG 2 FIX: /api/auth/callback/google shows "Offline"
//   Root cause: the fetch() inside shouldSkipCache branch fails
//   (network error in dev when the SW intercepts the redirect),
//   then returns Response('Offline', 503) plain-text.
//   NextAuth reads the response body and can't parse it → blank page.
//   Fix: for /api/auth/* return Response(null, 503) — no body —
//   so the browser follows the redirect natively instead of
//   letting the SW swallow it.
//
// BUG 3 FIX: Google avatar 429 rate-limit error
//   Root cause: SW was caching lh3.googleusercontent.com images,
//   which triggers repeated requests and rate-limits.
//   Fix: external CDN hosts bypass all caching entirely.
// ─────────────────────────────────────────────────────────────

// External hostnames — never cache, pure network pass-through
const EXTERNAL_HOSTS = [
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'avatars.githubusercontent.com',
  'accounts.google.com',
  'oauth2.googleapis.com',
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.elevenlabs.io',
];

// Dynamic paths — always network-only, never cache
const SKIP_CACHE_PATTERNS = [
  '/api/',
  '/results/',
  '/explore/',
  '/groups/',
  '/library/',
  '/query/',
  '/profile/',
  '/_next/data/',
  '?_rsc=',
];

function shouldSkipCache(url) {
  const urlString = url.pathname + url.search;
  return SKIP_CACHE_PATTERNS.some(pattern => urlString.includes(pattern));
}

// ── Install ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('✅ SW: Installing version', CACHE_VERSION);
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(err =>
        console.warn('⚠️ SW: Partial pre-cache fail:', err)
      )
    )
  );
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(n => n.startsWith('eduexplorer-') && !n.includes(CACHE_VERSION))
          .map(n => {
            console.log('🗑️ SW: Deleting old cache:', n);
            return caches.delete(n);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // ── FIX 1: Scheme guard ───────────────────────────────────
  // Must be FIRST. Prevents the chrome-extension:// crash.
  // Chrome extensions fire fetch events with unsupported schemes;
  // returning early means we never call cache.put() on them.
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return; // let browser handle it natively, no respondWith()
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // malformed URL — skip
  }

  // ── FIX 3: External CDNs ──────────────────────────────────
  // Pass straight to network. Fixes Google avatar 429.
  if (EXTERNAL_HOSTS.includes(url.hostname)) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // ── FIX 2: Dynamic / API routes ──────────────────────────
  // Must reach the real server. On network failure:
  //   - /api/auth/* → return null-body 503 so the browser
  //     can show its own error instead of NextAuth choking on
  //     a plain-text "Offline" string in the response body.
  //   - everything else → return JSON error for client handling.
  if (shouldSkipCache(url)) {
    event.respondWith(
      fetch(request).catch((error) => {
        console.error('❌ SW: Network error:', url.pathname, error.message);
        if (url.pathname.startsWith('/api/auth')) {
          // No body — browser will handle OAuth redirect failure
          return new Response(null, { status: 503 });
        }
        return new Response(
          JSON.stringify({ error: 'Network unavailable', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Non-GET — always network
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Same-origin images — cache first
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          if (hit) return hit;
          return fetch(request).then((response) => {
            if (response.status === 200) {
              const toCache = response.clone(); // clone BEFORE returning
              cache.put(request, toCache);
            }
            return response;
          }).catch(() => new Response('', { status: 404 }));
        })
      )
    );
    return;
  }

  // Network first → stale cache fallback for everything else
  event.respondWith(
    fetch(request)
      .then(response => {
        if (
          response.status === 200 &&
          (url.pathname.includes('/_next/static/') ||
           url.pathname.includes('/static/'))
        ) {
          const toCache = response.clone(); // clone BEFORE returning
          caches.open(STATIC_CACHE).then(cache => cache.put(request, toCache));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Push notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: 'EduExplorer', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'EduExplorer', {
      body: payload.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { url: payload.url || '/explore' },
      tag: 'eduexplorer',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/explore';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const win = list.find(c => 'focus' in c);
      return win ? win.focus() : clients.openWindow(url);
    })
  );
});

// ── Manual cache clear ─────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.action === 'clearCache') {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => event.ports[0]?.postMessage({ success: true }))
    );
  }
});