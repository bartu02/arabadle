import { ImageResponse } from "next/og";

import { bugununNumarasi } from "@/lib/klasik";
import { t } from "@/lib/i18n";
import { OG_BOYUT, OG_RENK, OgCerceve, OgKutuSeridi } from "@/lib/og";

export const size = OG_BOYUT;
export const contentType = "image/png";
export const alt = t("app.title");

// Kart günün bulmaca numarasını taşıyor, yani her gün değişmeli — build
// anında dondurulursa bir hafta sonra "Bulmaca #2" yazmaya devam eder.
export const dynamic = "force-dynamic";

/**
 * Sitenin paylaşım kartı.
 *
 * Bu yoktu: adresi WhatsApp'a ya da X'e yapıştıran biri çıplak bir link
 * görüyordu. Paylaşımla büyüyen bir oyunda ön kapının görselsiz olması en
 * pahalı eksikti.
 *
 * Kök adres artık Klasik'in kendisi, o yüzden kart da bulmaca numarasını
 * ve altı kutuyu gösteriyor: linki gören cevap sızmadan oyunun ne
 * olduğunu anlıyor. (Eskiden bu kart `/klasik` altındaydı; o adres kök
 * adrese yönlendiği için buraya taşındı.)
 */
export default function Image() {
  return new ImageResponse(
    (
      <OgCerceve>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ width: 84, height: 84, background: OG_RENK.brand }} />
            <div style={{ fontSize: 128, fontWeight: 800, letterSpacing: -4 }}>
              {t("app.title")}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 44, color: OG_RENK.muted, marginTop: 24 }}>
            {`${t("klasik.tagline")} · ${t("klasik.puzzle", { n: bugununNumarasi() })}`}
          </div>
        </div>

        <OgKutuSeridi boy={70} aralik={14} />
      </OgCerceve>
    ),
    size
  );
}
