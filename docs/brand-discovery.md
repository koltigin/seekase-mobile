# Seekase — Marka Keşfi (ilk çalışma)

Tarih: 2026-09-23  
Öncelik: Solana Seeker / Android dApp Store için uygulama-öncelikli marka temeli.

## Ürün cümlesi

**Seekase, koleksiyoncuların kendi kişisel müzelerini kurduğu yaşayan bir koleksiyon ağıdır.**

Bu, uygulamayı iki yanlış uçtan ayırır:

- Kurumsal müze kadar uzak, ağır veya öğretici değildir.
- Alış/satış ve fiyat odaklı bir koleksiyon pazaryeri de değildir.

Nesne, nesnenin hikâyesi ve koleksiyoncu birlikte ana karakterdir.

## Referanslardan çıkarılan ilkeler

| Referans | Alınacak ilke | Seekase yorumu |
| --- | --- | --- |
| [LACMA Digital](https://www.garciatomas.com/projects/lacma-digital) | Mobilde sade arayüz, nötr görsel zemin ve eserin öne çıkması | Uygulamanın markası koleksiyon fotoğraflarıyla yarışmamalı. |
| [V&A icon system](https://hicks.design/work/victoria-and-albert-museum-icon-system) | İkonlar marka karakteri taşısa da her ölçekte okunaklı kalmalı | dApp Store ikonu tek, güçlü bir biçimden oluşmalı. |
| [Letterform Archive](https://letterformarchive.org/about/) | Özel koleksiyonun kamuyla paylaşılması; erişim ve beklenmedik keşif | Seekase’in dili “archive” olabilir, ama topluluk odaklı ve canlı kalmalı. |
| [Independent Collectors](https://independent-collectors.com/) | Koleksiyon, sahibinin anlatısı ve editoryal keşif birlikte sunulur | Profil yalnızca envanter değil, koleksiyoncu vitrini olmalı. |
| [MoMA kimliği](https://www.wallpaper.com/design-interiors/corporate-design-branding/moma-logo-design) | Kalıcı tipografik temel; içerikle esnek kullanım | Önce wordmark ve uygulama davranışı, sonra gereksiz bir sembol. |

## Üç marka dünyası

### 1. Open Archive — önerilen yön

Koleksiyonlar kapalı depolar değil; insanlar tarafından açılan, gezilen, hikâyesi büyüyen arşivlerdir.

- Karakter: editoryal, açık, merak uyandıran, çağdaş.
- Görsel araçlar: envanter numarası, ince kurallar, asimetrik grid, kırpılmış obje fotoğrafı, güçlü boşluk.
- Logo yaklaşımı: özgün bir Seekase wordmark; ikon olarak açık/eksik/bağlantılı bir işaret.
- Risk: Fazla kurum dili kullanılırsa soğuklaşabilir.

### 2. Personal Museum

Her üye kendi vitrinini ve sergisini kurar; Seekase bu kişisel müzeleri birbirine bağlar.

- Karakter: sıcak, kişisel, rafine.
- Görsel araçlar: çerçeve, oda, etiket ve sergi başlığı metaforları.
- Logo yaklaşımı: tipografik imza + yumuşak mimari çerçeve.
- Risk: Çok literal bir kabin/müze simgesine dönüşmemeli.

### 3. Living Collection

Koleksiyonlar büyür, tür değiştirir, takip edilir ve etrafında konuşulur.

- Karakter: daha sosyal, dinamik ve Seeker topluluğuna yakın.
- Görsel araçlar: değişken grid, modüler kartlar, hareketli kırpma/katmanlar.
- Logo yaklaşımı: sabit wordmark, koleksiyon türüne göre değişebilen ikincil grafik sistem.
- Risk: Fazla teknoloji/kripto estetiğine kaymamalı.

## İlk karar önerisi

**Open Archive** ana yön seçilsin; Personal Museum’un sıcaklığı ikincil dil olarak eklensin.

Bu yaklaşım Android uygulama ikonunda sade kalır, uygulama içindeki farklı koleksiyon fotoğraflarına alan tanır ve daha sonra landing page ile iOS’a zorlanmadan taşınır.

## Sonraki tasarım çıktıları

1. Üç özgün, tipografi-öncelikli wordmark rotası.
2. Her rota için 48 px okunurlukte Android app iconu.
3. Açık/koyu uygulama temasıyla ikon denemesi.
4. Solana dApp Store ekran görüntüsü ve kapak görseli şablonu.

Görsel keşif notu: önceki kabin, etiket ve portal ikon denemeleri nihai tasarım değildir; yalnızca kavramsal eleme içindir.

## Koyu-mod marka varlıkları

İlk çalışma seti `assets/brand/` altında tutulur:

- `seekase-app-icon.svg`: koyu zemin üzerinde seçilmiş S–K monogramı ve kil vurgusu.
- `seekase-app-foreground.svg` / `seekase-app-monochrome.svg`: Android adaptif ikon katmanları.
- `seekase-wordmark-dark.svg`: koyu zemin üzerindeki özel çizilmiş Seekase wordmark.
- `seekase-lockup-dark.svg`: monogram ve wordmark yatay kilidi.
- `seekase-mark-light.svg`: açık zemin kullanımındaki işaret varyantı.
- `icons/*.svg`: beş ana navigasyon ikonunun kaynak seti.

Android/Expo yapılandırması raster ikon çıktılarına bağlandı ve Solana dApp Store için 512 px ikon üretildi. Fiziksel Seeker launcher maskesi ve uygulama içi navigasyon ikonlarının görsel kontrolü tamamlanmadan marka seti nihai kabul edilmemelidir. Kullanım kuralları `docs/brand-guidelines.md` içindedir.
