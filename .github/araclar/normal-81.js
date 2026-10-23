// 81 il merkezi için 1991–2020 aylık iklim normallerini NASA POWER'dan hesaplar ve assets/normal-81.js dosyasına yazar.
// Bir kez çalıştırılır (normaller değişmez). Çalıştır: node .github/araclar/normal-81.js
// Kaynak: NASA Langley Research Center POWER Project (MERRA-2, ~50 km çözünürlük), kamu malı.
const fs = require('fs'), path = require('path');
const KOK = path.join(__dirname, '..', '..');
const ham = fs.readFileSync(path.join(KOK, 'assets/ililce.js'), 'utf8');
const ILILCE = JSON.parse(ham.slice(ham.indexOf('['), ham.lastIndexOf(']') + 1));
const bekle = ms => new Promise(r => setTimeout(r, ms));
const AY = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], GUN = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
async function al(url) {
  for (let d = 0; d < 5; d++) {
    try { const r = await fetch(url); if (r.ok) return r.json(); console.log('  durum', r.status); } catch (e) { console.log('  hata', e.message); }
    await bekle(5000 * (d + 1));
  }
  throw new Error('alınamadı: ' + url);
}
(async () => {
  const cikti = {}, r1 = v => Math.round(v * 10) / 10;
  for (const I of ILILCE) {
    const k = `longitude=${I.lon.toFixed(3)}&latitude=${I.lat.toFixed(3)}`;
    const c = (await al(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS10M,WS50M,RH2M,T2M_MIN,T2M_MAX&community=AG&${k}&start=1991&end=2020&format=JSON`)).properties.parameter;
    // Ortalama yıllık en düşük sıcaklık (soğuğa dayanıklılık bölgesi için) ve ortalama en yüksek/en düşük: günlük veriden
    const g = (await al(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MIN,T2M_MAX&community=AG&${k}&start=19910101&end=20201231&format=JSON`)).properties.parameter;
    const yilMin = {}, ayMx = Array.from({ length: 12 }, () => []), ayMn = Array.from({ length: 12 }, () => []);
    for (const [t, v] of Object.entries(g.T2M_MIN)) { if (v <= -900) continue; const y = t.slice(0, 4), m = +t.slice(4, 6) - 1; yilMin[y] = Math.min(yilMin[y] ?? 99, v); ayMn[m].push(v); }
    for (const [t, v] of Object.entries(g.T2M_MAX)) { if (v <= -900) continue; ayMx[+t.slice(4, 6) - 1].push(v); }
    const ort = a => a.reduce((s, x) => s + x, 0) / a.length;
    cikti[I.ad] = {
      t: AY.map(a => r1(c.T2M[a])), mx: ayMx.map(a => r1(ort(a))), mn: ayMn.map(a => r1(ort(a))),
      y: AY.map((a, i) => Math.round(c.PRECTOTCORR[a] * GUN[i])), gunes: AY.map(a => r1(c.ALLSKY_SFC_SW_DWN[a] / 3.6)), // kWh/m²/gün
      r10: AY.map(a => r1(c.WS10M[a])), r50: AY.map(a => r1(c.WS50M[a])), nem: AY.map(a => Math.round(c.RH2M[a])),
      uc: [r1(c.T2M_MIN.ANN), r1(c.T2M_MAX.ANN)], yilMin: r1(ort(Object.values(yilMin)))
    };
    console.log(I.ad, cikti[I.ad].t[0], cikti[I.ad].t[6], 'yağış', cikti[I.ad].y.reduce((a, b) => a + b, 0), 'yıllık en düşük ort.', cikti[I.ad].yilMin);
    await bekle(800);
  }
  fs.writeFileSync(path.join(KOK, 'assets/normal-81.js'), '// 81 il merkezi, 1991–2020 aylık iklim normalleri. Kaynak: NASA POWER (MERRA-2), kamu malı. Üreten: .github/araclar/normal-81.js\n'
    + '// t: ortalama sıcaklık, mx/mn: ortalama en yüksek/en düşük (°C), y: toplam yağış (mm), gunes: güneş enerjisi (kWh/m²/gün), r10/r50: 10 ve 50 m rüzgar (m/s), nem (%), uc: [rekor en düşük, rekor en yüksek], yilMin: ortalama yıllık en düşük\n'
    + 'const NORMAL81 = ' + JSON.stringify(cikti) + ';\n');
  console.log('yazıldı');
})();
