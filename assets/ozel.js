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
    const sg = $('sigmet');
    if (sg) sg.innerHTML = M.sigmet && M.sigmet.length
      ? `<div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Uçuş bölgesi</th><th class="l">Tehlike</th><th>Geçerlilik</th><th>Yükseklik<small>feet</small></th><th class="l">Ham mesaj</th></tr></thead><tbody>${M.sigmet.map(x => `<tr><td class="l">${esc(x.fir)}</td><td class="l"><b>${esc(x.tehlike)}</b> <small class="muted">${esc(x.nitelik)}</small></td><td>${x.bas ? new Date(x.bas).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) : ''}–${x.bit ? new Date(x.bit).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) : ''}</td><td>${x.alt == null ? '–' : n0(+x.alt)}–${x.ust == null ? '–' : n0(+x.ust)}</td><td class="l"><details class="acil"><summary>Göster</summary><p class="ham">${esc(x.ham)}</p></details></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="muted">Şu an Ankara ve İstanbul uçuş bölgeleri için geçerli SIGMET uyarısı yok.</p>';
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
    depremBolgesi(L);
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
  const ICAO = {"Londra":"EGLL","Paris":"LFPG","Berlin":"EDDB","Amsterdam":"EHAM","Viyana":"LOWW","Roma":"LIRF","Madrid":"LEMD","Atina":"LGAV","Sofya":"LBSF","Bükreş":"LROP","Saraybosna":"LQSA","Üsküp":"LWSK","Priştine":"BKPR","Lefkoşa":"LCEN","Moskova":"UUEE","Bakü":"UBBB","Tiflis":"UGTB","Taşkent":"UTTT","Astana":"UACC","Bişkek":"UCFM","Aşkabat":"UTAA","Tahran":"OIII","Bağdat":"ORBI","Kudüs":"LLBG","Kahire":"HECA","Mekke":"OEJN","Medine":"OEMA","Riyad":"OERK","Dubai":"OMDB","Doha":"OTHH","New York":"KJFK","Los Angeles":"KLAX","Toronto":"CYYZ","Tokyo":"RJTT","Pekin":"ZBAA","Seul":"RKSI","Sidney":"YSSY"};
  async function dunya() {
    const el = $('dunya'); el.innerHTML = yukleniyor();
    let olc = {}; try { olc = (await havalimanlari()).dunya || {}; } catch (e) {}
    let v;
    try { v = await cokNokta(OM, DUNYA, { current: 'temperature_2m,weather_code,is_day', daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: 1 }, 30); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    el.innerHTML = DUNYA.map((c, i) => { const d = v[i], C = d.current, saat = new Date(Date.now() + d.utc_offset_seconds * 1000).toISOString().slice(11, 16);
      return `<a class="kart" href="${anaSayfaLink({ name: c.ad, lat: c.lat, lon: c.lon, il: null })}">${icon(C.weather_code, C.is_day)}<b>${esc(c.ad)}</b><span class="t">${deg(C.temperature_2m)}</span><small>${saat}, ${esc(cond(C.weather_code)[0].toLocaleLowerCase('tr'))}, ${deg(d.daily.temperature_2m_min[0])} / ${deg(d.daily.temperature_2m_max[0])}${olc[ICAO[c.ad]] && olc[ICAO[c.ad]].t != null ? `, havalimanı ölçümü ${deg(olc[ICAO[c.ad]].t)}` : ''}</small></a>`; }).join('');
  }

  // ---------- Stadyumlar ve İstanbul Park ----------
  const STAD = [
    ['İstanbul, Seyrantepe stadı', 41.1034, 28.9907], ['İstanbul, Kadıköy stadı', 40.9877, 29.0369], ['İstanbul, Dolmabahçe stadı', 41.0393, 28.9945], ['İstanbul, Başakşehir stadı', 41.0767, 28.7772],
    ['İstanbul, Kasımpaşa stadı', 41.0400, 28.9722], ['İstanbul, Olimpiyat stadı', 41.0744, 28.7656], ['Trabzon, Akyazı stadı', 40.9947, 39.6611], ['Ankara, Eryaman stadı', 39.9750, 32.6233],
    ['İzmir, Alsancak stadı', 38.4372, 27.1536], ['İzmir, Göztepe stadı', 38.3992, 27.0761], ['Konya stadı', 37.9450, 32.4842], ['Kayseri stadı', 38.7250, 35.4214], ['Antalya stadı', 36.8908, 30.6433],
    ['Gaziantep stadı', 37.0414, 37.3297], ['Samsun stadı', 41.2669, 36.2847], ['Sivas stadı', 39.7353, 37.0453], ['Kocaeli stadı', 40.7581, 29.9592], ['Bursa stadı', 40.2250, 29.0072],
    ['Rize stadı', 41.0283, 40.5317], ['Alanya stadı', 36.5536, 32.0136], ['Eyüp stadı', 41.0475, 28.9339], ['Hatay stadı', 36.2367, 36.1572], ['İstanbul Park pisti', 40.9517, 29.4050]
  ].map(([ad, lat, lon]) => ({ ad, lat, lon }));
  async function stadyum(st) {
    const el = $('stad');
    el.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL(OM, { latitude: st.lat, longitude: st.lon, timezone: 'Europe/Istanbul', forecast_days: 3, wind_speed_unit: 'kmh', hourly: 'temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,precipitation_probability' })); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const H = d.hourly, now = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 13);
    const gunler = [...new Set(H.time.map(t => t.slice(0, 10)))];
    el.innerHTML = gunler.map(g => {
      const ii = H.time.map((_, i) => i).filter(i => H.time[i].startsWith(g) && +H.time[i].slice(11, 13) >= 8 && H.time[i].slice(0, 13) >= now);
      if (!ii.length) return '';
      const sat = (b, f, k = '') => `<tr><th class="l">${b}</th>${ii.map(i => `<td${k ? ` class="${k}"` : ''}>${f(i)}</td>`).join('')}</tr>`;
      return `<div class="gb"><h3>${esc(fmtWeek(g))}, ${esc(fmtDay(g))}</h3></div><div class="tbl-wrap"><table class="marina"><thead><tr><th class="l">Saat</th>${ii.map(i => `<th>${H.time[i].slice(11, 13)}</th>`).join('')}</tr></thead><tbody>
        ${sat('Hava', i => icon(H.weather_code[i], H.is_day[i]), 'ev ikon')}${sat('Sıcaklık', i => deg(H.temperature_2m[i]))}${sat('Nem', i => '%' + n0(H.relative_humidity_2m[i]))}
        ${sat('Rüzgar', i => H.wind_direction_10m[i] == null ? '–' : `<span class="wd">${arrow(H.wind_direction_10m[i])}${n0(H.wind_speed_10m[i])}</span>`)}${sat('Yağış ihtimali', i => H.precipitation_probability[i] >= 10 ? '%' + H.precipitation_probability[i] : '–')}</tbody></table></div>`;
    }).join('');
  }

  // ---------- Kapadokya balon uçuşu (gün doğumu saatleri) ----------
  async function balon() {
    const el = $('balon');
    el.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL(OM, { latitude: 38.643, longitude: 34.830, elevation: 1100, timezone: 'Europe/Istanbul', forecast_days: 4, wind_speed_unit: 'kmh', hourly: 'wind_speed_10m,wind_gusts_10m,wind_direction_10m,wind_speed_120m,wind_speed_925hPa,precipitation,precipitation_probability,visibility,weather_code,cape', daily: 'sunrise' }), 30); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const H = d.hourly, bugun = bugunTR();
    const gunler = d.daily.time.map((g, j) => ({ g, sr: d.daily.sunrise[j] })).filter(x => x.g >= bugun).slice(0, 4);
    const satir = gunler.map(({ g, sr }) => {
      const s0 = +sr.slice(11, 13), ii = H.time.map((t, i) => [t, i]).filter(([t]) => t.startsWith(g) && +t.slice(11, 13) >= s0 - 1 && +t.slice(11, 13) <= s0 + 2).map(x => x[1]);
      if (!ii.length) return '';
      const r = maxOf(ii.map(i => H.wind_speed_10m[i])), h = maxOf(ii.map(i => H.wind_gusts_10m[i])), u = maxOf(ii.map(i => Math.max(H.wind_speed_120m[i] ?? 0, H.wind_speed_925hPa[i] ?? 0)));
      const y = maxOf(ii.map(i => H.precipitation[i])), yi = maxOf(ii.map(i => H.precipitation_probability[i])), g2 = minOf(ii.map(i => H.visibility[i])), cp = maxOf(ii.map(i => H.cape[i]));
      const neden = []; let sev = 2;
      if (r > 18 || h > 25 || u > 35) { neden.push('rüzgar kuvvetli'); sev = 0; } else if (r > 10 || h > 18 || u > 25) { neden.push('rüzgar sınırda'); sev = Math.min(sev, 1); }
      if (y > 0.1 || yi >= 50) { neden.push('yağış'); sev = 0; } else if (yi >= 25) { neden.push('yağış ihtimali'); sev = Math.min(sev, 1); }
      if (g2 != null && g2 < 3000) { neden.push('sis, görüş düşük'); sev = Math.min(sev, g2 < 1000 ? 0 : 1); }
      if (cp > 500) { neden.push('kararsız hava'); sev = Math.min(sev, 1); }
      const et = [['Uygun değil', 'e-cok'], ['Sınırda', 'e-orta'], ['Uygun', 'e-az']][sev];
      return `<tr><td class="l day1">${esc(fmtWeek(g))}<small>gün doğumu ${hhmm(sr)}</small></td><td class="l"><span class="etiket ${et[1]}">${et[0]}</span></td><td>${n0(r)}</td><td>${n0(h)}</td><td>${n0(u)}</td><td>%${n0(yi)}</td><td>${g2 == null ? '–' : g2 >= 10000 ? '10 km+' : dec(g2 / 1000) + ' km'}</td><td class="l">${esc(neden.join(', ') || 'koşullar elverişli')}</td></tr>`;
    }).join('');
    el.innerHTML = `<div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Sabah</th><th class="l">Uçuş</th><th>Yer rüzgarı<small>km/sa</small></th><th>Hamle</th><th>Yüksek rüzgar<small>120 m – 750 m</small></th><th>Yağış<small>ihtimali</small></th><th>Görüş</th><th class="l">Neden</th></tr></thead><tbody>${satir}</tbody></table></div>
      <p class="kutu-not">Göreme için gün doğumundan 1 saat önce ile 2 saat sonrası arasındaki model tahmini. Balon uçuşlarına Sivil Havacılık Genel Müdürlüğü ve MGM'nin Kapadokya meydan uyarılarına göre her sabah ayrıca karar verilir; burada yazan yalnızca bir ön bilgidir.</p>`;
  }

  // ---------- Enverziyon riski (sabah saatlerinde hava kirliliğinin sıkışması) ----------
  async function enverziyon() {
    const el = $('envh');
    el.innerHTML = yukleniyor('81 ilin sabah sıcaklık profili yükleniyor…');
    let v;
    try { v = await cokNokta(OM, IL, { hourly: 'temperature_2m,temperature_925hPa,temperature_850hPa,temperature_700hPa,wind_speed_10m', timezone: 'Europe/Istanbul', forecast_days: 3, wind_speed_unit: 'kmh' }, 60); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const gunler = v[0].hourly.time.filter(t => t.endsWith('T07:00')).map(t => t.slice(0, 10));
    // Şehrin yüksekliğinin en az 300 m üstündeki ilk basınç seviyesi kullanılır (925 hPa ≈ 750 m, 850 hPa ≈ 1.500 m, 700 hPa ≈ 3.000 m);
    // yüksek şehirlerde alttaki seviyeler yerin altında kaldığı için anlamsızdır.
    const puan = (d, g) => {
      const H = d.hourly, i = H.time.indexOf(g + 'T07:00'); if (i < 0) return null;
      const yuk = d.elevation ?? 0, sev = yuk < 450 ? '925' : yuk < 1200 ? '850' : '700';
      const T = H.temperature_2m[i], ust = H[`temperature_${sev}hPa`][i], r = H.wind_speed_10m[i] ?? 10;
      if (T == null || ust == null) return null;
      const fark = ust - T; // pozitifse yukarısı yerden sıcak: gerçek enverziyon
      return { p: Math.max(0, Math.min(100, Math.round((fark + 1) * 14 + Math.max(0, 10 - r) * 2))), fark, r, sev };
    };
    const ENV = [[0, '#EEF4EE'], [25, '#F2E27A'], [50, '#F2A65A'], [75, '#D9573B'], [100, '#8E2A2A']], envRenk = rampa(ENV);
    const ad = p => p == null ? '–' : p < 25 ? 'Yok' : p < 50 ? 'Zayıf' : p < 75 ? 'Orta' : 'Kuvvetli';
    sekmeler($('envg'), gunler.map((g, i) => i === 0 ? 'Bugün sabah' : i === 1 ? 'Yarın sabah' : fmtWeek(g) + ' sabah'), j => {
      const R = Object.fromEntries(IL.map((I, k) => [I.ad, puan(v[k], gunler[j])]));
      el.innerHTML = haritaSvg({ fill: a => R[a] ? envRenk(R[a].p) : null, etiket: a => R[a] && R[a].p >= 50 ? { ust: ad(R[a].p) } : null, aria: 'Enverziyon riski haritası' });
      $('envlj').innerHTML = lejant(ENV, '/100', 'Enverziyon şiddeti');
      haritaBagla(el, a => { const r = R[a]; return r ? `<b>${esc(a)}</b>Enverziyon: <span>${ad(r.p)}</span> (${r.p}/100)<br>Yerden yukarı sıcaklık farkı <span>${r.fark > 0 ? '+' : ''}${dec(r.fark)}°</span><br>Rüzgar <span>${rz(r.r)} ${RZ()}</span>` : esc(a); });
    });
  }

  // ---------- Güneş ve rüzgar enerjisi (7 günlük üretim tahmini) ----------
  async function enerji(I) {
    const el = $('enerji');
    el.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL(OM, { latitude: I.lat, longitude: I.lon, timezone: 'Europe/Istanbul', forecast_days: 7, daily: 'shortwave_radiation_sum,sunshine_duration', hourly: 'wind_speed_100m', wind_speed_unit: 'ms' }), 60); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const D = d.daily, N = NORMAL81[I.ad], ay = +bugunTR().slice(5, 7) - 1;
    const gunler = D.time.map((g, j) => {
      const kwh = D.shortwave_radiation_sum[j] / 3.6, ii = d.hourly.time.map((t, i) => [t, i]).filter(([t]) => t.startsWith(g)).map(x => x[1]);
      const r = avgOf(ii.map(i => d.hourly.wind_speed_100m[i])), yog = avgOf(ii.map(i => 0.5 * 1.2 * (d.hourly.wind_speed_100m[i] ?? 0) ** 3));
      return { g, kwh, pv: kwh * 0.8, gunes: D.sunshine_duration[j] / 3600, r, yog };
    });
    el.innerHTML = `<div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Gün</th><th>Güneş enerjisi<small>kWh/m²</small></th><th>1 kW panel üretimi<small>kWh, yaklaşık</small></th><th>Güneşlenme<small>saat</small></th><th>100 m rüzgar<small>m/sn</small></th><th>Rüzgar güç yoğunluğu<small>W/m²</small></th></tr></thead><tbody>
      ${gunler.map(x => `<tr><td class="l">${esc(fmtWeek(x.g))}</td><td>${dec(x.kwh)}</td><td><b>${dec(x.pv)}</b></td><td>${dec(x.gunes)}</td><td>${dec(x.r)}</td><td>${n0(x.yog)}</td></tr>`).join('')}</tbody></table></div>
      <p class="kutu-not">${esc(I.ad)} için ${AYLAR[ay]} ayının uzun yıllar ortalaması ${dec(N.gunes[ay])} kWh/m²/gün güneş enerjisi ve 50 m'de ${dec(N.r50[ay])} m/sn rüzgardır (NASA POWER, 1991–2020). Panel üretimi yatay yüzey ve %80 sistem verimiyle kabaca hesaplanır; panelin eğimi ve yönü sonucu değiştirir.</p>`;
  }

  // ---------- Deprem bölgesinin hava tahmini (son 7 günün 4,5 ve üstü depremi için) ----------
  async function depremBolgesi(L) {
    const el = $('dphava');
    const b = L.filter(x => x.m >= 4.5).sort((a, c) => c.m - a.m)[0];
    if (!b) { el.innerHTML = '<p class="muted">Son 7 günde Türkiye ve çevresinde 4,5 ve üstü deprem olmadı.</p>'; return; }
    let d;
    try { d = await getJSON(omURL(OM, { latitude: b.lat, longitude: b.lon, timezone: 'Europe/Istanbul', forecast_days: 4, daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max' }), 30); }
    catch (e) { el.innerHTML = ''; return; }
    const D = d.daily;
    el.innerHTML = `<div class="gb"><h3>Deprem bölgesinde hava: ${esc(b.y.ilce === 'Merkez' ? b.y.il : b.y.ilce + ', ' + b.y.il)} (${dec(b.m)})</h3></div><div class="kartlar">${D.time.map((g, j) => `<div class="kart">${icon(D.weather_code[j], 1)}<b>${j === 0 ? 'Bugün' : esc(fmtWeek(g))}</b><span class="t">${deg(D.temperature_2m_max[j])}</span><small>gece ${deg(D.temperature_2m_min[j])}, ${esc(cond(D.weather_code[j])[0].toLocaleLowerCase('tr'))}${D.precipitation_sum[j] >= 1 ? `, ${mm(D.precipitation_sum[j])} mm yağış` : ''}</small></div>`).join('')}</div>
      <p class="kutu-not">Deprem sonrası çadır ve açık alanda kalanlar için: gece sıcaklığı ${deg(minOf(D.temperature_2m_min))} civarına düşüyor${maxOf(D.precipitation_sum) >= 1 ? ', yağış bekleniyor' : ''}${maxOf(D.wind_gusts_10m_max) >= 50 ? ', rüzgar kuvvetli esecek' : ''}. Resmi açıklamalar için AFAD'ı takip edin.</p>`;
  }

  // ---------- Yol hava durumu ----------
  // İki il merkezi arasındaki kuş uçuşu hat 30–40 km aralıklarla örneklenir; her noktaya, yola çıkış saati ve ortalama
  // hıza göre varılacak saatin tahmini gösterilir. Gerçek karayolu güzergahı değildir.
  function enYakinIlce(lat, lon) {
    let b = null;
    for (const I of IL) for (const x of I.ilceler) { if (x[1] == null) continue; const d = km(lat, lon, x[1], x[2]); if (!b || d < b.d) b = { d, ad: x[0] === 'Merkez' ? I.ad : `${x[0]} (${I.ad})` }; }
    return b ? b.ad : '';
  }
  const iki = v => String(v).padStart(2, '0');
  async function yol() {
    const el = $('yols'), a = IL[+$('ynere').value], b = IL[+$('ynereye').value];
    if (a === b) { el.innerHTML = '<p class="muted">Nereden ve nereye için farklı iller seç.</p>'; return; }
    const top = km(a.lat, a.lon, b.lat, b.lon) * 1.25, hiz = +$('yhiz').value || 80, n = Math.max(2, Math.min(16, Math.ceil(top / 35)));
    const cikis = new Date($('ytarih').value + 'T' + ($('ysaat').value || '08:00') + ':00');
    const N = Array.from({ length: n + 1 }, (_, k) => ({ lat: a.lat + (b.lat - a.lat) * k / n, lon: a.lon + (b.lon - a.lon) * k / n, km: top * k / n }));
    el.innerHTML = yukleniyor('Güzergah üzerindeki noktaların tahmini yükleniyor…');
    let v;
    try { v = await cokNokta(OM, N, { hourly: 'temperature_2m,weather_code,precipitation,snowfall,visibility,wind_gusts_10m,is_day', timezone: 'Europe/Istanbul', forecast_days: 3, wind_speed_unit: 'kmh' }, 30); }
    catch (e) { el.innerHTML = hataMsg(); return; }
    const satir = N.map((p, k) => {
      const H = v[k].hourly, vr = new Date(cikis.getTime() + p.km / hiz * 36e5);
      const ts = `${vr.getFullYear()}-${iki(vr.getMonth() + 1)}-${iki(vr.getDate())}T${iki(vr.getHours())}:00`, i = H.time.indexOf(ts);
      const ad = k === 0 ? a.ad : k === n ? b.ad : enYakinIlce(p.lat, p.lon);
      if (i < 0) return `<tr><td class="l">${esc(ad)}</td><td>${n0(p.km)} km</td><td colspan="6" class="l muted">Bu saat için tahmin yok (en fazla 3 gün sonrası)</td></tr>`;
      const T = H.temperature_2m[i], kod = H.weather_code[i], gor = H.visibility[i], hm = H.wind_gusts_10m[i], kar = H.snowfall[i], yg = H.precipitation[i];
      const risk = [kar > 0 ? 'Kar' : '', T != null && T <= 1 && (yg > 0 || kar > 0) ? 'Buzlanma' : T != null && T <= 0 ? 'Gizli buzlanma olabilir' : '', gor != null && gor < 1000 ? 'Sis' : '', yg >= 4 ? 'Kuvvetli yağış' : '', hm >= 60 ? 'Kuvvetli rüzgar' : '', [95, 96, 99].includes(kod) ? 'Gök gürültüsü' : ''].filter(Boolean);
      return `<tr${risk.length ? ' class="yol-risk"' : ''}><td class="l">${esc(ad)}</td><td>${n0(p.km)} km</td>
        <td>${vr.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}${vr.getDate() !== cikis.getDate() ? '<small>' + esc(kisaGun(ts.slice(0, 10))) + '</small>' : ''}</td>
        <td class="l"><span class="ev-k">${icon(kod, H.is_day[i])}${esc(cond(kod)[0])}</span></td><td>${deg(T)}</td><td>${gor == null ? '–' : gor >= 10000 ? '10+ km' : gor >= 1000 ? dec(gor / 1000) + ' km' : n0(gor) + ' m'}</td><td>${rz(hm)}</td>
        <td class="l">${risk.length ? risk.map(r => `<span class="etiket" style="background:#F08A24;color:#fff">${r}</span>`).join(' ') : '<span class="muted">Yok</span>'}</td></tr>`;
    });
    const sure = top / hiz;
    el.innerHTML = `<p class="muted">Yaklaşık ${n0(top)} km, ${Math.floor(sure)} sa ${n0((sure % 1) * 60)} dk (ortalama ${hiz} km/sa). Tahmini varış: ${new Date(cikis.getTime() + sure * 36e5).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.</p>
      <div class="tbl-wrap"><table class="kucuk-tablo yol"><thead><tr><th class="l">Nokta</th><th>Mesafe</th><th>Varış</th><th class="l">Hava</th><th>Sıcaklık</th><th>Görüş</th><th>Hamle<small>${RZ()}</small></th><th class="l">Dikkat</th></tr></thead><tbody>${satir.join('')}</tbody></table></div>`;
  }
  {
    const sec = IL.map((I, i) => `<option value="${i}">${esc(I.ad)}</option>`).join(''), yerI = store.get('hava.yer', null), bas = (yerI && yerI.il) || 'Ankara';
    $('ynere').innerHTML = sec; $('ynereye').innerHTML = sec;
    $('ynere').value = String(Math.max(0, IL.findIndex(I => I.ad === bas)));
    $('ynereye').value = String(Math.max(0, IL.findIndex(I => I.ad === (bas === 'İstanbul' ? 'Ankara' : 'İstanbul'))));
    const su = new Date(Date.now() + 36e5);
    $('ytarih').value = `${su.getFullYear()}-${iki(su.getMonth() + 1)}-${iki(su.getDate())}`;
    $('ytarih').min = $('ytarih').value;
    $('ysaat').value = iki(su.getHours()) + ':00';
    $('ygit').addEventListener('click', yol);
    yol();
  }

  // Stadyum seçimi
  const ss = $('stsec');
  ss.innerHTML = STAD.map((x, i) => `<option value="${i}">${esc(x.ad)}</option>`).join('');
  ss.addEventListener('change', () => stadyum(STAD[+ss.value]));
  stadyum(STAD[0]);
  // Enerji için il seçimi (son bakılan yerin ili, yoksa Konya)
  const es = $('ensec'), yer = store.get('hava.yer', null), ilk = [yer && yer.il, 'Konya'].map(a => IL.findIndex(I => I.ad === a)).find(i => i >= 0) ?? 0;
  es.innerHTML = IL.map((I, i) => `<option value="${i}">${esc(I.ad)}</option>`).join('');
  es.value = String(ilk);
  es.addEventListener('change', () => enerji(IL[+es.value]));
  enerji(IL[ilk]);
  kayak(); toz(); metar(); deprem(); uzay(); dunya(); balon(); enverziyon();
})();
