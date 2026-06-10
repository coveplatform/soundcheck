"use client";

/**
 * DEMO: the no-score free report teaser.
 *
 * Live at /report/demo-free — a sandbox for the "free report without the
 * number" concept. Everything (copy + demo data) lives in this one file so
 * it can be iterated quickly without touching the real report-view.tsx.
 *
 * Design intent (want-to-buy without feeling like a scam):
 *  1. TWO characters, never mixed: "the read" (machine listen — already done,
 *     timestamped, falsifiable) and "the room" (5 real humans — future tense,
 *     empty seats, fills AFTER unlock). No fictional "20 listeners heard it".
 *  2. The free insight is timestamped + falsifiable — proof the read listened.
 *  3. The waveform: moment markers like SoundCloud comments — 1 free (0:43),
 *     the rest sealed with timestamps visible. Receipts with coordinates.
 *  4. The score exists but is sealed — blurred ring, needle settled.
 *  5. First words of locked prose sit OUTSIDE the blur (real text, not lorem).
 *  6. Reactions are the read from four ANGLES (producer / first-time listener /
 *     curator / hook specialist) — honest, not fake personas.
 *  7. Unlock is two-part: open the read (instant) + fill the room (incoming).
 *  8. Refund line. Sample report linked. No timers, no scarcity.
 */

import { useId } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ScoreRing } from "@/components/score/score-ring";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Lock, User, Eye, Clock } from "lucide-react";
import { CUTANDRUN } from "./cutandrun-data";
import { POWERTOOLS } from "./powertools-data";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const ACCENT = "#6ee7ff";
export const GREEN = "#7cffc4";

// ── demo data — edit freely ──────────────────────────────────────────

/** The data shape both demo report pages render. `wave` (real per-column
 * 3-band data from the worker) overrides the procedural placeholder. */
export interface TeaserData {
  trackTitle: string;
  genre: string;
  scoredAt: string;
  artworkUrl: string;
  duration: string;
  score: number;
  verdictLine: string;
  measured: { n: string; label: string }[];
  moments: { at: string; pct: number; free: boolean; note: string }[];
  freeInsight: { stamp: string; headline: string; body: string };
  fixes: { label: string; detail: string; impact: string; sealed: boolean }[];
  categories: { label: string; score: number; tag: "strongest" | "weakest" | null }[];
  summaryHeadline: string;
  summaryLead: string;
  summaryRest: string;
  angles: { who: string; rating: number; headline: string; lead: string; rest: string; positive: boolean }[];
  receipts: { summaryWords: number; categoryNotes: number; weakest: string; fixes: number; markers: number };
  room: { size: number; matched: string; etaFirst: string; etaFull: string };
  wave?: { lo: number[]; mid: number[]; hi: number[] };
}

