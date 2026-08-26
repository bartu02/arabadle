/**
 * Klasik modun kuralları. Saf fonksiyonlar — istemci de sunucu da okur.
 *
 * Burada **cevap yok**. Günün arabasını seçen kod lib/klasik-gun.js'te ve
 * o dosya server-only: cevap props olarak istemciye inerse sayfanın RSC
 * yükünden okunabiliyor (bu projede bir kez yapıldı, bkz. bias-live.mjs).
 */

/** Kutular soldan sağa. Paylaşım ızgarası da bu sırayı kullanıyor. */
export const ALANLAR = ["brand", "country", "body", "fuel", "drivetrain", "power", "year"];

// --- takvim ------------------------------------------------------------------
// Gün sınırı Türkiye saatiyle: oyuncular burada, bulmaca gece yarısı
// değişsin. Yaz saati uygulaması 2016'da kaldırıldı, sabit +03 doğru.
//
// Bu hesap paylaşılan tarafta çünkü sır değil: gün numarası zaten ekranda
// yazıyor ve istemci geri sayımı kendi gösteriyor. Sır olan tek şey o
// numaranın hangi arabaya düştüğü (lib/klasik-gun.js).

const TR_OFFSET_MS = 3 * 60 * 60 * 1000;
const GUN_MS = 86_400_000;

/** 1 numaralı bulmaca. Değiştirilirse bütün numaralar kayar. */
const BASLANGIC = Math.floor(Date.UTC(2026, 7, 24) / GUN_MS);

export function bugununNumarasi(now = Date.now()) {
  return Math.floor((now + TR_OFFSET_MS) / GUN_MS) - BASLANGIC + 1;
}

/** Bir sonraki gün sınırına kaç ms kaldı. */
export function gunSonunaKalan(now = Date.now()) {
  return GUN_MS - ((now + TR_OFFSET_MS) % GUN_MS);
}

export const DURUM = { TAM: "hit", YAKIN: "near", UZAK: "miss" };

/**
 * Yıl eşikleri: ±1 yeşil, ±3 sarı.
 *
 * CarSpotr ve Poeltl ±2 kullanıyor ama bizim havuzumuz modern tarafa
 * yığılmış — 210 arabanın 122'si 2015 sonrası. Ölçüldü: ±2'de rastgele
 * iki arabanın yılı %21.1 ihtimalle yeşil oluyor, yani oyuncu hiçbir şey
 * bilmeden her beş tahminin birinde yeşil görüyor ve kutu anlamını
 * yitiriyor. ±1'de bu oran %13.2.
 *
 * Asıl iş yükünü ok taşıyor: renk ne olursa olsun yön her tahminde
 * görünüyor ve her zaman bilgi veriyor.
 */
export const YIL_TAM = 1;
export const YIL_YAKIN = 3;

/**
 * Beygir esikleri: yuzde bant, mutlak fark degil.
 *
 * Mutlak olsaydi tek bir esik iki ucta da yanlis olurdu: 20 PS, 100 PS
 * lik bir Sahin ile 830 PS lik bir Ferrari icin ayni sey degil. Yuzde
 * bant oraniyla olcuyor.
 *
 * Bant ayni olcutle secildi (scratchpad/tahmin/beygir-dogrula.mjs):
 * rastgele iki arabanin yesil olma ihtimali yil alanindaki %13.2 ye en
 * yakin olsun. Olculen: +-%5 -> %6.4, +-%10 -> %12.7, +-%15 -> %18.3.
 * +-%10 secildi.
 *
 * Yan fayda: veri yuzde bantla olculdugu icin 10-15 PS lik bir hata
 * rengi cogu zaman degistirmiyor. Havuzun 32 arabasinda "TR de hangi
 * motor yaygin" tartisilir (bkz. beygir.mjs guven alani) ve bant bu
 * belirsizligi yutuyor.
 */
export const BEYGIR_TAM = 0.1;
export const BEYGIR_YAKIN = 0.25;

/**
 * Marka sarısı = aynı gruptan başka bir marka (Cupra dedin, Cupra değil
 * ama VAG). Ölçüldü: 210 arabanın 154'ünde çalışıyor.
 *
 * "bağımsız" bir grup değil, "grubu yok" demek — 12 farklı markadan 27
 * araba orada. Sarı verirsek Ferrari tahmini Suzuki'ye ipucu yakar ve
 * oyuncuyu yanlış yöne gönderir.
 */
const GRUPSUZ = "bağımsız";

/**
 * Yakıt sarısı: hibrit ile benzin kısmi eşleşme. Hibritin içinde benzinli
 * bir motor var, oyuncunun "yaklaştım" demesi doğru.
 *
 * Dizel ve elektrik kimseyle eşleşmiyor.
 */
const YAKIT_AILESI = [["petrol", "hybrid"]];

function esitMi(a, b) {
  return a === b ? DURUM.TAM : DURUM.UZAK;
}

