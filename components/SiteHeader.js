"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Wordmark from "./Wordmark";
import { MODES } from "@/lib/modes";
import { t } from "@/lib/i18n";

/**
 * Her sayfanın üstünde duran ince çubuk.
 *
 * Bundan önce her sayfa kendi "Bütün modlar" metin linkini yazıyordu ve
 * Klasik'ten Al, Sat, Yak'a geçmenin tek yolu ana sayfaya dönmekti — yani
 * ortada bir site değil, üç ayrı sayfa vardı. Kabuk bunları birbirine
 * bağlıyor: hangi moddaysan nav'da işaretli, diğer ikisi bir tık uzakta.
 *
 * İstemci bileşeni, çünkü etkin modu `usePathname` söylüyor. Alternatifi
 * her sayfanın kendi etkin anahtarını prop olarak geçmesiydi; o da yeni
 * sayfa eklerken unutulacak bir adım demek.
 */
export default function SiteHeader() {
  const yol = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      {/* Marka şeridi başlığın kendi üst kenarı: eskiden ayrı bir fixed
          katmandı ve sticky başlık altından geçiyordu. */}
      <div aria-hidden="true" className="h-[3px] bg-brand" />

      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link
          href="/"
          data-site-home=""
          className="text-base font-extrabold tracking-[-0.02em] -outline-offset-2 sm:text-lg"
        >
          <Wordmark compact />
        </Link>

        <nav aria-label={t("nav.menu")}>
          <ul className="flex items-center gap-3 sm:gap-5">
            {MODES.map((mode) => {
              const ad = t(`modes.${mode.key}.title`);

              if (!mode.href) {
                return (
                  <li key={mode.key}>
                    <span
                      data-nav-mode={mode.key}
                      aria-disabled="true"
                      title={t("modes.soon")}
                      className="cursor-default text-xs font-semibold text-muted/50 sm:text-sm"
                    >
                      {ad}
                    </span>
                  </li>
                );
              }

              // Oyun ekranı /al-sat-yak/<paket> altında; mod yine etkin.
              const etkin = yol === mode.href || yol.startsWith(mode.href + "/");

              return (
                <li key={mode.key}>
                  <Link
                    href={mode.href}
                    data-nav-mode={mode.key}
                    data-etkin={etkin ? "true" : "false"}
                    aria-current={etkin ? "page" : undefined}
                    className={`text-xs font-semibold underline-offset-[6px] -outline-offset-2 sm:text-sm ${
                      etkin
                        ? "text-ink underline decoration-brand decoration-2"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {ad}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
