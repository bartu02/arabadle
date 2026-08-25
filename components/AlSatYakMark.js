import { LABELS } from "@/lib/game";
import { t } from "@/lib/i18n";

/**
 * Al, Sat, Yak modunun kendi işareti.
 *
 * Eskiden bu sitenin wordmark'ıydı. Site artık Arabadle, anket bir mod — ama
 * üç etiketi kendi renginde yazmanın işlevi duruyor: kullanıcı oyunun renk
 * kodunu daha oynamadan öğreniyor (SPEC 7: "kartı okumadan renkten
 * anlamalı"). O yüzden silinmedi, modun içine taşındı.
 */
const COLOR = { buy: "text-buy", sell: "text-sell", burn: "text-burn" };

export default function AlSatYakMark() {
  return (
    <>
      {LABELS.map((label, index) => (
        <span key={label}>
          <span className={COLOR[label]}>{t(`labels.${label}`)}</span>
          {index < LABELS.length - 1 && <span className="text-line">, </span>}
        </span>
      ))}
    </>
  );
}
