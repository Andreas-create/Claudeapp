/* Brainbow service worker.
   Precaches the whole app (it is only ~200 KB) so every game plays offline,
   then serves cache-first with a background refresh.

   Bump CACHE whenever assets change — the old cache is deleted on activate.
   Keep this version in step with the ?v= query strings in the HTML. */
var CACHE = "brainbow-v17";

var ASSETS = [
  "./",
  "./index.html",
  "./wordle.html",
  "./connections.html",
  "./digits.html",
  "./peru.html",
  "./manifest.json",
  "./css/main.css",
  "./js/common.js",
  "./js/home.js",
  "./js/wordle.js",
  "./js/connections.js",
  "./js/cn-engine.js",
  "./js/digits.js",
  "./js/peru.js",
  "./data/wordle.js",
  "./data/connections.js",
  "./data/peru.js",
  "./data/definitions.js",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      // addAll fails the whole install if any single file 404s, so add
      // them individually and tolerate misses.
      .then(function (c) {
        return Promise.all(ASSETS.map(function (url) {
          return c.add(url).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  // Let cross-origin requests (the Wikipedia hint lookup) go straight to
  // the network — they must not be cached or blocked when offline.
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    // ignoreSearch so the ?v= cache-busting suffixes still hit precached files
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var fetched = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      // Cache-first: instant load, refresh in the background.
      return hit || fetched;
    })
  );
});
