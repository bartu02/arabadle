import { siteUrl } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Arama motorlarına taranacak sayfaların listesi.
 *
 * /sonuc ve /api dışarıda: ilki paylaşım linki (robots.js de kapatıyor),
 * ikincisi taranacak bir şey değil.
 *
 * Paket sayfaları veritabanından geliyor — dört gerçek sayfa, her birinde
 * araba fotoğrafı ve kendi başlığı var; elle yazılsaydı paket eklenince
 * unutulurdu. Supabase'e ulaşılamazsa sabit sayfalarla dönüyor: site
 * haritasının yarısı, hiç haritası olmamasından iyi. Anahtarsız derleme
 * de bu yüzden çalışmaya devam ediyor (bkz. clean-clone denemesi).
 */
export default async function sitemap() {
  const kok = siteUrl();
  const bugun = new Date();

  const sabit = [
    { url: `${kok}/`, lastModified: bugun, changeFrequency: "daily", priority: 1 },
    { url: `${kok}/klasik`, lastModified: bugun, changeFrequency: "daily", priority: 0.9 },
    { url: `${kok}/al-sat-yak`, lastModified: bugun, changeFrequency: "weekly", priority: 0.8 },
    { url: `${kok}/atif`, lastModified: bugun, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("packs")
      .select("slug")
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    return [
      ...sabit,
      ...(data ?? []).map((pack) => ({
        url: `${kok}/al-sat-yak/${pack.slug}`,
        lastModified: bugun,
        changeFrequency: "weekly",
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("Site haritasına paketler eklenemedi:", error.message);
    return sabit;
  }
}
