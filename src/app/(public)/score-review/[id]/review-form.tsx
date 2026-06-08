"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

// Force reviewers to actually sit with the track before they can submit.
// Shorter than the artist-side review (3 min) — these are quick room reactions.
const LISTEN_SECONDS = 45;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function ReviewForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── listen gate ──
  const [elapsed, setElapsed] = useState(0);
  const listened = elapsed >= LISTEN_SECONDS;

  useEffect(() => {
    if (listened) return;
    const t = setInterval(() => {
      setElapsed((e) => (e >= LISTEN_SECONDS ? e : e + 1));
    }, 1000);
    return () => clearInterval(t);
  }, [listened]);

  const valid =
    listened && rating >= 1 && headline.trim().length > 0 && quote.trim().length >= 20;
  const listenPct = Math.min(100, Math.round((elapsed / LISTEN_SECONDS) * 100));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/score-review/${reviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          headline,
          quote,
          positive: rating >= 3,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push("/score-review");
      router.refresh();
    } catch {
      setError("Failed to submit. Try again.");
      setSubmitting(false);
    }
  };

  const inputCls = `${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none transition-colors normal-case`;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* listen gate */}
      <div
        className="border p-4"
        style={{
          borderColor: listened ? "rgba(110,231,255,0.35)" : "rgba(255,255,255,0.12)",
          background: listened ? "rgba(110,231,255,0.06)" : "#101010",
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className={`${mono.className} text-[12px]`} style={{ color: listened ? ACCENT : "rgba(255,255,255,0.6)" }}>
            {listened ? "✓ listened — your reaction's unlocked" : "play the track and give it a real listen"}
          </span>
          <span className={`${mono.className} text-[12px] tabular-nums text-white/45`}>
            {fmt(Math.min(elapsed, LISTEN_SECONDS))} / {fmt(LISTEN_SECONDS)}
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.08] overflow-hidden">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${listenPct}%`, background: ACCENT }}
          />
        </div>
      </div>

      {/* rating */}
      <div>
        <label className={`${mono.className} block text-[12px] text-white/45 mb-2`}>
          your rating <span style={{ color: ACCENT }}>*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} of 5`}
              className="w-11 h-11 flex items-center justify-center border text-base font-bold transition-colors"
              style={{
                borderColor: n <= rating ? ACCENT : "rgba(255,255,255,0.15)",
                background: n <= rating ? ACCENT : "transparent",
                color: n <= rating ? "#000" : "rgba(255,255,255,0.5)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* headline */}
      <div>
        <label className={`${mono.className} block text-[12px] text-white/45 mb-2`}>
          one-line reaction <span style={{ color: ACCENT }}>*</span>
          <span className="text-white/25"> (shown free on the report)</span>
        </label>
        <input
          type="text"
          value={headline}
          maxLength={140}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. hook caught me straight away"
          className={inputCls}
        />
      </div>

      {/* quote */}
      <div>
        <label className={`${mono.className} block text-[12px] text-white/45 mb-2`}>
          your full reaction <span style={{ color: ACCENT }}>*</span>
          <span className="text-white/25"> (gated until the artist unlocks)</span>
        </label>
        <textarea
          value={quote}
          rows={5}
          maxLength={1200}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="how did it actually land? what worked, where did it lose you? talk like a real listener — honest and specific."
          className={`${inputCls} resize-none`}
        />
        <p className={`${mono.className} text-[11px] text-white/30 mt-1.5`}>
          {quote.trim().length < 20 ? `${20 - quote.trim().length} more characters` : "looks good"}
        </p>
      </div>

      {error && <p className={`${mono.className} text-[13px] text-red-400`}>{error}</p>}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="w-full bg-[#6ee7ff] text-black font-extrabold text-base py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting
          ? "submitting…"
          : !listened
          ? `keep listening… ${fmt(LISTEN_SECONDS - Math.min(elapsed, LISTEN_SECONDS))} left`
          : "submit my reaction"}
      </button>
    </form>
  );
}
