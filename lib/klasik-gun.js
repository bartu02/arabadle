import "server-only";

import { createHash } from "node:crypto";

/**
 * Günün arabasını seçer. Bu dosya server-only ve öyle kalmalı.
 *
 * Wordle'ın kelime listesi istemcideydi ve ilk haftalarda datamine edildi.
 * Bizde de aynı yüzey var: sunucu bileşeninden props'a konan her şey
 * sayfanın RSC yüküne düşüyor ve düz metin olarak okunabiliyor — bu
 * projede bizzat kullanıldı (scratchpad/bias-live.mjs üçlü kimliklerini
 * oradan okuyor). Cevap istemciye hiç inmiyor; karşılaştırma /api/tahmin
 * içinde yapılıp geriye yalnızca renkler dönüyor.
 */

/**
 * Tuz olmasa sıra herkesçe hesaplanabilirdi. IP özetiyle aynı yaklaşım:
 * ayrı bir değişken varsa onu kullan, yoksa secret anahtardan türet.
 *
 * Sır olan gün numarası değil — o zaten arayüzde yazıyor — **günden
 * arabaya giden eşleme**. Bu yüzden takvim hesabı lib/klasik.js'te,
 * paylaşılan tarafta duruyor; burada yalnızca permütasyon var.
 */
const TUZ = process.env.KLASIK_SALT || process.env.SUPABASE_SECRET_KEY || "yerel-gelistirme";

function mulberry32(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tohumla(...parcalar) {
  const ozet = createHash("sha256").update([TUZ, ...parcalar].join(":")).digest();
  return ozet.readUInt32BE(0);
}

/**
 * Havuzu bir dönem boyunca karıştırır ve gün numarasına düşen arabayı verir.
 *
 * Neden dönem: doğrudan hash alıp mod almak (`hash(gün) % n`) tekrarları
 * getiriyor — 210 arabada aynı araba ortalama 18 gün içinde ikinci kez
 * çıkıyor. Dönem başına bir permütasyon üretmek, 210 günlük bir turda
 * hiçbir arabanın tekrarlamamasını garanti ediyor.
 *
 * `mod` parametresi ileride Fotoğraf modu için: aynı gün iki modda aynı
 * araba çıkarsa biri diğerini ele veriyor. Farklı mod, farklı sıra.
 *
 * Uyarı: havuza araba eklenirse permütasyon değişir ve o günün cevabı gün
 * ortasında kayabilir. İçerik seyrek değiştiği için kabul edilebilir;
 * araba eklerken günün bitmesini beklemek yeterli.
 */
export function gununSlugu(sluglar, numara, mod = "klasik") {
  if (sluglar.length === 0) return null;

  const n = sluglar.length;
  const indeks = ((numara - 1) % n + n) % n;
  const donem = Math.floor((numara - 1) / n);

  // Kaynak sıra kararlı olmalı: veritabanı satırları farklı sırada
  // gelirse aynı gün farklı cevap çıkardı.
  const sirali = [...sluglar].sort();
  const rastgele = mulberry32(tohumla(mod, String(donem)));

  for (let i = sirali.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [sirali[i], sirali[j]] = [sirali[j], sirali[i]];
  }

  return sirali[indeks];
}
