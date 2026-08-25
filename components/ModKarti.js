import Image from "next/image";
import Link from "next/link";

import ModDurumu from "./ModDurumu";
import { PHOTOS } from "@/lib/photos";
import { t } from "@/lib/i18n";

/**
 * Ana sayfadaki mod kartı.
 *
 * Önceki hâli üç gri metin kutusuydu: 210 lisanslı araba fotoğrafı olan
 * bir sitenin ön kapısı hiçbir araba göstermiyordu ve üç oyun birbirinin
 * aynısı görünüyordu. Şimdi **her kart kendi mekaniğini gösteriyor** —
 * kullanıcı açıklamayı okumadan ne olduğunu anlıyor:
 *
 * - Klasik: bir araba + altı renkli kutu şeridi
 * - Al, Sat, Yak: yan yana üç araba, üçünün altında kendi etiketi
 * - Fotoğraf: aynı fotoğrafın aşırı yakın kırpımı, üstünde soru işareti
 *
 * Fotoğraflar lib/photos.js'ten slug ile geliyor; slug bulunamazsa kart
 * fotoğrafsız çiziliyor (içerik değişince ön kapı çökmesin).
 */

/** Klasik kartındaki örnek kutu dizisi. Gerçek bir tahmin gibi karışık. */
const ORNEK_KUTULAR = ["miss", "hit", "miss", "near", "miss", "hit"];
const KUTU_RENGI = { hit: "bg-hit", near: "bg-near", miss: "bg-miss" };

/** Al, Sat, Yak kartındaki üç etiket, kendi renginde. */
const ETIKETLER = [
  { anahtar: "buy", renk: "text-buy" },
  { anahtar: "sell", renk: "text-sell" },
  { anahtar: "burn", renk: "text-burn" },
];

function dosya(slug) {
  return PHOTOS[slug]?.file ?? null;
}

function KlasikGorsel({ slug }) {
  const src = dosya(slug);
  if (!src) return null;

  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {/* Kutu şeridi fotoğrafın üstünde: altına konsaydı kartın gövdesiyle
          karışır, oyunun işareti olmaktan çıkardı. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent p-2.5 pt-8">
        <div className="grid grid-cols-6 gap-1">
          {ORNEK_KUTULAR.map((durum, i) => (
            <span key={i} className={`h-5 ${KUTU_RENGI[durum]}`} />
          ))}
        </div>
      </div>
    </>
  );
}

function AnketGorsel({ slugs }) {
  const dosyalar = slugs.map(dosya).filter(Boolean);
  if (dosyalar.length === 0) return null;

  return (
    <>
      <div className="grid h-full grid-cols-3 gap-px bg-line">
        {dosyalar.slice(0, 3).map((src, i) => (
          <div key={src} className="relative overflow-hidden bg-bg">
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1024px) 115px, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              // Üç küçük kare; ilki kartın görünür ağırlığını taşıyor.
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 bg-gradient-to-t from-bg via-bg/80 to-transparent pb-2 pt-8">
        {ETIKETLER.map(({ anahtar, renk }) => (
          <span
            key={anahtar}
            className={`text-center text-xs font-extrabold uppercase tracking-[0.1em] ${renk}`}
          >
            {t(`labels.${anahtar}`)}
          </span>
        ))}
      </div>
    </>
  );
}

function FotografGorsel({ slug }) {
  const src = dosya(slug);
  if (!src) return null;

  return (
    <>
      {/* Modun kendisi bu: aşırı yakın kırpım. Ölçek object-cover'ın
          üstüne biniyor, yani kare zaten dolu, sadece yakınlaşıyor. */}
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
        className="scale-[2.8] object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-bg/45">
        <span
          aria-hidden="true"
          className="text-6xl font-extrabold leading-none text-ink/85"
        >
          ?
        </span>
      </div>
    </>
  );
}

function Gorsel({ mode }) {
  if (mode.key === "classic") return <KlasikGorsel slug={mode.cars[0]} />;
  if (mode.key === "poll") return <AnketGorsel slugs={mode.cars} />;
  return <FotografGorsel slug={mode.cars[0]} />;
}

export default function ModKarti({ mode, index, numara }) {
  const hazir = Boolean(mode.href);

  const govde = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-bg">
        <Gorsel mode={mode} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-bold tabular-nums text-muted">
            {String(index).padStart(2, "0")}
          </span>
          <h3
            data-mode-title=""
            className="text-xl font-extrabold tracking-[-0.02em] sm:text-2xl"
          >
            {t(`modes.${mode.key}.title`)}
          </h3>
        </div>

        <p className="mt-2 text-sm leading-snug text-muted">
          {t(`modes.${mode.key}.desc`)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 pt-1">
          {hazir ? (
            <span className="text-sm font-bold text-ink group-hover:underline group-hover:underline-offset-4">
              {t("modes.play")} <span aria-hidden="true">→</span>
            </span>
          ) : (
            <span className="border border-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t("modes.soon")}
            </span>
          )}
          {mode.key === "classic" && <ModDurumu numara={numara} />}
        </div>
      </div>
    </>
  );

  const ortak = "group flex h-full flex-col overflow-hidden border border-line";

  if (!hazir) {
    return (
      <div data-mode="" data-ready="false" className={`${ortak} bg-surface/40`}>
        {govde}
      </div>
    );
  }

  return (
    <Link
      data-mode=""
      data-ready="true"
      href={mode.href}
      className={`${ortak} bg-surface transition-colors hover:border-muted -outline-offset-2`}
    >
      {govde}
    </Link>
  );
}
