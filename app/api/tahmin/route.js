import { NextResponse } from "next/server";

import { gununCevabi, tumArabalar } from "@/lib/klasik-sunucu";
import { bugununNumarasi, hepsiTam, karsilastir, kazandiMi } from "@/lib/klasik";
import { burstOk, clientIp, ipKey, sameOrigin } from "@/lib/security";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 512;
const SLUG = /^[a-z0-9-]{1,64}$/;

/**
 * Hız sınırı politikası.
 *
 * /api/oy'dan farklı bir tehdit var burada. Orada saldırgan **veriyi
 * bozuyor** (oy şişirme), o yüzden sınırlar dar. Burada kazanılabilecek
 * tek şey günün cevabını erkenden öğrenmek — 210 arabayı sırayla deneyen
 * biri kendi oyununu bozar, başka kimseninkini değil. Ortada bozulacak
 * ortak veri yok; oyun hiçbir şey yazmıyor, stateless.
 *
 * Dolayısıyla asıl mesele bedava işlem gücü harcatmak. Sınırlar buna göre:
 * saniyelik seli kesecek kadar sıkı, gerçek oyuncuyu (günde 3-15 tahmin)
 * hiç görmeyecek kadar geniş.
 *
 * Kova adı `t:` ile başlıyor — /api/oy'un kovasıyla karışmasın, birinde
 * yavaşlayan oyuncu öbüründe kilitlenmesin.
 */
const BURST = { limit: 15, windowMs: 10_000 };
const PER_IP = { limit: 200, windowSeconds: 3600 };

function fail(status, code, extra) {
  return NextResponse.json({ error: code }, { status, headers: extra });
}

async function rateOk(supabase, ipHash) {
  const rpc = await supabase.rpc("rate_hit", {
    p_buckets: [`tahmin:${ipHash}`],
    p_limits: [PER_IP.limit],
    p_windows: [PER_IP.windowSeconds],
  });

  if (rpc.error) {
    // 0002_rate_limit.sql çalıştırılmadıysa burası hata verir. Oyunu
    // kilitlemek yerine geçiyoruz; süreç içi fren hâlâ ayakta.
    console.error("rate_hit yok, veritabanı sayacı devre dışı:", rpc.error.message);
    return true;
  }

  return rpc.data !== false;
}

/**
 * Bir tahmini değerlendirir.
 *
 * Karşılaştırma **burada** yapılıyor, istemcide değil. Cevabı props'la
 * göndermek sayfanın RSC yüküne düşürüyor ve düz metin olarak
 * okunabiliyor; istemciye yalnızca renkler iniyor.
 *
 * Gün numarası da sunucudan geliyor, gövdeden okunmuyor: istemcinin
 * istediği günü sorabilmesi yarınki bulmacayı bugünden çözmek demekti.
 * Dönen numara istemcinin gün değişimini fark etmesi için.
 */
export async function POST(request) {
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return fail(415, "unsupported_media_type");
  }

  if (!sameOrigin(request)) return fail(403, "forbidden");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) return fail(413, "too_large");

  const ipHash = ipKey(clientIp(request));

  if (!burstOk(`t:${ipHash}`, BURST.limit, BURST.windowMs)) {
    return fail(429, "rate_limited", { "Retry-After": "10" });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, "too_large");

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_request");
  }

  const slug = payload?.slug;
  if (typeof slug !== "string" || !SLUG.test(slug)) return fail(400, "invalid_request");

  const supabase = getSupabaseServerClient();

  if (!(await rateOk(supabase, ipHash))) {
    return fail(429, "rate_limited", { "Retry-After": "3600" });
  }

  const numara = bugununNumarasi();

  let arabalar;
  let cevap;
  try {
    arabalar = await tumArabalar(supabase);
    cevap = await gununCevabi(supabase, numara);
  } catch (error) {
    console.error("Klasik verisi okunamadı:", error.message);
    return fail(500, "server_error");
  }

  if (!cevap) return fail(500, "server_error");

  const tahmin = arabalar.find((a) => a.slug === slug);
  if (!tahmin) return fail(404, "not_found");

  const sonuc = karsilastir(tahmin, cevap);
  const dogru = kazandiMi(tahmin.slug, cevap.slug);

  const govde = {
    numara,
    slug: tahmin.slug,
    ad: tahmin.name,
    sonuc,
    dogru,
    // Altı kutu da yeşil ama araba bu değil: yedi alanda birebir aynı üç
    // araba çifti var (911 / Cayman GT4 gibi). Arayüz bunu ayrıca söylüyor,
    // yoksa oyuncu ekranı bozuk sanıyor.
    ikiz: !dogru && hepsiTam(sonuc),
  };

  if (dogru) {
    govde.cevap = {
      ad: cevap.name,
      yil: cevap.year_label,
      gorsel: cevap.image_url,
      atif: cevap.image_credit,
    };
  }

  return NextResponse.json(govde, { headers: { "Cache-Control": "no-store" } });
}
