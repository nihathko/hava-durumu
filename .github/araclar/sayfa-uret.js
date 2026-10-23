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
<main>
  <div class="skyarea"><div class="wrap">
    <div class="top">
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

<script src="assets/gokyuzu.js"></script>
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
    giris: '81 ilin dünü, şu anki hava durumu ve önümüzdeki 5 gün. Haritada sıcaklık, yağış ya da rüzgarı seç; "Şimdi" görünümünde 54 havalimanının gerçek ölçümlerini de açabilirsin. Aşağıda bölge bölge tahmin ve saat saat harita var.',
    govde: `      <section class="sec" aria-labelledby="h-h">
        <h2 id="h-h">Harita</h2>
        <p class="note" id="hnot"></p>
        <div class="tabs" id="zaman" aria-label="Gün"></div>
        <div class="tabs" id="katman" aria-label="Harita katmanı"></div>
        <div class="trh-wrap" id="harita"></div>
        <div id="lj"></div>
      </section>
      <section class="sec" aria-labelledby="h-b">
        <h2 id="h-b">Bölgelerde hava</h2>
        <p class="note">Yedi coğrafi bölge için model verisinden otomatik hazırlanan kısa tahmin ve bölgedeki illerin en düşük, en yüksek sıcaklığı.</p>
        <div class="tabs" id="bgun" aria-label="Gün"></div>
        <div class="bolgeler" id="bolge"></div>
      </section>
      <section class="sec" aria-labelledby="h-ss">
        <h2 id="h-ss">Saat saat harita</h2>
        <p class="note">Önümüzdeki 72 saat için model çıktısı. Kaydırıcıyla saati seç ya da Oynat'a bas. "Gök gürültüsü" katmanı yıldırım ve sağanak için uygun ortamı (CAPE) gösterir; gerçek yıldırım ölçümü değildir. Anlık yıldırımlar için MGM'nin <a href="https://www.mgm.gov.tr/sondurum/yildirim-takip.aspx" target="_blank" rel="noopener">yıldırım takibi</a> sayfasına bakabilirsin.</p>
        <div class="tabs" id="skat" aria-label="Katman"></div>
        <div class="trh-wrap" id="sharita"></div>
        <div id="slj2"></div>
        <div class="oynat"><button class="btn" id="soy" type="button">Oynat</button><input type="range" id="ssaat" min="0" max="0" value="0" aria-label="Saat"><span class="zaman" id="szmn"></span></div>
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
    giris: 'Yağış radarı son iki saati gösterir. Meteosat uydusunun 15 dakikada bir yenilenen kızılötesi, toz ve fırtına bulutu görüntüleri, NASA\'nın günlük gerçek renkli görüntüsü ve uydudan görülen yangın noktaları da burada.',
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
    notlar: ['Radar: <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a> (Weather data by RainViewer). Meteosat görüntüleri: © EUMETSAT. Gerçek renkli uydu ve yangın noktaları: NASA GIBS, EOSDIS. Harita altlığı: © OpenStreetMap katkıcıları.']
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
      </section>
      <section class="sec" aria-labelledby="h-air">
        <h2 id="h-air">Yüksek atmosfer (AIRGRAM)</h2>
        <p class="note">Yerden yaklaşık 9 km yüksekliğe kadar her katmanda sıcaklık, rüzgar ve nem; önümüzdeki 3 gün, 3 saatte bir.</p>
        <div id="air"></div>
      </section>
      <section class="sec" aria-labelledby="h-uz">
        <h2 id="h-uz">Önümüzdeki haftalar ve aylar</h2>
        <p class="note">Uzun vadeli tahmin: önümüzdeki haftaların ve 6 ayın normalden sıcak mı soğuk mu, yağışlı mı kurak mı geçeceğine dair eğilim.</p>
        <div id="uzun"></div>
      </section>`,
    notlar: ['Modeller: ECMWF IFS (Avrupa), ICON (Almanya, DWD), GFS (ABD, NOAA), ARPEGE (Fransa, Météo-France), UKMO (Birleşik Krallık, Met Office), Open-Meteo üzerinden. Bağımsız tahmin: <a href="https://api.met.no/" target="_blank" rel="noopener">MET Norway</a> (CC BY 4.0).',
      'Topluluk tahmini: DWD ICON-EPS ve ECMWF ENS, Open-Meteo Ensemble API.']
  },
  iklim: {
    baslik: 'İklim', js: 'iklim', yer: true, sonEk: '<script src="assets/normal-81.js"></script>\n',
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
      <section class="sec" aria-labelledby="h-kur">
        <h2 id="h-kur">Kuraklık ve bu yıl</h2>
        <p class="note">Son 1, 3, 6, 12 ve 24 ayın yağışı normalle karşılaştırılır; bu yılın şimdiye kadarki sıcaklık ve yağışı da burada.</p>
        <div id="uzun"></div>
      </section>
      <section class="sec" aria-labelledby="h-gd">
        <h2 id="h-gd">Isıtma ve soğutma gün dereceleri</h2>
        <p class="note">Bina ısıtma ve soğutma ihtiyacının göstergesi. MGM'nin tanımıyla: günlük ortalama 15°C ve altındaysa 18 − sıcaklık, 22°C üstündeyse sıcaklık − 22 toplanır.</p>
        <div id="gd"></div>
      </section>
      <section class="sec" aria-labelledby="h-sn">
        <h2 id="h-sn">İklim sınıflandırması</h2>
        <p class="note">1991–2020 değerlerine göre bu yerin iklim tipi, kuraklık indisleri ve bitkiler için soğuğa dayanıklılık bölgesi.</p>
        <div id="sinif"></div>
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
    giris: 'Kıyılarımızda dalga yüksekliği, deniz suyu sıcaklığı ve rüzgar; deniz bülteni, saat saat dalga haritası, marinalar ve deniz yolu tahmini. Rüzgarı knot ya da km/sa olarak görebilirsin.',
    govde: `      <section class="sec" aria-labelledby="h-dh">
        <h2 id="h-dh">Kıyılar</h2>
        <p class="note" id="dnot"></p>
        <div class="ara"><div class="tabs" id="dkat" aria-label="Harita katmanı"></div><div class="tabs" id="dbirim" aria-label="Rüzgar birimi"></div></div>
        <div class="trh-wrap" id="dharita"></div>
        <div id="dlj"></div>
      </section>
      <section class="sec" aria-labelledby="h-bt">
        <h2 id="h-bt">Deniz bülteni</h2>
        <p class="note">Her deniz bölgesi için fırtına, hava, rüzgar kuvveti (Beaufort), dalga ve görüş. Model verisinden otomatik hazırlanır; resmi bülten değildir.</p>
        <div class="tabs" id="bgun2" aria-label="Gün"></div>
        <div id="bulten"></div>
      </section>
      <section class="sec" aria-labelledby="h-dz">
        <h2 id="h-dz">Saat saat dalga ve rüzgar haritası</h2>
        <p class="note">Türkiye çevresindeki denizlerde 0,5°'lik (yaklaşık 50 km) ızgarada önümüzdeki 72 saat. Oklar dalganın ya da rüzgarın gittiği yönü gösterir.</p>
        <div class="tabs" id="dzk" aria-label="Katman"></div>
        <div class="trh-wrap" id="dzh"></div>
        <div id="dzlj"></div>
        <div class="oynat"><button class="btn" id="dzo" type="button">Oynat</button><input type="range" id="dzs" min="0" max="0" value="0" aria-label="Saat"><span class="zaman" id="dzz"></span></div>
      </section>
      <section class="sec" aria-labelledby="h-mr">
        <h2 id="h-mr">Marinalar</h2>
        <p class="note">33 marina ve liman için 5 günlük, 3 saatlik tahmin.</p>
        <div class="field" style="max-width:420px;margin-bottom:14px"><label for="msec">Marina</label><select id="msec"></select></div>
        <div id="mtab"></div>
      </section>
      <section class="sec" aria-labelledby="h-dy">
        <h2 id="h-dy">Deniz yolu tahmini</h2>
        <p class="note">Kalkış ve varış noktasını, teknenin hızını ve çıkış saatini seç; güzergah boyunca geçeceğin saatte beklenen rüzgar ve dalga hesaplanır. Güzergah kuş uçuşudur.</p>
        <div class="dyform">
          <div class="field"><label for="ynk">Kalkış</label><select id="ynk"></select></div>
          <div class="field"><label for="yvr">Varış</label><select id="yvr"></select></div>
          <div class="field"><label for="yhz">Hız (knot)</label><input id="yhz" type="number" min="1" max="40" value="7"></div>
          <div class="field"><label for="ycs">Çıkış</label><select id="ycs"></select></div>
          <button class="btn" id="ygit" type="button">Hesapla</button>
        </div>
        <div id="ysonuc" style="margin-top:14px"></div>
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
    baslik: 'Ziraat', js: 'ziraat', harita: true, yer: true, sonEk: '<script src="assets/normal-81.js"></script>\n',
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
      <section class="sec" aria-labelledby="h-thi">
        <h2 id="h-thi">Hayvancılık: sıcak stresi (sıcaklık-nem indeksi)</h2>
        <p class="note">Sıcaklık ve nem birlikte hayvanları strese sokar. Önümüzdeki 7 gün için günlük en yüksek indeks ve stresli saat sayısı.</p>
        <div id="thi"></div>
      </section>
      <section class="sec" aria-labelledby="h-bs">
        <h2 id="h-bs">Meyve ağaçlarında soğuklama</h2>
        <p class="note">Bu kış şimdiye kadar biriken soğuklama süresi ve yaygın meyve türlerinin ihtiyacı.</p>
        <div id="bisip"></div>
      </section>
      <section class="sec" aria-labelledby="h-hs">
        <h2 id="h-hs">Hasat zamanı tahmini</h2>
        <p class="note">Ürünü ve ekim tarihini seç; büyüme derece-gün birikimine göre olgunlaşma tarihi kestirilir.</p>
        <div class="dyform">
          <div class="field"><label for="hurun">Ürün</label><select id="hurun"></select></div>
          <div class="field"><label for="hekim">Ekim tarihi</label><input id="hekim" type="date"></div>
          <button class="btn" id="hgit" type="button">Hesapla</button>
        </div>
        <div id="hasat-s" style="margin-top:14px"></div>
      </section>
      <section class="sec" aria-labelledby="h-dt">
        <h2 id="h-dt">Don takvimi</h2>
        <p class="note">Seçili yerde 1991–2020 arasında ilkbaharın son ve sonbaharın ilk donlu günü. Fidan dikimi, ekim ve hasat planı için.</p>
        <div id="dontak"></div>
      </section>
      <section class="sec" aria-labelledby="h-ek">
        <h2 id="h-ek">Uygun ekim zamanı</h2>
        <p class="note">Uzun yıllar sıcaklık normallerine göre kışlık tahıllar ve yazlık ürünler için ekim dönemi, ayrıca soğuğa dayanıklılık bölgesi.</p>
        <div id="ekim"></div>
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
    baslik: 'Özel tahminler', js: 'ozel', harita: true, sonEk: '<script src="assets/normal-81.js"></script>\n',
    aciklama: 'Kayak merkezleri, toz taşınımı, havalimanı ölçümleri ve tahminleri, son depremler, uzay havası ve dünya şehirleri.',
    h1: 'Özel tahminler',
    giris: 'Yol hava durumu, kayak merkezleri, stadyumlar, Kapadokya balon uçuşu, enverziyon, güneş ve rüzgar enerjisi, Afrika\'dan gelen toz, havalimanları ve SIGMET uyarıları, son depremler, kutup ışığı ihtimali ve dünya şehirleri.',
    govde: `      <section class="sec" id="yol-b" aria-labelledby="h-yol">
        <h2 id="h-yol">Yol hava durumu</h2>
        <p class="note">İki il arasında yola çıkış saatine göre, yol boyunca her noktaya varacağın saatte beklenen hava. Kar, buzlanma, sis, kuvvetli yağış ve rüzgar işaretlenir. Güzergah iki il merkezi arasındaki düz hattan yaklaşık hesaplanır; gerçek yol değildir.</p>
        <div class="dyform">
          <div class="field"><label for="ynere">Nereden</label><select id="ynere"></select></div>
          <div class="field"><label for="ynereye">Nereye</label><select id="ynereye"></select></div>
          <div class="field"><label for="ytarih">Tarih</label><input id="ytarih" type="date"></div>
          <div class="field"><label for="ysaat">Çıkış saati</label><input id="ysaat" type="time" step="3600"></div>
          <div class="field"><label for="yhiz">Ortalama hız</label><select id="yhiz"><option value="60">60 km/sa</option><option value="80" selected>80 km/sa</option><option value="100">100 km/sa</option></select></div>
          <button class="btn" id="ygit" type="button">Göster</button>
        </div>
        <div id="yols" style="margin-top:14px"></div>
      </section>
      <section class="sec" id="kayak-b" aria-labelledby="h-ky">
        <h2 id="h-ky">Kayak merkezleri</h2>
        <p class="note">Tahminler pistin ortalama yüksekliğine göre düzeltilir. Kar kalınlığı model değeridir; merkezlerin açıkladığı pist ölçümünden farklı olabilir.</p>
        <div class="tbl-wrap" id="kayak"></div>
      </section>
      <section class="sec" id="stad-b" aria-labelledby="h-st">
        <h2 id="h-st">Stadyumlar ve İstanbul Park</h2>
        <p class="note">Maç ve yarış günleri için saatlik tahmin, sabah 8'den gece yarısına kadar.</p>
        <div class="field" style="max-width:420px;margin-bottom:14px"><label for="stsec">Stadyum</label><select id="stsec"></select></div>
        <div id="stad"></div>
      </section>
      <section class="sec" id="balon-b" aria-labelledby="h-bl">
        <h2 id="h-bl">Kapadokya balon uçuşu</h2>
        <p class="note">Göreme'de gün doğumu saatlerinde rüzgar, yağış ve görüşe göre uçuş için hava uygunluğu.</p>
        <div id="balon"></div>
      </section>
      <section class="sec" id="env-b" aria-labelledby="h-env">
        <h2 id="h-env">Enverziyon riski</h2>
        <p class="note">Sabah saat 7'de yerden yukarı doğru sıcaklığın artması (sıcaklık terselmesi) ve rüzgarın zayıflığına göre. Enverziyonda baca ve egzoz dumanı yere yakın sıkışır; özellikle kış sabahları şehirlerde hava kirliliği artar.</p>
        <div class="tabs" id="envg" aria-label="Gün"></div>
        <div class="trh-wrap" id="envh"></div>
        <div id="envlj"></div>
      </section>
      <section class="sec" id="enerji-b" aria-labelledby="h-en">
        <h2 id="h-en">Güneş ve rüzgar enerjisi</h2>
        <p class="note">Seçilen il için önümüzdeki 7 günün güneş paneli üretim tahmini ve rüzgar enerjisi potansiyeli.</p>
        <div class="field" style="max-width:300px;margin-bottom:14px"><label for="ensec">İl</label><select id="ensec"></select></div>
        <div id="enerji"></div>
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
        <div class="gb"><h3>SIGMET uyarıları</h3></div>
        <div id="sigmet"></div>
      </section>
      <section class="sec" id="deprem-b" aria-labelledby="h-dp">
        <h2 id="h-dp">Son depremler</h2>
        <p class="note">Türkiye ve çevresinde son 7 günde olan 2,5 ve üstü depremler. Resmi bilgi için AFAD ve Kandilli Rasathanesi'ni takip edin.</p>
        <div class="tbl-wrap" id="deprem"></div>
        <div id="dphava" style="margin-top:18px"></div>
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
  uyari: {
    baslik: 'Dikkat', js: 'uyari', harita: true,
    aciklama: 'Önümüzdeki 3 günde kuvvetli yağış, kar, fırtına, aşırı sıcak ya da soğuk beklenen iller. Model verisinden otomatik değerlendirme.',
    h1: 'Dikkat gerektiren hava',
    giris: 'Önümüzdeki 3 günde kuvvetli yağış, yoğun kar, kuvvetli rüzgar, aşırı sıcak ya da soğuk, orman yangını riski ve gök gürültülü fırtına beklenen iller. Bu değerlendirme model verisinden otomatik yapılır; <b>resmi uyarı değildir</b>. Resmi uyarılar için <a href="https://www.mgm.gov.tr/meteouyari/turkiye.aspx" target="_blank" rel="noopener">MGM MeteoUyarı</a>.',
    govde: `      <section class="sec" aria-labelledby="h-u">
        <h2 id="h-u">Harita</h2>
        <p class="note" id="usay"></p>
        <div class="tabs" id="ugun" aria-label="Gün"></div>
        <div class="trh-wrap" id="uharita"></div>
        <div id="ulj"></div>
      </section>
      <section class="sec" aria-labelledby="h-ul">
        <h2 id="h-ul">Hadiselere göre iller</h2>
        <div class="siralar" id="uliste"></div>
      </section>
      <section class="sec" aria-labelledby="h-ut">
        <h2 id="h-ut">81 il</h2>
        <p class="note">Sütun başlığına dokunarak sırala.</p>
        <div class="tbl-wrap" id="utablo"></div>
      </section>
      <section class="sec" aria-labelledby="h-ue">
        <h2 id="h-ue">Eşikler</h2>
        <div class="tbl-wrap"><table class="kucuk-tablo"><thead><tr><th class="l">Hadise</th><th>Sarı</th><th>Turuncu</th><th>Kırmızı</th></tr></thead><tbody>
          <tr><td class="l">Günlük yağış</td><td>30 mm</td><td>60 mm</td><td>100 mm</td></tr>
          <tr><td class="l">Günlük kar</td><td>5 cm</td><td>15 cm</td><td>30 cm</td></tr>
          <tr><td class="l">Rüzgar hamlesi</td><td>60 km/sa</td><td>80 km/sa</td><td>100 km/sa</td></tr>
          <tr><td class="l">En yüksek sıcaklık</td><td>38°C</td><td>41°C</td><td>44°C</td></tr>
          <tr><td class="l">En düşük sıcaklık</td><td>−10°C</td><td>−18°C</td><td>−25°C</td></tr>
          <tr><td class="l">Fırtına (CAPE ve gök gürültüsü)</td><td>1000 J/kg</td><td>2000 J/kg</td><td>3000 J/kg</td></tr>
        </tbody></table></div>
        <p class="kutu-not">Eşikler Türkiye geneli için tek tiptir. MGM ise her bölgenin iklimine göre farklı eşikler ve uzman değerlendirmesi kullanır; bu yüzden buradaki renkler MeteoUyarı'dan farklı olabilir.</p>
      </section>`,
    notlar: ['Değerlendirme Open-Meteo tahmin verisinden yapılır. Can ve mal güvenliği için yalnızca MGM\'nin resmi uyarılarını esas alın.',
      'Orman yangını riski sitenin kendi basit endeksidir (0–40): en yüksek sıcaklık, en düşük nem, rüzgar ve son 7 günün yağışından hesaplanır. 18 ve üstü dikkat, 23 ve üstü tehlikeli, 28 ve üstü çok tehlikelidir. Resmi yangın uyarıları için Orman Genel Müdürlüğü\'nü takip edin.']
  },
  analiz: {
    baslik: 'Analizler', js: 'analiz', harita: true, sonEk: '<script src="assets/normal-81.js"></script>\n',
    aciklama: '81 il için geçmiş ayların sıcaklık ve yağış analizi, kuraklık, önümüzdeki aylar, iklim sınıflandırması, güneş ve rüzgar atlası.',
    h1: 'Analizler',
    giris: '81 ilde geçen ayların normalden ne kadar sıcak ya da yağışlı geçtiği, kuraklık durumu, önümüzdeki 6 ayın eğilimi, iklim tipleri, güneş ve rüzgar enerjisi atlası ve bitkiler için soğuğa dayanıklılık bölgeleri.',
    govde: `      <section class="sec" aria-labelledby="h-as">
        <h2 id="h-as">Aylık sıcaklık analizi</h2>
        <p class="note" id="anot"></p>
        <div class="tabs" id="aay" aria-label="Ay"></div>
        <div id="sozet"></div>
        <div class="trh-wrap" id="sh"></div>
        <div id="slj"></div>
        <details class="acil" style="margin-top:14px"><summary>81 il tablosu</summary><div class="tbl-wrap" id="stablo"></div></details>
      </section>
      <section class="sec" aria-labelledby="h-ay2">
        <h2 id="h-ay2">Aylık yağış raporu</h2>
        <p class="note">Yukarıda seçilen ay için yağışın normale oranı.</p>
        <div id="yozet"></div>
        <div class="trh-wrap" id="yh"></div>
        <div id="ylj"></div>
        <details class="acil" style="margin-top:14px"><summary>81 il tablosu</summary><div class="tbl-wrap" id="ytablo"></div></details>
      </section>
      <section class="sec" aria-labelledby="h-kr">
        <h2 id="h-kr">Kuraklık</h2>
        <p class="note">Son 1, 3, 6 ve 12 ayın toplam yağışının normale oranı.</p>
        <div class="tabs" id="kpen" aria-label="Dönem"></div>
        <div id="kozet"></div>
        <div class="trh-wrap" id="kh"></div>
        <div id="klj"></div>
      </section>
      <section class="sec" aria-labelledby="h-mv">
        <h2 id="h-mv">Önümüzdeki aylar</h2>
        <p class="note">ECMWF mevsimsel tahminine göre önümüzdeki 6 ayda sıcaklık ve yağışın normalden beklenen farkı. Eğilim gösterir, kesin tahmin değildir.</p>
        <div class="ara"><div class="tabs" id="mtur" aria-label="Değişken"></div><div class="tabs" id="may" aria-label="Ay"></div></div>
        <div class="trh-wrap" id="mh"></div>
        <div id="mlj"></div>
        <div id="mozet"></div>
      </section>
      <section class="sec" aria-labelledby="h-ik">
        <h2 id="h-ik">İklim sınıflandırması</h2>
        <p class="note">1991–2020 normallerine göre Köppen-Geiger iklim tipleri; tabloda De Martonne ve Erinç indisleri de var.</p>
        <div class="trh-wrap" id="ih"></div>
        <div id="ilj"></div>
        <details class="acil" style="margin-top:14px"><summary>81 il tablosu</summary><div class="tbl-wrap" id="itablo"></div></details>
      </section>
      <section class="sec" aria-labelledby="h-at">
        <h2 id="h-at">Güneş, rüzgar ve soğuğa dayanıklılık atlası</h2>
        <p class="note" id="atnot"></p>
        <div class="tabs" id="atur" aria-label="Atlas"></div>
        <div class="trh-wrap" id="ath"></div>
        <div id="atlj"></div>
      </section>`,
    notlar: ['Geçmiş aylar, normaller, güneş ve rüzgar: NASA POWER (MERRA-2 yeniden analiz, yaklaşık 50 km çözünürlük), il merkezleri için. MGM istasyon ölçümlerinden farklı olabilir.',
      'Önümüzdeki aylar: ECMWF SEAS5 mevsimsel tahmini (Open-Meteo Seasonal API).']
  },
  bilgi: {
    baslik: 'Bilgi', js: 'bilgi',
    aciklama: 'Tehlikeli havada ne yapmalı, hesaplayıcılar, meteoroloji sözlüğü, bulut çeşitleri ve METAR kodları.',
    h1: 'Bilgi',
    giris: 'Sel, yıldırım, fırtına, kar, sıcak çarpması ve soba zehirlenmesine karşı ne yapmalı; birim çevirici ve hesaplayıcılar; hava tahminlerinde geçen terimlerin anlamları.',
    govde: '<!--BILGI-->',
    notlar: []
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
  if (ad === 'bilgi') html = html.replace('<!--BILGI-->', fs.readFileSync(path.join(__dirname, 'bilgi-govde.html'), 'utf8'));
  fs.writeFileSync(path.join(KOK, ad + '.html'), html);
  console.log(ad + '.html');
}
