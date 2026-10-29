const CACHE_NAME = "scholarshub-v1";
const STATIC_ASSETS = ["/", "/libraries", "/map", "/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Bypass API requests, Next.js RSC payload requests, Next.js internals, and non-GET requests
  const isApiRequest = request.url.includes("/api/") || request.url.includes(":5000");
  const isRscRequest = request.url.includes("_rsc=") || request.headers.get("RSC") === "1";
  const isNextInternal = request.url.includes("/_next/");
  const isNonGet = request.method !== "GET";

  if (isApiRequest || isRscRequest || isNextInternal || isNonGet) {
    return; // Let browser handle natively
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        if (request.mode === "navigate") return caches.match("/offline.html");
        return Response.error();
      });
    })
  );
});

// ── Web Push Notifications ──────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = {
    title: "Scholar's Hub",
    body: "You have a new update regarding your booking.",
    link: "/student/bookings",
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    vibrate: [100, 50, 100],
    data: { link: payload.link || "/student/bookings" },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    event.notification.data && event.notification.data.link
      ? event.notification.data.link
      : "/student/bookings";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
