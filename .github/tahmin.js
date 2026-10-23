// Tahmin haritaları için veri (data/tahmin.json): Türkiye üzerindeki yaklaşık 50 km aralıklı ızgarada ve 81 ilde
// 7 günlük en yüksek/en düşük sıcaklık, yağış ve hava durumu. Uzun vade (data/uzun-vade.json): 1° ızgarada haftalık ve
// aylık sıcaklık ve yağışın normalden farkı (ECMWF SEAS5). GitHub Actions hazırlar; site hazır dosyayı okur.
// Kullanım: node .github/tahmin.js [kisa|uzun]
const fs = require('fs'), path = require('path');
const ham = fs.readFileSync(path.join(__dirname, '..', 'assets/ililce.js'), 'utf8');
const IL = JSON.parse(ham.slice(ham.indexOf('['), ham.lastIndexOf(']') + 1));
const bekle = ms => new Promise(r => setTimeout(r, ms));
const km = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const MERKEZ = IL.flatMap(I => [[I.lat, I.lon], ...I.ilceler.filter(x => x[1] != null).map(x => [x[1], x[2]])]);
// Türkiye'yi (ve kıyıdan biraz denizi) kaplayan ızgara: en yakın il/ilçe merkezine uzaklığı sınırdan küçük olan noktalar
function izgara(adim, sinir) {
  const L = [];
  for (let lat = 35.5; lat <= 42.5 + 1e-9; lat += adim) for (let lon = 25.5; lon <= 45 + 1e-9; lon += adim) {
    const a = +lat.toFixed(2), o = +lon.toFixed(2);
    if (MERKEZ.some(([y, x]) => km(a, o, y, x) < sinir)) L.push([a, o]);
  }
  return L;
}
async function al(url) {
  for (let d = 0; d < 5; d++) {
    try { const r = await fetch(url); if (r.ok) return r.json(); console.log('HTTP', r.status); } catch (e) { console.log('hata', e.message); }
    await bekle(5000 * (d + 1));
  }
  throw new Error('alınamadı: ' + url.slice(0, 120));
}
async function cokNokta(taban, N, prm, parca = 100) {
  const out = [];
  for (let i = 0; i < N.length; i += parca) {
    const p = N.slice(i, i + parca), q = new URLSearchParams({ latitude: p.map(x => x[0]).join(','), longitude: p.map(x => x[1]).join(','), ...prm });
    const v = await al(`${taban}?${q}`);
    out.push(...(Array.isArray(v) ? v : [v]));
    await bekle(1500);
  }
  return out;
}
const yuv = v => (v == null ? null : Math.round(v * 10) / 10);

async function kisa() {
  const N = izgara(0.5, 45);
  const prm = { daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code', timezone: 'Europe/Istanbul', forecast_days: 7 };
  const G = await cokNokta('https://api.open-meteo.com/v1/forecast', N, prm);
  const I = await cokNokta('https://api.open-meteo.com/v1/forecast', IL.map(x => [x.lat, x.lon]), { ...prm, daily: prm.daily + ',precipitation_probability_max' });
  const out = {
    t: new Date().toISOString(), gunler: G[0].daily.time, adim: 0.5,
    // Izgara: [enlem, boylam, en yüksek[7], en düşük[7], yağış[7]]
    izgara: N.map(([a, o], k) => { const D = G[k].daily; return [a, o, D.temperature_2m_max.map(yuv), D.temperature_2m_min.map(yuv), D.precipitation_sum.map(yuv)]; }),
    // İller: ad → [hava kodu[7], en düşük[7], en yüksek[7], yağış[7], yağış ihtimali[7]]
    il: Object.fromEntries(IL.map((x, k) => { const D = I[k].daily; return [x.ad, [D.weather_code, D.temperature_2m_min.map(yuv), D.temperature_2m_max.map(yuv), D.precipitation_sum.map(yuv), D.precipitation_probability_max]]; })),
  };
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/tahmin.json', JSON.stringify(out));
  console.log('tahmin.json:', N.length, 'ızgara noktası,', fs.statSync('data/tahmin.json').size, 'bayt');
}

async function uzun() {
  const N = izgara(1, 70);
  const V = await cokNokta('https://seasonal-api.open-meteo.com/v1/seasonal', N, { weekly: 'temperature_2m_anomaly,precipitation_anomaly', monthly: 'temperature_2m_anomaly,precipitation_anomaly' }, 50);
  const W = V[0].weekly, M = V[0].monthly;
  const out = {
    t: new Date().toISOString(), adim: 1, haftalar: W.time, aylar: M.time,
    // [enlem, boylam, haftalık sıcaklık farkı[], haftalık yağış farkı[], aylık sıcaklık farkı[], aylık yağış farkı[]]
    izgara: N.map(([a, o], k) => [a, o, V[k].weekly.temperature_2m_anomaly.map(yuv), V[k].weekly.precipitation_anomaly.map(yuv), V[k].monthly.temperature_2m_anomaly.map(yuv), V[k].monthly.precipitation_anomaly.map(yuv)]),
  };
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/uzun-vade.json', JSON.stringify(out));
  console.log('uzun-vade.json:', N.length, 'ızgara noktası,', fs.statSync('data/uzun-vade.json').size, 'bayt');
}

(async () => {
  const is = process.argv[2] || 'kisa';
  try { if (is === 'uzun') await uzun(); else await kisa(); }
  catch (e) { console.error(e.message); process.exit(1); }
})();