export const DEMO: TeaserData = {
  trackTitle: "Midnight Drive",
  genre: "Electronic",
  scoredAt: "June 10, 2026",
  artworkUrl: "/activity-artwork/5.jpg",
  duration: "3:24",

  // hidden behind the seal — still rendered (blurred) so the blur is REAL
  score: 82,

  // prose verdict — warm, specific-feeling, can't be put in a spreadsheet
  verdictLine:
    "this is closer to finished than most of what comes through here — but the read kept snagging on the same two things.",

  // honest, measured stats — straight from the analysis, no fictional humans
  measured: [
    { n: "0:43", label: "hook lands" },
    { n: "2:10", label: "energy holds to" },
    { n: "2", label: "drift risks flagged" },
  ],

  // waveform moment markers — 1 free, the rest sealed (timestamps visible)
  moments: [
    { at: "0:12", pct: 6, free: false, note: "the intro sits a beat too long before anything moves" },
    { at: "0:43", pct: 21, free: true, note: "vocal entrance — best moment on the track" },
    { at: "1:38", pct: 48, free: false, note: "drift risk — the track sits in one idea here" },
    { at: "2:21", pct: 69, free: false, note: "the second lift almost pays off — almost" },
    { at: "2:58", pct: 87, free: false, note: "the ending arrives before the track is done" },
  ],

  // THE free insight — timestamped, checkable, fully free
  freeInsight: {
    stamp: "0:43",
    headline: "the vocal entrance at 0:43 is the best thing on this track.",
    body:
      "It's the moment the track leans in — the read marked it as the strongest stretch of the whole arrangement. It's also arriving about 20 seconds too late: the energy dips before it lands. The full read covers what to cut to get there sooner.",
  },

  // fixes: #1 sealed (the biggest lift), #2/#3 labels free, details locked
  fixes: [
    {
      label: "trim the intro — get to the hook 8–12 seconds sooner",
      detail:
        "The strongest moment lands at 0:43, but the energy sags before it arrives. Trimming the intro gets listeners there before they drift.",
      impact: "biggest lift",
      sealed: true,
    },
    {
      label: "add a small change in the mid-section",
      detail:
        "The read flags a drift risk around 1:38 where the track sits in one idea. A new element or a filter sweep would re-grab attention.",
      impact: "medium",
      sealed: false,
    },
    {
      label: "give the outro a softer landing",
      detail:
        "The ending comes up quick at 2:58. A short tail or fade rounds the whole thing off.",
      impact: "polish",
      sealed: false,
    },
  ],

  // category names free; strongest/weakest called out; numbers sealed
  categories: [
    { label: "Hook Strength", score: 4.2, tag: "strongest" as const },
    { label: "Production Quality", score: 3.8, tag: null },
    { label: "Listener Retention", score: 3.4, tag: "weakest" as const },
    { label: "Emotional Impact", score: 4.0, tag: null },
    { label: "Commercial Potential", score: 3.6, tag: null },
  ],

  // the honest read — first words visible, rest sealed
  summaryHeadline: "leans in early, drifts a touch mid-way.",
  summaryLead: "The opening grabs fast —",
  summaryRest:
    " the hook is doing real work by the first minute. Energy holds strong through the first drop, then drifts in the mid-section where the track sits in one idea a beat too long. The back half pulls it back and the emotional read stays warm throughout. Get people to the hook a little sooner and this holds attention the whole way.",

  // the read, listening from four distinct angles — honest, not fake people
  angles: [
    {
      who: "as a producer",
      rating: 4,
      headline: "hook caught me straight away",
      lead: "Really liked this.",
      rest:
        " The hook lands early and I caught myself humming it after. The drop has a nice bounce to it. For me the only thing was the middle felt a tiny bit long, but honestly its close.",
      positive: true,
    },
    {
      who: "as a first-time listener",
      rating: 5,
      headline: "felt release-ready to me",
      lead: "This one is clean.",
      rest:
        " Everthing sits nicely and it kept my attention the whole way. Would happily hear this on a playlist. Talented!",
      positive: true,
    },
    {
      who: "as a playlist curator",
      rating: 3,
      headline: "intro dragged a little for me",
      lead: "Solid track but",
      rest:
        " the intro took a while to get going. I wanted to hit the hook sooner. Once it kicked in I was into it though.",
      positive: false,
    },
    {
      who: "as a hook specialist",
      rating: 4,
      headline: "warm and easy to sit with",
      lead: "Nice vibe.",
      rest:
        " It felt warm and I liked where it went. The ending came up a bit quick on me, would love a little more of a wind down.",
      positive: true,
    },
  ],

  // receipts: real counts from "their" report — used in the unlock columns
  receipts: {
    summaryWords: 412,
    categoryNotes: 5,
    weakest: "listener retention",
    fixes: 3,
    markers: 5,
  },

  // the room — real humans, future tense; fills after unlock
  room: {
    size: 5,
    matched: "electronic · pop",
    etaFirst: "a few hours",
    etaFull: "48 hours",
  },
};

// ── 3-band placeholder waveform — deterministic, shaped like a track ─
// Real reports get this data from the worker (per-column LOW/MID/HIGH peaks,
// see worker `_report_waveform`); the demo fakes the same shape so the
// spearhead renderer below is production-identical.

