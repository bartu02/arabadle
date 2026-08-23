import Link from "next/link";

import { t } from "@/lib/i18n";
import { PHOTOS } from "@/lib/photos";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${t("credits.title")} — ${t("app.title")}`,
  description: t("credits.intro"),
};

// Araba adları veritabanında; gelmezse slug'la göster, sayfa yine de
// lisans yükümlülüğünü yerine getirsin.
async function getNames() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("items").select("slug, name");
    if (error) throw new Error(error.message);
    return new Map((data ?? []).map((item) => [item.slug, item.name]));
  } catch (error) {
    console.error("Araba adları okunamadı:", error.message);
    return new Map();
  }
}

export default async function CreditsPage() {
  const names = await getNames();
  const rows = Object.entries(PHOTOS);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14 sm:py-20">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        {t("credits.back")}
      </Link>

      <h1 className="mt-10 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("credits.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{t("credits.intro")}</p>

      {/* Dar ekranda tablo kendi içinde kayar, sayfa yatay kaymaz. */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-widest text-muted">
              <th scope="col" className="py-2 pr-4 font-semibold">{t("credits.car")}</th>
              <th scope="col" className="py-2 pr-4 font-semibold">{t("credits.photographer")}</th>
              <th scope="col" className="py-2 pr-4 font-semibold">{t("credits.license")}</th>
              <th scope="col" className="py-2 font-semibold">{t("credits.source")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([slug, photo]) => (
              <tr key={slug} className="border-b border-line/60 align-top">
                <th scope="row" className="py-3 pr-4 font-medium">
                  {names.get(slug) ?? slug}
                </th>
                <td className="py-3 pr-4 text-muted">{photo.artist}</td>
                <td className="py-3 pr-4">
                  {photo.licenseUrl ? (
                    <a
                      href={photo.licenseUrl}
                      rel="noopener noreferrer license"
                      target="_blank"
                      className="text-muted underline underline-offset-2 hover:text-ink"
                    >
                      {photo.license}
                    </a>
                  ) : (
                    <span className="text-muted">{photo.license}</span>
                  )}
                </td>
                <td className="py-3">
                  <a
                    href={photo.sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-muted underline underline-offset-2 hover:text-ink"
                  >
                    {t("credits.sourceLink")}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
