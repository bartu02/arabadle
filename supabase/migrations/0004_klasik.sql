-- Klasik mod: arabanın tahmin edilebilir özellikleri
--
-- Bu sütunlar items tablosunda duruyor çünkü arabanın kendi nitelikleri;
-- ayrı bir tablo kurmak tek satırlık bir join'den başka bir şey getirmezdi.
--
-- Değerler kapalı bir sözlükten geliyor ve **anahtar** olarak saklanıyor
-- ("sedan", "petrol", "fwd"). Ekranda görünen Türkçe karşılık
-- lib/i18n/tr.json'dan okunuyor — CLAUDE.md bileşene gömülü Türkçe
-- string'i yasaklıyor. brand ve country özel isim, oldukları gibi duruyor.
--
-- Hepsi null geçilebilir: mevcut 210 arabanın hepsi dolu ama şema yeni bir
-- araba eklenirken çakılmasın. Eksik özelliği olan araba Klasik moda
-- girmiyor (bkz. app/klasik/page.js), sorgu zaten filtreliyor.

alter table public.items add column if not exists brand        text;
alter table public.items add column if not exists country      text;
alter table public.items add column if not exists brand_group  text;
alter table public.items add column if not exists year_start   int;
alter table public.items add column if not exists body         text;
alter table public.items add column if not exists fuel         text;
alter table public.items add column if not exists drivetrain   text;

-- Sözlük dışı değer girmesin. Seed doğrulaması da aynı listeyi kontrol
-- ediyor ama veritabanı son söz sahibi olsun: elle yapılan bir düzeltme
-- seed'den geçmeden buraya ulaşabiliyor.
alter table public.items drop constraint if exists items_body_check;
alter table public.items add constraint items_body_check check (
  body is null or body in
    ('hatchback', 'sedan', 'wagon', 'suv', 'pickup', 'coupe', 'convertible', 'mpv')
);

alter table public.items drop constraint if exists items_fuel_check;
alter table public.items add constraint items_fuel_check check (
  fuel is null or fuel in ('petrol', 'diesel', 'hybrid', 'electric')
);

alter table public.items drop constraint if exists items_drivetrain_check;
alter table public.items add constraint items_drivetrain_check check (
  drivetrain is null or drivetrain in ('fwd', 'rwd', 'awd')
);

alter table public.items drop constraint if exists items_year_start_check;
alter table public.items add constraint items_year_start_check check (
  year_start is null or (year_start between 1900 and 2100)
);

-- Klasik her istekte "özellikleri tam olan arabalar"ı çekiyor.
create index if not exists items_klasik_idx
  on public.items (year_start)
  where body is not null and fuel is not null and drivetrain is not null;

-- RLS: items zaten anon'a açık (0001_init.sql, items_public_read).
-- Bu sütunlar sır değil — zaten her tahminde oyuncuya gösteriliyorlar.
-- Sır olan tek şey **günün hangi araba olduğu**, o da veritabanında değil,
-- sunucudaki tarihten türeyen bir hesap (lib/klasik-gun.js).
