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

### Site çok modlu: Arabadle

**Al, Sat, Yak artık site adı değil, bir oyun modu.** Site "Arabadle" —
günlük araba oyunları toplayan bir kabuk. Gerekçe: anketin ödülü kalabalığa bağlı,
yani sıfır trafikte hiçbir şey göstermiyor. Tahmin oyunları ise ilk günden
tek oyuncuyla çalışıyor; günlük trafiği onlar getirecek, o trafik anketin
oylarını dolduracak.

| rota | ne |
|------|-----|
| `/` | mod seçici + gün şeridi |
| `/al-sat-yak` | anketin paket listesi (eski ana sayfa) |
| `/al-sat-yak/[packSlug]?tur=N` | oyun (eski `/oyna/[packSlug]`) |
| `/fotograf` | yakında — yakın plandan tanı |
| `/klasik` | Wordle'ın araba hali (aşağıda) |
| `/sonuc/[sessionId]`, `/atif` | değişmedi |
| `/opengraph-image`, `/klasik/opengraph-image` | paylaşım kartları |
| `/manifest.webmanifest`, `/sitemap.xml`, `/robots.txt` | üretilen |

**Marka üçe ayrıldı:**

- `components/Wordmark.js` — sitenin adı: solda dolu mavi bir kare,
  yanında ad. Site adı yalnızca burada ve `tr.json`'da geçiyor.

  Kare Wordle'dan gelen bütün `-dle` oyunlarının ortak işareti; kullanıcı
  ne tür bir site olduğunu addan önce anlıyor. Önceki hâlinde mavi bir
  **"TR" bloğu** vardı ve site "Plaka" adını taşıdığı sürece o blok adın
  görsel karşılığıydı; ad değişince plaka göndermesi anlamsız kaldı.

  Kare **mavi**, ve bu tesadüf değil: hem Al, Sat, Yak hem Klasik
  yeşil/sarı/kırmızı kullanıyor, yani o üç renk oyun anlamı taşıyor.
  Marka onlardan biri olsaydı "doğru cevap" ya da "Al" ile karışırdı.
  Mavi boşta olan tek renk.
- `components/AlSatYakMark.js` — üç etiket kendi renginde. Eskiden sitenin
  wordmark'ıydı; işlevi duruyor (kullanıcı renk kodunu oynamadan öğreniyor,
  SPEC 7) ama artık modun içinde.