function bandColumns(n = 560) {
  const lo = new Float32Array(n);
  const mid = new Float32Array(n);
  const hi = new Float32Array(n);
  const clamp01 = (v: number) => Math.max(0.02, Math.min(1, v));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let env = 0.3;
    if (t < 0.12) env = 0.22 + t * 1.4; // quiet intro
    else if (t < 0.21) env = 0.4 + (t - 0.12) * 4.5; // build into the hook
    else if (t < 0.45) env = 0.85; // first hook / drop
    else if (t < 0.58) env = 0.55; // mid dip (the drift)
    else if (t < 0.85) env = 0.9; // final section
    else env = 0.82 - (t - 0.85) * 4.5; // outro fade
    // deterministic (no Math.random — stable across SSR/client)
    const kickOn = t > 0.18 && t < 0.93 ? 1 : 0.25; // kick sits out of intro/outro
    const kick = Math.pow(Math.abs(Math.sin(i * 0.82)), 9) * kickOn;
    const wig = (Math.sin(i * 12.9898) + Math.sin(i * 78.233)) * 0.5;
    lo[i] = clamp01(env * (0.42 + 0.58 * kick) + wig * 0.05);
    mid[i] = clamp01(env * 0.66 + wig * 0.1);
    hi[i] = clamp01(env * (0.3 + 0.45 * Math.pow(Math.abs(Math.sin(i * 0.82 + 0.5)), 12)) + wig * 0.05);
  }
  return { lo, mid, hi };
}

const WAVE = bandColumns();

// Icy recolor of the rekordbox 3-band "spearhead": deep cyan body (bass),
// bright cyan mids, white core (highs). Green variant marks the free moment.
const SPEAR = { lo: "rgb(18,88,138)", mid: "rgb(110,231,255)", hi: "rgb(244,244,239)" };
const SPEAR_FREE = { lo: "rgb(22,118,88)", mid: "rgb(124,255,196)", hi: "rgb(255,255,255)" };
// Per-band colour-zone weights (lift weak mids, trim bass) — from djmix.
const W_LO = 0.9;
const W_MID = 1.5;
const W_HI = 1.0;

// ── pieces ───────────────────────────────────────────────────────────

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>
      [ {children} ]
    </p>
  );
}

