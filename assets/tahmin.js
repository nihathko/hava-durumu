// Tahmin haritaları (MGM'nin Türkiye tahminleri gibi): 5 günlük haritalı tahmin, en düşük ve en yüksek sıcaklık,
// yağış miktarı tahmini, orta ve uzun vadeli tahmin. Veriyi GitHub saatte birkaç kez hazırlar (data/tahmin.json,
// data/uzun-vade.json); sayfa yalnızca bu dosyaları okur, hava servisine her ziyaretçi için istek gitmez.
(() => {
  'use strict';
  let K = null, U = null;
  const al = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
  const gunAd = (t, i) => i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : kisaGun(t);
  const uzunGun = t => `${fmtDay(t)} ${fmtWeek(t)}`;

  // ---------- Sınıflı renk ölçekleri: [üst sınır, renk, etiket] ----------
  const SIC = [[-20, '#5B2A86', '−20 altı'], [-15, '#3F3FBF', '−20 / −15'], [-10, '#2F6FD6', '−15 / −10'], [-5, '#3FA2E8', '−10 / −5'], [0, '#6FD0F0', '−5 / 0'], [5, '#7FE0C0', '0 / 5'],
    [10, '#8FDC6A', '5 / 10'], [15, '#C8E84A', '10 / 15'], [20, '#F6E43A', '15 / 20'], [25, '#F8B52C', '20 / 25'], [30, '#F38A22', '25 / 30'], [35, '#E2531C', '30 / 35'], [40, '#B8261A', '35 / 40'], [Infinity, '#7A0F12', '40 üstü']];
  const FARKS = [[4, '#EEF6FB', '4 altı'], [8, '#CFE6F5', '4 / 8'], [12, '#9FCBEA', '8 / 12'], [16, '#F8D38A', '12 / 16'], [20, '#F1A04F', '16 / 20'], [Infinity, '#D6542C', '20 üstü']];
  const YAG = [[0.1, '#EEF2F5', '0'], [1, '#D7EEFA', '0,1 – 1'], [5, '#93CFEE', '1 – 5'], [10, '#4FA8DE', '5 – 10'], [20, '#2D7BC6', '10 – 20'], [50, '#6B4FC4', '20 – 50'], [100, '#B23FA0', '50 – 100'], [Infinity, '#7D1652', '100 üstü']];
  const TA = [[-3, '#2166AC', '3° altı'], [-2, '#4393C3', '−3 / −2'], [-1, '#92C5DE', '−2 / −1'], [-0.5, '#D1E5F0', '−1 / −0,5'], [0.5, '#F4F4F4', 'Normal'], [1, '#FDDBC7', '0,5 / 1'], [2, '#F4A582', '1 / 2'], [3, '#D6604D', '2 / 3'], [Infinity, '#B2182B', '3° üstü']];
  const YA = e => [[-10 * e, '#A6611A', 'Çok az'], [-5 * e, '#DFC27D', 'Az'], [-1.5 * e, '#F3E6B8', 'Biraz az'], [1.5 * e, '#F4F4F4', 'Normal'], [5 * e, '#C7E9C0', 'Biraz fazla'], [10 * e, '#74C476', 'Fazla'], [Infinity, '#238B45', 'Çok fazla']];
  const sinif = (S, v) => v == null || Number.isNaN(v) ? null : S.find(s => v < s[0]);
  const sinifLejant = (S, baslik, birim = '') => `<div class="slj" role="img" aria-label="${esc(baslik)} ölçeği"><span class="slj-b">${esc(baslik)}${birim ? ` (${esc(birim)})` : ''}</span><span class="slj-k">${S.map(s => `<span><i style="background:${s[1] || 'transparent'}"></i>${esc(s[2])}</span>`).join('')}</span></div>`;

  // ---------- Kesintisiz alan haritası ----------
  // Düzenli ızgaradaki değerler çift doğrusal ara değerlemeyle her piksele yayılır, Türkiye sınırına göre kırpılır;
  // üstüne il sınırları ve il merkezlerindeki değerler (SVG) gelir.
  function alanHarita(kap, izg, adim, deger, S, { etiket, bilgi, aria }) {
    const lon0 = 25.5, lat0 = 35.5, nx = Math.round(19.5 / adim) + 1, ny = Math.round(7 / adim) + 1, G = new Float32Array(nx * ny).fill(NaN);
    for (const n of izg) { const v = deger(n); if (v == null) continue; const i = Math.round((n[1] - lon0) / adim), j = Math.round((n[0] - lat0) / adim); if (i >= 0 && i < nx && j >= 0 && j < ny) G[j * nx + i] = v; }
    const W = TR_HARITA.w, H = TR_HARITA.h, ck = TR_HARITA.c * TR_HARITA.k;
    const dg = (lat, lon) => {
      const fx = (lon - lon0) / adim, fy = (lat - lat0) / adim, i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j;
      let t = 0, w = 0;
      for (const [di, dj, ww] of [[0, 0, (1 - a) * (1 - b)], [1, 0, a * (1 - b)], [0, 1, (1 - a) * b], [1, 1, a * b]]) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const v = G[jj * nx + ii]; if (Number.isNaN(v) || ww <= 0) continue; t += v * ww; w += ww;
      }
      return w > 0.05 ? t / w : null;
    };
    // Raster: görünüm kutusu çözünürlüğünde, sınıf renkleriyle
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const oc = off.getContext('2d'), img = oc.createImageData(W, H), px = img.data, rgb = {};
    const hex = c => rgb[c] || (rgb[c] = [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16)));
    for (let y = 0; y < H; y++) {
      const lat = TR_HARITA.lat0 - y / TR_HARITA.k;
      for (let x = 0; x < W; x++) {
        const s = sinif(S, dg(lat, x / ck + TR_HARITA.lon0)); if (!s || !s[1]) continue;
        const c = hex(s[1]), o = (y * W + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
    }
    oc.putImageData(img, 0, 0);
    kap.innerHTML = `<div class="alan"><canvas aria-hidden="true"></canvas>${haritaSvg({ fill: () => 'transparent', etiket, aria })}</div>`;
    const cv = kap.querySelector('canvas'), ctx = cv.getContext('2d'), svg = kap.querySelector('svg');
    const yol = new Path2D(); for (const d of Object.values(TR_HARITA.il)) yol.addPath(new Path2D(d));
    const ciz = () => {
      const r = svg.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      ctx.setTransform(r.width / W * dpr, 0, 0, r.height / H * dpr, 0, 0);
      ctx.save(); ctx.clip(yol); ctx.fillStyle = '#EEF2F5'; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, W, H); ctx.restore();
    };
    if (kap._ro) kap._ro.disconnect();
    kap._ro = new ResizeObserver(ciz); kap._ro.observe(svg); ciz();
    if (bilgi) haritaBagla(kap, bilgi);
  }

  // ---------- 1. 5 günlük tahmin (haritalı) ----------
  function ikonHarita(j, buyuk) {
    return haritaSvg({ fill: () => 'var(--ikon-harita, #EEF2F5)', ikonOlcek: buyuk ? 0.3 : 0.62, aria: `${uzunGun(K.gunler[j])} tahmin haritası`,
      etiket: ad => { const d = K.il[ad]; return d && { ikon: icon(d[0][j], 1), ust: buyuk ? `${n0(sicV(d[1][j]))}/${n0(sicV(d[2][j]))}` : null }; } });
  }
  const ilBilgi = j => ad => { const d = K.il[ad]; return d ? `<b>${esc(ad)}</b>${esc(uzunGun(K.gunler[j]))}<br>${esc(cond(d[0][j])[0])}<br>En düşük <span>${deg(d[1][j])}</span>, en yüksek <span>${deg(d[2][j])}</span><br>Yağış <span>${mm(d[3][j])} mm</span>${d[4][j] != null ? `, ihtimal <span>%${n0(d[4][j])}</span>` : ''}<br><a href="${anaSayfaLink(yerIl(ad))}">Ayrıntılı tahmin</a>` : esc(ad); };
  function besGun() {
    const el = $('g5'), gun = [1, 2, 3, 4, 5].filter(j => j < K.gunler.length);
    let buyuk = false, sec = gun[0];
    const ciz = () => {
      $('g5-gun').hidden = !buyuk;
      if (buyuk) {
        el.className = 'trh-wrap';
        el.innerHTML = ikonHarita(sec, true);
        haritaBagla(el, ilBilgi(sec));
        $('g5-not').textContent = `${uzunGun(K.gunler[sec])}. Simgenin altında en düşük / en yüksek sıcaklık. İl üzerine gel ya da dokun.`;
      } else {
        el.className = 'coklu';
        el.innerHTML = gun.map(j => `<figure class="kucuk-harita" data-j="${j}"><div class="trh-wrap">${ikonHarita(j, false)}</div><figcaption>${esc(uzunGun(K.gunler[j]))}</figcaption></figure>`).join('');
        el.querySelectorAll('.kucuk-harita').forEach(f => { const j = +f.dataset.j; haritaBagla(f.querySelector('.trh-wrap'), ilBilgi(j)); });
        $('g5-not').textContent = 'Yarından başlayarak 5 gün. Büyük haritada her ilin en düşük ve en yüksek sıcaklığı da yazar.';
      }
    };
    sekmeler($('g5-gos'), ['Küçük haritalar', 'Büyük harita'], i => { buyuk = i === 1; ciz(); });
    sekmeler($('g5-gun'), gun.map(j => uzunGun(K.gunler[j])), i => { sec = gun[i]; if (buyuk) ciz(); });
  }

  // ---------- 2. En düşük ve en yüksek sıcaklık ----------
  function sicaklik() {
    let tur = 0, j = 0;
    const TUR = [['En yüksek sıcaklık', 2, n => n[2][j], SIC, 'Günlük en yüksek sıcaklık', '°C'], ['En düşük sıcaklık', 3, n => n[3][j], SIC, 'Günlük en düşük sıcaklık', '°C'],
      ['Gece-gündüz sıcaklık farkı', 0, n => n[2][j] != null && n[3][j] != null ? n[2][j] - n[3][j] : null, FARKS, 'Gece-gündüz sıcaklık farkı', '°C']];
    const ciz = () => {
      const [ad, , f, S, lj, b] = TUR[tur];
      const ilV = a => { const d = K.il[a]; if (!d) return null; return tur === 0 ? d[2][j] : tur === 1 ? d[1][j] : d[2][j] - d[1][j]; };
      alanHarita($('s-har'), K.izgara, K.adim, f, S, {
        aria: `${ad} haritası, ${uzunGun(K.gunler[j])}`,
        etiket: a => { const v = ilV(a); return v == null ? null : { ust: tur === 2 ? n0(sicFark(v)) + '°' : deg(v) }; },
        bilgi: a => { const d = K.il[a]; return d ? `<b>${esc(a)}</b>${esc(uzunGun(K.gunler[j]))}<br>En yüksek <span>${deg(d[2][j])}</span><br>En düşük <span>${deg(d[1][j])}</span><br>Fark <span>${n0(sicFark(d[2][j] - d[1][j]))}°</span>` : esc(a); },
      });
      $('s-lj').innerHTML = sinifLejant(S, lj, b);
      $('s-bas').textContent = `${TUR[tur][4]} tahmini, ${uzunGun(K.gunler[j])}`;
    };
    sekmeler($('s-tur'), TUR.map(t => t[0]), i => { tur = i; ciz(); });
    sekmeler($('s-gun'), K.gunler.slice(0, 5).map(gunAd), i => { j = i; ciz(); });
  }

  // ---------- 3. Yağış miktarı tahmini ----------
  function yagis() {
    const n = K.gunler.length, sekme = [...K.gunler.map((t, i) => uzunGun(t)), `${n} günlük toplam`];
    let j = 1;
    const top = a => a.slice(0, n).reduce((s, x) => s + (x || 0), 0);
    const ciz = () => {
      const t = j === n, f = t ? x => top(x[4]) : x => x[4][j];
      const ilV = a => { const d = K.il[a]; return d ? (t ? top(d[3]) : d[3][j]) : null; };
      alanHarita($('y-har'), K.izgara, K.adim, f, YAG, {
        aria: `Yağış miktarı tahmin haritası, ${sekme[j]}`,
        etiket: a => { const v = ilV(a); return v != null && v >= 1 ? { ust: mm(v) } : null; },
        bilgi: a => { const d = K.il[a]; if (!d) return esc(a); return `<b>${esc(a)}</b>${esc(sekme[j])}<br>Yağış <span>${mm(ilV(a))} mm</span>${!t && d[4][j] != null ? `<br>İhtimal <span>%${n0(d[4][j])}</span>` : ''}`; },
      });
      $('y-lj').innerHTML = sinifLejant(YAG, t ? `${n} günlük toplam yağış` : 'Günlük toplam yağış', 'mm');
      $('y-bas').textContent = t ? `${uzunGun(K.gunler[0])} – ${uzunGun(K.gunler[n - 1])} toplam yağış` : `${uzunGun(K.gunler[j])} (00:00 – 23:59)`;
      $('y-geri').disabled = j === 0; $('y-ileri').disabled = j === n;
      $('y-gun').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-selected', String(i === j)));
    };
    sekmeler($('y-gun'), sekme, i => { j = i; ciz(); }, 1);
    $('y-geri').onclick = () => { if (j > 0) { j--; ciz(); } };
    $('y-ileri').onclick = () => { if (j < n) { j++; ciz(); } };
  }

  // ---------- 4. Orta ve uzun vadeli tahmin ----------
  // Izgara noktalarının hangi bölgeye düştüğü (en yakın il merkezine göre)
  const ilBolge = {}; for (const [b, L] of Object.entries(BOLGE)) for (const a of L) ilBolge[a] = b;
  const enYakinIlAd = (lat, lon) => { let b = null, bd = 1e9; for (const I of IL) { const d = (I.lat - lat) ** 2 + ((I.lon - lon) * 0.77) ** 2; if (d < bd) { bd = d; b = I.ad; } } return b; };
  const birlestir = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' ile ' + a[a.length - 1];
  // Bölgelerin ortalamasından, MGM'nin aylık tahmin metinlerine benzer bir cümle
  function farkMetni(izg, f, tip, e = 1) {
    const top = {};
    for (const n of izg) { const v = f(n); if (v == null) continue; const b = ilBolge[enYakinIlAd(n[0], n[1])]; if (!b) continue; (top[b] = top[b] || []).push(v); }
    const ort = Object.fromEntries(Object.entries(top).map(([b, L]) => [b, L.reduce((s, x) => s + x, 0) / L.length]));
    const ifade = v => {
      if (tip === 's') { const a = Math.abs(v); if (a < 0.5) return 'mevsim normalleri civarında'; const y = v < 0 ? 'altında' : 'üzerinde'; return a < 1 ? `mevsim normallerinin 0,5 ila 1 derece ${y}` : a < 2 ? `mevsim normallerinin 1 ila 2 derece ${y}` : a < 3 ? `mevsim normallerinin 2 ila 3 derece ${y}` : `mevsim normallerinin 3 dereceden fazla ${y}`; }
      return Math.abs(v) < 1.5 * e ? 'mevsim normalleri civarında' : v < 0 ? 'mevsim normallerinin altında' : 'mevsim normallerinin üzerinde';
    };
    const grup = {};
    for (const [b, v] of Object.entries(ort)) (grup[ifade(v)] = grup[ifade(v)] || []).push(b);
    const G = Object.entries(grup).sort((a, b) => b[1].length - a[1].length);
    if (!G.length) return '';
    const yer = L => `${birlestir(L)}${L.length > 1 ? ' bölgelerinde' : " Bölgesi'nde"}`;
    const parca = G.length === 1 ? `yurt genelinde ${G[0][0]}` : G.slice(1).map(([i, L]) => `${yer(L)} ${i}`).join(', ') + `, diğer yerlerde ise ${G[0][0]}`;
    return tip === 's' ? `Hava sıcaklığının ${parca} seyredeceği bekleniyor.` : `Yağışın ${parca} gerçekleşeceği bekleniyor.`;
  }
  function haftaMetni() {
    // 7 günlük haritalar için: yağışlı günler ve sıcaklık eğilimi
    const n = Math.min(7, K.gunler.length), grup = {};
    // Ardışık günler aralık olarak yazılır: "Salı–Perşembe"
    const aralik = L => { const p = []; let b = L[0], o = L[0]; for (const j of [...L.slice(1), null]) { if (j === o + 1) { o = j; continue; } p.push(b === o ? fmtWeek(K.gunler[b]) : `${fmtWeek(K.gunler[b])}–${fmtWeek(K.gunler[o])}`); b = o = j; } return birlestir(p); };
    for (const [b, L] of Object.entries(BOLGE)) {
      const yg = []; for (let j = 0; j < n; j++) { const yagan = L.filter(a => K.il[a] && (K.il[a][3][j] ?? 0) >= 1).length; if (yagan / L.length >= 0.35) yg.push(j); }
      if (yg.length) (grup[yg.join(',')] = grup[yg.join(',')] || { yg, b: [] }).b.push(b);
    }
    const parca = Object.values(grup).map(({ yg, b }) => `${birlestir(b)}${b.length > 1 ? ' bölgelerinde' : " Bölgesi'nde"} ${yg.length === n ? 'hafta boyunca' : aralik(yg)} yağışlı`);
    const ilk = avgOf(Object.values(K.il).map(d => d[2][0])), son = avgOf(Object.values(K.il).map(d => d[2][n - 1]));
    const s = son - ilk;
    return (parca.length ? parca.join('; ') + ' bir hava bekleniyor. ' : 'Hafta boyunca yurt genelinde önemli bir yağış beklenmiyor. ')
      + (Math.abs(s) < 2 ? 'Sıcaklıklarda önemli bir değişiklik beklenmiyor.' : s < 0 ? `Hafta sonuna doğru sıcaklıklar yurt genelinde ortalama ${n0(sicFark(-s))} derece düşecek.` : `Hafta sonuna doğru sıcaklıklar yurt genelinde ortalama ${n0(sicFark(s))} derece yükselecek.`);
  }
  function uzunVade() {
    const el = $('u-har'), mt = $('u-metin'), bugun = K ? K.gunler[0] : new Date().toISOString().slice(0, 10);
    const hafta = k => { const hedef = new Date(Date.parse(bugun + 'T12:00:00Z') + k * 7 * 864e5).toISOString().slice(0, 10); return U ? U.haftalar.findIndex((h, i) => h <= hedef && (U.haftalar[i + 1] || '9999') > hedef) : -1; };
    const ay = U ? U.aylar.map((a, i) => [a, i]).filter(([a]) => a.slice(0, 7) > bugun.slice(0, 7)).slice(0, 3) : [];
    const ayAd = a => noon(a).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let tur = 0, alt = 0;
    const ikili = (ts, ps, baslik, e) => {
      el.className = 'ikili';
      el.innerHTML = `<figure><div class="trh-wrap" id="u-s"></div><figcaption>Sıcaklık · ${esc(baslik)}</figcaption><div id="u-slj"></div></figure><figure><div class="trh-wrap" id="u-y"></div><figcaption>Yağış · ${esc(baslik)}</figcaption><div id="u-ylj"></div></figure>`;
      const bil = f => a => { const I = IL.find(x => x.ad === a); const yak = U.izgara.reduce((b, n) => (n[0] - I.lat) ** 2 + (n[1] - I.lon) ** 2 < (b[0] - I.lat) ** 2 + (b[1] - I.lon) ** 2 ? n : b, U.izgara[0]); return `<b>${esc(a)}</b>${f(yak)}`; };
      alanHarita($('u-s'), U.izgara, U.adim, ts, TA, { aria: `Sıcaklığın normalden farkı, ${baslik}`, bilgi: bil(n => `Normalden fark <span>${ts(n) == null ? '–' : (ts(n) > 0 ? '+' : '') + dec(sicFark(ts(n))) + '°'}</span>`) });
      alanHarita($('u-y'), U.izgara, U.adim, ps, YA(e), { aria: `Yağışın normalden farkı, ${baslik}`, bilgi: bil(n => `Normalden fark <span>${ps(n) == null ? '–' : (ps(n) > 0 ? '+' : '') + mm(ps(n)) + ' mm'}</span>`) });
      $('u-slj').innerHTML = sinifLejant(TA, 'Sıcaklığın normalden farkı', '°C');
      $('u-ylj').innerHTML = sinifLejant(YA(e), 'Yağış, normale göre');
      mt.innerHTML = `<p>${esc(farkMetni(U.izgara, ts, 's'))}</p><p>${esc(farkMetni(U.izgara, ps, 'y', e))}</p>`;
    };
    const ciz = () => {
      if (tur === 0 && alt === 0) {
        if (!K) { el.innerHTML = hataMsg(); return; }
        const n = Math.min(7, K.gunler.length);
        el.className = 'coklu yedi';
        el.innerHTML = [...Array(n)].map((_, j) => `<figure class="kucuk-harita" data-j="${j}"><div class="trh-wrap">${ikonHarita(j, false)}</div><figcaption>${esc(uzunGun(K.gunler[j]))}</figcaption></figure>`).join('');
        el.querySelectorAll('.kucuk-harita').forEach(f => haritaBagla(f.querySelector('.trh-wrap'), ilBilgi(+f.dataset.j)));
        const w = hafta(0);
        mt.innerHTML = `<p><b>Genel hava durumu (${esc(fmtDay(K.gunler[0]))} – ${esc(fmtDay(K.gunler[n - 1]))}):</b> ${esc(haftaMetni())}</p>${U && w >= 0 ? `<p>${esc(farkMetni(U.izgara, x => x[2][w], 's'))}</p>` : ''}`;
        return;
      }
      if (!U) { el.innerHTML = hataMsg('Uzun vadeli tahmin şu an alınamadı.'); mt.innerHTML = ''; return; }
      if (tur === 0) {
        const w = hafta(alt);
        if (w < 0 || U.izgara[0][2][w] == null) { el.innerHTML = '<p class="muted">Bu hafta için tahmin henüz yayımlanmadı.</p>'; mt.innerHTML = ''; return; }
        const bas = U.haftalar[w], bit = new Date(Date.parse(bas + 'T12:00:00Z') + 6 * 864e5).toISOString().slice(0, 10);
        ikili(x => x[2][w], x => x[3][w], `${fmtDay(bas)} – ${fmtDay(bit)}`, 1);
      } else {
        const [a, i] = ay[alt] || [];
        if (a == null) { el.innerHTML = '<p class="muted">Bu ay için tahmin yok.</p>'; mt.innerHTML = ''; return; }
        ikili(x => x[4][i], x => x[5][i], ayAd(a), 3);
      }
    };
    const altCiz = () => {
      const L = tur === 0 ? ['Haftalık tahmin', '2. hafta', '3. hafta', '4. hafta'] : ay.map(([a]) => ayAd(a));
      $('u-alt-b').textContent = tur === 0 ? 'Hafta' : 'Ay';
      sekmeler($('u-alt'), L, i => { alt = i; ciz(); });
    };
    sekmeler($('u-tur'), ['Haftalık ve aylık', 'Mevsimlik'], i => { tur = i; alt = 0; altCiz(); });
  }

  (async () => {
    $('g5').innerHTML = yukleniyor('Tahmin haritaları yükleniyor…');
    [K, U] = await Promise.all([al('data/tahmin.json').catch(() => null), al('data/uzun-vade.json').catch(() => null)]);
    if (!K) { ['g5', 's-har', 'y-har'].forEach(id => { $(id).innerHTML = hataMsg('Tahmin haritaları şu an alınamadı. Biraz sonra sayfayı yenile.'); }); }
    else {
      const t = new Date(K.t);
      const enY = Object.entries(K.il).sort((a, b) => b[1][2][1] - a[1][2][1])[0], enD = Object.entries(K.il).sort((a, b) => a[1][1][1] - b[1][1][1])[0];
      const yag = Object.entries(K.il).map(([a, d]) => [a, d[3].slice(0, 5).reduce((s, x) => s + (x || 0), 0)]).sort((a, b) => b[1] - a[1])[0];
      $('kisa').innerHTML = `<div><dt>Güncelleme</dt><dd>${esc(t.toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}</dd></div>
        <div><dt>Yarın en sıcak</dt><dd>${esc(enY[0])} ${deg(enY[1][2][1])}</dd></div><div><dt>Yarın en soğuk</dt><dd>${esc(enD[0])} ${deg(enD[1][1][1])}</dd></div>
        <div><dt>5 günde en çok yağış</dt><dd>${esc(yag[0])} ${mm(yag[1])} mm</dd></div>`;
      $('g5-guncel').textContent = `Bu tahminler ${t.toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} itibarıyla güncellenmiştir.`;
      besGun(); sicaklik(); yagis();
    }
    uzunVade();
  })();
})();
