"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Trophy, Music, ArrowRight } from "lucide-react";

// ─── mock data ───────────────────────────────────────────────────────────────

const TRACK = {
  artist: "Jordanwells",
  titleA: "Version 1 — Original Mix",
  titleB: "Version 2 — Radio Edit",
  genre: "Future Bass",
  reviewsOrdered: 7,
};

const SCORES = {
  a: { production: 3.3, originality: 3.1, vocals: 3.4, wouldListenAgain: 3, firstImpression: { hook: 1, decent: 4, lost: 2 } },
  b: { production: 4.2, originality: 3.9, vocals: 4.1, wouldListenAgain: 6, firstImpression: { hook: 4, decent: 2, lost: 1 } },
  platform: { production: 3.4, originality: 3.3, vocals: 3.5 },
};

const WINNER_VOTES = { a: 2, b: 5 };

const TECHNICAL = {
  a: { lowEnd: "BOTH_MUDDY", vocalClarity: "CRYSTAL_CLEAR", highEnd: "PERFECT", stereo: "GOOD_BALANCE", dynamics: "TOO_COMPRESSED" },
  b: { lowEnd: "PERFECT",    vocalClarity: "CRYSTAL_CLEAR", highEnd: "PERFECT", stereo: "GOOD_BALANCE", dynamics: "GREAT_DYNAMICS" },
};

const FEEDBACK_A = [
  { reviewer: "Reviewer 1", best: "The melodies are genuinely catchy and the vocals sit well in the arrangement.", main: "The low end feels muddy and the mix loses energy around the two minute mark. It kind of plateaus when it should be building. The compression is also quite heavy which makes everything feel squashed and a bit fatiguing." },
  { reviewer: "Reviewer 2", best: "Strong intro, pulls you in quickly and the vocal performance is solid throughout.", main: "For me the mix feels a bit flat overall. The kick and bass are clashing and the low end is unclear which makes the whole thing feel less punchy than it should. Also the dynamics feel squashed, like theres no real breathing room." },
  { reviewer: "Reviewer 3", best: "The hook is memorable and the songwriting is strong. Good energy in the first section.", main: "After the first chorus the track kind of just maintains the same level without doing anything new or surprising. The low end also needs work, its muddy and takes away from the punch." },
];

const FEEDBACK_B = [
  { reviewer: "Reviewer 1", best: "The production on this version is noticeably cleaner. The low end hits properly and the mix has real depth.", main: "Honestly not much to flag. The middle section could maybe have a slightly more dramatic build but the track resolves well and the overall feel is polished." },
  { reviewer: "Reviewer 2", best: "The dynamics are way better here — you can feel the track breathe. The drop lands hard because of it.", main: "The only thing I noticed is that the arrangement is fairly linear. There are no real surprises. But the mix quality is strong and the vocal sits perfectly." },
  { reviewer: "Reviewer 3", best: "Every element has its own space in this mix. The bass is clear and defined, the vocals cut through and the whole thing feels cohesive.", main: "A small thing — the outro goes on a bit long. Could trim 15-20 seconds off the end. Otherwise this is a very solid mix." },
];

const TECH_ROWS = [
  { label: "Low End",      keyA: "lowEnd",      keyB: "lowEnd",      goodValue: "PERFECT"       },
  { label: "Vocal Clarity",keyA: "vocalClarity",keyB: "vocalClarity",goodValue: "CRYSTAL_CLEAR" },
  { label: "High End",     keyA: "highEnd",     keyB: "highEnd",     goodValue: "PERFECT"       },
  { label: "Stereo Width", keyA: "stereo",      keyB: "stereo",      goodValue: "GOOD_BALANCE"  },
  { label: "Dynamics",     keyA: "dynamics",    keyB: "dynamics",    goodValue: "GREAT_DYNAMICS"},
] as const;

// ─── sub-components ──────────────────────────────────────────────────────────

