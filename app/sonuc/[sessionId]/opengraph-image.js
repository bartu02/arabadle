import { ImageResponse } from "next/og";

import { LABELS } from "@/lib/game";
import { t } from "@/lib/i18n";
import { buildResult } from "@/lib/result";
import { SAFE_SESSION_ID } from "@/lib/security";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Al, Sat, Yak";

const BG = "#0b0b0d";
const INK = "#f4f4f6";
const MUTED = "#8e8e99";
const BUY = "#3ddc84";
const SELL = "#f5b544";
const BURN = "#ff4d3d";
const LABEL_COLOR = { buy: BUY, sell: SELL, burn: BURN };

async function load(sessionId) {
  // Bu rota kimlik doğrulamasız ve pahalı: her istek bir PNG çiziyor.
  // Biçimi tutmayan kimlikte veritabanına hiç gitmeden geri dönüyoruz;
  // marka görseli yine çıkıyor, sadece sorgu yapılmıyor.
  if (!SAFE_SESSION_ID.test(sessionId ?? "")) return null;

  const supabase = getSupabaseServerClient();

  const mine = await supabase
    .from("votes")
    .select("trio_id, item_id, label")
    .eq("session_id", sessionId);

  if (mine.error || !mine.data?.length) return null;

  const trioIds = [...new Set(mine.data.map((vote) => vote.trio_id))];
  const crowd = await supabase
    .from("votes")
    .select("trio_id, item_id, label")
    .in("trio_id", trioIds);

  if (crowd.error) return null;

  return buildResult(mine.data, crowd.data ?? []);
}

export default async function Image({ params }) {
  const { sessionId } = await params;

  let result = null;
  try {
    result = await load(sessionId);
  } catch {
    result = null;
  }

  // Yeterli oy yoksa gösterilecek bir sayı yok; o zaman kahraman
  // sayının yerini renkli marka alır ve altta tekrar edilmez.
  const hasNumber = Boolean(result) && result.agreement !== null;

  // Metinler tek düğüm olarak veriliyor: satori, birden fazla çocuğu olan
  // bir div'de açık display:flex istiyor, yoksa isteği hata ile bitiriyor.

  const sub = hasNumber
    ? `${t("result.agreement")} · ${t("result.roundCount", { rounds: result.rounds })}`
    : t("app.tagline");

  const wordmark = (fontSize) => (
    <div style={{ display: "flex", fontSize, fontWeight: 700 }}>
      {LABELS.map((label, index) => (
        <div key={label} style={{ display: "flex" }}>
          <div style={{ color: LABEL_COLOR[label] }}>{t(`labels.${label}`)}</div>
          {index < LABELS.length - 1 && (
            <div style={{ color: MUTED, paddingRight: fontSize * 0.3 }}>,</div>
          )}
        </div>
      ))}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          color: INK,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ width: 40, height: 120, background: BUY }} />
          <div style={{ width: 40, height: 120, background: SELL }} />
          <div style={{ width: 40, height: 120, background: BURN }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {hasNumber ? (
            <div style={{ fontSize: 190, fontWeight: 700, lineHeight: 1 }}>
              {`%${result.agreement}`}
            </div>
          ) : (
            wordmark(110)
          )}
          <div style={{ fontSize: 40, color: MUTED, marginTop: 20 }}>{sub}</div>
        </div>

        {/* Sayı varsa marka altta durur; yoksa yukarıda zaten kahraman. */}
        {hasNumber ? wordmark(34) : <div />}
      </div>
    ),
    size
  );
}
