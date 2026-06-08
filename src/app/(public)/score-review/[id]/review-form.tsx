"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function ReviewForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const valid = rating >= 1 && headline.trim().length > 0 && quote.trim().length >= 20;

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
        {submitting ? "submitting…" : "submit my reaction"}
      </button>
    </form>
  );
}
