"use client";

/**
 * DEMO: the repositioned report — "own the release decision".
 *
 * The existing report (report-view.tsx) leads with the resonance SCORE and a
 * verdict tucked underneath as a small chip — i.e. it reads as feedback. This
 * demo inverts that to test the reposition discussed on the product-market-fit
 * branch:
 *
 *   1. THE VERDICT IS THE HERO — the four-state release call is the headline,
 *      on a visible ladder (not ready → needs work → almost there → release
 *      ready). The number is demoted to one line of supporting evidence.
 *   2. THE RELEASE BAR — the centerpiece. Each measured craft axis is shown
 *      against the *release envelope of actually-released tracks in the genre*
 *      (the reference-corpus concept). "compared to the market", made literal
 *      and defensible: the band is where released tracks live, the dot is you.
 *   3. DECISION LANGUAGE THROUGHOUT — "what stands between this and release",
 *      "the jury", "the gate every release goes through" — not "feedback".
 *   4. THE JURY (room) confirms or challenges the verdict; the signal is
 *      AGREEMENT — when the humans converge with the read, the call is trusted.
 *   5. THE VERDICT KEEPS ITSELF HONEST — the calibration/back-test loop, framed
 *      as the trust mechanism (illustrative numbers for the demo).
 *
 * Self-contained on purpose: reuses DEMO data + a couple of primitives from the
 * teaser file, but otherwise lives here so the reposition can be reviewed live
 * at /report/demo-verdict without touching the shipping report.
 */

import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  User,
  Clock,
  Check,
  Minus,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  DEMO,
  AnnotatedWaveform,
  Kicker,
  Meter,
  ACCENT,
  GREEN,
} from "../demo-free/free-teaser-view";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const WARN = "#ff7a90"; // out-of-envelope / blocker (matches NOT_READY ink family)
const VIOLET = "#b8a4ff";

// ── the verdict model ────────────────────────────────────────────────

type Verdict = "NOT_READY" | "NEEDS_WORK" | "ALMOST_THERE" | "RELEASE_READY";

const LADDER: { key: Verdict; label: string; ink: string }[] = [
  { key: "NOT_READY", label: "not ready", ink: WARN },
  { key: "NEEDS_WORK", label: "needs work", ink: VIOLET },
  { key: "ALMOST_THERE", label: "almost there", ink: ACCENT },
  { key: "RELEASE_READY", label: "release ready", ink: GREEN },
];

// the demo track lands on ALMOST_THERE — close, one real blocker, fixable.
const V: Verdict = "ALMOST_THERE";

const VERDICT = {
  standing: "close — one push from ready",
  decision: "this is one fix away from release.",
  detail:
    "the craft is there and the master holds up against released electronic tracks. one thing — how long it makes a listener wait for the hook — is what stands between this and a confident yes.",
};

// ── the release bar — measured vs the genre's release envelope ────────
// `zone` = where released electronic tracks sit (the reference corpus), as a
// percent span of the axis. `pos` = where THIS track measured. status drives
// the marker colour: inside the band, on the edge, or outside (a blocker).

type Axis = {
  label: string;
  measured: string;
  zone: [number, number];
  pos: number;
  status: "in" | "edge" | "out";
  note: string;
};

const AXES: Axis[] = [
  {
    label: "master loudness",
    measured: "−9.2 dB",
    zone: [28, 70],
    pos: 52,
    status: "in",
    note: "sits right in the release band — loud enough to compete, not crushed.",
  },
  {
    label: "low-end balance",
    measured: "+2 dB vs median",
    zone: [34, 66],
    pos: 71,
    status: "edge",
    note: "a touch hot. fine on phones, heavy on a club system — worth a check.",
  },
  {
    label: "time to hook",
    measured: "0:43",
    zone: [12, 42],
    pos: 79,
    status: "out",
    note: "released electronic tracks land the hook by ~0:18. yours waits until 0:43 — that is the blocker.",
  },
  {
    label: "dynamic range",
    measured: "6.4 dB",
    zone: [30, 78],
    pos: 49,
    status: "in",
    note: "healthy movement — it breathes, it is not a wall of limiter.",
  },
  {
    label: "arrangement movement",
    measured: "1 still section",
    zone: [42, 86],
    pos: 37,
    status: "edge",
    note: "one mid-section (1:38) sits in a single idea a beat longer than the genre tends to.",
  },
];

