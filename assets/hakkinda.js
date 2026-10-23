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
  $('kisa').innerHTML = '<div><dt>Veri kaynağı</dt><dd>17</dd></div><div><dt>Çerez</dt><dd>Yok</dd></div><div><dt>Reklam</dt><dd>Yok</dd></div>';
})();
