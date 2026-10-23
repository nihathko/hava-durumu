// Hava Durumu — tüm sayfaların ortak kodu (yardımcılar, simgeler, gökyüzü, tema, menü, yer seçici, harita)
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const trSort = (a, b) => a.localeCompare(b, 'tr');

// ---------- Hava kodları (WMO) ----------
const CODES = {
  0: ['Açık', 'clear'], 1: ['Az bulutlu', 'clear'], 2: ['Parçalı bulutlu', 'partly'], 3: ['Çok bulutlu', 'cloud'],
  45: ['Sisli', 'fog'], 48: ['Kırağılı sis', 'fog'],
  51: ['Hafif çisenti', 'drizzle'], 53: ['Çisenti', 'drizzle'], 55: ['Yoğun çisenti', 'drizzle'],
  56: ['Donan çisenti', 'drizzle'], 57: ['Yoğun donan çisenti', 'drizzle'],
  61: ['Hafif yağmurlu', 'rain'], 63: ['Yağmurlu', 'rain'], 65: ['Kuvvetli yağmurlu', 'rain'],
  66: ['Donan yağmur', 'rain'], 67: ['Kuvvetli donan yağmur', 'rain'],
  71: ['Hafif kar yağışlı', 'snow'], 73: ['Kar yağışlı', 'snow'], 75: ['Yoğun kar yağışlı', 'snow'], 77: ['Kar taneleri', 'snow'],
  80: ['Hafif sağanak', 'rain'], 81: ['Sağanak yağışlı', 'rain'], 82: ['Kuvvetli sağanak', 'rain'],
  85: ['Kar sağanağı', 'snow'], 86: ['Yoğun kar sağanağı', 'snow'],
  95: ['Gök gürültülü sağanak', 'thunder'], 96: ['Dolulu fırtına', 'thunder'], 99: ['Kuvvetli dolulu fırtına', 'thunder']
};
const cond = c => CODES[c] || ['Bilinmiyor', 'cloud'];

