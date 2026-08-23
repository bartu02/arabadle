# Al, Sat, Yak — proje spec'i

Bu dosya Claude Code'a verilecek brief'tir. Repo kökünde `SPEC.md` olarak dursun.
Her yeni oturumda Claude Code'a "önce SPEC.md'yi oku" de.

---

## 1. Ürün nedir

Klasik "Öp / Evlen / At" formatının araba versiyonu. Kullanıcıya her turda 3 araba
gösterilir. Kullanıcı bu üç arabaya **Al**, **Sat** ve **Yak** etiketlerini dağıtır —
her etiket tam olarak bir kez kullanılır. Oy verdikten sonra kalabalığın ne dediği
açılır: "girenlerin %82'si bu arabaya Al dedi".

Ürünün amacı bilgi ölçmek değil. Doğru cevap yok. Ürünün tek amacı **tartışma ve
paylaşım üretmek.** Bütün tasarım kararları bu cümleye göre verilir.

Arabalar dünyanın her yerinden. Arayüz Türkçe.

---

## 2. v1 kapsamı

Sadece **tek kişilik mod** yapılacak.

Dahil:
- Ana sayfa → paket seçimi + tur sayısı seçimi (8 veya 16)
- Oyun akışı (3 araba, etiket atama, onay)
- Her turdan sonra kalabalık istatistiğinin açılması
- Oyun sonu özet ekranı + paylaşılabilir sonuç
- 5 paket, ~60 araba, ~40 üçlü seed verisi
- Anonim kullanıcı (hesap yok)

