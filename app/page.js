import GunSeridi from "@/components/GunSeridi";
import KlasikAraclar from "@/components/KlasikAraclar";
import KlasikBoard from "@/components/KlasikBoard";
import ModKarti from "@/components/ModKarti";
import Wordmark from "@/components/Wordmark";
import YapisalVeri from "@/components/YapisalVeri";
import { bugununNumarasi } from "@/lib/klasik";
import { tumArabalar } from "@/lib/klasik-sunucu";
import { MODES } from "@/lib/modes";
import { siteVerisi } from "@/lib/yapisal-veri";
import { t } from "@/lib/i18n";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Statik üretim nonce'lı CSP'yi kırıyor: build anındaki HTML'de nonce
// olmuyor ve tarayıcı bütün script'leri blokluyor (ölçüldü, 16 ihlal).
// Yeni sayfa her zaman force-dynamic.
export const dynamic = "force-dynamic";

/**
 * Ana sayfa **oyunun kendisi.**
 *
 * Önceki hâlinde `/` bir mod seçiciydi ve Klasik `/klasik`'te duruyordu:
 * siteye gelen önce bir menü görüyor, oynamak için bir tık daha atıyordu.
 * Oysa sitenin adı Arabadle ve o ad Klasik'i anlatıyor — Wordle,
 * LoLdle, Framed, Globle, hepsinde kök adres oyunun kendisi.
 *
 * Mod seçici kayboldu demek değil: üst nav her sayfada üç modu taşıyor
 * ve diğer iki mod bu sayfanın altında kartlarıyla duruyor. Yani oyuncu
 * önce oynuyor, sonra keşfediyor.
 *
 * `/klasik` kalıcı olarak buraya yönleniyor (next.config.mjs). Paylaşılan
 * eski linkler çalışmaya devam ediyor ve arama motoru tek adres görüyor.
 */
export const metadata = {
  // `absolute`: layout'un "%s · Arabadle" şablonu uygulansaydı
  // "Arabadle ... · Arabadle" çıkardı.
  title: { absolute: t("seo.homeTitle") },
  description: t("seo.homeDescription"),
  alternates: { canonical: "/" },
  openGraph: {
    title: t("seo.homeTitle"),
    description: t("seo.homeDescription"),
    url: "/",
  },
};

export default async function HomePage() {
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
  // Klasik zaten bu sayfa; kartı kendine link vermesin.
  const digerModlar = MODES.filter((mode) => mode.key !== "classic");

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
      <YapisalVeri veri={siteVerisi()} />

      <header className="mb-6">
        {/* h1 sitenin adı: kök adres artık hem site hem oyun. Punto
            eskisinden küçük, çünkü tahtanın ekranda yer kaplaması gerek. */}
        <h1 className="text-[clamp(2.25rem,8vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          <Wordmark />
        </h1>
        <p className="mt-3 max-w-xl leading-snug text-muted">{t("klasik.tagline")}</p>

        <div className="mt-5">
          <KlasikAraclar />
        </div>
      </header>

      {/* Bulmaca numarası, seri ve geri sayım tek şeritte. */}
      <GunSeridi numara={numara} />

      <div className="mt-6">
        {failed || arabalar.length === 0 ? (
          <p className="text-muted">{t("klasik.empty")}</p>
        ) : (
          <KlasikBoard arabalar={arabalar} numara={numara} />
        )}
      </div>

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
          <li className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center text-xs font-bold text-muted" aria-hidden="true">
              PS
            </span>
            {t("klasik.legendPower")}
          </li>
        </ul>
      </section>

      {/* Diğer modlar oyunun altında: oyuncu bugünkü bulmacayı bitirince
          burada duracak bir sonraki şeyi buluyor. */}
      <section className="mt-14 border-t border-line pt-6">
        <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-muted">
          {t("modes.others")}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {digerModlar.map((mode, i) => (
            <li key={mode.key} className="flex">
              <ModKarti mode={mode} index={i + 1} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
          {t("hub.howTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{t("hub.howBody")}</p>
      </section>
    </main>
  );
}
