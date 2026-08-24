import Link from "next/link";

import Wordmark from "@/components/Wordmark";
import { t } from "@/lib/i18n";

// Mod seçici veriye dokunmuyor, yani statik üretilebilirdi — ama üretilmemeli.
//
// Nonce'lı CSP (middleware.js) her istekte yeni nonce üretiyor. Statik
// sayfanın HTML'i build anında donuyor ve içindeki script'lerde nonce
// olmuyor; tarayıcı hepsini bloklayıp konsolu ihlalle dolduruyor. Ölçüldü:
// statik `/` 16 CSP ihlali veriyordu, dinamik `/al-sat-yak` sıfır.
export const dynamic = "force-dynamic";

/**
 * Modlar. `href` null ise henüz yapılmadı demek — kart görünür ama
 * tıklanmaz. LoLdle/Cardle de yapılmamış modu gizlemek yerine gösteriyor;
 * kullanıcı sitenin nereye gittiğini görüyor.
 */
const MODES = [
  { key: "photo", href: null },
  { key: "classic", href: null },
  { key: "poll", href: "/al-sat-yak" },
];

function ModeCard({ mode, index }) {
  const title = t(`modes.${mode.key}.title`);
  const desc = t(`modes.${mode.key}.desc`);
  const hazir = Boolean(mode.href);

  const inner = (
    <>
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold tabular-nums text-muted">
          {String(index).padStart(2, "0")}
        </span>
        <h3
          data-mode-title=""
          className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl"
        >
          {title}
        </h3>
        {!hazir && (
          <span className="ml-auto shrink-0 border border-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {t("modes.soon")}
          </span>
        )}
      </div>
      <p className="mt-2 max-w-prose text-muted">{desc}</p>
    </>
  );

  if (!hazir) {
    return (
      <div data-mode="" data-ready="false" className="border border-line bg-surface/40 p-6 opacity-55">
        {inner}
      </div>
    );
  }

  return (
    <Link
      data-mode=""
      data-ready="true"
      href={mode.href}
      className="block border border-line bg-surface p-6 transition-colors hover:border-muted -outline-offset-2"
    >
      {inner}
      <span className="mt-4 inline-block text-sm font-semibold text-ink underline underline-offset-4">
        {t("modes.play")}
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-6 py-14 sm:py-20">
      <header className="mb-14 sm:mb-20">
        <h1 className="text-[clamp(3rem,11vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
          <Wordmark />
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-snug text-muted sm:text-xl">
          {t("app.tagline")}
        </p>
      </header>

      <section>
        <h2 className="mb-6 border-b border-line pb-4 text-sm font-bold uppercase tracking-[0.2em]">
          {t("modes.heading")}
        </h2>
        <ul className="grid grid-cols-1 gap-4">
          {MODES.map((mode, i) => (
            <li key={mode.key}>
              <ModeCard mode={mode} index={i + 1} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto pt-20">
        <Link
          href="/atif"
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {t("credits.link")}
        </Link>
      </footer>
    </main>
  );
}