function ScoreBar({ score, max = 5, winner = false }: { score: number; max?: number; winner?: boolean }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-black/6 overflow-hidden">
        <div className={`h-full transition-all ${winner ? "bg-purple-600" : "bg-black/15"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-black tabular-nums w-8 text-right ${winner ? "text-purple-600" : "text-black/30"}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function TechBadge({ value, good }: { value: string; good: boolean }) {
  const LABELS: Record<string, string> = {
    BOTH_MUDDY: "Muddy Low End", CRYSTAL_CLEAR: "Vocals Clear", PERFECT: "Clean",
    GOOD_BALANCE: "Good Stereo", GREAT_DYNAMICS: "Clean", TOO_COMPRESSED: "Over-compressed",
    TOO_HARSH: "Harsh Highs", TOO_NARROW: "Too Narrow",
  };
  const label = LABELS[value] ?? value.replace(/_/g, " ");
  return good
    ? <span className="text-xs font-bold text-emerald-600">✓ {label}</span>
    : <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600">{label}</span>;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ABTestDemoPage() {
  const [feedbackTab, setFeedbackTab] = useState<"a" | "b">("b");
  const totalVotes = WINNER_VOTES.a + WINNER_VOTES.b;
  const bPct = Math.round((WINNER_VOTES.b / totalVotes) * 100);
  const aPct = 100 - bPct;

  return (
    <div className="max-w-3xl mx-auto pb-16">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div className="bg-[#0f0f18] -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 mb-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Admin Overview
        </Link>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400/60 mb-2">Compare Results — Demo</p>
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">{TRACK.artist}</h1>
        <p className="text-[15px] text-white/40 mt-2">{TRACK.genre} · {TRACK.reviewsOrdered} reviewers</p>
      </div>

      <div className="space-y-6">

        {/* ── WINNER HERO ──────────────────────────────────────────── */}
        <div className="border border-black/10 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-black/10">
            <div className="bg-[#faf7f2] px-5 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-1.5">Track A</p>
              <p className="text-sm font-bold text-black leading-snug">{TRACK.titleA}</p>
            </div>
            <div className="bg-purple-600 px-5 py-5 relative">
              <div className="absolute top-4 right-4">
                <Trophy className="h-4 w-4 text-yellow-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 mb-1.5">Track B — Winner</p>
              <p className="text-sm font-bold text-white leading-snug">{TRACK.titleB}</p>
            </div>
          </div>

          {/* Vote bar */}
          <div className="border-t border-black/10">
            <div className="flex h-9 overflow-hidden">
              <div className="flex items-center justify-center bg-black/5 text-xs font-black text-black/40 transition-all" style={{ width: `${aPct}%` }}>
                {WINNER_VOTES.a} vote{WINNER_VOTES.a !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center justify-center bg-purple-600 text-xs font-black text-white transition-all" style={{ width: `${bPct}%` }}>
                {WINNER_VOTES.b} votes
              </div>
            </div>
            <div className="flex border-t border-black/8 text-[10px] font-black uppercase tracking-wider">
              <div className="flex-1 px-5 py-2 text-black/30">{aPct}%</div>
              <div className="px-5 py-2 text-purple-600">{bPct}% preferred this</div>
            </div>
          </div>
        </div>

        {/* ── SCORES ───────────────────────────────────────────────── */}
        <div className="border border-black/10 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8">
            <h2 className="text-sm font-black text-black">Score Breakdown</h2>
            <p className="text-xs text-black/35 mt-0.5">Average across {TRACK.reviewsOrdered} reviews · out of 5</p>
          </div>

          <div className="p-5 space-y-6">
            {(["production", "originality", "vocals"] as const).map((metric) => {
              const labels = { production: "Production Quality", originality: "Originality", vocals: "Vocal Score" };
              const aScore = SCORES.a[metric];
              const bScore = SCORES.b[metric];
              const platScore = SCORES.platform[metric];
              const bWins = bScore > aScore;
              return (
                <div key={metric}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black/40">{labels[metric]}</span>
                    <span className="text-[10px] text-black/25">Platform avg {platScore.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-black/30 mb-2">Track A</p>
                      <ScoreBar score={aScore} winner={!bWins} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-400 mb-2">Track B ← Winner</p>
                      <ScoreBar score={bScore} winner={bWins} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Would listen again */}
            <div className="pt-4 border-t border-black/6 grid grid-cols-2 gap-3">
              <div className="bg-[#faf7f2] px-4 py-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-black/30 mb-1.5">Would listen again</p>
                <p className="text-3xl font-black text-black/40">{SCORES.a.wouldListenAgain}<span className="text-sm font-bold text-black/20">/{TRACK.reviewsOrdered}</span></p>
                <p className="text-[10px] text-black/25 mt-1">Track A</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 px-4 py-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1.5">Would listen again</p>
                <p className="text-3xl font-black text-purple-600">{SCORES.b.wouldListenAgain}<span className="text-sm font-bold text-purple-300">/{TRACK.reviewsOrdered}</span></p>
                <p className="text-[10px] text-purple-400 mt-1">Track B</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── FIRST IMPRESSION ─────────────────────────────────────── */}
        <div className="border border-black/10 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8">
            <h2 className="text-sm font-black text-black">First Impression</h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {(["a", "b"] as const).map((v) => {
              const fi = SCORES[v].firstImpression;
              const isWinner = v === "b";
              return (
                <div key={v} className={`p-4 border ${isWinner ? "border-purple-200 bg-purple-50" : "border-black/8 bg-[#faf7f2]"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-wider mb-4 ${isWinner ? "text-purple-500" : "text-black/30"}`}>
                    Track {v.toUpperCase()}{isWinner ? " — Winner" : ""}
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Hooked",       value: fi.hook,   color: isWinner ? "bg-purple-500" : "bg-black/20" },
                      { label: "Decent",        value: fi.decent, color: isWinner ? "bg-purple-300" : "bg-black/10" },
                      { label: "Lost interest", value: fi.lost,   color: "bg-red-300" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: TRACK.reviewsOrdered }).map((_, i) => (
                            <div key={i} className={`h-3.5 w-3.5 ${i < value ? color : "bg-black/4"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-black/40">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TECHNICAL ────────────────────────────────────────────── */}
        <div className="border border-black/10 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8">
            <h2 className="text-sm font-black text-black">Technical Issues Flagged</h2>
            <p className="text-xs text-black/35 mt-0.5">Aggregated from reviewer checkboxes</p>
          </div>
          <div className="divide-y divide-black/5">
            {TECH_ROWS.map(({ label, keyA, keyB, goodValue }) => {
              const aVal = TECHNICAL.a[keyA];
              const bVal = TECHNICAL.b[keyB];
              return (
                <div key={label} className="grid grid-cols-[1fr_90px_1fr] items-center px-5 py-3.5">
                  <TechBadge value={aVal} good={aVal === goodValue} />
                  <span className="text-[10px] font-black text-center text-black/25 uppercase tracking-wider">{label}</span>
                  <div className="flex justify-end">
                    <TechBadge value={bVal} good={bVal === goodValue} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── WRITTEN FEEDBACK ─────────────────────────────────────── */}
        <div className="border border-black/10 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between">
            <h2 className="text-sm font-black text-black">What Reviewers Said</h2>
            <div className="flex border border-black/10 overflow-hidden">
              {(["a", "b"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFeedbackTab(v)}
                  className={`px-4 py-2 text-xs font-black transition-all border-r border-black/10 last:border-r-0 ${
                    feedbackTab === v
                      ? v === "b" ? "bg-purple-600 text-white" : "bg-[#1a1a1a] text-white"
                      : "text-black/35 hover:text-black hover:bg-[#faf7f2]"
                  }`}
                >
                  Track {v.toUpperCase()}{v === "b" ? " 🏆" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-black/5">
            {(feedbackTab === "a" ? FEEDBACK_A : FEEDBACK_B).map((f, i) => (
              <div key={i} className="px-5 py-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-black/25">{f.reviewer}</p>
                <div className="space-y-2.5">
                  <div className="flex gap-3">
                    <div className="w-0.5 bg-emerald-400 flex-shrink-0 mt-1" />
                    <p className="text-sm text-black/70 leading-relaxed">{f.best}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-0.5 bg-amber-400 flex-shrink-0 mt-1" />
                    <p className="text-sm text-black/50 leading-relaxed">{f.main}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── VERDICT ──────────────────────────────────────────────── */}
        <div className="bg-purple-600 p-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-4 w-4 text-yellow-300" />
            <h2 className="text-base font-black text-white">What this tells you</h2>
          </div>
          <p className="text-[15px] text-white/75 leading-relaxed">
            Track B is the clear release candidate. Reviewers consistently flagged the low end and compression in Version 1 — issues that Version 2 resolves. The first impression data is especially telling: 4 out of 7 listeners were hooked by Track B vs 1 for Track A. Release Track B.
          </p>
          <div className="flex gap-2.5 pt-1">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 text-xs font-black hover:bg-[#faf7f2] transition-colors">
              <Music className="h-3.5 w-3.5" />
              Use Track B
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white text-xs font-black hover:bg-white/20 transition-colors">
              View full feedback
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
