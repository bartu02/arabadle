"use client";

import { useEffect, useRef } from "react";

import { t } from "@/lib/i18n";

/**
 * Küçük bir diyalog penceresi.
 *
 * Tarayıcının kendi `<dialog>`'u kullanılıyor: odak tuzağı, Esc ile
 * kapanma, arka planın erişilemez olması ve `aria-modal` bedava geliyor.
 * Bunu elle yazmak ya da bir kütüphane kurmak (CLAUDE.md: bağımlılık
 * ekleme) gereksizdi.
 *
 * Arka plan `backdrop:` varyantıyla boyanıyor — Tailwind v4 `::backdrop`
 * sözde elemanını destekliyor, yani ayrı bir CSS dosyası gerekmiyor.
 */
export default function Modal({ acik, onKapat, baslik, children, etiket }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (acik && !d.open) d.showModal();
    if (!acik && d.open) d.close();
  }, [acik]);

  return (
    <dialog
      ref={ref}
      data-modal={etiket}
      onClose={onKapat}
      // Boşluğa tıklayınca kapansın: tıklama hedefi diyaloğun kendisiyse
      // (yani içerik kutusunun dışıysa) arka plana basılmış demektir.
      onClick={(olay) => {
        if (olay.target === ref.current) onKapat();
      }}
      // m-auto şart: tarayıcı <dialog>'u margin:auto ile ortalıyor, Tailwind'in
      // preflight'i bütün marginleri sıfırlayınca pencere sol üste yapışıyordu.
      className="m-auto w-[min(30rem,calc(100vw-2rem))] border border-line bg-surface p-0 text-ink backdrop:bg-bg/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <h2 className="text-lg font-extrabold tracking-[-0.02em]">{baslik}</h2>
        <button
          type="button"
          onClick={onKapat}
          data-modal-kapat=""
          aria-label={t("klasik.close")}
          className="-m-1 shrink-0 p-1 text-muted transition-colors hover:text-ink -outline-offset-2"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-5 fill-none stroke-current stroke-2">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}
