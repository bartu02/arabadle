import "server-only";

import { gununSlugu } from "@/lib/klasik-gun";

/**
 * Klasik modun veri erişimi. Sunucuda kalır.
 *
 * Tek sorgu bütün arabaları çekiyor, hem günün cevabı hem tahmin edilen
 * araba aynı diziden okunuyor. İki ayrı sorgu atmanın faydası yok: cevabı
 * bulmak için zaten slug listesinin tamamı gerekiyor.
 */

const ALANLAR =
  "slug, name, year_label, image_url, image_credit, brand, country, brand_group, year_start, body, fuel, drivetrain";

/**
 * Bir dakikalık süreç içi önbellek.
 *
 * Sayfa force-dynamic ve al-sat-yak tarafında "seed'e eklenen paket anında
 * görünsün" diye önbellek yok. Burada bir tahmin = bir istek olduğu için
 * durum farklı: önbelleksiz her tahminde 210 satır çekiliyor. Bir dakika,
 * seed'i pratikte anında görünür tutarken art arda gelen tahminleri
 * veritabanına hiç uğratmıyor.
 */
const TTL_MS = 60_000;
let onbellek = { zaman: 0, arabalar: null };

export async function tumArabalar(supabase) {
  if (onbellek.arabalar && Date.now() - onbellek.zaman < TTL_MS) {
    return onbellek.arabalar;
  }

  // Özelliği eksik araba Klasik'e girmiyor: kutulardan biri boş kalırsa
  // oyun çözülemez hale geliyor. Seed doğrulaması zaten hepsinin dolu
  // olmasını şart koşuyor, bu filtre elle yapılan bir eklemeye karşı.
  const sorgu = await supabase
    .from("items")
    .select(ALANLAR)
    .not("brand", "is", null)
    .not("year_start", "is", null)
    .not("body", "is", null)
    .not("fuel", "is", null)
    .not("drivetrain", "is", null)
    .order("slug", { ascending: true });

  if (sorgu.error) throw new Error(sorgu.error.message);

  onbellek = { zaman: Date.now(), arabalar: sorgu.data ?? [] };
  return onbellek.arabalar;
}

export async function gununCevabi(supabase, numara) {
  const arabalar = await tumArabalar(supabase);
  const slug = gununSlugu(
    arabalar.map((a) => a.slug),
    numara
  );
  return arabalar.find((a) => a.slug === slug) ?? null;
}
