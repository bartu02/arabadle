import { siteUrl } from "@/lib/site";

/**
 * Arama motorlarına ne taranacağını söyler.
 *
 * /sonuc/... paylaşım linki: bağlantıyı bilen açsın, arama sonuçlarında
 * çıkmasın. /api zaten tarayacak bir şey değil.
 *
 * Bu bir güvenlik kontrolü değil — robots.txt kimseyi engellemez, sadece
 * iyi niyetli tarayıcıları yönlendirir. Asıl kontrol oturum kimliğinin
 * tahmin edilemez olması (crypto.randomUUID).
 *
 * `sitemap` satırı şart: site haritası vardı ama robots.txt'te
 * duyurulmuyordu, yani Google'ın onu bulmasının tek yolu Search Console'a
 * elle girmekti.
 */
export default function robots() {
  const kok = siteUrl();

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/sonuc/"] }],
    sitemap: `${kok}/sitemap.xml`,
    host: kok,
  };
}
