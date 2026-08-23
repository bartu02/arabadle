// Etiket sırası her yerde aynı: Al, Sat, Yak.
// Klavye kısayolları da bu sıraya bağlı (1, 2, 3).
export const LABELS = ["buy", "sell", "burn"];

// Fisher-Yates. Girdiyi bozmaz.
export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Turları kurar: önce paketin kendi üçlüleri, yetmiyorsa kalanı diğer
 * paketlerden. Kullanıcı paketi seçtiği için önce onun içeriğini görür.
 */
export function buildRounds(ownTrios, otherTrios, count) {
  const rounds = shuffle(ownTrios).slice(0, count);
  const missing = count - rounds.length;

  if (missing > 0) {
    rounds.push(...shuffle(otherTrios).slice(0, missing));
  }

  return rounds;
}

// Hiçbir etiket yerleşmemiş durum.
export const NOTHING_ASSIGNED = { buy: null, sell: null, burn: null };

/**
 * Etiket atama kuralı (SPEC bölüm 6.2). Saf fonksiyon, girdiyi bozmaz.
 *
 * - Zaten bu kartta duran etikete tekrar basılırsa seçim kalkar.
 * - Etiket başka karttaysa buraya taşınır, eskisi boşalır.
 * - Bir kart tek etiket taşır: bu kartın önceki etiketi boşalır.
 */
export function assignLabel(current, itemId, label) {
  if (current[label] === itemId) return { ...current, [label]: null };

  const next = { ...current, [label]: itemId };

  for (const other of LABELS) {
    if (other !== label && next[other] === itemId) next[other] = null;
  }

  return next;
}

export function isComplete(assignment) {
  return LABELS.every((label) => assignment[label] !== null);
}
