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
  const listeRef = useRef(null);
  const listeId = useId();

  const dizin = useMemo(
    () => arabalar.map((a) => ({ ...a, arama: sadelestir(a.ad) })),
    [arabalar]
  );

  /**
   * Kutu boşken gösterilen liste: 210 arabanın tamamı, ada göre sıralı.
   *
   * Sunucu `slug`'a göre sıralı gönderiyor ve o çoğu zaman markayla
   * başlıyor ama hep değil ("vw-golf-8-gti" → Volkswagen, "tofas-sahin" →
   * Tofaş). Gezilecek liste ekranda yazan ada göre sıralı olmalı.
   */
  const tumListe = useMemo(
    () => [...dizin].sort((a, b) => a.ad.localeCompare(b.ad, "tr")),
    [dizin]
  );

  const sonuclar = useMemo(() => {
    const q = sadelestir(metin.trim());
    // Boşken kesme yok: liste kaydırılabilir, oyuncu havuzu gezebiliyor.
    // Kesme yalnızca yazarken var, orada amaç en iyi eşleşmeleri göstermek.
    if (q === "") return tumListe;
    const bulunan = dizin.filter((a) => a.arama.includes(q));
    // Baştan eşleşenler önce: "golf" yazınca Golf GTI, "Citroën"in içindeki
    // tesadüfi eşleşmeden önce gelsin.
    bulunan.sort((a, b) => a.arama.indexOf(q) - b.arama.indexOf(q));
    return bulunan.slice(0, EN_FAZLA);
  }, [dizin, metin, tumListe]);

  // Yazarken ilk sonuç ön seçili (Enter'la hemen tahmin edilsin diye), ama
  // kutu BOŞKEN hiçbir satır seçili değil: liste artık odaklanınca da
  // açıldığı için, ön seçim olsaydı kazara basılan Enter listenin başındaki
  // arabayı tahmin ederdi.
  useEffect(() => setVurgu(metin.trim() === "" ? -1 : 0), [metin]);

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
      // Hiçbir şey seçili değilken (vurgu -1) yukarı ok sonuncuya gitmeli.
      setVurgu((v) => (v < 0 ? sonuclar.length - 1 : (v - 1 + sonuclar.length) % sonuclar.length));
    } else if (olay.key === "Enter") {
      olay.preventDefault();
      sec(sonuclar[vurgu]);
    }
  }

  // Liste odaklanır odaklanmaz açılıyor, yazmak şart değil: kutu boşken de
  // seçilecek bir şey olduğu görünsün. Önceden boş kutu hiçbir şey
  // göstermiyordu ve serbest metin kabul edilmediği için oyuncu ne
  // yazacağını bilmiyordu.
  const listeAcik = acik;

  // Uzun listede ok tuşuyla gezerken vurgulanan satır görünür kalmalı.
  // Sekiz sonuçla gerek yoktu, 210 satırla var.
  useEffect(() => {
    if (!listeAcik) return;
    // "Eşleşen araba yok" satırı yalnızca sonuç yokken çiziliyor, o durumda
    // da ok tuşları devre dışı — yani indeks kayması olmuyor.
    listeRef.current?.children[vurgu]?.scrollIntoView({ block: "nearest" });
  }, [vurgu, listeAcik]);

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
        // Esc ile kapattıktan sonra kutu hâlâ odakta kalıyor; ikinci
        // tıklamada onFocus tetiklenmediği için liste açılmıyordu.
        onClick={() => setAcik(true)}
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
          ref={listeRef}
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
