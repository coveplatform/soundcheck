"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ScoreRing } from "@/components/score/score-ring";
import {
  ArrowRight,
  Share2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Music,
  ChevronRight,
} from "lucide-react";

// ── Demo report data ──────────────────────────────────────────────
const DEMO = {
  trackTitle: "Midnight Drive",
  genre: "Electronic",
  reviewerCount: 5,
  score: 82,
  percentile: 27,
  verdict: "ALMOST_THERE" as const,
  scoredAt: "May 20, 2025",
  categories: [
    { label: "Hook Strength", score: 4.2, max: 5, pct: 84 },
    { label: "Production Quality", score: 3.8, max: 5, pct: 76 },
    { label: "Listener Retention", score: 3.4, max: 5, pct: 68 },
    { label: "Emotional Impact", score: 4.0, max: 5, pct: 80 },
    { label: "Commercial Potential", score: 3.6, max: 5, pct: 72 },
  ],
  reviewerQuotes: [
    {
      initial: "S",
      genre: "Electronic · Pop",
      rating: 4,
      quote:
        "The hook at 0:45 is instantly memorable — I caught myself humming it after the first listen. The breakdown at 2:15 creates real tension before the second drop. Synth layering is really well done.",
      positive: true,
    },
    {
      initial: "M",
      genre: "Hip-Hop · R&B",
      rating: 5,
      quote:
        "Production is clean throughout. The sidechain on the bass gives it a professional bounce. Bass and kick relationship is tight — low end is well managed. This one is close to release-ready.",
      positive: true,
    },
    {
      initial: "A",
      genre: "Electronic",
      rating: 3,
      quote:
        "Intro drags a bit — you don't reach the hook until 0:45 which is a long wait in this genre. Would tighten that up. Vocal around 1:30 also competes with the lead synth slightly.",
      positive: false,
    },
  ],
  aiSummary:
    "This track demonstrates strong melodic hooks and professional production throughout. The main drop is well-constructed with a memorable synth lead and tight low-end management. The primary opportunity for improvement lies in the intro pacing — reaching the hook 8–12 seconds earlier would better align with listener expectations in the electronic genre. The vocal clarity in the bridge section could also be improved to let the performance shine.",
  priorityFixes: [
    {
      label: "Trim the intro by 8–12 seconds",
      detail: "Get to the hook faster — genre expectation is ~0:30, not 0:45.",
      count: 4,
    },
    {
      label: "Lift vocal in the bridge (around 1:30)",
      detail:
        "Vocal competes with the lead synth. Try dipping the synth 2–3dB in that section.",
      count: 3,
    },
    {
      label: "Add variation to the outro",
      detail:
        "Last 20 seconds feel like a repeat. Filter the highs out gradually or add a new melodic element.",
      count: 2,
    },
  ],
};

type Verdict = "RELEASE_READY" | "ALMOST_THERE" | "NEEDS_WORK" | "NOT_READY";

const VERDICTS: Record<
  Verdict,
  { label: string; color: string; bg: string; border: string; text: string }
> = {
  RELEASE_READY: {
    label: "Release Ready",
    color: "bg-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
  },
  ALMOST_THERE: {
    label: "Almost There",
    color: "bg-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-300",
  },
  NEEDS_WORK: {
    label: "Needs Work",
    color: "bg-orange-500",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-300",
  },
  NOT_READY: {
    label: "Not Ready",
    color: "bg-red-500",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-300",
  },
};

