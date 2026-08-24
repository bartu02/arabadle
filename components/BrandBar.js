/**
 * Sayfanın en üstünde ince şerit. Her ekranda aynı yerde durup siteyi tek
 * bir işarete bağlıyor.
 *
 * Eskiden Al/Sat/Yak'ın üç rengiydi. Anket bir mod haline gelince o üç renk
 * siteye ait olmaktan çıktı — şerit artık plakanın mavisi, yani sitenin
 * kendi rengi. Üç renkli işaret Al, Sat, Yak modunun içinde yaşıyor.
 */
export default function BrandBar() {
  return <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[3px] bg-plate" />;
}
