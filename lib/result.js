import { MIN_VOTES_FOR_PERCENT, topLabel } from "./votes.js";

/**
 * Bir oturumun sonucunu çıkarır (SPEC 6.4). Saf fonksiyon.
 *
 * sessionVotes: kullanıcının oyları, tur sırasında
 * crowdVotes:   aynı üçlülere gelen tüm oylar
 *
 * Uyum yüzdesi yalnızca yeterli oyu olan arabalar üzerinden hesaplanır;
 * hiçbiri yeterli değilse null döner ve ekranda sayı gösterilmez.
 */
export function buildResult(sessionVotes, crowdVotes) {
  // Sayımlar üçlü+araba başına: aynı araba başka üçlüde farklı sonuç verebilir.
  const counts = new Map();

  for (const row of crowdVotes) {
    const key = `${row.trio_id}|${row.item_id}`;
    if (!counts.has(key)) counts.set(key, { buy: 0, sell: 0, burn: 0 });

    const tally = counts.get(key);
    if (tally[row.label] !== undefined) tally[row.label] += 1;
  }

  const garage = [];
  const scrapyard = [];
  let scored = 0;
  let matched = 0;

  for (const vote of sessionVotes) {
    if (vote.label === "buy") garage.push(vote.item_id);
    if (vote.label === "burn") scrapyard.push(vote.item_id);

    const tally = counts.get(`${vote.trio_id}|${vote.item_id}`);
    if (!tally) continue;

    const total = tally.buy + tally.sell + tally.burn;
    if (total < MIN_VOTES_FOR_PERCENT) continue;

    scored += 1;
    if (topLabel(tally) === vote.label) matched += 1;
  }

  return {
    garage,
    scrapyard,
    rounds: new Set(sessionVotes.map((vote) => vote.trio_id)).size,
    scored,
    agreement: scored === 0 ? null : Math.round((matched / scored) * 100),
  };
}
