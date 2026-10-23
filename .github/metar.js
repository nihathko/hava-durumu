// Türkiye havalimanlarının son ölçümleri (METAR) ve tahminleri (TAF), NOAA Aviation Weather Center.
// GitHub Actions bu betiği yarım saatte bir çalıştırır; tarayıcı NOAA'ya doğrudan erişemediği için
// veri sitenin kendi adresinden (data/metar.json) sunulur. Kaynak veri ABD kamu malıdır.
const fs = require('fs');
const oku = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return []; } };
const metar = oku('data/metar-ham.json'), taf = oku('data/taf-ham.json'), sigmet = oku('data/sigmet-ham.json'), dunya = oku('data/dunya-ham.json');

const ADLAR = {
  LTFM: 'İstanbul Havalimanı', LTFJ: 'İstanbul Sabiha Gökçen', LTBA: 'İstanbul Atatürk', LTAC: 'Ankara Esenboğa', LTBJ: 'İzmir Adnan Menderes',
  LTAI: 'Antalya', LTFE: 'Milas-Bodrum', LTBS: 'Dalaman', LTFG: 'Gazipaşa-Alanya', LTDB: 'Çukurova (Mersin-Adana)', LTAJ: 'Gaziantep',
  LTCG: 'Trabzon', LTFO: 'Rize-Artvin', LTFH: 'Samsun Çarşamba', LTCE: 'Erzurum', LTCI: 'Van Ferit Melen', LTCC: 'Diyarbakır', LTAU: 'Kayseri',
  LTAN: 'Konya', LTAT: 'Malatya', LTCA: 'Elazığ', LTAR: 'Sivas Nuri Demirağ', LTAZ: 'Nevşehir Kapadokya', LTBR: 'Bursa Yenişehir',
  LTBY: 'Eskişehir Hasan Polatkan', LTBH: 'Çanakkale', LTFK: 'Gökçeada', LTBU: 'Tekirdağ Çorlu', LTFD: 'Balıkesir Koca Seyit', LTBF: 'Balıkesir Merkez',
  LTBO: 'Uşak', LTAY: 'Denizli Çardak', LTFC: 'Isparta Süleyman Demirel', LTBD: 'Aydın Çıldır', LTFB: 'İzmir Selçuk-Efes', LTAL: 'Kastamonu',
  LTAS: 'Zonguldak Çaycuma', LTAP: 'Amasya Merzifon', LTAW: 'Tokat', LTCD: 'Erzincan Yıldırım Akbulut', LTCF: 'Kars Harakani', LTCO: 'Ağrı Ahmed-i Hani',
  LTCT: 'Iğdır Şehit Bülent Aydın', LTCK: 'Muş Sultan Alparslan', LTCJ: 'Batman', LTCL: 'Siirt', LTCV: 'Şırnak Şerafettin Elçi', LTCW: 'Hakkari Yüksekova Selahaddin Eyyubi',
  LTCR: 'Mardin Prof. Dr. Aziz Sancar', LTCS: 'Şanlıurfa GAP', LTCP: 'Adıyaman', LTCN: 'Kahramanmaraş', LTDA: 'Hatay', LTBQ: 'Kocaeli Cengiz Topel'
};
const ORTUS = { SKC: 'Açık', CLR: 'Açık', CAVOK: 'Açık', NSC: 'Önemli bulut yok', NCD: 'Bulut yok', FEW: 'Az bulutlu', SCT: 'Parçalı bulutlu', BKN: 'Çok bulutlu', OVC: 'Kapalı', VV: 'Gökyüzü görünmüyor' };
const HADISE = [
  [/TS/, 'Gök gürültülü'], [/FZ/, 'Donan'], [/SH/, 'Sağanak'], [/DZ/, 'Çisenti'], [/RA/, 'Yağmur'], [/SN/, 'Kar'], [/SG/, 'Kar taneleri'], [/GR|GS/, 'Dolu'],
  [/PL/, 'Buz taneleri'], [/BR/, 'Pus'], [/FG/, 'Sis'], [/HZ/, 'Pus (kuru)'], [/FU/, 'Duman'], [/DU|SA/, 'Toz'], [/SQ/, 'Bora'], [/VC/, 'Yakında']
];
const hadise = w => { if (!w) return null; const p = HADISE.filter(([r]) => r.test(w)).map(x => x[1]); const s = p.join(' ').trim(); return s ? (w.startsWith('-') ? 'Hafif ' + s.toLocaleLowerCase('tr') : w.startsWith('+') ? 'Kuvvetli ' + s.toLocaleLowerCase('tr') : s) : w; };
const nem = (t, td) => t == null || td == null ? null : Math.round(100 * Math.exp(17.625 * td / (243.04 + td)) / Math.exp(17.625 * t / (243.04 + t)));
const kt = v => (v == null || v === 'VRB' ? null : Math.round(v * 1.852));
const gorus = v => { if (v == null) return null; if (typeof v === 'string' && v.includes('+')) return 10; const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n * 1.609 * 10) / 10 : null; };

