/**
 * OG kartlarının ortak parçaları.
 *
 * Paylaşım linki bu oyunların büyüme yolu: sonucu kopyalayan oyuncu
 * linkiyle birlikte gönderiyor. `/sonuc` için bir kart baştan beri
 * vardı ama `/` ve `/klasik` çıplak link olarak gidiyordu — yani sitenin
 * kendisi paylaşıldığında hiçbir görsel çıkmıyordu.
 *
 * Satori tuzağı (bkz. app/sonuc/.../opengraph-image.js): birden fazla
 * çocuğu olan her div'de `display: flex` açıkça yazılmalı, ve metin tek
 * düğüm olarak verilmeli.
 */

export const OG_BOYUT = { width: 1200, height: 630 };

export const OG_RENK = {
  bg: "#08090c",
  ink: "#f5f6f8",
  muted: "#9096a3",
  brand: "#3b82f6",
  hit: "#35c46f",
  near: "#e0a92e",
  miss: "#ba4035",
  // Al, Sat, Yak modunun kendi üç rengi.
  buy: "#3ddc84",
  sell: "#f5b544",
  burn: "#ff4d3d",
};

/** Klasik'in altı kutusu. Türün işareti: kart görülünce ne olduğu anlaşılıyor. */
export const OG_KUTULAR = ["miss", "hit", "miss", "near", "miss", "near", "hit"];

export function OgKutuSeridi({ boy = 62, aralik = 12 }) {
  return (
    <div style={{ display: "flex", gap: aralik }}>
      {OG_KUTULAR.map((durum, i) => (
        <div
          key={i}
          style={{ width: boy * 1.6, height: boy, background: OG_RENK[durum] }}
        />
      ))}
    </div>
  );
}

/** Sitenin adı: dolu mavi kare + ad, ekrandaki wordmark'ın aynısı. */
export function OgWordmark({ ad, boyut = 56 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: boyut * 0.28 }}>
      <div style={{ width: boyut * 0.62, height: boyut * 0.62, background: OG_RENK.brand }} />
      <div style={{ fontSize: boyut, fontWeight: 800, color: OG_RENK.ink }}>{ad}</div>
    </div>
  );
}

/** Bütün kartların dış kabuğu: zemin, kenar boşluğu, üstteki marka şeridi. */
export function OgCerceve({ children }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: OG_RENK.bg,
        color: OG_RENK.ink,
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", height: 10, background: OG_RENK.brand }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          padding: 72,
        }}
      >
        {children}
      </div>
    </div>
  );
}
