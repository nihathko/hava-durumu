// Canlı gökyüzü: havaya ve günün saatine göre çizilen arka plan (tuval).
// Gün doğumu/batımına göre gök rengi, yavaşça doğan güneş, ay ve yıldızlar, katmanlı bulutlar, yağmur ve sıçramalar,
// kar, sis, şimşek ve tepe siluetleri. Hareket azaltma ayarında tek kare çizilir; sekme arka plandayken durur.
const GOK = (() => {
  'use strict';
  const cv = document.createElement('canvas');
  cv.className = 'gok'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobil = matchMedia('(max-width: 700px)').matches;
  let W = 0, H = 0, dpr = 1, son = performance.now(), zaman = 0, kaydir = 0;

  // ---------- Durum ----------
  const D = { tur: 'clear', gunduz: 1, bulut: 0.1, yagis: 0, kar: 0, sis: 0, firtina: 0, ruzgar: 8, yon: 270, gunes: 0.5, ay: 0.3 };
  // 0 → 1: sayfa açılınca güneşin ufuktan yükselişi. Ana sayfada her açılışta, diğer sayfalarda oturumda bir kez.
  const anaSayfa = /\/(index\.html)?$/.test(location.pathname);
  let gunesAcilis = (() => { try { if (!anaSayfa && sessionStorage.getItem('hava.gunesDogdu')) return 1; sessionStorage.setItem('hava.gunesDogdu', '1'); } catch (e) {} return 0; })();

  // ---------- Renkler ----------
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const karis = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const PAL = {
    gece: ['#030712', '#0A1630', '#1A2B52'].map(hex),
    safak: ['#1E2A55', '#8E5A7A', '#F2A86B'].map(hex),
    sabah: ['#3C6FB8', '#86B6E3', '#F3D7B0'].map(hex),
    gun: ['#1F6FD0', '#5CA8EE', '#BFE2FA'].map(hex),
    kapali: ['#5E6C7C', '#8E9BA8', '#BFC7CF'].map(hex),
    yagmur: ['#3A4553', '#56626F', '#7B8692'].map(hex),
    firtina: ['#1C2129', '#2E3540', '#4A525E'].map(hex),
    sisli: ['#A9B3BC', '#C6CDD3', '#DDE2E6'].map(hex)
  };
  let gok = PAL.gun.map(c => c.slice());
  function hedefGok() {
    const e = Math.sin(Math.PI * Math.min(1, Math.max(0, D.gunes))); // güneş yüksekliği (0 ufuk, 1 öğle)
    let p;
    if (!D.gunduz) p = PAL.gece;
    else if (e < 0.18) p = PAL.safak.map((c, i) => karis(c, PAL.sabah[i], e / 0.18));
    else if (e < 0.45) p = PAL.sabah.map((c, i) => karis(c, PAL.gun[i], (e - 0.18) / 0.27));
    else p = PAL.gun;
    // Bulut, yağış, fırtına ve sis rengi soldurur
    const kap = Math.min(1, D.bulut * 0.85 + D.yagis * 0.6);
    const bulutlu = D.gunduz ? PAL.kapali : PAL.gece.map(c => karis(c, [40, 46, 58], 0.4));
    p = p.map((c, i) => karis(c, bulutlu[i], kap * 0.85));
    if (D.yagis > 0.3) p = p.map((c, i) => karis(c, D.gunduz ? PAL.yagmur[i] : PAL.firtina[i], Math.min(1, (D.yagis - 0.3) * 1.4)));
    if (D.firtina) p = p.map((c, i) => karis(c, PAL.firtina[i], 0.6));
    if (D.sis) p = p.map((c, i) => karis(c, D.gunduz ? PAL.sisli[i] : [40, 46, 56], 0.7 * D.sis));
    return p;
  }

  // ---------- Yıldızlar ----------
  let yildiz = [];
  function yildizKur() {
    const n = mobil ? 140 : 280;
    yildiz = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.3 + 0.2, f: Math.random() * 6.28, h: 0.5 + Math.random() * 2 }));
  }
  let kayan = null;

  // ---------- Bulut çizimleri (önceden hazırlanır) ----------
  let bulutResim = [];
  function bulutUret(boy, koyu) {
    const c = document.createElement('canvas'), w = boy, h = boy * 0.55;
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const n = 14 + Math.random() * 10;
    for (let i = 0; i < n; i++) {
      const x = w * (0.15 + Math.random() * 0.7), y = h * (0.45 + (Math.random() - 0.5) * 0.35), r = h * (0.18 + Math.random() * 0.3);
      const gr = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
      const ust = koyu ? 'rgba(200,206,214,.95)' : 'rgba(255,255,255,.98)', alt = koyu ? 'rgba(120,128,140,0)' : 'rgba(225,232,240,0)';
      gr.addColorStop(0, ust); gr.addColorStop(0.55, koyu ? 'rgba(165,172,182,.75)' : 'rgba(240,244,248,.8)'); gr.addColorStop(1, alt);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill();
    }
    // Alt kenar gölgesi: bulutlara hacim verir
    const golge = g.createLinearGradient(0, h * 0.35, 0, h);
    golge.addColorStop(0, 'rgba(0,0,0,0)'); golge.addColorStop(1, koyu ? 'rgba(40,46,56,.45)' : 'rgba(120,140,165,.28)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = golge; g.fillRect(0, 0, w, h);
    return c;
  }
  function bulutlariHazirla() {
    bulutResim = [];
    for (let i = 0; i < 6; i++) bulutResim.push({ acik: bulutUret(420 + Math.random() * 240, false), koyu: bulutUret(420 + Math.random() * 240, true) });
  }
  let bulutlar = [];
  function bulutKur() {
    const n = Math.round((mobil ? 6 : 10) * (0.2 + D.bulut * 1.4 + D.yagis * 0.6));
    bulutlar = Array.from({ length: n }, (_, i) => yeniBulut(Math.random()));
  }
  function yeniBulut(x) {
    const z = Math.random(); // 0 uzak, 1 yakın
    return { x, y: 0.04 + Math.random() * (0.28 + D.bulut * 0.22), z, s: 0.35 + z * 0.9, r: Math.floor(Math.random() * bulutResim.length), a: 0.55 + z * 0.45 };
  }

  // ---------- Yağmur, kar, sıçrama, sis ----------
  let damla = [], kar = [], sicra = [], sis = [];
  function parcacikKur() {
    const k = mobil ? 0.55 : 1;
    damla = Array.from({ length: Math.round(D.yagis * 700 * k) }, () => yeniDamla(true));
    kar = Array.from({ length: Math.round(D.kar * 320 * k) }, () => yeniKar(true));
    sis = Array.from({ length: D.sis ? 7 : 0 }, () => ({ x: Math.random() * 1.4 - 0.2, y: 0.35 + Math.random() * 0.6, r: 0.35 + Math.random() * 0.4, v: (Math.random() * 0.4 + 0.2) * 0.004 }));
  }
  const yeniDamla = bas => { const z = Math.random(); return { x: Math.random() * 1.2 - 0.1, y: bas ? Math.random() : -0.1 - Math.random() * 0.2, z, l: 10 + z * 22, v: 0.9 + z * 1.1 }; };
  const yeniKar = bas => { const z = Math.random(); return { x: Math.random(), y: bas ? Math.random() : -0.05, z, r: 0.8 + z * 2.8, v: 0.03 + z * 0.06, f: Math.random() * 6.28 }; };

  // ---------- Şimşek ----------
  let simsek = null, flas = 0, sonrakiSimsek = 3;
  function simsekUret() {
    const yol = [[W * (0.2 + Math.random() * 0.6), 0]], dal = [];
    let [x, y] = yol[0];
    while (y < H * (0.55 + Math.random() * 0.2)) {
      x += (Math.random() - 0.5) * 60; y += 12 + Math.random() * 26; yol.push([x, y]);
      if (Math.random() < 0.12) { const d = [[x, y]]; let dx = x, dy = y; for (let i = 0; i < 6; i++) { dx += (Math.random() - 0.3) * 40 * (Math.random() < 0.5 ? -1 : 1); dy += 10 + Math.random() * 20; d.push([dx, dy]); } dal.push(d); }
    }
    return { yol, dal, omur: 0.25 };
  }

  // ---------- Tepeler (siluet) ----------
  let tepe = [];
  function tepeKur() {
    tepe = [0, 1, 2].map(k => { const n = 9 + k * 3, p = []; for (let i = 0; i <= n; i++) p.push([i / n, 0.04 + Math.random() * (0.09 - k * 0.02)]); return p; });
  }

  // ---------- Boyut ----------
  function boyut() {
    dpr = Math.min(window.devicePixelRatio || 1, mobil ? 1.5 : 1.75);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- Çizim ----------
  function ciz(dt) {
    zaman += dt;
    // Gök rengi hedefe yavaşça kayar
    const hg = hedefGok(), hiz = Math.min(1, dt * 0.9);
    gok = gok.map((c, i) => karis(c, hg[i], hiz));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(gok[0])); g.addColorStop(0.55, rgb(gok[1])); g.addColorStop(1, rgb(gok[2]));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const kp = Math.min(kaydir, H) * 0.12; // kaydırınca gök cisimleri hafifçe yukarı kayar

    // Yıldızlar ve ay
    const gece = D.gunduz ? 0 : 1, yildizA = gece * (1 - Math.min(1, D.bulut * 1.1 + D.yagis + D.sis));
    if (yildizA > 0.02) {
      for (const s of yildiz) {
        const a = yildizA * (0.55 + 0.45 * Math.sin(zaman * s.h + s.f));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H - kp * 0.5, s.r, 0, 6.29); ctx.fill();
      }
      if (!kayan && Math.random() < dt * 0.06) kayan = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.3, t: 0 };
      if (kayan) {
        kayan.t += dt * 1.6;
        const x = kayan.x + kayan.t * 380, y = kayan.y + kayan.t * 150, a = Math.sin(Math.min(1, kayan.t) * Math.PI) * yildizA;
        const kg = ctx.createLinearGradient(x - 120, y - 47, x, y); kg.addColorStop(0, 'rgba(255,255,255,0)'); kg.addColorStop(1, `rgba(255,255,255,${a})`);
        ctx.strokeStyle = kg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 120, y - 47); ctx.lineTo(x, y); ctx.stroke();
        if (kayan.t > 1) kayan = null;
      }
    }
    if (gece) {
      const mx = W * 0.78, my = H * 0.18 - kp, mr = mobil ? 26 : 36, ga = 1 - Math.min(0.85, D.bulut + D.yagis);
      const hale = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 5);
      hale.addColorStop(0, `rgba(210,225,255,${0.22 * ga})`); hale.addColorStop(1, 'rgba(210,225,255,0)');
      ctx.fillStyle = hale; ctx.beginPath(); ctx.arc(mx, my, mr * 5, 0, 6.29); ctx.fill();
      ctx.fillStyle = `rgba(240,244,255,${0.95 * ga})`; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.29); ctx.fill();
      // Ay evresi: gölgeli kısım
      ctx.fillStyle = rgb(gok[0], 0.92 * ga); ctx.beginPath(); ctx.arc(mx + mr * (1 - 2 * D.ay) * 0.9, my - mr * 0.1, mr * 0.98, 0, 6.29); ctx.fill();
      ctx.fillStyle = `rgba(190,200,220,${0.25 * ga})`;
      [[-.3, -.2, .18], [.2, .25, .12], [-.1, .35, .09]].forEach(([a, b, c]) => { ctx.beginPath(); ctx.arc(mx + a * mr, my + b * mr, c * mr, 0, 6.29); ctx.fill(); });
    }

    // Güneş: sayfa açılınca ufuktan yükselir
    if (D.gunduz) {
      gunesAcilis = azHareket ? 1 : Math.min(1, gunesAcilis + dt / 3.2);
      const yumus = 1 - Math.pow(1 - gunesAcilis, 3);
      const t = Math.min(1, Math.max(0, D.gunes)), e = Math.sin(Math.PI * t);
      const sx = W * (0.12 + 0.76 * t), ufuk = H * 0.86, sy = ufuk - (ufuk - H * 0.12) * e * yumus - kp;
      const ort = 1 - Math.min(0.9, D.bulut * 0.8 + D.yagis * 0.9 + D.sis * 0.6), sr = mobil ? 34 : 46;
      const sicaklik = e < 0.3 ? [255, 170, 90] : [255, 236, 190];
      const b1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 9);
      b1.addColorStop(0, rgb(sicaklik, 0.55 * ort)); b1.addColorStop(0.25, rgb(sicaklik, 0.18 * ort)); b1.addColorStop(1, rgb(sicaklik, 0));
      ctx.fillStyle = b1; ctx.fillRect(0, 0, W, H);
      // Işık hüzmeleri (yavaşça döner)
      if (ort > 0.4) {
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(zaman * 0.02);
        for (let i = 0; i < 12; i++) {
          ctx.rotate(Math.PI / 6);
          const hz = ctx.createLinearGradient(0, 0, sr * 8, 0); hz.addColorStop(0, rgb(sicaklik, 0.09 * ort)); hz.addColorStop(1, rgb(sicaklik, 0));
          ctx.fillStyle = hz; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sr * 8, -sr * 0.5); ctx.lineTo(sr * 8, sr * 0.5); ctx.fill();
        }
        ctx.restore();
      }
      const disk = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      disk.addColorStop(0, `rgba(255,255,245,${ort})`); disk.addColorStop(0.7, rgb(e < 0.3 ? [255, 200, 130] : [255, 246, 215], ort)); disk.addColorStop(1, rgb(sicaklik, 0));
      ctx.fillStyle = disk; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.29); ctx.fill();
    }

    // Tepeler: uzaktan yakına, gök rengine uyumlu
    tepe.forEach((p, k) => {
      const renk = karis(gok[2], gece ? [6, 10, 20] : [40, 58, 70], 0.35 + k * 0.22);
      const taban = H * (1.0 - k * 0.012), yuk = H * (0.035 + k * 0.022);
      ctx.fillStyle = rgb(renk, 0.32 + k * 0.2);
      ctx.beginPath(); ctx.moveTo(0, H);
      p.forEach(([x, y], i) => { const px = x * W, py = taban - yuk - y * H * (0.55 - k * 0.1) + Math.sin(i * 1.7 + k) * 5 + kp * (0.3 + k * 0.2); if (i === 0) ctx.lineTo(px, py); else { const [ox, oy] = p[i - 1]; ctx.quadraticCurveTo((ox * W + px) / 2, py - 10, px, py); } });
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    });

    // Bulutlar: uzak katman yavaş, yakın katman hızlı (rüzgarla)
    const rz = (D.ruzgar + 4) * (D.yon > 180 ? 1 : -1) * 0.00009;
    const koyuluk = D.yagis > 0.25 || D.firtina;
    for (const b of bulutlar) {
      if (!azHareket) b.x += rz * dt * (0.3 + b.z * 1.4) * 60;
      const im = koyuluk ? bulutResim[b.r].koyu : bulutResim[b.r].acik, w = im.width * b.s * (mobil ? 0.7 : 1), h = im.height * b.s * (mobil ? 0.7 : 1);
      if (b.x > 1.3) b.x = -0.45; if (b.x < -0.5) b.x = 1.25;
      ctx.globalAlpha = b.a * (gece ? 0.42 : 1) * Math.min(1, 0.35 + D.bulut + D.yagis);
      ctx.drawImage(im, b.x * W - w / 2, b.y * H - h / 2 - kp * (0.6 + b.z), w, h);
    }
    ctx.globalAlpha = 1;
    if (gece && bulutlar.length) { ctx.fillStyle = 'rgba(5,10,25,.25)'; ctx.fillRect(0, 0, W, H); }

    // Sis: yatay kayan yumuşak katmanlar
    for (const s of sis) {
      if (!azHareket) s.x += s.v * dt * 60 * 0.2;
      if (s.x > 1.4) s.x = -0.4;
      const r = s.r * W, gr = ctx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, r);
      const c = D.gunduz ? '235,239,243' : '150,160,175';
      gr.addColorStop(0, `rgba(${c},${0.42 * D.sis})`); gr.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gr; ctx.fillRect(s.x * W - r, s.y * H - r, r * 2, r * 2);
    }
    if (D.sis) { const v = ctx.createLinearGradient(0, H * 0.4, 0, H); v.addColorStop(0, 'rgba(230,235,240,0)'); v.addColorStop(1, `rgba(${D.gunduz ? '230,235,240' : '120,130,145'},${0.55 * D.sis})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }

    // Yağmur
    if (damla.length) {
      const egim = (D.ruzgar / 40) * (D.yon > 180 ? 1 : -1);
      ctx.lineCap = 'round';
      for (const d of damla) {
        if (!azHareket) { d.y += d.v * dt * 1.15; d.x += egim * d.v * dt * 0.25; }
        if (d.y > 1.02) {
          if (d.z > 0.65 && sicra.length < 120 && !azHareket) sicra.push({ x: d.x * W, y: H * (0.93 + Math.random() * 0.07), t: 0 });
          Object.assign(d, yeniDamla(false));
        }
        const x = d.x * W, y = d.y * H;
        ctx.strokeStyle = `rgba(${D.gunduz ? '210,225,240' : '170,185,205'},${0.18 + d.z * 0.45})`;
        ctx.lineWidth = 0.6 + d.z * 1.1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - egim * d.l * 0.6, y - d.l); ctx.stroke();
      }
      for (let i = sicra.length - 1; i >= 0; i--) {
        const s = sicra[i]; s.t += dt * 3.5;
        if (s.t >= 1) { sicra.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(220,232,245,${0.55 * (1 - s.t)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 2 + s.t * 9, 1 + s.t * 2.5, 0, Math.PI, 2 * Math.PI); ctx.stroke();
      }
      // Yağmurda gökyüzü koyulaşır
      ctx.fillStyle = `rgba(10,16,26,${0.12 * D.yagis})`; ctx.fillRect(0, 0, W, H);
    }

    // Kar
    for (const k of kar) {
      if (!azHareket) { k.y += k.v * dt * 1.2; k.f += dt; k.x += Math.sin(k.f * (0.6 + k.z)) * 0.0006 + (D.yon > 180 ? 1 : -1) * D.ruzgar * 0.000012; }
      if (k.y > 1.02) Object.assign(k, yeniKar(false));
      if (k.x > 1.02) k.x = -0.02; if (k.x < -0.02) k.x = 1.02;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + k.z * 0.4})`;
      ctx.beginPath(); ctx.arc(k.x * W, k.y * H, k.r, 0, 6.29); ctx.fill();
    }

    // Şimşek
    if (D.firtina && !azHareket) {
      sonrakiSimsek -= dt;
      if (sonrakiSimsek <= 0) { simsek = simsekUret(); flas = 1; sonrakiSimsek = 3 + Math.random() * 7; }
      if (simsek) {
        simsek.omur -= dt;
        const a = Math.max(0, simsek.omur / 0.25);
        ctx.save(); ctx.shadowColor = 'rgba(190,210,255,.9)'; ctx.shadowBlur = 18;
        ctx.strokeStyle = `rgba(245,248,255,${a})`; ctx.lineWidth = 2.4;
        ctx.beginPath(); simsek.yol.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        ctx.lineWidth = 1.1; simsek.dal.forEach(d => { ctx.beginPath(); d.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
        ctx.restore();
        if (simsek.omur <= 0) simsek = null;
      }
      if (flas > 0) { ctx.fillStyle = `rgba(225,232,255,${flas * 0.45})`; ctx.fillRect(0, 0, W, H); flas = Math.max(0, flas - dt * 3.2); }
    }
  }

  // ---------- Döngü ----------
  let calisiyor = false;
  function dongu(t) {
    const dt = Math.min(0.05, (t - son) / 1000); son = t;
    ciz(dt);
    if (!azHareket && !document.hidden) requestAnimationFrame(dongu); else calisiyor = false;
  }
  function baslat() { if (calisiyor) return; calisiyor = true; son = performance.now(); requestAnimationFrame(dongu); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) baslat(); });
  addEventListener('resize', () => { boyut(); if (azHareket) ciz(0); }, { passive: true });
  addEventListener('scroll', () => { kaydir = scrollY; }, { passive: true });

  boyut(); yildizKur(); bulutlariHazirla(); tepeKur(); bulutKur(); parcacikKur();

  // ---------- Dışarıdan ayar ----------
  // tur: clear | partly | cloud | fog | drizzle | rain | snow | thunder; gunes: 0 doğuş … 1 batış (gündüz için); ay: evre 0–1
  function ayarla(o) {
    const tur = o.tur || 'clear';
    const once = { ...D };
    Object.assign(D, {
      tur, gunduz: o.gunduz ? 1 : 0,
      bulut: { clear: 0.08, partly: 0.4, cloud: 0.85, fog: 0.6, drizzle: 0.75, rain: 0.95, snow: 0.9, thunder: 1 }[tur] ?? 0.3,
      yagis: { drizzle: 0.3, rain: o.siddet === 'kuvvetli' ? 1 : 0.7, thunder: 1 }[tur] || 0,
      kar: tur === 'snow' ? (o.siddet === 'kuvvetli' ? 1 : 0.65) : 0,
      sis: tur === 'fog' ? 1 : 0, firtina: tur === 'thunder' ? 1 : 0,
      ruzgar: o.ruzgar ?? 8, yon: o.yon ?? 270, gunes: o.gunes ?? 0.5, ay: o.ay ?? D.ay
    });
    if (once.tur !== D.tur || once.gunduz !== D.gunduz || !bulutlar.length) { bulutKur(); parcacikKur(); }
    if (once.gunduz !== D.gunduz && D.gunduz) gunesAcilis = 0;
    if (azHareket) ciz(0); else baslat();
  }
  if (azHareket) ciz(0); else baslat();
  return { ayarla, durum: () => ({ ...D }) };
})();
