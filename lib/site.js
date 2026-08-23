/**
 * Paylaşılan linkler ve Open Graph etiketleri mutlak URL istiyor.
 * Vercel'de otomatik gelir; yerelde localhost'a düşer.
 */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
