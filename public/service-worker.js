// SW killer — deploy at the SAME URL the old SW used
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1) delete ALL caches this scope knows about
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // 2) unregister this service worker
    await self.registration.unregister();

    // 3) force controlled pages to reload so they detach from SW
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      // Hard refresh to bypass HTTP cache too
      client.navigate(client.url);
    }
  })());
});
