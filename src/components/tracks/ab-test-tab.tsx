"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";

interface ABReview {
  id: string;
  abTestPreference?: string | null;
  abTestComment?: string | null;
  productionScore?: number | null;
  originalityScore?: number | null;
  vocalScore?: number | null;
  firstImpression?: string | null;
  wouldListenAgain?: boolean | null;
  lowEndClarity?: string | null;
  vocalClarity?: string | null;
  highEndQuality?: string | null;
  stereoWidth?: string | null;
  dynamics?: string | null;
  tooRepetitive?: boolean | null;
  trackLength?: string | null;
  bestPart?: string | null;
  biggestWeaknessSpecific?: string | null;
  ArtistProfile?: { User?: { name?: string | null } | null } | null;
}

interface ABTestTabProps {
  titleA: string;
  titleB: string;
  reviewsA: ABReview[];
  reviewsB: ABReview[];
}

function avg(reviews: ABReview[], field: keyof ABReview): number {
  const vals = reviews.map(r => r[field]).filter((v): v is number => typeof v === "number" && v >= 1 && v <= 5);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function ScoreBar({ score, winner }: { score: number; winner: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-black/6 overflow-hidden rounded-full">
        <div className={`h-full rounded-full transition-all ${winner ? "bg-purple-600" : "bg-black/15"}`}
          style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className={`text-sm font-black tabular-nums w-8 text-right ${winner ? "text-purple-600" : "text-black/30"}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

const TECH_GOOD: Record<string, string> = {
  lowEndClarity: "PERFECT", vocalClarity: "CRYSTAL_CLEAR",
  highEndQuality: "PERFECT", stereoWidth: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS",
};

const TECH_LABELS: Record<string, string> = {
  PERFECT: "✓ Clean", CRYSTAL_CLEAR: "✓ Clear", GOOD_BALANCE: "✓ Good",
  GREAT_DYNAMICS: "✓ Dynamic", BOTH_MUDDY: "Muddy Low End", BURIED: "Vocals Buried",
  TOO_COMPRESSED: "Over-compressed", TOO_HARSH: "Harsh Highs", TOO_NARROW: "Too Narrow",
};

function topValue(reviews: ABReview[], field: keyof ABReview): string {
  const counts = new Map<string, number>();
  for (const r of reviews) {
    const v = r[field];
    if (typeof v === "string") counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = ""; let bestN = 0;
  counts.forEach((n, k) => { if (n > bestN) { best = k; bestN = n; } });
  return best;
}

function TechBadge({ value, good }: { value: string; good: boolean }) {
  const label = TECH_LABELS[value] ?? value.replace(/_/g, " ");
  return good
    ? <span className="text-xs font-bold text-emerald-600">{label}</span>
    : <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded">{label}</span>;
}

export function ABTestTab({ titleA, titleB, reviewsA, reviewsB }: ABTestTabProps) {
  const [feedbackSide, setFeedbackSide] = useState<"a" | "b">("b");

  // Count preferences from Track A's reviews (where abTestPreference lives)
  const prefA = reviewsA.filter(r => r.abTestPreference === "VERSION_A").length;
  const prefB = reviewsA.filter(r => r.abTestPreference === "VERSION_B").length;
  const prefNone = reviewsA.filter(r => r.abTestPreference === "NO_PREFERENCE").length;
  const total = prefA + prefB + prefNone;
  const winner = prefB > prefA ? "B" : prefA > prefB ? "A" : null;

  const bPct = total > 0 ? Math.round((prefB / total) * 100) : 0;
  const aPct = total > 0 ? 100 - bPct : 0;

  const scoresA = { prod: avg(reviewsA, "productionScore"), orig: avg(reviewsA, "originalityScore"), vocal: avg(reviewsA, "vocalScore") };
  const scoresB = { prod: avg(reviewsB, "productionScore"), orig: avg(reviewsB, "originalityScore"), vocal: avg(reviewsB, "vocalScore") };

  const listenAgainA = reviewsA.filter(r => r.wouldListenAgain).length;
  const listenAgainB = reviewsB.filter(r => r.wouldListenAgain).length;

  const hookA = reviewsA.filter(r => r.firstImpression === "STRONG_HOOK").length;
  const decentA = reviewsA.filter(r => r.firstImpression === "DECENT").length;
  const lostA = reviewsA.filter(r => r.firstImpression === "LOST_INTEREST").length;
  const hookB = reviewsB.filter(r => r.firstImpression === "STRONG_HOOK").length;
  const decentB = reviewsB.filter(r => r.firstImpression === "DECENT").length;
  const lostB = reviewsB.filter(r => r.firstImpression === "LOST_INTEREST").length;

  const techFields = ["lowEndClarity", "vocalClarity", "highEndQuality", "stereoWidth", "dynamics"] as const;
  const techLabels = { lowEndClarity: "Low End", vocalClarity: "Vocals", highEndQuality: "High End", stereoWidth: "Stereo", dynamics: "Dynamics" };

  const feedbackList = feedbackSide === "a" ? reviewsA : reviewsB;
  const hasFeedback = feedbackList.some(r => r.bestPart || r.biggestWeaknessSpecific);

  if (total === 0 && reviewsA.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-bold text-black/30">No A/B results yet — reviews are still coming in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Winner hero */}
      {total > 0 && (
        <div className="border border-black/10 overflow-hidden rounded-xl">
          <div className="grid grid-cols-2 divide-x divide-black/10">
            <div className={`px-5 py-5 ${winner === "A" ? "bg-purple-600" : "bg-[#faf7f2]"} relative`}>
              {winner === "A" && <Trophy className="absolute top-3 right-3 h-4 w-4 text-yellow-300" />}
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${winner === "A" ? "text-purple-200" : "text-black/30"}`}>
                Track A{winner === "A" ? " — Winner" : ""}
              </p>
              <p className={`text-sm font-bold leading-snug ${winner === "A" ? "text-white" : "text-black"}`}>{titleA}</p>
            </div>
            <div className={`px-5 py-5 ${winner === "B" ? "bg-purple-600" : "bg-[#faf7f2]"} relative`}>
              {winner === "B" && <Trophy className="absolute top-3 right-3 h-4 w-4 text-yellow-300" />}
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${winner === "B" ? "text-purple-200" : "text-black/30"}`}>
                Track B{winner === "B" ? " — Winner" : ""}
              </p>
              <p className={`text-sm font-bold leading-snug ${winner === "B" ? "text-white" : "text-black"}`}>{titleB}</p>
            </div>
          </div>

          <div className="border-t border-black/10">
            <div className="flex h-8 overflow-hidden">
              <div className={`flex items-center justify-center text-xs font-black transition-all ${winner === "A" ? "bg-purple-600 text-white" : "bg-black/5 text-black/40"}`}
                style={{ width: `${aPct}%` }}>
                {prefA > 0 && `${prefA}`}
              </div>
              <div className={`flex items-center justify-center text-xs font-black transition-all ${winner === "B" ? "bg-purple-600 text-white" : "bg-black/5 text-black/40"}`}
                style={{ width: `${bPct}%` }}>
                {prefB > 0 && `${prefB}`}
              </div>
            </div>
            <div className="flex border-t border-black/6 text-[10px] font-black uppercase tracking-wider px-5 py-2">
              <div className="flex-1 text-black/30">{aPct}% preferred A</div>
              <div className={winner === "B" ? "text-purple-600" : "text-black/30"}>{bPct}% preferred B</div>
            </div>
          </div>
        </div>
      )}

      {/* Score comparison */}
      <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-black/6">
          <h2 className="text-sm font-black text-neutral-950">Score Breakdown</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Average across all reviews · out of 5</p>
        </div>
        <div className="p-5 space-y-5">
          {([
            { label: "Production", a: scoresA.prod, b: scoresB.prod },
            { label: "Originality", a: scoresA.orig, b: scoresB.orig },
            { label: "Vocals", a: scoresA.vocal, b: scoresB.vocal },
          ] as const).map(({ label, a, b }) => {
            if (a === 0 && b === 0) return null;
            const bWins = b > a;
            return (
              <div key={label}>
                <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-2">{label}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-black/25 mb-1.5">Track A</p>
                    <ScoreBar score={a} winner={!bWins} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-purple-400 mb-1.5">Track B</p>
                    <ScoreBar score={b} winner={bWins} />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-3 border-t border-black/6 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-black/3 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-black/30 mb-0.5">Would listen again</p>
              <p className="text-xl font-black text-black/40">{listenAgainA}<span className="text-xs font-bold text-black/20">/{reviewsA.length}</span></p>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-0.5">Would listen again</p>
              <p className="text-xl font-black text-purple-600">{listenAgainB}<span className="text-xs font-bold text-purple-300">/{reviewsB.length}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* First impression */}
      {(reviewsA.length > 0 || reviewsB.length > 0) && (
        <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/6">
            <h2 className="text-sm font-black text-neutral-950">First Impression</h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {([
              { label: "Track A", hook: hookA, decent: decentA, lost: lostA, total: reviewsA.length, isWinner: winner === "A" },
              { label: "Track B", hook: hookB, decent: decentB, lost: lostB, total: reviewsB.length, isWinner: winner === "B" },
            ]).map(({ label, hook, decent, lost, total: t, isWinner }) => (
              <div key={label} className={`rounded-xl p-4 border ${isWinner ? "border-purple-200 bg-purple-50" : "border-black/6 bg-black/2"}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-3 ${isWinner ? "text-purple-500" : "text-black/30"}`}>{label}</p>
                <div className="space-y-2">
                  {[
                    { label: "Hooked", count: hook, color: isWinner ? "bg-purple-500" : "bg-black/20" },
                    { label: "Decent", count: decent, color: isWinner ? "bg-purple-300" : "bg-black/10" },
                    { label: "Lost interest", count: lost, color: "bg-red-200" },
                  ].map(({ label: l, count, color }) => (
                    <div key={l} className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.max(t, 1) }).map((_, i) => (
                          <div key={i} className={`h-3.5 w-3.5 rounded-sm ${i < count ? color : "bg-black/4"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-black/35 ml-1">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical comparison */}
      <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-black/6">
          <h2 className="text-sm font-black text-neutral-950">Technical Issues</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Most common flag from reviewers</p>
        </div>
        <div className="divide-y divide-black/4">
          {techFields.map((field) => {
            const aVal = topValue(reviewsA, field);
            const bVal = topValue(reviewsB, field);
            if (!aVal && !bVal) return null;
            return (
              <div key={field} className="grid grid-cols-[1fr_80px_1fr] items-center px-5 py-3">
                {aVal ? <TechBadge value={aVal} good={aVal === TECH_GOOD[field]} /> : <span />}
                <span className="text-[10px] font-black text-center text-black/25 uppercase tracking-wider">{techLabels[field]}</span>
                <div className="flex justify-end">
                  {bVal ? <TechBadge value={bVal} good={bVal === TECH_GOOD[field]} /> : <span />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Written feedback */}
      {hasFeedback && (
        <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/6 flex items-center justify-between">
            <h2 className="text-sm font-black text-neutral-950">What Reviewers Said</h2>
            <div className="flex gap-1 bg-black/5 rounded-lg p-1">
              {(["a", "b"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFeedbackSide(v)}
                  className={`px-3 py-1 rounded-md text-xs font-black transition-all ${
                    feedbackSide === v
                      ? v === "b" ? "bg-purple-600 text-white shadow-sm" : "bg-white text-black shadow-sm"
                      : "text-black/40 hover:text-black/70"
                  }`}
                >
                  Track {v.toUpperCase()}{v === "b" && winner === "B" ? " 🏆" : ""}{v === "a" && winner === "A" ? " 🏆" : ""}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-black/4">
            {feedbackList.filter(r => r.bestPart || r.biggestWeaknessSpecific).map((r, i) => (
              <div key={r.id ?? i} className="px-5 py-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-black/25">
                  {r.ArtistProfile?.User?.name ?? `Reviewer ${i + 1}`}
                </p>
                {r.bestPart && (
                  <div className="flex gap-2.5">
                    <div className="w-1 flex-shrink-0 rounded-full bg-emerald-400 mt-0.5" style={{ minHeight: "1.25rem" }} />
                    <p className="text-sm text-neutral-700 leading-relaxed">{r.bestPart}</p>
                  </div>
                )}
                {r.biggestWeaknessSpecific && (
                  <div className="flex gap-2.5">
                    <div className="w-1 flex-shrink-0 rounded-full bg-amber-400 mt-0.5" style={{ minHeight: "1.25rem" }} />
                    <p className="text-sm text-neutral-500 leading-relaxed">{r.biggestWeaknessSpecific}</p>
                  </div>
                )}
                {r.abTestComment && feedbackSide === "b" && (
                  <div className="flex gap-2.5">
                    <div className="w-1 flex-shrink-0 rounded-full bg-purple-300 mt-0.5" style={{ minHeight: "1.25rem" }} />
                    <p className="text-sm text-neutral-500 italic leading-relaxed">{r.abTestComment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      {winner && (
        <div className="rounded-xl border-2 border-purple-600 bg-purple-600 p-6 text-white space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-300" />
            <h2 className="text-base font-black">The verdict</h2>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Track {winner} is your release candidate —{" "}
            {winner === "B" ? bPct : aPct}% of listeners preferred it.{" "}
            {winner === "B"
              ? `Version 2 scored higher on production and overall impression.`
              : `Version 1 resonated more strongly with listeners.`}
          </p>
        </div>
      )}

    </div>
  );
}
