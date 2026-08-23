import { LABELS } from "@/lib/game";
import { t } from "@/lib/i18n";

// Ürünün adı zaten üç etiketin kendisi. Renklendirince kullanıcı oyunun
// renk kodunu daha ana sayfada öğreniyor (SPEC 7: "kartı okumadan
// renkten anlamalı"). Dekoratif değil, anlam taşıyor.
const COLOR = { buy: "text-buy", sell: "text-sell", burn: "text-burn" };

export default function Wordmark() {
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
