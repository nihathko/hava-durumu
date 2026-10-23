// Grafik ve modeller: 10 günlük meteogram, model karşılaştırması (5 model + MET Norway), topluluk tahmini (belirsizlik)
(() => {
  'use strict';
  const mgEl = $('mg'), modEl = $('mod'), ensEl = $('ens');
  let seq = 0;
  const RENK = { sicak: 'var(--warm)', his: '#8E6CC9', ciy: '#3F9E8F', yagis: 'var(--cold)', ihtimal: '#5C8FD6', ruzgar: '#3F9E8F', hamle: '#C7372F', bulut: '#7D8C9B', alcak: '#4B5B6B', orta: '#8C9CAC', yuksek: '#B8C4CF', basinc: '#6C5BB5', nem: '#2E8FB8', cape: '#D98E00', uv: '#C25A9A' };
  const lj = arr => `<span class="lj">${arr.map(([a, r]) => `<span><i style="background:${r}"></i>${a}</span>`).join('')}</span>`;

  // ---------- 10 günlük meteogram ----------
  async function meteogram(p, s) {
    mgEl.innerHTML = yukleniyor();
    let d;
    try {
      d = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', forecast_days: 10, wind_speed_unit: 'kmh',
        hourly: 'temperature_2m,apparent_temperature,dew_point_2m,precipitation,precipitation_probability,snowfall,weather_code,is_day,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,pressure_msl,relative_humidity_2m,cape,uv_index,freezing_level_height' }));
    } catch (e) { if (s === seq) mgEl.innerHTML = hataMsg(); return; }
    if (s !== seq) return;
    const H = d.hourly, now = new Date(Date.now() + d.utc_offset_seconds * 1000).toISOString().slice(0, 13);
    let i0 = H.time.findIndex(t => t.slice(0, 13) >= now); if (i0 < 0) i0 = 0;
    const idx = H.time.map((_, i) => i).slice(i0, i0 + 228);
    const x = idx.map(i => H.time[i]), sel = k => idx.map(i => H[k][i]);
    const ortak = { x, adim: 6, ayrac: i => x[i].endsWith('T00:00'), etiketSec: t => /T(00|12):00/.test(t), xEtiket: t => t.endsWith('T00:00') ? kisaGun(t.slice(0, 10)) : t.slice(11, 13) };
    // Simge şeridi: 3 saatte bir hava durumu simgesi
    const L = 40, W = 6 * x.length + 50;
    let ik = '';
    for (let j = 0; j < x.length; j += 3) ik += `<g class="wi" transform="translate(${(L + j * 6 + 1).toFixed(1)} 0) scale(.28)">${icon(H.weather_code[idx[j]], H.is_day[idx[j]]).replace('<svg class="wi" viewBox="0 0 64 64" aria-hidden="true">', '').replace('</svg>', '')}</g>`;
    const seritler = [
      ['Sıcaklık', '°C', [['Sıcaklık', RENK.sicak], ['Hissedilen', RENK.his], ['Çiy noktası', RENK.ciy]], seritGrafik({ ...ortak, yukseklik: 150, birim: '°C', seriler: [{ ad: 'Çiy noktası', renk: RENK.ciy, v: sel('dew_point_2m'), kalin: 1.5, kesik: 1 }, { ad: 'Hissedilen', renk: RENK.his, v: sel('apparent_temperature'), kalin: 1.5 }, { ad: 'Sıcaklık', renk: RENK.sicak, v: sel('temperature_2m'), kalin: 2.5 }] })],
      ['Yağış miktarı', 'mm', [['Saatlik yağış', RENK.yagis]], seritGrafik({ ...ortak, yukseklik: 100, birim: 'mm', sifir: true, seriler: [{ ad: 'Yağış', renk: RENK.yagis, v: sel('precipitation'), tur: 'cubuk' }] })],
      ['Yağış ihtimali', '%', [['Yağış ihtimali', RENK.ihtimal]], seritGrafik({ ...ortak, yukseklik: 90, birim: '%', sifir: true, seriler: [{ ad: 'Yağış ihtimali', renk: RENK.ihtimal, v: sel('precipitation_probability'), tur: 'alan' }] })],
      ['Rüzgar', 'km/sa', [['Ortalama', RENK.ruzgar], ['Hamle', RENK.hamle]], seritGrafik({ ...ortak, yukseklik: 110, birim: 'km/sa', sifir: true, seriler: [{ ad: 'Hamle', renk: RENK.hamle, v: sel('wind_gusts_10m'), kalin: 1.5 }, { ad: 'Ortalama', renk: RENK.ruzgar, v: sel('wind_speed_10m') }] })],
      ['Bulutluluk', '%', [['Toplam', RENK.bulut], ['Alçak', RENK.alcak], ['Orta', RENK.orta], ['Yüksek', RENK.yuksek]], seritGrafik({ ...ortak, yukseklik: 100, birim: '%', sifir: true, seriler: [{ ad: 'Toplam', renk: RENK.bulut, v: sel('cloud_cover'), tur: 'alan', kalin: 1 }, { ad: 'Yüksek', renk: RENK.yuksek, v: sel('cloud_cover_high'), kalin: 1.2 }, { ad: 'Orta', renk: RENK.orta, v: sel('cloud_cover_mid'), kalin: 1.2 }, { ad: 'Alçak', renk: RENK.alcak, v: sel('cloud_cover_low'), kalin: 1.5 }] })],
      ['Deniz seviyesi basıncı', 'hPa', [['Basınç', RENK.basinc]], seritGrafik({ ...ortak, yukseklik: 100, birim: 'hPa', seriler: [{ ad: 'Basınç', renk: RENK.basinc, v: sel('pressure_msl') }] })],
      ['Bağıl nem', '%', [['Nem', RENK.nem]], seritGrafik({ ...ortak, yukseklik: 90, birim: '%', seriler: [{ ad: 'Nem', renk: RENK.nem, v: sel('relative_humidity_2m') }] })],
      ['Gök gürültülü fırtına potansiyeli (CAPE)', 'J/kg', [['CAPE', RENK.cape]], seritGrafik({ ...ortak, yukseklik: 90, birim: 'J/kg', sifir: true, seriler: [{ ad: 'CAPE', renk: RENK.cape, v: sel('cape'), tur: 'alan' }] })],
      ['UV endeksi', '', [['UV', RENK.uv]], seritGrafik({ ...ortak, yukseklik: 80, birim: 'UV', sifir: true, seriler: [{ ad: 'UV', renk: RENK.uv, v: sel('uv_index'), tur: 'alan' }] })]
    ];
    mgEl.innerHTML = `<div class="grafik-kutu"><svg width="${W}" height="24" viewBox="0 0 ${W} 24" aria-hidden="true" class="chart">${ik}</svg></div>`
      + seritler.map(([b, , l, g], k) => `<div class="gb"><h3>${b}</h3>${l.length > 1 ? lj(l) : ''}</div><div class="grafik-kutu" data-k="${k}">${g.svg}</div>`).join('')
      + '<p class="kutu-not">CAPE, havadaki kararsızlığı gösterir: 1000 J/kg üstü sağanak ve gök gürültülü fırtına, 2500 üstü kuvvetli fırtına ve dolu için uygun ortam demektir. Kesin fırtına olacağı anlamına gelmez.</p>';
    const ip = j => { const i = idx[j]; return `<b>${esc(fmtWeek(ymd(H.time[i])))} ${hhmm(H.time[i])}</b>${esc(cond(H.weather_code[i])[0])}<br>Sıcaklık <span>${deg(H.temperature_2m[i])}</span>, hissedilen <span>${deg(H.apparent_temperature[i])}</span><br>Yağış <span>${mm(H.precipitation[i])} mm</span> (%${n0(H.precipitation_probability[i] ?? 0)})${H.snowfall[i] > 0 ? `, kar <span>${dec(H.snowfall[i])} cm</span>` : ''}<br>Rüzgar <span>${dir(H.wind_direction_10m[i])} ${n0(H.wind_speed_10m[i])}</span>, hamle <span>${n0(H.wind_gusts_10m[i])} km/sa</span><br>Bulut <span>%${n0(H.cloud_cover[i])}</span>, nem <span>%${n0(H.relative_humidity_2m[i])}</span><br>Basınç <span>${n0(H.pressure_msl[i])} hPa</span>, donma seviyesi <span>${n0(H.freezing_level_height[i])} m</span>`; };
    mgEl.querySelectorAll('.grafik-kutu[data-k]').forEach(k => grafikIpucu(k, seritler[+k.dataset.k][3], ip));
    // Kutular birlikte kaysın
    const kutular = [...mgEl.querySelectorAll('.grafik-kutu')];
    kutular.forEach(k => k.addEventListener('scroll', () => { kutular.forEach(o => { if (o !== k && Math.abs(o.scrollLeft - k.scrollLeft) > 1) o.scrollLeft = k.scrollLeft; }); }, { passive: true }));
  }

  // ---------- Model karşılaştırması ----------
  const MODELLER = [['ecmwf_ifs025', 'ECMWF', 'Avrupa'], ['icon_seamless', 'ICON', 'Almanya'], ['gfs_seamless', 'GFS', 'ABD'], ['meteofrance_seamless', 'ARPEGE', 'Fransa'], ['ukmo_seamless', 'UKMO', 'İngiltere']];
  async function metNorway(p, off) {
    const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${(+p.lat).toFixed(2)}&lon=${(+p.lon).toFixed(2)}`);
    if (!r.ok) throw new Error('metno');
    const ts = (await r.json()).properties.timeseries, g = {};
    for (const t of ts) {
      const yerel = new Date(Date.parse(t.time) + off * 1000).toISOString(), gun = yerel.slice(0, 10), o = g[gun] || (g[gun] = { max: -99, min: 99, y: 0, n: 0 });
      const T = t.data.instant.details.air_temperature; o.max = Math.max(o.max, T); o.min = Math.min(o.min, T); o.n++;
      const y1 = t.data.next_1_hours, y6 = t.data.next_6_hours;
      if (y1) o.y += y1.details.precipitation_amount || 0; else if (y6 && +yerel.slice(11, 13) % 6 === 0) o.y += y6.details.precipitation_amount || 0;
    }
    return g;
  }
  async function modeller(p, s) {
    modEl.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', forecast_days: 7, daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum', models: MODELLER.map(m => m[0]).join(',') })); }
    catch (e) { if (s === seq) modEl.innerHTML = hataMsg(); return; }
    let mn = null; try { mn = await metNorway(p, d.utc_offset_seconds); } catch (e) {}
    if (s !== seq) return;
    const D = d.daily, gunler = D.time;
    const kol = [...MODELLER.map(([k, a, u]) => ({ a, u, mx: D['temperature_2m_max_' + k], mi: D['temperature_2m_min_' + k], y: D['precipitation_sum_' + k] }))];
    if (mn) kol.push({ a: 'MET Norway', u: 'Norveç', mx: gunler.map(g => mn[g] && mn[g].n >= 4 ? mn[g].max : null), mi: gunler.map(g => mn[g] && mn[g].n >= 4 ? mn[g].min : null), y: gunler.map(g => mn[g] && mn[g].n >= 4 ? mn[g].y : null) });
    const uyum = f => f == null ? '' : f < 2 ? '<span class="etiket e-az">Uyumlu</span>' : f < 4 ? '<span class="etiket e-orta">Kısmen</span>' : '<span class="etiket e-cok">Belirsiz</span>';
    const satir = (bas, f, b) => gunler.map((g, j) => {
      const v = kol.map(c => f(c)[j]).filter(x => x != null), fark = v.length > 1 ? Math.max(...v) - Math.min(...v) : null;
      return `<tr><td class="l day1">${j === 0 ? 'Bugün' : j === 1 ? 'Yarın' : esc(fmtWeek(g))}<small>${esc(fmtDay(g))}</small></td>${kol.map(c => `<td>${f(c)[j] == null ? '–' : b(f(c)[j])}</td>`).join('')}<td>${fark == null ? '–' : b === mm ? mm(fark) : dec(fark, 0) + '°'}</td><td>${b === mm ? '' : uyum(fark)}</td></tr>`;
    }).join('');
    const bas = `<thead><tr><th class="l">Gün</th>${kol.map(c => `<th>${c.a}<small>${c.u}</small></th>`).join('')}<th>Fark<small>en çok, en az</small></th><th></th></tr></thead>`;
    modEl.innerHTML = `<div class="gb"><h3>En yüksek sıcaklık</h3></div><div class="tbl-wrap"><table>${bas}<tbody>${satir('', c => c.mx, v => `<span class="c-hi">${deg(v)}</span>`)}</tbody></table></div>
      <div class="gb"><h3>En düşük sıcaklık</h3></div><div class="tbl-wrap"><table>${bas}<tbody>${satir('', c => c.mi, v => `<span class="c-lo">${deg(v)}</span>`)}</tbody></table></div>
      <div class="gb"><h3>Günlük toplam yağış (mm)</h3></div><div class="tbl-wrap"><table>${bas}<tbody>${satir('', c => c.y, mm)}</tbody></table></div>
      ${mn ? '' : '<p class="kutu-not">MET Norway tahmini şu an alınamadı; diğer modeller gösteriliyor.</p>'}
      <p class="kutu-not">"–" o modelin o gün için tahmini olmadığı anlamına gelir (ARPEGE ve UKMO daha kısa süreli tahmin yapar). Ana sayfadaki tahmin, bu modellerin bölgeye en uygun olanlarının birleşimidir.</p>`;
  }

  // ---------- Topluluk tahmini ----------
  const yuzdelik = (a, q) => { const v = a.filter(x => x != null).sort((x, y) => x - y); if (!v.length) return null; const k = (v.length - 1) * q, b = Math.floor(k); return v[b] + (v[Math.min(b + 1, v.length - 1)] - v[b]) * (k - b); };
  async function topluluk(p, s) {
    ensEl.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL('https://ensemble-api.open-meteo.com/v1/ensemble', { latitude: p.lat, longitude: p.lon, timezone: 'auto', forecast_days: 7, hourly: 'temperature_2m,precipitation', models: 'icon_seamless' }), 60); }
    catch (e) { if (s === seq) ensEl.innerHTML = hataMsg(); return; }
    if (s !== seq) return;
    const H = d.hourly, uyeT = Object.keys(H).filter(k => k.startsWith('temperature_2m')), uyeY = Object.keys(H).filter(k => k.startsWith('precipitation'));
    const now = new Date(Date.now() + d.utc_offset_seconds * 1000).toISOString().slice(0, 13);
    let i0 = H.time.findIndex(t => t.slice(0, 13) >= now); if (i0 < 0) i0 = 0;
    const idx = H.time.map((_, i) => i).slice(i0).filter((_, j) => j % 3 === 0);
    const vals = i => uyeT.map(k => H[k][i]);
    const p10 = idx.map(i => yuzdelik(vals(i), .1)), p25 = idx.map(i => yuzdelik(vals(i), .25)), p50 = idx.map(i => yuzdelik(vals(i), .5)), p75 = idx.map(i => yuzdelik(vals(i), .75)), p90 = idx.map(i => yuzdelik(vals(i), .9));
    const x = idx.map(i => H.time[i]);
    const g = seritGrafik({ x, adim: 18, yukseklik: 180, birim: '°C', ayrac: j => x[j].slice(11, 13) === '00', etiketSec: t => /T(00|12):00/.test(t), xEtiket: t => t.slice(11, 13) === '00' ? kisaGun(t.slice(0, 10)) : t.slice(11, 13),
      seriler: [{ ad: '%10–90 aralığı', renk: 'var(--warm)', v: p10.map(() => null), bant: p10.map((v, j) => [v, p90[j]]) }, { ad: '%25–75 aralığı', renk: 'var(--warm)', v: p25.map(() => null), bant: p25.map((v, j) => [v, p75[j]]) }, { ad: 'Orta değer', renk: 'var(--warm)', v: p50, kalin: 2.5 }] });
    // Günlük: üyelerin yüzde kaçı 1 mm üstü yağış veriyor
    const gunler = [...new Set(H.time.slice(i0).map(t => t.slice(0, 10)))].slice(0, 7);
    const olas = gunler.map(gn => { const ii = H.time.map((t, i) => [t, i]).filter(([t]) => t.startsWith(gn)).map(x => x[1]); const top = uyeY.map(k => sumOf(ii.map(i => H[k][i]))); return Math.round(100 * top.filter(v => v >= 1).length / top.length); });
    ensEl.innerHTML = `<div class="gb"><h3>Sıcaklık, ${uyeT.length} senaryo</h3><span class="lj"><span><i style="background:var(--warm);opacity:.35;height:10px"></i>%10–90 aralığı</span><span><i style="background:var(--warm);opacity:.6;height:10px"></i>%25–75 aralığı</span><span><i style="background:var(--warm)"></i>Orta değer</span></span></div><div class="grafik-kutu" id="ensg">${g.svg}</div>
      <div class="gb"><h3>Yağış olasılığı (1 mm ve üstü)</h3></div>
      <div class="tbl-wrap"><table><thead><tr>${gunler.map(gn => `<th>${esc(kisaGun(gn))}</th>`).join('')}</tr></thead><tbody><tr>${olas.map(o => `<td><span class="etiket ${o >= 70 ? 'e-cok' : o >= 40 ? 'e-orta' : o >= 15 ? 'e-az' : 'e-yok'}">%${o}</span></td>`).join('')}</tr></tbody></table></div>
      <p class="kutu-not">Örneğin yarın için "%70" yazıyorsa, ${uyeT.length} senaryonun yaklaşık %70'i o gün en az 1 mm yağış veriyor demektir. Bant daralıyorsa senaryolar birbirine yaklaşıyor, yani tahmin daha güvenilir.</p>`;
    grafikIpucu($('ensg'), g, j => `<b>${esc(fmtWeek(ymd(x[j])))} ${hhmm(x[j])}</b>Orta değer <span>${dec(p50[j])}°</span><br>%25–75 <span>${dec(p25[j])}° – ${dec(p75[j])}°</span><br>%10–90 <span>${dec(p10[j])}° – ${dec(p90[j])}°</span>`);
  }

  function yukle(p) {
    const s = ++seq;
    $('kisa').innerHTML = `<div><dt>Seçili yer</dt><dd>${esc(p.name)}</dd></div><div><dt>Konum</dt><dd>${coord(+p.lat, 'K', 'G')}, ${coord(+p.lon, 'D', 'B')}</dd></div>`;
    document.title = `${p.name} grafik ve modeller · Hava Durumu`;
    meteogram(p, s); modeller(p, s); topluluk(p, s);
  }
  yerSecici($('yer'), yukle);
})();
