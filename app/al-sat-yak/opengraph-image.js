import { ImageResponse } from "next/og";

import { LABELS } from "@/lib/game";
import { t } from "@/lib/i18n";
import { OG_BOYUT, OG_RENK, OgCerceve, OgWordmark } from "@/lib/og";

export const size = OG_BOYUT;
export const contentType = "image/png";
export const alt = t("modes.poll.title");

const ETIKET_RENGI = { buy: OG_RENK.buy, sell: OG_RENK.sell, burn: OG_RENK.burn };

/**
 * Al, Sat, Yak'ın paylaşım kartı.
 *
 * Bu dosya yalnızca güzellik için değil, bir hatayı kapatıyor: sayfa kendi
 * `openGraph` bloğunu tanımlayınca Next kök segmentten miras gelen görseli
 * düşürüyor. Ölçüldü — `/atif` (kendi openGraph'ı yok) kök kartı
 * alıyordu, `/al-sat-yak` ve paket sayfaları **hiç görselsiz** kalmıştı.
 * Kendi kartını tanımlamak hem boşluğu dolduruyor hem alt segmentlere
 * (paket sayfaları) miras kalıyor.
 *
 * Satori tuzağı: birden fazla çocuğu olan div'de `display: flex` şart.
 */
export default function Image() {
  return new ImageResponse(
    (
      <OgCerceve>
        <OgWordmark ad={t("app.title")} boyut={44} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Modun işareti: üç etiket kendi renginde. Kartı gören renk
              kodunu oynamadan öğreniyor (SPEC 7). */}
          <div style={{ display: "flex", fontSize: 132, fontWeight: 800, letterSpacing: -3 }}>
            {LABELS.map((label, i) => (
              <div key={label} style={{ display: "flex" }}>
                <div style={{ color: ETIKET_RENGI[label] }}>{t(`labels.${label}`)}</div>
                {i < LABELS.length - 1 && (
                  <div style={{ color: OG_RENK.muted, paddingRight: 40 }}>,</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 40, color: OG_RENK.muted, marginTop: 22 }}>
            {t("alSatYak.tagline")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {LABELS.map((label) => (
            <div key={label} style={{ width: 112, height: 16, background: ETIKET_RENGI[label] }} />
          ))}
        </div>
      </OgCerceve>
    ),
    size
  );
}
