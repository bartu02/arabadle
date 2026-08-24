"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { t } from "@/lib/i18n";

/**
 * 210 arabalık listeden tahmin seçtiren kutu.
 *
 * Serbest metin kabul edilmiyor: oyuncu listeden bir araba seçiyor.
 * Böylece "yılı da yaz" gibi ikinci bir alan gerekmiyor — arabanın yılı
 * kendiliğinden geliyor ve iki nesil çıkış yılı karşılaştırılıyor, yani
 * elma elmaya. Serbest yıl sorulsaydı "2024 model Corolla" diyen oyuncu
 * E210'un 2018 çıkışına takılırdı.
 *
 * Bağımlılık eklenmedi (CLAUDE.md): düz input + filtreli liste, WAI-ARIA
 * combobox kalıbıyla.
 */

/**
 * Türkçe arama: "skoda" yazan Škoda'yı, "megane" yazan Mégane'ı bulmalı.
 * NFD ayrıştırması ş/ğ/ç/ö/ü/é aksanlarını düşürüyor; ı ayrı bir harf
 * olduğu için ayrıştırılmıyor, elle eşleniyor.
 */
function sadelestir(metin) {
  return metin
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

const EN_FAZLA = 8;

export default function ArabaSecici({ arabalar, denenenler, onSec, kapali }) {
  const [metin, setMetin] = useState("");
  const [acik, setAcik] = useState(false);
  const [vurgu, setVurgu] = useState(0);
  const sarmalayici = useRef(null);
  const listeId = useId();

  const dizin = useMemo(
    () => arabalar.map((a) => ({ ...a, arama: sadelestir(a.ad) })),
    [arabalar]
  );

  const sonuclar = useMemo(() => {
    const q = sadelestir(metin.trim());
    if (q === "") return [];
    const bulunan = dizin.filter((a) => a.arama.includes(q));
    // Baştan eşleşenler önce: "golf" yazınca Golf GTI, "Citroën"in içindeki
    // tesadüfi eşleşmeden önce gelsin.
    bulunan.sort((a, b) => a.arama.indexOf(q) - b.arama.indexOf(q));
    return bulunan.slice(0, EN_FAZLA);
  }, [dizin, metin]);

  useEffect(() => setVurgu(0), [metin]);

  // Dışarı tıklayınca liste kapansın.
  useEffect(() => {
    if (!acik) return undefined;
    const kapat = (olay) => {
      if (!sarmalayici.current?.contains(olay.target)) setAcik(false);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [acik]);

  function sec(araba) {
    if (!araba || denenenler.has(araba.slug)) return;
    onSec(araba.slug);
    setMetin("");
    setAcik(false);
  }

  function tusla(olay) {
    if (olay.key === "Escape") {
      setAcik(false);
      return;
    }
    if (sonuclar.length === 0) return;

    if (olay.key === "ArrowDown") {
      olay.preventDefault();
      setAcik(true);
      setVurgu((v) => (v + 1) % sonuclar.length);
    } else if (olay.key === "ArrowUp") {
      olay.preventDefault();
      setAcik(true);
      setVurgu((v) => (v - 1 + sonuclar.length) % sonuclar.length);
    } else if (olay.key === "Enter") {
      olay.preventDefault();
      sec(sonuclar[vurgu]);
    }
  }

  const listeAcik = acik && metin.trim() !== "";

  return (
    <div ref={sarmalayici} className="relative">
      <input
        type="text"
        value={metin}
        disabled={kapali}
        onChange={(olay) => {
          setMetin(olay.target.value);
          setAcik(true);
        }}
        onFocus={() => setAcik(true)}
        onKeyDown={tusla}
        placeholder={t("klasik.placeholder")}
        autoComplete="off"
        role="combobox"
        aria-expanded={listeAcik}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-activedescendant={
          listeAcik && sonuclar[vurgu] ? `${listeId}-${vurgu}` : undefined
        }
        data-araba-secici=""
        className="w-full border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted focus:border-muted disabled:opacity-40"
      />

      {listeAcik && (
        <ul
          id={listeId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto border border-line bg-raised"
        >
          {sonuclar.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">{t("klasik.noMatch")}</li>
          )}
          {sonuclar.map((araba, sira) => {
            const denendi = denenenler.has(araba.slug);
            return (
              <li key={araba.slug} id={`${listeId}-${sira}`} role="option" aria-selected={sira === vurgu} aria-disabled={denendi}>
                <button
                  type="button"
                  disabled={denendi}
                  onMouseEnter={() => setVurgu(sira)}
                  onClick={() => sec(araba)}
                  data-oneri=""
                  className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                    denendi
                      ? "cursor-not-allowed text-muted"
                      : sira === vurgu
                        ? "bg-line text-ink"
                        : "text-ink"
                  }`}
                >
                  <span>{araba.ad}</span>
                  {denendi && (
                    <span className="shrink-0 text-xs">{t("klasik.alreadyGuessed")}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
