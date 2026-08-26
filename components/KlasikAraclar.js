"use client";

import { useEffect, useState } from "react";

import KlasikSatir from "./KlasikSatir";
import Modal from "./Modal";
import { BOS, SON_KOVA, oku, ortalamaTahmin, yaz } from "@/lib/klasik-depo";
import { t } from "@/lib/i18n";

/**
 * Klasik'in başlık çubuğu: "Nasıl oynanır" ve "İstatistik".
 *
 * İkisi de bu türün standart mobilyası ve ikisi de eksikti. Sonuçları:
 *
 * - Kurallar sayfanın en altındaki lejantta duruyordu. İlk kez gelen
 *   oyuncu boş bir arama kutusu görüyor, bir araba yazıyor, kırmızı
 *   kutular alıyor ve sarının var olduğunu hiç öğrenmiyordu. Pencere ilk
 *   ziyarette kendiliğinden açılıyor, sonra düğmeye kalıyor.
 * - İstatistik günlük oyunların geri gelme sebebi. Seri yalnızca kazanma
 *   kartında ve yalnızca 1'den büyükse görünüyordu; artık dağılımıyla
 *   birlikte her an açılabiliyor.
 *
 * Hepsi localStorage'da (lib/klasik-depo.js) — sunucuya hesap eklemeden.
 */

/**
 * "Nasıl oynanır" penceresindeki örnek satır.
 *
 * Gerçek `KlasikSatir` bileşeniyle çiziliyor, ekrandakiyle birebir aynı
 * görünsün diye. Değerler uydurma ama tutarlı: marka ve ülke tutuyor,
 * yakıt benzin↔hibrit yakınlığından sarı, beygir ve yıl yakın bantta ve
 * iki ok da yukarı.
 */
const ORNEK = {
  slug: "ornek",
  ad: t("klasik.howExample"),
  sonuc: {
    brand: { durum: "hit", deger: "Toyota" },
    country: { durum: "hit", deger: "Japonya" },
    body: { durum: "miss", deger: "sedan" },
    fuel: { durum: "near", deger: "petrol" },
    drivetrain: { durum: "miss", deger: "fwd" },
    power: { durum: "near", deger: 152, yon: "yukari" },
    year: { durum: "near", deger: 2018, yon: "yukari" },
  },
};

function Sayi({ etiket, deger }) {
  return (
    <div className="border border-line bg-raised px-2 py-3 text-center">
      <p className="text-2xl font-extrabold tabular-nums leading-none">{deger}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {etiket}
      </p>
    </div>
  );
}

function Dagilim({ dagilim }) {
  const kovalar = [];
  for (let i = 1; i <= SON_KOVA; i++) kovalar.push(i);

  const enBuyuk = Math.max(1, ...kovalar.map((k) => dagilim[k] ?? 0));

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {kovalar.map((kova) => {
        const sayi = dagilim[kova] ?? 0;
        return (
          <li key={kova} className="flex items-center gap-2 text-xs">
            <span className="w-5 shrink-0 tabular-nums text-muted">
              {kova === SON_KOVA ? t("klasik.statsMore", { n: SON_KOVA }) : kova}
            </span>
            <span className="flex h-5 flex-1 items-center">
              {/* Sıfır olan kova da ince bir iz bırakıyor, yoksa satır
                  boş görünüp okunmaz hâle geliyor. */}
              <span
                className={`flex h-full min-w-6 items-center justify-end px-1.5 font-bold tabular-nums ${
                  sayi > 0 ? "bg-hit text-bg" : "bg-line text-muted"
                }`}
                style={{ width: `${Math.max(8, (sayi / enBuyuk) * 100)}%` }}
              >
                {sayi}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function KlasikAraclar() {
  const [nasil, setNasil] = useState(false);
  const [istatistik, setIstatistik] = useState(false);
  const [kayit, setKayit] = useState(BOS);

  // İlk ziyarette kurallar kendiliğinden açılıyor. Bayrak aynı kayıtta
  // duruyor, yani ikinci gelişte açılmıyor.
  useEffect(() => {
    const mevcut = oku();
    setKayit(mevcut);
    if (!mevcut.nasilGoruldu) {
      setNasil(true);
      yaz({ ...mevcut, nasilGoruldu: true });
    }
  }, []);

  // Pencereyi açarken taze oku: oyun kazanılmış olabilir.
  function istatistikAc() {
    setKayit(oku());
    setIstatistik(true);
  }

  const ortalama = ortalamaTahmin(kayit.dagilim ?? {});
  const yuzde =
    kayit.oynanan > 0 ? Math.round((kayit.bulunan / kayit.oynanan) * 100) : 0;

  const dugme =
    "border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-muted hover:text-ink -outline-offset-2";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" data-nasil-ac="" onClick={() => setNasil(true)} className={dugme}>
          {t("klasik.howOpen")}
        </button>
        <button type="button" data-istatistik-ac="" onClick={istatistikAc} className={dugme}>
          {t("klasik.statsOpen")}
        </button>
      </div>

      <Modal
        etiket="nasil"
        acik={nasil}
        onKapat={() => setNasil(false)}
        baslik={t("klasik.howTitle")}
      >
        <ol className="flex list-inside list-decimal flex-col gap-2 text-sm leading-relaxed text-muted marker:font-bold marker:text-ink">
          <li>{t("klasik.howStep1")}</li>
          <li>{t("klasik.howStep2")}</li>
          <li>{t("klasik.howStep3")}</li>
        </ol>

        <ul className="mt-5">
          <KlasikSatir tahmin={ORNEK} ornek />
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {t("klasik.howExampleNote")}
        </p>

        <button
          type="button"
          onClick={() => setNasil(false)}
          className="mt-5 w-full bg-ink px-5 py-3 text-sm font-bold text-bg -outline-offset-2 focus-visible:outline-bg"
        >
          {t("klasik.howGot")}
        </button>
      </Modal>

      <Modal
        etiket="istatistik"
        acik={istatistik}
        onKapat={() => setIstatistik(false)}
        baslik={t("klasik.statsTitle")}
      >
        {kayit.oynanan === 0 ? (
          <p className="text-sm text-muted">{t("klasik.statsEmpty")}</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              <Sayi etiket={t("klasik.statsPlayed")} deger={kayit.oynanan} />
              <Sayi etiket={t("klasik.statsWon")} deger={`%${yuzde}`} />
              <Sayi etiket={t("klasik.statsStreak")} deger={kayit.seri} />
              <Sayi etiket={t("klasik.statsBest")} deger={kayit.enIyiSeri} />
            </div>

            <div className="mt-6 flex items-baseline justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {t("klasik.statsDist")}
              </h3>
              {ortalama !== null && (
                <p className="text-xs tabular-nums text-muted">
                  {t("klasik.statsAvg")} {ortalama.toFixed(1)}
                </p>
              )}
            </div>
            <Dagilim dagilim={kayit.dagilim ?? {}} />
          </>
        )}
      </Modal>
    </>
  );
}
