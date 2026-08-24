# CLAUDE.md

Bu repoda çalışma kuralları. Her oturumda önce bunu, sonra `SPEC.md`'yi oku.

## Dil ve stack

- **Düz JavaScript. TypeScript yasak.** `.ts` / `.tsx` dosyası açma,
  `tsconfig.json` ekleme, tip katmanı kurma. Dosya uzantısı `.js` / `.mjs`.
- Next.js (App Router) · Tailwind CSS v4 · Supabase · Vercel'e deploy edilebilir.
- **Ekstra bağımlılık ekleme.** State için React'in kendi hook'ları yeter;
  Redux / Zustand / react-query kurma.
- Tüm arayüz metni `lib/i18n/tr.json` içinden gelir ve `t("yol.anahtar")` ile
  okunur. Bileşene tek bir Türkçe string bile gömme. İngilizce dosyası
  oluşturma, dil seçici yapma.

## Yapma listesi (SPEC.md bölüm 10)

Sık düşülen tuzaklar, açıkça yasak:

- TypeScript'e geçme
- Realtime, WebSocket, Supabase Realtime kurma
- Auth ekleme
- Admin paneli veya içerik editörü yazma
- Test altyapısı kurma (v1'de gerek yok)
- Analytics / tracking kütüphanesi ekleme
- Component library (shadcn, MUI, Chakra) kurma
- Oy verilerini client'ta hesaplatma — hesap sunucu tarafında olacak
- Aynı `session_id` ile aynı `trio_id`'ye ikinci kez oy kaydetme
  (basit bir unique constraint yeter)

Ayrıca v1 kapsamı dışı (SPEC.md bölüm 2): çok kişilik / oda / realtime,
giriş-kayıt-hesap-profil, kategori yönetim sistemi, reklam entegrasyonu,
İngilizce içerik. v2 için tek satır kod yazma.

## Teslim durumu (SPEC.md bölüm 11)

Sırayla ilerlenir. Her adım bitince dur, çalıştığını göster, kullanıcı onay
vermeden sonraki adıma geçme. **Bir adım bitince aşağıdaki tabloyu güncelle.**

| # | Adım | Durum |
|---|------|-------|
| 1 | Next.js + Tailwind + Supabase client kurulumu, boş ana sayfa | bitti |
| 2 | Veritabanı şeması (SQL migration) + seed script | bitti |
| 3 | Ana sayfa: paket listesi, gerçek veriden | bitti |
| 4 | Oyun ekranı: üç kart, etiket atama, tur geçişi — oy kaydı yok | bitti |
| 5 | Oy kaydı + kalabalık yüzdesi hesabı + açılış ekranı | bitti |
| 6 | Öne çıkan istatistik mantığı | bitti |
| 7 | Sonuç ekranı + paylaşım linki + OG etiketleri | bitti |
| 8 | Mobil/masaüstü düzen, klavye kısayolları, erişilebilirlik geçişi | bitti |

## Bilinen durum

**v1'in sekiz adımı da bitti.** `npm run build` ve `npm run start` temiz.

- Supabase bağlı. Şema çalıştırıldı, seed basıldı (4 paket / 210 araba / 70 üçlü).
- `votes` tablosunda 66 satır, altı gerçek oturum var (kullanıcının oyunları,
  `dfa7bb72-kurtarilan-oturum` ve kısa denemeler). Eşik 20 olduğu için
  hâlâ "Henüz yeterli oy yok" görünüyor — üçlü başına en fazla 2 oturum var.
  Bu doğru davranış.
- **Yaş kuralı:** 2005 ve öncesi arabaların tamamı tek pakette
  (`eski-arabalar`, 16 üçlü). Diğer üç paket yalnızca 2005 sonrası araba
  içerir. Yeni araba eklerken bu kurala uy — `year_label`'ın başlangıç yılı
  ≤2005 ise `eski-arabalar`'a girer. Bu yüzden "JDM klasikleri" gibi tematik
  bir **eski** paket açılamıyor; o içerik `eski-arabalar`'a üçlü olarak eklendi.
- **Az sayıda, büyük paket.** Kullanıcı 2026-08-23'te on paketi dörde
  indirtti: gerekçe, 6 üçlülü bir pakette 16 tur seçince turların çoğunun
  başka paketlerden gelmesiydi. Şimdiki hâli:

  | # | Paket | Üçlü | Araba | İçindekiler |
  |---|-------|------|-------|-------------|
  | 1 | Türkiye'nin yolları | 24 | 72 | günlük + SUV/crossover + 2006-2019 arası + elektrikli |
  | 2 | Performans | 18 | 54 | sıcak hatchback + modern performans + Japon spor |
  | 3 | Prestij ve arazi | 12 | 36 | premium sedan + arazi/pickup |
  | 4 | Eski arabalar | 16 | 48 | 2005 ve öncesi |

  Yeni **paket** açma; kullanıcı bunu açıkça istemiyor. İçerik büyütmek
  gerekirse mevcut paketlere üçlü ekle.
- **Paket birleştirirken üçlüleri silme, taşı.** `scratchpad/merge-packs.mjs`
  `pack_id` + `sort_order`'ı PATCH'liyor; satır kimliği korunduğu için
  `votes` sağ kalıyor (48 → 48). Silip yeniden yaratmak, `trios` üzerindeki
  `on delete cascade` yüzünden oyları da götürür.
  `scratchpad/merge-seedfiles.mjs` aynı eşlemeyi seed dosyalarına uygular —
  ikisi aynı kalmazsa bir sonraki `seed.mjs` eski paketleri geri yaratır.
- Aynı araba birden fazla üçlüde olabilir (şemada yalnızca üçlü **içinde**
  tekrar yasak, bkz. `trios_distinct_items`). Şu an kullanılmıyor: 210 arabanın
  her biri tam bir üçlüde. Üçlü sayısını arabasız artırmak gerekirse yol açık.
- **Tekrar oynanabilirlik sınırı.** Hangi üçlülerin geleceği her oyunda
  karışıyor (`lib/game.js` → `buildRounds`, Fisher-Yates), ama üçlünün **içi**
  sabit ve görülen üçlü hiçbir yerde hatırlanmıyor. İçerik sabit olmak
  zorunda: oy `(trio_id, item_id)` çiftine yazılıyor, arabalar her oyunda
  yeniden eşleşseydi hiçbir üçlü 20 oy eşiğine ulaşamazdı. Paketler büyüdüğü
  için 16 turluk oyun artık ilk üç pakette tamamen paket içinden doluyor ve
  24 üçlülük pakette her oyun farklı 16 tur geliyor. Yapılmayanlar: görülen
  üçlüyü localStorage'da tutmak, kart sırasını karıştırmak.
- Karışık tur uyarısı (`components/PackCard.js` → `needsMixing`) veriye bağlı:
  `trioCount < 16` ise çıkıyor. Şu an yalnızca "Prestij ve arazi"de (12 üçlü)
  görünüyor. Testte bunu koşulsuz beklemek bir kez kırılmaya yol açtı.
- **Kapak fotoğrafı = paketin ilk üçlüsünün ilk arabası** (`app/page.js` →
  `coverItemId`). Ayrı bir kapak alanı yok, yani kapağı değiştirmenin yolu
  üçlü sırasını değiştirmek. Bu güvenli: `buildRounds` zaten karıştırdığı için
  `sort_order` oyunu etkilemiyor, yalnızca kapağı ve seed dosyasının
  okunurluğunu belirliyor.
  Araç: `scratchpad/reorder-pack.mjs <slug> <yeni sıra>` — hem veritabanını
  hem `seed/trios.json`'ı günceller, `unique (pack_id, sort_order)` çakışmasın
  diye iki aşamalı yazar (önce +100, sonra hedef).
  Kapak, paketin **en dikkat çekici** arabası olmalı; iki paket bu yüzden
  yeniden dizildi:
  - Performans: süper otomobil → spor → Japon → sıcak hatchback.
    Kapak GR Yaris değil **Ferrari 296 GTB**.
  - Prestij ve arazi: arazi → pickup → premium sedan.
    Kapak BMW 3 Serisi değil **Range Rover (L460)** — paketin iki yarısını da
    (prestij + arazi) tek karede anlatan araba o.

  Kapaklar: Fiat Egea · Ferrari 296 GTB · Range Rover L460 · Peugeot 205 GTI.
- `SUPABASE_SECRET_KEY` legacy `service_role` JWT'si. Yeni `sb_secret_`
  anahtarını bu projenin Data API'si kabul etmedi
  (`UNAUTHORIZED_INVALID_API_KEY_TYPE`). Legacy anahtarlar kaldırılırsa
  burası güncellenmeli.
- Vercel'e deploy ederken `NEXT_PUBLIC_SITE_URL` ayarlanmalı; yoksa
  `lib/site.js` Vercel'in kendi değişkenine düşer. OG linkleri buna bağlı.
- Fotoğraflar gerçek: 210 arabanın hepsi Wikimedia Commons'tan, hepsi serbest
  lisanslı (CC0 / CC BY / CC BY-SA / kamu malı). Aranan 156 modelin 155'inde
  uygun fotoğraf çıktı; tek istisna **Volkswagen Polo GTI** oldu (iki aday da
  arabanın uzaktan göründüğü kareler), yerine `BMW M135i (F40)` kondu.
  Dosyalar `public/arabalar/` altında, 1280px genişlikte, toplam ~62 MB.
  Dışarıdan görsel çekilmiyor, bu yüzden `next.config.mjs` içinde
  `remotePatterns` boş.
- 53 marka var, ortalama 4 model. Dağılım dengesiz olmaya devam ediyor
  (Toyota 15, Honda 12; 19 marka tek modelle temsil ediliyor) — bu normal,
  paketler segmente göre kuruldu, markaya göre değil.
- **`next start` yalnızca build anında var olan `public/` dosyalarını sunuyor.**
  Yeni fotoğraf ekleyip sunucuyu yeniden başlatmak yetmiyor, 404 dönüyor;
  `npm run build` şart. Bir kez bütün kontakt sayfası boş çıktı.
- `lib/photos.js` tek kaynak: dosya yolu, fotoğrafçı, lisans, lisans linki ve
  Commons sayfası orada. `seed/seed.mjs` items tablosunun `image_url` ve
  `image_credit` alanlarını buradan doldurur (bu yüzden `seed/items.json`
  artık görsel alanı tutmuyor), `/atif` sayfası da buradan beslenir.
  Yeni araba eklerken fotoğrafı `lib/photos.js`'e de yaz — yoksa seed
  doğrulaması hata verip durur.
- Fotoğraf indirirken Commons `thumburl`'ü sorgu dizesiyle geliyor
  (`...png?utm_source=...`). Uzantıyı sorgudan **önce** kes; yoksa PNG
  kaynak `.jpg` adıyla kaydediliyor (bir kez oldu, 1.9 MB'lık PNG).
- **Dosya adına güvenme, indireni gözle gör.** Commons başlığında "rear" /
  "heck" geçmemesi fotoğrafın önden çekildiği anlamına gelmiyor:
  `2024 Porsche Taycan IMG 0046.jpg` ve `2022 Fiat Tipo Cross MHEV Auto.jpg`
  filtreden geçti, ikisi de arkadan çekilmişti. Kontakt sayfası küçük
  gösterdiği için de kaçıyor — indirdikten sonra `object-fit: contain` ile
  büyük bas ve bak. Üç fotoğraf bu yüzden ikinci turda değişti.
- `/atif` sayfası CC BY / BY-SA'nın istediği atfı veriyor: her fotoğrafın
  sahibi, lisansı (linkli) ve kaynağı. Ana sayfanın altından linkli.

### Oyunun ödülü (eşik ve tur seçimi)

Uzun süre fark edilmeyen şey: **oyunun tek fikri hiç çalışmıyordu.**
2026-08-24'te ölçüldü — 70 üçlünün **sıfırı** eşiği geçmişti, 53'ü hiç oy
almamıştı. Kim oynarsa oynasın her turda üç kartta da "Henüz yeterli oy
yok", sonunda "Uyum için yeterli oy yok" görüyordu. Kalabalıkla kendini
karşılaştırma, yani ürünün tamamı, bir kez bile açılmamıştı.

Sebep tek bir hata değil, üçünün birleşimiydi. Üçü de düzeltildi:

**1. Tur seçimi artık ağırlıklı** (`lib/game.js` → `trioWeight`,
`weightedSample`). Sezgiye ters olan kısım şu: "en az oyu olana öncelik
ver" işe yaramıyor — oyları 70 üçlüye eşit dağıtır ve hiçbiri eşiği
geçmeden hepsi birlikte yükselir. Doğrusu tersi: **eşiği geçmeye en yakın**
olana ağırlık vermek. Üçlüler tek tek açılır. Eşiği geçen taban ağırlığa
döner, yani kendi kendini dengeliyor.

`BIAS` ölçülerek seçildi (`scratchpad/bias-tune.mjs`):

| eğri | ilk açılan oyun | 20. oyunda açık | ardışık tekrar |
|------|-----------------|-----------------|----------------|
| düz (eski) | 15.6 | 5.0 | %23 |
| BIAS=8 | 9.8 | 18.7 | %33 |
| **BIAS=25** | **8.7** | **26.7** | %45 |

Teorik en iyi 8 (bir üçlünün 8 oya ulaşması için 8 oyun gerekiyor).
Bedeli ardışık tekrarın artması; geçici, çünkü açılan üçlüler ağırlığını
kaybediyor. `scratchpad/ramp-sim.mjs` bu rampayı simüle ediyor.

**2. Eşik 20 → 8** (`lib/votes.js` → `MIN_VOTES_FOR_PERCENT`). Tek yer.
Trafik geldikçe yükseltilebilir.

**3. Eşiğin altında artık ölü kart yok.** Ham sayı gösteriliyor
("Al 5 · Sat 1 · Yak 1 · 7 oy — yüzde için henüz erken"), tek oy varsa
"İlk oyu sen verdin".

**`0003_trio_vote_counts.sql` çalıştırıldı** (2026-08-24, Supabase SQL
Editor). Elle çalıştırılıyor çünkü ağırlıklandırma üçlü başına oy sayısına
bağlı ve PostgREST group by yapmıyor. Çalıştırılmasaydı oyun kilitlenmezdi:
loga `Üçlü oy sayıları okunamadı, tur seçimi düz rastgele` düşer ve eski
davranışa dönerdi. Eşik ve ham sayı değişiklikleri migration'sız da çalışır.

Canlıda ölçüldü (`scratchpad/bias-live.mjs`): paketin 5 üçlüsü eşiğin bir
altına (7 oy) dolduruldu, geri kalanı 0'da bırakıldı, `/oyna?tur=16`
otuz kez açıldı. Beşi de **30 açılışın 30'unda** geldi; düz rastgele
olsaydı 3.33 beklenirdi. Anon `trio_vote_counts`'u çağıramıyor (42501).

Bugünkü gerçek durum: 53 üçlü 0 oyda, 12'si 1'de, 5'i 2'de. En ileri üçlü
2/8 — altı oyun daha.

### Tasarım

SPEC 7 "şablon görünümlü, AI ile yapılmış hissi veren tasarımdan kaçın"
diyor. Sistem fontu ve nötr griler tam o hissi veriyordu. Yapılanlar:

- **Archivo** (`next/font/google`, `latin-ext` alt kümesi). Paket değil,
  Next'in içinde; fontu build'de indirip kendi domainimizden serve ediyor,
  çalışırken Google'a istek gitmiyor. Türkçe ı ğ ş ç ö ü İ tam.
- `components/Wordmark.js`: "Al, Sat, Yak" üç etiketin kendisi olduğu için
  üç renginde yazılıyor. Süs değil — kullanıcı oyunun renk kodunu ana
  sayfada öğreniyor (SPEC 7: "kartı okumadan renkten anlamalı").
  Ana sayfa, sonuç ekranı ve OG kartı aynı markayı kullanıyor.
- Ana sayfa bir katalog gibi: sıra numarası + iri paket adı + açıklama.
- Oyun ekranında başlığın altında ince bir tur ilerleme çizgisi. Sayaç
  zaten yazıyor, bu onun görünür hali; geçiş yok (animasyon sadece açılışta).
- Sonuç ekranındaki uyum sayısı sayfanın tek kahramanı: `clamp` ile
  ekrana göre 5–10rem.
- Zemin düz siyah değil: katmanlı soğuk gri palet, üstte çok hafif bir
  aydınlanma ve her yerde ince bir grain. İkisi de `body`'nin
  `background-image`'ında, yani **içeriğin altında** — kartlar ve
  fotoğraflar opak olduğu için doku yalnızca boşlukta görünür,
  fotoğrafın üstünden geçmez.
- `components/BrandBar.js`: sayfanın en üstünde 3px'lik üç renkli şerit.
  Her ekranda aynı yerde; OG kartındaki işaretin aynısı.
- Kart = tek panel. Oyun ve sonuç ekranında fotoğraf koyu bir pencere
  (`bg-bg`), altındaki ad/atıf/düğmeler aynı yüzeyde (`bg-surface`).
  Çerçeve eklemeden derinlik veriyor.
- Ana sayfa bir katalog: her paketin kapak fotoğrafı var (paketin ilk
  üçlüsünün ilk arabası). Kapak 16:9 + `object-cover`, çünkü fotoğraflar
  1.33–1.85 aralığında ve bu kutuda yatay kırpma en fazla %4.

**Testlerin tutunduğu kancalar.** Punto ya da düzen değişince seçici
kırılmasın diye: `data-agreement`, `data-pack-title`, `data-pack-count`,
`data-pack-desc`, `data-pack-index`, `data-category`, `data-category-note`.
Utility sınıfına (`text-7xl` gibi) göre seçici yazma — bir kez yazıldı ve
düzen değişince test sessizce yanlış elemanı ölçmeye başladı.

**Eşiği testlere gömme.** `votes-test.mjs` ve `result-test.mjs` 20'yi
sabit yazmıştı; eşik 8'e inince "19 oy eşiğin altında" testi birden
eşiğin *üstünü* ölçmeye başladı. İkisi de artık
`MIN_VOTES_FOR_PERCENT`'ten türetiyor. Aynı şekilde `ui-test.mjs` ve
`firstplayer.mjs` "Henüz yeterli oy yok" metnini arıyordu — metin
değişince kırıldılar. Artık SPEC'in asıl kuralına bakıyorlar
(kartta yüzde işareti yok) ve beklenen metni `tr.json`'dan okuyorlar.

**Testlere içerik sayısı gömme.** "5 paket listeleniyor", "Tur 1 / 10" gibi
sabitler içerik büyüyünce kırıldı. Hepsi veritabanından okunan gerçek sayıyla
karşılaştırılacak şekilde yeniden yazıldı.

Tailwind v4 notu: `scale-*` artık `transform` değil ayrı `scale` CSS
özelliğini üretiyor. Animasyonu `getComputedStyle(el).transform` ile ölçmeye
çalışmak "none" döndürür; ölçüm için öğenin gerçek yüksekliğini kullan.

Tuzak: `next/og` (satori) birden fazla çocuğu olan `div`'de açık
`display: flex` istiyor. `%{result.agreement}` yazmak metni iki düğüme
bölüp OG rotasını çökertiyordu; tek şablon dizesi olarak veriliyor.

### SPEC'ten sapmalar (bilinçli)

- SPEC 6.3 "20'den az oy varsa yüzde gösterme" diyor ve eşik **8**'e
  indirildi. Gerekçe yukarıda: 20'de oyun hiç konuşmuyordu. 8'de yüzdeler
  %12,5'lik adımlarla geliyor ve "neredeyse oy birliği" (%90+) hâlâ 8/8
  istiyor, yani nadir kalıyor.
- SPEC 6.3 eşiğin altında "henüz yeterli oy yok" demeyi istiyor; onun
  yerine **ham sayı** gösteriliyor. SPEC'in asıl derdi uydurma yüzdeydi
  ("%100 Al" derken arkada iki oy olması); "3 kişi Al dedi" yuvarlama
  içermiyor, olgu. Pratikte her kart o ölü satırı gösterdiği için kural
  olduğu gibi uygulanamazdı.
- Öne çıkan istatistikte SPEC'in üç kuralına dördüncü bir dal eklendi
  (`outlier`): kullanıcı üçün bir kısmında ayrıldığında ilk üçü tutmuyordu ama
  SPEC her turda bir satır istiyor. Gerekçe `lib/votes.js` → `pickHighlight`
  yorumunda.
- "Başka kartta duran etiket soluklaşır" kuralı opacity ile yapılınca kontrast
  2.97:1'e düşüyordu (AA eşiği 4.5). Solukluk artık çerçeveden geliyor:
  seçili = dolu, boş = çerçeveli, başka kartta = çerçevesiz. Metin okunur kalıyor.
- SPEC 7 "animasyon sadece açılış anında, başka yerde animasyon yok" diyor.
  Kullanıcı isteğiyle etiket düğmelerine hover eklendi: renk aşağıdan yukarı
  doluyor, yani tıklanınca oluşacak hâlin önizlemesi. `focus-visible` aynısını
  yapıyor, klavyeyle gezen de görüyor. `prefers-reduced-motion` açıkken
  globals.css geçişi kapattığı için dolgu anında oluyor — işlev korunuyor.
- SPEC 7 "çerçeve, gölge, dekoratif öğe yok" diyor; kullanıcı 2026-08-22'de
  daha profesyonel ve dikkat çekici bir görünüm ile düz siyah olmayan bir
  zemin istedi. Bu yüzden marka şeridi, katmanlı zemin ve ana sayfadaki
  kart kenarlıkları eklendi. Oyun ekranı yine de sade tutuldu: orada
  eklenen tek şey kartın kendi yüzeyi, fotoğraf hâlâ kahraman.
- Kategori: SPEC 2 "kategori yönetim sistemi"ni v1 dışı bırakıyor ve o
  sistem **kurulmadı**. Ana sayfadaki "Arabalar" başlığı `tr.json`'dan
  gelen sabit bir metin, veriye bağlı değil. Yapılan tek şey düzenin
  kategori bloğu halinde kurulması: ikinci kategori geldiğinde blok
  tekrarlanır, tasarım yeniden yazılmaz. Gerçek kategori verisi
  (paket → kategori ilişkisi) hâlâ yazılmadı.
- SPEC 7 "fotoğraflar mümkün olduğunca büyük" diyor. Kart dikey, fotoğraflar
  yatay; `object-cover` ile ekranın %72'sini dolduruyordu ama arabanın burnunu
  ve arkasını kesiyordu — placeholder'larda görünmeyen bir kayıptı. Fotoğraf
  alanı artık her ekranda 4:3 ve `object-contain`: araba hep bütün görünüyor,
  yükseklik ~%37'ye iniyor. Üç kart yan yanayken fotoğraf yüksekliğinin üst
  sınırını kart genişliği belirliyor; kırpmadan daha büyüğü mümkün değil.

### Güvenlik

Tehdit modeli küçük ve net: hesap yok, kişisel veri yok, ödeme yok.
Saldırganın kazanabileceği tek şey **oy şişirmek** — kalabalık yüzdesi
oyunun tek gerçek verisi. İkinci sırada bedava işlem gücü harcatmak var.

**Tek yazma kapısı `/api/oy`.** Anon rolün `votes` tablosunda ne okuma ne
yazma yetkisi var (`0001_init.sql`), yani Supabase'e doğrudan gidilemiyor.
Tarayıcıda Supabase istemcisi **yok ve olmamalı**: biri eklerse bu kapı
atlanabilir hale gelir ve aşağıdaki sınırlar anlamını yitirir. Eski
`lib/supabase/client.js` bu yüzden silindi (zaten hiçbir yerde
çağrılmıyordu) — Supabase adresi artık tarayıcı bundle'ına hiç inmiyor.

**Hız sınırı üç katmanlı** (`app/api/oy/route.js`, politika orada):
15 istek/10sn süreç içi patlama freni · 120 istek/10dk IP başına ·
10 istek/saat IP→**tek üçlü**. Üçüncüsü asıl kalkan: insan bir üçlüyü
oyun başına bir kez görür, saldırgan yüzlerce kez görmek ister.
Sayılar bilerek cömert — mobil operatörde yüzlerce kişi tek IP'nin
arkasında olabiliyor, masumu kilitlemek saldırganı yavaşlatmaktan kötü.

**Bunun neyi çözmediği açık olsun:** vekil sunucu havuzu olan biri IP
değiştirerek yine oy şişirebilir. Anonim, hesapsız bir oylamada bunun tam
çözümü yok. Buradaki sınırlar tek makineden yazılan script'i ve
gelişigüzel seli durdurur.

**IP saklanmıyor.** Sayaç tablosuna tuzlu SHA-256 özeti giriyor
(`lib/security.js` → `ipKey`). Tuz `IP_HASH_SALT`, yoksa secret anahtardan
türüyor. Sabit bir tuz olsaydı IPv4 uzayının tamamı önceden hesaplanabilirdi.

**`0002_rate_limit.sql` çalıştırıldı** (2026-08-23, Supabase SQL Editor).
Elle çalıştırılıyor çünkü repoda `psql` ya da Supabase CLI yok ve PostgREST
DDL almıyor. Çalıştırılmamış olsaydı uygulama kilitlenmezdi: `rate_hit`
bulunamayınca loga `rate_hit yok, veritabanı sayacı devre dışı` düşer ve
yalnızca süreç içi fren kalırdı.

Doğrulandı: fonksiyon doğru sayıyor, pencere dolunca sıfırlanıyor, iki
kovadan biri dolunca `false` dönüyor; anon ne tabloyu okuyabiliyor ne
`rate_hit`'i çağırabiliyor (42501). Canlıda IP→üçlü sınırı tam 11. istekte
kesiyor ve aynı IP'yi **diğer** üçlülerden men etmiyor.

**Test koşusundan önce `scratchpad/reset-ratelimit.mjs`.** IP→üçlü kovası
bir saat yaşıyor; temizlemeden art arda koşarsan suite'ler sahte 429 alır.
`abuse.mjs`'in "fren açılıyor mu" kontrolü bu yüzden **üçüncü** bir üçlü
kullanıyor: ikincisinin saatlik kilidi zaten dolu oluyor ve o doğru davranış.

**IP'ye güven açık kurala bağlı** (`lib/security.js` → `clientIp`).
Sıralı tahmin yetmiyordu: yerelde denendiğinde istemcinin yazdığı
`X-Forwarded-For` gerçekten yeni kova açıyordu, yani sınır atlatılabiliyordu.
Şimdi:

| Nerede | Hangi başlık okunur |
|--------|---------------------|
| Vercel (`VERCEL` env var) | **yalnızca** `x-vercel-forwarded-for`; yoksa "bilinmiyor" |
| `TRUST_PROXY_HEADERS=1` | `x-real-ip`, sonra `x-forwarded-for` |
| ikisi de yoksa | hiçbiri — herkes tek kovada, loga uyarı |

Vercel'de zayıf başlıklara **düşülmüyor**; düşmek atlatmanın kapısını açık
bırakırdı. Bayrak kapalıyken başlıkların gerçekten yok sayıldığı ölçüldü
(`security/ip-probe.mjs`). `.env.local`'de `TRUST_PROXY_HEADERS=1` var,
testler ayrı IP taklit edebilsin diye. **Vercel'de tanımlanmamalı.**

**CSP nonce'lı** (`middleware.js`). Her istekte yeni nonce üretiliyor,
Next bunu kendi satır içi script'lerine ekliyor — `'unsafe-inline'`
vermeden çalışıyor. `style-src`'de `'unsafe-inline'` **var**: React'in
`style={{...}}` nitelikleri nonce alamıyor, CSP'de satır içi stil
niteliğinin başka yolu yok. Script'e kıyasla düşük riskli, üstelik
uygulamada HTML enjeksiyonu yüzeyi yok (hiçbir yerde
`dangerouslySetInnerHTML`, `eval` veya kullanıcı HTML'i yok).

Sabit başlıklar `next.config.mjs`'te (nosniff, `X-Frame-Options: DENY`,
Referrer-Policy, Permissions-Policy, HSTS, COOP/CORP, `poweredByHeader:
false`). HSTS'te `preload` **yok** — geri alması zor bir taahhüt ve özel
alan adında HTTPS'i olmayan bir alt alanı kırar.

**Hata mesajı sızdırmıyor.** Eskiden Postgres'in metni olduğu gibi
dönüyordu (`bad(trio.error.message, 500)`), şema hakkında bilgi
veriyordu. Artık dışarıya yalnızca makine kodu çıkıyor
(`invalid_request`, `rate_limited`, `not_found`, `server_error`); gerçek
sebep sunucu loguna gidiyor. İstemci zaten hepsini tek satıra çeviriyor.

**Oturum kimliği: yazarken katı, okurken gevşek.** `/api/oy` UUID şart
(istemci zaten `crypto.randomUUID()` üretiyor). Sonuç sayfası ve OG rotası
`SAFE_SESSION_ID` kullanıyor (`[0-9a-zA-Z-]{8,64}`) — çünkü tabloda UUID
olmayan eski bir satır var (`dfa7bb72-kurtarilan-oturum`) ve onun linki
çalışmaya devam etmeli. Biçim tutmuyorsa veritabanına hiç gidilmiyor.

**`npm audit` temiz (0 açık).** Üç yüksek uyarı vardı (sharp/libvips ×4
CVE, postcss ×4 — ikisi de Next'in içinden). Düzeltmenin tek yolu `next@16`
görünüyordu (kıran sürüm); onun yerine `package.json`'a `overrides` konuldu:

```json
"overrides": { "sharp": "^0.35.3", "postcss": "^8.5.26" }
```

Bu yeni bağımlılık değil, zaten ağaçta olan paketleri yukarı sabitlemek.
Next `sharp: ^0.34.3` istiyor ama 0.35.3 ile sorunsuz çalışıyor —
doğrulandı: `sharp.versions` 0.35.3 / libvips 8.18.3, `/_next/image`
256/640/1080 genişliklerinde doğru boyutta JPEG üretiyor, **Tailwind
çıktısının dosya hash'i değişmedi** (`e2d66be5b1df60f4.css`), bütün görsel
paketler geçiyor.

Not: Vercel'de görsel iyileştirme platformun kendi altyapısında yapılıyor,
bizim `sharp` üretimde zaten yola girmiyor. Yine de yükseltildi — `audit`
gürültüsü sonraki gerçek bulguyu gizlemesin diye.

**Yapılandırma kendini denetliyor** (`lib/config-check.js`, ilk Supabase
istemcisi kurulurken bir kez). Buradaki hatalar uygulamayı çökertmiyor,
sessizce yanlış çalıştırıyor: `NEXT_PUBLIC_SITE_URL` unutulursa paylaşım
linkleri yanlış alan adını gösterir, Vercel'de `TRUST_PROXY_HEADERS` açık
kalırsa hız sınırı atlatılabilir olur. İkisi de aylarca fark edilmeyebilir.
Ayrıca secret'ın bir `NEXT_PUBLIC_` değişkende de durup durmadığına bakıyor.

Ölçüt `NODE_ENV` **değil**: `npm start` yerelde de production yapıyor, ilk
sürüm bu yüzden her yerel açılışta ötüyordu ve öyle bir uyarı okunmaz hale
gelir. Ölçüt "gerçekten dağıtılmış mıyız": `VERCEL` var ya da
`NEXT_PUBLIC_SITE_URL` localhost olmayan bir adres. Yerelde susuyor,
`VERCEL=1` ile üç uyarıyı da veriyor — ikisi de ölçüldü.

**Oy şişirme tespit edilebilir ve geri alınabilir.** Hız sınırı IP başına
olduğu için vekil havuzu olan biri aşabiliyor — bu **ölçüldü**:
`security/simulate-stuffing.mjs` her isteği farklı IP'den gönderince
60/60 geçti. Ama şişirmenin veride bıraktığı iz IP'den bağımsız: gerçek
oyuncu bir oturumda 8-16 üçlüye oy verir, şişiren her biri **tek üçlülük**
binlerce oturum üretir ve hepsi dar bir pencereye yığılır.

`security/detect-stuffing.mjs` bunu okuyor. Simülasyonda tek üçlüyü
işaretledi (23 saniyede 180 oy, oturumların %100'ü tek-üçlü), 17 gerçek
üçlüde yanlış alarm vermedi. `--sil <uclu-id>` yalnızca tek-üçlü oturumları
siliyor — çok üçlüye oy vermiş gerçek oyuncu bu filtreden geçmiyor.
Uçtan uca denendi: 180 sahte oy silindi, 66 gerçek oy bit bit aynı kaldı.

**Anahtar yenilemek için `scratchpad/set-secret.mjs`.** Elle eklemek iki
kez ters gitti: `.env.local` satır sonuyla bitmediği için ekleme secret
key'in ucuna yapıştı, düzeltmek için dosyayı okuyunca da anahtar ekrana
düştü. Script anahtarı hiç ekrana basmıyor, **yazmadan önce** Supabase'e
karşı deniyor (okuma + `rate_hit` ile service_role yetkisi), çalışmıyorsa
dosyaya dokunmuyor, dosya sonunu her zaman satır sonuyla bitiriyor.

**Kullanıcı tarafında duran işler:** secret anahtar bir oturumda sohbete
yapıştırıldı, panelden yenilenmeli. `.env.local` OneDrive içinde
duruyor — senkronize bir klasörde secret tutmak ayrı bir yüzey.
Vercel'de `NEXT_PUBLIC_SITE_URL` ayarlanmalı ve
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **tanımlanmamalı** (artık
kullanılmıyor).

### Doğrulama

Script'ler repoda değil, scratchpad'de (SPEC 10: test altyapısı kurma).
Playwright de oraya kuruldu, projeye bağımlılık eklenmedi.

**Paket slug'ı testlere gömülmez.** Suite'ler `packs` tablosundan okuyor
(`scratchpad/env.mjs` → `firstPackSlug()`). Bir kez sabit yazıldı, paketler
birleştirilince beş suite birden kırıldı.

**`votes` tablosunu doğrudan silme.** `scratchpad/votes-io.mjs` →
`wipeVotes(db)` kullan: silmeden önce her satırı `votes-backup.jsonl`'a
yazıyor. Testler tabloyu boşaltıyor ve bir kez gerçek oyu sildi; yedek
olmadan geri getirilemiyordu.

**Test koşusundan önce gerçek oyları al.** `scratchpad/snapshot-votes.mjs save`
tabloyu `votes-live.json`'a yazar, `... restore` geri koyar. Yedek dosyası
tek koşuya ait olduğu için `votes-backup.jsonl`'ı elle ayıklamaktan kolay.
Sıra: `save` → testler → `restore` → `show` ile satır sayısını doğrula.

26 paket:
saf mantık, yüzde, öne çıkan kurallar, sonuç hesabı, `/api/oy`, ve gerçek
Edge'de oyun akışı / öne çıkan satır / sonuç+OG / ilk oyuncu / düzen-klavye-a11y
/ kontrast / tasarım (`photos/design-check.mjs`: fontun gerçekten yüklendiği,
başlık ve liste kontrastları, OG'nin iki varyantı) / hover
(`photos/hover-check.mjs`: dolgunun ara karesi, klavye eşitliği, dolgu
üstündeki metnin kontrastı, reduced-motion). Fotoğraf geçişinden sonra
hepsi yeniden koşturuldu; `a11y.mjs` içindeki "fotoğraf ekranın >%50'si"
ölçütü "kart genişliğini doldurur ve kırpılmaz" ile değiştirildi
(gerekçe yukarıda).

Güvenlik tarafında dört paket daha:

- `security/abuse.mjs` — `/api/oy`'a bozuk gövde, siteler arası istek,
  yanlış içerik türü, dev gövde, olmayan üçlü, 40 taze oturumla sel.
  Ayrıca anon anahtarla doğrudan Supabase'e gidip `votes`'a yazmayı dener.
  **Kendi hız sınırına takılmasın diye bölümler arasında 11sn bekliyor** —
  ilk yazımda beklemeyi unutmak iki sahte FAIL üretti.
- `security/final-sweep.mjs` — anon anahtarla ulaşılabilen her yolu dener:
  beş tablonun okuma/yazma/silme/değiştirmesi, gömülü sorguyla (`embed`)
  `votes` sızdırma, `rate_hit` çağırma, uygulama başlıkları.
  **PostgREST tuzağı:** RLS hiçbir satırı eşlemediğinde `DELETE` de `204`
  döner — "silindi" değil, "0 satır etkilendi" demek. İlk yazımda durum
  koduna bakıldı ve dört sahte FAIL çıktı; ölçülecek şey satır sayısının
  değişmemesi.
- `security/ratelimit-check.mjs` / `live-ratelimit.mjs` — sayacın SQL
  tarafı ve canlı API üzerinden davranışı.
- `security/ip-probe.mjs` — hangi IP başlığının kovayı değiştirdiğini
  ölçer. Güven kuralı değişirse önce burası koşturulmalı.
- `uitest/payoff.mjs` — ödülün üç aşamasını gerçek tarayıcıda dener:
  hiç oy yokken "ilk oyu sen verdin", eşiğin bir altında ham sayı ve
  **yüzde yok**, eşikte yüzde çubukları + öne çıkan satır. Bütün üçlüleri
  aynı sayıda oyla dolduruyor çünkü hangisinin geleceği rastgele.
- `ramp-sim.mjs` / `bias-tune.mjs` — ağırlık eğrisini simülasyonda ölçer.
  `BIAS` değiştirilecekse önce bunlar koşturulmalı.
- `bias-live.mjs` — ağırlıklandırmanın **canlı uygulamada** çalıştığını
  doğrular. Üçlü id'lerini sayfanın RSC yükünde arıyor (`buildRounds` →
  `GameBoard` props oraya iniyor), o yüzden tarayıcı gerekmiyor.
- `security/deploy-check.mjs <url>` — **deploy'dan sonra çalıştır.**
  Canlı siteyi dışarıdan denetler, veritabanı anahtarı kullanmaz: bütün
  güvenlik başlıkları, nonce'ın tazeliği, robots, `/api/oy`'un kapıdaki
  davranışı, görsel iyileştiricinin traversal/SSRF denemeleri ve tarayıcıya
  inen JS dosyalarında JWT/`sb_secret_`/`service_role` araması.
- `security/detect-stuffing.mjs` — oy şişirme izi arar; `--sil <uclu-id>`
  ile temizler (yedek alarak).
- `security/simulate-stuffing.mjs [n]` — vekil havuzlu saldırganı taklit
  eder, tespit aracını sınamak için. Gerçek veritabanına yazıyor,
  ardından `detect-stuffing.mjs --sil` ile temizle.
- `security/rls-sweep.mjs` — API'ye açık her tabloyu anon anahtarla okuma
  ve yazma için dener. Tablo listesini secret anahtarla alıyor, çünkü anon
  şemayı listeleyemiyor (ilk yazımda bu yüzden "0 tablo" dedi).
- `uitest/csp-check.mjs` — beş sayfayı gerçek Edge'de açar: CSP başlığı,
  nonce'ın her istekte değişmesi, script'lerin nonce taşıması, sıfır CSP
  ihlali, sayfanın gerçekten render olması. `playwright-core` yalnızca
  `uitest/` altında kurulu, script oraya konmalı.
- `leak-check.mjs` — `.next/static` içinde secret anahtar arar (değeri
  hiç ekrana basmadan). Tarayıcıya inen dosyalarda çıkarsa sızıntı var.

Yardımcılar:

- `ascii-check.mjs` — dosyaya yanlışlıkla karışan Kiril/Yunan harflerini
  yakalar. Üçüncü kez oldu (`siteden`, U+0435); yazdıktan sonra
  koşturmak alışkanlık olsun.
- `prune-test-votes.mjs` — `votes-live.json`'da olmayan oturumları siler.
  Test koşusundan arta kalanı, gerçek oylara dokunmadan temizler.
  `snapshot-votes.mjs restore` artık önce `wipeVotes` çağırıyor: dolu
  tabloya yazmak unique kısıtına çarpıp 409 döndürüyordu ve geri yükleme
  yarım kalıyordu.

**`api-test.mjs` yeni sözleşmeye uyarlandı:** oturum kimliği artık UUID
olmak zorunda, o yüzden `session_id`'ye etiket gömülemiyor — üretilen
kimlikler listede tutulup temizlik oradan yapılıyor. Toplu oy döngüsü de
her isteğe ayrı `X-Real-IP` veriyor, yoksa kendi patlama frenimize
takılıyor.