/**
 * Bir tahmini cevapla karşılaştırır. İki taraf da tam bir araba kaydı:
 * { slug, brand, country, brand_group, year_start, body, fuel, drivetrain }
 */
export function karsilastir(tahmin, cevap) {
  const marka =
    tahmin.brand === cevap.brand
      ? DURUM.TAM
      : tahmin.brand_group === cevap.brand_group && cevap.brand_group !== GRUPSUZ
        ? DURUM.YAKIN
        : DURUM.UZAK;

  let yakit = esitMi(tahmin.fuel, cevap.fuel);
  if (yakit === DURUM.UZAK) {
    const aile = YAKIT_AILESI.some(
      (grup) => grup.includes(tahmin.fuel) && grup.includes(cevap.fuel)
    );
    if (aile) yakit = DURUM.YAKIN;
  }

  const fark = cevap.year_start - tahmin.year_start;
  const mutlak = Math.abs(fark);

  // Beygir farki buyuk olana bolunuyor: oran simetrik olsun, hangisinin
  // tahmin hangisinin cevap oldugu sonucu degistirmesin.
  const guc = cevap.power - tahmin.power;
  const gucOran = Math.abs(guc) / Math.max(cevap.power, tahmin.power);

  return {
    brand: { durum: marka, deger: tahmin.brand },
    country: { durum: esitMi(tahmin.country, cevap.country), deger: tahmin.country },
    body: { durum: esitMi(tahmin.body, cevap.body), deger: tahmin.body },
    fuel: { durum: yakit, deger: tahmin.fuel },
    drivetrain: {
      durum: esitMi(tahmin.drivetrain, cevap.drivetrain),
      deger: tahmin.drivetrain,
    },
    power: {
      durum:
        gucOran <= BEYGIR_TAM
          ? DURUM.TAM
          : gucOran <= BEYGIR_YAKIN
            ? DURUM.YAKIN
            : DURUM.UZAK,
      deger: tahmin.power,
      // Yil gibi: renk ne olursa olsun yon her tahminde bilgi veriyor.
      yon: guc > 0 ? "yukari" : guc < 0 ? "asagi" : null,
    },
    year: {
      durum:
        mutlak <= YIL_TAM ? DURUM.TAM : mutlak <= YIL_YAKIN ? DURUM.YAKIN : DURUM.UZAK,
      deger: tahmin.year_start,
      // Ok yalnızca yıl birebir tutmadığında anlamlı.
      yon: fark > 0 ? "yukari" : fark < 0 ? "asagi" : null,
    },
  };
}

/**
 * Kazanma ölçütü slug eşitliği, "bütün kutular yeşil" değil.
 *
 * Üç araba çifti yedi alanda da birebir aynı (911 ile Cayman GT4 gibi:
 * Alman, Porsche, coupe, benzin, arkadan itiş, aynı yıl). Orada oyuncu
 * altı yeşil görüp yine de bilememiş oluyor; arayüz bunu ayrıca söylüyor.
 */
export function kazandiMi(tahminSlug, cevapSlug) {
  return tahminSlug === cevapSlug;
}

export function hepsiTam(sonuc) {
  return ALANLAR.every((alan) => sonuc[alan].durum === DURUM.TAM);
}

// --- paylaşım ----------------------------------------------------------------

const KARE = { [DURUM.TAM]: "🟩", [DURUM.YAKIN]: "🟨", [DURUM.UZAK]: "🟥" };
const OK = { yukari: "🔼", asagi: "🔽" };

/**
 * Wordle'ın asıl büyüme motoru oyunun kendisi değil, spoiler'sız paylaşım
 * metniydi. Izgara hangi arabanın çıktığını söylemiyor, yalnızca yolu
 * gösteriyor.
 *
 * Yıl kutusu renk yerine ok basıyor: yön, sarı/gri ayrımından daha çok
 * şey anlatıyor ve satır altı kutuda kalıyor.
 */
export function paylasimIzgarasi(sonuclar) {
  return sonuclar.map((sonuc) =>
    ALANLAR.map((alan) => {
      const kutu = sonuc[alan];
      // Ok tasiyan her kutu (yil ve beygir) tam tutmuyorsa ok basiyor.
      if (kutu.yon && kutu.durum !== DURUM.TAM) return OK[kutu.yon] ?? KARE[kutu.durum];
      return KARE[kutu.durum];
    }).join("")
  );
}

/**
 * `gunSonunaKalan` çıktısını "7s 12dk" biçiminde yazar.
 *
 * Burada duruyor çünkü hem Klasik'in kazanma kartı hem ana sayfadaki
 * gün şeridi aynı metni gösteriyor; iki kopya bir süre yan yana yaşadı.
 */
export function sureMetni(ms) {
  const saat = Math.floor(ms / 3_600_000);
  const dakika = Math.floor((ms % 3_600_000) / 60_000);
  return `${saat}s ${dakika}dk`;
}
