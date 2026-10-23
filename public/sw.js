// Quizzer PWA Service Worker — Supercharged Speed, Offline & Caching Engine
const CACHE_VERSION = "v2";
const STATIC_CACHE = `quizzer-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `quizzer-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Pre-cached critical assets for instant shell startup & offline readiness
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/badge-96.png",
  "/icons/shortcut-quiz.png",
  "/icons/shortcut-syllabus.png",
  "/icons/shortcut-dashboard.png",
  "/icons/shortcut-bookmarks.png",
  "/quizzer-svg-assets/quizzer-logo.svg",
  "/quizzer-svg-assets/nav-dashboard.svg",
  "/quizzer-svg-assets/nav-syllabus.svg",
  "/quizzer-svg-assets/nav-quiz.svg",
  "/quizzer-svg-assets/nav-analytics.svg",
  "/quizzer-svg-assets/nav-bookmarks.svg",
  "/quizzer-svg-assets/nav-notes.svg",
  "/quizzer-svg-assets/card-weak-areas.svg",
];

// Install: precache the offline shell and static core
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Warning pre-caching assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up outdated legacy caches and claim active clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            console.log("[SW] Evicting legacy cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: optimized caching strategy per resource type
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never cache non-GET methods, API endpoints, or live Convex real-time streams
  if (
    req.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_convex/") ||
    url.hostname.includes("convex.cloud") ||
    url.protocol.startsWith("ws")
  ) {
    return;
  }

  // 2. Navigation requests (HTML pages) -> Network-First with Cache fallback, then Offline Page
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(req);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        })
    );
    return;
  }

  // 3. Static Assets: JS bundles, CSS, Google Fonts, SVGs, PNGs, WebP -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/quizzer-svg-assets/") ||
    url.pathname.startsWith("/screenshots/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webp");

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Default: Network-first for other GET requests
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Update prompt listener: enable immediate takeover when prompted
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push notification listener (ready for daily study reminders & exam alerts)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "Quizzer — राजस्थान GK रिवीज़न";
    const options = {
      body: data.body || "आज का 20 प्रश्नों का रिवीज़न सेट तैयार है।",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/dashboard",
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("[SW] Push event handling error:", err);
  }
});

// Notification click listener
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
