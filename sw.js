// Hava Durumu servis çalışanı: sitenin kendi dosyalarını (sayfalar, kod, yazı tipleri, simgeler, harita kitaplığı) önbelleğe alır,
// böylece site uygulama olarak yüklenebilir ve internet yokken de açılır.
// Önce ağdan alınır (her zaman en yeni sürüm), ağ yoksa önbellekten verilir.
// Hava verisi (Open-Meteo) ve MGM görselleri başka sitelerden geldiği için hiç önbelleğe alınmaz.
const CACHE = 'hava-v11';
const FILES = [
  './', 'harita.html', 'uyari.html', 'radar.html', 'grafik.html', 'iklim.html', 'analiz.html', 'deniz.html', 'ziraat.html', 'ozel.html', 'bilgi.html', 'hakkinda.html',
  'assets/site.css', 'assets/gokyuzu.js', 'assets/ortak.js', 'assets/ana-ek.js', 'assets/ililce.js', 'assets/turkiye.js', 'assets/normal-81.js',
  'assets/harita.js', 'assets/radar.js', 'assets/grafik.js', 'assets/iklim.js', 'assets/deniz.js', 'assets/ziraat.js', 'assets/ozel.js', 'assets/hakkinda.js', 'assets/uyari.js', 'assets/analiz.js', 'assets/bilgi.js',
  'assets/leaflet/leaflet.js', 'assets/leaflet/leaflet.css',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
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
      if (res.ok) { const copy = res.clone(); const u = new URL(req.url); u.search = ''; caches.open(CACHE).then(c => c.put(nav ? u.href : req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: nav }).then(r => r || (nav ? caches.match('./') : null)).then(r => r || Response.error()))
  );
});
