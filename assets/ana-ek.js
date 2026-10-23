// Ana sayfanın ek bölümleri: dün bu saatte, sağlık ve etkinlik endeksleri, haftanın özeti,
// tahmin güveni ve yağış aralığı, atmosfer ve yükseklik, yakındaki yerler.
// Endeksler hava verisinden basit kurallarla hesaplanır; tıbbi ya da resmi bir değerlendirme değildir.

// ---------- Ek veriler ----------
// Dünkü saatlik sıcaklık ve yukarı katmanlar (850, 700, 500 hPa) tek istekte
function ekVeri(p) {
  return getJSON(omURL(OM, {
    latitude: (+p.lat).toFixed(3), longitude: (+p.lon).toFixed(3), timezone: 'auto', past_days: 1, forecast_days: 2, wind_speed_unit: 'kmh',
    hourly: 'temperature_2m,temperature_850hPa,temperature_700hPa,temperature_500hPa,wind_speed_850hPa,wind_direction_850hPa,wind_speed_700hPa,wind_direction_700hPa,wind_speed_500hPa,wind_direction_500hPa,geopotential_height_850hPa,geopotential_height_700hPa,geopotential_height_500hPa,freezing_level_height'
  }), 30);
}
// Üç büyük modelin günlük tahmini: yağış aralığı ve tahmin güveni bunlardan çıkar
const MODELLER = [['ecmwf_ifs025', 'ECMWF'], ['icon_seamless', 'ICON'], ['gfs_seamless', 'GFS']];
function modelVeri(p) {
  return getJSON(omURL(OM, {
    latitude: (+p.lat).toFixed(3), longitude: (+p.lon).toFixed(3), timezone: 'auto', forecast_days: 10,
    models: MODELLER.map(m => m[0]).join(','), daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum'
  }), 60);
}
// Aynı ildeki (ya da konuma en yakın) 8 ilçe
function yakinYerler(p) {
  const km = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const hepsi = [];
  for (const I of IL) {
    if (p.il && I.ad !== p.il) continue;
    for (const x of I.ilceler) {
      if (x[1] == null || (p.ilce && x[0] === p.ilce)) continue;
      const y = yerIl(I.ad, x[0]);
      if (!p.ilce && x[0] === 'Merkez') continue;
      hepsi.push({ ...y, d: km(+p.lat, +p.lon, x[1], x[2]) });
    }
  }
  return hepsi.filter(y => y.d > 1 && y.d < 120).sort((a, b) => a.d - b.d).slice(0, 8);
}
function yakinVeri(yerler) {
  return cokNokta(OM, yerler, { current: 'temperature_2m,weather_code,is_day', daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max', timezone: 'auto', forecast_days: 1 }, 30);
}

// ---------- Dün bu saatte ----------
function dunBuSaat(e, d) {
  const t = new Date(d.current.time.slice(0, 13) + ':00Z');
  t.setUTCDate(t.getUTCDate() - 1);
  const i = e.hourly.time.indexOf(t.toISOString().slice(0, 13) + ':00'), v = i >= 0 ? e.hourly.temperature_2m[i] : null;
  if (v == null) return '';
  const f = Math.round(sicV(d.current.temperature_2m)) - Math.round(sicV(v));
  return `Dün bu saatte <b>${deg(v)}</b>${f ? `, bugün ${Math.abs(f)}° daha ${f > 0 ? 'sıcak' : 'serin'}` : ', bugünle aynı'}`;
}

// ---------- Ortak hesaplar ----------
const SEVIYE = [['Düşük', '#50C878'], ['Orta', '#F0C419'], ['Yüksek', '#F08A24'], ['Çok yüksek', '#E0453A']];
const PUAN = [[3, 'Kötü', '#E0453A'], [5, 'Zayıf', '#F08A24'], [7.5, 'İyi', '#B5D33D'], [Infinity, 'Çok iyi', '#50C878']];
const kirp = (v, a, b) => Math.min(b, Math.max(a, v));
// Konfor aralığının dışında kalan her derece için ceza
const konfor = (t, a, b, k = 0.5) => (t == null ? 0 : t < a ? (a - t) * k : t > b ? (t - b) * k : 0);
function pencere(d, bas, son) {
  const H = d.hourly, I = [];
  for (let i = bas; i <= Math.min(son, H.time.length - 1); i++) I.push(i);
  const al = k => I.map(i => H[k] && H[k][i]);
  const kodlar = al('weather_code').map(c => cond(c)[1]);
  return {
    n: I.length, t: avgOf(al('temperature_2m')), tmax: maxOf(al('temperature_2m')), tmin: minOf(al('temperature_2m')), his: maxOf(al('apparent_temperature')),
    nem: avgOf(al('relative_humidity_2m')), pr: maxOf(al('precipitation_probability')) ?? 0, mm: al('precipitation').reduce((s, x) => s + (x || 0), 0),
    mmSaat: maxOf(al('precipitation')) ?? 0, r: maxOf(al('wind_speed_10m')) ?? 0, h: maxOf(al('wind_gusts_10m')) ?? 0, uv: maxOf(al('uv_index')) ?? 0,
    gor: minOf(al('visibility')), bulut: avgOf(al('cloud_cover')), cape: maxOf(al('cape')) ?? 0,
    kar: kodlar.includes('snow'), firtina: kodlar.includes('thunder'), sis: kodlar.includes('fog')
  };
}
function ayAydinlik(ms) {
  const f = ((((ms / 864e5 + 2440587.5 - 2451550.1) / 29.530588853) % 1) + 1) % 1;
  return (1 - Math.cos(2 * Math.PI * f)) / 2;
}
// Etkinlikler için gündüz penceresi: bugün gün batımına 3 saatten az kaldıysa yarının gündüzü
function gunduzPenceresi(d) {
  const H = d.hourly, i0 = H.time.indexOf(d.current.time.slice(0, 13) + ':00'), D = d.daily;
  const bat = H.time.indexOf(D.sunset[0].slice(0, 13) + ':00');
  if (i0 >= 0 && bat - i0 >= 3) return { bas: i0, son: bat, ad: 'Bugün' };
  const yarin = D.time[1], b = H.time.indexOf(yarin + 'T09:00'), s = H.time.indexOf(yarin + 'T18:00');
  return { bas: b, son: s, ad: 'Yarın' };
}

// ---------- Sağlık ----------
function saglikListesi(d, air) {
  const H = d.hourly, D = d.daily, i0 = Math.max(0, H.time.indexOf(d.current.time.slice(0, 13) + ':00')), w = pencere(d, i0, i0 + 24);
  const p0 = H.pressure_msl ? H.pressure_msl[i0] : null, p24 = H.pressure_msl ? H.pressure_msl[Math.min(H.time.length - 1, i0 + 24)] : null;
  const dp = p0 != null && p24 != null ? p24 - p0 : 0, fark = D.temperature_2m_max[0] - D.temperature_2m_min[0];
  const nemFark = (D.relative_humidity_2m_max[0] ?? 0) - (D.relative_humidity_2m_min[0] ?? 0), ertesi = D.temperature_2m_max[1] - D.temperature_2m_max[0];
  const aqi = air && air.current ? air.current.european_aqi : null;
  const POLEN = ['alder_pollen', 'birch_pollen', 'olive_pollen', 'grass_pollen', 'mugwort_pollen', 'ragweed_pollen'];
  const polen = air && air.hourly ? maxOf(POLEN.map(k => maxOf(air.hourly[k] || []))) : null;
  const yap = (ad, kurallar) => {
    let s = 0; const neden = [];
    for (const [k, puan, metin] of kurallar) if (k) { s += puan; neden.push(metin); }
    return { ad, s: kirp(Math.round(s), 0, 3), neden: neden[0] || 'Belirgin bir tetikleyici yok.' };
  };
  const dpMetin = `${dp > 0 ? 'Basınç 24 saatte ' + dec(dp) + ' hPa yükseliyor' : 'Basınç 24 saatte ' + dec(-dp) + ' hPa düşüyor'}.`;
  return [
    yap('Migren', [[Math.abs(dp) >= 8, 2, dpMetin], [Math.abs(dp) >= 4 && Math.abs(dp) < 8, 1, dpMetin], [fark >= 12, 1, `Gece ile gündüz arasında ${n0(sicFark(fark))}° fark var.`], [w.his >= 32, 1, 'Hava çok sıcak hissettiriyor.'], [w.h >= 50, 1, 'Kuvvetli rüzgar bekleniyor.']]),
    yap('Eklem ağrısı', [[dp <= -8, 2, dpMetin], [dp <= -4 && dp > -8, 1, dpMetin], [w.nem >= 80, 1, `Nem yüksek (%${n0(w.nem)}).`], [w.tmin <= 5, 1, 'Hava soğuk.'], [w.pr >= 60, 1, 'Yağış bekleniyor.']]),
    yap('Astım ve solunum', [[aqi >= 60, 2, 'Hava kalitesi kötü.'], [aqi >= 40 && aqi < 60, 1, 'Hava kalitesi orta.'], [polen >= 50, 1, 'Polen yüksek.'], [w.tmin <= 0, 1, 'Soğuk ve kuru hava solunum yollarını zorlar.'], [w.his >= 30 && w.nem >= 70, 1, 'Sıcak ve nemli hava nefes almayı zorlaştırabilir.']]),
    yap('Soğuk algınlığı ve grip', [[w.tmin <= 0, 2, 'Sıcaklık sıfırın altına iniyor.'], [w.tmin > 0 && w.tmin <= 6, 1, `Sıcaklık ${deg(w.tmin)} kadar düşüyor.`], [fark >= 12, 1, `Gece ile gündüz arasında ${n0(sicFark(fark))}° fark var.`], [w.nem >= 85 && w.t < 12, 1, 'Serin ve nemli hava.']]),
    yap('Sinüs ve alerji', [[Math.abs(dp) >= 6, 1, dpMetin], [nemFark >= 40, 1, 'Gün içinde nem çok değişiyor.'], [polen >= 15, 1, 'Havada polen var.'], [Math.abs(ertesi) >= 5, 1, `Yarın sıcaklık ${n0(sicFark(Math.abs(ertesi)))}° ${ertesi > 0 ? 'yükseliyor' : 'düşüyor'}.`]]),
    yap('Sıcak çarpması', [[w.his >= 38, 3, `Hissedilen sıcaklık ${deg(w.his)}.`], [w.his >= 32 && w.his < 38, 2, `Hissedilen sıcaklık ${deg(w.his)}.`], [w.his >= 27 && w.his < 32, 1, `Hissedilen sıcaklık ${deg(w.his)}.`], [w.uv >= 8 && w.his >= 27, 1, `UV endeksi çok yüksek (${n0(w.uv)}).`]])
  ];
}
function saglikKart(d, air) {
  const L = saglikListesi(d, air);
  return `<h2 id="h-sag">Sağlık</h2>
    <p class="muted">Önümüzdeki 24 saatin havasına göre${air ? '' : ' (hava kalitesi ve polen yükleniyor)'}.</p>
    <ul class="endeks">${L.map(x => `<li><span class="en-ad">${x.ad}<small>${esc(x.neden)}</small></span><span class="en-dz" style="--c:${SEVIYE[x.s][1]}"><i></i>${SEVIYE[x.s][0]}</span></li>`).join('')}</ul>
    <p class="src">Hava verisinden hesaplanan genel bir tahmindir; tıbbi tavsiye değildir. Şikâyetin varsa doktoruna danış.</p>`;
}

// ---------- Etkinlikler ----------
function etkinlikListesi(d, air) {
  const g = gunduzPenceresi(d), w = pencere(d, g.bas, g.son), H = d.hourly;
  const i0 = Math.max(0, H.time.indexOf(d.current.time.slice(0, 13) + ':00'));
  const s48 = pencere(d, i0, i0 + 48);
  const dp = H.pressure_msl ? (H.pressure_msl[Math.min(H.time.length - 1, i0 + 24)] ?? 0) - (H.pressure_msl[i0] ?? 0) : 0;
  const aqi = air && air.current ? air.current.european_aqi : null;
  // Bu gece 21:00 – 03:00
  const gece = H.time.indexOf(d.daily.time[g.ad === 'Bugün' ? 0 : 1] + 'T21:00'), n = gece >= 0 ? pencere(d, gece, gece + 6) : null;
  const ay = ayAydinlik(Date.now());
  const yagis = (k = 12) => w.pr / k + (w.firtina ? 5 : 0);
  const puanla = (ad, s, neden) => ({ ad, s: kirp(s, 0, 10), neden });
  const ilk = (...a) => (a.find(x => x[0]) || [0, ''])[1];
  const yag = w.pr >= 50 ? `Yağış ihtimali %${n0(w.pr)}.` : '';
  return { ad: g.ad, L: [
    puanla('Koşu', 10 - yagis(15) - konfor(w.t, 8, 20) - (w.r > 30 ? 2 : 0) - (aqi >= 60 ? 2 : 0) - (w.uv >= 8 ? 1 : 0),
      ilk([w.firtina, 'Gök gürültülü sağanak bekleniyor.'], [yag, yag], [aqi >= 60, 'Hava kalitesi kötü.'], [w.t > 24, 'Sıcak; serin saatleri seç.'], [w.t < 3, 'Soğuk; sıkı giyin.'], [1, 'Koşu için uygun hava.'])),
    puanla('Bisiklet', 10 - yagis(13) - konfor(w.t, 10, 24) - (w.r > 35 ? 4 : w.r > 20 ? 2 : 0) - (w.kar ? 4 : 0),
      ilk([w.firtina, 'Gök gürültülü sağanak bekleniyor.'], [w.r > 20, `Rüzgar ${rz(w.r)} ${RZ()} hıza çıkıyor.`], [yag, yag], [1, 'Bisiklet için uygun hava.'])),
    puanla('Doğa yürüyüşü', 10 - yagis(12) - konfor(w.t, 10, 24) - (w.h > 50 ? 3 : 0) - (w.gor != null && w.gor < 2000 ? 2 : 0) - (w.kar ? 2 : 0),
      ilk([w.firtina, 'Gök gürültülü sağanak bekleniyor.'], [w.h > 50, `Hamleler ${rz(w.h)} ${RZ()}.`], [w.gor != null && w.gor < 2000, 'Görüş düşük, sis olabilir.'], [yag, yag], [1, 'Yürüyüş için uygun.'])),
    puanla('Balık tutma', 10 - yagis(20) - (w.r > 25 ? 3 : w.r > 15 ? 1 : 0) - (Math.abs(dp) >= 6 ? 2 : 0) - konfor(w.t, 5, 28, 0.3),
      ilk([w.firtina, 'Gök gürültülü sağanak bekleniyor; açık alanda durma.'], [w.r > 25, `Rüzgar ${rz(w.r)} ${RZ()}, su dalgalı olur.`], [Math.abs(dp) >= 6, 'Basınç hızlı değişiyor.'], [yag, yag], [1, 'Sakin hava, balık için uygun.'])),
    puanla('Plaj ve deniz', 10 - yagis(10) - (w.tmax < 26 ? (26 - w.tmax) * 0.9 : 0) - (w.tmax > 36 ? 2 : 0) - ((w.bulut ?? 0) > 60 ? 2 : 0) - (w.r > 25 ? 3 : 0),
      ilk([w.tmax < 22, `En yüksek ${deg(w.tmax)}; deniz için serin.`], [w.firtina, 'Gök gürültülü sağanak bekleniyor.'], [w.r > 25, 'Rüzgar kuvvetli, dalga olabilir.'], [w.uv >= 8, `UV ${n0(w.uv)}; 11–16 arası güneşten korun.`], [1, 'Plaj için güzel bir gün.'])),
    puanla('Piknik ve mangal', 10 - yagis(10) - konfor(w.t, 15, 28) - (w.r > 25 ? 3 : 0),
      ilk([w.firtina, 'Gök gürültülü sağanak bekleniyor.'], [yag, yag], [w.r > 25, 'Rüzgar ateşi savurabilir; dikkatli ol.'], [w.t < 12, 'Hava serin.'], [1, 'Piknik için uygun.'])),
    puanla('Çamaşır kurutma', 10 - w.pr / 8 - (w.nem > 80 ? 3 : w.nem > 65 ? 1 : 0) - ((w.bulut ?? 0) > 80 ? 1.5 : 0) + (w.r >= 8 && w.r <= 25 ? 1 : 0) - (w.t < 8 ? 2 : 0),
      ilk([w.pr >= 40, `Yağış ihtimali %${n0(w.pr)}; çamaşırı içeride as.`], [w.nem > 80, `Nem %${n0(w.nem)}; geç kurur.`], [1, 'Dışarıda iyi kurur.'])),
    puanla('Araç yıkama', 10 - (s48.mm >= 1 ? 5 : 0) - (s48.pr >= 50 ? 4 : s48.pr >= 30 ? 2 : 0) - (w.tmin != null && w.tmin < 2 ? 3 : 0),
      ilk([s48.mm >= 1 || s48.pr >= 50, '48 saat içinde yağış bekleniyor; yıkamayı ertele.'], [w.tmin < 2, 'Su donabilir.'], [1, 'Önümüzdeki 2 gün kuru görünüyor.'])),
    puanla('Bahçe ve çim biçme', 10 - yagis(10) - konfor(w.t, 10, 28) - (w.r > 30 ? 2 : 0),
      ilk([yag, yag], [w.t > 30, 'Çok sıcak; sabah ya da akşamüstü çalış.'], [w.t < 6, 'Bahçe işi için soğuk.'], [1, 'Bahçe işi için uygun.'])),
    puanla('Araba kullanma', 10 - (w.gor != null && w.gor < 1000 ? 4 : w.gor != null && w.gor < 3000 ? 2 : 0) - (w.kar ? 5 : 0) - (w.tmin <= 1 && w.mm > 0 ? 4 : 0) - (w.mmSaat >= 5 ? 3 : w.mm > 0.3 ? 1 : 0) - (w.h > 60 ? 3 : 0) - (w.firtina ? 2 : 0),
      ilk([w.kar, 'Kar yağışı var; zincir ve kış lastiği.'], [w.tmin <= 1 && w.mm > 0, 'Yollarda buzlanma olabilir.'], [w.gor != null && w.gor < 1000, 'Sis; görüş 1 km\'nin altında.'], [w.mmSaat >= 5, 'Kuvvetli sağanak; takip mesafesini artır.'], [w.h > 60, 'Kuvvetli rüzgar; yüksek araçlar dikkat.'], [w.mm > 0.3, 'Yollar ıslak olabilir.'], [1, 'Yol koşulları iyi görünüyor.'])),
    n && puanla('Yıldız gözlemi', 10 - (n.bulut ?? 50) / 10 - ay * 4 - (n.nem > 85 ? 1 : 0) - (n.pr >= 40 ? 2 : 0),
      ilk([(n.bulut ?? 0) > 60, `Bu gece gökyüzü %${n0(n.bulut)} bulutlu.`], [ay > 0.7, `Ay %${Math.round(ay * 100)} aydınlık; sönük yıldızlar görünmez.`], [1, 'Bu gece gökyüzü açık. Işıktan uzak bir yer seç.']))
  ].filter(Boolean) };
}
function sivrisinek(d) {
  const H = d.hourly, i = H.time.indexOf(d.daily.time[0] + 'T20:00');
  const w = pencere(d, i >= 0 ? i : 0, (i >= 0 ? i : 0) + 4);
  const s = w.t == null || w.t < 10 ? -1 : w.t < 15 ? 0 : (w.t <= 32 && w.nem >= 60 && w.r < 12) ? (w.t >= 22 ? 3 : 2) : 1;
  return s < 0 ? { ad: 'Sivrisinek', s: 0, yok: true, neden: 'Akşam hava serin; sivrisinek pek olmaz.' }
    : { ad: 'Sivrisinek', s, neden: s >= 2 ? `Akşam ${deg(w.t)} ve nemli; sivrisinekler etkin olur.` : 'Akşam serin ya da rüzgarlı; etkinlik az.' };
}
function etkinlikKart(d, air) {
  const { ad, L } = etkinlikListesi(d, air), sv = sivrisinek(d);
  return `<h2 id="h-etk">Etkinlikler</h2>
    <p class="muted">${ad === 'Bugün' ? 'Bugün gün batımına kadar' : 'Yarın gündüz'} hava ne kadar uygun.</p>
    <ul class="endeks">${L.map(x => { const [, lv, c] = PUAN.find(p => x.s < p[0]); return `<li><span class="en-ad">${x.ad}<small>${esc(x.neden)}</small></span><span class="en-dz" style="--c:${c}"><i></i>${lv}</span></li>`; }).join('')}
      <li><span class="en-ad">${sv.ad}<small>${esc(sv.neden)}</small></span><span class="en-dz" style="--c:${sv.yok ? '#9AA8B8' : SEVIYE[sv.s][1]}"><i></i>${sv.yok ? 'Yok' : SEVIYE[sv.s][0]}</span></li></ul>
    <p class="src">Sıcaklık, yağış, rüzgar, nem, görüş ve bulut tahmininden hesaplanır.</p>`;
}

// ---------- Haftanın özeti ----------
function haftaOzet(d) {
  const D = d.daily, n = Math.min(7, D.time.length - 1);
  if (n < 5) return '';
  const g = [...Array(n)].map((_, j) => j + 1);
  const yagisli = g.filter(i => (D.precipitation_sum[i] ?? 0) >= 1 || (D.precipitation_probability_max[i] ?? 0) >= 60);
  const enCok = yagisli.slice().sort((a, b) => (D.precipitation_sum[b] ?? 0) - (D.precipitation_sum[a] ?? 0))[0];
  const ilk = avgOf(g.slice(0, 3).map(i => D.temperature_2m_max[i])), son = avgOf(g.slice(-3).map(i => D.temperature_2m_max[i])), fark = son - ilk;
  const sicak = g.slice().sort((a, b) => D.temperature_2m_max[b] - D.temperature_2m_max[a])[0], soguk = g.slice().sort((a, b) => D.temperature_2m_min[a] - D.temperature_2m_min[b])[0];
  const kar = g.filter(i => cond(D.weather_code[i])[1] === 'snow');
  const out = [];
  out.push(!yagisli.length ? 'Önümüzdeki 7 gün kuru görünüyor.'
    : `Önümüzdeki 7 günün ${yagisli.length} gününde yağış bekleniyor${enCok && D.precipitation_sum[enCok] >= 1 ? `; en çok ${fmtWeek(D.time[enCok])} (${mm(D.precipitation_sum[enCok])} mm)` : ''}.`);
  if (kar.length) out.push(`${kar.map(i => fmtWeek(D.time[i])).join(', ')} kar yağışı olabilir.`);
  out.push(Math.abs(fark) < 2.5 ? `Sıcaklıklar hafta boyunca benzer; en yüksek ${deg(D.temperature_2m_max[sicak])} ile ${fmtWeek(D.time[sicak])}.`
    : fark > 0 ? `Hafta ilerledikçe hava ısınıyor; ${fmtWeek(D.time[sicak])} ${deg(D.temperature_2m_max[sicak])} bekleniyor.`
    : `Hafta ilerledikçe hava soğuyor; ${fmtWeek(D.time[soguk])} gece ${deg(D.temperature_2m_min[soguk])} kadar düşebilir.`);
  return out.join(' ');
}

// ---------- Tahmin güveni ve yağış aralığı ----------
function guvenTablo(m, d) {
  const D = d.daily, al = (k, i) => MODELLER.map(([id]) => (m.daily[`${k}_${id}`] || [])[i]).filter(v => v != null);
  const satir = [];
  for (let i = 0; i < Math.min(10, m.daily.time.length); i++) {
    const tx = al('temperature_2m_max', i), pr = al('precipitation_sum', i);
    if (!tx.length) continue;
    const ts = Math.max(...tx) - Math.min(...tx), p0 = pr.length ? Math.min(...pr) : 0, p1 = pr.length ? Math.max(...pr) : 0;
    const anlasma = pr.length && (pr.every(v => v >= 1) || pr.every(v => v < 1));
    let puan = 3 - (ts > 5 ? 2 : ts > 2.5 ? 1 : 0) - (!anlasma ? 1 : p1 - p0 > 10 ? 1 : 0) - (i >= 7 ? 1 : i >= 4 ? 0.5 : 0);
    puan = kirp(Math.round(puan), 0, 3);
    const yg = p1 < 0.5 ? 'Yok' : p0 < 0.5 ? `0–${mm(p1)} mm` : `${mm(p0)}–${mm(p1)} mm`;
    satir.push(`<tr><td class="l day1">${i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : esc(fmtWeek(D.time[i] || m.daily.time[i]))}<small>${esc(fmtDay(m.daily.time[i]))}</small></td>
      <td>${yg}</td><td><span class="c-lo">${deg(Math.min(...al('temperature_2m_min', i)))}</span></td><td><span class="c-hi">${deg(Math.min(...tx))}–${deg(Math.max(...tx))}</span></td>
      <td class="l"><span class="guven g${puan}"><i></i><i></i><i></i>${['Düşük', 'Orta', 'İyi', 'Yüksek'][puan]}</span></td></tr>`);
  }
  return `<div class="tbl-wrap"><table class="guv"><thead><tr><th class="l">Gün</th><th>Yağış<small>modellere göre</small></th><th>En düşük<small>en serin model</small></th><th>En yüksek<small>aralık</small></th><th class="l">Tahmin güveni</th></tr></thead><tbody>${satir.join('')}</tbody></table></div>`;
}

// ---------- Atmosfer ve yükseklik ----------
function atmosferKart(d, e) {
  const H = d.hourly, C = d.current, D = d.daily, i0 = Math.max(0, H.time.indexOf(C.time.slice(0, 13) + ':00'));
  const w24 = pencere(d, i0, i0 + 24), gor = H.visibility ? H.visibility[i0] : null, cape = w24.cape;
  const capeAd = cape < 300 ? 'Düşük' : cape < 1000 ? 'Orta' : cape < 2500 ? 'Yüksek' : 'Çok yüksek';
  const kv = [
    ['Çiy noktası', H.dew_point_2m ? deg(H.dew_point_2m[i0]) : '–'],
    ['Görüş mesafesi', gor == null ? '–' : gor >= 10000 ? '10 km üstü' : gor >= 1000 ? dec(gor / 1000) + ' km' : n0(gor) + ' m'],
    ['Bulutluluk', H.cloud_cover ? '%' + n0(H.cloud_cover[i0]) : '–'],
    ['Bugün güneşlenme', D.sunshine_duration ? dec(D.sunshine_duration[0] / 3600) + ' saat' : '–'],
    ['Bugün yağışlı saat', D.precipitation_hours ? n0(D.precipitation_hours[0]) + ' saat' : '–'],
    ['Gök gürültüsü potansiyeli', `${capeAd} <small>${n0(cape)} J/kg</small>`]
  ];
  let kat = '';
  if (e) {
    const t = new Date(C.time.slice(0, 13) + ':00Z').toISOString().slice(0, 13) + ':00', j = e.hourly.time.indexOf(t), E = e.hourly;
    if (j >= 0) {
      const don = E.freezing_level_height[j];
      kv.push(['Donma seviyesi', don == null ? '–' : `${n0(don)} m`]);
      const sat = (ad, y, tt, r, ry) => `<tr><td class="l">${ad}</td><td>${y}</td><td>${deg(tt)}</td><td>${wind(ry, r)} <small>${RZ()}</small></td></tr>`;
      kat = `<div class="tbl-wrap"><table class="kat"><thead><tr><th class="l">Katman</th><th>Yükseklik</th><th>Sıcaklık</th><th>Rüzgar</th></tr></thead><tbody>
        ${sat('Yer (2 m)', n0(d.elevation) + ' m', C.temperature_2m, C.wind_speed_10m, C.wind_direction_10m)}
        ${[850, 700, 500].map(p => sat(`${p} hPa`, `${n0(E[`geopotential_height_${p}hPa`][j])} m`, E[`temperature_${p}hPa`][j], E[`wind_speed_${p}hPa`][j], E[`wind_direction_${p}hPa`][j])).join('')}
      </tbody></table></div>
      <p class="note">850 hPa yaklaşık 1,5 km, 700 hPa 3 km, 500 hPa 5,5 km yükseklikteki havadır. 850 hPa sıcaklığı 0°'nin altındaysa yağış kar olabilir; 500 hPa'da −25°'den soğuk hava sağanak ve dolu riskini artırır.</p>`;
    }
  }
  return `<h2 id="h-atm">Atmosfer ve yükseklik</h2>
    <dl class="kv kv3">${kv.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
    ${kat || (e === null ? '<p class="muted">Yukarı katman verisi şu an alınamadı.</p>' : '<p class="muted">Yukarı katmanlar yükleniyor…</p>')}`;
}

// ---------- Yakındaki yerler ----------
function yakinKart(yerler, v) {
  return `<ul class="yakin">${yerler.map((y, i) => { const o = v && v[i]; return `<li><button type="button" data-yk="${i}">
    <span class="yk-ad">${esc(y.name)}<small>${n0(y.d)} km</small></span>
    ${o ? `${icon(o.current.weather_code, o.current.is_day)}<b>${deg(o.current.temperature_2m)}</b><span class="yk-mm"><span class="c-lo">${deg(o.daily.temperature_2m_min[0])}</span> / <span class="c-hi">${deg(o.daily.temperature_2m_max[0])}</span></span>` : '<span class="muted">…</span>'}
  </button></li>`; }).join('')}</ul>`;
}
