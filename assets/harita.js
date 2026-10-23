// Türkiye haritası: 81 ilin şu anki durumu ve 5 günlük tahmini, havalimanı ölçümleri, sıralamalar ve tablo
(() => {
  'use strict';
  const zamanEl = $('zaman'), katEl = $('katman'), hEl = $('harita'), ljEl = $('lj'), sEl = $('siralar'), tEl = $('tablo');
  let V = null, Y = null, M = null, gun = 0, kat = 0;
  const link = ad => `<a href="${anaSayfaLink(yerIl(ad))}">${esc(ad)}</a>`;

  // Zaman −1: dün (model analizi), 0: şimdi, 1: bugün, 2: yarın ... 6
  const zamanAd = i => i === -1 ? 'Dün' : i === 0 ? 'Şimdi' : i === 1 ? 'Bugün' : i === 2 ? 'Yarın' : kisaGun(V[IL[0].ad].daily.time[i - 1]);
  const KATLAR = ['Sıcaklık', 'Yağış', 'Rüzgar', 'Havalimanı ölçümleri'];

  // Seçili zamana göre il değerleri
  function deger(ad) {
    const v = V[ad]; if (!v) return null;
    if (gun === -1) {
      if (!Y || !Y[ad]) return null;
      const D = Y[ad].daily;
      return { kod: D.weather_code[0], gunduz: 1, t: D.temperature_2m_max[0], min: D.temperature_2m_min[0], max: D.temperature_2m_max[0], y: D.precipitation_sum[0], yi: null, r: D.wind_speed_10m_max[0], h: D.wind_gusts_10m_max[0], ry: D.wind_direction_10m_dominant[0] };
    }
    if (gun === 0) {
      const C = v.current;
      return { kod: C.weather_code, gunduz: C.is_day, t: C.temperature_2m, his: C.apparent_temperature, nem: C.relative_humidity_2m, r: C.wind_speed_10m, ry: C.wind_direction_10m, h: C.wind_gusts_10m, y: v.daily.precipitation_sum[0], yi: v.daily.precipitation_probability_max[0], yson: C.precipitation, min: v.daily.temperature_2m_min[0], max: v.daily.temperature_2m_max[0] };
    }
    const D = v.daily, i = gun - 1;
    return { kod: D.weather_code[i], gunduz: 1, t: D.temperature_2m_max[i], min: D.temperature_2m_min[i], max: D.temperature_2m_max[i], y: D.precipitation_sum[i], yi: D.precipitation_probability_max[i], r: D.wind_speed_10m_max[i], h: D.wind_gusts_10m_max[i], ry: D.wind_direction_10m_dominant[i] };
  }

  function ciz() {
    if (!V) return;
    const gozlem = kat === 3;
    let fill, etiket, ek = '', lj = '', not = '';
    if (kat === 0 || gozlem) {
      fill = ad => { const d = deger(ad); return d ? sicakRenk(d.t) : null; };
      etiket = gozlem ? null : ad => { const d = deger(ad); return d && { ikon: icon(d.kod, d.gunduz), ust: deg(d.t), alt: gun ? deg(d.min) : null }; };
      lj = lejant(SICAK, '°C', gun ? 'En yüksek sıcaklık' : 'Sıcaklık');
      not = gun ? 'Simgenin altında en yüksek ve en düşük sıcaklık.' : 'Şu anki sıcaklık ve hava durumu.';
    } else if (kat === 1) {
      fill = ad => { const d = deger(ad); return d ? yagisRenk(d.y) : null; };
      etiket = ad => { const d = deger(ad); return d && { ust: mm(d.y), alt: d.yi >= 10 ? '%' + d.yi : null }; };
      lj = lejant(YAGIS, 'mm', gun > 1 ? 'Günlük toplam yağış' : 'Bugünkü toplam yağış');
      not = 'Rakam günlük toplam yağış (mm), altındaki yüzde yağış ihtimali.';
    } else {
      fill = ad => { const d = deger(ad); return d ? ruzgarRenk(gun ? d.h : d.r) : null; };
      etiket = ad => { const d = deger(ad); return d && { ust: rz(gun ? d.h : d.r), alt: d.ry != null ? dir(d.ry) : null }; };
      lj = lejant(RUZGAR, 'km/sa', gun ? 'En kuvvetli hamle' : 'Rüzgar hızı');
      not = (gun ? `Rakam günün en kuvvetli hamlesi (${RZ()}), altında hâkim rüzgar yönü.` : `Rakam şu anki rüzgar hızı (${RZ()}), altında rüzgarın geldiği yön.`) + ' Akan çizgiler rüzgarın estiği yönü gösterir; ne kadar hızlı akıyorsa rüzgar o kadar kuvvetlidir.';
    }
    if (gozlem) {
      if (!M || !M.s.length) { not = 'Havalimanı ölçümleri şu an alınamadı.'; }
      else {
        ek = '<g class="nokta">' + M.s.map(s => { const [x, y] = izdusum(s.lat, s.lon); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${sicakRenk(s.t)}"/><text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}">${s.t == null ? '–' : n0(s.t) + '°'}</text>`; }).join('') + '</g>';
        not = `${M.s.length} havalimanının gerçek ölçümü (METAR). İllerin rengi model tahminidir. Ölçüm saati: ${esc(new Date(M.t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))} civarı.`;
      }
    }
    hEl.innerHTML = haritaSvg({ fill, etiket, ek, aria: `Türkiye haritası, ${zamanAd(gun)}, ${KATLAR[kat]}` });
    ljEl.innerHTML = lj;
    $('hnot').textContent = not + ' İl üzerine gel ya da dokun; ayrıntılı tahmine oradan geçebilirsin.';
    haritaBagla(hEl, bilgi);
    ruzgarAkisi(hEl, kat === 2 ? ad => { const d = deger(ad); return d && [d.r, d.ry]; } : null);
    siralar(); tablo();
  }

  function bilgi(ad) {
    const d = deger(ad); if (!d) return esc(ad);
    let s = `<b>${esc(ad)}</b>${esc(cond(d.kod)[0])}<br>`;
    if (gun === 0) s += `Sıcaklık <span>${deg(d.t)}</span>, hissedilen <span>${deg(d.his)}</span><br>Nem <span>%${n0(d.nem)}</span>, rüzgar <span>${d.ry != null ? dir(d.ry) + ' ' : ''}${rz(d.r)} ${RZ()}</span><br>Bugün <span>${deg(d.min)} / ${deg(d.max)}</span>, yağış <span>${mm(d.y)} mm</span>`;
    else s += `En düşük <span>${deg(d.min)}</span>, en yüksek <span>${deg(d.max)}</span><br>Yağış <span>${mm(d.y)} mm</span>, ihtimal <span>%${n0(d.yi)}</span><br>Rüzgar <span>${rz(d.r)} ${RZ()}</span>, hamle <span>${rz(d.h)} ${RZ()}</span>`;
    const m = M && M.s.filter(x => x.il === ad);
    if (gun === 0 && m && m.length) s += `<br>Ölçüm (${esc(m[0].ad)}): <span>${deg(m[0].t)}</span>`;
    return s + `<br><a href="${anaSayfaLink(yerIl(ad))}">Ayrıntılı tahmin</a>`;
  }

  function siralar() {
    const L = IL.map(I => ({ ad: I.ad, ...deger(I.ad) }));
    const ilk = (f, desc, n = 10) => L.filter(x => f(x) != null).sort((a, b) => (f(b) - f(a)) * (desc ? 1 : -1)).slice(0, n);
    const liste = (bas, arr, f, b) => `<div class="sira"><h3>${bas}</h3>${arr.length ? `<ol>${arr.map(x => `<li><span>${link(x.ad)}</span><b>${f(x)}${b}</b></li>`).join('')}</ol>` : '<p class="muted">Yok</p>'}</div>`;
    if (gun === 0) {
      const yagan = L.filter(x => (x.yson ?? 0) > 0).sort((a, b) => b.yson - a.yson).slice(0, 10);
      sEl.innerHTML = liste('En sıcak iller', ilk(x => x.t, true), x => deg(x.t), '') + liste('En soğuk iller', ilk(x => x.t, false), x => deg(x.t), '')
        + liste('En rüzgarlı iller', ilk(x => x.r, true), x => rz(x.r), ' ' + RZ()) + liste('Şu an yağış alan iller', yagan, x => mm(x.yson), ' mm/sa');
      $('snot').textContent = 'Şu anki model değerleri. Gerçek ölçümler için haritada "Havalimanı ölçümleri"ni seç.';
    } else {
      sEl.innerHTML = liste('En yüksek sıcaklık', ilk(x => x.max, true), x => deg(x.max), '') + liste('En düşük sıcaklık (gece)', ilk(x => x.min, false), x => deg(x.min), '')
        + liste('En çok yağış', ilk(x => x.y, true).filter(x => x.y > 0), x => mm(x.y), ' mm') + liste('En kuvvetli hamle', ilk(x => x.h, true), x => rz(x.h), ' ' + RZ());
      $('snot').textContent = gun === -1 ? 'Dün için model analizi: ölçüm değildir ama ölçüme çok yakındır. İstasyon ölçümleri yalnızca MGM\'de yayımlanır.' : `${zamanAd(gun)} için tahmin.`;
    }
  }

  function tablo() {
    const L = IL.map(I => ({ ad: I.ad, ...deger(I.ad) }));
    const ev = r => `<span class="ev-k">${icon(r.kod, r.gunduz)}${esc(cond(r.kod)[0])}</span>`;
    const kol = gun === 0 ? [
      { b: 'İl', l: 1, v: r => r.ad, h: r => link(r.ad) }, { b: 'Hadise', l: 1, v: r => cond(r.kod)[0], h: ev },
      { b: 'Sıcaklık', v: r => r.t, h: r => deg(r.t) }, { b: 'Hissedilen', v: r => r.his, h: r => deg(r.his) }, { b: 'Nem', v: r => r.nem, h: r => pct(r.nem) },
      { b: 'Rüzgar', v: r => r.r, h: r => wind(r.ry, r.r) }, { b: 'Hamle', v: r => r.h, h: r => rz(r.h) },
      { b: 'Bugün en düşük', v: r => r.min, h: r => `<span class="c-lo">${deg(r.min)}</span>` }, { b: 'Bugün en yüksek', v: r => r.max, h: r => `<span class="c-hi">${deg(r.max)}</span>` },
      { b: 'Bugün yağış', v: r => r.y, h: r => mm(r.y) + ' mm' }
    ] : [
      { b: 'İl', l: 1, v: r => r.ad, h: r => link(r.ad) }, { b: 'Hadise', l: 1, v: r => cond(r.kod)[0], h: ev },
      { b: 'En düşük', v: r => r.min, h: r => `<span class="c-lo">${deg(r.min)}</span>` }, { b: 'En yüksek', v: r => r.max, h: r => `<span class="c-hi">${deg(r.max)}</span>` },
      { b: 'Yağış', v: r => r.y, h: r => mm(r.y) + ' mm' }, { b: 'Yağış ihtimali', v: r => r.yi, h: r => pct(r.yi) },
      { b: 'Rüzgar', v: r => r.r, h: r => wind(r.ry, r.r) }, { b: 'Hamle', v: r => r.h, h: r => rz(r.h) }
    ];
    siraliTablo(tEl, kol, L, 0);
    $('h-t').textContent = `81 il, ${zamanAd(gun).toLocaleLowerCase('tr')}`;
  }

  function ozet() {
    const t = IL.map(I => V[I.ad] && V[I.ad].current.temperature_2m).filter(x => x != null);
    const s = IL.map(I => ({ ad: I.ad, t: V[I.ad].current.temperature_2m })).sort((a, b) => b.t - a.t);
    const yagan = IL.filter(I => (V[I.ad].current.precipitation ?? 0) > 0).length;
    $('kisa').innerHTML = `<div><dt>Türkiye ortalaması</dt><dd>${deg(avgOf(t))}</dd></div><div><dt>En sıcak</dt><dd>${esc(s[0].ad)} ${deg(s[0].t)}</dd></div>
      <div><dt>En soğuk</dt><dd>${esc(s[s.length - 1].ad)} ${deg(s[s.length - 1].t)}</dd></div><div><dt>Şu an yağış alan il</dt><dd>${yagan}</dd></div>`;
  }

  async function basla() {
    hEl.innerHTML = yukleniyor('81 ilin verisi yükleniyor…');
    try {
      const v = await cokNokta(OM, IL, {
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant',
        timezone: 'Europe/Istanbul', forecast_days: 6, wind_speed_unit: 'kmh'
      });
      V = Object.fromEntries(IL.map((I, i) => [I.ad, v[i]]));
    } catch (e) { hEl.innerHTML = hataMsg(); return; }
    try { M = await havalimanlari(); } catch (e) { M = null; }
    try {
      const y = await cokNokta(OM, IL, { daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant', timezone: 'Europe/Istanbul', past_days: 1, forecast_days: 1, wind_speed_unit: 'kmh' }, 120);
      Y = Object.fromEntries(IL.map((I, i) => [I.ad, y[i]]));
    } catch (e) { Y = null; }
    ozet();
    sekmeler(katEl, KATLAR, i => { kat = i; ciz(); });
    // Havalimanı ölçümleri yalnızca "Şimdi" için anlamlı
    const ZL = [...(Y ? [-1] : []), 0, 1, 2, 3, 4, 5, 6];
    sekmeler(zamanEl, ZL.map(zamanAd), i => {
      gun = ZL[i];
      const gb = katEl.querySelector('[data-i="3"]');
      if (gb) gb.hidden = gun !== 0 || !M;
      if (gun && kat === 3) { kat = 0; katEl.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', String(j === 0))); }
      ciz();
    }, ZL.indexOf(0));
    bolgeler();
    saatlik();
  }

  // ---------- Bölgelerde hava (MGM'nin günlük tahmini gibi, model verisinden otomatik metin) ----------
  const BOLGE = {
    'Marmara': ['Edirne', 'Kırklareli', 'Tekirdağ', 'İstanbul', 'Kocaeli', 'Yalova', 'Sakarya', 'Bilecik', 'Bursa', 'Balıkesir', 'Çanakkale'],
    'Ege': ['İzmir', 'Manisa', 'Aydın', 'Denizli', 'Muğla', 'Afyonkarahisar', 'Kütahya', 'Uşak'],
    'Akdeniz': ['Antalya', 'Isparta', 'Burdur', 'Mersin', 'Adana', 'Hatay', 'Osmaniye', 'Kahramanmaraş'],
    'İç Anadolu': ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Kırıkkale', 'Aksaray', 'Karaman', 'Kırşehir', 'Niğde', 'Nevşehir', 'Yozgat', 'Çankırı'],
    'Karadeniz': ['Zonguldak', 'Bartın', 'Karabük', 'Düzce', 'Bolu', 'Kastamonu', 'Sinop', 'Samsun', 'Çorum', 'Amasya', 'Tokat', 'Ordu', 'Giresun', 'Trabzon', 'Gümüşhane', 'Bayburt', 'Rize', 'Artvin'],
    'Doğu Anadolu': ['Erzurum', 'Erzincan', 'Kars', 'Ardahan', 'Iğdır', 'Ağrı', 'Malatya', 'Elazığ', 'Tunceli', 'Bingöl', 'Muş', 'Bitlis', 'Van', 'Hakkari'],
    'Güneydoğu Anadolu': ['Gaziantep', 'Kilis', 'Adıyaman', 'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Batman', 'Siirt', 'Şırnak']
  };
  const yagis = k => ['drizzle', 'rain', 'snow', 'thunder'].includes(cond(k)[1]);
  const birlestir = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' ve ' + a[a.length - 1];
  function bolgeMetni(iller, j) {
    const D = ad => V[ad].daily, turler = {};
    iller.forEach(ad => { const k = cond(D(ad).weather_code[j])[1]; turler[k] = (turler[k] || 0) + 1; });
    const hakim = Object.keys(turler).sort((a, b) => turler[b] - turler[a])[0];
    const HAKIM = { clear: 'Az bulutlu ve açık', partly: 'Parçalı bulutlu', cloud: 'Parçalı ve çok bulutlu', fog: 'Sisli ve bulutlu', drizzle: 'Bulutlu, yer yer çisenti', rain: 'Bulutlu ve yağışlı', snow: 'Kar yağışlı', thunder: 'Sağanak ve gök gürültülü sağanak yağışlı' };
    let s = HAKIM[hakim] + '.';
    const yagan = iller.filter(ad => yagis(D(ad).weather_code[j]) && (D(ad).precipitation_sum[j] ?? 0) >= 1);
    if (yagan.length && !['rain', 'thunder', 'snow', 'drizzle'].includes(hakim)) {
      const kar = yagan.filter(ad => cond(D(ad).weather_code[j])[1] === 'snow'), gg = yagan.filter(ad => cond(D(ad).weather_code[j])[1] === 'thunder');
      s += ` ${birlestir(yagan.slice(0, 4))}${yagan.length > 4 ? ' ve çevresinde' : ' çevresinde'} ${kar.length ? 'kar' : gg.length ? 'gök gürültülü sağanak' : 'yağış'} bekleniyor.`;
    }
    const mx = iller.map(ad => D(ad).temperature_2m_max[j]), mn = iller.map(ad => D(ad).temperature_2m_min[j]);
    s += ` Sıcaklık ${deg(Math.min(...mn))} ile ${deg(Math.max(...mx))} arasında.`;
    const ruz = iller.filter(ad => (D(ad).wind_gusts_10m_max[j] ?? 0) >= 50);
    if (ruz.length) s += ` ${birlestir(ruz.slice(0, 3))} çevresinde rüzgar kuvvetli esecek.`;
    if (Math.min(...mn) <= 0) s += ' Gece ve sabah saatlerinde yüksek kesimlerde don bekleniyor.';
    return s;
  }
  function bolgeler() {
    const el = $('bolge');
    if (!el) return;
    sekmeler($('bgun'), [1, 2, 3].map(zamanAd), j => {
      el.innerHTML = Object.entries(BOLGE).map(([b, iller]) => `<div class="bolge"><h3>${b}</h3><p>${esc(bolgeMetni(iller, j))}</p>
        <ul class="bil">${iller.map(ad => { const D = V[ad].daily; return `<li><a href="${anaSayfaLink(yerIl(ad))}">${icon(D.weather_code[j], 1)}<span>${esc(ad)}</span><b><span class="c-lo">${deg(D.temperature_2m_min[j])}</span> <span class="c-hi">${deg(D.temperature_2m_max[j])}</span></b></a></li>`; }).join('')}</ul></div>`).join('');
    });
  }

  // ---------- Saat saat harita (önümüzdeki 72 saat, model çıktısı) ----------
  async function saatlik() {
    const el = $('sharita'), kEl = $('skat'), ar = $('ssaat'), zEl = $('szmn'), oy = $('soy');
    if (!el) return;
    el.innerHTML = yukleniyor('Saatlik model verisi yükleniyor…');
    let S;
    try {
      const v = await cokNokta(OM, IL, { hourly: 'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover,snow_depth,weather_code,is_day,cape,temperature_850hPa', timezone: 'Europe/Istanbul', forecast_hours: 72, wind_speed_unit: 'kmh' }, 30);
      S = Object.fromEntries(IL.map((I, i) => [I.ad, v[i].hourly]));
    } catch (e) { el.innerHTML = hataMsg(); return; }
    const zaman = S[IL[0].ad].time;
    let k = 0, i = 0, tmr = null;
    ar.max = String(zaman.length - 1);
    const KAT = [
      ['Sıcaklık', h => sicakRenk(h.temperature_2m[i]), h => ({ ikon: icon(h.weather_code[i], h.is_day[i]), ust: deg(h.temperature_2m[i]) }), () => lejant(SICAK, '°C', 'Sıcaklık')],
      ['Yağış', h => yagisRenk((h.precipitation[i] ?? 0) * 6), h => h.precipitation[i] > 0 ? { ust: dec(h.precipitation[i]) } : null, () => lejant(YAGIS.map(([v, c]) => [v / 6, c]), 'mm/saat', 'Saatlik yağış')],
      ['Rüzgar', h => ruzgarRenk(h.wind_speed_10m[i]), h => ({ ust: rz(h.wind_speed_10m[i]), alt: h.wind_direction_10m[i] != null ? dir(h.wind_direction_10m[i]) : null }), () => lejant(RUZGAR, 'km/sa', 'Rüzgar hızı')],
      ['Bulut', h => bulutRenk(h.cloud_cover[i]), h => ({ ust: '%' + n0(h.cloud_cover[i]) }), () => lejant(BULUT, '%', 'Bulutluluk')],
      ['850 hPa sıcaklık', h => sicakRenk(h.temperature_850hPa[i]), h => ({ ust: deg(h.temperature_850hPa[i]) }), () => lejant(SICAK, '°C', 'Yaklaşık 1.500 m yükseklikteki sıcaklık (850 hPa)')],
      ['Gök gürültüsü', h => firtinaRenk(h.cape[i] ?? 0), h => [95, 96, 99].includes(h.weather_code[i]) ? { ikon: icon(h.weather_code[i], h.is_day[i]), ust: n0(h.cape[i]) } : (h.cape[i] ?? 0) >= 300 ? { ust: n0(h.cape[i]) } : null, () => lejant(FIRTINA, 'J/kg', 'Gök gürültüsü ve yıldırım potansiyeli (CAPE)')],
      ['Kar kalınlığı', h => karRenk((h.snow_depth[i] ?? 0) * 100), h => (h.snow_depth[i] ?? 0) > 0.005 ? { ust: n0(h.snow_depth[i] * 100) + ' cm' } : null, () => lejant(KAR, 'cm', 'Kar kalınlığı')]
    ];
    const ciz = () => {
      const [, f, e, l] = KAT[k];
      el.innerHTML = haritaSvg({ fill: ad => f(S[ad]), etiket: ad => e(S[ad]), aria: `${KAT[k][0]} haritası, ${zaman[i]}` });
      $('slj2').innerHTML = l();
      ruzgarAkisi(el, k === 2 ? ad => [S[ad].wind_speed_10m[i], S[ad].wind_direction_10m[i]] : null);
      zEl.textContent = `${fmtWeek(ymd(zaman[i]))} ${hhmm(zaman[i])}`;
      ar.value = String(i);
      haritaBagla(el, ad => { const h = S[ad]; return `<b>${esc(ad)}</b>${esc(fmtWeek(ymd(zaman[i])))} ${hhmm(zaman[i])}<br>${esc(cond(h.weather_code[i])[0])}<br>Sıcaklık <span>${deg(h.temperature_2m[i])}</span><br>Yağış <span>${dec(h.precipitation[i])} mm</span>, bulut <span>%${n0(h.cloud_cover[i])}</span><br>Rüzgar <span>${h.wind_direction_10m[i] != null ? dir(h.wind_direction_10m[i]) : ''} ${rz(h.wind_speed_10m[i])} ${RZ()}</span>${h.snow_depth[i] > 0 ? `<br>Kar <span>${n0(h.snow_depth[i] * 100)} cm</span>` : ''}${h.temperature_850hPa[i] != null ? `<br>1.500 m (850 hPa) <span>${deg(h.temperature_850hPa[i])}</span>` : ''}${(h.cape[i] ?? 0) >= 300 ? `<br>Gök gürültüsü potansiyeli <span>${n0(h.cape[i])} J/kg</span>` : ''}`; });
    };
    const dur = () => { clearInterval(tmr); tmr = null; oy.textContent = 'Oynat'; };
    oy.addEventListener('click', () => { if (tmr) return dur(); oy.textContent = 'Durdur'; tmr = setInterval(() => { i = (i + 3) % zaman.length; ciz(); }, 900); });
    ar.addEventListener('input', () => { dur(); i = +ar.value; ciz(); });
    sekmeler(kEl, KAT.map(x => x[0]), j => { k = j; ciz(); });
  }
  basla();
})();
