import "server-only";

import { createHash } from "node:crypto";

/**
 * Sunucu tarafı güvenlik yardımcıları.
 *
 * Tehdit modeli: hesap yok, kişisel veri yok, ödeme yok. Saldırganın
 * kazanabileceği tek şey **oy şişirmek** — kalabalık yüzdesi oyunun tek
 * gerçek verisi. İkinci sırada bedava işlem gücü harcatmak var.
 *
 * Tek yazma yolu /api/oy. Anon rolün votes tablosunda ne okuma ne yazma
 * yetkisi olduğu için (bkz. 0001_init.sql) saldırgan Supabase'e doğrudan
 * gidemiyor; bütün trafik bu kapıdan geçmek zorunda. Sınırlar burada.
 */

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Okuma tarafındaki oturum kimliği.
 *
 * Yazarken UUID şart (aşağıya bak) ama tabloda UUID olmayan bir eski satır
 * var (`dfa7bb72-kurtarilan-oturum`). Onun sonuç sayfası çalışmaya devam
 * etsin diye okuma tarafı biraz gevşek — yine de karakter kümesi ve uzunluk
 * kapalı, yani PostgREST filtresine sürpriz bir şey gitmiyor.
 */
export const SAFE_SESSION_ID = /^[0-9a-zA-Z-]{8,64}$/;

/**
 * İstemcinin IP'si — hız sınırının dayandığı tek şey.
 *
 * Buradaki asıl mesele **hangi başlığa güvenileceği**. İstemci istediği
 * başlığı yazabilir; yanlış olana güvenilirse saldırgan her istekte kendine
 * taze bir kova açar ve sınır hiçbir işe yaramaz. (Yerelde denendi:
 * `X-Forwarded-For`'u değiştirmek gerçekten yeni kova açıyordu.)
 *
 * Bu yüzden güven açık bir kurala bağlı, sıralı tahmine değil:
 *
 * - **Vercel'de** yalnızca `x-vercel-forwarded-for` okunur. Bu başlığı
 *   platform yazar, istemci gönderse de ezilir. Yoksa IP bilinmiyor sayılır;
 *   istemcinin yazdığı `x-real-ip`'e **düşülmez** — düşmek, atlatmanın
 *   kapısını açık bırakmak olurdu.
 * - **Vercel dışında** başlıklar ancak `TRUST_PROXY_HEADERS=1` verilmişse
 *   okunur. Yani önünde bu başlıkları ezen bir proxy olduğunu açıkça
 *   söylemen gerekiyor.
 * - Hiçbiri yoksa herkes tek kovada toplanır. Güvenli taraf bu: sınır fazla
 *   sıkı çalışır ama atlatılamaz. Loga uyarı düşer.
 */
let ipUyarisiVerildi = false;

function uyar(mesaj) {
  if (ipUyarisiVerildi) return;
  ipUyarisiVerildi = true;
  console.warn(`UYARI: ${mesaj} Hız sınırı bütün ziyaretçileri tek kovada topluyor.`);
}

export function clientIp(request) {
  const ilk = (deger) => deger.split(",")[0].trim();

  if (process.env.VERCEL) {
    const platform = request.headers.get("x-vercel-forwarded-for");
    if (platform) return ilk(platform);
    uyar("Vercel'de x-vercel-forwarded-for başlığı yok.");
    return "bilinmiyor";
  }

  if (process.env.TRUST_PROXY_HEADERS === "1") {
    const real = request.headers.get("x-real-ip");
    if (real) return real.trim();

    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return ilk(forwarded);

    uyar("TRUST_PROXY_HEADERS açık ama proxy başlığı gelmiyor.");
    return "bilinmiyor";
  }

  uyar("Vercel dışında çalışıyorsun ve TRUST_PROXY_HEADERS ayarlı değil.");
  return "bilinmiyor";
}

/**
 * IP'yi olduğu gibi saklamıyoruz: hız sınırı tablosuna tek yönlü özet
 * giriyor. Sayaç tutmak için yeterli, kimseyi tanımlamak için değil.
 *
 * Tuz secret anahtardan türüyor — yüksek entropili ve sunucudan hiç
 * çıkmıyor. Sabit bir tuz olsaydı IPv4 uzayının tamamı önceden
 * hesaplanabilirdi.
 */
const SALT =
  process.env.IP_HASH_SALT || process.env.SUPABASE_SECRET_KEY || "yerel-gelistirme";

export function ipKey(ip) {
  return createHash("sha256").update(`${SALT}:${ip}`).digest("base64url").slice(0, 22);
}

/**
 * Aynı siteden mi geliyor?
 *
 * Tarayıcı bu başlıkları kendi yazar ve JavaScript ile değiştirilemez, yani
 * başka bir siteden gelen isteği kesin ayırır. curl her başlığı taklit
 * edebilir — bu kontrol CSRF'i ve gelişigüzel script'i eler, asıl kalkan
 * aşağıdaki hız sınırı.
 */
export function sameOrigin(request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true; // başlık yoksa karar veremeyiz, hız sınırına bırak

  try {
    return new URL(origin).host === (request.headers.get("host") ?? "");
  } catch {
    return false;
  }
}

/**
 * Süreç içi patlama freni.
 *
 * Serverless'ta her örneğin kendi hafızası var, yani bu tek başına
 * güvenilmez — asıl sayaç veritabanında (bkz. 0002_rate_limit.sql). Bunun
 * işi bedava olması: art arda gelen saniyelik seli veritabanına hiç
 * dokunmadan kesiyor.
 */
const BUCKET_CAP = 5000; // sınırsız büyüyen Map'in kendisi bir DoS yoludur
const burst = new Map();

export function burstOk(key, limit, windowMs) {
  const now = Date.now();

  if (burst.size > BUCKET_CAP) {
    for (const [k, v] of burst) if (v.until <= now) burst.delete(k);
    if (burst.size > BUCKET_CAP) burst.clear();
  }

  const row = burst.get(key);
  if (!row || row.until <= now) {
    burst.set(key, { hits: 1, until: now + windowMs });
    return true;
  }

  row.hits += 1;
  return row.hits <= limit;
}
