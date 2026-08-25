"use client";

import { useEffect, useState } from "react";

import { oku } from "@/lib/klasik-depo";
import { t } from "@/lib/i18n";

/**
 * Ana sayfadaki mod kartının "bugün oynandı" rozeti.
 *
 * Hub'ı menü olmaktan çıkarıp panoya çeviren şey bu: LoLdle'da da her
 * modun yanında o günkü durum yazıyor ve oyuncu neyi bitirdiğini tek
 * bakışta görüyor.
 *
 * Şimdilik yalnızca Klasik'in günlük durumu var; Al, Sat, Yak günlük bir
 * bulmaca değil (istediğin paketi istediğin zaman oynuyorsun), o yüzden
 * orada gösterilecek bir "bugün" yok.
 */
export default function ModDurumu({ numara }) {
  const [bitti, setBitti] = useState(false);

  useEffect(() => {
    const kayit = oku();
    setBitti(kayit.numara === numara && kayit.cevap !== null);
  }, [numara]);

  if (!bitti) return null;

  return (
    <span
      data-mod-bitti=""
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-hit"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0 fill-none stroke-current stroke-[2.5]">
        <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {t("hub.done")}
    </span>
  );
}
