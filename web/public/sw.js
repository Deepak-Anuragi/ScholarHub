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
