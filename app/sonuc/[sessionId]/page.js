import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AlSatYakMark from "@/components/AlSatYakMark";
import ShareButton from "@/components/ShareButton";
import { t } from "@/lib/i18n";
import { buildResult } from "@/lib/result";
import { SAFE_SESSION_ID } from "@/lib/security";
import { siteUrl } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ITEM_FIELDS = "id, slug, name, year_label, image_url, image_credit";

async function loadResult(sessionId) {
  // Adres çubuğundan gelen her şey burada duruyor. Biçim tutmuyorsa
  // veritabanına hiç gitmiyoruz: çöp istekle sorgu tetiklemek bedava bir
  // yük yolu, ayrıca filtreye ne gittiği hakkında hiç şüphe kalmıyor.
  if (!SAFE_SESSION_ID.test(sessionId ?? "")) return null;

  const supabase = getSupabaseServerClient();

  const mine = await supabase
    .from("votes")
    .select("trio_id, item_id, label, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (mine.error) throw new Error(mine.error.message);
  if (!mine.data?.length) return null;

  const trioIds = [...new Set(mine.data.map((vote) => vote.trio_id))];
  const itemIds = [...new Set(mine.data.map((vote) => vote.item_id))];

  const [crowd, items, firstTrio] = await Promise.all([
    supabase.from("votes").select("trio_id, item_id, label").in("trio_id", trioIds),
    supabase.from("items").select(ITEM_FIELDS).in("id", itemIds),
    supabase.from("trios").select("packs(slug, title)").eq("id", mine.data[0].trio_id).maybeSingle(),
  ]);

  for (const query of [crowd, items, firstTrio]) {
    if (query.error) throw new Error(query.error.message);
  }

  const byId = new Map((items.data ?? []).map((item) => [item.id, item]));
  const result = buildResult(mine.data, crowd.data ?? []);

  return {
    ...result,
    garage: result.garage.map((id) => byId.get(id)).filter(Boolean),
    scrapyard: result.scrapyard.map((id) => byId.get(id)).filter(Boolean),
    // Tur 1 her zaman kullanıcının seçtiği paketten gelir.
    pack: firstTrio.data?.packs ?? null,
  };
}

export async function generateMetadata({ params }) {
  const { sessionId } = await params;

  let result = null;
  try {
    result = await loadResult(sessionId);
  } catch {
    result = null;
  }

  const description = !result
    ? t("app.description")
    : result.agreement === null
      ? t("result.shareNoAgreement", { rounds: result.rounds })
      : t("result.shareDescription", {
          rounds: result.rounds,
          agreement: result.agreement,
        });

  return {
    title: t("result.shareTitle"),
    description,
    // Paylaşım linki: bağlantıyı bilen görsün, arama motoru dizinlemesin.
    // Oturum kimlikleri tahmin edilemez ama listelenmeleri de gerekmiyor.
    robots: { index: false, follow: false },
    openGraph: {
      title: t("result.shareTitle"),
      description,
      type: "website",
      url: `${siteUrl()}/sonuc/${sessionId}`,
    },
    twitter: { card: "summary_large_image" },
  };
}

// Oyun ekranındaki kartla aynı muamele: tek yüzey, fotoğraf daha koyu bir
// pencere, atıf aynı panelin içinde.
function CarGrid({ items }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id} className="bg-surface">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg">
            {item.image_url && (
              <Image
                src={item.image_url}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-contain"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-bg/90 px-2.5 py-2">
              <p className="text-sm font-bold leading-tight tracking-[-0.01em]">{item.name}</p>
            </div>
          </div>
          <p className="px-2.5 py-2 text-[11px] leading-tight text-muted">
            {item.image_credit}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, items, emptyKey }) {
  return (
    <section className="mt-12">
      <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      {items.length > 0 ? (
        <CarGrid items={items} />
      ) : (
        <p className="text-muted">{t(emptyKey)}</p>
      )}
    </section>
  );
}

export default async function ResultPage({ params }) {
  const { sessionId } = await params;

  let result = null;
  let failed = false;

  try {
    result = await loadResult(sessionId);
  } catch (error) {
    console.error("Sonuç okunamadı:", error.message);
    failed = true;
  }

  if (!failed && !result) notFound();

  if (failed) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <p className="text-muted">{t("result.error")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <Link
        href="/al-sat-yak"
        className="text-lg font-extrabold tracking-[-0.03em] opacity-80 hover:opacity-100"
      >
        <AlSatYakMark />
      </Link>

      {/* Tek sayı, öne çıkan (SPEC 6.4). Sayfanın h1'i bu. */}
      <div className="mt-10">
        {result.agreement === null ? (
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            {t("result.agreementUnknown")}
          </h1>
        ) : (
          <h1>
            <span
              data-agreement=""
              className="block text-[clamp(5rem,18vw,10rem)] font-extrabold leading-[0.85] tracking-[-0.05em] tabular-nums"
            >
              %{result.agreement}
            </span>
            <span className="mt-5 block text-lg font-medium text-muted sm:text-xl">
              {t("result.agreement")}
            </span>
          </h1>
        )}
        <p className="mt-2 text-sm text-muted">
          {t("result.roundCount", { rounds: result.rounds })}
        </p>
      </div>

      <Section
        title={t("result.garage")}
        items={result.garage}
        emptyKey="result.garageEmpty"
      />
      <Section
        title={t("result.scrapyard")}
        items={result.scrapyard}
        emptyKey="result.scrapyardEmpty"
      />

      <div className="mt-14 flex flex-wrap items-center gap-3">
        {result.pack && (
          <Link
            href={`/al-sat-yak/${result.pack.slug}?tur=8`}
            className="bg-ink px-6 py-3 text-sm font-semibold text-bg -outline-offset-2 focus-visible:outline-bg"
          >
            {t("result.playAgain")}
          </Link>
        )}
        <Link
          href="/al-sat-yak"
          className="border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-muted -outline-offset-2"
        >
          {t("result.otherPack")}
        </Link>
        <ShareButton />
      </div>
    </main>
  );
}
