/**
 * Sitenin modları. Tek kaynak: hem üst nav (components/SiteHeader.js) hem
 * ana sayfadaki kartlar (app/page.js) buradan okuyor. İkisi ayrı listeyle
 * yaşarken yeni mod eklemek iki yerde düzenleme demekti.
 *
 * `href` null ise mod henüz yapılmadı: kart görünür ama tıklanmaz.
 * LoLdle/Cardle de yapılmamış modu gizlemek yerine gösteriyor; kullanıcı
 * sitenin nereye gittiğini görüyor.
 *
 * Sıra bilinçli: **oynanabilir modlar önce.** Önceki hâlinde "Fotoğraf"
 * (yakında) ilk karttı, yani ana sayfaya gelen ilk gördüğü şey
 * oynayamadığı bir kutuydu.
 *
 * `cars` ana sayfadaki kartın fotoğrafı. Her kart kendi mekaniğini
 * gösteriyor: Klasik tek araba + kutu şeridi, Al Sat Yak üç araba yan
 * yana (oyunun kendisi bu), Fotoğraf aşırı yakın bir kırpma. Slug'lar
 * lib/photos.js'te; bulunamazsa kart fotoğrafsız çiziliyor.
 */
export const MODES = [
  { key: "classic", href: "/klasik", cars: ["porsche-911-992"] },
  {
    key: "poll",
    href: "/al-sat-yak",
    cars: ["fiat-egea", "range-rover-l460", "peugeot-205-gti-19"],
  },
  { key: "photo", href: null, cars: ["ferrari-296-gtb"] },
];
