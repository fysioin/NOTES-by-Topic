/* MSK Notes - Library (Notes by Topic) - offline service worker.
   Strategy: all pages are PRECACHED so every internal link opens with no network.
   Navigations are network-first (fresh when online, cache when offline); static
   assets and cross-origin files are cache-first. Bump CACHE when you change this. */
var CACHE = 'msk-notes-topic-v1';
var CORE = [
  "./Basic-Assessment-Methods-Musculoskeletal.html",
  "./Frozen-Shoulder-Mobility-Essay.html",
  "./Frozen_shoulder.pdf",
  "./Lumbar-Disc-Herniation-Screening-Essay.html",
  "./ORTHOPEDIC_PHYSIOTHERAPY_EVALUATION_FORM_WM.pdf",
  "./icon-192.png",
  "./icon-512.png",
  "./index.html",
  "./manifest.json",
  "./paper1.html",
  "./paper2.html",
  "./paper3.html",
  "./paper4.html"
];
var EXTRA = [];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) {
      return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                              .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
  if (EXTRA.length) {
    e.waitUntil(caches.open(CACHE).then(function (c) {
      return Promise.all(EXTRA.map(function (u) {
        return c.match(u).then(function (hit) {
          if (hit) return;
          return c.add(u).catch(function () {});
        });
      }));
    }));
  }
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return resp;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || caches.match('./index.html') || caches.match('./');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (resp) {
        if (resp && (resp.ok || resp.type === 'opaque')) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () { return hit; });
    })
  );
});
