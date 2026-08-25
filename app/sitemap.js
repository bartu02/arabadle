import { siteUrl } from "@/lib/site";

/**
 * Arama motorlarına taranacak sayfaların listesi.
 *
 * /sonuc ve /api dışarıda: ilki paylaşım linki (robots.js de kapatıyor),
 * ikincisi taranacak bir şey değil. Liste elle yazılı çünkü dört sayfa
 * var ve içerikten türeyen bir rota yok.
 */
export default function sitemap() {
  const kok = siteUrl();
  const bugun = new Date();

  return [
    { url: `${kok}/`, lastModified: bugun, changeFrequency: "daily", priority: 1 },
    { url: `${kok}/klasik`, lastModified: bugun, changeFrequency: "daily", priority: 0.9 },
    { url: `${kok}/al-sat-yak`, lastModified: bugun, changeFrequency: "weekly", priority: 0.8 },
    { url: `${kok}/atif`, lastModified: bugun, changeFrequency: "monthly", priority: 0.2 },
  ];
}
