import { ImageResponse } from "next/og";

import { bugununNumarasi } from "@/lib/klasik";
import { t } from "@/lib/i18n";
import { OG_BOYUT, OG_RENK, OgCerceve, OgKutuSeridi, OgWordmark } from "@/lib/og";

export const size = OG_BOYUT;
export const contentType = "image/png";
export const alt = t("modes.classic.title");

// Kart günün numarasını taşıyor, yani her gün değişmeli — build anında
// dondurulursa bir hafta sonra "Bulmaca #2" yazmaya devam eder.
export const dynamic = "force-dynamic";

/**
 * Klasik'in paylaşım kartı.
 *
 * Sonucu kopyalayan oyuncu metnin sonuna /klasik linkini de koyuyor
 * (bkz. KlasikBoard → paylas). Linki gören kişi kartta günün numarasını
 * ve altı kutuyu görüyor: cevap sızmadan oyunun ne olduğu anlaşılıyor.
 */
export default function Image() {
  return new ImageResponse(
    (
      <OgCerceve>
        <OgWordmark ad={t("app.title")} boyut={44} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
            <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -3 }}>
              {t("modes.classic.title")}
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, color: OG_RENK.muted }}>
              {t("klasik.puzzle", { n: bugununNumarasi() })}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 40, color: OG_RENK.muted, marginTop: 18 }}>
            {t("klasik.tagline")}
          </div>
        </div>

        <OgKutuSeridi boy={70} aralik={14} />
      </OgCerceve>
    ),
    size
  );
}
