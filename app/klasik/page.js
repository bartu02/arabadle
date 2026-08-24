import Link from "next/link";

import KlasikBoard from "@/components/KlasikBoard";
import Wordmark from "@/components/Wordmark";
import { bugununNumarasi } from "@/lib/klasik";
import { tumArabalar } from "@/lib/klasik-sunucu";
import { t } from "@/lib/i18n";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Statik üretim nonce'lı CSP'yi kırıyor: build anındaki HTML'de nonce
// olmuyor ve tarayıcı bütün script'leri blokluyor (ölçüldü, 16 ihlal).
// Yeni sayfa her zaman force-dynamic.
export const dynamic = "force-dynamic";

export const metadata = {
  title: `${t("modes.classic.title")} — ${t("app.title")}`,
  description: t("klasik.tagline"),
};

export default async function KlasikPage() {
  let arabalar = [];
  let failed = false;

  try {
    const supabase = getSupabaseServerClient();
    const hepsi = await tumArabalar(supabase);
    // İstemciye yalnızca ad ve slug iniyor. Özellik tablosunun tamamını
    // göndermenin faydası yok: her tahminde zaten sunucudan dönüyor, ve
    // RSC yüküne 210 satır bindirmek boşuna.
    arabalar = hepsi.map((a) => ({ slug: a.slug, ad: a.name }));
  } catch (error) {
    console.error("Klasik verisi okunamadı:", error.message);
    failed = true;
  }

  const numara = bugununNumarasi();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-14 sm:py-20">
      <header className="mb-10">
        <Link
          href="/"
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {t("klasik.back")}
        </Link>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            {t("modes.classic.title")}
          </h1>
          <p data-bulmaca="" className="text-sm font-semibold tabular-nums text-muted">
            {t("klasik.puzzle", { n: numara })}
          </p>
        </div>

        <p className="mt-4 max-w-xl leading-snug text-muted">{t("klasik.tagline")}</p>
      </header>

      {failed || arabalar.length === 0 ? (
        <p className="text-muted">{t("klasik.empty")}</p>
      ) : (
        <KlasikBoard arabalar={arabalar} numara={numara} />
      )}

      {/* Kutuların ne anlama geldiği sayfanın altında duruyor: oyuncu ilk
          tahminden sonra zaten anlıyor, üstte yer kaplaması gereksiz. */}
      <section className="mt-14 border-t border-line pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
          {t("klasik.legendTitle")}
        </h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-center gap-3">
            <span className="h-4 w-6 shrink-0 border border-hit bg-hit" aria-hidden="true" />
            {t("klasik.legendHit")}
          </li>
          <li className="flex items-center gap-3">
            <span className="h-4 w-6 shrink-0 border border-near bg-near" aria-hidden="true" />
            {t("klasik.legendNear")}
          </li>
          <li className="flex items-center gap-3">
            <span className="h-4 w-6 shrink-0 border border-miss bg-miss" aria-hidden="true" />
            {t("klasik.legendMiss")}
          </li>
          <li className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center text-ink" aria-hidden="true">
              ▲
            </span>
            {t("klasik.legendYear")}
          </li>
        </ul>
      </section>

      <footer className="mt-auto pt-16 text-sm font-bold text-muted">
        <Wordmark compact />
      </footer>
    </main>
  );
}
