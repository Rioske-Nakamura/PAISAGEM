import { offlineFallback, warmStrategyCache } from 'workbox-recipes';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute, Route } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';


const pageCache = new CacheFirst({
  cacheName: 'pwa-cam',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 }),
  ],
});

warmStrategyCache({
  urls: ['/index', '/', "/offline", "/js/main.js", '/js/db.js', "/images/pwa-icon-256.png', '/images/pwa-icon-512.png", 
    "/favicon.ico","/js/style.css"],
  strategy: pageCache,
});

registerRoute(({ request }) => request.mode === 'navigate', pageCache);


registerRoute(({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'paisagem',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);


registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

offlineFallback({
  pageFallback: '/offline.html',
});
