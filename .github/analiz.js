// 81 il için son 13 ayın aylık sıcaklık, yağış ve ısıtma/soğutma gün derecelerini NASA POWER'dan hesaplar (data/analiz.json).
// GitHub Actions günde bir kez çalıştırır (önbellekte o günün dosyası varsa tekrar indirmez).
// Normallerle aynı kaynaktan (NASA POWER) geldiği için normalden fark tutarlı hesaplanır.
const fs = require('fs'), path = require('path');
const ham = fs.readFileSync(path.join(__dirname, '..', 'assets/ililce.js'), 'utf8');
const ILILCE = JSON.parse(ham.slice(ham.indexOf('['), ham.lastIndexOf(']') + 1));
const bekle = ms => new Promise(r => setTimeout(r, ms));
const gun = d => d.toISOString().slice(0, 10).replace(/-/g, '');
async function al(url) {
  for (let d = 0; d < 4; d++) {
    try { const r = await fetch(url); if (r.ok) return r.json(); } catch (e) {}
    await bekle(4000 * (d + 1));
  }
  return null;
}
(async () => {
  const bit = new Date(), bas = new Date(Date.UTC(bit.getUTCFullYear() - 1, bit.getUTCMonth() - 1, 1));
  const il = {}; let sonGun = '';
  for (const I of ILILCE) {
    const j = await al(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR&community=AG&longitude=${I.lon.toFixed(3)}&latitude=${I.lat.toFixed(3)}&start=${gun(bas)}&end=${gun(bit)}&format=JSON`);
    if (!j) { console.log('alınamadı', I.ad); continue; }
    const P = j.properties.parameter, ay = {};
    // NASA POWER bazı yanıtlarda yağışı (mm/gün yazmasına rağmen) mm/saat cinsinden, yani 24 kat büyük veriyor.
    // Bu yanıtlarda bütün değerler 0,24'ün tam katı oluyor; gerçek veride bu neredeyse imkansız. Öyleyse 24'e bölünür.
    const sifirdan = Object.values(P.PRECTOTCORR).filter(v => v > 0);
    const kat24 = sifirdan.length >= 5 && sifirdan.every(v => Math.abs(v / 0.24 - Math.round(v / 0.24)) < 0.002);
    if (kat24) for (const t of Object.keys(P.PRECTOTCORR)) if (P.PRECTOTCORR[t] > 0) P.PRECTOTCORR[t] /= 24;
    for (const t of Object.keys(P.T2M)) {
      const T = P.T2M[t], mx = P.T2M_MAX[t], mn = P.T2M_MIN[t], y = P.PRECTOTCORR[t];
      if ([T, mx, mn, y].some(v => v == null || v <= -900)) continue;
      const k = `${t.slice(0, 4)}-${t.slice(4, 6)}`, o = ay[k] || (ay[k] = { t: 0, mx: 0, mn: 0, y: 0, hdd: 0, cdd: 0, n: 0 });
      o.t += T; o.mx += mx; o.mn += mn; o.y += y; o.n++;
      if (T <= 15) o.hdd += 18 - T; if (T > 22) o.cdd += T - 22; // MGM'nin kullandığı eşikler
      const g = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`; if (g > sonGun) sonGun = g;
    }
    const r1 = v => Math.round(v * 10) / 10;
    il[I.ad] = Object.fromEntries(Object.entries(ay).map(([k, o]) => [k, [r1(o.t / o.n), r1(o.mx / o.n), r1(o.mn / o.n), Math.round(o.y), Math.round(o.hdd), Math.round(o.cdd), o.n]]));
    await bekle(300);
  }
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/analiz.json', JSON.stringify({ t: new Date().toISOString(), son: sonGun, kaynak: 'NASA POWER', alan: ['ortalama', 'ort. en yüksek', 'ort. en düşük', 'yağış mm', 'ısıtma gün derece', 'soğutma gün derece', 'gün sayısı'], il }));
  console.log(`${Object.keys(il).length} il, son gün ${sonGun}`);
})();
