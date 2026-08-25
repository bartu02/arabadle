import Link from "next/link";

import Wordmark from "./Wordmark";
import { t } from "@/lib/i18n";

/**
 * Her sayfanın altındaki şerit. Başlık gibi bu da sayfaların kendi
 * kopyalarının yerine geçiyor: atıf linki eskiden yalnızca iki sayfada
 * vardı, oysa CC BY / BY-SA atfı fotoğrafın göründüğü her yerden
 * ulaşılabilir olmalı.
 */
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line/70">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-8 text-sm sm:px-6">
        <Link
          href="/"
          className="font-bold text-muted transition-colors hover:text-ink -outline-offset-2"
        >
          <Wordmark compact />
        </Link>

        <Link
          href="/atif"
          className="text-muted underline-offset-4 transition-colors hover:text-ink hover:underline -outline-offset-2"
        >
          {t("credits.link")}
        </Link>
      </div>
    </footer>
  );
}
