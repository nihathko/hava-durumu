// Hava Durumu servis çalışanı: sayfanın kendi dosyalarını (sayfa, yazı tipleri, simgeler) önbelleğe alır,
// böylece site uygulama olarak yüklenebilir ve internet yokken de açılır.
// Önce ağdan alınır (her zaman en yeni sürüm), ağ yoksa önbellekten verilir.
// Hava verisi (Open-Meteo) ve MGM görselleri başka sitelerden geldiği için hiç önbelleğe alınmaz.
const CACHE = 'hava-v2';
const FILES = [
  './', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'fonts/figtree-400-700-latin.woff2', 'fonts/figtree-400-700-latin-ext.woff2',
  'fonts/bricolage-grotesque-latin.woff2', 'fonts/bricolage-grotesque-latin-ext.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(nav ? './' : req, copy)); }
      return res;
    }).catch(() => caches.match(nav ? './' : req, { ignoreSearch: nav }).then(r => r || Response.error()))
  );
});
