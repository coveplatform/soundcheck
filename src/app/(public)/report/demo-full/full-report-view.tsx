"use client";

/**
 * DEMO: the unlocked full report — the paid counterpart of /report/demo-free.
 *
 * Live at /report/demo-full so the two states can be compared side by side.
 * Same track, same demo data (imported from the teaser file), everything open:
 *  1. THE ROOM SITS ON TOP — once paid, the humans are the live, scarce thing;
 *     the read becomes the reference document beneath them. (In the teaser the
 *     room is at the bottom, empty — that asymmetry is the upgrade.)
 *  2. 3 seats filled with real-voice reactions, 2 still "listening now…" —
 *     reactions land seat by seat, the page sells the anticipation honestly.
 *  3. Score revealed, every moment marker open, all fixes + dimension notes.
 *  4. Version memory block at the end — fix it, re-upload, the read remembers.
 */

import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ScoreRing } from "@/components/score/score-ring";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, User, Clock, RefreshCw, Share2 } from "lucide-react";
import {
  DEMO,
  AnnotatedWaveform,
  Kicker,
  Meter,
  ACCENT,
  GREEN,
} from "../demo-free/free-teaser-view";
import { CUTANDRUN, CUTANDRUN_FULL } from "../demo-free/cutandrun-data";
import { POWERTOOLS, POWERTOOLS_FULL } from "../demo-free/powertools-data";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

// ── full-report-only demo data ───────────────────────────────────────

const FULL = {
  scoreStanding: "a strong score",

  // the room: 3 landed, 2 still listening — natural voices, distinct personalities
  humanReviews: [
    {
      initial: "J",
      genre: "electronic · house",
      rating: 4,
      when: "2h ago",
      quote:
        "Basically the hook is doing all the right things here. It caught me on the first listen and I went back to hear it again. For me the middle section sits a little long before somthing new happens, I wanted that switch sooner. Also the low end feels really solid on my monitors. This is close!",
    },
    {
      initial: "M",
      genre: "pop · indie",
      rating: 5,
      when: "4h ago",
      quote:
        "Ok this one stuck with me... I had the melody in my head after one listen which honestly doesnt happen much. The vocal moment around the first minute is the highlight for me. I think the ending could breathe a bit more, it kind of just stops. Really good though, you've got somthing here.",
    },
    {
      initial: "T",
      genre: "electronic",
      rating: 4,
      when: "5h ago",
      quote:
        "Solid! The drop has real bounce and the sound choices feel intentional. My only note is the intro — I almost drifted before it got going, and I listen to this stuff all day. Trim that and I think you keep everyone. Talented producer for sure.",
    },
  ],

  // full dimension notes (the "why" behind each sealed number in the teaser)
  dimensionNotes: [
    {
      label: "Hook Strength",
      score: 4.2,
      tag: "strongest" as const,
      note: "The vocal hook at 0:43 is genuinely sticky — it lands once and the track keeps cashing it in. It just arrives later than it should; the strongest asset spends the first 40 seconds hidden.",
    },
    {
      label: "Production Quality",
      score: 3.8,
      tag: null,
      note: "Clean and intentional — the low end is controlled and the sound palette feels chosen rather than defaulted. A touch more contrast between sections would make the polish read even louder.",
    },
    {
      label: "Listener Retention",
      score: 3.4,
      tag: "weakest" as const,
      note: "The read flagged two drift risks: the slow intro and the mid-section around 1:38 where the track sits in one idea. Both are arrangement fixes, not production ones — the cheapest kind to make.",
    },
    {
      label: "Emotional Impact",
      score: 4.0,
      tag: null,
      note: "The warmth holds the whole way through — the track feels like it's about something. The outro cuts that feeling short right when it should be landing.",
    },
    {
      label: "Commercial Potential",
      score: 3.6,
      tag: null,
      note: "Playlist-ready sound with one structural catch: editorial listeners skip fast, and this asks for 43 seconds of patience. Fix the intro and the ceiling lifts.",
    },
  ],

  // the full honest read — what the FadeSealed paragraph opens into
  fullRead: [
    "The opening grabs fast — the hook is doing real work by the first minute, and once the vocal lands at 0:43 the track knows exactly what it is. That moment is the best thing here: it's sticky, it's confident, and the room kept coming back to it. The problem is everything before it. The intro spends 40 seconds setting a mood the track doesn't need that long to set, and the read flagged real drift risk before the payoff arrives.",
    "Through the first drop the energy holds — the low end is controlled, the sound choices feel intentional, and there's a warmth to the whole thing that makes it feel like a song rather than a sketch. Then the mid-section sits in one idea a beat too long. Around 1:38 the arrangement stops surprising; nothing is wrong, but nothing is new, and that's where attention thins.",
    "The back half pulls it back. The second lift at 2:21 almost pays the whole thing off, and the emotional read stays warm to the end — which makes the abrupt ending at 2:58 feel like a missed landing rather than a choice. Get people to the hook sooner, give the middle one new element, and let the ending breathe: this holds a room the whole way through.",
  ],
};

