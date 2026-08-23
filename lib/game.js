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
 * Bir üçlünün seçilme ağırlığı.
 *
 * Sorun şuydu: turlar 70 üçlü arasından düz rastgele seçilince oylar
 * inceliyor ve hiçbir üçlü eşiği geçemiyordu — 70 üçlünün sıfırı açıktı.
 * Oyunun tek fikri (kalabalık ne dedi) hiç çalışmıyordu.
 *
 * Sezgiye ters olan kısım: "en az oyu olana öncelik ver" işe yaramıyor.
 * O, oyları 70 üçlüye eşit dağıtır ve hiçbiri eşiği geçmeden hepsi birlikte
 * yavaşça yükselir. Doğrusu tersi — **eşiği geçmeye en yakın** olana ağırlık
 * vermek. Böylece üçlüler tek tek açılır, oyun ilk birkaç oyunda konuşmaya
 * başlar.
 *
 * Eşiği geçmiş üçlü taban ağırlığa döner, yani kendi kendini dengeliyor:
 * açılanlar öne geçmeyi bırakır, sıra bir sonrakine gelir.
 */
/**
 * Ağırlık katsayısı. Ölçülerek seçildi (scratchpad/bias-tune.mjs,
 * 70 üçlü · 16 tur · eşik 8 · 40 tekrarın ortalaması):
 *
 *   eğri              ilk açılan oyun   20. oyunda açık   ardışık tekrar
 *   düz (ağırlıksız)        14.9              5.0              %23
 *   BIAS=8                   9.8             18.7              %33
 *   BIAS=25                  9.0             26.7              %45
 *
 * Teorik en iyi 8 (bir üçlünün eşiği geçmesi için 8 oyun gerekiyor);
 * 25 pratikte oraya yakın ve orta vadede en çok üçlüyü açan değer.
 *
 * Bedeli ardışık iki oyunda tekrar eden üçlü oranının artması. Bu geçici:
 * üçlüler eşiği geçtikçe ağırlıkları tabana döndüğü için tekrar oranı
 * kendiliğinden düşüyor. Oyunun hiç konuşmamasından iyi.
 */
const BIAS = 25;

export function trioWeight(oySayisi, threshold) {
  if (oySayisi >= threshold) return 1;
  return 1 + BIAS * (oySayisi / threshold);
}

/**
 * Ağırlıklı, tekrarsız örnekleme. Girdiyi bozmaz.
 * Ağırlıklar eşitse davranış shuffle ile aynı.
 */
export function weightedSample(list, count, weightOf) {
  const kalan = [...list];
  const agirlik = kalan.map(weightOf);
  const secilen = [];

  while (secilen.length < count && kalan.length > 0) {
    const toplam = agirlik.reduce((a, b) => a + b, 0);
    let hedef = Math.random() * toplam;

    let i = 0;
    while (i < kalan.length - 1 && hedef > agirlik[i]) {
      hedef -= agirlik[i];
      i += 1;
    }

    secilen.push(kalan[i]);
    kalan.splice(i, 1);
    agirlik.splice(i, 1);
  }

  return secilen;
}

/**
 * Turları kurar: önce paketin kendi üçlüleri, yetmiyorsa kalanı diğer
 * paketlerden. Kullanıcı paketi seçtiği için önce onun içeriğini görür.
 *
 * counts: üçlü id -> o üçlüyü oynamış oturum sayısı. Boş verilirse
 * bütün ağırlıklar eşitlenir ve davranış eski düz rastgeleye döner —
 * sayaç okunamazsa oyun yine çalışsın diye.
 */
export function buildRounds(ownTrios, otherTrios, count, counts, threshold) {
  const agirlik = (trio) =>
    counts && threshold ? trioWeight(counts.get(trio.id) ?? 0, threshold) : 1;

  const rounds = weightedSample(ownTrios, count, agirlik);
  const missing = count - rounds.length;

  if (missing > 0) {
    rounds.push(...weightedSample(otherTrios, missing, agirlik));
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
