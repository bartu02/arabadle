/**
 * Klasik modun tarayıcı hafızası.
 *
 * Tek dosyada duruyor çünkü üç yer okuyor: oyun tahtası (bugünkü tahminler),
 * istatistik penceresi (dağılım, seri) ve ana sayfadaki "bugün oynandı"
 * rozeti. Anahtar üç yerde ayrı yazılsaydı biri değişince diğerleri sessizce
 * boş kayıt okurdu.
 *
 * Sunucuya hiçbir şey gitmiyor: hesap yok, oturum yok. Bedeli açık —
 * tarayıcı verisi silinirse seri de gider. Alternatifi hesap eklemekti,
 * o da v1 kapsamı dışı (SPEC 2).
 */

export const DEPO = "arabadle-klasik-v1";

/** İlk kez açan oyuncunun kaydı. */
export const BOS = {
  numara: null,
  tahminler: [],
  cevap: null,
  seri: 0,
  enIyiSeri: 0,
  sonKazanan: null,
  // Hangi bulmaca "oynanan" olarak sayıldı.
  sayilan: null,
  oynanan: 0,
  bulunan: 0,
  dagilim: {},
  // "Nasıl oynanır" bir kez kendiliğinden açılıyor, sonra düğmeye kalıyor.
  nasilGoruldu: false,
};

/** Dağılım çubuğunun son kovası: 7 ve üstü tek satırda toplanıyor. */
export const SON_KOVA = 7;

/** localStorage her yerde çalışmıyor (gizli sekme, kapalı site verisi). */
export function oku() {
  try {
    const ham = window.localStorage.getItem(DEPO);
    return ham ? { ...BOS, ...JSON.parse(ham) } : { ...BOS };
  } catch {
    return { ...BOS };
  }
}

export function yaz(deger) {
  try {
    window.localStorage.setItem(DEPO, JSON.stringify(deger));
  } catch {
    // Kaydedemiyorsak oyun yine oynanır, sadece yenilemede sıfırlanır.
  }
}

/**
 * Yeni bulmacaya ilk tahmin girildiğinde "oynanan" bir artıyor.
 *
 * Sayaç ilk tahminde artıyor, sayfa açılışında değil: siteyi açıp hiç
 * tahmin etmeden çıkan biri oyunu oynamış sayılmamalı, yoksa başarı
 * yüzdesi ziyaret sayısına bölünürdü.
 *
 * Ayrı bir `sayilan` alanı tutuluyor, `numara`ya bakılmıyor. İlk yazımda
 * koşul "kayit.numara === numara ise sayma" idi ve sayaç hiç artmadı:
 * tahtanın kayıt efekti sayfa açılır açılmaz `numara`yı yazıyor, yani
 * ilk tahmin geldiğinde alan çoktan bugüne eşitti.
 */
export function baslat(kayit, numara) {
  if (kayit.sayilan === numara) return kayit;
  return { ...kayit, sayilan: numara, oynanan: kayit.oynanan + 1 };
}

/**
 * Bulmaca çözüldüğünde istatistikleri günceller.
 *
 * Seri ancak **dün de** kazanılmışsa uzuyor; bir gün atlanınca sıfırdan
 * başlıyor. Kaç günün atlandığına bakılmıyor, "dün müydü" yeterli.
 */
export function bitir(kayit, numara, tahminSayisi) {
  const seri = kayit.sonKazanan === numara - 1 ? kayit.seri + 1 : 1;
  const kova = Math.min(tahminSayisi, SON_KOVA);

  return {
    ...kayit,
    seri,
    enIyiSeri: Math.max(kayit.enIyiSeri, seri),
    sonKazanan: numara,
    bulunan: kayit.bulunan + 1,
    dagilim: { ...kayit.dagilim, [kova]: (kayit.dagilim[kova] ?? 0) + 1 },
  };
}

/** Ortalama tahmin sayısı. Dağılım boşsa null. */
export function ortalamaTahmin(dagilim) {
  let adet = 0;
  let toplam = 0;
  for (const [kova, sayi] of Object.entries(dagilim)) {
    adet += sayi;
    toplam += Number(kova) * sayi;
  }
  return adet === 0 ? null : toplam / adet;
}
