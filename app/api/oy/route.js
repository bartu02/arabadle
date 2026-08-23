import { NextResponse } from "next/server";

import { LABELS } from "@/lib/game";
import { UUID, burstOk, clientIp, ipKey, sameOrigin } from "@/lib/security";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { pickHighlight, summarise } from "@/lib/votes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Postgres: unique constraint ihlali.
const DUPLICATE = "23505";

// Geçerli bir gövde ~200 bayt. Üstünü okumaya bile gerek yok.
const MAX_BODY = 2048;

/**
 * Hız sınırı politikası.
 *
 * Saldırganın amacı belli bir üçlünün yüzdesini kaydırmak, o yüzden iki
 * boyut var: IP'nin toplam hızı ve IP'nin **tek bir üçlüye** olan hızı.
 * İkincisi asıl kalkan — 16 turluk bir oyunda insan aynı üçlüyü bir kez
 * görür, saldırgan yüzlerce kez görmek ister.
 *
 * Sayılar bilerek cömert: mobil operatörlerde ve okul ağlarında yüzlerce
 * kişi tek IP'nin arkasında olabiliyor, masum kullanıcıyı kilitlemek
 * saldırganı biraz yavaşlatmaktan daha kötü.
 *
 * Bunun neyi çözmediği açık olsun: elinde vekil sunucu havuzu olan biri
 * IP değiştirerek yine oy şişirebilir. Anonim, hesapsız bir oylamada bunun
 * tam çözümü yok; buradaki sınırlar tek makineden yazılan script'i ve
 * gelişigüzel seli durdurur.
 */
const BURST = { limit: 15, windowMs: 10_000 };           // süreç içi, bedava
const PER_IP = { limit: 120, windowSeconds: 600 };       // IP'nin toplam hızı
const PER_IP_TRIO = { limit: 10, windowSeconds: 3600 };  // IP -> tek üçlü

/**
 * Dışarıya yalnızca makine kodu döner, hiç ayrıntı vermez.
 *
 * Eskiden Postgres'in hata metni olduğu gibi geçiyordu; şema hakkında
 * bilgi sızdırıyordu. Gerçek sebep sunucu loguna yazılır, istemci zaten
 * hepsini tek satır uyarıya çeviriyor (GameBoard -> reveal.error).
 */
function fail(status, code, extra) {
  return NextResponse.json({ error: code }, { status, headers: extra });
}

async function rateOk(supabase, ipHash, trioId) {
  const rpc = await supabase.rpc("rate_hit", {
    p_buckets: [`ip:${ipHash}`, `trio:${ipHash}:${trioId}`],
    p_limits: [PER_IP.limit, PER_IP_TRIO.limit],
    p_windows: [PER_IP.windowSeconds, PER_IP_TRIO.windowSeconds],
  });

  if (rpc.error) {
    // 0002_rate_limit.sql henüz çalıştırılmadıysa burası hata verir.
    // Oyunu kilitlemek yerine geçiyoruz: süreç içi fren hâlâ ayakta.
    console.error("rate_hit yok, veritabanı sayacı devre dışı:", rpc.error.message);
    return true;
  }

  return rpc.data !== false;
}

/**
 * Bir turun üç oyunu kaydeder ve o üçlünün güncel dağılımını döndürür.
 *
 * Yüzde hesabı burada yapılır, client'ta değil (SPEC 10). Açık uçlu bir
 * endpoint olduğu için gövde baştan sona doğrulanır: arabaların gerçekten
 * o üçlüye ait olduğu da kontrol edilir.
 *
 * Bu, veritabanına yazan **tek** yol: anon rolün votes tablosunda insert
 * yetkisi yok, yani Supabase'e doğrudan gidilemiyor. Bütün kısıtlar burada.
 */
export async function POST(request) {
  // Basit form POST'u application/json gönderemez; bu kontrol tarayıcıdan
  // gelen siteler arası isteği daha kapıda eler.
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return fail(415, "unsupported_media_type");
  }

  if (!sameOrigin(request)) return fail(403, "forbidden");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) return fail(413, "too_large");

  const ipHash = ipKey(clientIp(request));

  if (!burstOk(ipHash, BURST.limit, BURST.windowMs)) {
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

  const { trioId, sessionId, votes } = payload ?? {};

  if (!UUID.test(trioId ?? "")) return fail(400, "invalid_request");

  // Yazarken UUID şart: istemci zaten crypto.randomUUID() üretiyor, serbest
  // metne izin vermenin bir faydası yok ve tabloya ne geldiğini daraltıyor.
  if (!UUID.test(sessionId ?? "")) return fail(400, "invalid_request");

  if (!Array.isArray(votes) || votes.length !== 3) return fail(400, "invalid_request");

  const labels = votes.map((vote) => vote?.label);
  const itemIds = votes.map((vote) => vote?.itemId);

  if (new Set(labels).size !== 3 || labels.some((l) => !LABELS.includes(l))) {
    return fail(400, "invalid_request");
  }

  if (new Set(itemIds).size !== 3 || itemIds.some((id) => !UUID.test(id ?? ""))) {
    return fail(400, "invalid_request");
  }

  const supabase = getSupabaseServerClient();

  if (!(await rateOk(supabase, ipHash, trioId))) {
    return fail(429, "rate_limited", { "Retry-After": "600" });
  }

  const trio = await supabase
    .from("trios")
    .select("id, item_a_id, item_b_id, item_c_id")
    .eq("id", trioId)
    .maybeSingle();

  if (trio.error) {
    console.error("Üçlü okunamadı:", trio.error.message);
    return fail(500, "server_error");
  }
  if (!trio.data) return fail(404, "not_found");

  const belongs = new Set([
    trio.data.item_a_id,
    trio.data.item_b_id,
    trio.data.item_c_id,
  ]);

  if (itemIds.some((id) => !belongs.has(id))) return fail(400, "invalid_request");

  // Tek INSERT, üç satır: ya hepsi girer ya hiçbiri.
  // Aynı session aynı üçlüye ikinci kez oy veremez — çakışma hata değil,
  // sadece yeni satır eklenmez, kullanıcı yine dağılımı görür.
  const insert = await supabase.from("votes").insert(
    votes.map((vote) => ({
      trio_id: trioId,
      item_id: vote.itemId,
      label: vote.label,
      session_id: sessionId,
    }))
  );

  if (insert.error && insert.error.code !== DUPLICATE) {
    console.error("Oy yazılamadı:", insert.error.message);
    return fail(500, "server_error");
  }

  const rows = await supabase
    .from("votes")
    .select("item_id, label")
    .eq("trio_id", trioId);

  if (rows.error) {
    console.error("Oylar sayılamadı:", rows.error.message);
    return fail(500, "server_error");
  }

  const stats = summarise(rows.data ?? [], [...belongs]);

  // Öne çıkan satır da burada seçilir; client hazır sonucu alır.
  const ownLabels = Object.fromEntries(
    votes.map((vote) => [vote.itemId, vote.label])
  );

  return NextResponse.json(
    { stats, highlight: pickHighlight(stats, ownLabels) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