// ── main ─────────────────────────────────────────────────────────────

// Real analyzed tracks behind `?track=<slug>` — teaser data + full extras.
const REAL_FULL: Record<string, { data: typeof DEMO; full: typeof FULL }> = {
  cutandrun: { data: CUTANDRUN, full: CUTANDRUN_FULL },
  powertools: { data: POWERTOOLS, full: POWERTOOLS_FULL },
};

export function FullReportView({ track }: { track?: string }) {
  const real = track ? REAL_FULL[track] : undefined;
  const D = real?.data ?? DEMO;
  const F = real?.full ?? FULL;
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
            <Link href="/report/demo-free" className="text-white/35 hover:text-white/60 transition-colors">
              [ compare: free teaser ]
            </Link>
            <span className="inline-flex items-center gap-1.5 text-white/55">
              <Share2 className="h-3.5 w-3.5" /> share
            </span>
          </div>
        </div>
      </header>

      {/* ── HERO: score revealed ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-10 text-center">
        <Kicker>unlocked · the full read + the room</Kicker>
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

        <p className="text-2xl sm:text-[2rem] font-extrabold tracking-tight leading-snug max-w-xl mx-auto mb-10">
          {D.verdictLine.split("—")[0]}—
          <span style={{ color: ACCENT }}>{D.verdictLine.split("—")[1]}</span>
        </p>

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

        <p className={`${mono.className} text-[12px] text-white/40 mb-3`}>resonance score</p>
        <ScoreRing score={D.score} size="xl" dark animate={false} />
        <p className={`${mono.className} text-[13px] text-white/55 mt-4 normal-case`}>
          that&apos;s {F.scoreStanding} —{" "}
          <span style={{ color: ACCENT }}>{D.score}</span> out of 100.
        </p>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-16 space-y-14">
        {/* ── THE ROOM — humans on top once unlocked ── */}
        <section className="border-2 bg-[#0c0c0c] p-6 sm:p-8" style={{ borderColor: "rgba(124,255,196,0.45)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <Kicker>the room · 5 real listeners</Kicker>
            <span className={`${mono.className} text-[12px]`} style={{ color: GREEN }}>
              3 of 5 seats landed
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            the room is listening.
          </h2>

          <div className="space-y-px bg-white/10 border border-white/10 mb-4">
            {F.humanReviews.map((r) => (
              <div key={r.initial} className="bg-[#0a0a0a] p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`${mono.className} inline-flex items-center gap-2 text-[12px]`}>
                    <span
                      className="w-7 h-7 flex items-center justify-center font-bold text-black"
                      style={{ background: GREEN }}
                    >
                      {r.initial}
                    </span>
                    <span className="text-white/55">{r.genre}</span>
                    <span className="text-white/30">· {r.when}</span>
                  </span>
                  <Meter count={r.rating} />
                </div>
                <p className="text-[14px] text-white/80 leading-relaxed normal-case">{r.quote}</p>
              </div>
            ))}
            {/* the two seats still listening */}
            {[4, 5].map((n) => (
              <div key={n} className="bg-[#0a0a0a] p-5 flex items-center gap-3">
                <span
                  className="w-7 h-7 border-2 border-dashed border-white/20 flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  <User className="h-3.5 w-3.5 text-white/25" />
                </span>
                <span className={`${mono.className} text-[12px] text-white/40 normal-case`}>
                  seat {n} · listening now — lands within {D.room.etaFull}
                </span>
                <span className="ml-auto flex gap-1" aria-hidden>
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 animate-pulse"
                      style={{ background: ACCENT, animationDelay: `${d * 300}ms` }}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <p className={`${mono.className} flex items-center gap-2 text-[12px] text-white/50 normal-case`}>
            <Clock className="h-3.5 w-3.5 text-white/40" />
            matched to {D.room.matched} · you&apos;ll get an email as each seat lands
          </p>
        </section>

        {/* ── THE WAVEFORM — every marker open ── */}
        <section>
          <Kicker>the read · measured from your audio</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            the moment map.
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-8 normal-case`}>
            Every marker the read dropped on your track — all open.
          </p>
          <AnnotatedWaveform data={D} unlocked />
          {/* the markers as a readable list */}
          <div className="mt-6 space-y-px bg-white/10 border border-white/10">
            {D.moments.map((m) => (
              <div key={m.at} className="bg-[#0a0a0a] p-4 flex items-start gap-4">
                <span
                  className={`${mono.className} shrink-0 text-[12px] font-bold px-2 py-0.5 text-black`}
                  style={{ background: m.free ? GREEN : ACCENT }}
                >
                  {m.at}
                </span>
                <p className="text-[14px] text-white/75 leading-relaxed normal-case">{m.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE HONEST READ — full text ── */}
        <section>
          <Kicker>the honest read · {D.receipts.summaryWords} words</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            {D.summaryHeadline}
          </h2>
          <div className="border-l-2 pl-5 space-y-4" style={{ borderColor: ACCENT }}>
            {F.fullRead.map((para, i) => (
              <p key={i} className="text-lg sm:text-xl leading-relaxed text-white/85 normal-case">
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* ── THE FIXES — all open ── */}
        <section>
          <Kicker>what&apos;s holding it back</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
            the read ranked three fixes
          </h2>
          <div className="space-y-px bg-white/10 border border-white/10">
            {D.fixes.map((fix, i) => (
              <div key={i} className="bg-[#0a0a0a] p-5 flex items-start gap-4">
                <span
                  className={`${mono.className} flex-shrink-0 w-8 h-8 flex items-center justify-center text-base font-bold text-black`}
                  style={{ background: i === 0 ? ACCENT : "rgba(255,255,255,0.25)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-white leading-snug">{fix.label}</p>
                      <p className="text-[14px] text-white/70 leading-relaxed normal-case mt-2">
                        {fix.detail}
                      </p>
                    </div>
                    <span
                      className={`${mono.className} text-[12px] whitespace-nowrap`}
                      style={{ color: i === 0 ? ACCENT : "rgba(255,255,255,0.45)" }}
                    >
                      {fix.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BREAKDOWN — numbers + the why, all open ── */}
        <section>
          <Kicker>the breakdown</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
            five dimensions, scored + explained
          </h2>
          <div className="space-y-px bg-white/10 border border-white/10">
            {F.dimensionNotes.map((cat) => (
              <div key={cat.label} className="bg-[#0a0a0a] p-5">
                <div className="flex items-center gap-4 mb-2.5">
                  <div className="flex items-center gap-2.5 w-56 shrink-0">
                    <span className="text-[15px] text-white/90 font-bold">{cat.label}</span>
                    {cat.tag && (
                      <span
                        className={`${mono.className} text-[10px] font-bold text-black px-1.5 py-0.5`}
                        style={{ background: cat.tag === "strongest" ? GREEN : "#b8a4ff" }}
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
                  <span className={`${mono.className} text-[14px] font-bold w-14 text-right`} style={{ color: ACCENT }}>
                    {cat.score.toFixed(1)}
                  </span>
                </div>
                <p className="text-[14px] text-white/65 leading-relaxed normal-case">{cat.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOUR ANGLES — full takes ── */}
        <section>
          <Kicker>the read · four angles</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
            one track, heard four ways
          </h2>
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
                <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                  {r.lead}
                  {r.rest}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VERSION MEMORY — fix it, re-upload, the read remembers ── */}
        <section className="border border-white/12 bg-[#0c0c0c] p-6 sm:p-8">
          <Kicker>version memory</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            fix it, then prove it.
          </h2>
          <p className="text-white/70 text-[15px] normal-case leading-relaxed max-w-xl mb-6">
            The read remembers this version of <strong className="text-white">{D.trackTitle}</strong> —
            its fingerprint, its score, every marker. Make the fixes, re-upload the new master, and
            the next read tells you what actually changed: <em>“the hook now lands by 0:25 — the
            intro drift is gone.”</em> Progress you can see, not vibes.
          </p>
          <Link
            href="/score-review"
            className={`${mono.className} inline-flex items-center gap-2 text-[13px] font-bold text-black px-4 py-2.5 hover:brightness-110 transition`}
            style={{ background: GREEN }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            re-upload a new version
          </Link>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="text-center pt-2">
          <Link
            href="/score-review"
            className="group inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] px-8 py-3.5 hover:bg-white transition-colors"
          >
            score another track
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
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