// ---------- İkonlar ----------
const cloudPath = 'M18 40h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 40z';
function icon(code, day) {
  const kind = cond(code)[1];
  const sun = '<circle class="sun" cx="32" cy="32" r="12"/>' + Array.from({ length: 8 }, (_, i) => `<rect class="sun" x="30.5" y="8" width="3" height="8" rx="1.5" transform="rotate(${i * 45} 32 32)"/>`).join('');
  const moon = '<path class="moon" d="M40 14a18 18 0 1 0 10 30 15 15 0 1 1-10-30z"/>';
  const small = inner => `<g transform="translate(4 2) scale(.62)">${inner}</g>`;
  const cl = (dark, ty) => `<path class="cloud${dark ? ' dark' : ''}" transform="translate(0 ${ty})" d="${cloudPath}"/>`;
  let g;
  switch (kind) {
    case 'clear': g = day ? sun : moon; break;
    case 'partly': g = small(day ? sun : moon) + cl(false, 6); break;
    case 'cloud': g = `<path class="cloud dark" transform="translate(8 -2) scale(.8)" d="${cloudPath}"/>` + cl(false, 8); break;
    case 'fog': g = cl(false, 0) + '<path class="fog" d="M14 48h36M18 55h28"/>'; break;
    case 'drizzle': g = cl(false, 2) + '<path class="drop" d="M26 50l-2 4M38 50l-2 4M32 56l-2 4"/>'; break;
    case 'rain': g = cl(true, 2) + '<path class="drop" d="M24 52l-3 7M33 52l-3 7M42 52l-3 7"/>'; break;
    case 'snow': g = cl(false, 2) + '<circle class="flake" cx="24" cy="54" r="2.6"/><circle class="flake" cx="33" cy="58" r="2.6"/><circle class="flake" cx="42" cy="54" r="2.6"/>'; break;
    default: g = cl(true, 2) + '<path class="bolt" d="M34 44l-8 11h6l-3 9 10-13h-6l3-7z"/>';
  }
  return `<svg class="wi" viewBox="0 0 64 64" aria-hidden="true">${g}</svg>`;
}
// Rüzgarın estiği yönü gösteren ok (yön, rüzgarın geldiği taraftır)
const arrow = d => `<svg viewBox="0 0 16 16" aria-hidden="true" style="transform:rotate(${(d + 180) % 360}deg)"><path d="M8 1.5v12M8 1.5 4 6M8 1.5l4 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- Gökyüzü sahnesi (assets/gokyuzu.js çizer) ----------
// ek: { gd: gün doğumu 'SS:DD', gb: gün batımı, saat: yerel saat, ruzgar: km/sa, yon: derece }
const dakika = s => s ? +s.slice(0, 2) * 60 + +s.slice(3, 5) : null;
function setScene(code, day, ek = {}) {
  const k = cond(code)[1], d = day ? 1 : 0;
  const gd = dakika(ek.gd) ?? 390, gb = dakika(ek.gb) ?? 1110, sa = dakika(ek.saat) ?? (new Date().getHours() * 60 + new Date().getMinutes());
  const gunes = Math.min(1, Math.max(0, (sa - gd) / Math.max(1, gb - gd)));
  const ay = ((((Date.now() / 864e5 + 2440587.5 - 2451550.1) / 29.530588853) % 1) + 1) % 1;
  if (typeof GOK !== 'undefined') GOK.ayarla({ tur: k, gunduz: d, gunes, ay, ruzgar: ek.ruzgar, yon: ek.yon, siddet: [65, 67, 75, 82, 86, 99].includes(code) ? 'kuvvetli' : '' });
  // Gökyüzüne yazılan yazılar: açık renkli sisli ve karlı gündüz göğünde koyu, diğerlerinde beyaz
  const koyu = d && ['fog', 'snow'].includes(k), st = document.documentElement.style;
  st.setProperty('--on', koyu ? '#0E2233' : '#FFFFFF');
  st.setProperty('--on-muted', koyu ? 'rgba(14, 34, 51, .74)' : 'rgba(255, 255, 255, .82)');
  st.setProperty('--on-line', koyu ? 'rgba(14, 34, 51, .2)' : 'rgba(255, 255, 255, .24)');
  st.setProperty('--on-shadow', koyu ? 'none' : '0 1px 2px rgba(0, 0, 0, .25), 0 2px 18px rgba(0, 0, 0, .25)');
  document.documentElement.dataset.gok = d ? (koyu ? 'acik' : 'gun') : 'gece';
  const tc = document.querySelector('meta[name=theme-color]');
  if (tc) tc.content = d ? (k === 'rain' || k === 'thunder' ? '#3A4553' : koyu ? '#A9B3BC' : '#1F6FD0') : '#050A18';
  store.set('hava.sahne', [code, d, ek]); // diğer sayfalar da aynı gökyüzüyle açılsın
}

// ---------- Biçimlendirme ----------
const n0 = v => (v == null || Number.isNaN(v) ? '–' : Math.round(v) === 0 ? 0 : Math.round(v));
const deg = v => `${n0(v)}°`;
const DIRS = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
const dir = d => DIRS[Math.round(((d % 360) + 360) % 360 / 22.5) % 16];
// Rüzgar yönü (ok + harf) ve isteğe bağlı hız; veri yoksa çizgi
const wind = (d, v) => d == null ? '–' : `<span class="wd">${arrow(d)}${dir(d)}${v != null ? ' ' + n0(v) : ''}</span>`;
const hhmm = iso => iso.slice(11, 16);
const ymd = iso => iso.slice(0, 10);
const noon = d => new Date(d + 'T12:00:00Z');
const fmtDay = d => noon(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtWeek = d => noon(d).toLocaleDateString('tr-TR', { weekday: 'long', timeZone: 'UTC' });
const longDate = d => noon(d).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const coord = (v, pos, neg) => `${Math.abs(v).toFixed(2).replace('.', ',')}° ${v >= 0 ? pos : neg}`;
// MGM görsellerindeki merkez adı: büyük harf, Türkçe karaktersiz (Kahramanmaraş = K.MARAS)
const mgmCode = il => il === 'Kahramanmaraş' ? 'K.MARAS'
  : il.toLocaleUpperCase('tr').replace(/[ÇĞİÖŞÜ]/g, c => ({ Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U' }[c])).replace(/\s+/g, '');

// ---------- İl listesi (alfabetik) ----------
const IL = ILILCE.slice().sort((a, b) => trSort(a.ad, b.ad));

// Türkçe karakterlere duyarsız karşılaştırma: "sanliurfa" = "Şanlıurfa"
const fold = s => s.toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]));

// ---------- Kısa bildirim ----------
let toastT;
function toast(html) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = html; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 6000);
}

// ---------- Tema: Sistem / Açık / Koyu ----------
const THEMES = ['system', 'light', 'dark'], TNAME = { system: 'Sistem', light: 'Açık', dark: 'Koyu' };
const TICON = {
  system: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
};
let theme = store.get('hava.tema', 'system');
if (!THEMES.includes(theme)) theme = 'system';
function applyTheme() {
  if (theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  const b = $('theme');
  b.innerHTML = TICON[theme];
  b.title = `Tema: ${TNAME[theme]}`;
  b.setAttribute('aria-label', `Tema: ${TNAME[theme]}. Değiştirmek için dokun`);
}


// ---------- Yer arama (önce kendi listemiz, sonra dünya geneli) ----------
// Önce kendi il/ilçe listemizde ara (anında, internetsiz); il adıyla başlayanlar en üstte
function localPlaces(q) {
  const f = fold(q), out = [];
  for (const il of IL) if (fold(il.ad).startsWith(f)) out.push({ name: il.ad, sub: 'İl merkezi, Türkiye', lat: il.lat, lon: il.lon, cc: 'TR', il: il.ad, ilce: null });
  for (const il of IL) for (const x of il.ilceler) if (x[0] !== 'Merkez' && fold(x[0]).startsWith(f)) out.push({ name: x[0], sub: il.ad + ', Türkiye', lat: x[1], lon: x[2], cc: 'TR', il: il.ad, ilce: x[0] });
  return out.slice(0, 8);
}
async function searchPlaces(q, signal) {
  const local = localPlaces(q);
  if (local.length >= 8) return local;
  // Haritada tek bir yer adı olmayan bölge adları için en bilinen nokta
  const ALIAS = { kapadokya: 'Göreme' };
  const alias = fold(q).length >= 4 && Object.keys(ALIAS).find(k => k.startsWith(fold(q)));
  const u = new URL('https://geocoding-api.open-meteo.com/v1/search');
  u.search = new URLSearchParams({ name: alias ? ALIAS[alias] : q, count: 10, language: 'tr', format: 'json' });
  let remote = [];
  try {
    const r = await fetch(u, { signal });
    if (r.ok) remote = (await r.json()).results || [];
  } catch (e) { if (e.name === 'AbortError') throw e; if (!local.length) throw e; }
  const seen = new Set(local.map(p => fold(p.name) + '|' + (p.il || '')));
  const more = remote.map(x => {
    const tr = x.country_code === 'TR';
    const il = tr ? IL.find(y => y.ad.toLocaleLowerCase('tr') === (x.admin1 || '').toLocaleLowerCase('tr')) : null;
    const a2 = (x.admin2 || '').replace(/ (İlçesi|Merkez)$/, '');
    const low = s => s.toLocaleLowerCase('tr');
    const ilce = il ? il.ilceler.find(y => low(y[0]) === low(x.name)) || il.ilceler.find(y => low(y[0]) === low(a2)) : null;
    return {
      name: x.name, sub: [a2 && a2 !== x.name ? a2 : '', x.admin1, (x.country || '').replace(/ Cumhuriyeti$/, '')].filter(Boolean).join(', '),
      lat: x.latitude, lon: x.longitude, cc: x.country_code, il: il ? il.ad : null, ilce: ilce ? ilce[0] : null
    };
  }).filter(p => !seen.has(fold(p.name) + '|' + (p.il || ''))).sort((a, b) => (b.cc === 'TR') - (a.cc === 'TR'));
  return local.concat(more).slice(0, 8);
}

// ---------- Sayılar ----------
const dec = (v, n = 1) => (v == null || Number.isNaN(v) ? '–' : (+v).toFixed(n).replace('.', ','));
const mm = v => (v == null ? '–' : dec(v, v >= 10 ? 0 : 1));
const pct = v => (v == null ? '–' : '%' + n0(v));
const maxOf = a => { const v = a.filter(x => x != null); return v.length ? Math.max(...v) : null; };
const minOf = a => { const v = a.filter(x => x != null); return v.length ? Math.min(...v) : null; };
const sumOf = a => a.reduce((s, x) => s + (x ?? 0), 0);
const avgOf = a => { const v = a.filter(x => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const AY_K = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const bugunTR = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); // Türkiye saati (UTC+3)
const gunEkle = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const kisaGun = d => noon(d).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
// Beaufort ölçeği (km/sa)
const BOFOR = [[1, 'Sakin'], [6, 'Esinti'], [12, 'Hafif rüzgar'], [20, 'Tatlı rüzgar'], [29, 'Orta rüzgar'], [39, 'Sert rüzgar'], [50, 'Kuvvetli rüzgar'],
  [62, 'Fırtınamsı'], [75, 'Fırtına'], [89, 'Kuvvetli fırtına'], [103, 'Çok kuvvetli fırtına'], [118, 'Kasırga benzeri'], [Infinity, 'Kasırga']];
const bofor = v => { const i = BOFOR.findIndex(x => v < x[0]); return [i, BOFOR[i][1]]; };

// ---------- Renk ölçekleri (haritalar) ----------
function rampa(stops) {
  return v => {
    if (v == null || Number.isNaN(v)) return '#C9D2DA';
    if (v <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (v - a) / (b - a);
      const h = c => [1, 3, 5].map(j => parseInt(c.slice(j, j + 2), 16));
      const x = h(ca), y = h(cb);
      return '#' + x.map((p, j) => Math.round(p + (y[j] - p) * t).toString(16).padStart(2, '0')).join('');
    }
    return stops[stops.length - 1][1];
  };
}
// Sıcaklık: soğuk mavi, ılık sarı, sıcak kırmızı (RdYlBu)
const SICAK = [[-20, '#313695'], [-10, '#4575B4'], [-2, '#74ADD1'], [4, '#ABD9E9'], [10, '#E0F3F8'], [15, '#FEE090'], [20, '#FDAE61'], [26, '#F46D43'], [32, '#D73027'], [40, '#A50026']];
const sicakRenk = rampa(SICAK);
const YAGIS = [[0, '#EEF2F5'], [0.5, '#D3E6F4'], [2, '#A6CDEB'], [5, '#6AAADF'], [10, '#3A84CC'], [20, '#2160A8'], [40, '#123C78']];
const yagisRenk = rampa(YAGIS);
const RUZGAR = [[0, '#EEF4EE'], [10, '#CDE8CF'], [20, '#9BD3A2'], [35, '#5DB46F'], [50, '#F2C14E'], [65, '#E8833A'], [85, '#C7372F']];
const ruzgarRenk = rampa(RUZGAR);
// Normalden fark: mavi (soğuk) – gri (normal) – kırmızı (sıcak)
const FARK = [[-5, '#2166AC'], [-3, '#67A9CF'], [-1, '#D1E5F0'], [0, '#F2F2F2'], [1, '#FDDBC7'], [3, '#EF8A62'], [5, '#B2182B']];
const farkRenk = rampa(FARK);
// Yağışın normale oranı (%): kurak kahverengi – normal gri – yağışlı yeşil-mavi
const ORAN = [[0, '#8C510A'], [40, '#D8B365'], [80, '#F6E8C3'], [100, '#F2F2F2'], [120, '#C7EAE5'], [160, '#5AB4AC'], [250, '#01665E']];
const oranRenk = rampa(ORAN);
const BULUT = [[0, '#EAF3FB'], [30, '#C9D6E2'], [60, '#9AA9B8'], [100, '#5E6B78']];
const bulutRenk = rampa(BULUT);
const KAR = [[0, '#EEF2F5'], [1, '#DCE9F5'], [10, '#B9D3EE'], [30, '#8DB3E2'], [60, '#6A8FD1'], [120, '#7B5BB5']];
const karRenk = rampa(KAR);
// km/sa → deniz mili/saat (knot)
const knot = v => v == null ? null : v / 1.852;
// Lejant: ölçeği ve değerleri gösteren küçük şerit
const lejant = (stops, birim, baslik) => `<div class="lejant" aria-label="${esc(baslik)} ölçeği"><span class="lj-b">${esc(baslik)}</span><span class="lj-s" style="background:linear-gradient(90deg,${stops.map((s, i) => `${s[1]} ${(i / (stops.length - 1) * 100).toFixed(0)}%`).join(',')})"></span><span class="lj-v">${stops.map(s => `<i>${dec(s[0], 0)}</i>`).join('')}</span><span class="lj-u">${esc(birim)}</span></div>`;

// ---------- Siteye ait sayfalar ve üst menü ----------
const IKON = {
  index: '<path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5"/>', harita: '<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4zM9 4v13.5M15 6.5V20"/>',
  uyari: '<path d="M12 3 2 20h20L12 3zM12 10v4.5M12 17.5v.5"/>', radar: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 18 6"/>',
  grafik: '<path d="M3 20h18M5 16l4-5 4 3 6-8"/>', iklim: '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z"/>',
  analiz: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', deniz: '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M12 3v8M8 7l4-4 4 4"/>',
  ziraat: '<path d="M12 21V9M12 9c0-4 3-6 7-6 0 4-3 6-7 6zM12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>', ozel: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  bilgi: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', hakkinda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5"/>'
};
const SAYFALAR = [
  ['index.html', 'Hava durumu'], ['harita.html', 'Harita'], ['uyari.html', 'Dikkat'], ['radar.html', 'Radar ve uydu'], ['grafik.html', 'Grafik ve modeller'],
  ['iklim.html', 'İklim'], ['analiz.html', 'Analizler'], ['deniz.html', 'Denizcilik'], ['ziraat.html', 'Ziraat'], ['ozel.html', 'Özel tahminler'],
  ['bilgi.html', 'Bilgi'], ['hakkinda.html', 'Hakkında']
];
const ik = (h, cls = 'nik') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IKON[h.replace('.html', '')] || ''}</svg>`;
const SITE_IC = `<svg class="site-ic" viewBox="0 0 64 64" aria-hidden="true"><circle cx="24" cy="24" r="12" fill="#F2B227"/><g fill="#F2B227"><rect x="22.5" y="2" width="3" height="7" rx="1.5"/><rect x="22.5" y="2" width="3" height="7" rx="1.5" transform="rotate(45 24 24)"/><rect x="22.5" y="2" width="3" height="7" rx="1.5" transform="rotate(-45 24 24)"/><rect x="22.5" y="2" width="3" height="7" rx="1.5" transform="rotate(-90 24 24)"/></g><path d="M22 52h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 22 52z" fill="#fff" stroke="#8FA2B6" stroke-width="1.5"/></svg>`;
function kurUst() {
  const cur = location.pathname.split('/').pop() || 'index.html';
  const link = ([h, t]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ''}>${ik(h)}<span>${t}</span></a>`;
  const ana = SAYFALAR.slice(0, 6), diger = SAYFALAR.slice(6);
  const ust = document.createElement('header');
  ust.className = 'ust'; ust.id = 'ustbar';
  ust.innerHTML = `<div class="ust-in">
      <a class="logo" href="index.html" aria-label="Hava Durumu, ana sayfa">${SITE_IC}<span class="logo-t"><b>Hava Durumu</b><small>Türkiye ve dünya</small></span></a>
      <nav class="ana-nav" aria-label="Site bölümleri">${ana.map(link).join('')}
        <div class="daha"><button type="button" class="daha-b" aria-expanded="false" aria-haspopup="true"${diger.some(([h]) => h === cur) ? ' data-aktif="1"' : ''}>Daha fazla <svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <div class="daha-m" hidden>${diger.map(link).join('')}</div></div></nav>
      <div class="ust-ar">
        <button class="ic-btn" id="theme" type="button" aria-label="Tema: Sistem"></button>
        <span class="hko" aria-label="HKO Software"><span class="mark" aria-hidden="true"><b>&lt;</b>hko<b>/&gt;</b></span><span class="name">HKO SOFTWARE</span></span>
        <button class="ic-btn menu-b" id="menuB" type="button" aria-label="Menüyü aç" aria-expanded="false" aria-controls="cekmece"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div></div>`;
  document.body.prepend(ust);
  // Telefonda yandan açılan menü
  const ck = document.createElement('div');
  ck.className = 'cekmece'; ck.id = 'cekmece'; ck.hidden = true;
  ck.innerHTML = `<div class="ck-arka" data-kapat></div><aside class="ck-panel" role="dialog" aria-modal="true" aria-label="Site menüsü">
      <div class="ck-bas"><a class="logo" href="index.html">${SITE_IC}<span class="logo-t"><b>Hava Durumu</b><small>HKO Software</small></span></a><button class="ic-btn" type="button" data-kapat aria-label="Menüyü kapat">✕</button></div>
      <nav class="ck-nav" aria-label="Site bölümleri">${SAYFALAR.map(link).join('')}</nav>
      <div class="ck-tema"><span>Tema</span><div class="seg" id="segTema">${THEMES.map(t => `<button type="button" data-t="${t}">${TNAME[t]}</button>`).join('')}</div></div>
    </aside>`;
  document.body.appendChild(ck);
  const ac = v => {
    if (v) { ck.hidden = false; requestAnimationFrame(() => ck.classList.add('acik')); }
    else { ck.classList.remove('acik'); setTimeout(() => { ck.hidden = true; }, 320); }
    $('menuB').setAttribute('aria-expanded', String(v)); document.documentElement.classList.toggle('kilit', v);
  };
  $('menuB').addEventListener('click', () => ac(true));
  ck.addEventListener('click', e => { if (e.target.closest('[data-kapat]')) ac(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!ck.hidden) ac(false); dahaKapat(); } });
  // Masaüstünde "Daha fazla" açılır menüsü
  const db = ust.querySelector('.daha-b'), dm = ust.querySelector('.daha-m');
  const dahaKapat = () => { dm.hidden = true; db.setAttribute('aria-expanded', 'false'); };
  db.addEventListener('click', e => { e.stopPropagation(); const a = dm.hidden; dm.hidden = !a; db.setAttribute('aria-expanded', String(a)); });
  document.addEventListener('click', e => { if (!e.target.closest('.daha')) dahaKapat(); });
  // Kaydırınca üst çubuk koyulaşır
  const kay = () => ust.classList.toggle('dolu', scrollY > 12);
  addEventListener('scroll', kay, { passive: true }); kay();
  // Tema
  const segCiz = () => document.querySelectorAll('#segTema button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === theme)));
  $('segTema').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; theme = b.dataset.t; store.set('hava.tema', theme); applyTheme(); segCiz(); });
  $('theme').addEventListener('click', () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]; store.set('hava.tema', theme); applyTheme(); segCiz(); toast(`Tema: ${TNAME[theme]}`); });
  applyTheme(); segCiz();
  // Alt sayfalar son bakılan yerin gökyüzüyle açılır (ana sayfa kendi verisiyle günceller)
  const sc = store.get('hava.sahne', null);
  setScene(sc ? sc[0] : 0, sc ? sc[1] : 1, (sc && sc[2]) || {});
  canlandir();
}

// ---------- Animasyonlar: görünür olunca kayarak gelme, sayı sayma, slaytlar ----------
const hareketYok = matchMedia('(prefers-reduced-motion: reduce)').matches;
function canlandir() {
  if (hareketYok || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('anim');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('gor'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
  const tara = () => document.querySelectorAll('.sec:not(.izle), .card:not(.izle), .sayfa:not(.izle), .now:not(.izle), .notes:not(.izle), .slayt-k:not(.izle)').forEach((el, i) => { el.classList.add('izle'); el.style.setProperty('--gec', `${Math.min(i % 6, 5) * 60}ms`); io.observe(el); });
  tara();
  let bekle = 0;
  new MutationObserver(() => { clearTimeout(bekle); bekle = setTimeout(tara, 30); }).observe(document.body, { childList: true, subtree: true });
}
// Sayıyı 0'dan hedefe doğru sayarak göster
function sayiSay(el, hedef, sure = 900) {
  if (!el || hedef == null || hareketYok) return;
  const bas = performance.now(), ilk = Math.round(hedef) === 0 ? 0 : Math.round(hedef * 0.4);
  const yaz = v => { const s = el.querySelector('.sayi'); if (s) s.textContent = v; };
  const adim = t => { const p = Math.min(1, (t - bas) / sure), e = 1 - Math.pow(1 - p, 3); yaz(Math.round(ilk + (hedef - ilk) * e)); if (p < 1) requestAnimationFrame(adim); };
  requestAnimationFrame(adim);
}
// Yatay kaydırmalı slayt: ok düğmeleri ve fareyle sürükleme
function slaytKur(kap) {
  const iz = kap.querySelector('.slayt-iz');
  if (!iz) return;
  const git = y => iz.scrollBy({ left: y * iz.clientWidth * 0.8, behavior: hareketYok ? 'auto' : 'smooth' });
  kap.querySelector('.sl-geri')?.addEventListener('click', () => git(-1));
  kap.querySelector('.sl-ileri')?.addEventListener('click', () => git(1));
  const durum = () => { kap.querySelector('.sl-geri')?.toggleAttribute('disabled', iz.scrollLeft < 8); kap.querySelector('.sl-ileri')?.toggleAttribute('disabled', iz.scrollLeft + iz.clientWidth > iz.scrollWidth - 8); };
  iz.addEventListener('scroll', durum, { passive: true }); durum();
  let x0 = null, s0 = 0, oynadi = false;
  iz.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = iz.scrollLeft; oynadi = false; iz.classList.add('surukle'); });
  addEventListener('pointermove', e => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) oynadi = true; iz.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { x0 = null; iz.classList.remove('surukle'); });
  iz.addEventListener('click', e => { if (oynadi) { e.preventDefault(); e.stopPropagation(); oynadi = false; } }, true);
}

// ---------- Yer: bağlantıdan, son bakılandan ya da varsayılan ----------
function yerIl(il, ilceAd) {
  const I = IL.find(x => x.ad === il);
  if (!I) return null;
  const x = ilceAd ? I.ilceler.find(y => y[0] === ilceAd) : null;
  if (!x) return { name: I.ad, sub: 'İl merkezi, Türkiye', lat: I.lat, lon: I.lon, il: I.ad, ilce: null };
  if (x[0] === 'Merkez') return { name: I.ad, sub: 'Merkez ilçe, Türkiye', lat: x[1], lon: x[2], il: I.ad, ilce: x[0] };
  return { name: x[0], sub: I.ad + ', Türkiye', lat: x[1], lon: x[2], il: I.ad, ilce: x[0] };
}
function yerBaglanti() {
  const s = new URLSearchParams(location.search);
  if (s.get('il')) { const p = yerIl(s.get('il'), s.get('ilce')); if (p) return p; }
  const lat = +s.get('lat'), lon = +s.get('lon');
  if (s.get('lat') && s.get('lon') && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)
    return { name: (s.get('ad') || 'Paylaşılan yer').slice(0, 60), sub: 'Paylaşılan konum', lat: +lat.toFixed(2), lon: +lon.toFixed(2), il: null, ilce: null };
  return null;
}
const yerBaslangic = () => yerBaglanti() || store.get('hava.yer', null) || yerIl('Trabzon', 'Ortahisar');
function yerAdres(p) {
  const u = new URL(location.pathname, location.origin);
  if (p.il) { u.searchParams.set('il', p.il); if (p.ilce) u.searchParams.set('ilce', p.ilce); }
  else { u.searchParams.set('lat', (+p.lat).toFixed(2)); u.searchParams.set('lon', (+p.lon).toFixed(2)); u.searchParams.set('ad', p.name); }
  return u.search;
}
const anaSayfaLink = p => 'index.html' + yerAdres(p);

// ---------- Yer seçici (alt sayfalar): il, ilçe ve arama ----------
function yerSecici(el, onPick, ilkYer) {
  el.innerHTML = `<div class="pick">
    <div class="field"><label for="ys-il">İl</label><select id="ys-il"></select></div>
    <div class="field"><label for="ys-ilce">İlçe</label><select id="ys-ilce"></select></div>
    <div class="field search" role="search"><label for="ys-q">Ya da ara</label>
      <input id="ys-q" type="search" placeholder="Şehir, ilçe veya yer adı" autocomplete="off" enterkeyhint="search" aria-controls="ys-r">
      <ul class="results" id="ys-r" hidden></ul></div></div>`;
  const ilS = $('ys-il'), ilceS = $('ys-ilce'), q = $('ys-q'), res = $('ys-r');
  ilS.innerHTML = '<option value="" hidden>Seçilmedi</option>' + IL.map((x, i) => `<option value="${i}">${esc(x.ad)}</option>`).join('');
  const doldur = (i, ilceAd) => {
    const I = IL[i], mk = I.ilceler.findIndex(x => x[0] === 'Merkez');
    const list = I.ilceler.map(x => x[0]).filter(a => a !== 'Merkez').sort(trSort);
    ilceS.innerHTML = (mk >= 0 ? '<option value="Merkez">Merkez</option>' : '<option value="">İl merkezi</option>') + list.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('');
    ilceS.value = ilceAd && I.ilceler.some(x => x[0] === ilceAd) ? ilceAd : (mk >= 0 ? 'Merkez' : '');
  };
  const sec = p => {
    store.set('hava.yer', p);
    try { history.replaceState(null, '', location.pathname + yerAdres(p)); } catch (e) {}
    if (p.il) { const i = IL.findIndex(x => x.ad === p.il); ilS.value = String(i); doldur(i, p.ilce); }
    else { ilS.value = ''; ilceS.innerHTML = '<option value="">—</option>'; }
    onPick(p);
  };
  ilS.addEventListener('change', () => { doldur(+ilS.value); sec(yerIl(IL[+ilS.value].ad, ilceS.value || null)); });
  ilceS.addEventListener('change', () => sec(yerIl(IL[+ilS.value].ad, ilceS.value || null)));
  let found = [], tmr, ctl;
  q.addEventListener('input', () => {
    clearTimeout(tmr);
    const v = q.value.trim();
    if (v.length < 2) { res.hidden = true; return; }
    tmr = setTimeout(async () => {
      if (ctl) ctl.abort();
      ctl = new AbortController();
      try { found = await searchPlaces(v, ctl.signal); } catch (e) { if (e.name === 'AbortError') return; found = []; }
      res.innerHTML = found.length ? found.map((p, i) => `<li><button type="button" data-i="${i}"><span>${esc(p.name)}</span><span class="s">${esc(p.sub)}</span></button></li>`).join('') : '<li class="empty">Sonuç bulunamadı.</li>';
      res.hidden = false;
    }, 280);
  });
  q.addEventListener('keydown', e => { if (e.key === 'Enter' && found[0]) { e.preventDefault(); res.hidden = true; q.value = ''; sec(found[0]); } if (e.key === 'Escape') res.hidden = true; });
  res.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { res.hidden = true; q.value = ''; sec(found[+b.dataset.i]); } });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) res.hidden = true; });
  sec(ilkYer || yerBaslangic());
}

// ---------- Veri istekleri ----------
// Kısa süreli önbellek: aynı sayfada sekme değiştirince ya da yeniden açınca aynı veri tekrar istenmesin
async function getJSON(url, dk = 15) {
  const key = 'hava.o.' + url;
  try { const c = JSON.parse(sessionStorage.getItem(key)); if (c && Date.now() - c.t < dk * 6e4) return c.v; } catch (e) {}
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  const v = await r.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) {}
  return v;
}
const omURL = (base, params) => { const u = new URL(base); u.search = new URLSearchParams(params); return u.href; };
// Birden çok nokta için tek istek (Open-Meteo virgülle ayrılmış koordinat kabul eder); sonuç her zaman dizi
async function cokNokta(base, noktalar, params, dk = 15) {
  const out = [];
  for (let i = 0; i < noktalar.length; i += 100) {
    const parca = noktalar.slice(i, i + 100);
    const v = await getJSON(omURL(base, { latitude: parca.map(p => (+p.lat).toFixed(3)).join(','), longitude: parca.map(p => (+p.lon).toFixed(3)).join(','), ...params }), dk);
    out.push(...(Array.isArray(v) ? v : [v]));
  }
  return out;
}
const OM = 'https://api.open-meteo.com/v1/forecast';
const OM_AQ = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const OM_DENIZ = 'https://marine-api.open-meteo.com/v1/marine';
const OM_ARSIV = 'https://archive-api.open-meteo.com/v1/archive';

// ---------- Türkiye haritası (SVG) ----------
// TR_HARITA assets/turkiye.js dosyasından gelir (yalnızca harita kullanan sayfalarda yüklenir)
const izdusum = (lat, lon) => [(lon - TR_HARITA.lon0) * TR_HARITA.c * TR_HARITA.k, (TR_HARITA.lat0 - lat) * TR_HARITA.k];
// fill(il adı) → renk; etiket(il) → { ust, alt, ikon } (il merkezinin üstüne yazılır); ek: illerin üstüne, alt: illerin altına çizilecek katman
function haritaSvg({ fill, etiket, ek = '', alt = '', aria = 'Türkiye haritası' }) {
  const paths = Object.entries(TR_HARITA.il).map(([ad, d]) => `<path data-il="${esc(ad)}" d="${d}" style="fill:${fill ? fill(ad) : '#E6ECF1'}"/>`).join('');
  let lbl = '';
  if (etiket) for (const I of IL) {
    const e = etiket(I.ad); if (!e) continue;
    const [x, y] = izdusum(I.lat, I.lon);
    lbl += `<g class="hl-et" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${e.ikon ? `<g class="wi" transform="translate(-9 -21) scale(.28)">${e.ikon.replace('<svg class="wi" viewBox="0 0 64 64" aria-hidden="true">', '').replace('</svg>', '')}</g>` : ''}${e.ust != null ? `<text class="hl-u" y="${e.ikon ? 9 : 3}">${esc(e.ust)}</text>` : ''}${e.alt != null ? `<text class="hl-a" y="${e.ikon ? 17 : 11}">${esc(e.alt)}</text>` : ''}</g>`;
  }
  return `<svg class="trh" viewBox="0 0 ${TR_HARITA.w} ${TR_HARITA.h}" role="img" aria-label="${esc(aria)}">${alt}<g class="hl-il">${paths}</g>${ek}<g class="wi-g">${lbl}</g></svg>`;
}
// Haritanın üzerinde gezinince/dokununca il bilgisi (bilgi kutusundaki bağlantıya tıklanabilir).
// Harita yeniden çizildiğinde tekrar çağrılabilir; dinleyiciler bir kez eklenir.
function haritaBagla(kap, bilgi) {
  kap._bilgi = bilgi;
  let tip = kap.querySelector(':scope > .tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip tip-tik'; tip.hidden = true; kap.appendChild(tip); }
  if (kap._bagli) return;
  kap._bagli = true;
  const temizle = () => kap.querySelectorAll('path.on').forEach(x => x.classList.remove('on'));
  const goster = e => {
    const t = kap.querySelector(':scope > .tip');
    if (t.contains(e.target)) return;
    const p = e.target.closest('path[data-il]');
    if (!p) { if (e.type === 'pointerdown') { t.hidden = true; temizle(); } return; }
    temizle(); p.classList.add('on');
    t.innerHTML = kap._bilgi(p.dataset.il); t.hidden = false;
    const r = kap.getBoundingClientRect(), x = e.clientX - r.left + kap.scrollLeft, y = e.clientY - r.top;
    const w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = Math.max(4, Math.min(x + 14, kap.scrollLeft + kap.clientWidth - w - 4)) + 'px';
    t.style.top = (y + 16 + h > r.height ? Math.max(4, y - h - 12) : y + 16) + 'px';
  };
  kap.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') goster(e); });
  kap.addEventListener('pointerdown', goster);
  kap.addEventListener('pointerleave', e => { const t = kap.querySelector(':scope > .tip'); if (e.pointerType === 'mouse' && t) { t.hidden = true; temizle(); } });
}

// ---------- Rüzgar akışı ----------
// Haritanın üstünde rüzgarın estiği yöne akan çizgiler. İl merkezlerindeki rüzgar (vek(il) → [km/sa, geldiği yön])
// ters mesafe ağırlığıyla bütün haritaya yayılır. Harita her yeniden çizildiğinde tekrar çağrılır; vek boşsa akış durur.
function ruzgarAkisi(kap, vek) {
  if (kap._akis) { cancelAnimationFrame(kap._akis.raf); kap._akis.ro.disconnect(); kap._akis.cv.remove(); kap._akis = null; }
  const svg = kap.querySelector('svg.trh');
  if (!vek || !svg) return;
  // Hareketi azalt açıksa çizgiler akmaz, rüzgar yönünü gösteren sabit akım çizgileri bir kez çizilir
  const durgun = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = TR_HARITA.w, H = TR_HARITA.h, A = 8, GX = Math.ceil(W / A) + 1, GY = Math.ceil(H / A) + 1;
  const N = IL.map(I => {
    const v = vek(I.ad); if (!v || v[0] == null || v[1] == null) return null;
    const [x, y] = izdusum(I.lat, I.lon), a = v[1] * Math.PI / 180;
    return [x, y, -Math.sin(a) * v[0], Math.cos(a) * v[0]];
  }).filter(Boolean);
  if (!N.length) return;
  const U = new Float32Array(GX * GY), V = new Float32Array(GX * GY);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
    let su = 0, sv = 0, sw = 0;
    for (const [x, y, u, v] of N) { const w = 1 / ((x - i * A) ** 2 + (y - j * A) ** 2 + 400); su += u * w; sv += v * w; sw += w; }
    U[j * GX + i] = su / sw; V[j * GX + i] = sv / sw;
  }
  const alan = (x, y) => {
    const fx = Math.min(GX - 1.001, Math.max(0, x / A)), fy = Math.min(GY - 1.001, Math.max(0, y / A)), i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, k = j * GX + i;
    const l = F => (F[k] * (1 - a) + F[k + 1] * a) * (1 - b) + (F[k + GX] * (1 - a) + F[k + GX + 1] * a) * b;
    return [l(U), l(V)];
  };
  const yol = new Path2D();
  for (const d of Object.values(TR_HARITA.il)) yol.addPath(new Path2D(d));
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.className = 'akis'; cv.setAttribute('aria-hidden', 'true');
  kap.appendChild(cv);
  const dpr = Math.min(2, devicePixelRatio || 1);
  let olcek = 1;
  const boyut = () => {
    const r = svg.getBoundingClientRect(), k = kap.getBoundingClientRect(); olcek = r.width / W || 1;
    cv.style.cssText = `left:${r.left - k.left + kap.scrollLeft}px;top:${r.top - k.top + kap.scrollTop}px;width:${r.width}px;height:${r.height}px`;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(olcek * dpr, 0, 0, olcek * dpr, 0, 0);
    ctx.clip(yol);
    if (durgun) sabit();
  };
  const say = innerWidth < 700 ? 650 : 1300, P = [], HIZ = 0.05;
  const sabit = () => {
    ctx.lineWidth = 1.3 / olcek; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(14,40,64,.6)';
    for (let k = 0; k < 420; k++) {
      let x = Math.random() * W, y = Math.random() * H;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let n = 0; n < 20; n++) { const [u, v] = alan(x, y); x += u * HIZ * 4; y += v * HIZ * 4; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  };
  const ro = new ResizeObserver(boyut);
  boyut(); ro.observe(svg);
  if (durgun) { kap._akis = { cv, ro, raf: 0 }; return; }
  const yeni = p => { p.x = Math.random() * W; p.y = Math.random() * H; p.yas = Math.random() * 80 | 0; return p; };
  for (let i = 0; i < say; i++) P.push(yeni({}));
  const akis = { cv, ro, raf: 0 };
  kap._akis = akis;
  const kare = () => {
    if (!cv.isConnected) { ro.disconnect(); return; }
    akis.raf = requestAnimationFrame(kare);
    if (document.hidden) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.09)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.4 / olcek; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(14,40,64,.7)';
    ctx.beginPath();
    for (const p of P) {
      const [u, v] = alan(p.x, p.y), nx = p.x + u * HIZ, ny = p.y + v * HIZ;
      if (++p.yas > 90 || Math.hypot(u, v) < 0.5 || nx < 0 || ny < 0 || nx > W || ny > H) { yeni(p); p.yas = 0; continue; }
      ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
    }
    ctx.stroke();
  };
  kare();
}

// ---------- Havalimanı ölçümleri (METAR, NOAA) ----------
// data/metar.json, GitHub'da yarım saatte bir çalışan iş tarafından NOAA'dan alınır (tarayıcı NOAA'ya doğrudan erişemez)
async function havalimanlari() {
  const r = await fetch('data/metar.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('metar');
  const m = await r.json();
  const km = (a, b, c, d) => { const R = Math.PI / 180, x = (c - a) * R, y = (d - b) * R, h = Math.sin(x / 2) ** 2 + Math.cos(a * R) * Math.cos(c * R) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  for (const s of m.s) { let b = null; for (const I of IL) { const d = km(s.lat, s.lon, I.lat, I.lon); if (!b || d < b.d) b = { ad: I.ad, d }; } s.il = b && b.d < 90 ? b.ad : null; }
  return m;
}

// ---------- En yakın il ve aylık normallerin güne yayılması (NORMAL81, NASA POWER 1991–2020) ----------
const enYakinIl = p => IL.reduce((b, I) => Math.hypot(I.lat - p.lat, (I.lon - p.lon) * 0.77) < Math.hypot(b.lat - p.lat, (b.lon - p.lon) * 0.77) ? I : b, IL[0]);
const ORTA = [15, 45, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]; // ayların ortasının yılın kaçıncı günü olduğu
const yilGunu = d => Math.floor((Date.parse(d + 'T12:00:00Z') - Date.parse(d.slice(0, 4) + '-01-01T12:00:00Z')) / 864e5);
// Aylık bir dizi değeri, ayların ortası arasında doğrusal geçişle istenen güne yayar
function gunlukNormal(dizi, d) {
  const g = yilGunu(d);
  let i = ORTA.findIndex(x => x > g); if (i < 0) i = 12;
  const a = (i + 11) % 12, b = i % 12, ga = i === 0 ? ORTA[11] - 365 : ORTA[a], gb = i === 12 ? ORTA[0] + 365 : ORTA[b];
  return dizi[a] + (dizi[b] - dizi[a]) * (g - ga) / (gb - ga);
}

// ---------- İklim sınıflandırmaları (İklim ve Analizler sayfaları) ----------
// Köppen-Geiger: aylık ortalama sıcaklık (t) ve yağıştan (y)
function koppen(t, y) {
  const Ty = avgOf(t), Py = sumOf(y), sicak = Math.max(...t), soguk = Math.min(...t);
  const yaz = [3, 4, 5, 6, 7, 8], kis = [9, 10, 11, 0, 1, 2], Ps = sumOf(yaz.map(i => y[i])), Pk = sumOf(kis.map(i => y[i]));
  const esik = Ps >= 0.7 * Py ? 20 * Ty + 280 : Pk >= 0.7 * Py ? 20 * Ty : 20 * Ty + 140;
  if (Py < esik) return (Py < esik / 2 ? 'BW' : 'BS') + (Ty >= 18 ? 'h' : 'k');
  if (soguk >= 18) return 'A';
  if (sicak < 10) return 'ET';
  const ana = soguk > 0 ? 'C' : 'D';
  const yazMin = Math.min(...yaz.map(i => y[i])), yazMax = Math.max(...yaz.map(i => y[i])), kisMin = Math.min(...kis.map(i => y[i])), kisMax = Math.max(...kis.map(i => y[i]));
  const ikinci = yazMin < 40 && yazMin < kisMax / 3 ? 's' : kisMin < yazMax / 10 ? 'w' : 'f';
  const ust10 = t.filter(x => x >= 10).length;
  const ucuncu = sicak >= 22 ? 'a' : ust10 >= 4 ? 'b' : soguk < -38 ? 'd' : 'c';
  return ana + ikinci + ucuncu;
}
const KOPPEN = {
  Csa: ['Akdeniz iklimi, sıcak ve kurak yaz', '#F2D21B'], Csb: ['Akdeniz iklimi, ılık ve kurak yaz', '#C6C700'], Cfa: ['Nemli ılıman, sıcak yaz', '#B7E35B'], Cfb: ['Okyanusal, her mevsim yağışlı', '#5DBB3F'],
  Cwa: ['Ilıman, kurak kış', '#96FF96'], Dsa: ['Karasal, sıcak ve kurak yaz', '#E05FD4'], Dsb: ['Karasal, ılık ve kurak yaz', '#B04AB5'], Dsc: ['Karasal, serin ve kurak yaz', '#7E3A8E'],
  Dfa: ['Nemli karasal, sıcak yaz', '#3FC9D9'], Dfb: ['Nemli karasal, ılık yaz', '#3A9BDC'], Dfc: ['Soğuk karasal (subarktik)', '#1F6E9A'], BSk: ['Soğuk yarı kurak (bozkır)', '#F2B864'],
  BSh: ['Sıcak yarı kurak', '#E08A2E'], BWk: ['Soğuk çöl', '#F28B82'], BWh: ['Sıcak çöl', '#D9453A'], ET: ['Tundra', '#B5B5B5']
};
const kAd = k => (KOPPEN[k] || [k])[0], kRenk = k => (KOPPEN[k] || [0, '#CCCCCC'])[1];
const deMartonne = (t, y) => sumOf(y) / (avgOf(t) + 10);
const dmAd = i => i < 10 ? 'Kurak' : i < 20 ? 'Yarı kurak' : i < 24 ? 'Akdeniz tipi' : i < 28 ? 'Yarı nemli' : i < 35 ? 'Nemli' : i < 55 ? 'Çok nemli' : 'Islak';
const erinc = (mx, y) => sumOf(y) / avgOf(mx);
const erAd = i => i < 8 ? 'Tam kurak' : i < 23 ? 'Kurak' : i < 40 ? 'Yarı kurak' : i < 55 ? 'Yarı nemli' : i < 70 ? 'Nemli' : 'Çok nemli';
// ABD Tarım Bakanlığı soğuğa dayanıklılık bölgesi (ortalama yıllık en düşük sıcaklıktan)
const usda = c => { const f = c * 1.8 + 32, z = Math.floor((f + 60) / 10) + 1, a = ((f + 60) % 10 + 10) % 10 < 5 ? 'a' : 'b'; return z + a; };
const USDA = [[-25, '#3A4BA8'], [-20, '#4F7FD6'], [-15, '#6FB3E8'], [-10, '#9BD8C9'], [-5, '#C9E8A0'], [0, '#F2E27A'], [5, '#F2B45A']], usdaRenk = rampa(USDA);

// ---------- Sıralanabilir tablo ----------
// kolonlar: [{ b: başlık, v: satır → sıralama değeri, h: satır → hücre HTML, l: sola yaslı }]
function siraliTablo(kap, kolonlar, satirlar, ilkSira = 0, azalan = false) {
  let k = ilkSira, desc = azalan;
  const ciz = () => {
    const s = satirlar.slice().sort((a, b) => {
      const x = kolonlar[k].v(a), y = kolonlar[k].v(b);
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'string' ? trSort(x, y) : x - y) * (desc ? -1 : 1);
    });
    kap.innerHTML = `<table class="srt"><thead><tr>${kolonlar.map((c, i) => `<th class="${c.l ? 'l' : ''}" aria-sort="${i === k ? (desc ? 'descending' : 'ascending') : 'none'}"><button type="button" data-k="${i}">${c.b}${i === k ? (desc ? ' ▾' : ' ▴') : ''}</button></th>`).join('')}</tr></thead>
      <tbody>${s.map(r => `<tr>${kolonlar.map(c => `<td class="${c.l ? 'l' : ''}">${c.h(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
  kap.addEventListener('click', e => { const b = e.target.closest('th button'); if (!b) return; const i = +b.dataset.k; if (i === k) desc = !desc; else { k = i; desc = typeof kolonlar[i].v(satirlar[0]) !== 'string'; } ciz(); });
  ciz();
}

// ---------- Sekmeler ----------
function sekmeler(kap, adlar, onSec, ilk = 0) {
  kap.innerHTML = adlar.map((a, i) => `<button type="button" role="tab" aria-selected="${i === ilk}" data-i="${i}">${a}</button>`).join('');
  kap.setAttribute('role', 'tablist');
  kap.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    kap.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    onSec(+b.dataset.i);
  });
  onSec(ilk);
}

// ---------- Basit çizgi/çubuk grafik (küçük çoklu grafikler) ----------
// seriler: [{ ad, renk, v: [...], tur: 'cizgi'|'cubuk'|'alan', bant: [[alt, üst], ...] }]; x: etiket dizisi
function seritGrafik({ x, seriler, yukseklik = 120, birim = '', genislik = null, adim = null, ayrac = null, sifir = false, etiketAdim = 1, etiketSec = null, xEtiket = v => v }) {
  const n = x.length, W = adim ? adim * n + 50 : (genislik || 720), L = 40, R = 10, T = 12, B = 22, H = yukseklik;
  const tum = seriler.flatMap(s => [...s.v, ...(s.bant ? s.bant.flat() : [])]).filter(v => v != null);
  let lo = Math.min(...tum), hi = Math.max(...tum);
  if (sifir) lo = Math.min(0, lo);
  if (hi === lo) { hi += 1; lo -= sifir ? 0 : 1; }
  const pad = (hi - lo) * 0.08; if (!sifir) lo -= pad; hi += pad;
  const sx = i => L + (i + 0.5) * (W - L - R) / n, sy = v => T + (hi - v) / (hi - lo) * (H - T - B), bw = Math.max(2, (W - L - R) / n - 2);
  const ticks = []; { const st = Math.pow(10, Math.floor(Math.log10((hi - lo) / 3))); const m = [1, 2, 5, 10].find(f => (hi - lo) / (st * f) <= 5) * st; for (let v = Math.ceil(lo / m) * m; v <= hi; v += m) ticks.push(+v.toFixed(6)); }
  let g = ticks.map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/><text x="${L - 6}" y="${(sy(v) + 4).toFixed(1)}" text-anchor="end">${dec(v, Math.abs(v) < 10 && v % 1 ? 1 : 0)}</text>`).join('');
  if (ayrac) x.forEach((v, i) => { if (i && ayrac(i)) g += `<line class="grid gun" x1="${(L + i * (W - L - R) / n).toFixed(1)}" x2="${(L + i * (W - L - R) / n).toFixed(1)}" y1="${T}" y2="${H - B}"/>`; });
  x.forEach((v, i) => { if (etiketSec ? etiketSec(v, i) : i % etiketAdim === 0) g += `<text x="${sx(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(xEtiket(v, i))}</text>`; });
  for (const s of seriler) {
    if (s.bant) {
      const up = s.bant.map((b, i) => b && b[1] != null ? `${sx(i).toFixed(1)} ${sy(b[1]).toFixed(1)}` : null).filter(Boolean);
      const dn = s.bant.map((b, i) => b && b[0] != null ? `${sx(i).toFixed(1)} ${sy(b[0]).toFixed(1)}` : null).filter(Boolean).reverse();
      if (up.length) g += `<path d="M${up.join('L')}L${dn.join('L')}Z" style="fill:${s.renk}" opacity=".18"/>`;
    }
    if (s.tur === 'cubuk') s.v.forEach((v, i) => { if (v == null || v === 0) return; const y0 = sy(Math.max(lo, 0)), y1 = sy(v); g += `<rect x="${(sx(i) - bw / 2).toFixed(1)}" y="${Math.min(y0, y1).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Math.abs(y0 - y1)).toFixed(1)}" rx="1.5" style="fill:${s.renk}"/>`; });
    else {
      let d = '', on = false;
      s.v.forEach((v, i) => { if (v == null) { on = false; return; } d += `${on ? 'L' : 'M'}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`; on = true; });
      if (s.tur === 'alan' && d) g += `<path d="${d}L${sx(n - 1).toFixed(1)} ${sy(Math.max(lo, 0)).toFixed(1)}L${sx(0).toFixed(1)} ${sy(Math.max(lo, 0)).toFixed(1)}Z" style="fill:${s.renk}" opacity=".22"/>`;
      g += `<path d="${d}" style="fill:none;stroke:${s.renk}" stroke-width="${s.kalin || 2}" stroke-linejoin="round" stroke-linecap="round"${s.kesik ? ' stroke-dasharray="4 3"' : ''}/>`;
    }
  }
  return { svg: `<svg class="chart sg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(seriler.map(s => s.ad).join(', '))} grafiği">${g}<text class="birim" x="${L - 6}" y="${T - 2}" text-anchor="end">${esc(birim)}</text><line class="hl" x1="0" x2="0" y1="${T}" y2="${H - B}" style="display:none"/></svg>`, sx, n, L, R, W };
}
// Grafik üzerinde gezinince ilgili sütunun değerlerini göster
function grafikIpucu(kap, geo, icerik) {
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; kap.appendChild(tip);
  const svg = kap.querySelector('svg'), hl = svg.querySelector('.hl');
  const goster = e => {
    const r = svg.getBoundingClientRect(), i = Math.floor((e.clientX - r.left - geo.L) / ((geo.W - geo.L - geo.R) / geo.n));
    if (i < 0 || i >= geo.n) { tip.hidden = true; hl.style.display = 'none'; return; }
    const x = geo.sx(i); hl.setAttribute('x1', x); hl.setAttribute('x2', x); hl.style.display = '';
    tip.innerHTML = icerik(i); tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = (x + 14 + w > svg.clientWidth ? x - 14 - w : x + 14) + (svg.offsetLeft || 0) + 'px';
    tip.style.top = '8px';
  };
  svg.addEventListener('pointermove', goster); svg.addEventListener('pointerdown', goster);
  svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { tip.hidden = true; hl.style.display = 'none'; } });
}

// ---------- Durum mesajı ----------
const yukleniyor = (msg = 'Yükleniyor…') => `<p class="muted yuk">${esc(msg)}</p>`;
const hataMsg = (msg = 'Veri şu an alınamadı. İnternet bağlantını kontrol edip sayfayı yenile.') => `<p class="hata" role="alert">${esc(msg)}</p>`;

// ---------- Sayfa açılışı ----------
kurUst();
// Uygulama olarak yükleme ve internetsiz açılış için sayfa dosyalarını önbelleğe alan servis çalışanı
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
