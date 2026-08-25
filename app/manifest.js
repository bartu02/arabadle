import { t } from "@/lib/i18n";

/**
 * Ana ekrana eklenince tarayıcı çerçevesi olmadan açılsın.
 *
 * Günlük oyunlar telefonda sekmede değil ana ekranda yaşıyor: Wordle'ın
 * büyümesinde de bu pay var. Bedeli sıfır — tek bir manifest dosyası,
 * bağımlılık yok.
 */
export default function manifest() {
  return {
    name: t("app.title"),
    short_name: t("app.title"),
    description: t("app.description"),
    lang: "tr",
    start_url: "/",
    display: "standalone",
    background_color: "#08090c",
    theme_color: "#08090c",
    icons: [
      { src: "/simge.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
