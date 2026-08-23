"use client";

import { useEffect, useState } from "react";

import { LABELS } from "@/lib/game";
import { t } from "@/lib/i18n";

// Tailwind dinamik sınıf üretemez; üç etiketin stili açıkça yazılı.
// Seçili etiket oy ekranındaki dolu düğmeyle aynı görünür — kullanıcı
// "dolu = benim seçimim" ilişkisini zaten kurmuş oluyor.
const CHIP = {
  buy: { mine: "bg-buy text-bg", other: "text-buy" },
  sell: { mine: "bg-sell text-bg", other: "text-sell" },
  burn: { mine: "bg-burn text-bg", other: "text-burn" },
};

const FILL = { buy: "bg-buy", sell: "bg-sell", burn: "bg-burn" };

export default function RevealBars({ stat, ownLabel }) {
  // Çubuklar sıfırdan dolsun. Ürünün tek animasyonu bu (SPEC 7);
  // prefers-reduced-motion globals.css'te geçişleri zaten kapatıyor.
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Eşiğin altında da bir şey göster. Eskiden burası tek satır "Henüz
  // yeterli oy yok" idi ve pratikte HER kart öyle görünüyordu — oyunun tek
  // fikri hiç çalışmıyordu. SPEC'in yasakladığı şey uydurma yüzde; ham sayı
  // yuvarlama içermiyor, "3 kişi Al dedi" olgu.
  if (!stat?.enough) {
    const counts = stat?.counts;
    const toplam = stat?.total ?? 0;

    // Tek oy varsa o oy kullanıcının kendisininki; sayı dökmenin anlamı yok.
    if (!counts || toplam <= 1) {
      return <p className="py-4 text-sm text-muted">{t("reveal.firstVote")}</p>;
    }

    return (
      <div className="py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LABELS.map((label) => (
            <span key={label} className="flex items-baseline gap-1.5 text-sm">
              <span
                className={`font-extrabold ${
                  ownLabel === label ? CHIP[label].mine + " px-1.5 py-0.5" : CHIP[label].other
                }`}
              >
                {t(`labels.${label}`)}
                {ownLabel === label && (
                  <span className="sr-only"> — {t("reveal.yourPick")}</span>
                )}
              </span>
              <span className="font-semibold tabular-nums text-ink">{counts[label]}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          {t("reveal.tooFewForPercent", { total: toplam })}
        </p>
      </div>
    );
  }

  return (
    <div>
      {LABELS.map((label) => {
        const percent = stat.percents[label];
        const mine = ownLabel === label;

        return (
          <div key={label} className="flex items-center gap-3 py-1">
            <span
              className={`w-12 shrink-0 px-1.5 py-1 text-center text-sm font-extrabold ${
                mine ? CHIP[label].mine : CHIP[label].other
              }`}
            >
              {t(`labels.${label}`)}
              {mine && <span className="sr-only"> — {t("reveal.yourPick")}</span>}
            </span>

            <span className="h-2.5 flex-1 bg-surface">
              <span
                className={`block h-full ${FILL[label]} transition-[width] duration-500 ease-out`}
                style={{ width: filled ? `${percent}%` : "0%" }}
              />
            </span>

            <span className="w-11 shrink-0 text-right text-sm font-semibold text-ink tabular-nums">
              %{percent}
            </span>
          </div>
        );
      })}

      <p className="mt-3 text-sm font-medium text-muted">
        {t("reveal.crowd", { label: t(`labels.${stat.top}`) })}
      </p>
    </div>
  );
}
