import { Archivo } from "next/font/google";

import "./globals.css";

import BrandBar from "@/components/BrandBar";
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
  title: t("app.title"),
  description: t("app.description"),
};

export const viewport = {
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={archivo.variable}>
      <body className="min-h-dvh bg-bg text-ink">
        <BrandBar />
        {children}
      </body>
    </html>
  );
}
