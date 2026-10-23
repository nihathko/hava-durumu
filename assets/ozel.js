// Özel tahminler: kayak merkezleri, toz taşınımı, havalimanları (METAR/TAF), son depremler, uzay havası, dünya şehirleri
(() => {
  'use strict';
  const km = (a, b, c, d) => { const R = Math.PI / 180, x = (c - a) * R, y = (d - b) * R, h = Math.sin(x / 2) ** 2 + Math.cos(a * R) * Math.cos(c * R) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const enYakin = (lat, lon) => { let b = null; for (const I of IL) for (const x of I.ilceler) { const d = km(lat, lon, x[1], x[2]); if (!b || d < b.d) b = { il: I.ad, ilce: x[0], d }; } return b; };

  // ---------- Kayak merkezleri ----------
  const KAYAK = [
    ['Uludağ', 'Bursa', 40.1007, 29.1226, 2000], ['Palandöken', 'Erzurum', 39.8536, 41.2636, 2600], ['Konaklı', 'Erzurum', 39.9620, 41.1430, 2500], ['Kartalkaya', 'Bolu', 40.6164, 31.7510, 2000],
    ['Erciyes', 'Kayseri', 38.5394, 35.4740, 2500], ['Sarıkamış', 'Kars', 40.3225, 42.5470, 2300], ['Kartepe', 'Kocaeli', 40.6650, 30.0940, 1500], ['Davraz', 'Isparta', 37.7700, 30.7430, 2200],
    ['Ilgaz', 'Kastamonu', 41.0700, 33.7330, 1950], ['Saklıkent', 'Antalya', 36.8640, 30.3360, 2200], ['Zigana', 'Gümüşhane', 40.6200, 39.4050, 2000], ['Bozdağ', 'İzmir', 38.3360, 28.0950, 1900],
    ['Ergan', 'Erzincan', 39.7020, 39.4220, 2800], ['Yıldız Dağı', 'Sivas', 39.8800, 37.3700, 2300], ['Keltepe', 'Karabük', 41.0730, 32.4900, 1800], ['Salda', 'Burdur', 37.5270, 29.6400, 2000], ['Murat Dağı', 'Uşak', 38.9200, 29.7300, 2000]
  ].map(([ad, il, lat, lon, el]) => ({ ad, il, lat, lon, el }));
  async function kayak() {
    const el = $('kayak'); el.innerHTML = yukleniyor();
    let v;
    try { v = await cokNokta(OM, KAYAK, { elevation: KAYAK.map(k => k.el).join(','), current: 'temperature_2m,weather_code,is_day,wind_speed_10m,wind_gusts_10m', hourly: 'snow_depth', daily: 'snowfall_sum,temperature_2m_max,temperature_2m_min', timezone: 'Europe/Istanbul', forecast_days: 3, wind_speed_unit: 'kmh' }, 30); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const L = KAYAK.map((k, i) => {
      const d = v[i], H = d.hourly, now = d.current.time.slice(0, 13), hi = Math.max(0, H.time.findIndex(t => t.slice(0, 13) === now));
      return { ...k, C: d.current, kar: H.snow_depth[hi], yeni: sumOf(d.daily.snowfall_sum), D: d.daily };
    });
    siraliTablo(el, [
      { b: 'Merkez', l: 1, v: r => r.ad, h: r => `<a href="${anaSayfaLink({ name: r.ad + ' Kayak Merkezi', sub: r.il, lat: r.lat, lon: r.lon, il: null, ilce: null })}">${esc(r.ad)}</a><small class="muted"> ${esc(r.il)}</small>` },
      { b: 'Pist yüksekliği', v: r => r.el, h: r => r.el + ' m' },
      { b: 'Şimdi', l: 1, v: r => r.C.temperature_2m, h: r => `<span class="ev-k">${icon(r.C.weather_code, r.C.is_day)}${deg(r.C.temperature_2m)}</span>` },
      { b: 'Kar kalınlığı', v: r => r.kar, h: r => r.kar == null ? '–' : n0(r.kar * 100) + ' cm' },
      { b: '3 günde yeni kar', v: r => r.yeni, h: r => r.yeni > 0 ? `<b>${dec(r.yeni)} cm</b>` : '–' },
      { b: 'Bugün', v: r => r.D.temperature_2m_min[0], h: r => `<span class="c-lo">${deg(r.D.temperature_2m_min[0])}</span> / <span class="c-hi">${deg(r.D.temperature_2m_max[0])}</span>` },
      { b: 'Rüzgar', v: r => r.C.wind_speed_10m, h: r => `${n0(r.C.wind_speed_10m)}<small class="muted"> hamle ${n0(r.C.wind_gusts_10m)}</small>` }
    ], L, 3, true);
  }

  // ---------- Toz taşınımı ----------
  const TOZ = [[0, '#F4F1EA'], [25, '#F2E2B8'], [50, '#E9C77A'], [100, '#D99A3E'], [200, '#B8642A'], [400, '#7A3A1C']], tozRenk = rampa(TOZ);
  const tozEt = v => v == null ? '–' : v < 25 ? ['Az', 'e-az'] : v < 50 ? ['Orta', 'e-orta'] : v < 100 ? ['Yüksek', 'e-yuksek'] : v < 200 ? ['Çok yüksek', 'e-cok'] : ['Aşırı', 'e-asiri'];
  async function toz() {
    const el = $('tozh'); el.innerHTML = yukleniyor('81 ilin toz tahmini yükleniyor…');
    let v;
    try { v = await cokNokta(OM_AQ, IL, { hourly: 'dust', timezone: 'Europe/Istanbul', forecast_days: 3 }, 60); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const R = Object.fromEntries(IL.map((I, i) => { const H = v[i].hourly, m = maxOf(H.dust), j = H.dust.indexOf(m); return [I.ad, { m, t: H.time[j] }]; }));
    el.innerHTML = haritaSvg({ fill: ad => tozRenk(R[ad].m), etiket: ad => R[ad].m >= 25 ? { ust: n0(R[ad].m) } : null, aria: 'Toz taşınımı haritası' });
    $('tozlj').innerHTML = lejant(TOZ, 'µg/m³', 'Toz, 3 günün en yükseği');
    haritaBagla(el, ad => { const r = R[ad], e = tozEt(r.m); return `<b>${esc(ad)}</b>En yüksek <span>${n0(r.m)} µg/m³</span>${r.t ? ` (${esc(kisaGun(r.t.slice(0, 10)))} ${hhmm(r.t)})` : ''}<br>Seviye: ${Array.isArray(e) ? e[0] : e}`; });
    const enCok = IL.map(I => ({ ad: I.ad, ...R[I.ad] })).sort((a, b) => b.m - a.m)[0];
    $('kisa').insertAdjacentHTML('beforeend', `<div><dt>En çok toz beklenen</dt><dd>${esc(enCok.ad)} ${n0(enCok.m)} µg/m³</dd></div>`);
  }

  // ---------- Havalimanları ----------
  async function metar() {
    const el = $('metar'); el.innerHTML = yukleniyor();
    let M;
    try { M = await havalimanlari(); } catch (e) { el.innerHTML = hataMsg('Havalimanı ölçümleri şu an alınamadı.'); return; }
    const KAT = { VFR: ['Görerek uçuş', 'e-az'], MVFR: ['Sınırlı görerek', 'e-orta'], IFR: ['Aletli uçuş', 'e-yuksek'], LIFR: ['Düşük aletli', 'e-cok'] };
    const yas = Math.round((Date.now() - Date.parse(M.t)) / 60000);
    $('hvnot').textContent = `${M.s.length} havalimanı. Veri ${yas < 1 ? 'az önce' : yas + ' dakika önce'} alındı; yarım saatte bir yenilenir. Saatler Türkiye saatidir. Bulut tabanı yerden yüksekliktir.`;
    siraliTablo(el, [
      { b: 'Havalimanı', l: 1, v: s => s.ad, h: s => `<b>${esc(s.ad)}</b><small class="muted"> ${esc(s.id)}</small>` },
      { b: 'Ölçüm', v: s => s.saat, h: s => s.saat ? new Date(s.saat).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) : '–' },
      { b: 'Sıcaklık', v: s => s.t, h: s => deg(s.t) }, { b: 'Çiy noktası', v: s => s.td, h: s => deg(s.td) }, { b: 'Nem', v: s => s.nem, h: s => pct(s.nem) },
      { b: 'Rüzgar', v: s => s.r, h: s => s.degisken ? `Değişken ${n0(s.r)}` : wind(s.ry, s.r) }, { b: 'Hamle', v: s => s.h, h: s => s.h ? n0(s.h) : '–' },
      { b: 'Görüş', v: s => s.gorus, h: s => s.gorus == null ? '–' : s.gorus >= 10 ? '10 km+' : dec(s.gorus) + ' km' },
      { b: 'Bulut', l: 1, v: s => s.bulut.length, h: s => s.bulut.length ? s.bulut.map(b => `${esc(b.ortus)}${b.taban != null ? ' ' + b.taban + ' m' : ''}`).join('<br>') : 'Önemli bulut yok' },
      { b: 'Hadise', l: 1, v: s => s.hadise || '', h: s => esc(s.hadise || '–') }, { b: 'Basınç', v: s => s.p, h: s => s.p ? n0(s.p) + ' hPa' : '–' },
      { b: 'Uçuş koşulu', l: 1, v: s => s.kat || '', h: s => s.kat && KAT[s.kat] ? `<span class="etiket ${KAT[s.kat][1]}">${KAT[s.kat][0]}</span>` : '–' },
      { b: 'Ham veri', l: 1, v: s => s.id, h: s => `<details class="acil"><summary>METAR${s.taf ? ', TAF' : ''}</summary><p class="ham">${esc(s.ham || '')}${s.taf ? '\n\n' + esc(s.taf) : ''}</p></details>` }
    ], M.s, 0);
  }

  // ---------- Son depremler ----------
  async function deprem() {
    const el = $('deprem'); el.innerHTML = yukleniyor();
    const bas = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 19);
    let L = [], kaynak = 'EMSC';
    try {
      const j = await getJSON(`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minlat=35.5&maxlat=42.5&minlon=25.5&maxlon=45&minmag=2.5&starttime=${bas}&orderby=time&limit=300`, 5);
      L = j.features.map(f => ({ t: f.properties.time, m: f.properties.mag, mt: f.properties.magtype, z: f.properties.depth, lat: f.properties.lat, lon: f.properties.lon }));
    } catch (e) {
      try {
        kaynak = 'USGS';
        const j = await getJSON(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=35.5&maxlatitude=42.5&minlongitude=25.5&maxlongitude=45&minmagnitude=2.5&starttime=${bas}&orderby=time&limit=300`, 5);
        L = j.features.map(f => ({ t: new Date(f.properties.time).toISOString(), m: f.properties.mag, mt: f.properties.magType, z: f.geometry.coordinates[2], lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }));
      } catch (e2) { el.innerHTML = hataMsg('Deprem verisi şu an alınamadı.'); return; }
    }
    L.forEach(x => { x.y = enYakin(x.lat, x.lon); });
    const yerAd = x => x.y.d < 25 ? `${x.y.ilce === 'Merkez' ? x.y.il : x.y.ilce + ' (' + x.y.il + ')'}` : `${x.y.ilce === 'Merkez' ? x.y.il : x.y.ilce + ', ' + x.y.il} yakınları, ${Math.round(x.y.d)} km`;
    const buyukEt = m => m >= 5 ? 'e-cok' : m >= 4 ? 'e-yuksek' : m >= 3 ? 'e-orta' : 'e-az';
    if (!L.length) { el.innerHTML = '<p class="muted">Son 7 günde 2,5 ve üstü deprem kaydedilmedi.</p>'; return; }
    siraliTablo(el, [
      { b: 'Zaman', v: x => x.t, h: x => new Date(x.t).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) },
      { b: 'Büyüklük', v: x => x.m, h: x => `<span class="etiket ${buyukEt(x.m)}">${dec(x.m)}</span><small class="muted"> ${esc(x.mt || '')}</small>` },
      { b: 'Yer', l: 1, v: x => yerAd(x), h: x => esc(yerAd(x)) }, { b: 'Derinlik', v: x => x.z, h: x => dec(Math.abs(x.z), 0) + ' km' },
      { b: 'Koordinat', v: x => x.lat, h: x => `${dec(x.lat, 2)}, ${dec(x.lon, 2)}` }
    ], L, 0, true);
    const en = L.reduce((b, x) => x.m > b.m ? x : b, L[0]);
    $('kisa').insertAdjacentHTML('beforeend', `<div><dt>Son 7 günün en büyük depremi</dt><dd>${dec(en.m)}, ${esc(en.y.il)}</dd></div>`);
    el.insertAdjacentHTML('afterend', `<p class="muted" style="font-size:13px;margin:8px 0 0">Kaynak: ${kaynak}. Yer adı, depremin merkez üssüne en yakın ilçedir. ${L.length} deprem.</p>`);
  }

  // ---------- Uzay havası ----------
  async function uzay() {
    const el = $('uzay'); el.innerHTML = yukleniyor();
    let f;
    try { f = await getJSON('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', 30); }
    catch (e) { el.innerHTML = hataMsg('Uzay havası verisi şu an alınamadı.'); return; }
    const rows = (Array.isArray(f[0]) ? f.slice(1).map(r => ({ time_tag: r[0], kp: +r[1], observed: r[2] })) : f).filter(r => r.kp != null);
    const simdi = Date.now(), gecmis = rows.filter(r => Date.parse(r.time_tag + 'Z') <= simdi), son = gecmis[gecmis.length - 1], gelecek = rows.filter(r => Date.parse(r.time_tag + 'Z') > simdi);
    const enY = gelecek.length ? Math.max(...gelecek.map(r => r.kp)) : null;
    const seviye = k => k >= 8 ? ['Şiddetli fırtına (G4–G5)', 'e-asiri'] : k >= 7 ? ['Kuvvetli fırtına (G3)', 'e-cok'] : k >= 6 ? ['Orta fırtına (G2)', 'e-yuksek'] : k >= 5 ? ['Zayıf fırtına (G1)', 'e-orta'] : k >= 4 ? ['Hareketli', 'e-az'] : ['Sakin', 'e-yok'];
    const x = rows.slice(-40), g = seritGrafik({ x: x.map(r => r.time_tag), adim: 16, yukseklik: 150, birim: 'Kp', sifir: true, etiketAdim: 8, xEtiket: t => noon(t.slice(0, 10)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      ayrac: i => Date.parse(x[i].time_tag + 'Z') > simdi && (i === 0 || Date.parse(x[i - 1].time_tag + 'Z') <= simdi),
      seriler: [{ ad: 'Ölçülen', renk: '#6C5BB5', v: x.map(r => Date.parse(r.time_tag + 'Z') <= simdi ? r.kp : null), tur: 'cubuk' }, { ad: 'Tahmin', renk: '#B8A9E8', v: x.map(r => Date.parse(r.time_tag + 'Z') > simdi ? r.kp : null), tur: 'cubuk' }] });
    el.innerHTML = `<dl class="kv ozet3"><div><dt>Şu an Kp</dt><dd>${son ? dec(son.kp) : '–'} <span class="etiket ${son ? seviye(son.kp)[1] : ''}">${son ? seviye(son.kp)[0] : ''}</span></dd></div>
      <div><dt>3 gün içinde beklenen en yüksek</dt><dd>${enY == null ? '–' : dec(enY)} <span class="etiket ${enY != null ? seviye(enY)[1] : ''}">${enY != null ? seviye(enY)[0] : ''}</span></dd></div>
      <div><dt>Türkiye'den kutup ışığı</dt><dd>${enY != null && enY >= 7 ? 'Kuzey ufkunda mümkün' : 'Beklenmiyor'}</dd></div></dl>
      <div class="gb"><h3>Kp endeksi, 3 saatlik</h3><span class="lj"><span><i style="background:#6C5BB5"></i>Ölçülen</span><span><i style="background:#B8A9E8"></i>Tahmin</span></span></div><div class="grafik-kutu" id="kpg">${g.svg}</div>`;
    grafikIpucu($('kpg'), g, i => `<b>${esc(new Date(x[i].time_tag + 'Z').toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }))}</b>Kp <span>${dec(x[i].kp, 2)}</span><br>${seviye(x[i].kp)[0]}`);
  }

  // ---------- Dünya şehirleri ----------
  const DUNYA = [['Londra', 51.51, -0.13], ['Paris', 48.86, 2.35], ['Berlin', 52.52, 13.40], ['Amsterdam', 52.37, 4.90], ['Viyana', 48.21, 16.37], ['Roma', 41.90, 12.50], ['Madrid', 40.42, -3.70],
    ['Atina', 37.98, 23.73], ['Sofya', 42.70, 23.32], ['Bükreş', 44.43, 26.10], ['Saraybosna', 43.86, 18.41], ['Üsküp', 42.00, 21.43], ['Priştine', 42.66, 21.17], ['Lefkoşa', 35.19, 33.38],
    ['Moskova', 55.76, 37.62], ['Bakü', 40.41, 49.87], ['Tiflis', 41.72, 44.79], ['Taşkent', 41.30, 69.24], ['Astana', 51.17, 71.45], ['Bişkek', 42.87, 74.59], ['Aşkabat', 37.95, 58.38],
    ['Tahran', 35.69, 51.39], ['Bağdat', 33.31, 44.36], ['Kudüs', 31.78, 35.22], ['Kahire', 30.04, 31.24], ['Mekke', 21.39, 39.86], ['Medine', 24.47, 39.61], ['Riyad', 24.71, 46.68], ['Dubai', 25.20, 55.27], ['Doha', 25.29, 51.53],
    ['New York', 40.71, -74.01], ['Los Angeles', 34.05, -118.24], ['Toronto', 43.65, -79.38], ['Tokyo', 35.68, 139.69], ['Pekin', 39.90, 116.41], ['Seul', 37.57, 126.98], ['Sidney', -33.87, 151.21]
  ].map(([ad, lat, lon]) => ({ ad, lat, lon }));
  async function dunya() {
    const el = $('dunya'); el.innerHTML = yukleniyor();
    let v;
    try { v = await cokNokta(OM, DUNYA, { current: 'temperature_2m,weather_code,is_day', daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: 1 }, 30); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    el.innerHTML = DUNYA.map((c, i) => { const d = v[i], C = d.current, saat = new Date(Date.now() + d.utc_offset_seconds * 1000).toISOString().slice(11, 16);
      return `<a class="kart" href="${anaSayfaLink({ name: c.ad, lat: c.lat, lon: c.lon, il: null })}">${icon(C.weather_code, C.is_day)}<b>${esc(c.ad)}</b><span class="t">${deg(C.temperature_2m)}</span><small>${saat}, ${esc(cond(C.weather_code)[0].toLocaleLowerCase('tr'))}, ${deg(d.daily.temperature_2m_min[0])} / ${deg(d.daily.temperature_2m_max[0])}</small></a>`; }).join('');
  }

  kayak(); toz(); metar(); deprem(); uzay(); dunya();
})();
