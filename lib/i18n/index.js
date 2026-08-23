import tr from "./tr.json";

// v1'de tek dil var. Dil seçici yok, ikinci sözlük yok — tüm arayüz metni
// buradan geçsin diye tek giriş noktası.
export const dict = tr;

/**
 * Noktalı yol ile metin okur: t("rounds.question")
 * Karşılığı yoksa yolun kendisini döndürür, böylece eksik metin gözden kaçmaz.
 *
 * Yer tutucular süslü parantezle yazılır ve params ile doldurulur:
 *   t("home.trioCount", { count: 2 })  ->  "2 üçlü"
 */
export function t(path, params) {
  const value = path
    .split(".")
    .reduce((acc, key) => (acc == null ? acc : acc[key]), dict);

  if (typeof value !== "string") return path;
  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  );
}
