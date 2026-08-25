import GunSeridi from "@/components/GunSeridi";
import ModKarti from "@/components/ModKarti";
import Wordmark from "@/components/Wordmark";
import { bugununNumarasi } from "@/lib/klasik";
import { MODES } from "@/lib/modes";
import { t } from "@/lib/i18n";

// Mod seçici veriye dokunmuyor, yani statik üretilebilirdi — ama üretilmemeli.
//
// Nonce'lı CSP (middleware.js) her istekte yeni nonce üretiyor. Statik
// sayfanın HTML'i build anında donuyor ve içindeki script'lerde nonce
// olmuyor; tarayıcı hepsini bloklayıp konsolu ihlalle dolduruyor. Ölçüldü:
// statik `/` 16 CSP ihlali veriyordu, dinamik `/al-sat-yak` sıfır.
export const dynamic = "force-dynamic";

export default function HomePage() {
  // Gün numarası saf takvim hesabı (lib/klasik.js) — veritabanına
  // gitmiyor, yani ön kapı Supabase'e bağlı değil.
  const numara = bugununNumarasi();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <h1 className="text-[clamp(2.75rem,10vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
          <Wordmark />
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-snug text-muted sm:text-xl">
          {t("app.tagline")}
        </p>
      </header>

      <GunSeridi numara={numara} />

      <section className="mt-8">
        <h2 className="sr-only">{t("modes.heading")}</h2>
        {/* Üç kart yan yana: liste hâlindeyken her satır tam genişlikti ve
            1440px'te sağ yarı bomboş kalıyordu. */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode, i) => (
            <li key={mode.key} className="flex">
              <ModKarti mode={mode} index={i + 1} numara={numara} />
            </li>
          ))}
        </ul>
      </section>

      {/* Siteye ilk gelen "bu ne, kaydolmam gerekiyor mu" diye soruyor.
          Üç satır cevap, kartların altında, yolu kesmeden. */}
      <section className="mt-14 border-t border-line pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
          {t("hub.howTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{t("hub.howBody")}</p>
      </section>
    </main>
  );
}
