// İklim: 1991–2020 aylık değerler ve rekorlar (ERA5), son 30 günün normalden farkı, son 3 ayın yağışı, 2050'ye kadar projeksiyon (CMIP6)
(() => {
  'use strict';
  const ayEl = $('ay'), sonEl = $('son'), yilEl = $('yil'), gelEl = $('gel');
  let seq = 0;
  const grid = v => (Math.round(v * 4) / 4).toFixed(2);
  const sicakYaz = v => v == null ? '–' : dec(v) + '°';

  // 30 yıllık günlük veriden aylık özet ve günlük normaller (cihazda saklanır)
  async function normaller(p) {
    const glat = grid(+p.lat), glon = grid(+p.lon), key = `hava.iklimay3.${glat},${glon}`;
    const c = store.get(key, null); if (c) return c;
    const r = await fetch(omURL(OM_ARSIV, { latitude: glat, longitude: glon, start_date: '1991-01-01', end_date: '2020-12-31', timezone: 'auto',
      daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunshine_duration' }));
    if (!r.ok) throw new Error('arsiv ' + r.status);
    const D = (await r.json()).daily;
    const ay = Array.from({ length: 12 }, () => ({ mx: [], mi: [], me: [], gunes: [], rmx: -99, rmxT: '', rmi: 99, rmiT: '', ryg: 0, rygT: '' }));
    const aylikYagis = {}, aylikGun = {}, gun = {}, yilMin = {};
    D.time.forEach((t, i) => {
      const m = +t.slice(5, 7) - 1, a = ay[m], ym = t.slice(0, 7), md = t.slice(5);
      const mx = D.temperature_2m_max[i], mi = D.temperature_2m_min[i], me = D.temperature_2m_mean[i], y = D.precipitation_sum[i] ?? 0, g = D.sunshine_duration[i];
      if (mx != null) { a.mx.push(mx); if (mx > a.rmx) { a.rmx = mx; a.rmxT = t; } }
      if (mi != null) { a.mi.push(mi); if (mi < a.rmi) { a.rmi = mi; a.rmiT = t; } yilMin[t.slice(0, 4)] = Math.min(yilMin[t.slice(0, 4)] ?? 99, mi); }
      if (me != null) a.me.push(me);
      if (g != null) a.gunes.push(g / 3600);
      if (y > a.ryg) { a.ryg = y; a.rygT = t; }
      aylikYagis[ym] = (aylikYagis[ym] || 0) + y; aylikGun[ym] = (aylikGun[ym] || 0) + (y >= 1 ? 1 : 0);
      const o = gun[md] || (gun[md] = { t: 0, y: 0, n: 0 }); if (me != null) { o.t += me; o.n++; } o.y += y;
    });
    const r1 = v => Math.round(v * 10) / 10;
    const out = { ay: ay.map((a, m) => {
      const yy = Object.entries(aylikYagis).filter(([k]) => +k.slice(5) === m + 1).map(x => x[1]), gg = Object.entries(aylikGun).filter(([k]) => +k.slice(5) === m + 1).map(x => x[1]);
      return { mx: r1(avgOf(a.mx)), mi: r1(avgOf(a.mi)), me: r1(avgOf(a.me)), rmx: r1(a.rmx), rmxT: a.rmxT, rmi: r1(a.rmi), rmiT: a.rmiT, y: r1(avgOf(yy)), yg: r1(avgOf(gg)), ryg: r1(a.ryg), rygT: a.rygT, gunes: r1(avgOf(a.gunes)) };
    }) };
    // Günlük normaller: 15 günlük kayan ortalama ile yumuşatılır
    const md = Object.keys(gun).filter(k => k !== '02-29').sort();
    const ham = md.map(k => [gun[k].t / gun[k].n, gun[k].y / 30]);
    out.gun = {};
    md.forEach((k, i) => { let t = 0, y = 0; for (let j = -7; j <= 7; j++) { const h = ham[(i + j + ham.length) % ham.length]; t += h[0]; y += h[1]; } out.gun[k] = [r1(t / 15), Math.round(y / 15 * 100) / 100]; });
    out.gun['02-29'] = out.gun['02-28'];
    out.yilMin = Math.round(avgOf(Object.values(yilMin)) * 10) / 10;
    store.set(key, out);
    return out;
  }

  function aylikTablo(N) {
    const A = N.ay, yil = {
      mx: avgOf(A.map(a => a.mx)), mi: avgOf(A.map(a => a.mi)), me: avgOf(A.map(a => a.me)), y: sumOf(A.map(a => a.y)), yg: sumOf(A.map(a => a.yg)), gunes: avgOf(A.map(a => a.gunes)),
      rmx: Math.max(...A.map(a => a.rmx)), rmi: Math.min(...A.map(a => a.rmi)), ryg: Math.max(...A.map(a => a.ryg))
    };
    const yilT = k => A.find(a => a[k] === yil[k]);
    const tarih = t => t ? `<em>${esc(fmtDay(t))} ${t.slice(0, 4)}</em>` : '';
    const satir = (b, f, kls = '', bu = '') => `<tr><td class="l day1">${b}${bu ? `<small>${bu}</small>` : ''}</td>${A.map(a => `<td${kls ? ` class="${kls}"` : ''}>${f(a)}</td>`).join('')}<td class="pg">${f(yil, true)}</td></tr>`;
    ayEl.innerHTML = `<div class="tbl-wrap"><table class="iklim"><thead><tr><th class="l"></th>${AY_K.map(a => `<th>${a}</th>`).join('')}<th class="pg">Yıl</th></tr></thead><tbody>
      ${satir('Ortalama sıcaklık', a => sicakYaz(a.me))}
      ${satir('Ortalama en yüksek', a => `<span class="c-hi">${sicakYaz(a.mx)}</span>`)}
      ${satir('Ortalama en düşük', a => `<span class="c-lo">${sicakYaz(a.mi)}</span>`)}
      ${satir('En yüksek (rekor)', (a, y) => `<span class="c-hi">${sicakYaz(a.rmx)}</span>${y ? tarih(yilT('rmx').rmxT) : `<em>${a.rmxT.slice(0, 4)}</em>`}`, 'past')}
      ${satir('En düşük (rekor)', (a, y) => `<span class="c-lo">${sicakYaz(a.rmi)}</span>${y ? tarih(yilT('rmi').rmiT) : `<em>${a.rmiT.slice(0, 4)}</em>`}`, 'past')}
      ${satir('Ortalama toplam yağış', a => mm(a.y), '', 'mm')}
      ${satir('Yağışlı gün sayısı', a => dec(a.yg, 0), '', '1 mm ve üstü')}
      ${satir('En çok günlük yağış', (a, y) => `${mm(a.ryg)}${y ? tarih(yilT('ryg').rygT) : `<em>${a.rygT.slice(0, 4)}</em>`}`, 'past', 'mm')}
      ${satir('Güneşlenme süresi', a => dec(a.gunes), '', 'saat/gün')}
    </tbody></table></div>
    <div class="ikili" style="margin-top:20px"><div><div class="gb"><h3>Sıcaklık</h3><span class="lj"><span><i style="background:var(--warm)"></i>Ortalama en yüksek</span><span><i style="background:#7D8C9B"></i>Ortalama</span><span><i style="background:var(--cold)"></i>Ortalama en düşük</span></span></div><div class="grafik-kutu" id="ig1"></div></div>
      <div><div class="gb"><h3>Aylık ortalama yağış</h3></div><div class="grafik-kutu" id="ig2"></div></div></div>`;
    const g1 = seritGrafik({ x: AY_K, genislik: 480, yukseklik: 200, birim: '°C', seriler: [{ ad: 'Ortalama en yüksek', renk: 'var(--warm)', v: A.map(a => a.mx) }, { ad: 'Ortalama', renk: '#7D8C9B', v: A.map(a => a.me), kesik: 1, kalin: 1.5 }, { ad: 'Ortalama en düşük', renk: 'var(--cold)', v: A.map(a => a.mi) }] });
    const g2 = seritGrafik({ x: AY_K, genislik: 480, yukseklik: 200, birim: 'mm', sifir: true, seriler: [{ ad: 'Yağış', renk: 'var(--cold)', v: A.map(a => a.y), tur: 'cubuk' }] });
    $('ig1').innerHTML = g1.svg; $('ig2').innerHTML = g2.svg;
    grafikIpucu($('ig1'), g1, i => `<b>${AYLAR[i]}</b>En yüksek <span>${sicakYaz(A[i].mx)}</span><br>Ortalama <span>${sicakYaz(A[i].me)}</span><br>En düşük <span>${sicakYaz(A[i].mi)}</span>`);
    grafikIpucu($('ig2'), g2, i => `<b>${AYLAR[i]}</b>Ortalama yağış <span>${mm(A[i].y)} mm</span><br>Yağışlı gün <span>${dec(A[i].yg, 0)}</span>`);
    const sicakAy = A.reduce((b, a, i) => a.mx > A[b].mx ? i : b, 0), soguk = A.reduce((b, a, i) => a.mi < A[b].mi ? i : b, 0), yagisli = A.reduce((b, a, i) => a.y > A[b].y ? i : b, 0);
    return { yil, sicakAy, soguk, yagisli };
  }

  async function son30(p, N, s) {
    sonEl.innerHTML = yukleniyor(); yilEl.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', past_days: 92, forecast_days: 1, daily: 'temperature_2m_mean,precipitation_sum' }), 60); }
    catch (e) { if (s === seq) { sonEl.innerHTML = hataMsg(); yilEl.innerHTML = ''; } return; }
    if (s !== seq) return;
    const D = d.daily, n = D.time.length - 1; // bugün hariç
    const t30 = D.time.slice(n - 30, n), a30 = t30.map((t, j) => { const v = D.temperature_2m_mean[n - 30 + j], nr = N.gun[t.slice(5)]; return v == null || !nr ? null : Math.round((v - nr[0]) * 10) / 10; });
    const ort = avgOf(a30), y30 = sumOf(D.precipitation_sum.slice(n - 30, n)), yn30 = sumOf(t30.map(t => N.gun[t.slice(5)][1]));
    const g = seritGrafik({ x: t30, adim: 20, yukseklik: 180, birim: '°C', sifir: true, etiketAdim: 5, xEtiket: t => noon(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      seriler: [{ ad: 'Normalden sıcak', renk: '#D73027', v: a30.map(v => v != null && v > 0 ? v : null), tur: 'cubuk' }, { ad: 'Normalden soğuk', renk: '#4575B4', v: a30.map(v => v != null && v < 0 ? v : null), tur: 'cubuk' }] });
    sonEl.innerHTML = `<dl class="kv ozet3"><div><dt>Son 30 günün sıcaklığı</dt><dd>${ort == null ? '–' : (ort > 0 ? '+' : '') + dec(ort) + '°'} <small>normalden ${ort > 0 ? 'sıcak' : 'soğuk'}</small></dd></div>
      <div><dt>Son 30 günün yağışı</dt><dd>${mm(y30)} mm <small>normali ${mm(yn30)} mm</small></dd></div></dl>
      <div class="grafik-kutu" id="sg" style="margin-top:14px">${g.svg}</div>`;
    grafikIpucu($('sg'), g, j => `<b>${esc(fmtDay(t30[j]))}</b>Ortalama <span>${dec(D.temperature_2m_mean[n - 30 + j])}°</span><br>Normal <span>${dec(N.gun[t30[j].slice(5)][0])}°</span><br>Fark <span>${a30[j] > 0 ? '+' : ''}${dec(a30[j])}°</span>`);
    // Son 3 ay yağış: birikimli, normalle karşılaştırmalı
    const t90 = D.time.slice(0, n), kum = [], kumN = []; let a = 0, b = 0;
    t90.forEach((t, j) => { a += D.precipitation_sum[j] ?? 0; b += N.gun[t.slice(5)][1]; kum.push(Math.round(a * 10) / 10); kumN.push(Math.round(b * 10) / 10); });
    const yuzde = b > 0 ? Math.round(100 * a / b) : null;
    const durum = yuzde == null ? ['', 'e-yok'] : yuzde < 50 ? ['Çok kurak', 'e-cok'] : yuzde < 80 ? ['Kurak', 'e-yuksek'] : yuzde <= 120 ? ['Normal', 'e-az'] : yuzde <= 150 ? ['Nemli', 'e-orta'] : ['Çok nemli', 'e-orta'];
    const g2 = seritGrafik({ x: t90, adim: 7, yukseklik: 180, birim: 'mm', sifir: true, etiketAdim: 15, xEtiket: t => noon(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      seriler: [{ ad: 'Normal', renk: '#7D8C9B', v: kumN, kesik: 1, kalin: 1.8 }, { ad: 'Bu yıl', renk: 'var(--cold)', v: kum, kalin: 2.5 }] });
    $('h-yil').textContent = 'Son 3 ayın yağışı';
    yilEl.innerHTML = `<dl class="kv ozet3"><div><dt>Son ${t90.length} günde düşen</dt><dd>${mm(a)} mm</dd></div><div><dt>Normali</dt><dd>${mm(b)} mm</dd></div><div><dt>Normale göre</dt><dd>%${yuzde ?? '–'} <span class="etiket ${durum[1]}">${durum[0]}</span></dd></div></dl>
      <div class="gb"><h3>Birikimli yağış</h3><span class="lj"><span><i style="background:var(--cold)"></i>Bu dönem</span><span><i style="background:#7D8C9B"></i>Normal (1991–2020)</span></span></div><div class="grafik-kutu" id="yg">${g2.svg}</div>
      <p class="kutu-not">Kuraklık göstergesi: son 3 aydaki yağışın normale oranı. %80'in altı kurak, %50'nin altı çok kurak sayılır. Resmi kuraklık izlemesi için MGM'nin kuraklık analizlerine bakın.</p>`;
    grafikIpucu($('yg'), g2, j => `<b>${esc(fmtDay(t90[j]))}</b>Bu dönem <span>${mm(kum[j])} mm</span><br>Normal <span>${mm(kumN[j])} mm</span>`);
  }

  async function gelecek(p, s) {
    gelEl.innerHTML = yukleniyor('İklim modelleri yükleniyor…');
    const glat = grid(+p.lat), glon = grid(+p.lon), key = `hava.gelecek1.${glat},${glon}`;
    let G = store.get(key, null);
    if (!G) {
      try {
        const r = await fetch(omURL('https://climate-api.open-meteo.com/v1/climate', { latitude: glat, longitude: glon, start_date: '1991-01-01', end_date: '2050-12-31', models: 'EC_Earth3P_HR,MPI_ESM1_2_XR,MRI_AGCM3_2_S', daily: 'temperature_2m_mean,precipitation_sum' }));
        if (!r.ok) throw new Error('iklim');
        const D = (await r.json()).daily, yil = {};
        D.time.forEach((t, i) => {
          const y = t.slice(0, 4), o = yil[y] || (yil[y] = { t: [], p: [0, 0, 0] });
          const v = ['EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'MRI_AGCM3_2_S'].map(m => D['temperature_2m_mean_' + m][i]).filter(x => x != null);
          if (v.length) o.t.push(avgOf(v));
          ['EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'MRI_AGCM3_2_S'].forEach((m, k) => { o.p[k] += D['precipitation_sum_' + m][i] ?? 0; });
        });
        G = Object.entries(yil).map(([y, o]) => [+y, Math.round(avgOf(o.t) * 100) / 100, Math.round(avgOf(o.p))]);
        store.set(key, G);
      } catch (e) { if (s === seq) gelEl.innerHTML = hataMsg('İklim projeksiyonu şu an alınamadı. Bu veri yoğun olduğu için servis bazen bekletir; biraz sonra sayfayı yenile.'); return; }
    }
    if (s !== seq) return;
    const taban = avgOf(G.filter(x => x[0] <= 2020).map(x => x[1])), tabanY = avgOf(G.filter(x => x[0] <= 2020).map(x => x[2]));
    const fark = G.map(x => Math.round((x[1] - taban) * 100) / 100), ko = fark.map((_, i) => i < 4 || i > fark.length - 5 ? null : avgOf(fark.slice(i - 4, i + 5)));
    const s4150 = avgOf(G.filter(x => x[0] >= 2041).map(x => x[1])) - taban, y4150 = avgOf(G.filter(x => x[0] >= 2041).map(x => x[2]));
    const g = seritGrafik({ x: G.map(x => x[0]), adim: 12, yukseklik: 190, birim: '°C', sifir: true, etiketAdim: 10,
      seriler: [{ ad: 'Yıllık fark', renk: '#E8833A', v: fark, tur: 'cubuk' }, { ad: '9 yıllık ortalama', renk: '#A50026', v: ko, kalin: 2.5 }] });
    gelEl.innerHTML = `<dl class="kv ozet3"><div><dt>2041–2050 ortalaması</dt><dd>${s4150 > 0 ? '+' : ''}${dec(s4150)}°C <small>1991–2020'ye göre</small></dd></div>
      <div><dt>Yıllık yağış değişimi</dt><dd>${tabanY ? (y4150 >= tabanY ? '+' : '') + Math.round(100 * (y4150 - tabanY) / tabanY) : '–'}%</dd></div></dl>
      <div class="gb"><h3>Yıllık ortalama sıcaklığın 1991–2020'den farkı</h3><span class="lj"><span><i style="background:#E8833A"></i>Tek yıl</span><span><i style="background:#A50026"></i>9 yıllık ortalama</span></span></div>
      <div class="grafik-kutu" id="gg">${g.svg}</div>
      <p class="kutu-not">Üç yüksek çözünürlüklü iklim modelinin (EC-Earth3P-HR, MPI-ESM1.2-XR, MRI-AGCM3.2-S) ortalaması. Modeller yalnızca 2050'ye kadar çalıştırıldığı için grafik orada biter. Tek tek yılların değeri gerçekleşen hava değildir; önemli olan uzun dönemli eğilimdir.</p>`;
    grafikIpucu($('gg'), g, i => `<b>${G[i][0]}</b>Fark <span>${fark[i] > 0 ? '+' : ''}${dec(fark[i])}°</span>${ko[i] != null ? `<br>9 yıllık ortalama <span>${ko[i] > 0 ? '+' : ''}${dec(ko[i])}°</span>` : ''}`);
  }

  // ---------- İklim sınıflandırması ve soğuğa dayanıklılık bölgesi ----------
  function sinif(N) {
    const t = N.ay.map(a => a.me), y = N.ay.map(a => a.y), mx = N.ay.map(a => a.mx);
    const k = koppen(t, y), dm = deMartonne(t, y), er = erinc(mx, y);
    $('sinif').innerHTML = `<dl class="kv ozet3">
      <div><dt>Köppen-Geiger</dt><dd><span class="etiket" style="background:${kRenk(k)};color:#13212C">${k}</span> ${esc(kAd(k))}</dd></div>
      <div><dt>De Martonne kuraklık indisi</dt><dd>${dec(dm)} <small>${dmAd(dm)}</small></dd></div>
      <div><dt>Erinç yağış etkinlik indisi</dt><dd>${dec(er)} <small>${erAd(er)}</small></dd></div>
      ${N.yilMin != null ? `<div><dt>Soğuğa dayanıklılık bölgesi (USDA)</dt><dd>${usda(N.yilMin)} <small>ortalama yıllık en düşük ${dec(N.yilMin)}°C</small></dd></div>` : ''}</dl>
      <p class="kutu-not">Köppen sınıfı, aylık sıcaklık ve yağışa göre dünyada en çok kullanılan iklim sınıflandırmasıdır. De Martonne ve Erinç indisleri iklimin ne kadar kurak ya da nemli olduğunu gösterir; Türkiye'de tarım ve ormancılıkta sık kullanılır. Soğuğa dayanıklılık bölgesi, fidan ve süs bitkisi etiketlerindeki "zone" değeriyle karşılaştırılır: bitkinin bölge numarası buradakinden küçük ya da eşitse kışı dışarıda atlatabilir.</p>`;
  }

  // ---------- Kuraklık (1–24 ay), bu yıl ve gün dereceleri: son 2 yılın ERA5 verisinden ----------
  async function uzunDonem(p, N, s) {
    const el = $('uzun'), gd = $('gd');
    el.innerHTML = yukleniyor(); gd.innerHTML = yukleniyor();
    const bit = gunEkle(bugunTR(), -6), bas = gunEkle(bit, -735);
    let D;
    try { D = (await getJSON(omURL(OM_ARSIV, { latitude: grid(+p.lat), longitude: grid(+p.lon), start_date: bas, end_date: bit, daily: 'temperature_2m_mean,precipitation_sum', timezone: 'auto' }), 720)).daily; }
    catch (e) { if (s === seq) { el.innerHTML = hataMsg('Uzun dönem verisi şu an alınamadı; arşiv servisi yoğun olabilir. Biraz sonra sayfayı yenile.'); gd.innerHTML = ''; } return; }
    if (s !== seq) return;
    const n = D.time.length, nr = t => N.gun[t.slice(5)] || [null, 0];
    const pencere = g => { const i0 = Math.max(0, n - g); let y = 0, yn = 0; for (let i = i0; i < n; i++) { y += D.precipitation_sum[i] ?? 0; yn += nr(D.time[i])[1]; } return { y, yn, o: yn ? Math.round(100 * y / yn) : null, bas: D.time[i0] }; };
    const durum = o => o == null ? ['–', 'e-yok'] : o < 50 ? ['Çok kurak', 'e-cok'] : o < 80 ? ['Kurak', 'e-yuksek'] : o <= 120 ? ['Normal', 'e-az'] : o <= 150 ? ['Nemli', 'e-orta'] : ['Çok nemli', 'e-orta'];
    const P = [[30, '1 ay'], [91, '3 ay'], [182, '6 ay'], [365, '12 ay'], [730, '24 ay']].map(([g, a]) => ({ a, ...pencere(g) }));
    // Bu yıl (1 Ocak'tan bugüne)
    const yil = bit.slice(0, 4), iy = D.time.findIndex(t => t.startsWith(yil));
    let tt = 0, tn = 0, y = 0, yn = 0, c = 0;
    for (let i = iy; i < n; i++) { if (D.temperature_2m_mean[i] == null) continue; tt += D.temperature_2m_mean[i]; tn += nr(D.time[i])[0]; y += D.precipitation_sum[i] ?? 0; yn += nr(D.time[i])[1]; c++; }
    const tf = c ? (tt - tn) / c : null;
    el.innerHTML = `<dl class="kv ozet3"><div><dt>${yil} şimdiye kadar sıcaklık</dt><dd>${tf == null ? '–' : (tf > 0 ? '+' : '') + dec(tf) + '°'} <small>normalden ${tf >= 0 ? 'sıcak' : 'soğuk'}</small></dd></div>
      <div><dt>${yil} şimdiye kadar yağış</dt><dd>${mm(y)} mm <small>normali ${mm(yn)} mm, %${yn ? Math.round(100 * y / yn) : '–'}</small></dd></div></dl>
      <div class="tbl-wrap" style="margin-top:14px"><table class="kucuk-tablo"><thead><tr><th class="l">Dönem</th><th>Yağış</th><th>Normal</th><th>Normale göre</th><th class="l">Durum</th></tr></thead><tbody>
      ${P.map(x => { const d = durum(x.o); return `<tr><td class="l day1">Son ${x.a}<small>${esc(fmtDay(x.bas))} ${x.bas.slice(0, 4)}'ten bu yana</small></td><td>${mm(x.y)} mm</td><td>${mm(x.yn)} mm</td><td>%${x.o ?? '–'}</td><td class="l"><span class="etiket ${d[1]}">${d[0]}</span></td></tr>`; }).join('')}</tbody></table></div>
      <p class="kutu-not">Kısa dönemli kuraklık (1–3 ay) tarımı ve toprak nemini, uzun dönemli kuraklık (12–24 ay) baraj, göl ve yeraltı sularını etkiler. Veri ERA5'ten gelir ve yaklaşık 6 gün gecikmelidir. Resmi kuraklık izlemesi için MGM'nin kuraklık analizlerine bakın.</p>`;
    // Isıtma (T ≤ 15°C için 18 − T) ve soğutma (T > 22°C için T − 22) gün dereceleri, MGM'nin tanımıyla
    const hdd = T => T == null ? 0 : T <= 15 ? 18 - T : 0, cdd = T => T == null ? 0 : T > 22 ? T - 22 : 0;
    const ozet = (i0, i1) => { let h = 0, hn = 0, cc = 0, cn = 0; for (let i = i0; i <= i1; i++) { h += hdd(D.temperature_2m_mean[i]); cc += cdd(D.temperature_2m_mean[i]); hn += hdd(nr(D.time[i])[0]); cn += cdd(nr(D.time[i])[0]); } return { h, hn, cc, cn }; };
    const sonAy = D.time[n - 1].slice(0, 7), oncekiAy = (() => { const d = new Date(Date.parse(sonAy + '-01T00:00:00Z') - 864e5); return d.toISOString().slice(0, 7); })();
    const ia = D.time.findIndex(t => t.startsWith(oncekiAy)), ib = D.time.findIndex(t => t.startsWith(sonAy)) - 1;
    const satir = (bas, o) => `<tr><td class="l">${bas}</td><td>${n0(o.h)}</td><td>${n0(o.hn)}</td><td>${n0(o.cc)}</td><td>${n0(o.cn)}</td></tr>`;
    gd.innerHTML = `<div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Dönem</th><th>Isıtma<small>gün derece</small></th><th>Normali</th><th>Soğutma<small>gün derece</small></th><th>Normali</th></tr></thead><tbody>
      ${ia >= 0 && ib > ia ? satir(`${AYLAR[+oncekiAy.slice(5) - 1]} ${oncekiAy.slice(0, 4)}`, ozet(ia, ib)) : ''}${satir(`${yil} şimdiye kadar`, ozet(iy, n - 1))}</tbody></table></div>
      <p class="kutu-not">Isıtma gün derecesi yüksekse doğalgaz ve yakıt ihtiyacı, soğutma gün derecesi yüksekse klima ihtiyacı artar. Normalden yüksek ısıtma değeri, o dönemin normalden soğuk geçtiğini gösterir.</p>`;
  }

  async function yukle(p) {
    const s = ++seq;
    document.title = `${p.name} iklimi · Hava Durumu`;
    $('kisa').innerHTML = `<div><dt>Seçili yer</dt><dd>${esc(p.name)}</dd></div>`;
    ayEl.innerHTML = yukleniyor('30 yıllık veri yükleniyor…'); sonEl.innerHTML = ''; yilEl.innerHTML = ''; gelEl.innerHTML = '';
    let N;
    for (let deneme = 0; ; deneme++) {
      try { N = await normaller(p); break; }
      catch (e) {
        if (s !== seq) return;
        if (deneme >= 2) { ayEl.innerHTML = hataMsg('30 yıllık veri şu an alınamadı. Bu veri büyük olduğu için servis kısa süreli bekletiyor olabilir; bir dakika sonra sayfayı yenile.'); return; }
        ayEl.innerHTML = yukleniyor('Veri servisi yoğun, birkaç saniye içinde yeniden deneniyor…');
        await new Promise(r => setTimeout(r, deneme ? 30000 : 8000));
      }
    }
    if (s !== seq) return;
    const o = aylikTablo(N);
    $('kisa').innerHTML = `<div><dt>Seçili yer</dt><dd>${esc(p.name)}</dd></div><div><dt>Yıllık ortalama</dt><dd>${sicakYaz(o.yil.me)}</dd></div><div><dt>Yıllık yağış</dt><dd>${mm(o.yil.y)} mm</dd></div>
      <div><dt>En sıcak ay</dt><dd>${AYLAR[o.sicakAy]}</dd></div><div><dt>En soğuk ay</dt><dd>${AYLAR[o.soguk]}</dd></div><div><dt>En yağışlı ay</dt><dd>${AYLAR[o.yagisli]}</dd></div>`;
    sinif(N);
    await son30(p, N, s);
    uzunDonem(p, N, s);
    gelecek(p, s);
  }
  yerSecici($('yer'), yukle);
})();
