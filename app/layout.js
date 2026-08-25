import { Archivo } from "next/font/google";

import "./globals.css";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { t } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

// Sistem fontu ürüne "şablon" hissi veriyordu (SPEC 7). Archivo geniş,
// sert bir grotesk: büyük puntoda afiş gibi duruyor, küçükte okunur kalıyor.
// next/font paket değil, Next'in içinde; fontu build'de indirip kendi
// domainimizden serve ediyor, çalışırken dışarı istek gitmiyor.
const archivo = Archivo({
  subsets: ["latin-ext"], // Türkçe ı ğ ş ç ö ü İ buradan geliyor
  display: "swap",
  variable: "--font-archivo",
});

export const metadata = {
  // Open Graph etiketleri mutlak URL ister.
  metadataBase: new URL(siteUrl()),
  title: {
    default: t("app.title"),
    // Alt sayfalar yalnızca kendi adını veriyor, site adı buradan ekleniyor.
    template: `%s — ${t("app.title")}`,
  },
  description: t("app.description"),
  applicationName: t("app.title"),
  // Simge public/simge.svg'de duruyor, app/icon.svg'de değil: manifest de
  // aynı dosyayı gösteriyor ve iki kopyanın ayrışması istenmedi.
  icons: { icon: "/simge.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: t("app.title"),
    title: t("app.title"),
    description: t("app.description"),
  },
  twitter: { card: "summary_large_image" },
  // Telefonda ana ekrana eklenince tam ekran açılsın: günlük oyunlar
  // tarayıcı sekmesinde değil, ana ekranda yaşıyor.
  appleWebApp: { capable: true, title: t("app.title"), statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#08090c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={archivo.variable}>
      <body className="flex min-h-dvh flex-col bg-bg text-ink">
        {/* Klavye ve ekran okuyucu kullanıcısı her sayfada nav'ı tekrar
            dinlemek zorunda kalmasın. */}
        <a
          href="#icerik"
          className="sr-only z-50 bg-ink px-4 py-2 font-semibold text-bg focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          {t("nav.skip")}
        </a>

        <SiteHeader />
        <div id="icerik" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
