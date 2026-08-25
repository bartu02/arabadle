import KlasikAraclar from "@/components/KlasikAraclar";
import YapisalVeri from "@/components/YapisalVeri";
import KlasikBoard from "@/components/KlasikBoard";
import { bugununNumarasi } from "@/lib/klasik";
import { tumArabalar } from "@/lib/klasik-sunucu";
import { oyunBelgesi, oyunVerisi } from "@/lib/yapisal-veri";
import { t } from "@/lib/i18n";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Statik üretim nonce'lı CSP'yi kırıyor: build anındaki HTML'de nonce
// olmuyor ve tarayıcı bütün script'leri blokluyor (ölçüldü, 16 ihlal).
// Yeni sayfa her zaman force-dynamic.
export const dynamic = "force-dynamic";

export const metadata = {
  title: t("seo.classicTitle"),
  description: t("seo.classicDescription"),
  // Kanonik adres sorgu dizesini atıyor: /klasik her gün aynı adres.
  alternates: { canonical: "/klasik" },
  openGraph: {
    title: t("seo.classicTitle"),
    description: t("seo.classicDescription"),
    url: "/klasik",
  },
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
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
      <YapisalVeri
        veri={oyunBelgesi(
          oyunVerisi({
            yol: "/klasik",
            ad: t("seo.classicTitle"),
            aciklama: t("seo.classicDescription"),
          })
        )}
      />

      <header className="mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            {t("modes.classic.title")}
          </h1>
          <p data-bulmaca="" className="text-sm font-semibold tabular-nums text-muted">
            {t("klasik.puzzle", { n: numara })}
          </p>
        </div>

        <p className="mt-3 max-w-xl leading-snug text-muted">{t("klasik.tagline")}</p>

        {/* Kurallar ve istatistik: ikisi de bu türün standart mobilyası ve
            ikisi de eksikti. Kurallar ilk ziyarette kendiliğinden açılıyor. */}
        <div className="mt-5">
          <KlasikAraclar />
        </div>
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
            <span className="h-4 w-6 shrink-0 bg-hit" aria-hidden="true" />
            {t("klasik.legendHit")}
          </li>
          <li className="flex items-center gap-3">
            <span className="h-4 w-6 shrink-0 bg-near" aria-hidden="true" />
            {t("klasik.legendNear")}
          </li>
          <li className="flex items-center gap-3">
            <span className="h-4 w-6 shrink-0 bg-miss" aria-hidden="true" />
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
    </main>
  );
}
