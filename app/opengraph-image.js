import { ImageResponse } from "next/og";

import { t } from "@/lib/i18n";
import { OG_BOYUT, OG_RENK, OgCerceve, OgKutuSeridi } from "@/lib/og";

export const size = OG_BOYUT;
export const contentType = "image/png";
export const alt = t("app.title");

/**
 * Sitenin paylaşım kartı.
 *
 * Bu yoktu: arabadle.vercel.app'i WhatsApp'a ya da X'e yapıştıran biri
 * çıplak bir link görüyordu. Paylaşımla büyüyen bir oyunda ön kapının
 * görselsiz olması en pahalı eksikti.
 */
export default function Image() {
  return new ImageResponse(
    (
      <OgCerceve>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 30 }}
          >
            <div style={{ width: 84, height: 84, background: OG_RENK.brand }} />
            <div style={{ fontSize: 136, fontWeight: 800, letterSpacing: -4 }}>
              {t("app.title")}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 46, color: OG_RENK.muted, marginTop: 26 }}>
            {t("app.tagline")}
          </div>
        </div>

        <OgKutuSeridi boy={70} aralik={14} />
      </OgCerceve>
    ),
    size
  );
}
