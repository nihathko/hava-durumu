// Ziraat: 81 il zirai don uyarısı, seçili yer için toprak, su dengesi, ilaçlama saatleri, büyüme derece-gün, akarsu debisi
(() => {
  'use strict';
  let seq = 0;
  const DON = [[-10, '#313695'], [-5, '#4575B4'], [-2, '#74ADD1'], [0, '#ABD9E9'], [2, '#E0F3F8'], [6, '#F2F5E8'], [12, '#FEE090']], donRenk = rampa(DON);

  // ---------- Zirai don (81 il, 7 gün) ----------
  async function don() {
    const hEl = $('donh');
    hEl.innerHTML = yukleniyor('81 ilin 7 günlük en düşük sıcaklığı yükleniyor…');
    let v;
    try { v = await cokNokta(OM, IL, { daily: 'temperature_2m_min', timezone: 'Europe/Istanbul', forecast_days: 7 }, 60); }
    catch (e) { hEl.innerHTML = hataMsg(); return; }
    const R = Object.fromEntries(IL.map((I, i) => { const D = v[i].daily, m = minOf(D.temperature_2m_min), j = D.temperature_2m_min.indexOf(m); return [I.ad, { m, gun: D.time[j], dizi: D.temperature_2m_min, t: D.time }]; }));
    hEl.innerHTML = haritaSvg({ fill: ad => donRenk(R[ad].m), etiket: ad => ({ ust: deg(R[ad].m), alt: R[ad].m <= 2 ? kisaGun(R[ad].gun) : null }), aria: '7 günlük en düşük sıcaklık haritası' });
    $('donlj').innerHTML = lejant(DON, '°C', '7 günün en düşük sıcaklığı');
    haritaBagla(hEl, ad => { const r = R[ad]; return `<b>${esc(ad)}</b>7 günün en düşüğü <span>${deg(r.m)}</span> (${esc(kisaGun(r.gun))})<br>${r.t.map((t, j) => `${esc(kisaGun(t))}: <span>${deg(r.dizi[j])}</span>`).join('<br>')}<br><a href="${anaSayfaLink(yerIl(ad))}">Ayrıntılı tahmin</a>`; });
    const L = IL.map(I => ({ ad: I.ad, ...R[I.ad] })).sort((a, b) => a.m - b.m);
    const grup = (bas, f) => { const g = L.filter(f); return `<div class="sira"><h3>${bas} <small class="muted">(${g.length})</small></h3>${g.length ? `<ol>${g.slice(0, 20).map(x => `<li><span><a href="${anaSayfaLink(yerIl(x.ad))}">${esc(x.ad)}</a></span><b>${deg(x.m)} <small class="muted">${esc(kisaGun(x.gun))}</small></b></li>`).join('')}</ol>${g.length > 20 ? `<p class="muted">ve ${g.length - 20} il daha</p>` : ''}` : '<p class="muted">Yok</p>'}</div>`; };
    $('donl').innerHTML = grup('Kuvvetli don (−2°C ve altı)', x => x.m <= -2) + grup('Don (−2 ile 0°C)', x => x.m > -2 && x.m <= 0) + grup('Don riski (0 ile 2°C)', x => x.m > 0 && x.m <= 2);
    const sayi = L.filter(x => x.m <= 0).length;
    $('kisa').insertAdjacentHTML('afterbegin', `<div><dt>7 günde don beklenen il</dt><dd>${sayi}</dd></div>`);
  }

  // ---------- Seçili yer ----------
  const nemYorum = v => v == null ? '–' : v < 0.1 ? ['Kuru', 'e-yuksek'] : v < 0.2 ? ['Az nemli', 'e-orta'] : v < 0.35 ? ['Nemli', 'e-az'] : ['Islak', 'e-orta'];
  // ---------- Sıcaklık-nem indeksi (hayvancılık, sığırda sıcak stresi) ----------
  async function sinep(p, s) {
    const el = $('thi');
    el.innerHTML = yukleniyor();
    let d;
    try { d = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', forecast_days: 7, hourly: 'temperature_2m,relative_humidity_2m' }), 30); }
    catch (e) { if (s === seq) el.innerHTML = hataMsg(); return; }
    if (s !== seq) return;
    const H = d.hourly, thi = H.time.map((_, i) => { const T = H.temperature_2m[i], RH = H.relative_humidity_2m[i]; return T == null || RH == null ? null : (1.8 * T + 32) - (0.55 - 0.0055 * RH) * (1.8 * T - 26); });
    const SEV = v => v == null ? ['–', 'e-yok'] : v < 68 ? ['Stres yok', 'e-az'] : v < 72 ? ['Hafif stres', 'e-orta'] : v < 80 ? ['Orta stres', 'e-yuksek'] : v < 90 ? ['Ciddi stres', 'e-cok'] : ['Tehlikeli', 'e-asiri'];
    const gunler = [...new Set(H.time.map(t => t.slice(0, 10)))];
    const gun = gunler.map(g => { const ii = H.time.map((t, i) => [t, i]).filter(([t]) => t.startsWith(g)).map(x => x[1]); const v = ii.map(i => thi[i]); const m = maxOf(v); return { g, m, saat: ii.filter(i => thi[i] >= 72).length }; });
    el.innerHTML = `<div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Gün</th><th>En yüksek indeks</th><th class="l">Durum</th><th>Stresli saat<small>indeks 72 ve üstü</small></th></tr></thead><tbody>
      ${gun.map(x => { const e = SEV(x.m); return `<tr><td class="l">${esc(fmtWeek(x.g))}<small class="muted"> ${esc(fmtDay(x.g))}</small></td><td>${dec(x.m, 0)}</td><td class="l"><span class="etiket ${e[1]}">${e[0]}</span></td><td>${x.saat}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="kutu-not">Sıcaklık-nem indeksi (THI) 72'nin üstüne çıktığında süt ineklerinde süt verimi düşmeye başlar; 80 üstünde ciddi stres, 90 üstünde ölüm riski vardır. Ahırı havalandırın, gölgelik ve bol temiz su sağlayın, sağım ve yemlemeyi serin saatlere alın.</p>`;
  }

  // ---------- Bitki soğuklama ihtiyacı (meyve ağaçlarında kış dinlenmesi) ----------
  const SOGUK = [['Elma', 800, 1200], ['Armut', 600, 1200], ['Kiraz', 800, 1200], ['Vişne', 800, 1200], ['Erik', 500, 1000], ['Şeftali ve nektarin', 400, 900], ['Kayısı', 300, 900], ['Badem', 200, 500], ['Ceviz', 400, 1500], ['Fındık', 800, 1200]];
  async function soguklama(p, s) {
    const el = $('bisip');
    el.innerHTML = yukleniyor();
    const bugun = bugunTR(), y = +bugun.slice(0, 4), ay = +bugun.slice(5, 7);
    const bas = `${ay >= 10 ? y : y - 1}-10-01`, fark = Math.round((Date.parse(bugun) - Date.parse(bas)) / 864e5);
    let saatler = [];
    try {
      if (fark > 85) {
        const a = await getJSON(omURL(OM_ARSIV, { latitude: p.lat, longitude: p.lon, start_date: bas, end_date: gunEkle(bugun, -6), hourly: 'temperature_2m', timezone: 'auto' }), 720);
        saatler = a.hourly.time.map((t, i) => [t, a.hourly.temperature_2m[i]]);
      }
      const f = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', past_days: Math.min(92, fark > 85 ? 6 : fark), forecast_days: 7, hourly: 'temperature_2m' }), 60);
      const son = saatler.length ? saatler[saatler.length - 1][0] : '';
      f.hourly.time.forEach((t, i) => { if (t > son && t >= bas) saatler.push([t, f.hourly.temperature_2m[i]]); });
    } catch (e) { if (s === seq) el.innerHTML = hataMsg('Soğuklama hesabı için veri şu an alınamadı.'); return; }
    if (s !== seq) return;
    const simdi = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 13);
    const ut = T => T == null ? 0 : T <= 1.4 ? 0 : T <= 2.4 ? .5 : T <= 9.1 ? 1 : T <= 12.4 ? .5 : T <= 15.9 ? 0 : T <= 18 ? -.5 : -1;
    let cs = 0, ct = 0, cs7 = 0, utah = 0, utahGecmis = 0;
    for (const [t, T] of saatler) { const c = T != null && T >= 0 && T <= 7.2 ? 1 : 0; if (t.slice(0, 13) <= simdi) { cs += c; utahGecmis = Math.max(0, utahGecmis + ut(T)); } else cs7 += c; utah = Math.max(0, utah + ut(T)); ct += c; }
    el.innerHTML = `<dl class="kv ozet3"><div><dt>1 Ekim'den bu yana soğuklama</dt><dd>${n0(cs)} saat <small>0–7,2°C arası</small></dd></div><div><dt>Önümüzdeki 7 günde eklenecek</dt><dd>${n0(cs7)} saat</dd></div><div><dt>Utah modeli</dt><dd>${n0(utahGecmis)} birim</dd></div></dl>
      <div class="tbl-wrap" style="margin-top:12px"><table class="kucuk-tablo"><thead><tr><th class="l">Meyve</th><th>Gereken<small>yaklaşık, saat</small></th><th class="l">Durum</th></tr></thead><tbody>
      ${SOGUK.map(([ad, a, b]) => { const o = cs / a; return `<tr><td class="l">${ad}</td><td>${a}–${b}</td><td class="l">${o >= 1 ? '<span class="etiket e-az">Karşılandı</span>' : `<span class="etiket ${o >= .6 ? 'e-orta' : 'e-yok'}">%${Math.round(o * 100)}</span>`}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="kutu-not">Meyve ağaçları kışın belli bir süre soğuk görmezse ilkbaharda düzensiz ve geç çiçek açar, verim düşer. Gereken süre çeşide göre çok değişir; tablodaki aralıklar yaygın çeşitler için yaklaşıktır, kendi çeşidinizin değerini fidancınıza sorun. Sezon 1 Ekim'den başlatılır.</p>`;
  }

  // ---------- Hasat zamanı tahmini (büyüme derece-gün ile) ----------
  const URUN = [['Mısır (danelik, orta erkenci)', 10, 1500], ['Mısır (silajlık)', 10, 1200], ['Pamuk', 15.6, 1220], ['Ayçiçeği', 6, 1600], ['Soya', 10, 1300], ['Domates (tarla)', 10, 1200], ['Kışlık buğday', 0, 2200], ['Kışlık arpa', 0, 1900]];
  async function hasat(p, s) {
    const el = $('hasat-s'), ui = +$('hurun').value, ekim = $('hekim').value;
    if (!ekim) { el.innerHTML = '<p class="muted">Ekim tarihini seç.</p>'; return; }
    const [ad, taban, gerek] = URUN[ui], bugun = bugunTR(), I = enYakinIl(p), Nn = NORMAL81[I.ad];
    el.innerHTML = yukleniyor();
    const gunluk = {};
    let arsivYok = false;
    try {
      // Arşiv alınamazsa (servis yoğunsa) geçmiş günler için normaller kullanılır
      if (ekim < gunEkle(bugun, -7)) {
        try {
          const a = await getJSON(omURL(OM_ARSIV, { latitude: p.lat, longitude: p.lon, start_date: ekim, end_date: gunEkle(bugun, -6), daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto' }), 720);
          a.daily.time.forEach((t, i) => { gunluk[t] = [a.daily.temperature_2m_max[i], a.daily.temperature_2m_min[i]]; });
        } catch (e) { arsivYok = true; }
      }
      const f = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', past_days: 7, forecast_days: 16, daily: 'temperature_2m_max,temperature_2m_min' }), 60);
      f.daily.time.forEach((t, i) => { if (!gunluk[t] || gunluk[t][0] == null) gunluk[t] = [f.daily.temperature_2m_max[i], f.daily.temperature_2m_min[i], 1]; });
    } catch (e) { if (s === seq) el.innerHTML = hataMsg(); return; }
    if (s !== seq) return;
    let top = 0, gun = ekim, simdiye = 0, tahmin = false, n = 0;
    while (top < gerek && n < 400) {
      let v = gunluk[gun];
      if (!v || v[0] == null) { v = [gunlukNormal(Nn.mx, gun), gunlukNormal(Nn.mn, gun)]; tahmin = true; }
      top += Math.max(0, (v[0] + v[1]) / 2 - taban);
      if (gun <= bugun) simdiye = top;
      if (top >= gerek) break;
      gun = gunEkle(gun, 1); n++;
    }
    const bitti = top >= gerek;
    el.innerHTML = `<dl class="kv ozet3"><div><dt>Tahmini hasat (olgunlaşma)</dt><dd>${bitti ? `${esc(fmtDay(gun))} ${gun.slice(0, 4)}` : 'Bir yıl içinde olgunlaşmıyor'}</dd></div>
      <div><dt>Bugüne kadar biriken</dt><dd>${n0(simdiye)} / ${gerek} °C·gün <small>%${Math.min(100, Math.round(100 * simdiye / gerek))}</small></dd></div>
      <div><dt>Ekimden hasada</dt><dd>${bitti ? n + 1 : '–'} gün</dd></div></dl>
      <p class="kutu-not">${esc(ad)} için taban sıcaklık ${dec(taban)}°C ve gereken toplam yaklaşık ${gerek} °C·gün alındı. Ekimden bugüne gerçekleşen hava, sonraki 16 gün için tahmin${tahmin ? `, daha sonrası için ${esc(I.ad)} ilinin 1991–2020 normalleri` : ''} kullanıldı.${arsivYok ? ' Geçmiş günlerin gerçekleşen verisi şu an alınamadığı için o günlerde de normaller kullanıldı; sonuç yaklaşıktır.' : ''} Çeşit, sulama ve toprak durumuna göre gerçek tarih birkaç hafta farklı olabilir.</p>`;
  }

  // ---------- Uygun ekim zamanı ve soğuğa dayanıklılık bölgesi (NASA POWER normalleri) ----------
  function ekimZamani(p) {
    const I = enYakinIl(p), Nn = NORMAL81[I.ad], y = bugunTR().slice(0, 4);
    const gunler = Array.from({ length: 365 }, (_, i) => gunEkle(`${y}-01-01`, i));
    const T = gunler.map(g => gunlukNormal(Nn.t, g));
    const sonbahar = (esik, bas) => { for (let i = bas; i < 365; i++) if (T[i] <= esik) return gunler[i]; return null; };
    const ilkbahar = esik => { for (let i = 30; i < 200; i++) if (T[i] >= esik) return gunler[i]; return null; };
    const kBas = sonbahar(15, 200), kBit = sonbahar(8, 200), yaz = ilkbahar(12), z = usda(Nn.yilMin);
    const t = d => d ? fmtDay(d) : '–';
    $('ekim').innerHTML = `<dl class="kv ozet3">
      <div><dt>Kışlık buğday ve arpa ekimi</dt><dd>${esc(t(kBas))} – ${esc(t(kBit))}</dd></div>
      <div><dt>Mısır, ayçiçeği, pamuk ekimi</dt><dd>${esc(t(yaz))} sonrası</dd></div>
      <div><dt>Soğuğa dayanıklılık bölgesi</dt><dd>${z} <small>ortalama yıllık en düşük ${dec(Nn.yilMin)}°C</small></dd></div></dl>
      <p class="kutu-not">${esc(I.ad)} ilinin 1991–2020 normallerine göre. Kışlık tahıllar, günlük ortalama sıcaklık 15°C'nin altına indikten sonra ve 8°C'ye düşmeden önce ekilirse kışa güçlü kardeşlenmiş girer. Yazlık ürünler için toprak 10°C'yi geçmelidir; bu da normalde günlük ortalama 12°C'ye karşılık gelir. Bu yılın gerçek toprak sıcaklığını yukarıdaki "Toprak" bölümünden kontrol edin.</p>`;
  }

  let sonYer = null;
  // ---------- Don takvimi (1991–2020) ----------
  // Her yıl için ilkbaharın son ve sonbaharın ilk donlu günü (2 m'de en düşük sıcaklık 0°C ve altı), ERA5 yeniden analizinden.
  // Sonuç konum ızgarası başına bir kez hesaplanıp bu cihazda saklanır.
  const gunAd = n => new Date(Date.UTC(2021, 0, Math.round(n))).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  async function donTakvimi(p, s) {
    const el = $('dontak');
    el.innerHTML = yukleniyor('1991–2020 günlük en düşük sıcaklıkları inceleniyor…');
    const g = v => (Math.round(v * 4) / 4).toFixed(2), glat = g(+p.lat), glon = g(+p.lon), key = `hava.dontak1.${glat},${glon}`;
    let T = store.get(key, null);
    if (!T) {
      let a;
      try { a = await getJSON(omURL(OM_ARSIV, { latitude: glat, longitude: glon, start_date: '1991-01-01', end_date: '2020-12-31', daily: 'temperature_2m_min', timezone: 'auto' }), 1440); }
      catch (e) { if (s === seq) el.innerHTML = hataMsg('Geçmiş yıllar verisi şu an alınamadı. Sayfayı biraz sonra yenile.'); return; }
      const yil = {};
      a.daily.time.forEach((t, i) => {
        const v = a.daily.temperature_2m_min[i]; if (v == null || v > 0) return;
        const y = +t.slice(0, 4), d = new Date(Date.UTC(2021, +t.slice(5, 7) - 1, +t.slice(8, 10))), n = Math.round((d - Date.UTC(2021, 0, 0)) / 864e5);
        const o = yil[y] || (yil[y] = { ilk: null, son: null });
        if (n <= 212) o.son = Math.max(o.son ?? 0, n); else if (o.ilk == null) o.ilk = n;
      });
      T = Array.from({ length: 30 }, (_, k) => { const y = 1991 + k, o = yil[y] || {}; return [y, o.son ?? null, o.ilk ?? null]; });
      store.set(key, T);
    }
    if (s !== seq) return;
    const bah = T.filter(x => x[1] != null), son = T.filter(x => x[2] != null);
    if (!bah.length && !son.length) { el.innerHTML = '<p class="muted">1991–2020 arasında bu yerde 2 m yükseklikte 0°C ve altı sıcaklık hiç görülmemiş; don riski çok düşüktür.</p>'; return; }
    const ort = L => L.reduce((t, x) => t + x, 0) / L.length;
    const enGec = bah.slice().sort((a, b) => b[1] - a[1])[0], enErken = son.slice().sort((a, b) => a[2] - b[2])[0];
    const ikisi = T.filter(x => x[1] != null && x[2] != null);
    const ILK = [[60, '1 Mart'], [74, '15 Mart'], [91, '1 Nisan'], [105, '15 Nisan'], [121, '1 Mayıs'], [135, '15 Mayıs']];
    const SON = [[274, '1 Ekim'], [288, '15 Ekim'], [305, '1 Kasım'], [319, '15 Kasım'], [335, '1 Aralık']];
    const yuzde = n => Math.round(n / T.length * 100);
    el.innerHTML = `<dl class="kv ozet3">
        <div><dt>Ortalama son ilkbahar donu</dt><dd>${bah.length ? gunAd(ort(bah.map(x => x[1]))) : 'Yok'}</dd></div>
        <div><dt>En geç ilkbahar donu</dt><dd>${enGec ? `${gunAd(enGec[1])} <small>${enGec[0]}</small>` : '–'}</dd></div>
        <div><dt>Ortalama ilk sonbahar donu</dt><dd>${son.length ? gunAd(ort(son.map(x => x[2]))) : 'Yok'}</dd></div>
        <div><dt>En erken sonbahar donu</dt><dd>${enErken ? `${gunAd(enErken[2])} <small>${enErken[0]}</small>` : '–'}</dd></div>
        <div><dt>Ortalama donsuz dönem</dt><dd>${ikisi.length ? n0(ort(ikisi.map(x => x[2] - x[1]))) + ' gün' : '–'}</dd></div>
        <div><dt>Don görülen yıl</dt><dd>${T.filter(x => x[1] != null || x[2] != null).length} / 30</dd></div></dl>
      <div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">İlkbaharda bu tarihten sonra</th>${ILK.map(x => `<th>${x[1]}</th>`).join('')}</tr></thead>
        <tbody><tr><td class="l">Don görülen yılların oranı</td>${ILK.map(([n]) => `<td>%${yuzde(T.filter(x => x[1] != null && x[1] > n).length)}</td>`).join('')}</tr></tbody></table></div>
      <div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Sonbaharda bu tarihten önce</th>${SON.map(x => `<th>${x[1]}</th>`).join('')}</tr></thead>
        <tbody><tr><td class="l">Don görülen yılların oranı</td>${SON.map(([n]) => `<td>%${yuzde(T.filter(x => x[2] != null && x[2] < n).length)}</td>`).join('')}</tr></tbody></table></div>
      <p class="note">Örnek: "1 Nisan" sütunu %20 ise, 30 yılın 6'sında 1 Nisan'dan sonra da don olmuştur. Değerler yaklaşık 25 km'lik ızgaranın 2 m sıcaklığıdır; çukur alanlarda ve bitki seviyesinde don daha sık ve daha geç görülür.</p>`;
  }

  async function yer(p) {
    const s = ++seq;
    ['toprak', 'su', 'ilac', 'gdd', 'akarsu'].forEach(k => { $(k).innerHTML = yukleniyor(); });
    $('kisa').querySelectorAll('[data-yer]').forEach(x => x.remove());
    $('kisa').insertAdjacentHTML('beforeend', `<div data-yer><dt>Seçili yer</dt><dd>${esc(p.name)}</dd></div>`);
    document.title = `${p.name} ziraat · Hava Durumu`;
    sonYer = p;
    sinep(p, s); soguklama(p, s); ekimZamani(p); hasat(p, s); donTakvimi(p, s);
    let d;
    try {
      d = await getJSON(omURL(OM, { latitude: p.lat, longitude: p.lon, timezone: 'auto', past_days: 31, forecast_days: 7, wind_speed_unit: 'kmh',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_temperature_54cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_moisture_27_to_81cm',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration' }), 30);
    } catch (e) { if (s === seq) ['toprak', 'su', 'ilac', 'gdd'].forEach(k => { $(k).innerHTML = hataMsg(); }); return; }
    if (s !== seq) return;
    const H = d.hourly, D = d.daily, now = new Date(Date.now() + d.utc_offset_seconds * 1000).toISOString().slice(0, 13);
    let i0 = H.time.findIndex(t => t.slice(0, 13) >= now); if (i0 < 0) i0 = 0;
    const bugun = now.slice(0, 10), g0 = D.time.indexOf(bugun);

    // Toprak
    const DER = [['soil_temperature_0cm', 'Yüzey'], ['soil_temperature_6cm', '6 cm'], ['soil_temperature_18cm', '18 cm'], ['soil_temperature_54cm', '54 cm']];
    const NEM = [['soil_moisture_0_to_1cm', '0–1 cm'], ['soil_moisture_1_to_3cm', '1–3 cm'], ['soil_moisture_3_to_9cm', '3–9 cm'], ['soil_moisture_9_to_27cm', '9–27 cm'], ['soil_moisture_27_to_81cm', '27–81 cm']];
    const idx = H.time.map((_, i) => i).slice(i0, i0 + 168), x = idx.map(i => H.time[i]);
    const ortak = { x, adim: 6, ayrac: i => x[i].endsWith('T00:00'), etiketSec: t => /T(00|12):00/.test(t), xEtiket: t => t.endsWith('T00:00') ? kisaGun(t.slice(0, 10)) : t.slice(11, 13) };
    const TR = ['#C7372F', '#E8833A', '#B8962E', '#6C5BB5'], NR = ['#9BD3A2', '#5DB46F', '#3F9E8F', '#2E8FB8', '#2160A8'];
    const g1 = seritGrafik({ ...ortak, yukseklik: 150, birim: '°C', seriler: DER.map(([k, a], j) => ({ ad: a, renk: TR[j], v: idx.map(i => H[k][i]), kalin: j ? 1.6 : 2.2 })) });
    const g2 = seritGrafik({ ...ortak, yukseklik: 130, birim: '%', seriler: NEM.map(([k, a], j) => ({ ad: a, renk: NR[j], v: idx.map(i => H[k][i] == null ? null : H[k][i] * 100), kalin: 1.8 })) });
    const dip = 'soil_temperature_6cm', ekim = H[dip][i0];
    $('toprak').innerHTML = `<div class="ikili"><div><div class="gb"><h3>Toprak sıcaklığı, şu an</h3></div><table><tbody>${DER.map(([k, a]) => `<tr><td class="l">${a}</td><td>${dec(H[k][i0])}°</td></tr>`).join('')}</tbody></table></div>
      <div><div class="gb"><h3>Toprak nemi, şu an</h3></div><table><tbody>${NEM.map(([k, a]) => { const y = nemYorum(H[k][i0]); return `<tr><td class="l">${a}</td><td>%${n0(H[k][i0] * 100)}</td><td>${Array.isArray(y) ? `<span class="etiket ${y[1]}">${y[0]}</span>` : y}</td></tr>`; }).join('')}</tbody></table></div></div>
      <p class="kutu-not">${ekim >= 10 ? `6 cm derinlikte toprak ${dec(ekim)}°C. Mısır ve ayçiçeği gibi sıcak iklim bitkilerinin çimlenmesi için en az 10°C gerekir; bu eşik geçilmiş.` : `6 cm derinlikte toprak ${dec(ekim)}°C. Mısır ve ayçiçeği gibi sıcak iklim bitkileri için 10°C, buğday ve arpa için 4°C üstü çimlenme için uygundur.`} Nem değerleri hacimce yüzdedir; yorumlar ortalama bir toprak için yaklaşıktır.</p>
      <div class="gb"><h3>7 günlük toprak sıcaklığı</h3><span class="lj">${DER.map(([, a], j) => `<span><i style="background:${TR[j]}"></i>${a}</span>`).join('')}</span></div><div class="grafik-kutu" id="zg1">${g1.svg}</div>
      <div class="gb"><h3>7 günlük toprak nemi</h3><span class="lj">${NEM.map(([, a], j) => `<span><i style="background:${NR[j]}"></i>${a}</span>`).join('')}</span></div><div class="grafik-kutu" id="zg2">${g2.svg}</div>`;
    const ip = j => { const i = idx[j]; return `<b>${esc(fmtWeek(ymd(H.time[i])))} ${hhmm(H.time[i])}</b>${DER.map(([k, a]) => `${a} <span>${dec(H[k][i])}°</span>`).join(', ')}<br>${NEM.map(([k, a]) => `${a} <span>%${n0(H[k][i] * 100)}</span>`).join(', ')}`; };
    grafikIpucu($('zg1'), g1, ip); grafikIpucu($('zg2'), g2, ip);

    // Su dengesi
    const gecen = D.time.map((t, j) => j).filter(j => j >= g0 - 7 && j < g0), gelen = D.time.map((t, j) => j).filter(j => j >= g0 && j < g0 + 7);
    const top = (js, k) => sumOf(js.map(j => D[k][j]));
    const ihtiyac = js => Math.max(0, top(js, 'et0_fao_evapotranspiration') - top(js, 'precipitation_sum'));
    $('su').innerHTML = `<dl class="kv ozet3"><div><dt>Geçen 7 gün</dt><dd>${mm(top(gecen, 'precipitation_sum'))} mm yağış, ${mm(top(gecen, 'et0_fao_evapotranspiration'))} mm buharlaşma</dd></div>
      <div><dt>Gelecek 7 gün</dt><dd>${mm(top(gelen, 'precipitation_sum'))} mm yağış, ${mm(top(gelen, 'et0_fao_evapotranspiration'))} mm buharlaşma</dd></div>
      <div><dt>Gelecek 7 gün sulama ihtiyacı</dt><dd>${mm(ihtiyac(gelen))} mm <small>≈ ${n0(ihtiyac(gelen))} ton/dekar</small></dd></div></dl>
      <div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th class="l">Gün</th>${[...gecen, ...gelen].map(j => `<th${j === g0 ? ' class="bugun"' : ''}>${esc(kisaGun(D.time[j]))}</th>`).join('')}</tr></thead><tbody>
        <tr><td class="l">Yağış (mm)</td>${[...gecen, ...gelen].map(j => `<td>${mm(D.precipitation_sum[j])}</td>`).join('')}</tr>
        <tr><td class="l">Buharlaşma ET₀ (mm)</td>${[...gecen, ...gelen].map(j => `<td>${mm(D.et0_fao_evapotranspiration[j])}</td>`).join('')}</tr>
        <tr><td class="l">Denge (mm)</td>${[...gecen, ...gelen].map(j => { const b = (D.precipitation_sum[j] ?? 0) - (D.et0_fao_evapotranspiration[j] ?? 0); return `<td><span class="${b < 0 ? 'c-hi' : 'c-lo'}">${b > 0 ? '+' : ''}${dec(b)}</span></td>`; }).join('')}</tr>
      </tbody></table></div>
      <p class="kutu-not">Sulama ihtiyacı kısa çim örtüsü için hesaplanır; bitkinin türüne ve gelişme dönemine göre bitki katsayısıyla (Kc, genelde 0,3 ile 1,2 arası) çarpılmalıdır. 1 mm su, dekar başına 1 ton suya eşittir.</p>`;

    // İlaçlama saatleri (48 saat)
    const sa = H.time.map((_, i) => i).slice(i0, i0 + 48);
    const uygun = i => {
      const r = H.wind_speed_10m[i], h = H.wind_gusts_10m[i], t = H.temperature_2m[i], n = H.relative_humidity_2m[i], y = H.precipitation[i], yi = Math.max(H.precipitation_probability[i + 1] ?? 0, H.precipitation_probability[i + 2] ?? 0);
      const neden = [];
      if (y > 0) neden.push('yağış var'); if (yi >= 40) neden.push('yağış bekleniyor'); if (r > 15 || h > 25) neden.push('rüzgar kuvvetli'); if (r < 3) neden.push('rüzgar çok zayıf (sürüklenme riski)');
      if (t < 8) neden.push('hava soğuk'); if (t > 28) neden.push('hava sıcak'); if (n < 40) neden.push('nem düşük');
      return [!neden.length ? 2 : neden.length === 1 && /zayıf|nem düşük/.test(neden[0]) ? 1 : 0, neden];
    };
    const gunGrup = {}; sa.forEach(i => { (gunGrup[H.time[i].slice(0, 10)] = gunGrup[H.time[i].slice(0, 10)] || []).push(i); });
    const toplamUygun = sa.filter(i => uygun(i)[0] === 2).length;
    $('ilac').innerHTML = `<p class="muted" style="margin:0 0 10px">Önümüzdeki 48 saatte uygun saat sayısı: <b>${toplamUygun}</b>. Kareye gelince ya da dokununca nedeni görünür.</p>
      <div class="ilac">${Object.entries(gunGrup).map(([g, ii]) => `<div class="ilac-g"><b>${esc(fmtWeek(g))}</b><div class="ilac-s">${ii.map(i => { const [u, nd] = uygun(i); return `<span class="hk h${u}" title="${hhmm(H.time[i])}: ${u === 2 ? 'uygun' : esc(nd.join(', '))}" tabindex="0">${H.time[i].slice(11, 13)}</span>`; }).join('')}</div></div>`).join('')}</div>
      <div class="lj" style="margin-top:10px;font-size:12.5px;color:var(--muted);display:flex;gap:14px;flex-wrap:wrap"><span><span class="hk h2 kucuk"></span> Uygun</span><span><span class="hk h1 kucuk"></span> Sınırlı</span><span><span class="hk h0 kucuk"></span> Uygun değil</span></div>`;

    // Büyüme derece-gün (taban 10°C)
    const gg = D.time.map((t, j) => [t, j]).filter(([, j]) => j <= g0 + 6).map(([t, j]) => [t, Math.max(0, ((D.temperature_2m_max[j] ?? 0) + (D.temperature_2m_min[j] ?? 0)) / 2 - 10), j > g0]);
    let kum = 0; const kumD = gg.map(x => (kum += x[1], Math.round(kum * 10) / 10));
    const g3 = seritGrafik({ x: gg.map(x => x[0]), adim: 16, yukseklik: 150, birim: '°C·gün', sifir: true, etiketAdim: 7, xEtiket: t => noon(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      seriler: [{ ad: 'Günlük', renk: '#9BD3A2', v: gg.map(x => x[1]), tur: 'cubuk' }, { ad: 'Birikimli', renk: '#2E7D4F', v: kumD, kalin: 2.5 }], ayrac: i => gg[i][0] === bugun });
    const gecmis30 = kumD[g0 - 1] ?? 0;
    $('gdd').innerHTML = `<dl class="kv ozet3"><div><dt>Son 30 gün</dt><dd>${n0(gecmis30)} °C·gün</dd></div><div><dt>Gelecek 7 gün eklenecek</dt><dd>${n0(kumD[kumD.length - 1] - gecmis30)} °C·gün</dd></div></dl>
      <div class="gb"><h3>Günlük ve birikimli derece-gün</h3><span class="lj"><span><i style="background:#9BD3A2"></i>Günlük</span><span><i style="background:#2E7D4F"></i>Birikimli</span></span></div><div class="grafik-kutu" id="zg3">${g3.svg}</div>`;
    grafikIpucu($('zg3'), g3, j => `<b>${esc(fmtDay(gg[j][0]))}${gg[j][2] ? ' (tahmin)' : ''}</b>Günlük <span>${dec(gg[j][1])}</span><br>Birikimli <span>${dec(kumD[j])}</span>`);

    // Akarsu debisi
    try {
      const f = await getJSON(omURL('https://flood-api.open-meteo.com/v1/flood', { latitude: p.lat, longitude: p.lon, past_days: 30, forecast_days: 30, daily: 'river_discharge,river_discharge_p25,river_discharge_p75' }), 180);
      if (s !== seq) return;
      const F = f.daily;
      if (!F.river_discharge.some(v => v != null && v > 0)) { $('akarsu').innerHTML = '<p class="muted">Bu noktaya yakın, modelde yer alan bir akarsu yok.</p>'; return; }
      const bi = F.time.indexOf(bugun);
      const g4 = seritGrafik({ x: F.time, adim: 10, yukseklik: 170, birim: 'm³/sn', sifir: true, etiketAdim: 7, ayrac: i => i === bi, xEtiket: t => noon(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
        seriler: [{ ad: 'Tahmin aralığı', renk: '#2E8FB8', v: F.time.map(() => null), bant: F.time.map((t, j) => j >= bi ? [F.river_discharge_p25[j], F.river_discharge_p75[j]] : null) }, { ad: 'Debi', renk: '#2160A8', v: F.river_discharge, kalin: 2.2 }] });
      const simdi = F.river_discharge[bi], enY = maxOf(F.river_discharge.slice(bi));
      $('akarsu').innerHTML = `<dl class="kv ozet3"><div><dt>Bugün</dt><dd>${dec(simdi)} m³/sn</dd></div><div><dt>30 günde en yüksek</dt><dd>${dec(enY)} m³/sn</dd></div><div><dt>Eğilim</dt><dd>${enY > simdi * 1.5 ? 'Artış bekleniyor' : F.river_discharge[Math.min(bi + 7, F.time.length - 1)] < simdi * 0.8 ? 'Azalıyor' : 'Yaklaşık aynı'}</dd></div></dl>
        <div class="gb"><h3>Son 30 gün ve gelecek 30 gün</h3><span class="lj"><span><i style="background:#2160A8"></i>Debi</span><span><i style="background:#2E8FB8;opacity:.35;height:10px"></i>Tahmin aralığı (%25–75)</span></span></div><div class="grafik-kutu" id="zg4">${g4.svg}</div>`;
      grafikIpucu($('zg4'), g4, j => `<b>${esc(fmtDay(F.time[j]))}${j > bi ? ' (tahmin)' : ''}</b>Debi <span>${dec(F.river_discharge[j])} m³/sn</span>${j >= bi ? `<br>Aralık <span>${dec(F.river_discharge_p25[j])} – ${dec(F.river_discharge_p75[j])}</span>` : ''}`);
    } catch (e) { if (s === seq) $('akarsu').innerHTML = hataMsg('Akarsu verisi şu an alınamadı.'); }
  }

  // Hasat aracı: ürün listesi ve varsayılan ekim tarihi (bu yılın 15 Nisan'ı; kışlık tahıllar için geçen yılın 15 Ekim'i)
  $('hurun').innerHTML = URUN.map(([a], i) => `<option value="${i}">${esc(a)}</option>`).join('');
  const varsayilan = () => { const y = +bugunTR().slice(0, 4); return URUN[+$('hurun').value][1] === 0 ? `${bugunTR().slice(5) >= '10-15' ? y : y - 1}-10-15` : `${y}-04-15`; };
  $('hekim').value = varsayilan();
  $('hurun').addEventListener('change', () => { $('hekim').value = varsayilan(); if (sonYer) hasat(sonYer, seq); });
  $('hgit').addEventListener('click', () => { if (sonYer) hasat(sonYer, seq); });
  don();
  yerSecici($('yer'), yer);
})();
