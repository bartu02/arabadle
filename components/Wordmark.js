import { t } from "@/lib/i18n";

/**
 * Sitenin adı. Plaka referansı skeuomorfik bir grafik değil, tek bir
 * işaret: solda mavi blok, yanında ad. Türk plakasının silueti bu kadarla
 * tanınıyor ve SPEC 7'nin "dekoratif öğe yok" kuralını zorlamıyor.
 *
 * Site adı yalnızca burada ve tr.json'da geçiyor; değiştirmek iki yer.
 */
export default function Wordmark({ compact = false }) {
  return (
    <span className="inline-flex items-stretch">
      <span
        aria-hidden="true"
        className={`flex items-center bg-plate text-bg ${
          compact ? "px-1 text-[0.5em]" : "px-1.5 text-[0.42em]"
        } font-bold leading-none tracking-normal`}
      >
        TR
      </span>
      <span className="pl-[0.18em]">{t("app.title")}</span>
    </span>
  );
}
