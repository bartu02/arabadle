import "server-only";

/**
 * Dağıtım yapılandırmasını denetler ve yanlışları loga basar.
 *
 * Neden var: buradaki hataların hiçbiri uygulamayı çökertmiyor, sessizce
 * yanlış çalıştırıyor. `NEXT_PUBLIC_SITE_URL` unutulursa paylaşım linkleri
 * yanlış alan adını gösterir; Vercel'de `TRUST_PROXY_HEADERS` açık kalırsa
 * hız sınırı atlatılabilir hale gelir. İkisi de fark edilmesi aylar
 * sürebilecek hatalar.
 *
 * Sunucu başına bir kez çalışır (getSupabaseServerClient tekil olduğu için).
 * Dışarıdan doğrulama için: scratchpad/deploy-check.mjs
 */
let calisti = false;

export function checkConfig() {
  if (calisti) return [];
  calisti = true;

  const vercel = Boolean(process.env.VERCEL);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const yerelAdres = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(siteUrl);

  // NODE_ENV'e bakmak yetmiyor: `npm start` yerelde de production yapıyor,
  // o yüzden bu kontroller her yerel açılışta ötüyordu. Her seferinde öten
  // uyarı okunmaz hale gelir. Ölçüt "gerçekten dağıtılmış mıyız" olmalı.
  const dagitilmis = vercel || (siteUrl !== "" && !yerelAdres);
  const sorunlar = [];

  // Paylaşım linkleri ve OG etiketleri buna bağlı (lib/site.js).
  if (vercel && !siteUrl) {
    sorunlar.push(
      "NEXT_PUBLIC_SITE_URL yok. Vercel'in kendi adresine düşülüyor; " +
        "özel alan adın varsa paylaşım linkleri yanlış adresi gösterir."
    );
  }

  if (dagitilmis && siteUrl.startsWith("http://")) {
    sorunlar.push("NEXT_PUBLIC_SITE_URL http:// ile başlıyor; https:// olmalı.");
  }

  // Vercel'de platform kendi başlığını yazıyor; bayrağın açık olması
  // istemcinin yazdığı başlıklara kapıyı aralar (lib/security.js).
  if (vercel && process.env.TRUST_PROXY_HEADERS === "1") {
    sorunlar.push(
      "Vercel'de TRUST_PROXY_HEADERS=1 tanımlı. Buna gerek yok ve hız " +
        "sınırını zayıflatır — ortam değişkenlerinden kaldır."
    );
  }

  // Artık kullanılmıyor: tarayıcı Supabase'e hiç gitmiyor.
  // Yerelde testler bu anahtarı kullandığı için yalnızca dağıtımda uyarıyoruz.
  if (dagitilmis && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    sorunlar.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tanımlı ama kullanılmıyor. " +
        "Gereksiz yere tarayıcıya inebilir — kaldır."
    );
  }

  // Bu her yerde felaket, yerelde bile.
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (secret) {
    for (const [ad, deger] of Object.entries(process.env)) {
      if (ad.startsWith("NEXT_PUBLIC_") && deger === secret) {
        sorunlar.push(`FELAKET: secret anahtar ${ad} içinde de duruyor. Tarayıcıya iner.`);
      }
    }
  }

  if (sorunlar.length > 0) {
    console.warn(
      `\nYAPILANDIRMA UYARISI (${sorunlar.length}):\n` +
        sorunlar.map((s) => `  - ${s}`).join("\n") +
        "\n"
    );
  }

  return sorunlar;
}
