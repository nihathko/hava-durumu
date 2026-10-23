// Dikkat: model tahmininden otomatik üretilen "dikkat gerektiren hava" değerlendirmesi (81 il, 3 gün). Resmi uyarı değildir.
(() => {
  'use strict';
  const hEl = $('uharita'), lEl = $('uliste'), tEl = $('utablo');
  let V = null, gun = 0;
  // Eşikler: [sarı, turuncu, kırmızı]; yön: 1 büyükse, -1 küçükse tehlikeli
  const OLCUT = [
    { k: 'yagis', kisa: 'Yağış', ad: 'Kuvvetli yağış', b: 'mm/gün', v: D => D.precipitation_sum, e: [30, 60, 100], y: 1, ne: 'Su baskını, sel ve ani taşkın riski. Dere yataklarından ve alt geçitlerden uzak durun.' },
    { k: 'kar', kisa: 'Kar', ad: 'Yoğun kar', b: 'cm/gün', v: D => D.snowfall_sum, e: [5, 15, 30], y: 1, ne: 'Ulaşımda aksama, buzlanma ve çığ riski. Zincir ve kış lastiği bulundurun.' },
    { k: 'ruzgar', kisa: 'Rüzgar', ad: 'Kuvvetli rüzgar', b: 'km/sa hamle', v: D => D.wind_gusts_10m_max, e: [60, 80, 100], y: 1, ne: 'Çatı uçması, ağaç ve direk devrilmesi. Açık alanlarda ve deniz kıyısında dikkatli olun.' },
    { k: 'sicak', kisa: 'Sıcak', ad: 'Aşırı sıcak', b: '°C', v: D => D.temperature_2m_max, e: [38, 41, 44], y: 1, ne: 'Güneş çarpması ve sıcak çarpması. Öğle saatlerinde dışarı çıkmayın, bol su için.' },
    { k: 'soguk', kisa: 'Soğuk', ad: 'Aşırı soğuk', b: '°C', v: D => D.temperature_2m_min, e: [-10, -18, -25], y: -1, ne: 'Don, buzlanma ve soğuk çarpması. Sobalı evlerde karbonmonoksit zehirlenmesine dikkat edin.' },
    { k: 'firtina', kisa: 'Fırtına', ad: 'Gök gürültülü fırtına', b: 'J/kg', v: D => D.cape_max, e: [1000, 2000, 3000], y: 1, ne: 'Yıldırım, dolu ve ani kuvvetli rüzgar. Açık alanda kalmayın, ağaç altına sığınmayın.', kod: D => D.weather_code }
  ];
  const RENK = ['#4CAF50', '#F2C14E', '#F08A24', '#D7301F'], AD = ['Tehlike yok', 'Dikkat (sarı)', 'Tehlikeli (turuncu)', 'Çok tehlikeli (kırmızı)'];
  const seviye = (o, v) => v == null ? 0 : o.y > 0 ? (v >= o.e[2] ? 3 : v >= o.e[1] ? 2 : v >= o.e[0] ? 1 : 0) : (v <= o.e[2] ? 3 : v <= o.e[1] ? 2 : v <= o.e[0] ? 1 : 0);
  function ilDurum(ad) {
    const D = V[ad].daily, out = [];
    for (const o of OLCUT) {
      const v = o.v(D)[gun]; let s = seviye(o, v);
      // Fırtına: kararsızlık yüksek ama model gök gürültüsü göstermiyorsa bir derece düşür
      if (o.k === 'firtina' && s && ![95, 96, 99].includes(D.weather_code[gun])) s = Math.max(0, s - 1);
      if (s) out.push({ o, v, s });
    }
    return out.sort((a, b) => b.s - a.s);
  }
  const deger = (o, v) => o.k === 'yagis' ? mm(v) + ' mm' : o.k === 'kar' ? dec(v) + ' cm' : o.k === 'ruzgar' ? rz(v) + ' ' + RZ() : o.k === 'firtina' ? n0(v) + ' J/kg' : deg(v);

  function ciz() {
    const S = Object.fromEntries(IL.map(I => [I.ad, ilDurum(I.ad)]));
    const en = ad => S[ad].length ? S[ad][0].s : 0;
    hEl.innerHTML = haritaSvg({ fill: ad => RENK[en(ad)], etiket: ad => S[ad].length ? { ust: S[ad][0].o.kisa } : null, aria: 'Dikkat gerektiren hava haritası' });
    haritaBagla(hEl, ad => {
      const s = S[ad];
      return `<b>${esc(ad)}</b>${s.length ? s.map(x => `<span class="etiket" style="background:${RENK[x.s]};color:${x.s >= 2 ? '#fff' : '#3A2A00'}">${esc(x.o.ad)}</span> ${deger(x.o, x.v)}`).join('<br>') : 'Dikkat gerektiren hava beklenmiyor.'}<br><a href="${anaSayfaLink(yerIl(ad))}">Ayrıntılı tahmin</a>`;
    });
    $('ulj').innerHTML = `<div class="ulj">${RENK.map((r, i) => `<span><i style="background:${r}"></i>${AD[i]}</span>`).join('')}</div>`;
    const liste = IL.filter(I => S[I.ad].length).map(I => ({ ad: I.ad, s: S[I.ad] })).sort((a, b) => b.s[0].s - a.s[0].s || trSort(a.ad, b.ad));
    $('usay').textContent = liste.length ? `${liste.length} ilde dikkat gerektiren hava bekleniyor.` : 'Seçilen gün için hiçbir ilde dikkat gerektiren hava beklenmiyor.';
    // Hadise türüne göre gruplanmış liste
    lEl.innerHTML = OLCUT.map(o => {
      const g = liste.map(x => ({ ad: x.ad, d: x.s.find(y => y.o === o) })).filter(x => x.d).sort((a, b) => b.d.s - a.d.s || (b.d.v - a.d.v) * o.y);
      if (!g.length) return '';
      return `<div class="sira uy"><h3>${o.ad} <small class="muted">(${g.length} il)</small></h3><p class="muted">${o.ne}</p><ol>${g.map(x => `<li><span><i class="nk" style="background:${RENK[x.d.s]}"></i><a href="${anaSayfaLink(yerIl(x.ad))}">${esc(x.ad)}</a></span><b>${deger(o, x.d.v)}</b></li>`).join('')}</ol></div>`;
    }).join('') || '<p class="muted">Seçilen gün için dikkat gerektiren hava beklenmiyor.</p>';
    siraliTablo(tEl, [
      { b: 'İl', l: 1, v: r => r.ad, h: r => `<a href="${anaSayfaLink(yerIl(r.ad))}">${esc(r.ad)}</a>` },
      { b: 'En yüksek seviye', l: 1, v: r => en(r.ad), h: r => `<span class="etiket" style="background:${RENK[en(r.ad)]};color:${en(r.ad) >= 2 ? '#fff' : en(r.ad) ? '#3A2A00' : '#fff'}">${AD[en(r.ad)]}</span>` },
      { b: 'Hadise', l: 1, v: r => S[r.ad].map(x => x.o.ad).join(', '), h: r => esc(S[r.ad].map(x => x.o.ad).join(', ') || '–') },
      { b: 'Yağış', v: r => V[r.ad].daily.precipitation_sum[gun], h: r => mm(V[r.ad].daily.precipitation_sum[gun]) + ' mm' },
      { b: 'Kar', v: r => V[r.ad].daily.snowfall_sum[gun], h: r => dec(V[r.ad].daily.snowfall_sum[gun]) + ' cm' },
      { b: 'Hamle', v: r => V[r.ad].daily.wind_gusts_10m_max[gun], h: r => rz(V[r.ad].daily.wind_gusts_10m_max[gun]) + ' ' + RZ() },
      { b: 'En yüksek', v: r => V[r.ad].daily.temperature_2m_max[gun], h: r => `<span class="c-hi">${deg(V[r.ad].daily.temperature_2m_max[gun])}</span>` },
      { b: 'En düşük', v: r => V[r.ad].daily.temperature_2m_min[gun], h: r => `<span class="c-lo">${deg(V[r.ad].daily.temperature_2m_min[gun])}</span>` }
    ], IL.map(I => ({ ad: I.ad })), 1, true);
  }

  (async () => {
    hEl.innerHTML = yukleniyor('81 ilin tahmini değerlendiriliyor…');
    try {
      const v = await cokNokta(OM, IL, { daily: 'weather_code,precipitation_sum,snowfall_sum,wind_gusts_10m_max,temperature_2m_max,temperature_2m_min,cape_max', timezone: 'Europe/Istanbul', forecast_days: 3, wind_speed_unit: 'kmh' });
      V = Object.fromEntries(IL.map((I, i) => [I.ad, v[i]]));
    } catch (e) { hEl.innerHTML = hataMsg(); return; }
    const gunler = V[IL[0].ad].daily.time;
    const say = g => { gun = g; return IL.filter(I => ilDurum(I.ad).length).length; };
    $('kisa').innerHTML = gunler.map((t, i) => `<div><dt>${i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : esc(fmtWeek(t))}</dt><dd>${say(i)} il</dd></div>`).join('');
    sekmeler($('ugun'), gunler.map((t, i) => i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : `${fmtWeek(t)}`), i => { gun = i; ciz(); });
  })();
})();
