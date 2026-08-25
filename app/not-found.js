import Link from "next/link";

import Wordmark from "@/components/Wordmark";
import { t } from "@/lib/i18n";

// Statik üretilirse CSP nonce'ı tutmuyor ve script'ler bloklanıyor
// (bkz. app/page.js'teki not). Hata sayfası bile olsa konsolu
// ihlalle doldurmasın.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-20 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">404</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
        {t("notFound.title")}
      </h1>
      <p className="mt-4 text-lg text-muted">{t("notFound.body")}</p>
      <Link
        href="/"
        className="mt-10 inline-block self-start bg-ink px-6 py-3 text-sm font-semibold text-bg -outline-offset-2 focus-visible:outline-bg"
      >
        <Wordmark compact />
      </Link>
    </main>
  );
}
