# Al, Sat, Yak

Üç araba, üç etiket. Ürün brief'i: [SPEC.md](SPEC.md)

## Kurulum

Node.js 20 veya üzeri gerekiyor.

```bash
npm install
cp .env.local.example .env.local   # sonra Supabase anahtarlarını doldur
npm run dev
```

`http://localhost:3000`

## Veritabanı

Şema tek dosyada: `supabase/migrations/0001_init.sql`.

Supabase panelinde **SQL Editor**'ü aç, dosyanın içeriğini yapıştır, çalıştır.
(Supabase CLI kuruluysa `supabase db push` de aynı işi yapar.)

Sonra örnek veriyi bas:

```bash
npm run seed
```

Seed idempotenttir — slug üzerinden upsert eder, tekrar çalıştırılabilir,
hiçbir şey silmez.

**`SUPABASE_SECRET_KEY` zorunlu.** RLS anon role sadece okuma veriyor;
oy yazma ve sayma işleri secret key ile sunucu tarafında yapılır.

## Yapı

```
app/                     Next.js App Router
  layout.js              kök layout, koyu zemin
  page.js                ana sayfa
  oyna/[packSlug]/       oyun ekranı
  globals.css            Tailwind + tema tokenleri (Al/Sat/Yak renkleri burada)
components/              PackList, PackCard, GameBoard, TrioCard
lib/game.js              etiket sabitleri, karıştırma, tur kurma
lib/i18n/tr.json         tüm arayüz metinleri — koda düz metin yazılmaz
lib/i18n/index.js        t("app.title") yardımcısı
lib/supabase/            tarayıcı ve sunucu istemcileri
supabase/migrations/     SQL şema
seed/                    JSON içerik + basma script'i
```

## İçerik ekleme

`seed/items.json` → arabayı ekle, `seed/trios.json` → üçlüyü kur, `npm run seed`.

Üçlüler `item_slugs` ile referans verir, id yazmaya gerek yok. `pattern`
alanı sadece not amaçlıdır, veritabanına gitmez. Script basmadan önce
doğrular: eksik slug, üçlüde tekrar eden araba, çakışan `sort_order`.

Üçlü kurma kuralları SPEC.md bölüm 9'da.

## Stack

Next.js (App Router) · düz JavaScript · Tailwind CSS v4 · Supabase
