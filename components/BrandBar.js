import { LABELS } from "@/lib/game";

// Sayfanın en üstünde ince üç renkli şerit. OG kartındaki işaretin aynısı;
// her ekranda aynı yerde durup ürünü tek bir şeye bağlıyor.
const COLOR = { buy: "bg-buy", sell: "bg-sell", burn: "bg-burn" };

export default function BrandBar() {
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 flex h-[3px]">
      {LABELS.map((label) => (
        <div key={label} className={`flex-1 ${COLOR[label]}`} />
      ))}
    </div>
  );
}