export function Meter({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="w-2.5 h-2.5"
          style={{
            background: i < count ? ACCENT : "transparent",
            border: i < count ? "none" : "1px solid rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
}

/** Block-level seal: real content blurred under a lock pill. */
function Sealed({ children, label = "unlock" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative select-none">
      <div className="blur-[6px] opacity-50 pointer-events-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <a
          href="#unlock"
          className={`${mono.className} inline-flex items-center gap-1.5 text-[12px] text-black px-3 py-1 cursor-pointer hover:brightness-110 transition`}
          style={{ background: ACCENT }}
        >
          <Lock className="h-3 w-3" />
          {label}
        </a>
      </div>
    </div>
  );
}

/**
 * Inline partial seal: the lead words render plainly (real text, outside the
 * blur), the rest blurs out mid-sentence. Proof the paragraph exists and is
 * about this track — the #1 anti-"is there even anything under there" move.
 */
function FadeSealed({ lead, rest }: { lead: string; rest: string }) {
  return (
    <span className="normal-case">
      {lead}
      <a href="#unlock" className="cursor-pointer">
        <span className="blur-[5px] opacity-50 select-none" aria-hidden>
          {rest}
        </span>
      </a>
    </span>
  );
}

/**
 * The annotated waveform: a rekordbox-style 3-band spearhead (bass body, cyan
 * mids, white core — recolored to the icy palette) with SoundCloud-comment-
 * style moment markers from the read. In the teaser, one marker (the free
 * insight) is fully open and the rest blur their note (timestamp visible —
 * receipts with coordinates). `unlocked` opens every marker.
 */
export function AnnotatedWaveform({
  data = DEMO,
  unlocked = false,
}: {
  data?: TeaserData;
  unlocked?: boolean;
}) {
  const clipId = useId();
  const free = data.moments.find((m) => m.free)!;
  const wv = data.wave ?? WAVE;

  // Server-rendered SVG (no canvas, no hydration wait — the wave is in the
  // initial HTML). Three nested polygons per the spearhead scheme: bass
  // silhouette, mids zone, white core. Max-pooled to ~480 columns; the
  // viewBox stretches to the container.
  const W = 1000;
  const H = 96;
  const cy = H / 2;
  const N = 480;
  const src = wv.lo.length;
  const totalH = new Array<number>(N);
  const midH = new Array<number>(N);
  const coreH = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const a = Math.floor((i / N) * src);
    const b = Math.max(a + 1, Math.floor(((i + 1) / N) * src));
    let lo = 0;
    let mi = 0;
    let hh = 0;
    for (let j = a; j < b; j++) {
      if (wv.lo[j]! > lo) lo = wv.lo[j]!;
      if (wv.mid[j]! > mi) mi = wv.mid[j]!;
      if (wv.hi[j]! > hh) hh = wv.hi[j]!;
    }
    // silhouette = loudest band; nested colour zones by weighted proportion
    const t = Math.max(lo, mi, hh) * (cy - 2);
    const wl = lo * W_LO;
    const wm = mi * W_MID;
    const wh = hh * W_HI;
    const S = wl + wm + wh + 1e-6;
    totalH[i] = t;
    midH[i] = (t * (wm + wh)) / S;
    coreH[i] = (t * wh) / S;
  }
  const poly = (h: number[]) => {
    let top = "";
    let bot = "";
    for (let i = 0; i < N; i++) {
      const x = ((i / (N - 1)) * W).toFixed(1);
      top += `${i ? "L" : "M"}${x},${(cy - h[i]!).toFixed(1)}`;
      bot = `L${x},${(cy + h[i]!).toFixed(1)}` + bot;
    }
    return top + bot + "Z";
  };
  const dTotal = poly(totalH);
  const dMid = poly(midH);
  const dCore = poly(coreH);
  const freeX = ((free.pct - 1.6) / 100) * W;
  const freeW = (3.2 / 100) * W;

  return (
    <div>
      {/* the wave (server-rendered SVG) + SoundCloud-style marker dots: small
          circles at the baseline, hover/tap to read the note. The free
          insight's bubble is open by default. */}
      <div className="relative h-24 border-b border-white/10 mt-16">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          aria-hidden
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={freeX} y={0} width={freeW} height={H} />
            </clipPath>
          </defs>
          <path d={dTotal} fill={SPEAR.lo} />
          <path d={dMid} fill={SPEAR.mid} />
          <path d={dCore} fill={SPEAR.hi} />
          {/* the free moment's slice re-tinted green */}
          <g clipPath={`url(#${clipId})`}>
            <path d={dTotal} fill={SPEAR_FREE.lo} />
            <path d={dMid} fill={SPEAR_FREE.mid} />
            <path d={dCore} fill={SPEAR_FREE.hi} />
          </g>
        </svg>

        {/* marker hairlines */}
        {data.moments.map((m) => (
          <span
            key={m.at}
            className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{
              left: `${m.pct}%`,
              background: m.free ? "rgba(124,255,196,0.5)" : "rgba(110,231,255,0.25)",
            }}
          />
        ))}

        {/* marker dots + hover bubbles */}
        {data.moments.map((m) => {
          const sealed = !m.free && !unlocked;
          const align =
            m.pct <= 12
              ? "left-0"
              : m.pct >= 88
                ? "right-0"
                : "left-1/2 -translate-x-1/2";
          return (
            <a
              key={m.at}
              href={m.free ? "#insight" : sealed ? "#unlock" : undefined}
              className={`absolute -bottom-2.5 -translate-x-1/2 group ${m.free ? "z-20" : "z-10 hover:z-30"}`}
              style={{ left: `${m.pct}%` }}
            >
              {/* the bubble — free: always open; others: on hover */}
              <span
                className={`${mono.className} ${m.free ? "flex" : "hidden group-hover:flex"} absolute bottom-[30px] ${align} items-center gap-1.5 text-[11px] px-2 py-1 border w-max max-w-[230px]`}
                style={
                  m.free
                    ? { background: GREEN, color: "#000", borderColor: GREEN, fontWeight: 700 }
                    : { background: "#101010", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }
                }
              >
                <span className="shrink-0" style={m.free ? undefined : { color: ACCENT }}>{m.at}</span>
                {sealed ? (
                  <>
                    <span className="blur-[4px] opacity-60 select-none normal-case" aria-hidden>
                      {m.note}
                    </span>
                    <Lock className="h-2.5 w-2.5 shrink-0 opacity-60" />
                  </>
                ) : (
                  <span className="normal-case">{m.note}</span>
                )}
              </span>
              {/* the dot */}
              <span
                className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition group-hover:scale-110"
                style={
                  m.free
                    ? { background: GREEN, borderColor: GREEN }
                    : { background: "#101010", borderColor: sealed ? "rgba(255,255,255,0.3)" : ACCENT }
                }
              >
                {sealed ? (
                  <Lock className="h-2 w-2 text-white/50" />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: m.free ? "#000" : ACCENT }}
                  />
                )}
              </span>
            </a>
          );
        })}
      </div>
      <div className={`${mono.className} flex items-center justify-between text-[10px] text-white/30 mt-5`}>
        <span>0:00</span>
        <span className="text-white/40 normal-case">
          {data.moments.length} moment markers from the read ·{" "}
          {unlocked ? "all open" : "1 unlocked"}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5" style={{ background: SPEAR.lo }} /> bass
            <span className="w-1.5 h-1.5 ml-1" style={{ background: SPEAR.mid }} /> mids
            <span className="w-1.5 h-1.5 ml-1" style={{ background: SPEAR.hi }} /> highs
          </span>
          <span>{data.duration}</span>
        </span>
      </div>
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────

/** Real analyzed tracks available behind `?track=<slug>` on both demo pages. */
export const REAL_TRACKS: Record<string, TeaserData> = {
  cutandrun: CUTANDRUN,
  powertools: POWERTOOLS,
};

export function FreeTeaserView({ track }: { track?: string }) {
  const D = (track && REAL_TRACKS[track]) || DEMO;
  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase scroll-smooth`}
    >
      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <div className={`${mono.className} flex items-center gap-3 text-[13px]`}>
            <span className="text-white/40">[ demo · free teaser concept ]</span>
            <a href="#unlock" className="text-white/35 hover:text-white/60 transition-colors">
              🔒 unlock to share
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO: prose verdict, no number ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-10 text-center">
        <Kicker>the read is in</Kicker>
        <div className="flex items-center gap-4 sm:gap-5 mb-8 justify-center text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={D.artworkUrl}
            alt=""
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-white/15 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-1 break-words">
              {D.trackTitle}
            </h1>
            <p className={`${mono.className} text-[13px] text-white/40`}>
              {D.genre} · measured + read · {D.scoredAt}
            </p>
          </div>
        </div>

        {/* the verdict in words — the thing they get for free */}
        <p className="text-2xl sm:text-[2rem] font-extrabold tracking-tight leading-snug max-w-xl mx-auto mb-10">
          {D.verdictLine.split("—")[0]}—
          <span style={{ color: ACCENT }}>{D.verdictLine.split("—")[1]}</span>
        </p>

        {/* measured stats — honest DSP claims, not fictional listeners */}
        <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 max-w-lg mx-auto mb-12">
          {D.measured.map((s) => (
            <div key={s.label} className="bg-[#0a0a0a] py-4 px-2">
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: ACCENT }}>
                {s.n}
              </p>
              <p className={`${mono.className} text-[11px] text-white/45 mt-1`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* the sealed score — real ring, blurred, needle visibly settled */}
        <p className={`${mono.className} text-[12px] text-white/40 mb-3`}>resonance score</p>
        <div className="relative inline-block">
          <div className="blur-[10px] opacity-60 pointer-events-none select-none" aria-hidden>
            <ScoreRing score={D.score} size="xl" dark animate={false} />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <a
              href="#unlock"
              className={`${mono.className} inline-flex items-center gap-1.5 text-[12px] text-black px-3 py-1.5 hover:brightness-110 transition`}
              style={{ background: ACCENT }}
            >
              <Lock className="h-3 w-3" />
              reveal your score
            </a>
          </div>
        </div>
        <p className={`${mono.className} text-[11px] text-white/35 mt-4 normal-case max-w-xs mx-auto`}>
          your score is in — it&apos;s part of the full read, along with the why.
        </p>
        <a
          href="#room"
          className={`${mono.className} inline-block text-[12px] mt-3 hover:brightness-110 transition normal-case`}
          style={{ color: GREEN }}
        >
          + 5 real listeners waiting in the room ↓
        </a>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-16 space-y-14">
        {/* ── THE WAVEFORM — moment markers from the read ── */}
        <section>
          <Kicker>the read · measured from your audio</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            we listened to the whole thing.
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-8 normal-case`}>
            The read drops a marker where your track wins and where it leaks attention. One is
            open — the rest are in the full read.
          </p>
          <AnnotatedWaveform data={D} />
        </section>

        {/* ── THE FREE INSIGHT — timestamped, falsifiable, fully free ── */}
        <section
          id="insight"
          className="scroll-mt-20 border-2 bg-[#0c0c0c] p-6 sm:p-8"
          style={{ borderColor: "rgba(124,255,196,0.45)" }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <span className={`${mono.className} text-[12px] tracking-wide`} style={{ color: GREEN }}>
              free insight · no lock on this one
            </span>
            <span
              className={`${mono.className} text-[12px] font-bold text-black px-2 py-0.5`}
              style={{ background: GREEN }}
            >
              go check {D.freeInsight.stamp}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            {D.freeInsight.headline}
          </h2>
          <p className="text-white/70 normal-case leading-relaxed max-w-xl">
            {D.freeInsight.body}
          </p>
          <p className={`${mono.className} text-[12px] text-white/40 mt-5 normal-case`}>
            Scrub to {D.freeInsight.stamp} and check us. If the free line is right about your
            track, the rest of the read is too.
          </p>
        </section>

        {/* ── WHAT'S HOLDING IT BACK ── */}
        <section>
          <Kicker>what&apos;s holding it back</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            the read ranked three fixes
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
            #1 is the biggest lift — it&apos;s in the full read.
          </p>
          <div className="space-y-px bg-white/10 border border-white/10">
            {D.fixes.map((fix, i) => (
              <div key={i} className="bg-[#0a0a0a] p-5 flex items-start gap-4">
                <span
                  className={`${mono.className} flex-shrink-0 w-8 h-8 flex items-center justify-center text-base font-bold text-black`}
                  style={{ background: fix.sealed ? ACCENT : "rgba(255,255,255,0.25)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    {fix.sealed ? (
                      <div className="flex-1">
                        <Sealed label={`unlock the #1 fix`}>
                          <p className="text-[15px] font-bold text-white leading-snug">{fix.label}</p>
                          <p className="text-[14px] text-white/70 leading-relaxed normal-case mt-2">
                            {fix.detail}
                          </p>
                        </Sealed>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-[15px] font-bold text-white leading-snug">{fix.label}</p>
                        <div className="mt-2">
                          <Sealed label="unlock for the detail">
                            <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                              {fix.detail}
                            </p>
                          </Sealed>
                        </div>
                      </div>
                    )}
                    <span
                      className={`${mono.className} text-[12px] whitespace-nowrap`}
                      style={{ color: fix.sealed ? ACCENT : "rgba(255,255,255,0.45)" }}
                    >
                      {fix.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BREAKDOWN — names free, numbers sealed, weakest named ── */}
        <section>
          <Kicker>the breakdown</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            five dimensions, scored + explained
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
            your strongest and weakest are called out free — the numbers and the why are in the
            full read.
          </p>
          <div className="space-y-5">
            {D.categories.map((cat) => (
              <div key={cat.label} className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 w-56 shrink-0">
                  <span className="text-[15px] text-white/80">{cat.label}</span>
                  {cat.tag && (
                    <span
                      className={`${mono.className} text-[10px] font-bold text-black px-1.5 py-0.5`}
                      style={{ background: cat.tag === "strongest" ? GREEN : "#b8a4ff" }}
                    >
                      {cat.tag}
                    </span>
                  )}
                </div>
                <div className="flex-1 h-2.5 bg-white/[0.07] overflow-hidden relative">
                  <div
                    className="h-full blur-[6px] opacity-50"
                    style={{ width: `${(cat.score / 5) * 100}%`, background: ACCENT }}
                  />
                </div>
                <a
                  href="#unlock"
                  className={`${mono.className} text-[13px] font-bold text-white/30 hover:text-white/60 transition-colors w-14 text-right`}
                >
                  <Lock className="h-3 w-3 inline mr-1 -mt-0.5" />
                  ?.?
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE HONEST READ — first words outside the blur ── */}
        <section>
          <Kicker>the honest read</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            {D.summaryHeadline}
          </h2>
          <div className="border-l-2 pl-5" style={{ borderColor: ACCENT }}>
            <p className="text-lg sm:text-xl leading-relaxed text-white/85">
              <FadeSealed lead={D.summaryLead} rest={D.summaryRest} />
            </p>
            <a
              href="#unlock"
              className={`${mono.className} mt-4 inline-flex items-center gap-1.5 text-[12px] text-black px-3 py-1 hover:brightness-110 transition`}
              style={{ background: ACCENT }}
            >
              <Lock className="h-3 w-3" />
              unlock the full read · {D.receipts.summaryWords} words
            </a>
          </div>
        </section>

        {/* ── FOUR ANGLES — the read listening four different ways ── */}
        <section>
          <Kicker>the read · four angles</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            one track, heard four ways
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
            The read listens like four different people — a producer, a first-time listener, a
            curator, a hook specialist. Headlines + ratings free, full takes in the read.
          </p>

          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {D.angles.map((r, i) => (
              <div key={i} className="bg-[#0a0a0a] p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`${mono.className} inline-flex items-center gap-1 text-[10px] font-bold text-black px-1.5 py-0.5`}
                    style={{ background: r.positive ? ACCENT : "#b8a4ff" }}
                  >
                    {r.who}
                  </span>
                  <Meter count={r.rating} />
                </div>
                <p className="text-[15px] font-bold text-white leading-snug">“{r.headline}”</p>
                <p className="text-[14px] text-white/70 leading-relaxed">
                  <FadeSealed lead={r.lead} rest={r.rest} />
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE ROOM — 5 real humans, future tense, fills on unlock ── */}
        <section id="room" className="scroll-mt-20 border border-white/12 bg-[#0c0c0c] p-6 sm:p-8">
          <Kicker>the room · 5 real listeners</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            the room is waiting.
          </h2>
          <p className="text-white/70 text-[15px] normal-case leading-relaxed max-w-xl mb-7">
            Everything above is the read — the machine listen, already written. The room is
            different: <strong className="text-white">5 real people</strong> on MixReflect who
            review tracks in your genre. Unlocking sends{" "}
            <strong className="text-white">{D.trackTitle}</strong> to them, and their
            reactions land here, seat by seat.
          </p>

          {/* five empty seats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-white/10 border border-white/10 mb-6">
            {Array.from({ length: D.room.size }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0a0a0a] p-4 flex flex-col items-center gap-2 text-center"
              >
                <span
                  className="w-10 h-10 border-2 border-dashed border-white/20 flex items-center justify-center"
                  aria-hidden
                >
                  <User className="h-4 w-4 text-white/25" />
                </span>
                <span className={`${mono.className} text-[11px] text-white/40`}>seat {i + 1}</span>
                <span className={`${mono.className} text-[10px]`} style={{ color: ACCENT }}>
                  opens on unlock
                </span>
              </div>
            ))}
          </div>

          <div className={`${mono.className} space-y-1.5 text-[12px] text-white/50 normal-case`}>
            <p className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-white/40" />
              matched to {D.room.matched} · first reaction usually within {D.room.etaFirst} ·
              full room within {D.room.etaFull}
            </p>
            <p className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-white/40" />
              <span>
                want to see a filled room?{" "}
                <Link
                  href="/report/demo-full"
                  className="underline hover:text-white transition-colors"
                  style={{ color: ACCENT }}
                >
                  open a full sample report
                </Link>
              </span>
            </p>
          </div>
        </section>

        {/* ── UNLOCK — open the read, fill the room ── */}
        <section id="unlock" className="scroll-mt-20 border border-white/12 bg-[#101010] p-7 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-5" style={{ background: ACCENT }}>
              <Lock className="h-5 w-5 text-black" />
            </div>
            <Kicker>the score + the full read + the room</Kicker>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              open the read. fill the room.
            </h2>
            <p className="text-white/70 text-[15px] max-w-md mx-auto normal-case leading-relaxed">
              Everything above was written about <strong className="text-white">your track</strong>{" "}
              and is sitting behind the seal. Unlocking opens all of it instantly — and sends the
              track to <strong className="text-white">5 real listeners</strong>.
            </p>
          </div>

          {/* the two timelines: instant + incoming */}
          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10 max-w-2xl mx-auto mb-8">
            <div className="bg-[#0c0c0c] p-5">
              <p className={`${mono.className} text-[12px] mb-3`} style={{ color: ACCENT }}>
                already written · opens instantly
              </p>
              <ul className={`${mono.className} space-y-1.5 text-[12px] text-white/60 normal-case`}>
                <li>→ your resonance score, 0–100</li>
                <li>→ the {D.receipts.summaryWords}-word honest read</li>
                <li>→ {D.receipts.categoryNotes} dimension notes — weakest: {D.receipts.weakest}</li>
                <li>→ {D.receipts.fixes} ranked fixes, incl. the #1</li>
                <li>→ all {D.receipts.markers} moment markers on the waveform</li>
              </ul>
            </div>
            <div className="bg-[#0c0c0c] p-5">
              <p className={`${mono.className} text-[12px] mb-3`} style={{ color: GREEN }}>
                on unlock · the room fills
              </p>
              <ul className={`${mono.className} space-y-1.5 text-[12px] text-white/60 normal-case`}>
                <li>→ 5 real listeners, matched to {D.room.matched}</li>
                <li>→ reactions land seat by seat as they listen</li>
                <li>→ first usually within {D.room.etaFirst}</li>
                <li>→ full room within {D.room.etaFull}</li>
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="border border-white/15 bg-[#0a0a0a] p-6 flex flex-col">
              <p className={`${mono.className} text-[13px] text-white/60`}>this track</p>
              <p className="text-4xl font-extrabold mt-2">
                $6.95<span className="text-base text-white/45 font-medium"> once</span>
              </p>
              <p className={`${mono.className} text-[12px] text-white/55 mt-1 normal-case`}>
                full read + 5 real listeners react — yours forever
              </p>
              <button className="group mt-auto pt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[15px] py-3.5 transition-colors">
                unlock this track
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="border-2 bg-[#0a0a0a] p-6 flex flex-col relative" style={{ borderColor: ACCENT }}>
              <span
                className={`${mono.className} absolute -top-2.5 left-6 text-[10px] font-bold text-black px-2 py-0.5`}
                style={{ background: ACCENT }}
              >
                BEST VALUE
              </span>
              <p className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>unlimited</p>
              <p className="text-4xl font-extrabold mt-2">
                $19.95<span className="text-base text-white/45 font-medium">/mo</span>
              </p>
              <p className={`${mono.className} text-[12px] text-white/55 mt-1 normal-case`}>
                every track auto-unlocked · real room on 3 a month
              </p>
              <button className="group mt-auto pt-6 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors">
                go unlimited
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* the trust footer: guarantee + sample + stripe */}
          <div className={`${mono.className} text-[12px] text-white/40 mt-6 text-center normal-case space-y-1.5`}>
            <p>
              if the full read doesn&apos;t tell you anything you couldn&apos;t hear yourself,
              reply to your receipt — we&apos;ll refund it.
            </p>
            <p>
              one-time or subscription · cancel anytime · secured by stripe ·{" "}
              <Link href="/report/demo-full" className="underline hover:text-white/70" style={{ color: "rgba(110,231,255,0.7)" }}>
                see a sample
              </Link>
            </p>
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/10">
        <div className={`${mono.className} max-w-3xl mx-auto px-5 py-8 flex items-center justify-between text-[13px] text-white/40`}>
          <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
