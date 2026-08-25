import { headers } from "next/headers";

/**
 * schema.org JSON-LD'sini sayfaya basar.
 *
 * **Bu, uygulamadaki tek `dangerouslySetInnerHTML`.** Güvenlik notu
 * (CLAUDE.md) "hiçbir yerde yok" diyordu; artık bir tane var ve sınırı
 * net: içeriği yalnızca `lib/yapisal-veri.js`'teki sabit metinlerden
 * (tr.json + site adresi) `JSON.stringify` ile üretiliyor. Kullanıcıdan,
 * veritabanından ya da istekten gelen hiçbir şey buraya girmiyor.
 * JSON-LD'yi basmanın React'te başka yolu yok — metin çocuğu olarak
 * verilirse React tırnakları kaçırıp JSON'u bozuyor.
 *
 * `<` yine de `<`'ye çevriliyor: veri sabit olsa da, birinin sonradan
 * araba adı gibi dinamik bir alan eklemesi hâlinde `</script>` dizisi
 * etiketi kapatamasın.
 *
 * Nonce şart: CSP `script-src 'self' 'nonce-...'` diyor. `ld+json`
 * çalıştırılabilir bir script değil ve çoğu tarayıcı bloklamıyor ama
 * bloklayan da var; nonce'ı vermek bedava.
 */
export default async function YapisalVeri({ veri }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(veri).replace(/</g, "\\u003c"),
      }}
    />
  );
}
