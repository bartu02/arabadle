"use client";

import { useEffect, useState } from "react";

import { ALANLAR, DURUM } from "@/lib/klasik";
import { t } from "@/lib/i18n";

/**
 * Bir tahminin altı kutusu.
 *
 * Tailwind dinamik sınıf adı üretemiyor, üç durumun stili açıkça yazılı.
 * Tutmayan kutu dolu değil çerçeveli: dolu koyu gri sayfa zeminine karşı
 * 1.49:1 kalıyordu, yani kutu olduğu görünmüyordu. Aynı çözüm etiket
 * düğmelerinde de kullanıldı (bkz. app/globals.css).
 */
const KUTU = {
  [DURUM.TAM]: "border-hit bg-hit text-bg",
  [DURUM.YAKIN]: "border-near bg-near text-bg",
  // Kırmızı yeşil ve sarıdan daha derin, üstüne açık yazı geliyor.
  // Gerekçe app/globals.css'te.
  [DURUM.UZAK]: "border-miss bg-miss text-ink",
};

const OK = { yukari: "▲", asagi: "▼" };

/** Kapalı sözlükten gelen değerlerin Türkçesi tr.json'da. */
function metin(alan, deger) {
  if (alan === "brand" || alan === "country" || alan === "year") return String(deger);
  return t(`klasik.${alan}.${deger}`);
}

export default function KlasikSatir({ tahmin, yeni = false }) {
  // Yalnızca yeni gelen satır bir kez içeri giriyor. SPEC 7 animasyonu
  // açılış anına sınırlıyor; bu da satırın açılışı. prefers-reduced-motion
  // açıkken globals.css geçişi kapattığı için satır anında beliriyor.
  const [girdi, setGirdi] = useState(!yeni);
  useEffect(() => {
    if (yeni) requestAnimationFrame(() => setGirdi(true));
  }, [yeni]);

  return (
    <li
      data-tahmin=""
      className={`transition-opacity duration-300 ease-out ${girdi ? "opacity-100" : "opacity-0"}`}
    >
      <p data-tahmin-ad="" className="mb-1.5 text-sm font-semibold text-ink">
        {tahmin.ad}
      </p>

      <div className="grid grid-cols-6 gap-1">
        {ALANLAR.map((alan) => {
          const kutu = tahmin.sonuc[alan];
          const ok = alan === "year" && kutu.yon ? OK[kutu.yon] : null;

          return (
            <div
              key={alan}
              data-kutu={alan}
              data-durum={kutu.durum}
              className={`flex min-h-14 flex-col items-center justify-center border px-1 py-2 text-center ${KUTU[kutu.durum]}`}
            >
              <span className="text-[10px] leading-tight font-medium break-words hyphens-auto sm:text-xs">
                {metin(alan, kutu.deger)}
              </span>
              {ok && (
                <span
                  className="text-xs leading-none sm:text-sm"
                  // Ok tek başına anlam taşıyor; ekran okuyucu da duysun.
                  aria-label={t(kutu.yon === "yukari" ? "klasik.newer" : "klasik.older")}
                  role="img"
                >
                  {ok}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </li>
  );
}
