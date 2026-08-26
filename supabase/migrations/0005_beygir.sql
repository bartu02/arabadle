-- Klasik moda yedinci kutu: beygir gücü
--
-- Değer PS (metrik beygir), tam sayı. Türkiye "beygir gücü" diyor ve
-- ruhsatta PS yazıyor; kW ya da SAE hp değil.
--
-- Çok sürümlü modelde **TR'de en yaygın sürüm** — mevcut fuel ve
-- drivetrain alanlarıyla aynı kural (bkz. CLAUDE.md). Gerekçeler
-- seed/ozellikler.json'daki `note` alanında, güven derecesiyle birlikte.
--
-- Karşılaştırma yüzde bantla yapılıyor (±%10 yeşil, ±%25 sarı), mutlak
-- farkla değil: 20 PS, 100 PS'lik bir Şahin ile 830 PS'lik bir Ferrari
-- için aynı şey değil. Bant seçimi ölçülerek yapıldı, gerekçe
-- lib/klasik.js → BEYGIR_TAM.
--
-- Diğer özellik sütunları gibi null geçilebilir: eksik özelliği olan
-- araba Klasik moda hiç girmiyor, sorgu filtreliyor.

alter table public.items add column if not exists power int;

-- Havuzdaki en düşük 77 PS (Fiat Albea), en yüksek 830 PS (Ferrari 296).
-- Sınırlar bol tutuldu; amaç sıfır ya da altı haneli bir yazım hatasını
-- durdurmak, gerçek bir arabayı reddetmek değil.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'items_power_range'
  ) then
    alter table public.items
      add constraint items_power_range
      check (power is null or (power between 40 and 1200));
  end if;
end $$;
