self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
    // Pass-through strategy for now to fulfill PWA requirements
    event.respondWith(fetch(event.request));
});
