import { t } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

/**
 * schema.org JSON-LD blokları.
 *
 * Ne işe yarıyor: arama motoru sayfanın metnini okuyup tahmin etmek yerine
 * "bu bir tarayıcıda oynanan oyun, adı şu, dili Türkçe, ücretsiz" bilgisini
 * doğrudan alıyor. Bu sitede metin çok az (oyun ekranları neredeyse
 * tamamen görsel), yani tahmine bırakılacak şey de az.
 *
 * Abartılmadı: yalnızca doğrulanabilir şeyler yazılıyor. Uydurma
 * `aggregateRating` ya da `datePublished` koymak zengin sonuç getirmiyor,
 * yapısal veri ihlali sayılıyor.
 */

const SITE = () => siteUrl();

/** Ana sayfa: sitenin kendisi + iki oyunun listesi. */
export function siteVerisi() {
  const kok = SITE();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${kok}/#site`,
        url: `${kok}/`,
        name: t("app.title"),
        description: t("seo.homeDescription"),
        inLanguage: "tr-TR",
      },
      oyunVerisi({
        yol: "/klasik",
        ad: `${t("app.title")} — ${t("modes.classic.title")}`,
        aciklama: t("seo.classicDescription"),
      }),
      oyunVerisi({
        yol: "/al-sat-yak",
        ad: `${t("app.title")} — ${t("modes.poll.title")}`,
        aciklama: t("seo.pollDescription"),
      }),
    ],
  };
}

/**
 * Tek bir oyun modu.
 *
 * `VideoGame` + `playMode: SinglePlayer` + tarayıcı platformu: schema.org'un
 * tarayıcı oyunları için beklediği kalıp bu. `offers` fiyat 0 ile var,
 * çünkü "ücretsiz mi" arama sonucunda görünen bir ayrım.
 */
export function oyunVerisi({ yol, ad, aciklama }) {
  const kok = SITE();

  return {
    "@type": "VideoGame",
    "@id": `${kok}${yol}#oyun`,
    url: `${kok}${yol}`,
    name: ad,
    description: aciklama,
    inLanguage: "tr-TR",
    gamePlatform: "Web browser",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    playMode: "SinglePlayer",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "TRY" },
    isPartOf: { "@id": `${kok}/#site` },
  };
}

/** Tek bir oyunun sayfası için tam belge. */
export function oyunBelgesi(oyun) {
  return { "@context": "https://schema.org", ...oyun };
}
