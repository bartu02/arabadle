"use client";

import { useEffect, useState } from "react";

import { gunSonunaKalan, sureMetni } from "@/lib/klasik";
import { oku } from "@/lib/klasik-depo";
import { t } from "@/lib/i18n";

/**
 * Ana sayfanın gün şeridi: bugünün bulmaca numarası, serin ve yeni güne
 * kalan süre.
 *
 * Günlük oyunların "yarın gel" kancası bu. Önceki hâlinde geri sayım
 * yalnızca Klasik'i kazandıktan sonra görünüyordu, yani oyunu bitirmeyen
 * kimse sitenin her gün yenilendiğini öğrenemiyordu.
 *
 * Süre ve seri istemcide okunuyor (biri saate, diğeri localStorage'a
 * bağlı), o yüzden ilk render'da yoklar; numara sunucudan geliyor ve
 * hemen görünüyor.
 */
export default function GunSeridi({ numara }) {
  const [kalan, setKalan] = useState(null);
  const [seri, setSeri] = useState(0);

  useEffect(() => {
    setSeri(oku().seri ?? 0);

    const guncelle = () => setKalan(gunSonunaKalan());
    guncelle();
    // Dakika hassasiyeti yeter; saniye saymak sayfayı boşuna uyandırıyor.
    const sayac = setInterval(guncelle, 30_000);
    return () => clearInterval(sayac);
  }, []);

  return (
    <div
      data-gun-seridi=""
      className="flex flex-wrap items-center gap-x-5 gap-y-1 border-y border-line py-3.5 text-sm"
    >
      <span className="font-bold uppercase tracking-[0.16em] text-muted">
        {t("hub.today")}
      </span>
      <span data-gun-numara="" className="font-extrabold tabular-nums">
        {t("hub.puzzle", { n: numara })}
      </span>

      {seri > 1 && (
        <span data-gun-seri="" className="font-semibold tabular-nums text-hit">
          {t("hub.streakShort", { n: seri })}
        </span>
      )}

      {kalan !== null && (
        <span className="ml-auto tabular-nums text-muted">
          {t("hub.nextIn", { sure: sureMetni(kalan) })}
        </span>
      )}
    </div>
  );
}