function StarRow({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i < count ? "bg-purple-500" : "bg-white/12"}`}
        />
      ))}
    </div>
  );
}

function CategoryBar({
  label,
  score,
  max,
  pct,
}: {
  label: string;
  score: number;
  max: number;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className="text-sm font-black text-neutral-950 tabular-nums">
          {score} <span className="text-neutral-400 font-medium">/ {max}</span>
        </span>
      </div>
      <div className="h-2.5 bg-black/6 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [copied, setCopied] = useState(false);
  const isDemo = true; // real page would check params.id === "demo" or fetch

  const verdict = VERDICTS[DEMO.verdict];
  const isTop = DEMO.percentile <= 25;

  const handleShare = () => {
    navigator.clipboard
      .writeText(typeof window !== "undefined" ? window.location.href : "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* ── STICKY HEADER ────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-black/6">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-2.5">
              {isDemo && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                  Demo Report
                </span>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-1.5 rounded-lg border border-black/8 hover:border-black/20"
              >
                <Share2 className="h-3 w-3" />
                {copied ? "Copied!" : "Share"}
              </button>
              <Link href="/submit-score">
                <button className="inline-flex items-center gap-1.5 bg-purple-600 text-white hover:bg-purple-700 font-black text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-lg transition-colors">
                  Get your score
                  <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── SCORE HERO (dark, dramatic) ───────────────── */}
      <section className="bg-neutral-950 text-white overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 60%, rgba(147,51,234,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 relative">
          <div className="flex flex-col items-center text-center">
            {/* Report label */}
            <div className="inline-flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-3.5 py-1.5 text-[10px] font-black text-white/50 uppercase tracking-widest mb-8">
              <Music className="h-3 w-3" />
              MixReflect Score Report
            </div>

            {/* Track info */}
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">
              {DEMO.trackTitle}
            </h1>
            <p className="text-sm text-white/40 mb-8">
              {DEMO.genre} ·{" "}
              <span className="text-white/40">{DEMO.reviewerCount} reviewers</span>{" "}
              · {DEMO.scoredAt}
            </p>

            {/* Score ring */}
            <div className="relative mb-7">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ background: "#9333ea", transform: "scale(0.8)" }}
              />
              <ScoreRing score={DEMO.score} size="xl" dark animate />
            </div>

            {/* Percentile */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`${verdict.bg} border ${verdict.border} rounded-full px-5 py-2 text-sm font-black ${verdict.text} uppercase tracking-widest`}
                >
                  {verdict.label}
                </div>
              </div>

              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  Top {DEMO.percentile}% of tracks
                </p>
                <p className="text-sm text-white/35 mt-0.5">
                  on MixReflect this month
                </p>
              </div>

              {/* Percentile bar */}
              <div className="w-56 sm:w-72 mt-1">
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${100 - DEMO.percentile}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-white/25 font-mono">
                    bottom
                  </span>
                  <span className="text-[10px] text-white/25 font-mono">
                    top
                  </span>
                </div>
              </div>
            </div>

            {/* Reviewer avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["S", "M", "A", "J", "R"].map((letter, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-purple-600/40 border-2 border-neutral-950 flex items-center justify-center text-[10px] font-black text-purple-200"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/35">
                {DEMO.reviewerCount} listeners scored this track
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center pb-6">
          <div className="flex flex-col items-center gap-1 opacity-25">
            <div className="w-px h-8 bg-white" />
            <div className="text-[9px] font-mono text-white uppercase tracking-widest">
              scroll
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        {/* ── CATEGORY SCORES ──────────────────────── */}
        <section className="bg-white rounded-2xl border border-black/6 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-7">
            <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-950">
                Score Breakdown
              </h2>
              <p className="text-xs text-neutral-400">
                Averaged across {DEMO.reviewerCount} reviewers
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {DEMO.categories.map((cat) => (
              <CategoryBar key={cat.label} {...cat} />
            ))}
          </div>
        </section>

        {/* ── REVIEWER VOICES ──────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="h-8 w-8 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Music className="h-4 w-4 text-neutral-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-950">
                Reviewer Voices
              </h2>
              <p className="text-xs text-neutral-400">
                Real feedback, anonymised
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {DEMO.reviewerQuotes.map((rev, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-black/6 p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-sm font-black text-purple-700 flex-shrink-0">
                      {rev.initial}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-neutral-700">
                        Reviewer {i + 1}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {rev.genre}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${rev.positive ? "bg-emerald-100" : "bg-amber-100"}`}
                  >
                    {rev.positive ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    )}
                  </div>
                </div>

                <StarRow count={rev.rating} />

                <p className="text-xs text-neutral-600 leading-relaxed flex-1">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI SYNTHESIS ─────────────────────────── */}
        <section className="bg-white rounded-2xl border border-black/6 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-xl bg-neutral-900 flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-950">
                What the Data Says
              </h2>
              <p className="text-xs text-neutral-400">
                Synthesised from {DEMO.reviewerCount} reviewer scores
              </p>
            </div>
          </div>

          <div className="bg-[#faf8f5] rounded-xl p-5 border border-black/6">
            <p className="text-sm text-neutral-700 leading-relaxed">
              {DEMO.aiSummary}
            </p>
          </div>
        </section>

        {/* ── PRIORITY IMPROVEMENTS ────────────────── */}
        <section className="bg-amber-50 rounded-2xl border border-amber-200/60 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-950">
                Priority Improvements
              </h2>
              <p className="text-xs text-neutral-500">
                Ranked by how many reviewers mentioned it
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {DEMO.priorityFixes.map((fix, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white rounded-xl p-4 border border-amber-200/50"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-[11px] font-black mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-neutral-900">
                    {fix.label}
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    {fix.detail}
                  </p>
                </div>
                <div className="flex-shrink-0 text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {fix.count}/5
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SHARE SCORE SECTION ──────────────────── */}
        <section
          className="rounded-2xl p-6 sm:p-8 text-white overflow-hidden relative"
          style={{
            background:
              "linear-gradient(135deg, #2d1060 0%, #1a0533 50%, #0f0f0f 100%)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: "#9333ea" }}
          />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Mini score card */}
            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2.5">
              <ScoreRing score={DEMO.score} size="md" dark animate={false} />
              <div className="text-center">
                <p className="text-[11px] font-black text-purple-300">
                  Top {DEMO.percentile}%
                </p>
                <p className="text-[10px] text-amber-300 font-black uppercase tracking-wider">
                  Almost There
                </p>
              </div>
            </div>

            {/* Text + share buttons */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-black text-white mb-1">
                Share your MixReflect Score
              </h3>
              <p className="text-sm text-white/50 mb-5 max-w-xs">
                Let your audience, your label, or your producer see where you
                stand.
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-black text-xs px-4 py-2 rounded-lg border border-white/15 transition-all"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {copied ? "Link copied!" : "Copy link"}
                </button>
                <Link href="/submit-score">
                  <button className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-lg border border-purple-500 transition-all">
                    Score another track
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────── */}
        <section className="bg-neutral-900 rounded-2xl p-6 sm:p-8 text-white text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 mb-3">
            Ready to benchmark your music?
          </p>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
            Get your track scored. $9.
          </h3>
          <p className="text-sm text-white/45 mb-7 max-w-sm mx-auto">
            5 real listeners. A score out of 100. Your percentile. Exactly
            what to fix. In 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/submit-score">
              <button className="inline-flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-500 font-black text-sm px-7 py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Get My Score — $9
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/">
              <button className="inline-flex items-center gap-2 bg-white/8 text-white/70 hover:bg-white/12 font-semibold text-sm px-6 py-3.5 rounded-xl border border-white/10 transition-all">
                <ChevronRight className="h-4 w-4" />
                Explore MixReflect
              </button>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-black/6 mt-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-xs text-neutral-400">
          <Link href="/">
            <Logo />
          </Link>
          <p>© {new Date().getFullYear()} MixReflect</p>
        </div>
      </footer>
    </div>
  );
}
