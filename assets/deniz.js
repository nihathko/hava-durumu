// Denizcilik: kıyı noktalarında dalga, deniz suyu sıcaklığı ve rüzgar; seçili noktanın 5 günlük tahmini
(() => {
  'use strict';
  // Kıyıdan biraz açıkta, deniz ızgarasına denk gelen noktalar
  const N = [
    ['Karadeniz', 'İğneada', 41.88, 28.15], ['Karadeniz', 'Şile', 41.25, 29.62], ['Karadeniz', 'Karadeniz Ereğli', 41.35, 31.35], ['Karadeniz', 'Amasra', 41.82, 32.40],
    ['Karadeniz', 'İnebolu', 42.05, 33.75], ['Karadeniz', 'Sinop', 42.12, 35.25], ['Karadeniz', 'Samsun', 41.42, 36.45], ['Karadeniz', 'Ordu', 41.08, 37.95],
    ['Karadeniz', 'Trabzon', 41.10, 39.72], ['Karadeniz', 'Rize', 41.12, 40.55], ['Karadeniz', 'Hopa', 41.45, 41.35],
    ['Marmara', 'İstanbul, Yenikapı açığı', 40.92, 28.95], ['Marmara', 'Tekirdağ', 40.88, 27.55], ['Marmara', 'Marmara Adası', 40.55, 27.45], ['Marmara', 'Bandırma', 40.45, 27.95], ['Marmara', 'Yalova', 40.70, 29.20],
    ['Ege', 'Gökçeada', 40.12, 25.55], ['Ege', 'Çanakkale Boğazı girişi', 39.98, 26.05], ['Ege', 'Ayvalık', 39.30, 26.50], ['Ege', 'İzmir Körfezi girişi', 38.62, 26.70],
    ['Ege', 'Çeşme', 38.30, 26.18], ['Ege', 'Kuşadası', 37.85, 27.10], ['Ege', 'Bodrum', 36.95, 27.35], ['Ege', 'Datça', 36.62, 27.75],
    ['Akdeniz', 'Marmaris', 36.75, 28.35], ['Akdeniz', 'Fethiye', 36.55, 29.00], ['Akdeniz', 'Kaş', 36.12, 29.65], ['Akdeniz', 'Antalya', 36.75, 30.75],
    ['Akdeniz', 'Alanya', 36.45, 32.00], ['Akdeniz', 'Anamur', 35.95, 32.85], ['Akdeniz', 'Mersin', 36.65, 34.75], ['Akdeniz', 'İskenderun', 36.65, 35.95], ['Akdeniz', 'Samandağ', 36.05, 35.75]
  ].map(([deniz, ad, lat, lon], i) => ({ i, deniz, ad, lat, lon }));
  const hEl = $('dharita'), ljEl = $('dlj'), selEl = $('dnok'), tEl = $('dtablo');
  let kat = 0, secili = null;
  const DOUGLAS = [[0.1, 'Sakin'], [0.5, 'Hafif dalgalı'], [1.25, 'Orta dalgalı'], [2.5, 'Dalgalı'], [4, 'Çok dalgalı'], [6, 'Yüksek dalgalı'], [9, 'Çok yüksek dalgalı'], [Infinity, 'Olağanüstü']];
  const durum = h => h == null ? '–' : DOUGLAS.find(x => h < x[0])[1];
  const durumEt = h => { if (h == null) return '<span class="etiket e-yok">Veri yok</span>'; const k = DOUGLAS.findIndex(x => h < x[0]); return `<span class="etiket ${['e-az', 'e-az', 'e-orta', 'e-yuksek', 'e-cok', 'e-cok', 'e-asiri', 'e-asiri'][k]}">${DOUGLAS[k][1]}</span>`; };
  const DALGA = [[0, '#DDF0F4'], [0.5, '#9CD3E0'], [1.25, '#4FA8C8'], [2.5, '#F2C14E'], [4, '#E8833A'], [6, '#C7372F']], dalgaRenk = rampa(DALGA);
  const SST = [[8, '#4575B4'], [14, '#74ADD1'], [18, '#E0F3F8'], [22, '#FEE090'], [26, '#F46D43'], [30, '#A50026']], sstRenk = rampa(SST);
  const KATLAR = ['Dalga yüksekliği', 'Deniz suyu sıcaklığı', 'Rüzgar'];

  function ciz() {
    const renk = kat === 0 ? n => dalgaRenk(n.d) : kat === 1 ? n => sstRenk(n.sst) : n => ruzgarRenk(n.r);
    const yaz = kat === 0 ? n => n.d == null ? '–' : dec(n.d) + ' m' : kat === 1 ? n => n.sst == null ? '–' : n0(n.sst) + '°' : n => n.r == null ? '–' : n0(n.r);
    const ok = n => kat === 0 && n.dy != null ? `<path d="M0 -9 L3.5 -2 L0 -3.5 L-3.5 -2 Z" transform="rotate(${(n.dy + 180) % 360})" fill="#13212C" opacity=".75"/>` : kat === 2 && n.ry != null ? `<path d="M0 -9 L3.5 -2 L0 -3.5 L-3.5 -2 Z" transform="rotate(${(n.ry + 180) % 360})" fill="#13212C" opacity=".75"/>` : '';
    const ek = '<g class="dn">' + N.map(n => { const [x, y] = izdusum(n.lat, n.lon); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" data-n="${n.i}" tabindex="0" role="button" aria-label="${esc(n.ad)}"><circle r="${secili === n ? 8 : 6.5}" fill="${renk(n)}" stroke="${secili === n ? '#13212C' : '#fff'}" stroke-width="${secili === n ? 2 : 1.4}"/>${ok(n)}<text y="18">${esc(yaz(n))}</text></g>`; }).join('') + '</g>';
    hEl.innerHTML = haritaSvg({ fill: () => 'var(--kara, #E9EDE4)', ek, aria: 'Kıyı noktaları haritası' });
    ljEl.innerHTML = kat === 0 ? lejant(DALGA, 'm', 'Dalga yüksekliği') : kat === 1 ? lejant(SST, '°C', 'Deniz suyu sıcaklığı') : lejant(RUZGAR, 'km/sa', 'Rüzgar hızı');
    $('dnot').textContent = (kat === 0 ? 'Belirgin dalga yüksekliği (en yüksek üçte bir dalganın ortalaması); ok dalganın gittiği yön. ' : kat === 1 ? 'Deniz yüzeyi sıcaklığı. ' : 'Rüzgar hızı (km/sa); ok rüzgarın estiği yön. ') + 'Bir noktaya dokununca 5 günlük tahmini açılır.';
  }
  hEl.addEventListener('click', e => { const g = e.target.closest('[data-n]'); if (g) sec(N[+g.dataset.n]); });
  hEl.addEventListener('keydown', e => { const g = e.target.closest('[data-n]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sec(N[+g.dataset.n]); } });

  function tablo() {
    siraliTablo(tEl, [
      { b: 'Deniz', l: 1, v: n => n.deniz, h: n => esc(n.deniz) }, { b: 'Nokta', l: 1, v: n => n.ad, h: n => `<a href="#dnok" data-n="${n.i}">${esc(n.ad)}</a>` },
      { b: 'Dalga', v: n => n.d, h: n => n.d == null ? '–' : dec(n.d) + ' m' }, { b: 'Deniz durumu', l: 1, v: n => n.d, h: n => durumEt(n.d) },
      { b: 'Dalganın geldiği yön', v: n => n.dy, h: n => n.dy == null ? '–' : `<span class="wd">${arrow(n.dy)}${dir(n.dy)}</span>` },
      { b: 'Periyot', v: n => n.dp, h: n => n.dp == null ? '–' : dec(n.dp) + ' sn' }, { b: 'Bugün en yüksek', v: n => n.dmax, h: n => n.dmax == null ? '–' : dec(n.dmax) + ' m' },
      { b: 'Deniz suyu', v: n => n.sst, h: n => n.sst == null ? '–' : dec(n.sst) + '°' },
      { b: 'Rüzgar', v: n => n.r, h: n => wind(n.ry, n.r) }, { b: 'Hamle', v: n => n.h, h: n => n0(n.h) }, { b: 'Beaufort', l: 1, v: n => n.r, h: n => n.r == null ? '–' : `${bofor(n.r)[0]}, ${bofor(n.r)[1]}` }
    ], N, 0);
  }
  tEl.addEventListener('click', e => { const a = e.target.closest('a[data-n]'); if (a) { e.preventDefault(); sec(N[+a.dataset.n]); selEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });

  async function sec(n) {
    secili = n; ciz();
    $('dsec').textContent = `${n.ad} (${n.deniz}), ${coord(n.lat, 'K', 'G')}, ${coord(n.lon, 'D', 'B')}. 5 günlük saatlik tahmin.`;
    selEl.innerHTML = yukleniyor();
    let m, w;
    try {
      [m, w] = await Promise.all([
        getJSON(omURL(OM_DENIZ, { latitude: n.lat, longitude: n.lon, timezone: 'Europe/Istanbul', forecast_days: 5, hourly: 'wave_height,wave_period,wave_direction,swell_wave_height,wind_wave_height,sea_surface_temperature' })),
        getJSON(omURL(OM, { latitude: n.lat, longitude: n.lon, timezone: 'Europe/Istanbul', forecast_days: 5, wind_speed_unit: 'kmh', hourly: 'wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,is_day' }))
      ]);
    } catch (e) { selEl.innerHTML = hataMsg(); return; }
    if (secili !== n) return;
    const now = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 13);
    let i0 = m.hourly.time.findIndex(t => t.slice(0, 13) >= now); if (i0 < 0) i0 = 0;
    const idx = m.hourly.time.map((_, i) => i).slice(i0), x = idx.map(i => m.hourly.time[i]), M = m.hourly, W = w.hourly;
    const ortak = { x, adim: 8, ayrac: i => x[i].endsWith('T00:00'), etiketSec: t => /T(00|06|12|18):00/.test(t), xEtiket: t => t.endsWith('T00:00') ? kisaGun(t.slice(0, 10)) : t.slice(11, 13) };
    const g1 = seritGrafik({ ...ortak, yukseklik: 160, birim: 'm', sifir: true, seriler: [{ ad: 'Ölü dalga', renk: '#8C9CAC', v: idx.map(i => M.swell_wave_height[i]), kalin: 1.5, kesik: 1 }, { ad: 'Rüzgar dalgası', renk: '#3F9E8F', v: idx.map(i => M.wind_wave_height[i]), kalin: 1.5 }, { ad: 'Belirgin dalga', renk: '#2160A8', v: idx.map(i => M.wave_height[i]), tur: 'alan', kalin: 2.5 }] });
    const g2 = seritGrafik({ ...ortak, yukseklik: 130, birim: 'km/sa', sifir: true, seriler: [{ ad: 'Hamle', renk: '#C7372F', v: idx.map(i => W.wind_gusts_10m[i]), kalin: 1.5 }, { ad: 'Rüzgar', renk: '#3F9E8F', v: idx.map(i => W.wind_speed_10m[i]) }] });
    const enY = maxOf(idx.map(i => M.wave_height[i])), jY = idx.find(i => M.wave_height[i] === enY);
    selEl.innerHTML = `<dl class="kv ozet3"><div><dt>Şu an dalga</dt><dd>${dec(n.d)} m <small>${durum(n.d)}</small></dd></div><div><dt>5 günün en yükseği</dt><dd>${dec(enY)} m <small>${jY != null ? esc(kisaGun(M.time[jY].slice(0, 10))) + ' ' + hhmm(M.time[jY]) : ''}</small></dd></div>
      <div><dt>Deniz suyu</dt><dd>${dec(n.sst)}°C</dd></div><div><dt>Rüzgar</dt><dd>${wind(n.ry, n.r)} <small>km/sa, ${n.r == null ? '' : bofor(n.r)[1].toLocaleLowerCase('tr')}</small></dd></div></dl>
      <div class="gb"><h3>Dalga yüksekliği</h3><span class="lj"><span><i style="background:#2160A8"></i>Belirgin dalga</span><span><i style="background:#3F9E8F"></i>Rüzgar dalgası</span><span><i style="background:#8C9CAC"></i>Ölü dalga</span></span></div><div class="grafik-kutu" id="dg1">${g1.svg}</div>
      <div class="gb"><h3>Rüzgar</h3><span class="lj"><span><i style="background:#3F9E8F"></i>Ortalama</span><span><i style="background:#C7372F"></i>Hamle</span></span></div><div class="grafik-kutu" id="dg2">${g2.svg}</div>`;
    const ip = j => { const i = idx[j]; return `<b>${esc(fmtWeek(ymd(M.time[i])))} ${hhmm(M.time[i])}</b>Dalga <span>${dec(M.wave_height[i])} m</span>, periyot <span>${dec(M.wave_period[i])} sn</span><br>Rüzgar dalgası <span>${dec(M.wind_wave_height[i])} m</span>, ölü dalga <span>${dec(M.swell_wave_height[i])} m</span><br>Rüzgar <span>${W.wind_direction_10m[i] != null ? dir(W.wind_direction_10m[i]) : ''} ${n0(W.wind_speed_10m[i])}</span>, hamle <span>${n0(W.wind_gusts_10m[i])} km/sa</span>`; };
    grafikIpucu($('dg1'), g1, ip); grafikIpucu($('dg2'), g2, ip);
  }

  (async () => {
    hEl.innerHTML = yukleniyor();
    try {
      const [m, w] = await Promise.all([
        cokNokta(OM_DENIZ, N, { current: 'wave_height,wave_direction,wave_period,sea_surface_temperature', daily: 'wave_height_max', timezone: 'Europe/Istanbul', forecast_days: 1 }),
        cokNokta(OM, N, { current: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m', timezone: 'Europe/Istanbul', forecast_days: 1, wind_speed_unit: 'kmh' })
      ]);
      N.forEach((n, i) => { const c = m[i].current || {}, cw = w[i].current || {}; Object.assign(n, { d: c.wave_height, dy: c.wave_direction, dp: c.wave_period, sst: c.sea_surface_temperature, dmax: m[i].daily && m[i].daily.wave_height_max[0], r: cw.wind_speed_10m, ry: cw.wind_direction_10m, h: cw.wind_gusts_10m }); });
    } catch (e) { hEl.innerHTML = hataMsg(); return; }
    const by = d => N.filter(n => n.deniz === d);
    const ort = (d, k) => avgOf(by(d).map(n => n[k]));
    $('kisa').innerHTML = ['Karadeniz', 'Marmara', 'Ege', 'Akdeniz'].map(d => `<div><dt>${d}</dt><dd>${dec(ort(d, 'd'))} m, ${n0(ort(d, 'sst'))}°</dd></div>`).join('');
    sekmeler($('dkat'), KATLAR, i => { kat = i; ciz(); });
    tablo();
    sec(N.find(n => n.ad === 'Trabzon'));
  })();
})();
