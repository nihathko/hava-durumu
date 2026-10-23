// Bilgi: hesaplayıcılar, meteoroloji sözlüğü, bulut çeşitleri, METAR kod açıklamaları
(() => {
  'use strict';
  const v = id => parseFloat(String($(id).value).replace(',', '.'));
  const yaz = (id, x, n = 1) => { if (document.activeElement !== $(id)) $(id).value = Number.isFinite(x) ? Math.round(x * 10 ** n) / 10 ** n : ''; };

  // ---------- Hesaplayıcılar ----------
  const bagla = (ids, f) => ids.forEach(id => $(id).addEventListener('input', () => f(id)));
  bagla(['h-c', 'h-f', 'h-k'], id => { const c = id === 'h-c' ? v('h-c') : id === 'h-f' ? (v('h-f') - 32) / 1.8 : v('h-k') - 273.15; yaz('h-c', c); yaz('h-f', c * 1.8 + 32); yaz('h-k', c + 273.15, 2); });
  bagla(['h-kmh', 'h-ms', 'h-kt'], id => {
    const k = id === 'h-kmh' ? v('h-kmh') : id === 'h-ms' ? v('h-ms') * 3.6 : v('h-kt') * 1.852;
    yaz('h-kmh', k); yaz('h-ms', k / 3.6); yaz('h-kt', k / 1.852);
    $('h-bof').textContent = Number.isFinite(k) ? `Beaufort ${bofor(k)[0]}: ${bofor(k)[1]}` : '';
  });
  const ciy = () => { const T = v('h-t'), RH = v('h-rh'); if (!Number.isFinite(T) || !Number.isFinite(RH) || RH <= 0) { $('h-ciy').textContent = ''; return; } const g = Math.log(RH / 100) + 17.625 * T / (243.04 + T), td = 243.04 * g / (17.625 - g); $('h-ciy').textContent = `Çiy noktası ${dec(td)}°C. ${td >= 21 ? 'Hava çok bunaltıcı.' : td >= 16 ? 'Hava nemli ve biraz bunaltıcı.' : td >= 10 ? 'Hava rahat.' : 'Hava kuru.'}`; };
  bagla(['h-t', 'h-rh'], ciy);
  const his = () => {
    const T = v('h-t2'), RH = v('h-rh2'), V = v('h-v2');
    if (![T, RH, V].every(Number.isFinite)) { $('h-his').textContent = ''; return; }
    let h = T, aciklama = 'Hissedilen sıcaklık yaklaşık havanın kendisi kadar.';
    if (T <= 10 && V > 4.8) { h = 13.12 + 0.6215 * T - 11.37 * V ** 0.16 + 0.3965 * T * V ** 0.16; aciklama = 'Rüzgar soğuğu: rüzgar vücuttaki ısıyı daha hızlı alır.'; }
    else if (T >= 27) { const F = T * 1.8 + 32, HI = -42.379 + 2.04901523 * F + 10.14333127 * RH - .22475541 * F * RH - .00683783 * F * F - .05481717 * RH * RH + .00122874 * F * F * RH + .00085282 * F * RH * RH - .00000199 * F * F * RH * RH; h = (HI - 32) / 1.8; aciklama = h >= 41 ? 'Isı indeksi tehlikeli: sıcak çarpması riski yüksek.' : h >= 32 ? 'Isı indeksi yüksek: uzun süre güneşte kalmayın.' : 'Nem sıcaklığı biraz daha yüksek hissettirir.'; }
    $('h-his').textContent = `Hissedilen ${dec(h)}°C. ${aciklama}`;
  };
  bagla(['h-t2', 'h-rh2', 'h-v2'], his);
  bagla(['h-hpa', 'h-mmhg', 'h-inhg'], id => { const p = id === 'h-hpa' ? v('h-hpa') : id === 'h-mmhg' ? v('h-mmhg') * 1.33322 : v('h-inhg') * 33.8639; yaz('h-hpa', p); yaz('h-mmhg', p / 1.33322); yaz('h-inhg', p / 33.8639, 2); });
  const yag = () => { const m = v('h-mm'); $('h-yag').textContent = Number.isFinite(m) ? `${dec(m)} mm yağış, metrekareye ${dec(m)} litre, dekara ${dec(m)} ton su demektir. ${m >= 50 ? 'Bir günde düşerse sel riski yüksektir.' : m >= 20 ? 'Bir günde düşerse kuvvetli yağış sayılır.' : ''}` : ''; };
  bagla(['h-mm'], yag);
  $('h-c').dispatchEvent(new Event('input')); $('h-kmh').dispatchEvent(new Event('input')); $('h-hpa').dispatchEvent(new Event('input')); ciy(); his(); yag();

  // ---------- Sözlük ----------
  const SOZ = [
    ['Aktüel basınç', 'Bulunulan yükseklikte ölçülen hava basıncı. Yükseklere çıktıkça azalır.'],
    ['Deniz seviyesi basıncı', 'Basıncın deniz seviyesine indirgenmiş değeri. Farklı yükseklikteki yerleri karşılaştırmak için kullanılır; 1013 hPa ortalama kabul edilir.'],
    ['Alçak basınç (siklon)', 'Çevresine göre basıncın düşük olduğu alan. Genellikle bulut, yağış ve rüzgar getirir.'],
    ['Yüksek basınç (antisiklon)', 'Çevresine göre basıncın yüksek olduğu alan. Genellikle açık ve durgun hava getirir; kışın sis ve kirliliğe yol açabilir.'],
    ['Cephe', 'Farklı sıcaklıktaki iki hava kütlesinin karşılaştığı sınır. Soğuk cephe geçişinde sıcaklık düşer, sağanak ve rüzgar görülür.'],
    ['Hadise', 'Gözlenen ya da beklenen hava olayı: yağmur, kar, sis, gök gürültüsü gibi.'],
    ['Sağanak', 'Aniden başlayıp kısa sürede biten, şiddeti hızla değişen yağış. Konvektif (kabaran) bulutlardan düşer.'],
    ['Çisenti', 'Damlaları çok küçük, yoğun ve hafif yağmur.'],
    ['Karla karışık yağmur', 'Kar taneleri ile yağmur damlalarının birlikte düştüğü yağış; sıcaklık 0°C civarındayken görülür.'],
    ['Dolu', 'Gök gürültülü fırtına bulutlarında oluşan buz parçaları. Tarıma ve araçlara zarar verebilir.'],
    ['Kırağı', 'Soğuk ve açık gecelerde yüzeylerde oluşan ince buz kristalleri.'],
    ['Pus', 'Havadaki ince su damlacıkları ya da toz nedeniyle görüşün 1–10 km arasına düşmesi.'],
    ['Sis', 'Yere yakın bulut; görüş 1 km\'nin altına düşer.'],
    ['Hissedilen sıcaklık', 'Sıcaklığın rüzgar ve nemle birlikte insan vücudunda yarattığı etki. Rüzgar soğuk havayı daha soğuk, nem sıcak havayı daha sıcak hissettirir.'],
    ['Çiy noktası (işba)', 'Havanın içindeki nemin yoğunlaşmaya başladığı sıcaklık. 16°C üstü bunaltıcı, 21°C üstü çok bunaltıcı hissettirir.'],
    ['Bağıl nem', 'Havadaki nemin, o sıcaklıkta tutabileceği en fazla neme oranı (%).'],
    ['Hamle', 'Birkaç saniye süren en kuvvetli rüzgar. Çatı uçması ve ağaç devrilmesi genellikle hamleyle olur.'],
    ['Beaufort ölçeği', 'Rüzgar kuvvetinin 0 (sakin) ile 12 (kasırga) arasında derecelendirilmesi. 8 ve üstü fırtına sayılır.'],
    ['Lodos', 'Güneybatıdan esen, Marmara ve Batı Karadeniz\'de kuvvetli esebilen sıcak rüzgar.'],
    ['Poyraz', 'Kuzeydoğudan esen, serin ve genellikle kuru rüzgar.'],
    ['Karayel', 'Kuzeybatıdan esen, kışın soğuk ve yağış getiren rüzgar.'],
    ['Kıble', 'Güneyden esen sıcak rüzgar.'],
    ['Yıldız', 'Kuzeyden esen soğuk rüzgar.'],
    ['Gün doğusu (Keşişleme)', 'Güneydoğudan esen rüzgar.'],
    ['Enverziyon (sıcaklık terselmesi)', 'Normalde yükseldikçe soğuyan havanın bir katmanda ısınması. Kirli hava yere yakın sıkışır; kış sabahları şehirlerde kirlilik artar.'],
    ['Donma seviyesi', 'Sıcaklığın 0°C olduğu yükseklik. Bu seviyenin üstünde yağış kar olarak düşer.'],
    ['850 hPa, 700 hPa, 500 hPa', 'Basıncın 850, 700 ve 500 hektopaskal olduğu yükseklikler; yaklaşık 1,5 km, 3 km ve 5,5 km. Yerdeki etkilerden uzak oldukları için hava kütlelerini izlemekte kullanılır. 850 hPa sıcaklığı 0°C altındaysa yağış kar olabilir.'],
    ['Tahmin güveni', 'Farklı hava modellerinin aynı gün için ne kadar benzer tahmin yaptığı. Modeller anlaşıyorsa tahmin güvenilirdir; ayrışıyorsa değişebilir.'],
    ['Görüş mesafesi', 'Gözle seçilebilen en uzak mesafe. 1 km altına inerse sis vardır; trafikte ve havacılıkta önemlidir.'],
    ['Güneşlenme süresi', 'Güneşin bulutlarla örtülmeden parladığı süre. Gün uzunluğundan kısadır.'],
    ['CAPE', 'Havanın kararsızlığını gösteren enerji değeri (J/kg). Yüksekse sağanak, gök gürültülü fırtına ve dolu için uygun ortam vardır.'],
    ['Model', 'Atmosferi fizik denklemleriyle bilgisayarda çözerek tahmin yapan program. ECMWF, GFS, ICON en bilinenleridir.'],
    ['Topluluk (ensemble) tahmini', 'Aynı modelin başlangıç değerleri biraz değiştirilerek onlarca kez çalıştırılması. Sonuçlar birbirine yakınsa tahmin güvenilirdir.'],
    ['Normal', 'Bir değerin uzun yıllar (genellikle 30 yıl, burada 1991–2020) ortalaması.'],
    ['Anomali', 'Bir değerin normalden farkı. "+2° anomali" normalden 2 derece sıcak demektir.'],
    ['Yeniden analiz (ERA5)', 'Geçmiş ölçümlerin bir hava modeliyle birleştirilerek her yer ve saat için hesaplanmış hava verisi.'],
    ['Kuraklık', 'Yağışın uzun süre normalin belirgin şekilde altında kalması. Kısa dönemde tarımı, uzun dönemde su kaynaklarını etkiler.'],
    ['Zirai don', 'Bitkilere zarar veren sıfırın altındaki sıcaklık. Çiçeklenme ve meyve tutumu döneminde en zararlıdır.'],
    ['Evapotranspirasyon (ET₀)', 'Topraktan buharlaşan ve bitkilerin terlemeyle kaybettiği toplam su. Sulama planlamasında kullanılır.'],
    ['Büyüme derece-gün', 'Bitkinin gelişmesi için biriken sıcaklık miktarı. Ekim ve hasat zamanını kestirmeye yarar.'],
    ['Soğuklama', 'Meyve ağaçlarının kışın düzenli çiçek açabilmesi için ihtiyaç duyduğu, 0–7°C arasında geçen saatler.'],
    ['Belirgin dalga yüksekliği', 'Dalgaların en yüksek üçte birinin ortalama yüksekliği. Gözle görülen dalga boyuna yakındır; tek tek dalgalar bunun iki katına çıkabilir.'],
    ['Ölü dalga (soluğan)', 'Uzaktaki bir fırtınanın oluşturduğu, rüzgar olmasa da gelen uzun ve düzenli dalgalar.'],
    ['Deniz mili, knot', 'Deniz mili 1.852 metredir. Knot, saatte bir deniz mili hızdır (1 knot ≈ 1,85 km/sa).'],
    ['METAR', 'Havalimanlarında yarım ya da bir saatte bir yayımlanan rasat (gözlem) mesajı.'],
    ['TAF', 'Havalimanı için 24–30 saatlik tahmin mesajı.'],
    ['SIGMET', 'Uçuşu tehlikeye sokabilecek hava olayları (fırtına, kuvvetli türbülans, buzlanma, volkanik kül) için uçuş bölgesine yayımlanan uyarı.'],
    ['UV endeksi', 'Güneşin yanık yapan ışınlarının şiddeti. 6 ve üstü yüksek, 8 ve üstü çok yüksektir.'],
    ['PM2,5 ve PM10', 'Havadaki 2,5 ve 10 mikrometreden küçük toz parçacıkları. PM2,5 akciğerlerin derinine kadar ulaşabilir.'],
    ['Radar', 'Yağış damlalarından yansıyan sinyallerle yağışın yerini ve şiddetini gösteren cihaz.'],
    ['Kızılötesi uydu görüntüsü', 'Bulutların sıcaklığını gösterir; yüksek ve soğuk bulutlar daha parlak görünür. Gece de kullanılabilir.'],
    ['Köppen iklim sınıflandırması', 'Sıcaklık ve yağışa göre dünya iklimlerini harf kodlarıyla gruplayan sınıflandırma. Örneğin Csa: Akdeniz iklimi.']
  ];
  const sozCiz = q => {
    const f = fold(q || ''), L = SOZ.filter(([a, b]) => !f || fold(a).includes(f) || fold(b).includes(f)).sort((a, b) => trSort(a[0], b[0]));
    $('soz').innerHTML = L.length ? L.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('') : '<p class="muted">Bulunamadı.</p>';
  };
  $('soz-q').addEventListener('input', e => sozCiz(e.target.value));
  sozCiz('');

  // ---------- Bulut çeşitleri ----------
  const BUL = [
    ['Yüksek bulutlar (6.000 m üstü)', [['Sirrus (Cirrus)', 'İnce, tüy ya da saç teli gibi beyaz bulutlar. Buz kristallerinden oluşur; yağış vermez ama hava değişikliğinin habercisi olabilir.'], ['Sirrokümülüs (Cirrocumulus)', 'Küçük, pamuk taneleri gibi sıralanmış ince bulutlar; "koyun sürüsü" görünümü.'], ['Sirrostratüs (Cirrostratus)', 'Gökyüzünü saran ince, şeffaf tül. Güneş ve ayın çevresinde hale oluşturur; çoğu zaman yaklaşan cephenin işaretidir.']]],
    ['Orta bulutlar (2.000–6.000 m)', [['Altokümülüs (Altocumulus)', 'Gri-beyaz, yuvarlak kümelerden oluşan katman. Yaz sabahları görülürse öğleden sonra sağanak gelebilir.'], ['Altostratüs (Altostratus)', 'Güneşi buzlu cam arkasındaymış gibi gösteren gri katman. Uzun süreli yağışın öncüsüdür.'], ['Nimbostratüs (Nimbostratus)', 'Kalın, koyu gri, güneşi tamamen kapatan bulut. Saatlerce süren yağmur ya da kar verir.']]],
    ['Alçak bulutlar (2.000 m altı)', [['Stratokümülüs (Stratocumulus)', 'Gri ve beyaz yamalardan oluşan alçak bulut tabakası. Genellikle hafif yağış verir ya da vermez.'], ['Stratüs (Stratus)', 'Yere yakın, düz ve gri katman; yükselmiş sis gibidir. Çisenti verebilir.']]],
    ['Dikey gelişen bulutlar', [['Kümülüs (Cumulus)', 'Tabanı düz, üstü karnabahar gibi kabarık beyaz bulutlar. Küçükleri güzel havanın, büyüyenleri sağanağın işaretidir.'], ['Kümülonimbüs (Cumulonimbus)', 'Kilometrelerce yükselen, tepesi örs gibi yayılan fırtına bulutu. Sağanak, gök gürültüsü, dolu, kuvvetli rüzgar ve hortum üretebilir.']]]
  ];
  $('bulut').innerHTML = BUL.map(([g, L]) => `<div class="bg"><h3>${g}</h3><dl>${L.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>`).join('');

  // ---------- METAR kodları ----------
  const KOD = [
    ['LTFM', 'Havalimanının ICAO kodu (LT ile başlayanlar Türkiye\'dedir).'], ['231050Z', 'Ayın 23\'ü, saat 10.50 UTC (Türkiye saatiyle 13.50).'],
    ['03012KT', 'Rüzgar 30 dereceden (kuzeydoğu) 12 knot. G ile devam ederse hamle: 03012G25KT. VRB: yönü değişken.'], ['9999', 'Görüş 10 km ve üstü. 0800 gibi değerler metre cinsindendir.'],
    ['CAVOK', 'Görüş 10 km üstü, 1.500 m altında bulut yok, önemli hava olayı yok.'],
    ['FEW030', 'Az bulut (1–2/8), taban 3.000 feet (≈ 900 m). SCT: parçalı (3–4/8), BKN: çok bulutlu (5–7/8), OVC: kapalı (8/8).'],
    ['CB, TCU', 'Kümülonimbüs (fırtına bulutu) ve kabaran kümülüs.'], ['18/09', 'Sıcaklık 18°C, çiy noktası 9°C. M eksi demektir: M03 = −3°C.'],
    ['Q1021', 'Deniz seviyesine indirgenmiş basınç 1021 hPa.'], ['NOSIG', 'Önümüzdeki 2 saatte önemli değişiklik beklenmiyor.'],
    ['RA, SN, DZ', 'Yağmur, kar, çisenti. Önündeki − hafif, + kuvvetli demektir: −RA, +SN.'], ['SH, TS', 'Sağanak ve gök gürültüsü: SHRA sağanak yağmur, TSRA gök gürültülü yağmur.'],
    ['BR, FG, HZ', 'Pus, sis, kuru pus.'], ['DU, SA', 'Toz, kum.'], ['TEMPO, BECMG', 'TAF\'ta geçici değişiklik ve kalıcı değişim.'], ['PROB30', 'TAF\'ta %30 olasılık.']
  ];
  $('mkod').innerHTML = KOD.map(([k, a]) => `<tr><td class="l"><code>${esc(k)}</code></td><td class="l">${esc(a)}</td></tr>`).join('');
  $('kisa').innerHTML = `<div><dt>Terim</dt><dd>${SOZ.length}</dd></div><div><dt>Bulut cinsi</dt><dd>10</dd></div><div><dt>Hesaplayıcı</dt><dd>6</dd></div>`;
})();