**Kapsam dışı — bunları yapma:**
- Çok kişilik / oda / realtime hiçbir şey
- Giriş, kayıt, hesap, profil
- Admin paneli, içerik yönetim arayüzü
- Kategori yönetim sistemi (arabadan başka kategori v1'de yok)
- Reklam entegrasyonu
- İngilizce dil desteği (altyapı hazır olacak, içerik olmayacak)

Çok kişilik mod v2'de gelecek. v1'i **engellemeyecek** şekilde kur (aşağıdaki veri
modeli buna göre tasarlandı) ama v2 için tek satır kod yazma.

---

## 3. Teknik stack

- Next.js (App Router)
- **Düz JavaScript, TypeScript kullanma**
- Tailwind CSS
- Supabase (Postgres + JS client)
- Vercel'e deploy edilebilir olacak
- Ekstra bağımlılık ekleme. State için React'in kendi hook'ları yeter,
  Redux/Zustand/react-query kurma.

---

## 4. Veri modeli

Önemli: tablo ve alan isimlerinde "car" geçmesin. `items` olsun. İleride başka
kategori eklenebilmesi için tek gereken bu — başka soyutlama yapma.

```
items
  id            uuid pk
  slug          text unique
  name          text          -- "Peugeot 205 GTI"
  year_label    text          -- "1984-1994", gösterim amaçlı, tarih tipi değil
  image_url     text
  image_credit  text          -- lisans/atıf metni, boş geçilebilir
  created_at    timestamptz

packs
  id            uuid pk
  slug          text unique
  title         text          -- "90'lar hatchback"
  description   text          -- tek cümle
  sort_order    int

trios
  id            uuid pk
  pack_id       uuid fk -> packs
  item_a_id     uuid fk -> items
  item_b_id     uuid fk -> items
  item_c_id     uuid fk -> items
  sort_order    int

votes
  id            uuid pk
  trio_id       uuid fk -> trios
  item_id       uuid fk -> items
  label         text          -- 'buy' | 'sell' | 'burn'
  session_id    text          -- anonim, client'ta üretilir
  created_at    timestamptz
```

`votes` tablosunda `session_id` var ama kullanıcıya bağlı değil — v2'de oda modu
gelirse buraya `room_id` eklenecek, şu an gerekmiyor.

Kalabalık yüzdesi her istekte `votes` üzerinden hesaplanacak. v1 trafiğinde bu
yeterli; şimdiden cache/materialized view kurma.

---

## 5. Route yapısı

```
/                      ana sayfa, paket listesi
/oyna/[packSlug]       oyun akışı (tek sayfa, client-side tur yönetimi)
/sonuc/[sessionId]     oyun sonu özeti, paylaşılabilir
```

`/oyna` içindeki turlar arasında sayfa değişmez, sadece state değişir.

---

## 6. Ekran davranışları

### 6.1 Ana sayfa

Paket kartları listelenir. Her kart: başlık, tek cümlelik açıklama, içindeki
üçlü sayısı. Kart tıklanınca tur sayısı sorulur: **8 tur** (kısa) veya
**16 tur** (uzun). Varsayılan 8.

16 tur seçildiğinde paketteki üçlü sayısı yetmiyorsa, eksik kalan turlar
diğer paketlerden karıştırılarak tamamlanır — kullanıcıya "karışık turlar
eklendi" diye tek satır bilgi verilir.

Üstte ürünün ne olduğunu anlatan **tek satır**. Uzun açıklama, "nasıl oynanır"
bölümü, tutorial yok. Kullanıcı ilk turda zaten anlıyor.

### 6.2 Oyun ekranı (kritik bölüm)

Üç araba kartı. Her kartın altında üç düğme: Al / Sat / Yak.

**Etiket atama kuralı — bunu tam olarak böyle yap:**

- Bir karta bir etiket atandığında, o etiket diğer iki karttan kaldırılır
  (görsel olarak soluklaşır, tıklanamaz olmaz).
- Kullanıcı aynı etiketi başka bir karta atarsa, etiket oraya **taşınır**;
  eski karttaki seçim boşalır.
- Bir kartta zaten seçili olan etikete tekrar basılırsa seçim kaldırılır.
- Üç etiket de yerleştiğinde onay düğmesi aktifleşir.
- Sürükle-bırak **yapma.** Mobil tarayıcıda kaydırma ile çakışıyor.

Masaüstünde klavye: kartın üzerindeyken `1` = Al, `2` = Sat, `3` = Yak.
Ekranda küçük bir ipucu satırı olsun.

Üst tarafta paket adı ve tur sayacı (`Tur 3 / 8` veya `Tur 3 / 16`).

### 6.3 Açılış ekranı

Onay sonrası her araba için kalabalığın dağılımı açılır:
- Yüzde çubuğu (Al / Sat / Yak oranları)
- Kullanıcının kendi seçimi işaretli
- Altında tek satır sonuç metni

Turda **bir tane** öne çıkan istatistik gösterilir. Hangisinin çıkacağı basit
kurallarla seçilir:
- Kullanıcı azınlıktaysa: "Bu turda azınlıktasın"
- Bir arabada %90+ tek yönde toplanma varsa: "Neredeyse oy birliği"
- Kullanıcı en popüler seçimi yaptıysa: "Çoğunlukla aynı fikirdesin"

Bu satır ürünün en önemli parçası. Görsel olarak öne çıksın.

Veri azken (bir arabada 20'den az oy varsa) yüzde gösterme, yerine
"henüz yeterli oy yok" de. Sıfırlık veya %100'lük saçma istatistik gösterme.

### 6.4 Sonuç ekranı

- Kullanıcının "garajı": Al dediği arabalar
- "Hurdalık": Yak dediği arabalar
- Kalabalıkla uyum yüzdesi (tek sayı, öne çıkan)
- Tekrar oyna / başka paket düğmeleri
- Paylaş düğmesi: `/sonuc/[sessionId]` linkini kopyalar

Bu sayfa link olarak açıldığında da düzgün görünmeli — Open Graph meta
etiketlerini doldur (başlık, açıklama, görsel).

---

## 7. Tasarım yönü

Bu bir eğlence ürünü, kurumsal bir dashboard değil. Şablon görünümlü,
"AI ile yapılmış" hissi veren tasarımdan kaçın.

Sabit kurallar:
- **Masaüstü öncelikli.** Bu, üzerine düşünülen bir karşılaştırma oyunu;
  asıl deneyim büyük ekranda üç fotoğrafa uzun uzun bakmak. Tasarımı
  masaüstünde kur: üç kart yan yana, fotoğraflar mümkün olduğunca büyük.
- Mobil **bozulmayacak.** Paylaşılan link telefonda açılacak. Mobilde üç
  kart alt alta iner. Tek CSS grid, medya sorgusu ile sütun sayısı değişir —
  iki ayrı bileşen yazma.
- Koyu zemin. Araba fotoğrafları koyu zeminde belirgin biçimde daha iyi duruyor.
- Fotoğraf kahraman. Arayüz kaybolmalı; çerçeve, gölge, dekoratif öğe yok.
- Al / Sat / Yak'ın kendi güçlü renkleri olsun ve tutarlı kalsın. Kullanıcı
  kartı okumadan renkten anlamalı.
- Araba isimleri fotoğrafın üstünde okunaklı bir zeminde olsun — fotoğrafın
  rengi ne olursa olsun okunmalı.
- Animasyon sadece açılış anında. Yüzde çubukları dolarken kısa bir geçiş.
  Başka yerde animasyon yok.
- `prefers-reduced-motion` desteklenecek, klavye odağı görünür olacak.

Metin tonu: kısa, düz, hafif alaycı. "Lütfen bir seçim yapınız" değil,
"üçünü de dağıt". Ünlem kullanma.

---

## 8. Dil

Tüm arayüz metinleri `lib/i18n/tr.json` içinden gelecek. Bileşenlerin içine
düz metin yazma — tek bir Türkçe string bile koda gömülmesin.

İngilizce dosyası **oluşturma**, dil seçici **yapma**. Sadece metinler tek
dosyadan gelsin, yeter.

---

## 9. Seed verisi

`seed/` klasöründe JSON dosyaları ve bunları Supabase'e basan bir script olsun.

Ben paketleri ve üçlüleri kendim dolduracağım. Sen şu yapıyı kur ve **her
paket için 2 örnek üçlü** ile doldur, gerisini boş bırak:

```
seed/packs.json
seed/items.json
seed/trios.json
seed/seed.mjs
```

### Üçlü kurma kuralları

Bu kurallar üçlüleri ben doldururken uygulanacak, ama senin de bilmen lazım
çünkü örnek üçlüleri buna göre üreteceksin.

**Zorunlu:** Bir üçlüdeki üç araba aynı segmentte ve yaklaşık aynı dönemde
olmalı. Bugatti ile Kia aynı üçlüde olamaz — segment farkı seçimi anlamsız
kılar.

**Yeterli değil:** Aynı segment tek başına yetmez. Üçünden biri açıkça
üstünse üçlü ölür. Aranan şey, her arabanın **farklı bir eksende** kazanması —
biri daha güzel, biri daha güvenilir, biri daha eğlenceli. Tek bir "en iyi"
ekseni yoksa kullanıcı gerçekten arada kalır.

Çalışan üç kalıp:

1. **Acıtan üçlü** — üçü de sevilen. Birini yakmak zorunda kalmak canını
   yakar. Örnek: Porsche 911 (964) / Ferrari 348 / Honda NSX.
2. **Sefalet üçlüsü** — üçü de vasat. Bu sefer "Al" demek zor.
   Örnek: Opel Astra G / Fiat Bravo / Peugeot 307.
3. **Farklı ekol** — aynı segment, farklı karakter. Tartışma segmentte değil
   kültürde. Örnek: BMW E30 M3 / Mercedes 190E 2.5-16 / Alfa Romeo 75.

**Kaçınılacak:** Rastgele marka karışımı, farklı segment, herkesin aynı
cevabı vereceği üçlüler, çok bilinmeyen modeller (kullanıcı tanımıyorsa
fikri de olmaz).

### Görseller

Görseller için: `image_url` alanına şimdilik placeholder koy. Fotoğraf
lisansı çözülene kadar gerçek fotoğraf indirme, telifli görsel kullanma.
`image_credit` alanı dolu gelirse arayüzde küçük punto ile göster.

---

## 10. Yapma listesi

Bunlar sık düşülen tuzaklar, açıkça yasak:

- TypeScript'e geçme
- Realtime, WebSocket, Supabase Realtime kurma
- Auth ekleme
- Admin paneli veya içerik editörü yazma
- Test altyapısı kurma (v1'de gerek yok)
- Analytics/tracking kütüphanesi ekleme
- Component library (shadcn, MUI, Chakra) kurma
- Oy verilerini client'ta hesaplatma — hesap sunucu tarafında olacak
- Aynı `session_id` ile aynı `trio_id`'ye ikinci kez oy kaydetme
  (basit bir unique constraint yeter)

---

## 11. Teslim sırası

Sırayla ilerle. Her adım bitince dur, çalıştığını göster, sonra devam et.
Hepsini tek seferde yazma.

1. Next.js projesi + Tailwind + Supabase client kurulumu, boş ana sayfa
2. Veritabanı şeması (SQL migration dosyası olarak) + seed script
3. Ana sayfa: paket listesi, gerçek veriden
4. Oyun ekranı: üç kart, etiket atama mantığı, tur geçişi — henüz oy kaydı yok
5. Oy kaydı + kalabalık yüzdesi hesabı + açılış ekranı
6. Öne çıkan istatistik mantığı
7. Sonuç ekranı + paylaşım linki + OG etiketleri
8. Mobil/masaüstü düzen kontrolü, klavye kısayolları, erişilebilirlik geçişi

---

## 12. Kabul kriterleri

- 1440px masaüstünde üç kart yan yana, fotoğraflar ekranın hakkını veriyor
- Telefonda 380px genişlikte hiçbir taşma yok, kartlar alt alta iniyor
- Bir turu üç tıklama + onay ile bitirebiliyorum
- Masaüstünde `1` `2` `3` tuşları çalışıyor
- Hem 8 hem 16 turluk oyun baştan sona oynanabiliyor
- Sayfayı yenilediğimde oyun baştan başlıyor (v1'de kaldığı yerden devam yok)
- Kalabalık verisi yokken saçma yüzde göstermiyor
- Arayüzde koda gömülü tek bir Türkçe metin yok
- Vercel'e deploy edildiğinde çalışıyor
