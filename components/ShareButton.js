"use client";

import { useState } from "react";

import { t } from "@/lib/i18n";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano izni yoksa kullanıcı adres çubuğundan kopyalayabilir.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-muted -outline-offset-2"
    >
      {copied ? t("result.copied") : t("result.copy")}
    </button>
  );
}
