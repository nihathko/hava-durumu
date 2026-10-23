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
  // ---------- Birim: km/sa ya da knot (deniz mili/saat) ----------
  let birim = store.get('hava.denizBirim', 'knot') === 'kmh' ? 'kmh' : 'knot';
  const R = v => v == null ? null : birim === 'knot' ? knot(v) : v, B = () => birim === 'knot' ? 'knot' : 'km/sa';

  // ---------- Marinalar ----------
  const MARINA = [
    ['İstanbul', 'Ataköy Marina', 40.968, 28.879], ['İstanbul', 'West İstanbul Marina', 40.977, 28.636], ['İstanbul', 'Kalamış ve Fenerbahçe', 40.976, 29.037], ['İstanbul', 'Pendik Marina', 40.866, 29.255], ['İstanbul', 'Tuzla Viaport Marina', 40.818, 29.303],
    ['Yalova', 'Setur Yalova Marina', 40.659, 29.276], ['Bursa', 'Mudanya', 40.375, 28.880], ['Çanakkale', 'Çanakkale Marina', 40.150, 26.405], ['Balıkesir', 'Ayvalık Marina', 39.310, 26.690],
    ['İzmir', 'Levent Marina', 38.405, 27.074], ['İzmir', 'Çeşme Marina', 38.323, 26.300], ['İzmir', 'Alaçatı Port', 38.247, 26.373], ['İzmir', 'Teos Marina (Sığacık)', 38.199, 26.784],
    ['Aydın', 'Kuşadası Marina', 37.871, 27.258], ['Aydın', 'Didim Marina', 37.341, 27.262], ['Muğla', 'Turgutreis Marina', 37.003, 27.256], ['Muğla', 'Yalıkavak Marina', 37.105, 27.288],
    ['Muğla', 'Bodrum Milta Marina', 37.034, 27.428], ['Muğla', 'Datça', 36.722, 27.688], ['Muğla', 'Bozburun', 36.682, 28.042], ['Muğla', 'Marmaris Netsel Marina', 36.853, 28.274],
    ['Muğla', 'Marmaris Yat Marin', 36.828, 28.312], ['Muğla', 'Göcek Marina', 36.752, 28.940], ['Muğla', 'Fethiye Ece Marina', 36.622, 29.110], ['Antalya', 'Kaş Marina', 36.199, 29.640],
    ['Antalya', 'Kemer Marina', 36.600, 30.574], ['Antalya', 'Antalya Setur Marina', 36.832, 30.606], ['Antalya', 'Alanya Marina', 36.535, 32.020], ['Mersin', 'Mersin Marina', 36.793, 34.611],
    ['Zonguldak', 'Karadeniz Ereğli', 41.280, 31.420], ['Sinop', 'Sinop Limanı', 42.023, 35.153], ['Samsun', 'Samsun Limanı', 41.290, 36.330], ['Trabzon', 'Trabzon Yat Limanı', 41.004, 39.735]
  ].map(([il, ad, lat, lon]) => ({ il, ad, lat, lon }));
  const km = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const yakinNokta = (lat, lon) => N.reduce((b, n) => km(lat, lon, n.lat, n.lon) < km(lat, lon, b.lat, b.lon) ? n : b, N[0]);
  async function marina(m) {
    const el = $('mtab');
    el.innerHTML = yukleniyor();
    const dn = yakinNokta(m.lat, m.lon);
    let w, d;
    try {
      [w, d] = await Promise.all([
        getJSON(omURL(OM, { latitude: m.lat, longitude: m.lon, timezone: 'Europe/Istanbul', forecast_days: 5, wind_speed_unit: 'kmh', hourly: 'temperature_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability' })),
        getJSON(omURL(OM_DENIZ, { latitude: dn.lat, longitude: dn.lon, timezone: 'Europe/Istanbul', forecast_days: 5, hourly: 'wave_height,wave_direction,wave_period' }))
      ]);
    } catch (e) { el.innerHTML = hataMsg(); return; }
    const H = w.hourly, M = d.hourly, now = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 13);
    const idx = H.time.map((t, i) => i).filter(i => H.time[i].slice(0, 13) >= now && +H.time[i].slice(11, 13) % 3 === 0);
    const gunler = [...new Set(idx.map(i => H.time[i].slice(0, 10)))];
    const satir = (bas, f, kls = '') => `<tr><th class="l">${bas}</th>${idx.map(i => `<td${kls ? ` class="${kls}"` : ''}>${f(i)}</td>`).join('')}</tr>`;
    el.innerHTML = `<p class="muted" style="margin:0 0 10px">${esc(m.ad)}, ${esc(m.il)}. Dalga, en yakın açık deniz noktasının (${esc(dn.ad)}) tahminidir. Rüzgar ${B()} cinsinden.</p>
      <div class="tbl-wrap"><table class="marina"><thead><tr><th class="l"></th>${gunler.map(g => `<th colspan="${idx.filter(i => H.time[i].startsWith(g)).length}" class="gunb">${esc(fmtWeek(g))}, ${esc(fmtDay(g))}</th>`).join('')}</tr>
      <tr><th class="l">Saat</th>${idx.map(i => `<th>${H.time[i].slice(11, 13)}</th>`).join('')}</tr></thead><tbody>
      ${satir('Hava', i => icon(H.weather_code[i], H.is_day[i]), 'ev ikon')}
      ${satir('Sıcaklık', i => deg(H.temperature_2m[i]))}
      ${satir('Rüzgar yönü', i => H.wind_direction_10m[i] == null ? '–' : `<span class="wd">${arrow(H.wind_direction_10m[i])}${dir(H.wind_direction_10m[i])}</span>`)}
      ${satir(`Rüzgar (${B()})`, i => n0(R(H.wind_speed_10m[i])))}
      ${satir(`Hamle (${B()})`, i => n0(R(H.wind_gusts_10m[i])))}
      ${satir('Beaufort', i => bofor(H.wind_speed_10m[i])[0])}
      ${satir('Dalga (m)', i => { const j = M.time.indexOf(H.time[i]); return j < 0 || M.wave_height[j] == null ? '–' : dec(M.wave_height[j]); })}
      ${satir('Yağış ihtimali', i => H.precipitation_probability[i] >= 10 ? '%' + H.precipitation_probability[i] : '–')}
      </tbody></table></div>`;
  }

  // ---------- Deniz yolu tahmini (kuş uçuşu güzergah) ----------
  async function denizYolu() {
    const el = $('ysonuc'), a = MARINA[+$('ynk').value], b = MARINA[+$('yvr').value], hiz = Math.max(1, +$('yhz').value || 8), cikis = +$('ycs').value;
    if (a === b) { el.innerHTML = '<p class="muted">Kalkış ve varış farklı olmalı.</p>'; return; }
    el.innerHTML = yukleniyor();
    const mesafe = km(a.lat, a.lon, b.lat, b.lon), mil = mesafe / 1.852, adim = Math.max(2, Math.ceil(mil / 12));
    const noktalar = Array.from({ length: adim + 1 }, (_, j) => ({ lat: a.lat + (b.lat - a.lat) * j / adim, lon: a.lon + (b.lon - a.lon) * j / adim, mil: mil * j / adim }));
    const bas = Date.now() + cikis * 3600e3;
    let w, d;
    try {
      [w, d] = await Promise.all([
        cokNokta(OM, noktalar, { hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility', timezone: 'GMT', forecast_days: 4, wind_speed_unit: 'kmh' }),
        cokNokta(OM_DENIZ, noktalar, { hourly: 'wave_height', timezone: 'GMT', forecast_days: 4 })
      ]);
    } catch (e) { el.innerHTML = hataMsg(); return; }
    const sat = noktalar.map((n, j) => {
      const eta = bas + n.mil / hiz * 3600e3, key = new Date(Math.round(eta / 3600e3) * 3600e3).toISOString().slice(0, 13) + ':00';
      const i = w[j].hourly.time.indexOf(key), k = d[j].hourly.time.indexOf(key), H = w[j].hourly;
      return { ...n, eta, r: i >= 0 ? H.wind_speed_10m[i] : null, ry: i >= 0 ? H.wind_direction_10m[i] : null, h: i >= 0 ? H.wind_gusts_10m[i] : null, g: i >= 0 ? H.visibility[i] : null, d: k >= 0 ? d[j].hourly.wave_height[k] : null };
    });
    const enR = maxOf(sat.map(x => x.r)), enD = maxOf(sat.map(x => x.d)), kara = sat.filter(x => x.d == null).length;
    const sure = mil / hiz;
    el.innerHTML = `<dl class="kv ozet3"><div><dt>Mesafe</dt><dd>${n0(mil)} deniz mili <small>(${n0(mesafe)} km, kuş uçuşu)</small></dd></div><div><dt>Süre</dt><dd>${Math.floor(sure)} sa ${Math.round(sure % 1 * 60)} dk <small>${hiz} knot hızla</small></dd></div>
      <div><dt>Yolda en kuvvetli rüzgar</dt><dd>${n0(R(enR))} ${B()} <small>${enR == null ? '' : bofor(enR)[0] + ' kuvvetinde'}</small></dd></div><div><dt>En yüksek dalga</dt><dd>${dec(enD)} m <small>${durum(enD)}</small></dd></div></dl>
      ${kara ? `<p class="kutu-not">Güzergahın ${kara} noktası kara ya da çok sığ kıyı üzerinde kalıyor; gerçek rotanız kıyıyı dolaşacağı için bu noktalarda dalga değeri yok.</p>` : ''}
      <div class="tbl-wrap" style="margin-top:12px"><table class="kucuk-tablo"><thead><tr><th>Mil</th><th>Tahmini geçiş</th><th>Rüzgar</th><th>Hamle</th><th>Beaufort</th><th>Dalga</th><th class="l">Deniz durumu</th><th>Görüş</th></tr></thead><tbody>
      ${sat.map(x => `<tr><td>${n0(x.mil)}</td><td>${new Date(x.eta).toLocaleString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}</td><td>${x.ry != null ? `<span class="wd">${arrow(x.ry)}${dir(x.ry)} ${n0(R(x.r))}</span>` : '–'}</td><td>${n0(R(x.h))}</td><td>${x.r == null ? '–' : bofor(x.r)[0]}</td><td>${x.d == null ? '–' : dec(x.d) + ' m'}</td><td class="l">${durumEt(x.d)}</td><td>${x.g == null ? '–' : x.g >= 10000 ? '10 km+' : dec(x.g / 1000) + ' km'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- Otomatik deniz bülteni ----------
  const BOLUM = [['Batı Karadeniz', ['İğneada', 'Şile', 'Karadeniz Ereğli', 'Amasra', 'İnebolu']], ['Doğu Karadeniz', ['Sinop', 'Samsun', 'Ordu', 'Trabzon', 'Rize', 'Hopa']],
    ['Marmara', ['İstanbul, Yenikapı açığı', 'Tekirdağ', 'Marmara Adası', 'Bandırma', 'Yalova']], ['Kuzey Ege', ['Gökçeada', 'Çanakkale Boğazı girişi', 'Ayvalık', 'İzmir Körfezi girişi']],
    ['Güney Ege', ['Çeşme', 'Kuşadası', 'Bodrum', 'Datça']], ['Batı Akdeniz', ['Marmaris', 'Fethiye', 'Kaş', 'Antalya', 'Alanya']], ['Doğu Akdeniz', ['Anamur', 'Mersin', 'İskenderun', 'Samandağ']]];
  const YON = ['kuzeyden', 'kuzeydoğudan', 'doğudan', 'güneydoğudan', 'güneyden', 'güneybatıdan', 'batıdan', 'kuzeybatıdan'];
  async function bulten() {
    const el = $('bulten');
    el.innerHTML = yukleniyor();
    let w, d;
    try {
      [w, d] = await Promise.all([
        cokNokta(OM, N, { hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,weather_code', timezone: 'Europe/Istanbul', forecast_days: 3, wind_speed_unit: 'kmh' }, 60),
        cokNokta(OM_DENIZ, N, { hourly: 'wave_height', timezone: 'Europe/Istanbul', forecast_days: 3 }, 60)
      ]);
    } catch (e) { el.innerHTML = hataMsg(); return; }
    const gunler = w[0].hourly.time.filter(t => t.endsWith('T00:00')).map(t => t.slice(0, 10)).slice(0, 3);
    const metin = (adlar, g) => {
      const js = adlar.map(a => N.findIndex(n => n.ad === a)).filter(j => j >= 0);
      const hs = w[0].hourly.time.map((t, i) => i).filter(i => w[0].hourly.time[i].startsWith(g));
      const R = [], Yx = [], Yy = [], G = [], D = [], V = []; let gg = false, sis = false, yag = false;
      js.forEach(j => hs.forEach(i => { const H = w[j].hourly, r = H.wind_speed_10m[i], y = H.wind_direction_10m[i];
        if (r != null) { R.push(r); if (y != null) { Yx.push(Math.sin(y * Math.PI / 180) * r); Yy.push(Math.cos(y * Math.PI / 180) * r); } }
        if (H.wind_gusts_10m[i] != null) G.push(H.wind_gusts_10m[i]); if (H.visibility[i] != null) V.push(H.visibility[i]);
        const k = cond(H.weather_code[i])[1]; if (k === 'thunder') gg = true; if (k === 'fog') sis = true; if (['rain', 'drizzle', 'snow'].includes(k)) yag = true;
        const dd = d[j].hourly.wave_height[i]; if (dd != null) D.push(dd); }));
      if (!R.length) return null;
      const s = R.slice().sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
      const b1 = bofor(q(.25))[0], b2 = Math.max(b1 + 1, bofor(q(.85))[0]), bMax = bofor(Math.max(...R))[0];
      const yon = YON[Math.round(((Math.atan2(avgOf(Yx), avgOf(Yy)) * 180 / Math.PI + 360) % 360) / 45) % 8];
      const firtina = bMax >= 8 || Math.max(...G) >= 75;
      const dMin = D.length ? minOf(D) : null, dMax = D.length ? maxOf(D) : null, gMin = V.length ? minOf(V) : null;
      return {
        firtina: firtina ? `${bMax >= 9 ? 'Kuvvetli fırtına' : 'Fırtına'} bekleniyor (${Math.max(8, bMax)} kuvvetinde).` : 'Fırtına beklenmiyor.',
        hava: gg ? 'Bulutlu, yer yer sağanak ve gök gürültülü sağanak yağışlı.' : yag ? 'Parçalı ve çok bulutlu, yer yer yağışlı.' : sis ? 'Sabah saatlerinde yer yer sisli, parçalı bulutlu.' : 'Az bulutlu ve açık.',
        ruzgar: `Genellikle ${yon} ${b1} ila ${b2} kuvvetinde${bMax > b2 ? `, zaman zaman ${bMax}` : ''}.`,
        dalga: dMin == null ? '–' : dMax < 0.3 ? 'Sakin, 0,5 m altında.' : Math.floor(dMin * 2) / 2 <= 0 ? `${dec(Math.ceil(dMax * 2) / 2)} m'ye kadar.` : `${dec(Math.floor(dMin * 2) / 2)} ila ${dec(Math.ceil(dMax * 2) / 2)} m.`,
        gorus: gMin == null ? '–' : gMin < 1000 ? 'Sis anında zayıf, 1 km altına düşebilir.' : gMin < 4000 ? 'İyi, yağış anında orta.' : 'İyi.',
        tehlike: firtina || dMax >= 2.5
      };
    };
    sekmeler($('bgun2'), gunler.map((g, i) => i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : fmtWeek(g)), i => {
      el.innerHTML = `<div class="bulten">${BOLUM.map(([b, adlar]) => { const m = metin(adlar, gunler[i]); if (!m) return ''; return `<div class="bb${m.tehlike ? ' tehlike' : ''}"><h3>${b}</h3><dl>
        <div><dt>Fırtına</dt><dd>${m.firtina}</dd></div><div><dt>Hava</dt><dd>${m.hava}</dd></div><div><dt>Rüzgar</dt><dd>${m.ruzgar}</dd></div><div><dt>Dalga</dt><dd>${m.dalga}</dd></div><div><dt>Görüş</dt><dd>${m.gorus}</dd></div></dl></div>`; }).join('')}</div>`;
    });
  }

  // ---------- Saat saat dalga ve rüzgar haritası (deniz üzerinde 0,5°'lik ızgara) ----------
  async function denizHaritasi() {
    const el = $('dzh'), ar = $('dzs'), zEl = $('dzz'), oy = $('dzo');
    el.innerHTML = yukleniyor('Deniz ızgarası yükleniyor…');
    // Türkiye karası üzerindeki noktalar istenmez (veri servisine gereksiz yük olmasın): il sınırlarıyla nokta-çokgen testi
    const cokgen = Object.values(TR_HARITA.il).flatMap(d => d.split('Z').filter(Boolean).map(p => p.replace('M', '').split('L').map(c => c.split(' ').map(Number))));
    const icinde = ([x, y]) => cokgen.some(P => { let ic = false; for (let a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a][1] > y) !== (P[b][1] > y) && x < (P[b][0] - P[a][0]) * (y - P[a][1]) / (P[b][1] - P[a][1]) + P[a][0]) ic = !ic; return ic; });
    const G = [];
    for (let la = 35; la <= 43; la += 0.5) for (let lo = 25.5; lo <= 42; lo += 0.5) {
      // Hücrenin dört köşesinin hepsi karadaysa atla (kıyı hücreleri kalır)
      if ((la <= 36.5 && lo >= 36.5) || (la >= 41.5 && lo >= 41.8) || (la >= 41 && lo <= 27.5)) continue; // Suriye, Gürcistan, Trakya karaları
      const k = [[-.2, -.2], [-.2, .2], [.2, -.2], [.2, .2]].map(([a, b]) => izdusum(la + a, lo + b));
      if (!k.every(icinde)) G.push({ lat: la, lon: lo });
    }
    let m, w;
    try {
      [m, w] = await Promise.all([
        cokNokta(OM_DENIZ, G, { hourly: 'wave_height,wave_direction', timezone: 'Europe/Istanbul', forecast_hours: 72 }, 60),
        cokNokta(OM, G, { hourly: 'wind_speed_10m,wind_direction_10m', timezone: 'Europe/Istanbul', forecast_hours: 72, wind_speed_unit: 'kmh' }, 60)
      ]);
    } catch (e) { el.innerHTML = hataMsg(); return; }
    const deniz = G.map((g, j) => ({ ...g, M: m[j].hourly, W: w[j].hourly })).filter(x => x.M.wave_height.some(v => v != null));
    const zaman = deniz[0].M.time;
    let i = 0, k = 0, tmr = null;
    ar.max = String(zaman.length - 1);
    const cx = 0.5 * TR_HARITA.c * TR_HARITA.k, cy = 0.5 * TR_HARITA.k;
    const ciz = () => {
      let alt = '', ok = '';
      for (const x of deniz) {
        const [px, py] = izdusum(x.lat, x.lon), v = k === 0 ? x.M.wave_height[i] : x.W.wind_speed_10m[i], y = k === 0 ? x.M.wave_direction[i] : x.W.wind_direction_10m[i];
        if (v == null) continue;
        alt += `<rect x="${(px - cx / 2).toFixed(1)}" y="${(py - cy / 2).toFixed(1)}" width="${(cx + .6).toFixed(1)}" height="${(cy + .6).toFixed(1)}" style="fill:${k === 0 ? dalgaRenk(v) : ruzgarRenk(v)}"/>`;
        if (y != null && Math.round(x.lat * 2) % 2 === 0 && Math.round(x.lon * 2) % 2 === 0) ok += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${(y + 180) % 360})"><path d="M0 -7 L3 0 L0 -2 L-3 0 Z" fill="#13212C" opacity=".6"/></g>`;
      }
      el.innerHTML = haritaSvg({ fill: () => '#CDD3C6', alt: `<g class="izgara">${alt}</g>`, ek: `<g class="izok">${ok}</g>`, aria: 'Deniz dalga ve rüzgar haritası' });
      $('dzlj').innerHTML = k === 0 ? lejant(DALGA, 'm', 'Dalga yüksekliği') : lejant(birim === 'knot' ? RUZGAR.map(([v, c]) => [Math.round(v / 1.852), c]) : RUZGAR, B(), 'Rüzgar hızı');
      zEl.textContent = `${fmtWeek(ymd(zaman[i]))} ${hhmm(zaman[i])}`;
      ar.value = String(i);
    };
    const dur = () => { clearInterval(tmr); tmr = null; oy.textContent = 'Oynat'; };
    oy.addEventListener('click', () => { if (tmr) return dur(); oy.textContent = 'Durdur'; tmr = setInterval(() => { i = (i + 3) % zaman.length; ciz(); }, 900); });
    ar.addEventListener('input', () => { dur(); i = +ar.value; ciz(); });
    sekmeler($('dzk'), ['Dalga', 'Rüzgar'], j => { k = j; ciz(); });
  }


  function ciz() {
    const renk = kat === 0 ? n => dalgaRenk(n.d) : kat === 1 ? n => sstRenk(n.sst) : n => ruzgarRenk(n.r);
    const yaz = kat === 0 ? n => n.d == null ? '–' : dec(n.d) + ' m' : kat === 1 ? n => n.sst == null ? '–' : n0(n.sst) + '°' : n => n.r == null ? '–' : n0(R(n.r));
    const ok = n => kat === 0 && n.dy != null ? `<path d="M0 -9 L3.5 -2 L0 -3.5 L-3.5 -2 Z" transform="rotate(${(n.dy + 180) % 360})" fill="#13212C" opacity=".75"/>` : kat === 2 && n.ry != null ? `<path d="M0 -9 L3.5 -2 L0 -3.5 L-3.5 -2 Z" transform="rotate(${(n.ry + 180) % 360})" fill="#13212C" opacity=".75"/>` : '';
    const ek = '<g class="dn">' + N.map(n => { const [x, y] = izdusum(n.lat, n.lon); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" data-n="${n.i}" tabindex="0" role="button" aria-label="${esc(n.ad)}"><circle r="${secili === n ? 8 : 6.5}" fill="${renk(n)}" stroke="${secili === n ? '#13212C' : '#fff'}" stroke-width="${secili === n ? 2 : 1.4}"/>${ok(n)}<text y="18">${esc(yaz(n))}</text></g>`; }).join('') + '</g>';
    hEl.innerHTML = haritaSvg({ fill: () => '#CDD3C6', ek, aria: 'Kıyı noktaları haritası' });
    ljEl.innerHTML = kat === 0 ? lejant(DALGA, 'm', 'Dalga yüksekliği') : kat === 1 ? lejant(SST, '°C', 'Deniz suyu sıcaklığı') : lejant(birim === 'knot' ? RUZGAR.map(([v, c]) => [Math.round(v / 1.852), c]) : RUZGAR, B(), 'Rüzgar hızı');
    $('dnot').textContent = (kat === 0 ? 'Belirgin dalga yüksekliği (en yüksek üçte bir dalganın ortalaması); ok dalganın gittiği yön. ' : kat === 1 ? 'Deniz yüzeyi sıcaklığı. ' : 'Rüzgar hızı (' + B() + '); ok rüzgarın estiği yön. ') + 'Bir noktaya dokununca 5 günlük tahmini açılır.';
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
      { b: 'Rüzgar', v: n => n.r, h: n => wind(n.ry, R(n.r)) }, { b: 'Hamle', v: n => n.h, h: n => n0(R(n.h)) }, { b: 'Beaufort', l: 1, v: n => n.r, h: n => n.r == null ? '–' : `${bofor(n.r)[0]}, ${bofor(n.r)[1]}` }
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
    const g2 = seritGrafik({ ...ortak, yukseklik: 130, birim: B(), sifir: true, seriler: [{ ad: 'Hamle', renk: '#C7372F', v: idx.map(i => R(W.wind_gusts_10m[i])), kalin: 1.5 }, { ad: 'Rüzgar', renk: '#3F9E8F', v: idx.map(i => R(W.wind_speed_10m[i])) }] });
    const enY = maxOf(idx.map(i => M.wave_height[i])), jY = idx.find(i => M.wave_height[i] === enY);
    selEl.innerHTML = `<dl class="kv ozet3"><div><dt>Şu an dalga</dt><dd>${dec(n.d)} m <small>${durum(n.d)}</small></dd></div><div><dt>5 günün en yükseği</dt><dd>${dec(enY)} m <small>${jY != null ? esc(kisaGun(M.time[jY].slice(0, 10))) + ' ' + hhmm(M.time[jY]) : ''}</small></dd></div>
      <div><dt>Deniz suyu</dt><dd>${dec(n.sst)}°C</dd></div><div><dt>Rüzgar</dt><dd>${wind(n.ry, R(n.r))} <small>${B()}, ${n.r == null ? '' : bofor(n.r)[1].toLocaleLowerCase('tr')}</small></dd></div></dl>
      <div class="gb"><h3>Dalga yüksekliği</h3><span class="lj"><span><i style="background:#2160A8"></i>Belirgin dalga</span><span><i style="background:#3F9E8F"></i>Rüzgar dalgası</span><span><i style="background:#8C9CAC"></i>Ölü dalga</span></span></div><div class="grafik-kutu" id="dg1">${g1.svg}</div>
      <div class="gb"><h3>Rüzgar</h3><span class="lj"><span><i style="background:#3F9E8F"></i>Ortalama</span><span><i style="background:#C7372F"></i>Hamle</span></span></div><div class="grafik-kutu" id="dg2">${g2.svg}</div>`;
    const ip = j => { const i = idx[j]; return `<b>${esc(fmtWeek(ymd(M.time[i])))} ${hhmm(M.time[i])}</b>Dalga <span>${dec(M.wave_height[i])} m</span>, periyot <span>${dec(M.wave_period[i])} sn</span><br>Rüzgar dalgası <span>${dec(M.wind_wave_height[i])} m</span>, ölü dalga <span>${dec(M.swell_wave_height[i])} m</span><br>Rüzgar <span>${W.wind_direction_10m[i] != null ? dir(W.wind_direction_10m[i]) : ''} ${n0(R(W.wind_speed_10m[i]))}</span>, hamle <span>${n0(R(W.wind_gusts_10m[i]))} ${B()}</span>`; };
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
    // Rüzgar birimi: knot ya da km/sa (tercih bu cihazda saklanır)
    let ilk = true;
    sekmeler($('dbirim'), ['knot', 'km/sa'], j => {
      if (ilk) { ilk = false; return; }
      birim = j === 0 ? 'knot' : 'kmh'; store.set('hava.denizBirim', birim);
      ciz(); tablo(); if (secili) sec(secili); marina(MARINA[+$('msec').value]);
    }, birim === 'knot' ? 0 : 1);
    // Marinalar
    const ms = $('msec'), secenek = MARINA.map((m, j) => `<option value="${j}">${esc(m.ad)}, ${esc(m.il)}</option>`).join('');
    ms.innerHTML = secenek; ms.value = '0';
    ms.addEventListener('change', () => marina(MARINA[+ms.value]));
    marina(MARINA[0]);
    // Deniz yolu
    $('ynk').innerHTML = secenek; $('ynk').value = String(MARINA.findIndex(m => m.ad === 'Bodrum Milta Marina'));
    $('yvr').innerHTML = secenek; $('yvr').value = String(MARINA.findIndex(m => m.ad === 'Marmaris Netsel Marina'));
    $('ycs').innerHTML = [0, 1, 2, 3, 6, 9, 12, 18, 24, 36, 48].map(h => `<option value="${h}">${h === 0 ? 'Şimdi' : h + ' saat sonra'}</option>`).join('');
    $('ygit').addEventListener('click', denizYolu);
    bulten();
    denizHaritasi();
  })();
})();
