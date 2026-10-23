// Alt sayfaları ortak iskeletten üretir. Site klasöründe çalıştır: node .github/araclar/sayfa-uret.js .
const fs = require('fs'), path = require('path');
const KOK = process.argv[2];
const NOT_ORTAK = '<li><a href="hakkinda.html#gizlilik">Gizlilik ve kullanım</a>, <a href="hakkinda.html#kaynaklar">veri kaynakları ve lisanslar</a>. Tahminler yaklaşık değerlerdir; can ve mal güvenliği için <a href="https://www.mgm.gov.tr/" target="_blank" rel="noopener">MGM</a>\'nin resmi uyarılarını takip edin.</li>';

const sayfa = s => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${s.baslik} · Hava Durumu</title>
<meta name="description" content="${s.aciklama}">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="theme-color" content="#11141A">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="Hava Durumu">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<script>
  // Seçilen tema sayfa çizilmeden uygulanır
  try { const t = JSON.parse(localStorage.getItem('hava.tema')); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {}
</script>
${s.basEk || ''}<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<div class="scene" id="scene" data-k="clear" data-d="1" aria-hidden="true">
  <div class="stars"></div><div class="sun"></div><div class="moon"></div>
  <div class="clouds c2"></div><div class="clouds c1"></div>
  <div class="fog"></div><div class="rain"></div><div class="snow"></div><div class="flash"></div>
</div>

<main>
  <div class="skyarea"><div class="wrap">
    <div class="top">
      <div id="ust"></div>
      <nav class="nav" id="nav" aria-label="Site bölümleri"></nav>
      ${s.yer ? '<div class="yerkutu" id="yer"></div>' : ''}
    </div>
    <section class="sayfa" aria-labelledby="h-sayfa">
      <h1 id="h-sayfa">${s.h1}</h1>
      <p class="giris" id="giris">${s.giris}</p>
      <dl class="kisa" id="kisa"></dl>
    </section>
  </div></div>
  <div class="sheet"><div class="wrap">
    <div id="details">
${s.govde}
    </div>
    <footer class="notes">
      <ul>
${(s.notlar || []).map(n => `        <li>${n}</li>`).join('\n')}
        ${NOT_ORTAK}
      </ul>
    </footer>
  </div></div>
</main>

<script src="assets/ililce.js"></script>
${s.harita ? '<script src="assets/turkiye.js"></script>\n' : ''}${s.sonEk || ''}<script src="assets/ortak.js"></script>
<script src="assets/${s.js}.js"></script>
</body>
</html>
`;

const SAYFALAR = {
  harita: {
    baslik: 'Türkiye haritası', js: 'harita', harita: true,
    aciklama: '81 ilin şu anki hava durumu ve 5 günlük haritalı tahmini, havalimanı ölçümleri, en sıcak ve en soğuk iller.',
    h1: 'Türkiye haritası',
    giris: '81 ilin şu anki hava durumu ve önümüzdeki 5 gün. Haritada sıcaklık, yağış ya da rüzgarı seç; "Şimdi" görünümünde 54 havalimanının gerçek ölçümlerini de açabilirsin.',
    govde: `      <section class="sec" aria-labelledby="h-h">
        <h2 id="h-h">Harita</h2>
        <p class="note" id="hnot"></p>
        <div class="tabs" id="zaman" aria-label="Gün"></div>
        <div class="tabs" id="katman" aria-label="Harita katmanı"></div>
        <div class="trh-wrap" id="harita"></div>
        <div id="lj"></div>
      </section>
      <section class="sec" aria-labelledby="h-s">
        <h2 id="h-s">Sıralamalar</h2>
        <p class="note" id="snot"></p>
        <div class="siralar" id="siralar"></div>
      </section>
      <section class="sec" aria-labelledby="h-t">
        <h2 id="h-t">81 il</h2>
        <p class="note">Sütun başlığına dokunarak sırala. İl adına dokununca o ilin ayrıntılı tahmini açılır.</p>
        <div class="tbl-wrap" id="tablo"></div>
      </section>`,
    notlar: ['İllerin değerleri il merkezine ait model tahminidir (Open-Meteo). Havalimanı ölçümleri gerçek gözlemdir (NOAA, METAR) ve yarım saatte bir güncellenir.',
      'Harita sınırları: geoBoundaries, © OpenStreetMap katkıcıları (ODbL).']
  },
  radar: {
    baslik: 'Radar ve uydu', js: 'radar',
    basEk: '<link rel="stylesheet" href="assets/leaflet/leaflet.css">\n', sonEk: '<script src="assets/leaflet/leaflet.js"></script>\n',
    aciklama: 'Son iki saatin yağış radarı ve kısa süreli radar tahmini, NASA uydu görüntüleri ve uydudan tespit edilen yangın noktaları.',
    h1: 'Radar ve uydu',
    giris: 'Yağış radarı son iki saati ve önümüzdeki dakikaları gösterir. Uydu katmanında NASA\'nın günlük gerçek renkli görüntüsü ve uydudan görülen yangın, ısı noktaları var.',
    govde: `      <section class="sec" aria-labelledby="h-r">
        <h2 id="h-r">Harita</h2>
        <p class="note" id="rnot"></p>
        <div class="tabs" id="rkat" aria-label="Katman"></div>
        <div class="lharita" id="lmap" role="region" aria-label="Radar ve uydu haritası"></div>
        <div class="oynat" id="oynat">
          <button class="btn" id="oy" type="button">Oynat</button>
          <input type="range" id="kare" min="0" max="0" value="0" aria-label="Radar zamanı">
          <span class="zaman" id="zmn"></span>
        </div>
      </section>
      <section class="sec" aria-labelledby="h-ro">
        <h2 id="h-ro">Nasıl okunur</h2>
        <div class="ikili">
          <div><h3>Radar</h3><ul class="duz">
            <li>Renkler yağışın şiddetini gösterir: açık mavi hafif, sarı ve turuncu kuvvetli, kırmızı ve mor çok kuvvetli (dolu olabilir).</li>
            <li>Oynat düğmesi son iki saatin hareketini ve kısa süreli radar tahminini sırayla gösterir; yağışın nereye ilerlediğini buradan görebilirsin.</li>
            <li>Radar kapsamı her bölgede aynı değildir. Radar görmeyen bir yerde yağış olmasına rağmen ekranda renk çıkmayabilir.</li>
          </ul></div>
          <div><h3>Uydu</h3><ul class="duz">
            <li>Gerçek renkli görüntü uydunun gündüz geçişinde çekilir; günde bir kez yenilenir. Beyaz alanlar bulut ya da kar örtüsüdür.</li>
            <li>Yangın ve ısı noktaları son 24 saatte uydunun tespit ettiği sıcak noktalardır; orman yangını dışında sanayi bacaları da görünebilir.</li>
            <li>Görüntü tarihi haritanın altında yazar.</li>
          </ul></div>
        </div>
      </section>`,
    notlar: ['Radar: <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a> (Weather data by RainViewer). Uydu ve yangın noktaları: NASA GIBS, EOSDIS. Harita altlığı: © OpenStreetMap katkıcıları.']
  },
  grafik: {
    baslik: 'Grafik ve modeller', js: 'grafik', yer: true,
    aciklama: '10 günlük saatlik grafik (meteogram), farklı ülkelerin hava modellerinin karşılaştırması, MET Norway tahmini ve belirsizlik bandı.',
    h1: 'Grafik ve modeller',
    giris: 'Seçtiğin yer için 10 günü saat saat gösteren grafikler, beş farklı hava modelinin ve MET Norway\'in tahmini yan yana, ve tahminin ne kadar kesin olduğunu gösteren belirsizlik bandı.',
    govde: `      <section class="sec" aria-labelledby="h-m">
        <h2 id="h-m">10 günlük ayrıntılı grafik</h2>
        <p class="note">Tüm grafikler aynı saat eksenini kullanır; yana kaydırılabilir. Üzerine gelince ya da dokununca o saatin değerleri çıkar.</p>
        <div id="mg"></div>
      </section>
      <section class="sec" aria-labelledby="h-mod">
        <h2 id="h-mod">Modeller ne diyor?</h2>
        <p class="note">Hava tahminleri bilgisayar modelleriyle yapılır. Burada farklı ülkelerin meteoroloji kurumlarının modelleri ve bağımsız bir kaynak olarak MET Norway aynı yer için yan yana. Modeller birbirine yakınsa tahmin daha güvenilirdir.</p>
        <div id="mod"></div>
      </section>
      <section class="sec" aria-labelledby="h-ens">
        <h2 id="h-ens">Tahmin ne kadar kesin?</h2>
        <p class="note">Topluluk (ensemble) tahmini: aynı model, başlangıç değerleri biraz değiştirilerek onlarca kez çalıştırılır. Bant ne kadar genişse tahmin o kadar belirsizdir.</p>
        <div id="ens"></div>
      </section>`,
    notlar: ['Modeller: ECMWF IFS (Avrupa), ICON (Almanya, DWD), GFS (ABD, NOAA), ARPEGE (Fransa, Météo-France), UKMO (Birleşik Krallık, Met Office), Open-Meteo üzerinden. Bağımsız tahmin: <a href="https://api.met.no/" target="_blank" rel="noopener">MET Norway</a> (CC BY 4.0).',
      'Topluluk tahmini: DWD ICON-EPS ve ECMWF ENS, Open-Meteo Ensemble API.']
  },
  iklim: {
    baslik: 'İklim', js: 'iklim', yer: true,
    aciklama: '1991–2020 aylık iklim değerleri ve rekorlar, son 30 günün normalden farkı, son 3 ayın yağışı ve 2050\'ye kadar iklim projeksiyonu.',
    h1: 'İklim',
    giris: 'Seçtiğin yerin 30 yıllık iklimi: aylık ortalamalar, rekor sıcaklıklar, yağış. Ayrıca son günlerin normalden ne kadar farklı olduğu ve iklim modellerine göre 2050\'ye kadar beklenen değişim.',
    govde: `      <section class="sec" aria-labelledby="h-ay">
        <h2 id="h-ay">Aylık iklim değerleri, 1991–2020</h2>
        <p class="note" id="aynot">30 yıllık günlük veriden hesaplanır. İlk açılışta veri birkaç saniyede iner, sonra cihazında saklanır.</p>
        <div id="ay"></div>
      </section>
      <section class="sec" aria-labelledby="h-son">
        <h2 id="h-son">Son 30 gün normalden ne kadar farklı?</h2>
        <p class="note">Her günün ortalama sıcaklığı, 1991–2020'de aynı tarihin ortalamasıyla karşılaştırılır. Kırmızı çubuk normalden sıcak, mavi çubuk normalden soğuk.</p>
        <div id="son"></div>
      </section>
      <section class="sec" aria-labelledby="h-yil">
        <h2 id="h-yil">Son 3 ayın yağışı</h2>
        <p class="note">Son 3 ayda düşen toplam yağış ile 1991–2020 normalinde aynı dönemde düşen yağışın karşılaştırması. Basit bir kuraklık göstergesidir.</p>
        <div id="yil"></div>
      </section>
      <section class="sec" aria-labelledby="h-gel">
        <h2 id="h-gel">Gelecekte iklim</h2>
        <p class="note">İklim modellerinin (CMIP6, yüksek çözünürlüklü HighResMIP) bu bölge için 2050'ye kadar öngördüğü yıllık ortalama sıcaklık. Tek tek yılların değil, eğilimin önemli olduğu bir projeksiyondur.</p>
        <div id="gel"></div>
      </section>`,
    notlar: ['Geçmiş veriler: ECMWF ERA5 yeniden analiz (Open-Meteo Archive). Yaklaşık 25 km\'lik ızgaraya aittir; MGM istasyon ölçümlerinden farklı olabilir.',
      'İklim projeksiyonu: CMIP6 HighResMIP modelleri (Open-Meteo Climate API).']
  },
  deniz: {
    baslik: 'Denizcilik', js: 'deniz', harita: true,
    aciklama: 'Karadeniz, Marmara, Ege ve Akdeniz kıyılarında dalga yüksekliği, dalga yönü ve periyodu, deniz suyu sıcaklığı ve kıyı rüzgarı.',
    h1: 'Denizcilik',
    giris: 'Kıyılarımızda dalga yüksekliği, deniz suyu sıcaklığı ve rüzgar. Bir noktaya dokununca o noktanın 5 günlük dalga ve rüzgar tahmini açılır.',
    govde: `      <section class="sec" aria-labelledby="h-dh">
        <h2 id="h-dh">Kıyılar</h2>
        <p class="note" id="dnot"></p>
        <div class="tabs" id="dkat" aria-label="Harita katmanı"></div>
        <div class="trh-wrap" id="dharita"></div>
        <div id="dlj"></div>
      </section>
      <section class="sec" aria-labelledby="h-dn">
        <h2 id="h-dn">Seçili nokta</h2>
        <p class="note" id="dsec"></p>
        <div id="dnok"></div>
      </section>
      <section class="sec" aria-labelledby="h-dt">
        <h2 id="h-dt">Tüm noktalar</h2>
        <p class="note">Deniz durumu dalga yüksekliğine göre (Douglas ölçeği), rüzgar Beaufort ölçeğine göre adlandırılır.</p>
        <div class="tbl-wrap" id="dtablo"></div>
      </section>`,
    notlar: ['Dalga ve deniz suyu sıcaklığı: Open-Meteo Marine API (ECMWF WAM, DWD, Copernicus Marine). Rüzgar: Open-Meteo.',
      'Bu bilgiler seyir için resmi kaynak değildir. Denizde can güvenliği için <a href="https://pirireis.mgm.gov.tr" target="_blank" rel="noopener">MGM Denizcilik</a> ve Kıyı Emniyeti duyurularını takip edin.']
  },
  ziraat: {
    baslik: 'Ziraat', js: 'ziraat', harita: true, yer: true,
    aciklama: 'Zirai don uyarısı, toprak sıcaklığı ve nemi, buharlaşma ve sulama ihtiyacı, ilaçlama için uygun saatler, büyüme derece-gün ve akarsu debisi.',
    h1: 'Ziraat',
    giris: 'Çiftçi için: önümüzdeki 7 günde don beklenen iller, seçtiğin yerin toprak sıcaklığı ve nemi, sulama ihtiyacı, ilaçlama için uygun saatler ve akarsu debisi.',
    govde: `      <section class="sec" aria-labelledby="h-don">
        <h2 id="h-don">Zirai don uyarısı, 7 gün</h2>
        <p class="note">Harita, her ilin önümüzdeki 7 gündeki en düşük sıcaklığını gösterir. 0°C ve altı don, −2°C ve altı kuvvetli don demektir; çiçeklenme ve fide dönemindeki ürünlere zarar verebilir.</p>
        <div class="trh-wrap" id="donh"></div>
        <div id="donlj"></div>
        <div class="siralar" id="donl" style="margin-top:22px"></div>
      </section>
      <section class="sec" aria-labelledby="h-tp">
        <h2 id="h-tp">Toprak</h2>
        <p class="note" id="tpnot">Seçili yer için toprak sıcaklığı ve nemi, katman katman.</p>
        <div id="toprak"></div>
      </section>
      <section class="sec" aria-labelledby="h-su">
        <h2 id="h-su">Buharlaşma ve sulama ihtiyacı</h2>
        <p class="note">Referans buharlaşma (ET₀), kısa ve sağlıklı bir çim örtüsünün bir günde kaybettiği su miktarıdır. Yağış bunun altında kalıyorsa bitki sulama ister.</p>
        <div id="su"></div>
      </section>
      <section class="sec" aria-labelledby="h-il">
        <h2 id="h-il">İlaçlama ve püskürtme için uygun saatler</h2>
        <p class="note">Önümüzdeki 48 saat. Uygun saat: rüzgar 3–15 km/sa, yağış yok ve sonraki 2 saatte yağış ihtimali düşük, sıcaklık 8–28°C, nem %40'ın üstünde.</p>
        <div id="ilac"></div>
      </section>
      <section class="sec" aria-labelledby="h-gdd">
        <h2 id="h-gdd">Büyüme derece-gün</h2>
        <p class="note">Bitkilerin gelişimi için biriken sıcaklık. Her gün için (en yüksek + en düşük) / 2 − 10°C hesaplanır, eksi değerler sıfır sayılır. Mısır, pamuk ve sebzelerde ekim ve hasat zamanını kestirmek için kullanılır.</p>
        <div id="gdd"></div>
      </section>
      <section class="sec" aria-labelledby="h-ak">
        <h2 id="h-ak">Akarsu debisi</h2>
        <p class="note">Seçili yere en yakın akarsu hücresinin günlük debisi (m³/sn), Copernicus GloFAS taşkın modelinden. Küçük dereler için geçerli değildir; eğilimi gösterir.</p>
        <div id="akarsu"></div>
      </section>`,
    notlar: ['Toprak, buharlaşma (FAO-56 Penman-Monteith) ve tahminler: Open-Meteo. Akarsu debisi: Copernicus GloFAS (Open-Meteo Flood API).',
      'Resmi tarımsal tahmin ve zirai don uyarıları için <a href="https://tarim.mgm.gov.tr/" target="_blank" rel="noopener">MGM Tarımsal Meteoroloji</a>.']
  },
  ozel: {
    baslik: 'Özel tahminler', js: 'ozel', harita: true,
    aciklama: 'Kayak merkezleri, toz taşınımı, havalimanı ölçümleri ve tahminleri, son depremler, uzay havası ve dünya şehirleri.',
    h1: 'Özel tahminler',
    giris: 'Kayak merkezlerinde kar, Afrika\'dan gelen toz, havalimanlarının gerçek ölçümleri, son depremler, kutup ışığı ihtimali ve dünya şehirleri.',
    govde: `      <section class="sec" id="kayak-b" aria-labelledby="h-ky">
        <h2 id="h-ky">Kayak merkezleri</h2>
        <p class="note">Tahminler pistin ortalama yüksekliğine göre düzeltilir. Kar kalınlığı model değeridir; merkezlerin açıkladığı pist ölçümünden farklı olabilir.</p>
        <div class="tbl-wrap" id="kayak"></div>
      </section>
      <section class="sec" id="toz-b" aria-labelledby="h-tz">
        <h2 id="h-tz">Toz taşınımı</h2>
        <p class="note">Havadaki çöl tozu yoğunluğu (µg/m³), önümüzdeki 3 günün en yüksek değeri. Toz, astım ve solunum yolu rahatsızlığı olanlar için önemlidir; yağmurla birlikte "çamur yağmuru" yapabilir.</p>
        <div class="trh-wrap" id="tozh"></div>
        <div id="tozlj"></div>
      </section>
      <section class="sec" id="hava-b" aria-labelledby="h-hv">
        <h2 id="h-hv">Havalimanları</h2>
        <p class="note" id="hvnot">Gerçek ölçümler (METAR) ve havalimanı tahminleri (TAF). Yarım saatte bir güncellenir.</p>
        <div class="tbl-wrap" id="metar"></div>
      </section>
      <section class="sec" id="deprem-b" aria-labelledby="h-dp">
        <h2 id="h-dp">Son depremler</h2>
        <p class="note">Türkiye ve çevresinde son 7 günde olan 2,5 ve üstü depremler. Resmi bilgi için AFAD ve Kandilli Rasathanesi'ni takip edin.</p>
        <div class="tbl-wrap" id="deprem"></div>
      </section>
      <section class="sec" id="uzay-b" aria-labelledby="h-uz">
        <h2 id="h-uz">Uzay havası</h2>
        <p class="note">Güneş fırtınalarının şiddeti (Kp endeksi, 0–9). Kp 7 ve üstü olduğunda Türkiye'nin kuzeyinden kutup ışığı görülebilir; GPS ve radyo iletişimi etkilenebilir.</p>
        <div id="uzay"></div>
      </section>
      <section class="sec" id="dunya-b" aria-labelledby="h-dn">
        <h2 id="h-dn">Dünya şehirleri</h2>
        <p class="note">Şehre dokununca ayrıntılı tahmini açılır. Saatler o şehrin yerel saatidir.</p>
        <div class="kartlar" id="dunya"></div>
      </section>`,
    notlar: ['Kayak, toz ve dünya şehirleri: Open-Meteo (toz: Copernicus CAMS). Havalimanları: NOAA Aviation Weather Center. Depremler: EMSC (Avrupa-Akdeniz Sismoloji Merkezi), yedek olarak USGS. Uzay havası: NOAA SWPC.']
  },
  hakkinda: {
    baslik: 'Hakkında', js: 'hakkinda',
    aciklama: 'Hava Durumu sitesinin veri kaynakları, lisanslar, gizlilik ve sık sorulan sorular.',
    h1: 'Hakkında',
    giris: 'Bu site HKO Software tarafından hazırlanan, reklamsız ve çerezsiz bir hava durumu sitesidir. Veriler ücretsiz ve açık kaynaklardan gelir; aşağıda hepsi tek tek yazılı.',
    govde: '<!--HAKKINDA-->',
    notlar: []
  }
};

for (const [ad, s] of Object.entries(SAYFALAR)) {
  let html = sayfa(s);
  if (ad === 'hakkinda') html = html.replace('<!--HAKKINDA-->', fs.readFileSync(path.join(__dirname, 'hakkinda-govde.html'), 'utf8'));
  fs.writeFileSync(path.join(KOK, ad + '.html'), html);
  console.log(ad + '.html');
}