const STATUS = {
  in: { ink: GREEN, label: "in the release band", Icon: Check },
  edge: { ink: ACCENT, label: "on the edge", Icon: Minus },
  out: { ink: WARN, label: "outside the band", Icon: AlertTriangle },
} as const;

// what stands between this track and release — the verdict's blockers, ranked.
const BLOCKERS = [
  {
    rank: 1,
    weight: "the one that's holding the verdict",
    label: "get to the hook sooner",
    detail:
      "the strongest moment lands at 0:43; released tracks in this genre arrive ~25s earlier. trim the intro and the call flips to release-ready — this is the whole gap.",
    ink: WARN,
  },
  {
    rank: 2,
    weight: "worth doing before you ship",
    label: "tame the low end ~2 dB",
    detail:
      "the bass sits hotter than the genre median. a gentle shelf keeps it from masking the kick on bigger systems.",
    ink: ACCENT,
  },
  {
    rank: 3,
    weight: "polish, not a blocker",
    label: "give the mid-section one new element",
    detail:
      "1:38 holds a single idea a touch long. a filter sweep or a new layer re-grabs attention without a rewrite.",
    ink: "rgba(255,255,255,0.35)",
  },
];

// the jury — 5 real listeners, shown as agreement WITH the verdict. convergence
// is the signal: 4 of 5 land on "close, not done", which is exactly the call.
const JURY = [
  {
    initial: "J",
    genre: "electronic · house",
    call: "almost",
    rating: 4,
    quote:
      "hook is doing all the right things once it lands — it caught me and i went back. the intro had me drifting before it got going though. close one.",
  },
  {
    initial: "M",
    genre: "pop · indie",
    call: "almost",
    rating: 4,
    quote:
      "had the melody in my head after one listen. would happily hear it on a playlist — just trim the front, it asks for too much patience up top.",
  },
  {
    initial: "T",
    genre: "electronic",
    call: "almost",
    rating: 4,
    quote:
      "drop has real bounce, sound choices feel intentional. my only note is the intro — i almost left before it kicked in, and i listen to this all day.",
  },
  {
    initial: "R",
    genre: "electronic · techno",
    call: "ready",
    rating: 5,
    quote:
      "honestly i'd put this out. low end is solid on my monitors and it kept me the whole way. ship it.",
  },
  {
    initial: "K",
    genre: "pop",
    call: "needs",
    rating: 3,
    quote:
      "liked it but the front third lost me. once it moved i was in — i just needed it to move sooner.",
  },
];

const CALL_INK: Record<string, string> = {
  ready: GREEN,
  almost: ACCENT,
  needs: VIOLET,
};

// ── pieces ───────────────────────────────────────────────────────────

