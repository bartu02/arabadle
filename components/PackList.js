"use client";

import { useState } from "react";

import PackCard from "./PackCard";

// Aynı anda tek paket açık kalsın; liste kalabalıklaşmasın.
export default function PackList({ packs }) {
  const [openSlug, setOpenSlug] = useState(null);

  return (
    <ul className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {packs.map((pack, index) => (
        <li key={pack.slug}>
          <PackCard
            pack={pack}
            index={index + 1}
            open={openSlug === pack.slug}
            onToggle={() =>
              setOpenSlug((current) => (current === pack.slug ? null : pack.slug))
            }
            onClose={() => setOpenSlug(null)}
          />
        </li>
      ))}
    </ul>
  );
}
