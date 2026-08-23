"use client";

import Image from "next/image";

import RevealBars from "./RevealBars";
import { LABELS } from "@/lib/game";
import { t } from "@/lib/i18n";

// Tailwind dinamik sınıf adı üretemez, üç etiketin stili açıkça yazılı.
const LABEL_STYLES = {
  // off'taki hover/focus kenarlığı, dolgunun kaplamadığı 1px'lik çerçeveyi
  // de tam renge çekiyor: önizleme seçili hâlin birebir kopyası oluyor.
  buy: {
    on: "border-buy bg-buy text-bg",
    off: "border-buy/60 text-buy hover:border-buy focus-visible:border-buy",
    fill: "bg-buy",
  },
  sell: {
    on: "border-sell bg-sell text-bg",
    off: "border-sell/60 text-sell hover:border-sell focus-visible:border-sell",
    fill: "bg-sell",
  },
  burn: {
    on: "border-burn bg-burn text-bg",
    off: "border-burn/60 text-burn hover:border-burn focus-visible:border-burn",
    fill: "bg-burn",
  },
};

export default function TrioCard({
  item,
  assignment,
  onAssign,
  onEnter,
  onLeave,
  reveal = false,
  stat = null,
}) {
  const ownLabel = LABELS.find((label) => assignment[label] === item.id) ?? null;

  return (
    <div
      className="flex flex-col bg-surface md:min-h-0"
      onMouseEnter={reveal ? undefined : onEnter}
      onMouseLeave={reveal ? undefined : onLeave}
      onFocusCapture={reveal ? undefined : onEnter}
      onBlurCapture={reveal ? undefined : onLeave}
    >
      {/* Kart dikey, fotoğraflar yatay. object-cover burada yatay kırpıyor,
          yani arabanın burnunu ve arkasını kesiyordu. Sabit 4:3 kutu +
          object-contain: araba her zaman bütün görünüyor. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg">
        {item.image_url && (
          <Image
            src={item.image_url}
            // Araba adı hemen altında yazılı; alt'ı doldurmak ekran
            // okuyucuda aynı ismi iki kez okutur.
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-contain"
            priority
          />
        )}

        {/* İsim, fotoğrafın rengi ne olursa olsun okunsun diye tam opak zemin. */}
        <div className="absolute inset-x-0 bottom-0 bg-bg/90 px-3 py-2.5">
          <p className="text-base font-bold leading-tight tracking-[-0.02em] sm:text-lg">
            {item.name}
          </p>
          {item.year_label && (
            <p className="mt-0.5 text-xs text-muted tabular-nums">
              {item.year_label}
            </p>
          )}
        </div>
      </div>

      {/* Fotoğrafın altındaki her şey aynı yüzeyde: kart tek bir parça
          olarak okunuyor, düğmeler sayfada boşta durmuyor. */}
      <div className="p-3">
        {item.image_credit && (
          <p className="mb-2.5 text-[11px] leading-tight text-muted">
            {item.image_credit}
          </p>
        )}

        {reveal ? (
          <RevealBars stat={stat} ownLabel={ownLabel} />
        ) : (
          <div className="grid grid-cols-3 gap-2">
          {LABELS.map((label) => {
            const selected = ownLabel === label;
            // Başka kartta duran etiket soluklaşır ama tıklanabilir kalır —
            // tıklanınca buraya taşınır.
            const takenElsewhere = !selected && assignment[label] !== null;

            return (
              <button
                key={label}
                type="button"
                onClick={() => onAssign(item.id, label)}
                aria-pressed={selected}
                // Ekranda üç kartta da "Al" yazıyor; hangi arabaya ait
                // olduğu sadece konumdan anlaşılıyor, o yüzden adı ekliyoruz.
                aria-label={t("game.labelFor", {
                  label: t(`labels.${label}`),
                  item: item.name,
                })}
                className={[
                  "group relative overflow-hidden border px-2 py-3.5 text-base font-extrabold tracking-[-0.01em] -outline-offset-2",
                  selected ? LABEL_STYLES[label].on : LABEL_STYLES[label].off,
                  // Solukluk çerçeveden geliyor, metinden değil: bu düğme
                  // hâlâ tıklanabilir ve etiket okunur kalmalı. Metni
                  // karartmak kontrastı AA eşiğinin altına düşürüyordu.
                  takenElsewhere ? "border-transparent opacity-85 hover:opacity-100" : "",
                ].join(" ")}
              >
                {/* Üzerine gelince renk aşağıdan yukarı doluyor: tıklarsan
                    düğmenin alacağı hâlin önizlemesi. Klavyeyle gezenler de
                    görsün diye focus-visible aynı şeyi yapıyor.
                    prefers-reduced-motion açıkken globals.css geçişi
                    kapatıyor, dolgu anında oluyor — işlev aynı kalıyor. */}
                {!selected && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 origin-bottom scale-y-0 transition-transform duration-200 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100 ${LABEL_STYLES[label].fill}`}
                  />
                )}
                <span
                  className={
                    selected
                      ? "relative"
                      : "relative transition-colors duration-200 group-hover:text-bg group-focus-visible:text-bg"
                  }
                >
                  {t(`labels.${label}`)}
                </span>
              </button>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
