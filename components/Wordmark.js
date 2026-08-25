import { t } from "@/lib/i18n";

/**
 * Sitenin adı.
 *
 * Önceki hâlinde solda mavi bir "TR" bloğu vardı; site "Plaka" adını
 * taşıdığı sürece o blok adın görsel karşılığıydı. Ad "Arabadle" olunca
 * plaka göndermesi anlamını yitirdi ve geriye açıklanamayan bir grafik
 * kalırdı. Yerine dolu bir kare kondu: Wordle'dan gelen bütün `-dle`
 * oyunlarının ortak işareti bu, yani kullanıcı ne tür bir site olduğunu
 * addan önce anlıyor.
 *
 * Kare **mavi** kalıyor. Yeşil ilk akla gelen olurdu ama hem Al, Sat, Yak
 * hem Klasik yeşil/sarı/kırmızı kullanıyor; marka yeşili o üçlüyle
 * karışırdı. Mavi, oyun anlamı taşımayan tek renk.
 *
 * Site adı yalnızca burada ve tr.json'da geçiyor; değiştirmek iki yer.
 */
export default function Wordmark({ compact = false }) {
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={`inline-block shrink-0 bg-brand ${
          compact ? "size-[0.72em]" : "size-[0.62em]"
        }`}
      />
      <span className="pl-[0.26em]">{t("app.title")}</span>
    </span>
  );
}
