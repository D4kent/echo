// Garde l'interface de l'appli en cache pour qu'elle s'ouvre instantanément (les flux restent en direct).
const CACHE = "echo-v14";
const FICHIERS = [
  "./", "index.html", "style.css", "app.js", "manifest.webmanifest",
  "icons/icone-192.png", "icons/icone-512.png",
  "logos/logo_couleur3.png", "logos/logo_meuh.png", "logos/logo_fip.png", "logos/logo_fippop.png",
  "logos/logo_fipjazz.png", "logos/logo_fipcultes.png", "logos/logo_nova.png", "logos/logo_nostalgie.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Seulement les fichiers de l'appli : jamais les flux audio ni les API
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copie = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copie)); return r; })
      .catch(() => caches.match(e.request))
  );
});
