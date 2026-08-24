"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import TrioCard from "./TrioCard";
import { LABELS, NOTHING_ASSIGNED, assignLabel, isComplete } from "@/lib/game";
import { t } from "@/lib/i18n";

export default function GameBoard({ pack, rounds }) {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [assignment, setAssignment] = useState(NOTHING_ASSIGNED);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // "vote" -> etiketler dağıtılıyor, "reveal" -> kalabalık açıldı.
  const [phase, setPhase] = useState("vote");
  const [stats, setStats] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  // Hiçbir tur kaydedilemediyse sonuç ekranının gösterecek verisi olmaz.
  const [savedRounds, setSavedRounds] = useState(0);

  // Adım 7'de sonuç ekranı bu listeden beslenecek.
  const [answers, setAnswers] = useState([]);

  // Anonim, client'ta üretilir, hiçbir yere kaydedilmez.
  // İlk oyda üretiliyor ki sunucu render'ında hydration uyuşmazlığı olmasın.
  const sessionIdRef = useRef(null);
  function sessionId() {
    if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID();
    return sessionIdRef.current;
  }

  const trio = rounds[roundIndex] ?? null;
  const complete = isComplete(assignment);
  const lastRound = roundIndex === rounds.length - 1;

  const assign = useCallback((itemId, label) => {
    setAssignment((current) => assignLabel(current, itemId, label));
  }, []);

  async function confirmRound() {
    if (!complete || !trio || sending) return;

    setSending(true);
    setSendFailed(false);

    try {
      const response = await fetch("/api/oy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trioId: trio.id,
          sessionId: sessionId(),
          votes: LABELS.map((label) => ({
            itemId: assignment[label],
            label,
          })),
        }),
      });

      if (!response.ok) throw new Error(String(response.status));

      const data = await response.json();
      setStats(data.stats);
      setHighlight(data.highlight ?? null);
      setSavedRounds((current) => current + 1);
    } catch {
      // Tur yine de açılsın; oy kaydı gitmediyse yüzde yerine tek satır uyarı.
      setSendFailed(true);
      setStats(null);
      setHighlight(null);
    } finally {
      setAnswers((current) => [...current, { trioId: trio.id, ...assignment }]);
      setSending(false);
      setHoveredIndex(null);
      setPhase("reveal");
    }
  }

  function nextRound() {
    if (lastRound) {
      if (savedRounds > 0) router.push(`/sonuc/${sessionId()}`);
      else setRoundIndex((current) => current + 1); // veri yok, kapanış ekranı
      return;
    }

    setAssignment(NOTHING_ASSIGNED);
    setStats(null);
    setHighlight(null);
    setSendFailed(false);
    setPhase("vote");
    setRoundIndex((current) => current + 1);
  }

  // Masaüstü klavye: kartın üstündeyken 1 / 2 / 3. Sadece oy aşamasında.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (phase !== "vote" || hoveredIndex === null || !trio) return;

      const position = ["1", "2", "3"].indexOf(event.key);
      if (position === -1) return;

      event.preventDefault();
      assign(trio.items[hoveredIndex].id, LABELS[position]);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, hoveredIndex, trio, assign]);

  // Turun tek öne çıkan satırı. Hangi kuralın tuttuğu sunucuda seçildi;
  // burada sadece metne çevriliyor.
  function highlightText() {
    if (!highlight) return "";

    const item = trio.items.find((candidate) => candidate.id === highlight.itemId);

    return t(`highlight.${highlight.kind}`, {
      item: item?.name ?? "",
      label: highlight.label ? t(`labels.${highlight.label}`) : "",
      percent: highlight.percent ?? "",
    });
  }

  if (!trio) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("game.finished")}
        </p>
        <p className="mt-3 text-muted">{t("game.resultSoon")}</p>
        <Link
          href="/al-sat-yak"
          className="mt-8 inline-block bg-ink px-6 py-3 text-sm font-semibold text-bg -outline-offset-2 focus-visible:outline-bg"
        >
          {t("game.backHome")}
        </Link>
      </div>
    );
  }

  const revealing = phase === "reveal";

  return (
    <div className="flex flex-1 flex-col md:min-h-0">
      <header className="mb-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-sm font-medium text-muted">
            <Link href="/al-sat-yak" className="hover:text-ink">
              {pack.title}
            </Link>
          </h1>
          <p aria-live="polite" className="text-sm font-medium text-muted tabular-nums">
            {t("game.counter", {
              current: roundIndex + 1,
              total: rounds.length,
            })}
          </p>
        </div>

        {/* Turun neresindeyiz. Sayaç zaten yazıyor, bu onun görünür hali;
            süs değil. Geçiş yok — animasyon sadece açılışta (SPEC 7). */}
        <div aria-hidden="true" className="mt-3 h-0.5 w-full bg-line">
          <div
            className="h-full bg-ink"
            style={{ width: `${((roundIndex + 1) / rounds.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Kartlar ve altındaki satır tek blok halinde dikeyde ortalanır.
          Fotoğraf artık kırpılmadığı için yüksekliği kart genişliğine
          bağlı; blok ortalanmazsa masaüstünde boşluk alta yığılıyordu. */}
      <div className="flex flex-1 flex-col md:min-h-0 md:justify-center">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {trio.items.map((item, index) => (
          <TrioCard
            key={item.id}
            item={item}
            assignment={assignment}
            onAssign={assign}
            onEnter={() => setHoveredIndex(index)}
            onLeave={() => setHoveredIndex(null)}
            reveal={revealing}
            stat={stats?.[item.id] ?? null}
          />
        ))}
      </div>

      <div aria-live="polite" className="mt-6 flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {revealing ? (
          sendFailed ? (
            <p className="text-sm text-muted">{t("reveal.error")}</p>
          ) : (
            // SPEC 6.3: turun en önemli satırı, görsel olarak öne çıkıyor.
            <p className="min-w-0 flex-1 text-2xl font-extrabold leading-snug tracking-[-0.02em] sm:text-3xl">
              {highlightText()}
            </p>
          )
        ) : (
          <p className="text-sm text-muted">
            {complete ? "" : t("game.assignAll")}
          </p>
        )}

        {revealing ? (
          <button
            type="button"
            onClick={nextRound}
            className="bg-ink px-8 py-3.5 text-sm font-semibold text-bg -outline-offset-2 focus-visible:outline-bg"
          >
            {lastRound ? t("reveal.last") : t("reveal.next")}
          </button>
        ) : (
          <button
            type="button"
            onClick={confirmRound}
            disabled={!complete || sending}
            className="bg-ink px-8 py-3.5 text-sm font-semibold text-bg -outline-offset-2 focus-visible:outline-bg disabled:opacity-25"
          >
            {sending ? t("game.sending") : t("game.confirm")}
          </button>
        )}
      </div>

      {!revealing && (
        <p className="mt-3 hidden text-xs text-muted md:block">
          {t("game.keyboardHint")}
        </p>
      )}
      </div>
    </div>
  );
}
