// Analizler: 81 il için geçmiş ayların sıcaklık ve yağış analizi, kuraklık, gün dereceleri (NASA POWER),
// önümüzdeki aylar (ECMWF mevsimsel tahmin), iklim sınıflandırması, güneş ve rüzgar atlası, soğuğa dayanıklılık bölgeleri
(() => {
  'use strict';
  const N = NORMAL81, ilLink = ad => `<a href="${anaSayfaLink(yerIl(ad))}">${esc(ad)}</a>`;
  const ayAd = k => `${AYLAR[+k.slice(5) - 1]} ${k.slice(0, 4)}`;
  const isaret = v => v == null ? '–' : (v > 0 ? '+' : '') + dec(v) + '°';

  // ---------- 1. ve 2. Geçmiş ayların analizi ----------
  let A = null;
  async function gecmis() {
    const hEl = $('sh'), yEl = $('yh');
    try { const r = await fetch('data/analiz.json', { cache: 'no-cache' }); if (!r.ok) throw 0; A = await r.json(); }
    catch (e) { hEl.innerHTML = yEl.innerHTML = hataMsg('Analiz verisi henüz hazırlanmadı. Günde bir kez güncellenir; birazdan tekrar bak.'); return; }
    const aylar = [...new Set(Object.values(A.il).flatMap(o => Object.keys(o)))].sort();
    const tam = aylar.filter(k => A.il[IL[0].ad][k] && A.il[IL[0].ad][k][6] >= 27);
    const secim = [...tam.slice(-6).reverse(), ...aylar.filter(k => !tam.includes(k)).slice(-1)];
    $('anot').textContent = `NASA POWER verisi ${esc(fmtDay(A.son))} ${A.son.slice(0, 4)} tarihine kadar. Normaller 1991–2020, aynı kaynaktan.`;
    sekmeler($('aay'), secim.map(k => tam.includes(k) ? ayAd(k) : ayAd(k) + ' (şimdiye kadar)'), i => ayCiz(secim[i]));
    kuraklik(tam);
  }
  function ayCiz(k) {
    const m = +k.slice(5) - 1;
    const R = IL.map(I => { const v = A.il[I.ad] && A.il[I.ad][k], n = N[I.ad]; if (!v || !n) return null;
      const oran = v[6] / (m === 1 ? 28.25 : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]);
      return { ad: I.ad, t: v[0], tn: n.t[m], f: v[0] - n.t[m], mx: v[1], mxn: n.mx[m], y: v[3], yn: n.y[m] * Math.min(1, oran), oran: n.y[m] ? Math.round(100 * v[3] / (n.y[m] * Math.min(1, oran))) : null, hdd: v[4], cdd: v[5], gun: v[6] }; }).filter(Boolean);
    const by = Object.fromEntries(R.map(r => [r.ad, r]));
    // Sıcaklık
    $('sh').innerHTML = haritaSvg({ fill: ad => by[ad] ? farkRenk(by[ad].f) : null, etiket: ad => by[ad] ? { ust: isaret(by[ad].f).replace('°', '') } : null, aria: 'Sıcaklık farkı haritası' });
    $('slj').innerHTML = lejant(FARK, '°C', 'Normalden fark');
    haritaBagla($('sh'), ad => { const r = by[ad]; return r ? `<b>${esc(ad)}</b>Ortalama <span>${dec(r.t)}°</span>, normal <span>${dec(r.tn)}°</span><br>Fark <span>${isaret(r.f)}</span><br>Ort. en yüksek <span>${dec(r.mx)}°</span> (normal ${dec(r.mxn)}°)` : esc(ad); });
    const tOrt = avgOf(R.map(r => r.f)), sicak = R.reduce((b, r) => r.f > b.f ? r : b, R[0]), soguk = R.reduce((b, r) => r.f < b.f ? r : b, R[0]);
    $('sozet').innerHTML = `<dl class="kv ozet3"><div><dt>Türkiye ortalaması</dt><dd>${isaret(tOrt)} <small>normalden ${tOrt >= 0 ? 'sıcak' : 'soğuk'}</small></dd></div><div><dt>Normalden en sıcak</dt><dd>${esc(sicak.ad)} ${isaret(sicak.f)}</dd></div><div><dt>Normalden en soğuk</dt><dd>${esc(soguk.ad)} ${isaret(soguk.f)}</dd></div></dl>`;
    siraliTablo($('stablo'), [
      { b: 'İl', l: 1, v: r => r.ad, h: r => ilLink(r.ad) }, { b: 'Ortalama', v: r => r.t, h: r => dec(r.t) + '°' }, { b: 'Normal', v: r => r.tn, h: r => dec(r.tn) + '°' },
      { b: 'Fark', v: r => r.f, h: r => `<span class="${r.f >= 0 ? 'c-hi' : 'c-lo'}">${isaret(r.f)}</span>` },
      { b: 'Ort. en yüksek', v: r => r.mx, h: r => dec(r.mx) + '°' }, { b: 'Normali', v: r => r.mxn, h: r => dec(r.mxn) + '°' },
      { b: 'Isıtma gün derece', v: r => r.hdd, h: r => n0(r.hdd) }, { b: 'Soğutma gün derece', v: r => r.cdd, h: r => n0(r.cdd) }
    ], R, 3, true);
    // Yağış
    $('yh').innerHTML = haritaSvg({ fill: ad => by[ad] && by[ad].oran != null ? oranRenk(by[ad].oran) : null, etiket: ad => by[ad] && by[ad].oran != null ? { ust: '%' + by[ad].oran } : null, aria: 'Yağışın normale oranı haritası' });
    $('ylj').innerHTML = lejant(ORAN, '%', 'Normale göre yağış');
    haritaBagla($('yh'), ad => { const r = by[ad]; return r ? `<b>${esc(ad)}</b>Yağış <span>${mm(r.y)} mm</span><br>Normal <span>${mm(r.yn)} mm</span><br>Normale göre <span>%${r.oran}</span>` : esc(ad); });
    const yT = sumOf(R.map(r => r.y)) / R.length, yN = sumOf(R.map(r => r.yn)) / R.length;
    $('yozet').innerHTML = `<dl class="kv ozet3"><div><dt>Türkiye ortalaması</dt><dd>${mm(yT)} mm <small>normali ${mm(yN)} mm, %${Math.round(100 * yT / yN)}</small></dd></div><div><dt>Normalin üstünde</dt><dd>${R.filter(r => r.oran > 100).length} il</dd></div><div><dt>Normalin yarısından az</dt><dd>${R.filter(r => r.oran < 50).length} il</dd></div></dl>`;
    siraliTablo($('ytablo'), [
      { b: 'İl', l: 1, v: r => r.ad, h: r => ilLink(r.ad) }, { b: 'Yağış', v: r => r.y, h: r => mm(r.y) + ' mm' }, { b: 'Normal', v: r => r.yn, h: r => mm(r.yn) + ' mm' },
      { b: 'Normale göre', v: r => r.oran, h: r => r.oran == null ? '–' : `%${r.oran}` }
    ], R, 3, false);
  }

  // ---------- 3. Kuraklık (son 3, 6, 12 ay) ----------
  function kuraklik(tam) {
    const PENC = [1, 3, 6, 12].filter(n => tam.length >= n);
    sekmeler($('kpen'), PENC.map(n => `Son ${n} ay`), i => {
      const n = PENC[i], ks = tam.slice(-n);
      const R = Object.fromEntries(IL.map(I => { const o = A.il[I.ad]; if (!o) return [I.ad, null]; const y = sumOf(ks.map(k => o[k] ? o[k][3] : 0)), yn = sumOf(ks.map(k => N[I.ad].y[+k.slice(5) - 1])); return [I.ad, { y, yn, o: yn ? Math.round(100 * y / yn) : null }]; }));
      const sinif = o => o == null ? '' : o < 50 ? 'Çok kurak' : o < 80 ? 'Kurak' : o <= 120 ? 'Normal' : o <= 150 ? 'Nemli' : 'Çok nemli';
      $('kh').innerHTML = haritaSvg({ fill: ad => R[ad] ? oranRenk(R[ad].o) : null, etiket: ad => R[ad] ? { ust: '%' + R[ad].o } : null, aria: 'Kuraklık haritası' });
      $('klj').innerHTML = lejant(ORAN, '%', 'Normale göre yağış');
      haritaBagla($('kh'), ad => { const r = R[ad]; return r ? `<b>${esc(ad)}</b>Son ${n} ay <span>${mm(r.y)} mm</span><br>Normal <span>${mm(r.yn)} mm</span><br><span>%${r.o}</span>, ${sinif(r.o)}` : esc(ad); });
      const say = s => IL.filter(I => R[I.ad] && sinif(R[I.ad].o) === s).length;
      $('kozet').innerHTML = `<dl class="kv ozet3">${['Çok kurak', 'Kurak', 'Normal', 'Nemli', 'Çok nemli'].map(s => `<div><dt>${s}</dt><dd>${say(s)} il</dd></div>`).join('')}</dl><p class="muted" style="margin:6px 0 0;font-size:13px">${esc(ayAd(ks[0]))} – ${esc(ayAd(ks[ks.length - 1]))} arası.</p>`;
    });
  }

  // ---------- 4. Önümüzdeki aylar (mevsimsel tahmin) ----------
  async function mevsim() {
    const el = $('mh');
    el.innerHTML = yukleniyor('81 ilin uzun vadeli tahmini yükleniyor…');
    let v;
    try { v = await cokNokta('https://seasonal-api.open-meteo.com/v1/seasonal', IL, { monthly: 'temperature_2m_anomaly,precipitation_anomaly' }, 360); }
    catch (e) { el.innerHTML = hataMsg('Uzun vadeli tahmin şu an alınamadı.'); return; }
    const M = Object.fromEntries(IL.map((I, i) => [I.ad, v[i].monthly])), aylar = M[IL[0].ad].time;
    let tur = 0, ay = 0;
    const ciz = () => {
      const val = ad => tur === 0 ? M[ad].temperature_2m_anomaly[ay] : M[ad].precipitation_anomaly[ay];
      const yN = ad => N[ad] ? N[ad].y[+aylar[ay].slice(5, 7) - 1] : null;
      const oran = ad => { const n = yN(ad), a = val(ad); return n && a != null ? Math.round(100 * (n + a) / n) : null; };
      el.innerHTML = haritaSvg({ fill: ad => tur === 0 ? farkRenk(val(ad)) : oranRenk(oran(ad)), etiket: ad => ({ ust: tur === 0 ? isaret(val(ad)).replace('°', '') : '%' + (oran(ad) ?? '–') }), aria: 'Uzun vadeli tahmin haritası' });
      $('mlj').innerHTML = tur === 0 ? lejant(FARK, '°C', 'Normalden beklenen fark') : lejant(ORAN, '%', 'Normale göre beklenen yağış');
      haritaBagla(el, ad => `<b>${esc(ad)}</b>${esc(AYLAR[+aylar[ay].slice(5, 7) - 1])}<br>${tur === 0 ? `Sıcaklık normalden <span>${isaret(val(ad))}</span>` : `Yağış normalin <span>%${oran(ad) ?? '–'}</span> civarı`}`);
      const tOrt = avgOf(IL.map(I => M[I.ad].temperature_2m_anomaly[ay]));
      $('mozet').innerHTML = `<p class="muted" style="margin:8px 0 0">${esc(AYLAR[+aylar[ay].slice(5, 7) - 1])} için Türkiye geneli: sıcaklık normalden ortalama <b>${isaret(tOrt)}</b> ${tOrt > 0.5 ? 'sıcak' : tOrt < -0.5 ? 'soğuk' : '(normale yakın)'}.</p>`;
    };
    sekmeler($('mtur'), ['Sıcaklık', 'Yağış'], i => { tur = i; ciz(); });
    sekmeler($('may'), aylar.map(t => `${AYLAR[+t.slice(5, 7) - 1]}`), i => { ay = i; ciz(); });
  }

  // ---------- 5. İklim sınıflandırması ----------
  function sinifCiz() {
    const R = IL.map(I => { const n = N[I.ad]; const k = koppen(n.t, n.y), dm = deMartonne(n.t, n.y), er = erinc(n.mx, n.y); return { ad: I.ad, k, dm, er, t: avgOf(n.t), y: sumOf(n.y) }; });
    const by = Object.fromEntries(R.map(r => [r.ad, r]));
    $('ih').innerHTML = haritaSvg({ fill: ad => kRenk(by[ad].k), etiket: ad => ({ ust: by[ad].k }), aria: 'Köppen iklim sınıflandırması haritası' });
    const turler = [...new Set(R.map(r => r.k))].sort();
    $('ilj').innerHTML = `<div class="ulj">${turler.map(k => `<span><i style="background:${kRenk(k)}"></i><b>${k}</b> ${esc(kAd(k))} (${R.filter(r => r.k === k).length})</span>`).join('')}</div>`;
    haritaBagla($('ih'), ad => { const r = by[ad]; return `<b>${esc(ad)}</b>Köppen: <span>${r.k}</span>, ${esc(kAd(r.k))}<br>De Martonne: <span>${dec(r.dm)}</span>, ${dmAd(r.dm)}<br>Erinç: <span>${dec(r.er)}</span>, ${erAd(r.er)}`; });
    siraliTablo($('itablo'), [
      { b: 'İl', l: 1, v: r => r.ad, h: r => ilLink(r.ad) }, { b: 'Köppen', l: 1, v: r => r.k, h: r => `<span class="etiket" style="background:${kRenk(r.k)};color:#13212C">${r.k}</span> ${esc(kAd(r.k))}` },
      { b: 'De Martonne', v: r => r.dm, h: r => `${dec(r.dm)} <small class="muted">${dmAd(r.dm)}</small>` }, { b: 'Erinç', v: r => r.er, h: r => `${dec(r.er)} <small class="muted">${erAd(r.er)}</small>` },
      { b: 'Yıllık ortalama', v: r => r.t, h: r => dec(r.t) + '°' }, { b: 'Yıllık yağış', v: r => r.y, h: r => n0(r.y) + ' mm' }
    ], R, 0);
  }

  // ---------- 6. Güneş ve rüzgar atlası, 7. soğuğa dayanıklılık ----------
  function atlas() {
    const GUNES = [[3.4, '#FFF5D1'], [4, '#FFE08A'], [4.5, '#F8B84E'], [5, '#EE8A2E'], [5.5, '#D2541D']], gRenk = rampa(GUNES);
    const RZ = [[2, '#EEF4EE'], [3, '#BFE3C3'], [4, '#7DC88B'], [5, '#3F9E6E'], [6.5, '#1F6E5A']], rRenk = rampa(RZ);
    let tur = 0;
    sekmeler($('atur'), ['Güneş enerjisi', 'Rüzgar (50 m)', 'Soğuğa dayanıklılık bölgesi'], i => {
      tur = i;
      const val = ad => tur === 0 ? avgOf(N[ad].gunes) : tur === 1 ? avgOf(N[ad].r50) : N[ad].yilMin;
      $('ath').innerHTML = haritaSvg({ fill: ad => tur === 0 ? gRenk(val(ad)) : tur === 1 ? rRenk(val(ad)) : usdaRenk(val(ad)), etiket: ad => ({ ust: tur === 2 ? usda(val(ad)) : dec(val(ad)) }), aria: 'Atlas haritası' });
      $('atlj').innerHTML = tur === 0 ? lejant(GUNES, 'kWh/m²/gün', 'Yıllık ortalama güneş enerjisi') : tur === 1 ? lejant(RZ, 'm/sn', '50 m yükseklikte ortalama rüzgar') : lejant(USDA, '°C', 'Ortalama yıllık en düşük sıcaklık');
      $('atnot').textContent = tur === 0 ? 'Yatay yüzeye düşen günlük ortalama güneş enerjisi. 1 kW gücündeki bir güneş paneli sistemi yaklaşık olarak bu değerin 0,8 katı kWh/gün elektrik üretir.'
        : tur === 1 ? '50 m yükseklikteki yıllık ortalama rüzgar hızı. Rüzgar türbinleri için genelde 6 m/sn ve üstü verimli sayılır; il merkezinin bulunduğu nokta için genel bir değerdir.'
          : 'ABD Tarım Bakanlığı (USDA) bölgeleri: hangi bitkinin o yerde kışı atlatabileceğini gösterir. Fidan ve süs bitkisi etiketlerindeki "zone" değeriyle karşılaştırın.';
      haritaBagla($('ath'), ad => `<b>${esc(ad)}</b>${tur === 0 ? `Güneş <span>${dec(val(ad))} kWh/m²/gün</span><br>1 kW panel ≈ <span>${n0(val(ad) * 0.8 * 365)} kWh/yıl</span><br>Temmuz <span>${dec(N[ad].gunes[6])}</span>, Aralık <span>${dec(N[ad].gunes[11])}</span>` : tur === 1 ? `50 m rüzgar <span>${dec(val(ad))} m/sn</span><br>10 m rüzgar <span>${dec(avgOf(N[ad].r10))} m/sn</span>` : `Bölge <span>${usda(val(ad))}</span><br>Ortalama yıllık en düşük <span>${dec(val(ad))}°C</span><br>Rekor en düşük <span>${dec(N[ad].uc[0])}°C</span>`}`);
    });
  }

  $('kisa').innerHTML = `<div><dt>İklim tipi sayısı</dt><dd>${new Set(IL.map(I => koppen(N[I.ad].t, N[I.ad].y))).size}</dd></div><div><dt>En güneşli il</dt><dd>${esc(IL.reduce((b, I) => avgOf(N[I.ad].gunes) > avgOf(N[b.ad].gunes) ? I : b, IL[0]).ad)}</dd></div><div><dt>En yağışlı il</dt><dd>${esc(IL.reduce((b, I) => sumOf(N[I.ad].y) > sumOf(N[b.ad].y) ? I : b, IL[0]).ad)}</dd></div>`;
  gecmis(); mevsim(); sinifCiz(); atlas();
})();
