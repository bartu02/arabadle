import { notFound } from "next/navigation";

import GameBoard from "@/components/GameBoard";
import { buildRounds } from "@/lib/game";
import { t } from "@/lib/i18n";
import { MIN_VOTES_FOR_PERCENT } from "@/lib/votes";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROUND_CHOICES = [8, 16];

const ITEM_FIELDS = "id, slug, name, year_label, image_url, image_credit";

// trios'un items'a üç ayrı foreign key'i var; PostgREST'e hangisi olduğunu
// kısıt adıyla söylemek gerekiyor.
const TRIO_SELECT = `
  id,
  item_a:items!trios_item_a_id_fkey (${ITEM_FIELDS}),
  item_b:items!trios_item_b_id_fkey (${ITEM_FIELDS}),
  item_c:items!trios_item_c_id_fkey (${ITEM_FIELDS})
`;

function toRound(row) {
  return { id: row.id, items: [row.item_a, row.item_b, row.item_c] };
}

function readRoundCount(value) {
  const parsed = Number.parseInt(value, 10);
  return ROUND_CHOICES.includes(parsed) ? parsed : ROUND_CHOICES[0];
}

async function loadGame(packSlug, roundCount) {
  const supabase = getSupabaseServerClient();

  const pack = await supabase
    .from("packs")
    .select("id, slug, title")
    .eq("slug", packSlug)
    .maybeSingle();

  if (pack.error) throw new Error(pack.error.message);
  if (!pack.data) return null;

  const own = await supabase
    .from("trios")
    .select(TRIO_SELECT)
    .eq("pack_id", pack.data.id)
    .order("sort_order", { ascending: true });

  if (own.error) throw new Error(own.error.message);

  const ownRounds = (own.data ?? []).map(toRound);
  let otherRounds = [];

  if (ownRounds.length < roundCount) {
    const others = await supabase
      .from("trios")
      .select(TRIO_SELECT)
      .neq("pack_id", pack.data.id);

    if (others.error) throw new Error(others.error.message);
    otherRounds = (others.data ?? []).map(toRound);
  }

  // Üçlü başına oy sayısı: turlar eşiğe yakın olanlara doğru ağırlıklanıyor
  // (lib/game.js -> trioWeight). Sayaç okunamazsa oyun düz rastgeleye
  // düşüyor — eski davranış, yani oynanabilirlik buna bağımlı değil.
  let counts = null;
  const sayac = await supabase.rpc("trio_vote_counts");
  if (sayac.error) {
    console.error("Üçlü oy sayıları okunamadı, tur seçimi düz rastgele:", sayac.error.message);
  } else {
    counts = new Map((sayac.data ?? []).map((satir) => [satir.trio_id, satir.oturum]));
  }

  return {
    pack: { slug: pack.data.slug, title: pack.data.title },
    rounds: buildRounds(ownRounds, otherRounds, roundCount, counts, MIN_VOTES_FOR_PERCENT),
  };
}

export default async function GamePage({ params, searchParams }) {
  const { packSlug } = await params;
  const { tur } = await searchParams;

  const roundCount = readRoundCount(tur);

  let game = null;
  let failed = false;

  try {
    game = await loadGame(packSlug, roundCount);
  } catch (error) {
    console.error("Oyun yüklenemedi:", error.message);
    failed = true;
  }

  if (!failed && !game) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col px-5 py-5 sm:px-8 sm:py-6 md:h-[calc(100dvh-var(--h-baslik))]">
      {failed && <p className="text-muted">{t("game.error")}</p>}
      {!failed && game.rounds.length === 0 && (
        <p className="text-muted">{t("game.empty")}</p>
      )}
      {!failed && game.rounds.length > 0 && (
        <GameBoard pack={game.pack} rounds={game.rounds} />
      )}
    </main>
  );
}