- Üstteki 3px şerit `--color-brand` (#3b82f6, koyu zeminde 5.41:1),
  wordmark'taki kareyle aynı mavi. Üç renk siteye ait olmaktan çıktı.
  Şerit eskiden ayrı bir `components/BrandBar.js` idi; yapışkan başlık
  gelince onun üst kenarına taşındı ve dosya silindi (sabit konumlu şerit
  yapışkan başlığın altından geçiyordu).

**Simge değişti.** `app/icon.svg` Al, Sat, Yak'ın üç renkli çubuğuydu;
o mod artık sitenin tamamı değil. Yerine `public/simge.svg`: dört kare —
sol üst marka mavisi, diğer üçü Klasik'in kutu renkleri. Tek kopya,
hem sekme ikonu (`layout.js` → `metadata.icons`) hem ana ekran ikonu
(`app/manifest.js`) oraya bakıyor.

### Arama motoru ve keşfedilebilirlik

**Beklenti önce: bu türde SEO ana kanal değil.** Wordle Google'dan değil,
paylaşılan ızgaradan büyüdü. Yine de teknik hijyen ucuz ve eksikti.

Bulunan ve kapatılan boşluklar:

- **Beş sayfanın üçünde başlık yoktu.** `/`, `/al-sat-yak` ve dört paket
  sayfası arama sonuçlarında aynı "Arabadle" başlığıyla yarışıyordu.
  Şimdi hepsinin kendi başlığı ve açıklaması var (`seo.*`, tr.json).
  Ana sayfanın başlığı marka adı **olamaz** — kimse "Arabadle" aramıyor,
  "araba tahmin oyunu" arıyor.
- **Kanonik adres hiç yoktu.** `?tur=8` ve `?tur=16` iki ayrı sayfa gibi
  indekslenebilirdi; artık ikisi de `/al-sat-yak/<paket>`'e işaret ediyor.
- **`robots.txt` site haritasını duyurmuyordu.** Harita vardı ama Google'ın
  onu bulmasının tek yolu Search Console'a elle girmekti.
- **Site haritasında paket sayfaları yoktu.** Artık veritabanından
  geliyorlar; Supabase'e ulaşılamazsa sabit dört sayfayla dönüyor
  (anahtarsız derleme kırılmasın).
- **Yapısal veri yoktu** (`lib/yapisal-veri.js`, `components/YapisalVeri.js`).
  Bu sitede metin çok az — oyun ekranları neredeyse tamamen görsel — yani
  arama motoruna tahmin bırakılacak şey de az. `WebSite` + iki `VideoGame`.
  Uydurma `aggregateRating` yok: doğrulanamayan yapısal veri ihlal sayılıyor.
- **`/atif` başlığı iki kez site adı taşıyordu**: "Fotoğraf atıfları —
  Arabadle — Arabadle". Başlık şablonu zaten ekliyordu.
- **Mobilde paylaşım artık native** (`navigator.share`). "Panoya kopyalandı,
  şimdi git yapıştır" adımı büyümenin tam ortasında duruyordu. Ölçüt UA
  değil `pointer: coarse` — masaüstü Edge'de de `share` var ama orada
  Windows panelini açıyor ve pano daha hızlı.

**`openGraph` tanımlayan sayfa miras görseli düşürüyor.** Ölçüldü: `/atif`
(kendi `openGraph`'ı yok) kök kartını alıyordu, `/al-sat-yak` ve paket
sayfaları **görselsiz** kalmıştı. `app/al-sat-yak/opengraph-image.js`
eklendi; alt segmentlere de miras kalıyor.

**`components/YapisalVeri.js` uygulamadaki tek `dangerouslySetInnerHTML`.**
Güvenlik notu "hiçbir yerde yok" diyordu, artık bir tane var ve sınırı net:
içerik yalnızca tr.json + site adresinden `JSON.stringify` ile üretiliyor,
istekten/veritabanından hiçbir şey girmiyor, `<` kaçırılıyor ve nonce
veriliyor. JSON-LD'yi React'te basmanın başka yolu yok (metin çocuğu olarak
verilirse tırnaklar kaçırılıp JSON bozuluyor).

`scratchpad/seo-check.mjs` bunların hepsini kilitliyor (90 kontrol, tarayıcı
gerekmiyor). Canlı adrese karşı da koşuyor:
`node seo-check.mjs https://arabadle.vercel.app`.

**Kod dışında kalan, asıl iş:** dizin siteleri ("Wordle alternatifleri"
listeleri) ve Türk araba toplulukları. Bu ikisi teknik SEO'dan çok daha
fazla trafik getirir ve ikisi de elle yapılacak iş.

### Site kabuğu

Üç sayfa vardı, ortada site yoktu: her sayfa kendi "Bütün modlar" metin
linkini yazıyordu ve Klasik'ten Al, Sat, Yak'a geçmenin tek yolu ana
sayfaya dönmekti. Artık `app/layout.js` iki parça sarıyor:

- `components/SiteHeader.js` — yapışkan, solda wordmark, sağda üç mod.
  Etkin mod `usePathname` ile işaretleniyor (`/al-sat-yak/<paket>` de
  anketi etkin sayıyor). İstemci bileşeni; alternatifi her sayfanın kendi
  etkin anahtarını prop geçmesiydi, o da yeni sayfada unutulacak bir adım.
- `components/SiteFooter.js` — wordmark + atıf linki. Atıf eskiden iki
  sayfada vardı; CC BY / BY-SA fotoğrafın göründüğü her yerden
  ulaşılabilir olmalı.
- Başlıktan önce bir **atlama linki** var (`sr-only`, odakta görünür).

`lib/modes.js` mod listesinin tek kaynağı (nav + ana sayfa kartları).
Sıra bilinçli: **oynanabilir modlar önce.** Eskiden "Fotoğraf" (yakında)
ilk karttı, yani gelen ilk gördüğü şey oynayamadığı bir kutuydu.

**`--h-baslik: 59px`** (`globals.css`) = 3px şerit + 56px çubuk. İki yer
buna bakıyor: Al, Sat, Yak oyun ekranı tam ekran olduğu için
`md:h-[calc(100dvh-var(--h-baslik))]`, Klasik tahtasının yapışkan sütun
başlıkları da tam buranın altına oturuyor. Başlığın yüksekliği
değişirse tek yer.

### Ana sayfa: menü değil, pano

Eski hâli üç gri metin kutusuydu. 210 lisanslı araba fotoğrafı olan bir
sitenin ön kapısı hiçbir araba göstermiyordu, üç oyun birbirinin aynısı
görünüyordu ve 1440px'te sağ yarı bomboştu.

**Her kart kendi mekaniğini gösteriyor** (`components/ModKarti.js`) —
kullanıcı açıklamayı okumadan ne olduğunu anlıyor:

| mod | kart |
|-----|------|
| Klasik | bir araba + altı renkli kutu şeridi |
| Al, Sat, Yak | yan yana üç araba, üçünün altında kendi etiketi |
| Fotoğraf | aynı fotoğrafın `scale-[2.8]` kırpımı + soru işareti |

Fotoğraflar `lib/modes.js` → `cars` slug'larından, `lib/photos.js`
üzerinden geliyor; slug bulunamazsa kart fotoğrafsız çiziliyor (içerik
değişince ön kapı çökmesin).

`components/GunSeridi.js` başlığın altında: bugünün bulmaca numarası,
seri ve **yeni güne kalan süre**. Günlük oyunların "yarın gel" kancası bu
ve geri sayım eskiden yalnızca Klasik'i kazandıktan sonra görünüyordu.
`components/ModDurumu.js` Klasik kartına "bugün oynandı" rozetini
koyuyor (localStorage). Al, Sat, Yak günlük bir bulmaca değil, orada
gösterilecek bir "bugün" yok.

**Statik sayfa + nonce'lı CSP = bozuk sayfa.** Yeni ana sayfa veri
okumadığı için statik üretildi ve **16 CSP ihlali** verdi: statik HTML
build anında donuyor, script'lerinde nonce olmuyor, tarayıcı hepsini
blokluyor. Ölçüldü — statik `/` 16 ihlal, dinamik `/al-sat-yak` sıfır.

Bu arada ortaya çıktı ki **404 sayfası baştan beri bozukmuş** (aynı sebep).
İkisi de `force-dynamic` yapıldı ve `app/not-found.js` yazıldı.
`uitest/csp-check.mjs` artık 404'ü de kontrol ediyor; sayfanın kendi 404
durumunu tarayıcı konsola hata yazdığı için o satır filtreleniyor.

**Kural:** yeni sayfa eklerken `force-dynamic` koy. Veri okumasa bile.

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

### Klasik mod (Wordle'ın araba hali)

`/klasik` — her gün bir araba, listeden tahmin, altı kutu renk veriyor.
Tahmin hakkı **sınırsız**, skor tahmin sayısı.

**Tahmin bir bütün araba, ayrı yıl alanı yok.** Oyuncu 210 arabalık
listeden birini seçiyor, yılı kendiliğinden geliyor. Serbest yıl sorulsaydı
belirsizlik çıkardı: kayıtlarımız nesil, tekil araba değil. Corolla E210
"2018-" ve hâlâ üretimde; "2024 model Corolla" diyen oyuncu ±2 kuralına
takılırdı. Tek seçimle iki nesil çıkış yılı karşılaştırılıyor, elma elmaya.
(CarSpotr yıl sorduğu için easy/hard mod ayırmak zorunda kalmış.)

**Kutular ve eşikler** (`lib/klasik.js`):

| kutu | yeşil | sarı |
|------|-------|------|
| Marka | aynı | aynı grup |
| Ülke | aynı | — |
| Kasa | aynı | — |
| Yakıt | aynı | benzin ↔ hibrit |
| Çekiş | aynı | — |
| Yıl | ±1 | ±3, ayrıca ok |

**Yıl ±1, ±2 değil.** CarSpotr ve Poeltl ±2 kullanıyor ama havuzumuz modern
tarafa yığılmış (210 arabanın 122'si 2015 sonrası). Ölçüldü: ±2'de rastgele
iki arabanın yılı **%21.1** ihtimalle yeşil oluyor, yani oyuncu hiçbir şey
bilmeden her beş tahminin birinde yeşil görüyor. ±1'de %13.2.

**"bağımsız" grubu sarı vermez.** O bir grup değil, "grubu yok" demek —
12 markadan 27 araba orada. Sarı verilseydi Ferrari tahmini Suzuki'ye
ipucu yakardı. Marka sarısı 210 arabanın 154'ünde çalışıyor.

**Altı yeşil ≠ kazandın.** Yedi alanda birebir aynı **üç araba çifti** var:
Mercedes 500E / S-Serisi W140, Porsche 911 (992) / Cayman GT4, Ford Focus
mk4 / Fiesta ST mk8. Kazanma ölçütü slug eşitliği; bu durumda arayüz ayrıca
"altı kutu tuttu ama araba bu değil" diyor. Hak sınırlı olsaydı o günün
oyunu şansa kalırdı — sınırsız tutmanın bir sebebi bu.

**Çözülebilirlik ölçüldü** (`tahmin/klasik-test.mjs` bölüm 9): bir tahmin
havuzu 210'dan **18.3**'e indiriyor, ortalama **3.1** tahminde bitiyor
(ortanca 3, en kötü 6). Simülasyon 210 arabanın özelliklerini bilen bir
oyuncu varsayıyor, gerçek oyun daha uzun.

Bu testin ilk hali yanlıştı: ölçüt "kutu şansa yüzde kaç yeşil oluyor"du ve
yakıt %58.8 ile kaldı. Ama 210 arabanın 158'i benzinli, yani o oran verinin
doğru yansıması — üstelik yakıtın yeşil **olmaması** çok bilgi veriyor.
Ölçüt kalan aday sayısıyla değiştirildi.

**Günün arabası sunucuda seçiliyor** (`lib/klasik-gun.js`, `server-only`).
Wordle'ın kelime listesi istemcideydi ve datamine edildi; bizde de aynı
yüzey var, props'a konan her şey RSC yüküne düşüyor (bu projede bizzat
kullanıldı, `bias-live.mjs`). Karşılaştırma `/api/tahmin` içinde yapılıp
geriye yalnızca renkler dönüyor. İstemciye inen tek veri 210 slug + ad.

Sır olan gün numarası değil — o ekranda yazıyor — **günden arabaya giden
eşleme**. Takvim hesabı bu yüzden paylaşılan `lib/klasik.js`'te, permütasyon
`klasik-gun.js`'te. Dönem başına bir karıştırma yapılıyor: doğrudan
`hash(gün) % n` almak 210 arabada aynı arabayı ortalama 18 günde tekrar
getiriyor; dönem yöntemi 210 günlük turda tekrarı sıfırlıyor. `mod`
parametresi Fotoğraf modu için — aynı gün iki modda aynı araba çıkarsa
biri diğerini ele veriyor.

**Kutu renkleri: yeşil `#35c46f` · sarı `#e0a92e` · kırmızı `#ba4035`.**
İlk ikisi koyu yazıyla 8.80:1 ve 9.37:1, kırmızı açık yazıyla 5.01:1;
kırmızının sayfa zeminine oranı da 3.67:1, yani kutu olduğu net görünüyor.

Kırmızıda bir **ölü bölge** var: `#c9453a` civarında 4.5:1'i ne koyu ne
açık yazı tutuyor (ikisi de ~4.2). Ya daha parlak + koyu yazı ya daha
derin + açık yazı olmak zorunda; derin olan seçildi, çünkü oyunun başında
kutuların çoğu kırmızı ve parlak kırmızı yeşil/sarıyı bastırıyordu.

Önce Wordle'ı izleyip gri kullanıldı (yeşil/kırmızı en kötü renk körlüğü
çifti). Kullanıcı 2026-08-24'te kırmızı istedi. Erişilebilirlik sorun
değil: renk hiçbir zaman tek kanal değil — her kutuda değerin kendisi
yazılı, yıl kutusunda ayrıca ok var, ve kırmızının parlaklığı yeşilin
yarısından az. Paylaşım ızgarasındaki kare de 🟥 oldu; ekranla paylaşım
metni aynı şeyi söylemeli.

Denenmiş ve bırakılmış: **dolu koyu gri** sayfa zeminine karşı 1.49:1
kalıyordu (en açık gri aday bile 2.74), yani kutu olduğu görünmüyordu.

**Özellik verisi** `seed/ozellikler.json` — 210 araba × 7 alan. Değerler
**anahtar** olarak saklanıyor (`sedan`, `petrol`, `fwd`), Türkçesi
`tr.json`'dan geliyor; marka ve ülke özel isim olduğu için olduğu gibi.
kasa/yakıt/çekiş elle dolduruldu (630 hücre), `note` alanı gerekçeyi
taşıyor. İki kural: **48V mild-hybrid Benzin sayılır** (oyuncu hibrit
deyince Corolla'yı düşünüyor, mild-hybrid Passat'ı değil) ve çok sürümlü
modelde **TR'de en yaygın sürüm**.

Doğrulama dört geçiş (`scratchpad/tahmin/dogrula.mjs`): kapsam+sözlük,
mantık kuralları, **Wikimedia dosya adıyla çapraz kontrol** (14/14 uyuştu),
ayırt etme gücü (4 alanla 42 araba çakışıyordu, 7 alanla 6). En riskli
sekiz olgu ayrıca dışarıdan doğrulandı (Polestar 2'nin FWD→RWD geçişi,
RS4 B5'in yalnızca Avant olması, Patrol Y62'nin dizelinin olmaması...).

Üç satırda karar hâlâ açık ve `ACIK` olarak işaretli: BMW M3 G80 (taban
RWD / Competition xDrive), Polestar 2 (üretim ikiye bölünmüş), RAV4 XA50
(AWD-i / FWD hibrit). Kural uydurup kapatmak veriyi doğru yapmaz.

**Nasıl oynanır + istatistik** (`components/KlasikAraclar.js`). İkisi de
bu türün standart mobilyası ve ikisi de eksikti:

- Kurallar sayfanın en altındaki lejantta duruyordu. İlk kez gelen boş
  bir arama kutusu görüyor, bir araba yazıyor, kırmızı kutular alıyor ve
  **sarının var olduğunu hiç öğrenmiyordu.** Pencere ilk ziyarette
  kendiliğinden açılıyor (Wordle de böyle), sonra düğmeye kalıyor.
  İçindeki örnek satır gerçek `KlasikSatir` ile çiziliyor.
- İstatistik günlük oyunların geri gelme sebebi: oynanan, bulunan %,
  seri, en iyi seri, tahmin dağılımı. Seri eskiden yalnızca kazanma
  kartında ve yalnızca 1'den büyükse görünüyordu.

**Araba seçici kutuya basınca açılıyor** (`components/ArabaSecici.js`).
Önceden boş kutu hiçbir şey göstermiyordu; serbest metin kabul edilmediği
için oyuncu ne yazacağını bilmiyordu. Boşken **210 arabanın tamamı** ada
göre sıralı listeleniyor (`localeCompare(tr)` — sunucu `slug`'a göre
sıralı gönderiyor ve o hep adla başlamıyor: `vw-golf-8-gti`,
`tofas-sahin`). Kesme yalnızca yazarken var (8 sonuç), orada amaç en iyi
eşleşme.

**Katman sırası: site başlığı 40 > açılır liste 30 > tahtanın yapışkan
sütun başlıkları 20.** Liste z-10'dayken sütun şeridi ("MARKA ÜLKE
KASA...") listenin üstüne biniyor ve ikinci öneriyi örtüyordu; ikisi aynı
yığın bağlamında olduğu için z-index'ler doğrudan yarışıyor
(`position: relative` + `z-index: auto` yeni bağlam açmıyor).

İki incelik: kutu boşken **hiçbir satır ön seçili değil** (`vurgu = -1`),
yoksa liste odakla açıldığı için kazara basılan Enter listenin başındaki
arabayı tahmin ederdi; ve ok tuşuyla gezerken vurgulanan satır
`scrollIntoView({ block: "nearest" })` ile görünür tutuluyor — sekiz
sonuçla gerekmiyordu, 210 satırla gerekiyor.

`components/Modal.js` tarayıcının kendi `<dialog>`'unu kullanıyor: odak
tuzağı, Esc, `aria-modal` ve arka planın erişilemez olması bedava geliyor
(bağımlılık eklemeden). **`m-auto` şart** — tarayıcı `<dialog>`'u
`margin: auto` ile ortalıyor, Tailwind preflight bütün marginleri
sıfırlayınca pencere sol üste yapışıyor. Bir kez oldu.

`lib/klasik-depo.js` tarayıcı hafızasının tek kaynağı (tahta, istatistik
penceresi ve ana sayfa rozeti okuyor). İki incelik:

- **"oynanan" sayacı ilk tahminde artıyor**, sayfa açılışında değil;
  bakıp çıkan biri oyunu oynamış sayılmamalı. Bunun için ayrı bir
  `sayilan` alanı var. İlk yazımda koşul `kayit.numara === numara` idi ve
  sayaç hiç artmadı: tahtanın kayıt efekti sayfa açılır açılmaz
  `numara`yı yazıyor, yani ilk tahmin geldiğinde alan çoktan bugüne
  eşitti. Tarayıcı testi bunu yakaladı.
- Tahtanın kayıt efekti `{ ...oku(), numara, tahminler, cevap }` yazıyor —
  taze okumazsa istatistik alanlarını siler.

**`0004_klasik.sql` çalıştırıldı** (2026-08-24, Supabase SQL Editor).
Öncekilerden farkı: bu migration **zorunlu**. 0002 ve 0003 çalıştırılmazsa
uygulama loga uyarı düşüp eski davranışa dönüyordu; burada sütunlar yoksa
`items` sorgusu hata veriyor ve sayfa "Klasik şu an açılmıyor" gösteriyor
(bu hâli de ölçüldü). Sırası: SQL Editor'de 0004 → `npm run seed` →
sunucuyu yeniden başlat. Seed sonrası 210/210 araba dolu, `votes` 66
satırda kaldı.

**Sunucuyu yeniden başlatmadan `npm run build` çalıştırma.** Çalışan
`next start` altından `.next` değişince istemci parçalarının hash'i
tutmuyor, sayfa açılıyor ama JavaScript hiç yüklenmiyor. Bir kez
tarayıcı testi bu yüzden sahte FAIL verdi. Windows'ta port dolu kalırsa:
`Get-NetTCPConnection -LocalPort 3000 -State Listen` → `Stop-Process`.
`pkill -f "next start"` burada işe yaramıyor.

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
`data-pack-desc`, `data-pack-index`, `data-category`, `data-category-note`,
`data-nav-mode`, `data-site-home`, `data-gun-seridi`, `data-mod-bitti`,
`data-modal`, `data-nasil-ac`, `data-istatistik-ac`.
Utility sınıfına (`text-7xl` gibi) göre seçici yazma — bir kez yazıldı ve
düzen değişince test sessizce yanlış elemanı ölçmeye başladı.

**Bir kanca tek şey demeli.** "Nasıl oynanır" penceresindeki örnek satır
da `KlasikSatir` ile çiziliyor; ikisi de `data-tahmin` taşıyınca testlerin
tahmin sayacı ikiye katlandı ve `[data-tahmin-ad]`'ın ilki tahtadaki değil
penceredeki satır oldu. Bileşen artık `ornek` prop'u alıyor: örnek
`data-ornek` taşıyor, `data-tahmin` yalnızca tahtadaki gerçek tahmin.

**Tab sayısı sayma.** `a11y.mjs` "iki Tab sonra ilk kart", `hover-check.mjs`
aynısını yazmıştı; site kabuğu tab sırasına dört eleman ekleyince beş
kontrol birden kırıldı. İkisi de artık hedefe varana kadar Tab'lıyor
(odağın hangi kartın içinde olduğuna bakarak).

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
- `uitest/klasik-kabuk.mjs` — site kabuğunu ve Klasik'in yeni mobilyasını
  gerçek tarayıcıda dener: her sayfada nav + etkin mod, "nasıl oynanır"ın
  ilk ziyarette açılıp ikincide açılmaması, pencerenin **ortalanmış**
  olması, Esc, istatistiğin boştan doluya geçmesi (`oynanan` bir kez
  artıyor mu), kazanınca seri/dağılım, ana sayfadaki "bugün oynandı".
  **`addInitScript` ile localStorage'a yazarken birleştir**, düz `setItem`
  her yüklemede kaydı eziyor — `klasik-oyna.mjs`'in "yenilemede oyun
  duruyor mu" kontrolü bir kez bu yüzden sahte FAIL verdi.
- `seo-check.mjs` — arama motoru hijyeni: her sayfanın kendi başlığı ve
  açıklaması (ve tekil olmaları, uzunluk sınırları), kanonik adresler,
  `?tur=`'un kanonikten düşmesi, robots↔harita tutarlılığı, JSON-LD'nin
  geçerliliği ve nonce'ı, OG görsellerinin gerçekten üretilmesi, noindex
  olmaması, tek h1. Tarayıcı gerekmiyor; canlı adrese karşı da koşar.
- `uitest/secici.mjs` — araba seçici: boş kutuya tıklayınca listenin
  açılması, sıranın ada göre olması, **kazara Enter'ın tahmin
  göndermemesi**, ok tuşları, filtreleme, denenen arabanın pasif kalması,
  dışarı tıklayınca kapanma, mobilde taşmama. Liste uzunluğunu
  `seed/ozellikler.json`'dan türetiyor — sabit sayı yazılmıyor.
- `uitest/gozden-gecir.mjs` — bütün ekranları masaüstü + mobil çeker
  (`uitest/gozden/` altına). Tasarım değişikliğinden sonra göze bakmak için.
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
