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
 */
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/sonuc/"] }],
    host: siteUrl(),
  };
}
