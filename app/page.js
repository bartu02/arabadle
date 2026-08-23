import Link from "next/link";

import { t } from "@/lib/i18n";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import PackList from "@/components/PackList";
import Wordmark from "@/components/Wordmark";

// v1 trafiğinde önbelleğe gerek yok; seed'e eklenen paket anında görünsün.
export const dynamic = "force-dynamic";

// Paket başına bir kapak fotoğrafı: paketin ilk üçlüsünün ilk arabası.
async function getPacks() {
  const supabase = getSupabaseServerClient();

  const [packs, trios] = await Promise.all([
    supabase
      .from("packs")
      .select("id, slug, title, description, trios(count)")
      .order("sort_order", { ascending: true }),
    supabase
      .from("trios")
      .select("pack_id, sort_order, item_a_id")
      .order("sort_order", { ascending: true }),
  ]);

  for (const query of [packs, trios]) {
    if (query.error) throw new Error(query.error.message);
  }

  // Her paketin ilk üçlüsü (sort_order'a göre sıralı geldi).
  const coverItemId = new Map();
  for (const trio of trios.data ?? []) {
    if (!coverItemId.has(trio.pack_id)) coverItemId.set(trio.pack_id, trio.item_a_id);
  }

  const ids = [...coverItemId.values()];
  let covers = new Map();
  if (ids.length > 0) {
    const items = await supabase.from("items").select("id, image_url").in("id", ids);
    if (items.error) throw new Error(items.error.message);
    covers = new Map((items.data ?? []).map((item) => [item.id, item.image_url]));
  }

  return (packs.data ?? []).map((pack) => ({
    slug: pack.slug,
    title: pack.title,
    description: pack.description ?? "",
    trioCount: pack.trios?.[0]?.count ?? 0,
    cover: covers.get(coverItemId.get(pack.id)) ?? null,
  }));
}

export default async function HomePage() {
  let packs = [];
  let failed = false;

  try {
    packs = await getPacks();
  } catch (error) {
    // Gerçek sebep sunucu loguna; kullanıcıya tek satır.
    console.error("Paketler okunamadı:", error.message);
    failed = true;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-14 sm:py-20">
      <header className="mb-16 sm:mb-24">
        <h1 className="text-[clamp(3rem,11vw,7rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
          <Wordmark />
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-snug text-muted sm:text-xl">
          {t("app.tagline")}
        </p>
      </header>

      {failed && <p className="text-muted">{t("home.error")}</p>}
      {!failed && packs.length === 0 && (
        <p className="text-muted">{t("home.empty")}</p>
      )}

      {/* Kategori bloğu. Bugün tek kategori var; ikincisi geldiğinde bu
          blok olduğu gibi tekrarlanır, düzen değişmez. */}
      {!failed && packs.length > 0 && (
        <section>
          <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-line pb-4">
            <h2 data-category="" className="text-sm font-bold uppercase tracking-[0.2em]">
              {t("home.category")}
            </h2>
            <p data-category-note="" className="text-xs text-muted">
              {t("home.categoryNote")}
            </p>
          </div>
          <PackList packs={packs} />
        </section>
      )}

      <footer className="mt-auto pt-20">
        <Link
          href="/atif"
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {t("credits.link")}
        </Link>
      </footer>
    </main>
  );
}