const tafBy = {};
for (const t of taf) if (/^LT/.test(t.icaoId)) tafBy[t.icaoId] = t.rawTAF || t.rawOb || null;

const s = metar.filter(x => /^LT/.test(x.icaoId) && x.lat && x.lon).map(x => ({
  id: x.icaoId,
  ad: ADLAR[x.icaoId] || (x.name || x.icaoId).replace(/,.*$/, ''),
  lat: x.lat, lon: x.lon, rakim: x.elev,
  saat: x.obsTime ? new Date(x.obsTime * 1000).toISOString() : x.reportTime,
  t: x.temp ?? null, td: x.dewp ?? null, nem: nem(x.temp, x.dewp),
  ry: typeof x.wdir === 'number' ? x.wdir : null, degisken: x.wdir === 'VRB', r: kt(x.wspd), h: kt(x.wgst),
  gorus: gorus(x.visib), p: x.altim ?? null,
  hadise: hadise(x.wxString),
  bulut: (x.clouds || []).map(c => ({ ortus: ORTUS[c.cover] || c.cover, taban: c.base != null ? Math.round(c.base * 0.3048 / 10) * 10 : null })),
  kat: x.fltCat || null,
  ham: x.rawOb, taf: tafBy[x.icaoId] || null
})).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));

// Türkiye uçuş bölgeleri (Ankara LTAA, İstanbul LTBB) için geçerli SIGMET uyarıları
const TEHLIKE = { TS: 'Gök gürültülü fırtına', TURB: 'Türbülans', ICE: 'Buzlanma', MTW: 'Dağ dalgası', VA: 'Volkanik kül', TC: 'Tropik siklon', DS: 'Toz fırtınası', SS: 'Kum fırtınası', RDOACT: 'Radyoaktif bulut', CONVECTIVE: 'Konvektif hava' };
const sig = sigmet.filter(x => /^(LTAA|LTBB)/.test(x.firId || '')).map(x => ({
  fir: x.firId === 'LTBB' ? 'İstanbul' : 'Ankara', tehlike: TEHLIKE[x.hazard] || x.hazard, nitelik: x.qualifier || '', alt: Number.isFinite(+x.base) ? +x.base : null, ust: Number.isFinite(+x.top) ? +x.top : null,
  bas: x.validTimeFrom ? new Date(x.validTimeFrom * 1000).toISOString() : null, bit: x.validTimeTo ? new Date(x.validTimeTo * 1000).toISOString() : null,
  ham: x.rawSigmet || '', alan: (x.coords || []).map(c => [c.lat, c.lon])
}));
// Dünya şehirlerinin havalimanı ölçümleri
const dun = Object.fromEntries(dunya.filter(x => x.icaoId).map(x => [x.icaoId, { t: x.temp ?? null, nem: nem(x.temp, x.dewp), r: kt(x.wspd), saat: x.obsTime ? new Date(x.obsTime * 1000).toISOString() : null, hadise: hadise(x.wxString) }]));

fs.writeFileSync('data/metar.json', JSON.stringify({ t: new Date().toISOString(), kaynak: 'NOAA Aviation Weather Center (aviationweather.gov)', s, sigmet: sig, dunya: dun }));
console.log(`${s.length} havalimanı, ${sig.length} SIGMET, ${Object.keys(dun).length} dünya ölçümü yazıldı`);
