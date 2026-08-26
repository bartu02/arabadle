/**
 * Bütün yanıtlara giden güvenlik başlıkları.
 *
 * CSP burada değil, middleware.js'te: nonce her istekte değişiyor.
 * Buradakiler sabit, o yüzden statik dosyalar dahil her şeyi kapsıyor.
 */
const securityHeaders = [
  // Tarayıcı Content-Type'ı tahmin etmeye çalışmasın. Fotoğraf diye
  // sunulan bir dosyanın script gibi çalıştırılmasını engeller.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // CSP'deki frame-ancestors bunun modern hali; eski tarayıcılar için duruyor.
  { key: "X-Frame-Options", value: "DENY" },

  // Dışarı çıkan linklerde tam adres sızmasın; sonuç sayfası paylaşım
  // linkinde oturum kimliği taşıyor.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Oyun hiçbirine dokunmuyor. Kapalı doğmaları, sonradan bir bağımlılığın
  // sessizce açmasından iyi.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), display-capture=(), " +
      "encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), " +
      "magnetometer=(), microphone=(), midi=(), payment=(), " +
      "picture-in-picture=(), publickey-credentials-get=(), " +
      "screen-wake-lock=(), usb=(), xr-spatial-tracking=()",
  },

  // HTTPS'e kilitle. preload YOK: o liste geri alması zor bir taahhüt ve
  // özel bir alan adında HTTPS'i olmayan bir alt alanı kırabilir.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },

  // Sayfa kendi tarayıcı süreç grubunda kalsın (Spectre sınıfı sızıntılar).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Klasik eskiden /klasik idi, artik kok adres.
   *
   * Kalici (308): arama motoru tek adres gorsun ve paylasilmis eski
   * linkler calismaya devam etsin. Kalici yonlendirme tarayicida sert
   * onbellege aliniyor — geri almak gerekirse tarayici onbellegi
   * temizlenmeli. Site yeni ve /klasik hicbir yerde indekslenmedigi
   * icin bedeli simdi en dusuk.
   */
  async redirects() {
    return [{ source: "/klasik", destination: "/", permanent: true }];
  },
  // "X-Powered-By: Next.js" başlığı kimseye fayda sağlamıyor, sadece
  // hangi sürümün açıklarını deneyeceğini söylüyor.
  poweredByHeader: false,

  // Araba fotoğrafları artık public/arabalar/ altında, projeyle birlikte
  // geliyor. Dışarıdan tek bir görsel bile çekilmediği için remotePatterns
  // boş: hiçbir uzak host'a izin yok, site görsel proxy'si olarak
  // kullanılamaz. Uzak bir kaynak gerekirse host'u buraya tek tek ekle.
  images: {
    remotePatterns: [],
    // SVG bir script taşıyabilir; hiç ihtiyacımız yok, kapalı kalsın.
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
