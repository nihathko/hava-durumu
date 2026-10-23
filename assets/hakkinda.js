// Hakkında: bu cihazda saklanan kayıtları silme düğmesi
(() => {
  'use strict';
  const b = $('temizle'), s = $('temizle-s');
  b.addEventListener('click', async () => {
    if (!confirm('Bu cihazdaki son yer, favoriler, tema ve saklanan veriler silinsin mi?')) return;
    try { Object.keys(localStorage).filter(k => k.startsWith('hava.')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    try { Object.keys(sessionStorage).filter(k => k.startsWith('hava.')).forEach(k => sessionStorage.removeItem(k)); } catch (e) {}
    try { if (window.caches) for (const k of await caches.keys()) if (k.startsWith('hava-')) await caches.delete(k); } catch (e) {}
    s.textContent = 'Silindi.';
  });
  // 22 servis: Open-Meteo’nun 9 API’si (tahmin, arşiv, iklim, mevsimsel, topluluk, hava kalitesi, deniz, akarsu, yer arama), MET Norway, RainViewer, EUMETSAT, NASA GIBS, FIRMS ve POWER, NOAA AWC ve SWPC, EMSC, USGS, OpenStreetMap, geoBoundaries, MGM
  $('kisa').innerHTML = '<div><dt>Veri kaynağı</dt><dd>22</dd></div><div><dt>Çerez</dt><dd>Yok</dd></div><div><dt>Reklam</dt><dd>Yok</dd></div>';
})();
