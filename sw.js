const CACHE_NAME = "climate-finance-v3";

const APP_ASSETS = [
    "./",
    "./index.html",
    "./manifest.webmanifest?v=3",
    "./css/slyle.css?v=3",
    "./js/main.js?v=2",
    "./images/app-icon-192.png",
    "./images/app-icon-512.png",
    "./images/background.png",
    "./images/coin.svg",
    "./images/coins.png",
    "./images/coins.svg",
    "./images/countries.svg?v=3",
    "./images/settings.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((cacheName) => cacheName !== CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() => caches.match("./index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
