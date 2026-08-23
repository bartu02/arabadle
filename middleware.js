import { NextResponse } from "next/server";

/**
 * İçerik Güvenliği Politikası (CSP).
 *
 * Neden middleware: nonce her istekte yeniden üretilmeli, o yüzden statik
 * bir başlık dosyasına yazılamıyor. Next, isteğin üstündeki CSP başlığında
 * bir nonce görürse kendi ürettiği satır içi script'lere onu ekliyor —
 * yani 'unsafe-inline' vermeden çalışıyoruz.
 *
 * Uygulamanın bugün XSS yüzeyi yok (hiçbir yerde dangerouslySetInnerHTML,
 * eval veya kullanıcı HTML'i yok). CSP o yüzden bir yama değil, ileride
 * yanlışlıkla açılacak bir deliğin ağzını baştan kapatan ikinci kat.
 *
 * Sayfaların hepsi zaten force-dynamic olduğu için nonce'ın statik
 * üretimi bozması diye bir sorun yok.
 */
function contentSecurityPolicy(nonce, dev) {
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    // Siteyi başka bir sayfanın içine gömdürtmüyoruz (clickjacking).
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    // 'strict-dynamic': nonce'lı önyükleme script'i kendi parçalarını
    // yükleyebilsin diye. Next'in önerdiği kalıp bu.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // React'in style={{...}} nitelikleri nonce alamıyor; CSP'de satır içi
    // stil niteliği yalnızca 'unsafe-inline' ile geçiyor. Script'e kıyasla
    // düşük riskli ve HTML enjeksiyonu yüzeyi olmadığı için kabul edilebilir.
    "style-src 'self' 'unsafe-inline'",
    // Fotoğraflar public/arabalar altından, yani kendi domainimizden.
    // data: next/image'in bulanık yer tutucusu için.
    "img-src 'self' data:",
    // next/font fontları build'de indirip kendi domainimizden serve ediyor.
    "font-src 'self'",
    // Tarayıcı dışarıya hiç istek atmıyor: Supabase'e yalnızca sunucu gidiyor.
    dev ? "connect-src 'self' ws:" : "connect-src 'self'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCharCode(...bytes));

  const dev = process.env.NODE_ENV !== "production";
  const csp = contentSecurityPolicy(nonce, dev);

  // Next nonce'ı istek başlığından okuyor; yanıta da koymak gerekiyor ki
  // tarayıcı politikayı uygulasın.
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Statik dosyalar politikaya ihtiyaç duymuyor; middleware'i boşuna
    // çalıştırmamak için dışarıda bırakıldılar.
    "/((?!_next/static|_next/image|arabalar|favicon.ico|icon.svg|robots.txt).*)",
  ],
};
