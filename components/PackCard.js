"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { t } from "@/lib/i18n";

// Varsayılan 8; listedeki ilk seçenek öne çıkar ve açılınca odağı alır.
const ROUND_OPTIONS = [
  { rounds: 8, hint: t("rounds.short") },
  { rounds: 16, hint: t("rounds.long") },
];

const LONGEST_GAME = Math.max(...ROUND_OPTIONS.map((option) => option.rounds));

export default function PackCard({ pack, index, open, onToggle, onClose }) {
  const defaultOptionRef = useRef(null);

  useEffect(() => {
    if (open) defaultOptionRef.current?.focus();
  }, [open]);

  const panelId = `paket-${pack.slug}`;
  const needsMixing = pack.trioCount < LONGEST_GAME;

  return (
    <div
      className={`border ${open ? "border-muted bg-surface" : "border-line bg-surface"}`}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="block w-full text-left -outline-offset-2 hover:bg-raised"
      >
        {/* Kapak. 16:9 kutuda object-cover yatayda neredeyse hiç kırpmıyor;
            fotoğraflar 1.33–1.85 aralığında, kayıp üstten-alttan oluyor. */}
        <span className="relative block aspect-[16/9] w-full overflow-hidden bg-bg">
          {pack.cover && (
            <Image
              src={pack.cover}
              alt=""
              fill
              sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          )}
          <span
            data-pack-index=""
            className="absolute left-0 top-0 bg-bg/90 px-2.5 py-1 text-xs font-bold tabular-nums"
          >
            {String(index).padStart(2, "0")}
          </span>
        </span>

        <span className="block p-5">
          <span className="flex items-baseline justify-between gap-3">
            <span
              data-pack-title=""
              className="text-xl font-extrabold leading-tight tracking-[-0.02em] sm:text-2xl"
            >
              {pack.title}
            </span>
            <span data-pack-count="" className="shrink-0 text-xs text-muted tabular-nums">
              {t("home.trioCount", { count: pack.trioCount })}
            </span>
          </span>
          <span data-pack-desc="" className="mt-2 block text-sm leading-snug text-muted">
            {pack.description}
          </span>
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-line px-5 py-5">
          <p className="mb-3 text-sm text-muted">{t("rounds.question")}</p>

          <div className="flex flex-wrap items-center gap-2.5">
            {ROUND_OPTIONS.map((option, optionIndex) => (
              <Link
                key={option.rounds}
                ref={optionIndex === 0 ? defaultOptionRef : null}
                href={`/al-sat-yak/${pack.slug}?tur=${option.rounds}`}
                className={
                  optionIndex === 0
                    ? "bg-ink px-5 py-2.5 text-sm font-semibold text-bg -outline-offset-2 focus-visible:outline-bg"
                    : "border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-muted"
                }
              >
                {t("rounds.count", { count: option.rounds })}{" "}
                <span className="opacity-60">{option.hint}</span>
              </Link>
            ))}
          </div>

          {needsMixing && (
            <p className="mt-4 text-sm text-muted">
              {t("home.mixedNote", { count: pack.trioCount })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
