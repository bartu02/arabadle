"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import ArabaSecici from "./ArabaSecici";
import KlasikSatir from "./KlasikSatir";
import { ALANLAR, gunSonunaKalan, paylasimIzgarasi, sureMetni } from "@/lib/klasik";
import { baslat, bitir, oku, yaz } from "@/lib/klasik-depo";
import { t } from "@/lib/i18n";

/**
 * Klasik modun tahtası.
 *
 * Tahmin hakkı **sınırsız**, skor tahmin sayısı. LoLdle'ın tercihi bu ve
 * bu oyunların en büyüğü o. Gerekçe: havuz 210 araba, site sıfır trafikle
 * başlıyor ve ilk gün gelen biri elenirse geri gelmiyor. Ayrıca yedi
 * alanda birebir aynı üç araba çifti var (911 / Cayman GT4) — orada hak
 * sınırlı olsaydı o günün oyunu şansa kalırdı. Sınır sonradan eklenebilir,
 * kaldırılamaz.
 *
 * Kayıt ve istatistikler lib/klasik-depo.js'te; bu dosya yalnızca oyunu
 * sürüyor.
 */
export default function KlasikBoard({ arabalar, numara }) {
  const [tahminler, setTahminler] = useState([]);
  const [cevap, setCevap] = useState(null);
  const [seri, setSeri] = useState(0);
  const [hata, setHata] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kalan, setKalan] = useState(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [paylasilabilir, setPaylasilabilir] = useState(false);
  const yuklendi = useRef(false);

  // Telefonda paylaşım sayfası, masaüstünde pano.
  //
  // Paylaşılan ızgara bu oyunların büyüme yolu ve "panoya kopyalandı, şimdi
  // git bir yere yapıştır" adımı yolun ortasında duruyordu. Ölçüt UA değil
  // `pointer: coarse`: masaüstü Edge'de de `navigator.share` var ama orada
  // Windows paylaşım panelini açıyor ve panoya kopyalamak daha hızlı.
  useEffect(() => {
    setPaylasilabilir(
      typeof navigator.share === "function" &&
        window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

  const bitti = cevap !== null;
  const denenenler = new Set(tahminler.map((x) => x.slug));

  // --- kayıtlı oyun ----------------------------------------------------------
  useEffect(() => {
    const kayit = oku();
    if (kayit.numara === numara) {
      setTahminler(kayit.tahminler ?? []);
      setCevap(kayit.cevap ?? null);
    }
    // Seri gün değişse de duruyor; kopması ancak bir günün atlanmasıyla olur.
    setSeri(kayit.seri ?? 0);
    yuklendi.current = true;
  }, [numara]);

  useEffect(() => {
    if (!yuklendi.current) return;
    // Taze okuyup üstüne yazıyoruz: istatistik alanları (oynanan, dağılım,
    // en iyi seri) bu efektin dışında güncelleniyor, silinmemeli.
    yaz({ ...oku(), numara, tahminler, cevap });
  }, [numara, tahminler, cevap]);

  // --- geri sayım ------------------------------------------------------------
  useEffect(() => {
    if (!bitti) return undefined;
    const guncelle = () => setKalan(gunSonunaKalan());
    guncelle();
    const sayac = setInterval(guncelle, 30_000);
    return () => clearInterval(sayac);
  }, [bitti]);

  // --- tahmin ----------------------------------------------------------------
  const tahminEt = useCallback(
    async (slug) => {
      if (bitti || gonderiliyor) return;
      setGonderiliyor(true);
      setHata(false);

      try {
        const yanit = await fetch("/api/tahmin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

        if (!yanit.ok) {
          setHata(true);
          return;
        }

        const veri = await yanit.json();

        // Gün ortasında sınır geçildiyse eldeki tahminler başka bulmacaya
        // ait. Sayfayı yenilemek yerine sessizce sıfırlıyoruz.
        if (veri.numara !== numara) {
          window.location.reload();
          return;
        }

        // Bu bulmacaya ilk tahmin: "oynanan" sayacı burada artıyor, sayfa
        // açılışında değil. Bakıp çıkan biri oyunu oynamış sayılmamalı.
        if (tahminler.length === 0) yaz(baslat(oku(), numara));

        setTahminler((onceki) => [
          ...onceki,
          { slug: veri.slug, ad: veri.ad, sonuc: veri.sonuc, ikiz: veri.ikiz },
        ]);

        if (veri.dogru) {
          setCevap(veri.cevap);
          const guncel = bitir(oku(), numara, tahminler.length + 1);
          yaz(guncel);
          setSeri(guncel.seri);
        }
      } catch {
        setHata(true);
      } finally {
        setGonderiliyor(false);
      }
    },
    [bitti, gonderiliyor, numara, tahminler.length]
  );

  // --- paylaşım --------------------------------------------------------------
  async function paylas() {
    const satirlar = paylasimIzgarasi(tahminler.map((x) => x.sonuc));
    const metin = [
      t("klasik.shareTitle", { n: numara }),
      t("klasik.guessCount", { n: tahminler.length }),
      "",
      ...satirlar,
      "",
      window.location.origin + "/",
    ].join("\n");

    if (paylasilabilir) {
      try {
        await navigator.share({ text: metin });
        return;
      } catch (hata) {
        // Vazgeçmek hata değil; başka bir sebeple açılmadıysa panoya düş.
        if (hata?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      setKopyalandi(false);
    }
  }

  // --- görünüm ---------------------------------------------------------------
  const sonIkiz = tahminler.length > 0 && tahminler[tahminler.length - 1].ikiz;

  return (
    <div className="flex flex-col gap-6">
      {!bitti && (
        <div>
          <ArabaSecici
            arabalar={arabalar}
            denenenler={denenenler}
            onSec={tahminEt}
            kapali={gonderiliyor}
          />
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            {tahminler.length === 0 ? (
              <p className="text-sm text-muted">{t("klasik.firstGuess")}</p>
            ) : (
              <p data-tahmin-sayaci="" className="text-sm tabular-nums text-muted">
                {t("klasik.guessCount", { n: tahminler.length })}
              </p>
            )}
          </div>
          {hata && (
            <p role="alert" className="mt-2 text-sm text-near">
              {t("klasik.error")}
            </p>
          )}
        </div>
      )}

      {sonIkiz && !bitti && (
        <div data-ikiz="" className="border border-near/60 bg-surface p-4">
          <p className="text-sm font-semibold text-near">{t("klasik.twinTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("klasik.twinBody")}</p>
        </div>
      )}

      {bitti && (
        <div data-kazandi="" className="border border-line bg-surface">
          {cevap.gorsel && (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg">
              <Image
                src={cevap.gorsel}
                alt=""
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-contain"
                priority
              />
            </div>
          )}
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-hit">
              {t("klasik.wonTitle")}
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.02em]">{cevap.ad}</h2>
            <p className="mt-1 text-muted">
              {cevap.yil} ·{" "}
              {tahminler.length === 1
                ? t("klasik.wonFirst")
                : t("klasik.wonCount", { n: tahminler.length })}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={paylas}
                data-paylas=""
                className="bg-ink px-6 py-3 text-sm font-bold text-bg -outline-offset-2 focus-visible:outline-bg"
              >
                {kopyalandi
                  ? t("klasik.shared")
                  : paylasilabilir
                    ? t("klasik.shareNative")
                    : t("klasik.share")}
              </button>
              {seri > 1 && (
                <span data-seri="" className="text-sm font-semibold text-hit">
                  {t("klasik.streak", { n: seri })}
                </span>
              )}
              {kalan !== null && (
                <span className="ml-auto text-sm tabular-nums text-muted">
                  {t("klasik.nextIn", { sure: sureMetni(kalan) })}
                </span>
              )}
            </div>

            {cevap.atif && <p className="mt-4 text-xs text-muted">{cevap.atif}</p>}
          </div>
        </div>
      )}

      {tahminler.length > 0 && (
        <div>
          {/* Sütun başlıkları bir kez, ve yapışkan: liste uzayınca hangi
              kutunun ne olduğu ekrandan kayıyordu. Kutuların içinde değerin
              kendisi yazılı olduğu için renk hiçbir zaman tek kanal değil. */}
          <div
            className="sticky top-[var(--h-baslik)] z-20 -mx-1 grid grid-cols-7 gap-1 bg-bg/90 px-1 py-2 backdrop-blur-sm"
            aria-hidden="true"
          >
            {ALANLAR.map((alan) => (
              <span
                key={alan}
                className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-xs"
              >
                {t(`klasik.columns.${alan}`)}
              </span>
            ))}
          </div>

          {/* En yeni tahmin üstte: hak sınırsız olduğu için liste büyüyor,
              oyuncu son satırı görmek için aşağı kaydırmak zorunda kalmasın. */}
          <ul className="mt-1 flex flex-col gap-4">
            {[...tahminler].reverse().map((tahmin, sira) => (
              <KlasikSatir
                key={tahmin.slug}
                tahmin={tahmin}
                yeni={sira === 0 && !bitti}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
