// Radar ve uydu: RainViewer yağış radarı (son 2 saat + kısa süreli tahmin), NASA GIBS uydu görüntüsü ve yangın noktaları
(() => {
  'use strict';
  const notEl = $('rnot'), oy = $('oy'), kare = $('kare'), zmn = $('zmn');
  const yer = store.get('hava.yer', null);
  const map = L.map('lmap', { center: yer ? [+yer.lat, +yer.lon] : [39.1, 35.2], zoom: yer ? 7 : 6, minZoom: 4, maxZoom: 11 });
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıcıları' }).addTo(map);
  if (yer) L.circleMarker([+yer.lat, +yer.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#2F6BFF', fillOpacity: 1 }).bindTooltip(esc(yer.name)).addTo(map);

  // ---------- Radar ----------
  let kareler = [], katmanlar = [], host = '', i = 0, oynuyor = null;
  const saatYaz = t => new Date(t * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  async function radarYukle() {
    const r = await fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('radar');
    const j = await r.json();
    host = j.host;
    kareler = [...(j.radar.past || []).map(x => ({ ...x, tahmin: false })), ...(j.radar.nowcast || []).map(x => ({ ...x, tahmin: true }))];
    katmanlar.forEach(k => map.removeLayer(k));
    katmanlar = kareler.map(k => L.tileLayer(`${host}${k.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0, maxNativeZoom: 7, maxZoom: 11, zIndex: 5, attribution: '<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">Weather data by RainViewer</a>' }));
    kare.max = String(kareler.length - 1);
    i = Math.max(0, (j.radar.past || []).length - 1);
  }
  function goster(n) {
    if (!kareler.length) return;
    i = (n + kareler.length) % kareler.length;
    katmanlar.forEach((k, j) => { if (j === i) { if (!map.hasLayer(k)) k.addTo(map); k.setOpacity(.75); } else if (map.hasLayer(k)) k.setOpacity(0); });
    // bir sonraki kareyi önceden yükle ki oynatma takılmasın
    const s = katmanlar[(i + 1) % katmanlar.length]; if (!map.hasLayer(s)) s.setOpacity(0).addTo(map);
    kare.value = String(i);
    const k = kareler[i];
    zmn.textContent = `${saatYaz(k.time)}${k.tahmin ? ' (tahmin)' : ''}`;
  }
  const dur = () => { clearInterval(oynuyor); oynuyor = null; oy.textContent = 'Oynat'; };
  oy.addEventListener('click', () => { if (oynuyor) return dur(); oy.textContent = 'Durdur'; oynuyor = setInterval(() => goster(i + 1), 700); });
  kare.addEventListener('input', () => { dur(); goster(+kare.value); });

  // ---------- Uydu ve yangın ----------
  const dun = gunEkle(bugunTR(), -1);
  const gunler = [0, 1, 2, 3, 4, 5, 6].map(n => gunEkle(dun, -n));
  let uyduTarih = dun, uydu = null, yangin = null;
  const uyduKatman = t => L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${t}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, { maxNativeZoom: 9, maxZoom: 11, zIndex: 3, attribution: 'Uydu: NASA GIBS, EOSDIS (VIIRS)' });
  const yanginKatman = t => L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', { layers: 'VIIRS_SNPP_Thermal_Anomalies_375m_All', format: 'image/png', transparent: true, version: '1.3.0', time: t, zIndex: 6, attribution: 'Yangın noktaları: NASA FIRMS / GIBS' });
  const tarihSec = () => `<label class="zaman" for="ut">Görüntü tarihi</label> <select id="ut" class="kucuk">${gunler.map(g => `<option value="${g}"${g === uyduTarih ? ' selected' : ''}>${esc(fmtDay(g))}</option>`).join('')}</select>`;

  let mod = 0;
  function modDegis(m) {
    mod = m; dur();
    katmanlar.forEach(k => map.removeLayer(k));
    if (uydu) { map.removeLayer(uydu); uydu = null; }
    if (yangin) { map.removeLayer(yangin); yangin = null; }
    const oyn = $('oynat');
    if (m === 0) {
      oyn.innerHTML = ''; oyn.append(oy, kare, zmn);
      if (!kareler.length) { notEl.textContent = 'Radar verisi şu an alınamadı. Biraz sonra sayfayı yenile.'; return; }
      goster(i);
      notEl.textContent = `Son ${Math.round(kareler.filter(k => !k.tahmin).length * 10 / 60)} saatin radar görüntüleri (10 dakikada bir)${kareler.some(k => k.tahmin) ? ' ve kısa süreli tahmin' : ''}. Kaydırıcıyla zamanı seç ya da Oynat'a bas.`;
    } else {
      oyn.innerHTML = tarihSec();
      $('ut').addEventListener('change', e => { uyduTarih = e.target.value; modDegis(mod); });
      if (m === 1) { uydu = uyduKatman(uyduTarih).addTo(map); notEl.textContent = `NASA VIIRS uydusunun ${fmtDay(uyduTarih)} tarihli gerçek renkli görüntüsü. Beyaz alanlar bulut ya da kar örtüsü.`; }
      else { yangin = yanginKatman(uyduTarih).addTo(map); notEl.textContent = `${fmtDay(uyduTarih)} tarihinde uydunun tespit ettiği yangın ve ısı noktaları (kırmızı/turuncu noktalar). Yakınlaştırınca daha net görünür.`; }
    }
  }

  (async () => {
    try { await radarYukle(); } catch (e) { kareler = []; }
    sekmeler($('rkat'), ['Yağış radarı', 'Uydu görüntüsü', 'Yangın ve ısı noktaları'], modDegis);
    $('kisa').innerHTML = kareler.length ? `<div><dt>Son radar görüntüsü</dt><dd>${saatYaz(kareler.filter(k => !k.tahmin).slice(-1)[0].time)}</dd></div><div><dt>Uydu görüntüsü</dt><dd>${esc(fmtDay(dun))}</dd></div>` : '';
    // Radar 10 dakikada bir yenilenir
    setInterval(async () => { if (mod === 0 && !oynuyor && !document.hidden) { try { await radarYukle(); goster(kareler.filter(k => !k.tahmin).length - 1); } catch (e) {} } }, 10 * 60e3);
  })();
})();
