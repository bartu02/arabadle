import { LABELS } from "./game.js";

// Bir arabada bundan az oy varsa yüzde göstermeyiz (SPEC 6.3).
// Sıfırlık veya %100'lük saçma istatistik çıkmasın diye.
export const MIN_VOTES_FOR_PERCENT = 20;

/**
 * Ham sayımları tam sayı yüzdeye çevirir.
 *
 * En büyük kalan yöntemi: aşağı yuvarlamadan artan payı en büyük ondalığı
 * olanlara dağıtır, böylece toplam her zaman tam 100 eder. Naif yuvarlama
 * 99 veya 101 üretir ve çubuklar gözle görülür biçimde yanlış durur.
 */
export function toPercents(counts) {
  const total = LABELS.reduce((sum, label) => sum + counts[label], 0);
  if (total === 0) return { buy: 0, sell: 0, burn: 0 };

  const exact = LABELS.map((label) => ({
    label,
    value: (counts[label] * 100) / total,
  }));

  const percents = {};
  let used = 0;
  for (const { label, value } of exact) {
    percents[label] = Math.floor(value);
    used += percents[label];
  }

  const byRemainder = [...exact].sort(
    (a, b) => (b.value % 1) - (a.value % 1)
  );
  for (let i = 0; i < 100 - used; i += 1) {
    percents[byRemainder[i % byRemainder.length].label] += 1;
  }

  return percents;
}

/** En çok oy alan etiket. Beraberlikte LABELS sırası kazanır. */
export function topLabel(counts) {
  return LABELS.reduce((best, label) =>
    counts[label] > counts[best] ? label : best
  );
}

/**
 * Bir üçlünün oy satırlarını arabaya göre özetler.
 * Hesap sunucuda burada yapılır; client'a hazır yüzde iner.
 */
export function summarise(voteRows, itemIds) {
  const stats = {};

  for (const itemId of itemIds) {
    const counts = { buy: 0, sell: 0, burn: 0 };

    for (const row of voteRows) {
      if (row.item_id === itemId && counts[row.label] !== undefined) {
        counts[row.label] += 1;
      }
    }

    const total = counts.buy + counts.sell + counts.burn;
    const enough = total >= MIN_VOTES_FOR_PERCENT;

    stats[itemId] = {
      total,
      enough,
      percents: enough ? toPercents(counts) : null,
      top: enough ? topLabel(counts) : null,
    };
  }

  return stats;
}

// Bir arabada tek yönde bu orana ulaşılırsa "neredeyse oy birliği" sayılır.
export const NEAR_UNANIMOUS = 90;

/**
 * Turda gösterilecek TEK öne çıkan istatistiği seçer (SPEC 6.3).
 *
 * Öncelik sırası, en çok konuşulacak olandan en az olana:
 *   1. neredeyse oy birliği — nadir, o yüzden en değerli
 *   2. azınlık            — üç arabada da kalabalıkla ters düşmüş
 *   3. ayrışma            — bir kısmında ters, en çok ayrıştığı araba
 *   4. çoğunluk           — üçünde de kalabalıkla aynı, en sıradan sonuç
 *
 * SPEC üç kural sayıyor ama her turda bir satır istiyor; kullanıcı üçün
 * bir veya ikisinde ayrıldığında hiçbiri tutmuyordu. Dördüncü kural o
 * boşluğu dolduruyor ve ayrıştığı arabayı adıyla söylüyor.
 *
 * Yeterli oyu olmayan arabalar hesaba katılmaz; hiçbiri yeterli değilse
 * satır gösterilmez — veri azken saçma istatistik çıkmasın.
 */
export function pickHighlight(stats, ownLabels) {
  const cars = Object.entries(stats)
    .filter(([itemId, stat]) => stat.enough && ownLabels[itemId])
    .map(([itemId, stat]) => ({
      itemId,
      own: ownLabels[itemId],
      ownPercent: stat.percents[ownLabels[itemId]],
      topLabel: stat.top,
      topPercent: stat.percents[stat.top],
      agrees: stat.top === ownLabels[itemId],
    }));

  if (cars.length === 0) return null;

  const unanimous = cars.find((car) => car.topPercent >= NEAR_UNANIMOUS);
  if (unanimous) {
    return {
      kind: "unanimous",
      itemId: unanimous.itemId,
      label: unanimous.topLabel,
      percent: unanimous.topPercent,
    };
  }

  const agreeing = cars.filter((car) => car.agrees).length;

  if (agreeing === 0) return { kind: "minority" };
  if (agreeing === cars.length) return { kind: "majority" };

  const outlier = cars
    .filter((car) => !car.agrees)
    .reduce((worst, car) => (car.ownPercent < worst.ownPercent ? car : worst));

  return {
    kind: "outlier",
    itemId: outlier.itemId,
    label: outlier.own,
    percent: outlier.ownPercent,
  };
}