function SectionCard({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border border-white/10 bg-[#0c0c0c] p-6 sm:p-8">
      {children}
    </section>
  );
}

// ── main ─────────────────────────────────────────────────────────────

export function VerdictReportView() {
  const D = DEMO;
  const current = LADDER.find((l) => l.key === V)!;
  const agree = JURY.filter((j) => j.call === "almost").length;

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
            <span className="text-white/40">[ demo · release verdict ]</span>
            <Link href="/report/demo-full" className="text-white/35 hover:text-white/60 transition-colors">
              compare: old report →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO: the verdict is the headline ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
        <div className="flex items-center gap-4 sm:gap-5 mb-9 justify-center text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={D.artworkUrl}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-white/15 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-1 break-words">
              {D.trackTitle}
            </h1>
            <p className={`${mono.className} text-[12px] text-white/40`}>
              {D.genre} · release check · {D.scoredAt}
            </p>
          </div>
        </div>

        <Kicker>the verdict</Kicker>

        {/* the four-state ladder — current highlighted, the rest dimmed */}
        <div className="flex items-stretch justify-center gap-px bg-white/10 border border-white/10 max-w-xl mx-auto mb-8 overflow-hidden">
          {LADDER.map((l) => {
            const on = l.key === V;
            return (
              <div
                key={l.key}
                className="flex-1 py-2.5 px-1 text-center"
                style={{
                  background: on ? l.ink : "#0a0a0a",
                  color: on ? "#000" : "rgba(255,255,255,0.35)",
                }}
              >
                <span className={`${mono.className} text-[10px] sm:text-[11px] font-bold`}>
                  {l.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* THE call, big */}
        <p
          className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-none mb-5"
          style={{ color: current.ink }}
        >
          {current.label}
        </p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight max-w-lg mx-auto">
          {VERDICT.decision}
        </p>
        <p className="text-[15px] text-white/65 leading-relaxed normal-case max-w-lg mx-auto mt-4">
          {VERDICT.detail}
        </p>

        {/* the score, DEMOTED — one line of evidence, not the headline */}
        <div className={`${mono.className} inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-white/45 mt-8 border border-white/10 px-4 py-2.5 normal-case`}>
          <span>
            resonance <span className="text-white/80 font-bold">{D.score}</span>/100
          </span>
          <span className="text-white/20">·</span>
          <span>
            top <span style={{ color: ACCENT }}>18%</span> of released electronic
          </span>
          <span className="text-white/20">·</span>
          <span>
            <span style={{ color: GREEN }}>4 of 5</span> listeners agree
          </span>
        </div>

        <div className="mt-9">
          <a
            href="#bar"
            className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] px-6 py-3.5 hover:bg-white transition-colors"
          >
            see what&apos;s between this and release
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-16 space-y-14">
        {/* ── THE RELEASE BAR — measured vs the genre's release envelope ── */}
        <SectionCard id="bar">
          <Kicker>the release bar · measured against released electronic tracks</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            where you sit vs what gets released.
          </h2>
          <p className="text-[14px] text-white/65 leading-relaxed normal-case mb-8 max-w-xl">
            each axis is measured from your audio, then placed against the band where{" "}
            <strong className="text-white">actually-released tracks in your genre</strong> live.
            inside the band clears the bar. the marker is you.
          </p>

          <div className="space-y-7">
            {AXES.map((a) => {
              const s = STATUS[a.status];
              return (
                <div key={a.label}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[15px] text-white/90 font-bold">{a.label}</span>
                    <span className={`${mono.className} flex items-center gap-1.5 text-[12px]`} style={{ color: s.ink }}>
                      <s.Icon className="h-3.5 w-3.5" />
                      {a.measured}
                    </span>
                  </div>
                  {/* the bar: release band + your marker */}
                  <div className="relative h-7 bg-white/[0.05] border border-white/10">
                    {/* release envelope */}
                    <div
                      className="absolute inset-y-0"
                      style={{
                        left: `${a.zone[0]}%`,
                        width: `${a.zone[1] - a.zone[0]}%`,
                        background: "rgba(110,231,255,0.14)",
                        borderLeft: "1px solid rgba(110,231,255,0.4)",
                        borderRight: "1px solid rgba(110,231,255,0.4)",
                      }}
                    />
                    {/* "released tracks" label inside the band */}
                    <span
                      className={`${mono.className} absolute inset-y-0 flex items-center text-[9px] tracking-wide text-white/35 pl-2`}
                      style={{ left: `${a.zone[0]}%` }}
                    >
                      released tracks
                    </span>
                    {/* your marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${a.pos}%` }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 border-[#0c0c0c]"
                        style={{ background: s.ink, boxShadow: `0 0 0 1.5px ${s.ink}` }}
                      />
                    </div>
                  </div>
                  <p className="text-[13px] text-white/60 leading-relaxed normal-case mt-2">
                    <span style={{ color: s.ink }}>{s.label}</span> — {a.note}
                  </p>
                </div>
              );
            })}
          </div>

          <p className={`${mono.className} text-[11px] text-white/35 mt-8 normal-case border-t border-white/10 pt-5`}>
            the band is a floor, not a guarantee of a hit — it means nothing here gets you
            skipped or passed on for a fixable reason. what catches fire after that, no one can
            measure.
          </p>
        </SectionCard>

        {/* ── WHAT STANDS BETWEEN THIS AND RELEASE ── */}
        <SectionCard>
          <Kicker>what stands between this and release</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            one blocker, two tidy-ups.
          </h2>
          <p className="text-[14px] text-white/65 leading-relaxed normal-case mb-7 max-w-xl">
            clear #1 and the call flips to <span style={{ color: GREEN }}>release ready</span>.
            the rest are worth doing but won&apos;t hold you back.
          </p>
          <div className="space-y-px bg-white/10 border border-white/10">
            {BLOCKERS.map((b) => (
              <div key={b.rank} className="bg-[#0a0a0a] p-5 flex items-start gap-4">
                <span
                  className={`${mono.className} flex-shrink-0 w-8 h-8 flex items-center justify-center text-base font-bold text-black`}
                  style={{ background: b.ink }}
                >
                  {b.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-bold text-white leading-snug">{b.label}</p>
                    <span
                      className={`${mono.className} text-[11px] whitespace-nowrap text-right max-w-[40%]`}
                      style={{ color: b.ink }}
                    >
                      {b.weight}
                    </span>
                  </div>
                  <p className="text-[14px] text-white/65 leading-relaxed normal-case mt-2">
                    {b.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── THE MOMENT MAP — reuse the annotated waveform ── */}
        <SectionCard>
          <Kicker>the moment map · measured from your audio</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            where the verdict comes from.
          </h2>
          <p className="text-[14px] text-white/65 leading-relaxed normal-case mb-2">
            every marker the read dropped — the win at 0:43, the drift the verdict is built on.
          </p>
          <AnnotatedWaveform data={D} unlocked />
        </SectionCard>

        {/* ── THE CRAFT CHECK — dimensions, framed as the verdict's evidence ── */}
        <SectionCard>
          <Kicker>the craft check</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
            five dimensions behind the call
          </h2>
          <div className="space-y-5">
            {D.categories.map((cat) => (
              <div key={cat.label} className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 w-52 shrink-0">
                  <span className="text-[15px] text-white/85">{cat.label}</span>
                  {cat.tag && (
                    <span
                      className={`${mono.className} text-[10px] font-bold text-black px-1.5 py-0.5`}
                      style={{ background: cat.tag === "strongest" ? GREEN : VIOLET }}
                    >
                      {cat.tag}
                    </span>
                  )}
                </div>
                <div className="flex-1 h-2.5 bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${(cat.score / 5) * 100}%`, background: ACCENT }}
                  />
                </div>
                <span className={`${mono.className} text-[14px] font-bold w-12 text-right`} style={{ color: ACCENT }}>
                  {cat.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── THE JURY — 5 real listeners, shown as agreement with the verdict ── */}
        <section className="border-2 bg-[#0c0c0c] p-6 sm:p-8" style={{ borderColor: "rgba(110,231,255,0.4)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <Kicker>the jury · 5 real listeners</Kicker>
            <span className={`${mono.className} text-[12px]`} style={{ color: ACCENT }}>
              {agree + 1} of 5 say close-or-better
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            the room landed where the read did.
          </h2>
          <p className="text-[14px] text-white/65 leading-relaxed normal-case mb-6 max-w-xl">
            five genre-matched listeners gave their own call before seeing the score. when the
            humans and the machine converge, the verdict is trustworthy — and they did:{" "}
            <strong className="text-white">almost there</strong>, intro&apos;s the holdup.
          </p>

          {/* the agreement strip */}
          <div className="flex items-center gap-px bg-white/10 border border-white/10 mb-5">
            {JURY.map((j) => (
              <div
                key={j.initial}
                className="flex-1 py-2 text-center"
                style={{ background: "#0a0a0a" }}
              >
                <span className={`${mono.className} text-[10px] font-bold`} style={{ color: CALL_INK[j.call] }}>
                  {j.call}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-px bg-white/10 border border-white/10">
            {JURY.map((j) => (
              <div key={j.initial} className="bg-[#0a0a0a] p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`${mono.className} inline-flex items-center gap-2 text-[12px]`}>
                    <span
                      className="w-7 h-7 flex items-center justify-center font-bold text-black"
                      style={{ background: CALL_INK[j.call] }}
                    >
                      {j.initial}
                    </span>
                    <span className="text-white/55">{j.genre}</span>
                  </span>
                  <Meter count={j.rating} />
                </div>
                <p className="text-[14px] text-white/80 leading-relaxed normal-case">{j.quote}</p>
              </div>
            ))}
          </div>
          <p className={`${mono.className} flex items-center gap-2 text-[12px] text-white/50 normal-case mt-4`}>
            <Clock className="h-3.5 w-3.5 text-white/40" />
            matched to {D.room.matched} · their calls are independent of the score
          </p>
        </section>

        {/* ── THE VERDICT KEEPS ITSELF HONEST — the calibration loop ── */}
        <SectionCard>
          <div className="flex items-center gap-2.5 mb-3">
            <ShieldCheck className="h-5 w-5" style={{ color: GREEN }} />
            <Kicker>why you can trust the call</Kicker>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            every verdict gets checked against what happens next.
          </h2>
          <p className="text-[14px] text-white/65 leading-relaxed normal-case mb-6 max-w-xl">
            when a track we called <span style={{ color: GREEN }}>release ready</span> goes out, we
            watch what it does — placements, saves, skips — and feed it back into the bar. the call
            isn&apos;t an opinion that disappears; it&apos;s a prediction we keep score on.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {[
              { n: "3.1×", l: "more likely to land an editorial playlist when cleared" },
              { n: "0:18", l: "median time-to-hook across released tracks in genre" },
              { n: "1,200+", l: "released tracks measured into the electronic bar" },
            ].map((s) => (
              <div key={s.l} className="bg-[#0a0a0a] p-5">
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: ACCENT }}>
                  {s.n}
                </p>
                <p className={`${mono.className} text-[11px] text-white/50 mt-2 normal-case leading-relaxed`}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>
          <p className={`${mono.className} text-[10px] text-white/25 mt-3 normal-case`}>
            illustrative — the calibration loop is the mechanism; real numbers grow with the corpus.
          </p>
        </SectionCard>

        {/* ── RE-CHECK / RECURRING CTA — the gate every release goes through ── */}
        <section className="border border-white/12 bg-[#0c0c0c] p-7 sm:p-10 text-center">
          <Kicker>before every release</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            run the next one through the gate.
          </h2>
          <p className="text-white/70 text-[15px] normal-case leading-relaxed max-w-lg mx-auto mb-7">
            fix the intro, re-upload, and the bar tells you what changed —{" "}
            <em>&quot;hook now lands by 0:21, verdict: release ready.&quot;</em> the same check on
            every track you put out, so you never ship one that wasn&apos;t ready.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="border border-white/15 bg-[#0a0a0a] p-6 flex flex-col">
              <p className={`${mono.className} text-[12px] text-white/55`}>this track</p>
              <p className="text-4xl font-extrabold mt-2 normal-case">
                $6.95<span className="text-base text-white/45 font-medium"> once</span>
              </p>
              <p className={`${mono.className} text-[12px] text-white/55 mt-2 normal-case flex-1`}>
                the full verdict + the jury of 5 on this one track — yours forever.
              </p>
              <button className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[15px] py-3.5 transition-colors">
                get this verdict
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="border-2 bg-[#0a0a0a] p-6 flex flex-col relative" style={{ borderColor: ACCENT }}>
              <span
                className={`${mono.className} absolute -top-2.5 left-6 text-[10px] font-bold text-black px-2 py-0.5`}
                style={{ background: ACCENT }}
              >
                THE GATE
              </span>
              <p className={`${mono.className} text-[12px]`} style={{ color: ACCENT }}>every release</p>
              <p className="text-4xl font-extrabold mt-2 normal-case">
                $19.95<span className="text-base text-white/45 font-medium">/mo</span>
              </p>
              <p className={`${mono.className} text-[12px] text-white/55 mt-2 normal-case flex-1`}>
                a verdict on every track you make, the jury on 3 a month, and the bar tracks every
                version.
              </p>
              <button className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors">
                run every release
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <Link
            href="/score-review"
            className={`${mono.className} inline-flex items-center gap-2 text-[13px] mt-7 hover:brightness-110 transition normal-case`}
            style={{ color: GREEN }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            already fixed it? re-check this version
          </Link>
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/10">
        <div className={`${mono.className} max-w-3xl mx-auto px-5 py-8 flex items-center justify-between text-[13px] text-white/40`}>
          <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
          <span className="inline-flex items-center gap-2">
            <User className="h-3.5 w-3.5" />© {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
