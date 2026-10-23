// Türkiye haritası: 81 ilin şu anki durumu ve 5 günlük tahmini, havalimanı ölçümleri, sıralamalar ve tablo
(() => {
  'use strict';
  const zamanEl = $('zaman'), katEl = $('katman'), hEl = $('harita'), ljEl = $('lj'), sEl = $('siralar'), tEl = $('tablo');
  let V = null, M = null, gun = 0, kat = 0;
  const link = ad => `<a href="${anaSayfaLink(yerIl(ad))}">${esc(ad)}</a>`;

  // Zaman 0: şimdi, 1: bugün, 2: yarın ... 6
  const zamanAd = i => i === 0 ? 'Şimdi' : i === 1 ? 'Bugün' : i === 2 ? 'Yarın' : kisaGun(V[IL[0].ad].daily.time[i - 1]);
  const KATLAR = ['Sıcaklık', 'Yağış', 'Rüzgar', 'Havalimanı ölçümleri'];

  // Seçili zamana göre il değerleri
  function deger(ad) {
    const v = V[ad]; if (!v) return null;
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
      etiket = ad => { const d = deger(ad); return d && { ust: n0(gun ? d.h : d.r), alt: d.ry != null ? dir(d.ry) : null }; };
      lj = lejant(RUZGAR, 'km/sa', gun ? 'En kuvvetli hamle' : 'Rüzgar hızı');
      not = gun ? 'Rakam günün en kuvvetli hamlesi (km/sa), altında hâkim rüzgar yönü.' : 'Rakam şu anki rüzgar hızı (km/sa), altında rüzgarın geldiği yön.';
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
    siralar(); tablo();
  }

  function bilgi(ad) {
    const d = deger(ad); if (!d) return esc(ad);
    let s = `<b>${esc(ad)}</b>${esc(cond(d.kod)[0])}<br>`;
    if (gun === 0) s += `Sıcaklık <span>${deg(d.t)}</span>, hissedilen <span>${deg(d.his)}</span><br>Nem <span>%${n0(d.nem)}</span>, rüzgar <span>${d.ry != null ? dir(d.ry) + ' ' : ''}${n0(d.r)} km/sa</span><br>Bugün <span>${deg(d.min)} / ${deg(d.max)}</span>, yağış <span>${mm(d.y)} mm</span>`;
    else s += `En düşük <span>${deg(d.min)}</span>, en yüksek <span>${deg(d.max)}</span><br>Yağış <span>${mm(d.y)} mm</span>, ihtimal <span>%${n0(d.yi)}</span><br>Rüzgar <span>${n0(d.r)} km/sa</span>, hamle <span>${n0(d.h)} km/sa</span>`;
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
        + liste('En rüzgarlı iller', ilk(x => x.r, true), x => n0(x.r), ' km/sa') + liste('Şu an yağış alan iller', yagan, x => mm(x.yson), ' mm/sa');
      $('snot').textContent = 'Şu anki model değerleri. Gerçek ölçümler için haritada "Havalimanı ölçümleri"ni seç.';
    } else {
      sEl.innerHTML = liste('En yüksek sıcaklık', ilk(x => x.max, true), x => deg(x.max), '') + liste('En düşük sıcaklık (gece)', ilk(x => x.min, false), x => deg(x.min), '')
        + liste('En çok yağış', ilk(x => x.y, true).filter(x => x.y > 0), x => mm(x.y), ' mm') + liste('En kuvvetli hamle', ilk(x => x.h, true), x => n0(x.h), ' km/sa');
      $('snot').textContent = `${zamanAd(gun)} için tahmin.`;
    }
  }

  function tablo() {
    const L = IL.map(I => ({ ad: I.ad, ...deger(I.ad) }));
    const ev = r => `<span class="ev-k">${icon(r.kod, r.gunduz)}${esc(cond(r.kod)[0])}</span>`;
    const kol = gun === 0 ? [
      { b: 'İl', l: 1, v: r => r.ad, h: r => link(r.ad) }, { b: 'Hadise', l: 1, v: r => cond(r.kod)[0], h: ev },
      { b: 'Sıcaklık', v: r => r.t, h: r => deg(r.t) }, { b: 'Hissedilen', v: r => r.his, h: r => deg(r.his) }, { b: 'Nem', v: r => r.nem, h: r => pct(r.nem) },
      { b: 'Rüzgar', v: r => r.r, h: r => wind(r.ry, r.r) }, { b: 'Hamle', v: r => r.h, h: r => n0(r.h) },
      { b: 'Bugün en düşük', v: r => r.min, h: r => `<span class="c-lo">${deg(r.min)}</span>` }, { b: 'Bugün en yüksek', v: r => r.max, h: r => `<span class="c-hi">${deg(r.max)}</span>` },
      { b: 'Bugün yağış', v: r => r.y, h: r => mm(r.y) + ' mm' }
    ] : [
      { b: 'İl', l: 1, v: r => r.ad, h: r => link(r.ad) }, { b: 'Hadise', l: 1, v: r => cond(r.kod)[0], h: ev },
      { b: 'En düşük', v: r => r.min, h: r => `<span class="c-lo">${deg(r.min)}</span>` }, { b: 'En yüksek', v: r => r.max, h: r => `<span class="c-hi">${deg(r.max)}</span>` },
      { b: 'Yağış', v: r => r.y, h: r => mm(r.y) + ' mm' }, { b: 'Yağış ihtimali', v: r => r.yi, h: r => pct(r.yi) },
      { b: 'Rüzgar', v: r => r.r, h: r => wind(r.ry, r.r) }, { b: 'Hamle', v: r => r.h, h: r => n0(r.h) }
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
    ozet();
    sekmeler(katEl, KATLAR, i => { kat = i; ciz(); });
    // Havalimanı ölçümleri yalnızca "Şimdi" için anlamlı
    sekmeler(zamanEl, [0, 1, 2, 3, 4, 5, 6].map(zamanAd), i => {
      gun = i;
      const gb = katEl.querySelector('[data-i="3"]');
      if (gb) gb.hidden = gun !== 0 || !M;
      if (gun && kat === 3) { kat = 0; katEl.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', String(j === 0))); }
      ciz();
    });
  }
  basla();
})();
