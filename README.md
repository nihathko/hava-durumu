# Hava Durumu

**Hemen kullan:** https://nihathko.github.io/hava-durumu/

Türkiye'nin 81 ili ve 973 ilçesi için sade, hızlı hava durumu. Tek bir `index.html` dosyasıdır; sunucu gerektirmez.

![Hava durumu ekran görüntüsü](onizleme.png)

## Özellikler

- **İl ve ilçe seçimi**, arama (Türkçe karakter yazmadan da bulur) ve **konumunu kullan** düğmesi (en yakın ilçeyi seçer)
- **Anlık durum:** sıcaklık, hissedilen, hadise, nem, rüzgar ve hamle, son 1 saatin yağışı, aktüel ve deniz seviyesi basıncı, UV
- **Yer bilgisi:** rakım, enlem, boylam, gün doğumu ve batımı
- **Saatlik tahmin:** 3 saatlik dilimler (şu anki dilim + 8 dilim); hadise o dilimdeki hâkim hava, hamle dilimin en yüksek değeri
- **5 günlük tahmin:** en düşük/en yüksek sıcaklık ve nem, rüzgar yönü ve ortalama hızı, yağış ihtimali
- **1991–2020 karşılaştırması:** aynı tarihteki uç sıcaklıklar (ve yılı) ile ortalama en düşük/en yüksek sıcaklık
- **MGM resmi tahmini:** seçilen il için Meteoroloji Genel Müdürlüğü'nün resmi görselleri
- Havaya göre değişen gökyüzü arka planı (güneş, gece, bulut, yağmur, kar, sis, fırtına)
- Veriler her açılışta güncel çekilir; sayfa açık kaldıkça 15 dakikada bir yenilenir
- Açık / koyu tema, telefon uyumlu

## Veri kaynakları

| Veri | Kaynak | Lisans |
|---|---|---|
| Tahmin, anlık durum | [Open-Meteo](https://open-meteo.com/) | CC BY 4.0 |
| 1991–2020 karşılaştırması | Open-Meteo, ECMWF ERA5 yeniden analiz verisi | CC BY 4.0 |
| Yer adları, koordinatlar | Open-Meteo Geocoding, GeoNames | CC BY 4.0 |
| Resmi tahmin görselleri | [Meteoroloji Genel Müdürlüğü](https://www.mgm.gov.tr/site/link-vermek-icin.aspx) | MGM'ye aittir, değiştirilmeden gösterilir |

Tahminler sayısal hava tahmini modellerinden gelir ve yaklaşıktır; resmi tahmin değildir. Can ve mal güvenliğini ilgilendiren durumlarda MGM'nin resmi tahmin ve uyarılarını takip edin.

## Gizlilik

Çerez yok, takip yok. Son bakılan yer yalnızca kendi tarayıcınızda saklanır; konum ~1 km'ye yuvarlanır. Yazı tipleri sitenin içinden yüklenir (`fonts/`, SIL Open Font License 1.1). Ayrıntılar sayfanın altındaki "Gizlilik ve kullanım" bağlantısında.

## Lisans

Kaynak kodu [MIT](LICENSE) lisanslıdır.

---

Geliştiren: **HKO Software**
