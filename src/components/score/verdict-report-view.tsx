"use client";

/**
 * PRODUCTION verdict report — "own the release decision".
 *
 * Productionised from the /report/demo-verdict sandbox. Where the demo hardcoded
 * a DEMO object, this accepts the live report view-model plus the persisted
 * verdict payload (verdict / releaseBar / blockers). The route renders this when
 * `report.releaseBar != null`; otherwise it falls back to the legacy ReportView,
 * so existing reports are visually unaffected.
 *
 * The four-state ladder is the hero; the /100 score is demoted to evidence. The
 * real human "room of 5" is kept as a CO-PILLAR (never fabricated personas) with
 * an honest partial state ("3 of 5 in, more landing"). Honesty: no fabricated
 * percentile, and release bands are labelled "estimated" until a real reference
 * corpus exists.
 *
 * The three gate states mirror report-view.tsx:
 *  - unlocked   → everything open, full room.
 *  - open-read  → the read is free; the human room + deep prose gate on unlock.
 *  - sealed     → blockers/notes blurred behind the paywall, headlines free.
 */

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ReportWaveform, deriveWaveMoments } from "@/components/score/report-waveform";
import { scoreConversions } from "@/lib/score-conversions";
import { useAuthModal } from "@/components/providers";
import {
  ArrowRight,
  User,
  Check,
  Minus,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Lock,
  Loader2,
} from "lucide-react";
import type {
  Verdict,
  ReleaseAxis,
  Blocker,
} from "@/components/score/verdict-types";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";
const GREEN = "#7cffc4";
const WARN = "#ff7a90"; // out-of-envelope / blocker
const VIOLET = "#b8a4ff";

const LADDER: { key: Verdict; label: string; ink: string }[] = [
  { key: "NOT_READY", label: "not ready", ink: WARN },
  { key: "NEEDS_WORK", label: "needs work", ink: VIOLET },
  { key: "ALMOST_THERE", label: "almost there", ink: ACCENT },
  { key: "RELEASE_READY", label: "release ready", ink: GREEN },
];

const STATUS = {
  in: { ink: GREEN, label: "in the release band", Icon: Check },
  edge: { ink: ACCENT, label: "on the edge", Icon: Minus },
  out: { ink: WARN, label: "outside the band", Icon: AlertTriangle },
} as const;

// Verdict-specific headline copy. Honest by construction — the detail line is a
// fallback only; when the report carries a real synthesis we lead with that.
const VERDICT_COPY: Record<Verdict, { decision: string }> = {
  RELEASE_READY: { decision: "this is ready to release." },
  ALMOST_THERE: { decision: "this is one fix away from release." },
  NEEDS_WORK: { decision: "this needs work before it's ready." },
  NOT_READY: { decision: "this isn't ready to release yet." },
};

// ── view model (a subset of the live ReportViewModel + the verdict payload) ──

export type VerdictReportData = {
  /** Report slug — drives the unlock / subscribe checkout routes. */
  slug?: string;
  // header / identity
  trackTitle: string;
  artworkUrl: string | null;
  genre: string;
  scoredAt: string;

  // gate states (mirror report-view.tsx)
  isDemo?: boolean;
  unlocked: boolean;
  openRead?: boolean;

  // the verdict payload
  verdict: Verdict;
  releaseBar: ReleaseAxis[];
  blockers: Blocker[];

  // evidence
  score: number;
  aiSummary: string;
  summaryHeadline: string;
  categories: { label: string; score: number; tag?: "strongest" | "weakest" | null }[];
  waveform?: import("@/components/score/report-waveform").ReportWaveformData | null;

  // the human room (co-pillar) — real reviews only, never fabricated
  humanReviews: { rating: number; headline: string; quote: string; positive: boolean }[];
  humanReviewsIn: number;
  humanReviewsTotal: number;
  roomSkipped?: boolean;
  roomResetsAt?: string | null;

  // CTAs
  recheckHref?: string;
  /** Demo-only "compare: old →" affordance in the nav. */
  compareHref?: string;
};

// ── primitives ───────────────────────────────────────────────────────

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${mono.className} text-[12px] tracking-[0.2em] uppercase text-white/45 mb-4`}>
      {children}
    </p>
  );
}

function Meter({ count, max = 5 }: { count: number; max?: number }) {
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

/** Gated content: blur it behind an unlock bar when sealed. */
function Sealed({
  locked,
  children,
  label = "unlock",
}: {
  locked: boolean;
  children: React.ReactNode;
  label?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative select-none">
      <div className="blur-[5px] opacity-50 pointer-events-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <a
          href="#unlock"
          className={`${mono.className} inline-flex items-center gap-1.5 text-[11px] text-white/80 border border-white/20 bg-[#0a0a0a] px-2.5 py-1`}
        >
          <Lock className="h-3 w-3" /> {label}
        </a>
      </div>
    </div>
  );
}

function SectionCard({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border border-white/10 bg-[#0c0c0c] p-6 sm:p-8">
      {children}
    </section>
  );
}

function SectionHead({
  n,
  kicker,
  title,
  ink = ACCENT,
  children,
}: {
  n: string;
  kicker: string;
  title: React.ReactNode;
  ink?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`${mono.className} shrink-0 text-[12px] font-bold text-black px-2 py-0.5`}
          style={{ background: ink }}
        >
          {n}
        </span>
        <span className={`${mono.className} text-[12px] text-white/55 min-w-0 truncate`}>{kicker}</span>
        <span className="h-px flex-1 bg-white/12" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.12]">{title}</h2>
      {children && (
        <p className="text-[15px] text-white/70 leading-relaxed normal-case mt-3 max-w-xl">{children}</p>
      )}
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────

export function VerdictReportView({ data }: { data: VerdictReportData }) {
  const D = data;
  // Gate model: open-read = read free, room/deep gated; locked = sealed teaser.
  const openRead = Boolean(D.openRead);
  const locked = !D.unlocked && !openRead;
  const current = LADDER.find((l) => l.key === D.verdict) ?? LADDER[2];

  const axes = D.releaseBar ?? [];
  const blockers = D.blockers ?? [];
  const inBand = axes.filter((a) => a.status !== "out").length;
  const outOfBand = axes.filter((a) => a.status === "out").length;
  const anyEstimated = axes.some((a) => a.estimated);

  const waveMoments = D.waveform ? deriveWaveMoments(D.waveform) : [];

  const [unlocking, setUnlocking] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { open: openAuth } = useAuthModal();

  // Checkout flows mirror report-view.tsx: POST → Stripe redirect. The demo
  // (no slug / isDemo) just bounces to marketing.
  const handleUnlock = async () => {
    if (D.isDemo || !D.slug) {
      window.location.href = "/";
      return;
    }
    setUnlocking(true);
    try {
      const res = await fetch(`/api/score/${D.slug}/unlock`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (json?.alreadyUnlocked) return window.location.reload();
      if (json?.url) {
        scoreConversions.startUnlockCheckout(D.slug);
        return (window.location.href = json.url);
      }
      setUnlocking(false);
    } catch {
      setUnlocking(false);
    }
  };

  const handleSubscribe = async () => {
    if (subscribing) return;
    if (D.isDemo || !D.slug) {
      window.location.href = "/#pricing";
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch(`/api/score/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: `/report/${D.slug}`, plan: "monthly" }),
      });
      const json = await res.json().catch(() => null);
      if (json?.alreadySubscribed) return window.location.reload();
      if (json?.url) {
        scoreConversions.startSubscribeCheckout("monthly");
        return (window.location.href = json.url);
      }
      // Not signed in: pop the auth panel in place (no full-page bounce). Back on
      // the report logged in, the subscribe button completes to Stripe.
      setSubscribing(false);
      openAuth("signup", `/report/${D.slug}`);
    } catch {
      setSubscribing(false);
    }
  };

  return (
    <div
      className={`${jakarta.className} min-h-screen overflow-x-hidden bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase scroll-smooth`}
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
          <div className={`${mono.className} flex items-center gap-3 text-[12px] sm:text-[13px] min-w-0`}>
            {D.isDemo && (
              <span className="hidden sm:inline text-white/40 shrink-0">[ demo · release verdict ]</span>
            )}
            {D.compareHref && (
              <Link
                href={D.compareHref}
                className="text-white/35 hover:text-white/60 transition-colors whitespace-nowrap shrink-0"
              >
                compare: old →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO: the verdict is the headline ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
        <div className="flex items-center gap-4 sm:gap-5 mb-9 justify-center text-left">
          {D.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={D.artworkUrl}
              alt=""
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-white/15 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 border border-white/15 bg-white/[0.04] shrink-0" />
          )}
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
            const on = l.key === D.verdict;
            return (
              <div
                key={l.key}
                className="flex-1 min-w-0 py-2 px-1 flex items-center justify-center text-center"
                style={{
                  background: on ? l.ink : "#0a0a0a",
                  color: on ? "#000" : "rgba(255,255,255,0.35)",
                }}
              >
                <span className={`${mono.className} block text-[10px] sm:text-[12px] font-bold leading-tight tracking-tight`}>
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
          {VERDICT_COPY[D.verdict].decision}
        </p>
        {D.summaryHeadline && (
          <p className="text-[15px] text-white/65 leading-relaxed normal-case max-w-lg mx-auto mt-4">
            {D.summaryHeadline}
          </p>
        )}

        {/* the evidence behind the call — glanceable tiles, score demoted. When
            no measured bar exists yet (reports generated before it shipped), drop
            the measured tiles and show the honest count of things to address. */}
        <div
          className={`grid ${axes.length ? "grid-cols-3" : "grid-cols-2"} gap-px bg-white/10 border border-white/10 max-w-xl mx-auto mt-8 normal-case`}
        >
          {((axes.length
            ? [
                { v: `${D.score}`, suffix: "/100", l: "resonance score", ink: "#f4f4ef" },
                { v: `${inBand} / ${axes.length}`, l: "craft axes in-band or close", ink: GREEN },
                { v: `${outOfBand}`, l: outOfBand === 1 ? "blocker to release" : "blockers to release", ink: outOfBand ? WARN : GREEN },
              ]
            : [
                { v: `${D.score}`, suffix: "/100", l: "resonance score", ink: "#f4f4ef" },
                { v: `${blockers.length}`, l: blockers.length === 1 ? "thing to address" : "things to address", ink: ACCENT },
              ]) as { v: string; suffix?: string; l: string; ink: string }[]).map((s) => (
            <div key={s.l} className="bg-[#0a0a0a] px-3 py-4">
              <p className="text-2xl sm:text-3xl font-extrabold leading-none" style={{ color: s.ink }}>
                {s.v}
                {s.suffix && <span className="text-sm text-white/40 font-medium">{s.suffix}</span>}
              </p>
              <p className={`${mono.className} text-[10px] sm:text-[11px] text-white/55 mt-2 leading-tight`}>
                {s.l}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-9">
          <a
            href={axes.length ? "#bar" : blockers.length ? "#next" : "#read"}
            className="group inline-flex items-center justify-center gap-2 max-w-full bg-[#6ee7ff] text-black font-extrabold text-[13.5px] sm:text-[15px] px-5 sm:px-6 py-3.5 hover:bg-white transition-colors text-center leading-snug"
          >
            {axes.length ? "see what's between this and release" : "see what to work on"}
            <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-16 space-y-14">
        {/* ── THE ROOM (real humans) — co-pillar, up top ── */}
        {D.humanReviewsTotal > 0 && (
          <section className="border-2 bg-[#0c0c0c] p-6 sm:p-7" style={{ borderColor: "rgba(110,231,255,0.35)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  {D.humanReviewsIn < D.humanReviewsTotal && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACCENT }} />
                  )}
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: ACCENT }} />
                </span>
                <span className={`${mono.className} text-[12px] tracking-wide`} style={{ color: ACCENT }}>
                  {D.humanReviewsIn < D.humanReviewsTotal ? "the room · live" : "the room"}
                </span>
              </div>
              <div className={`${mono.className} text-[12px] text-white/55`}>
                <span className="text-white font-bold">{D.humanReviewsIn}</span> / {D.humanReviewsTotal} in
                {D.humanReviewsIn < D.humanReviewsTotal && (
                  <span className="text-white/40"> · more landing</span>
                )}
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              real listeners are weighing in alongside the verdict
            </h2>
            <p className="text-[14px] text-white/65 leading-relaxed mb-6 normal-case">
              {D.humanReviewsIn < D.humanReviewsTotal
                ? "the verdict ships instantly; the room follows. reactions land here live as each real listener finishes."
                : "the whole room has weighed in."}
              {locked && " headlines + ratings are free — unlock to read the rest."}
            </p>

            <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
              {D.humanReviews.map((r, i) => (
                <div key={i} className="bg-[#0a0a0a] p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`${mono.className} inline-flex items-center gap-1 text-[10px] font-bold text-black px-1.5 py-0.5`}
                      style={{ background: r.positive ? ACCENT : VIOLET }}
                    >
                      <User className="h-2.5 w-2.5" /> real listener
                    </span>
                    <Meter count={r.rating} />
                  </div>
                  <p className="text-[15px] font-bold text-white leading-snug">“{r.headline}”</p>
                  <Sealed locked={locked}>
                    <p className="text-[14px] text-white/70 leading-relaxed normal-case">{r.quote}</p>
                  </Sealed>
                </div>
              ))}
              {/* honest partial state — empty seats still filling */}
              {Array.from({
                length: Math.max(0, D.humanReviewsTotal - D.humanReviews.length),
              }).map((_, i) => (
                <div
                  key={`pending-${i}`}
                  className="bg-[#0a0a0a] p-5 flex flex-col items-center justify-center gap-2 min-h-[120px]"
                >
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: ACCENT, animationDelay: `${d * 200}ms`, opacity: 0.6 }}
                      />
                    ))}
                  </div>
                  <span className={`${mono.className} text-[11px] text-white/30`}>listening now…</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* room skipped (subscriber over allowance): honest "not this one" notice */}
        {!locked && !D.isDemo && D.humanReviewsTotal === 0 && D.roomSkipped && (
          <section className="border border-white/12 bg-[#0c0c0c] p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/40" />
              <span className={`${mono.className} text-[12px] tracking-wide text-white/55`}>
                the room · not this one
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
              the verdict is here — but this track didn&apos;t get the real room.
            </h3>
            <p className="text-white/65 normal-case leading-relaxed max-w-lg">
              you&apos;ve used all your{" "}
              <strong className="text-white">real-listener rounds</strong> for this cycle.
              {D.roomResetsAt && (
                <> your rounds refresh on <strong className="text-white">{D.roomResetsAt}</strong>.</>
              )}{" "}
              the verdict and the release bar above are still yours in full.
            </p>
          </section>
        )}

        {/* ── THE RELEASE BAR — measured vs the genre's release envelope ── */}
        {axes.length > 0 && (
          <SectionCard id="bar">
            <SectionHead
              n="01"
              kicker={`the release bar · vs released ${D.genre.toLowerCase()}`}
              title="where you sit vs what gets released"
            >
              the things we measure straight from your audio. the{" "}
              <span className="text-[#6ee7ff]">shaded band</span> is where{" "}
              <strong className="text-white">released tracks in your genre</strong> land — the{" "}
              <span className="text-white">dot is you</span>. inside the band clears the bar.
            </SectionHead>

            <div className="space-y-7">
              {axes.map((a) => {
                const s = STATUS[a.status];
                return (
                  <div key={a.label}>
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span className="text-[14px] sm:text-[15px] text-white/90 font-bold min-w-0">{a.label}</span>
                      <span className={`${mono.className} flex items-center gap-1.5 text-[12px] shrink-0`} style={{ color: s.ink }}>
                        <s.Icon className="h-3.5 w-3.5 shrink-0" />
                        you: {a.measured}
                      </span>
                    </div>
                    <div className="relative h-7 overflow-hidden bg-white/[0.05] border border-white/10">
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
                      <span
                        className={`${mono.className} absolute inset-y-0 flex items-center text-[10px] tracking-wide text-white/50 pl-1.5 whitespace-nowrap pointer-events-none`}
                        style={{ left: `${a.zone[0]}%` }}
                      >
                        released
                      </span>
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
                    <div className={`${mono.className} flex justify-between text-[11px] uppercase tracking-wide text-white/35 mt-1.5`}>
                      <span>← {a.ends[0]}</span>
                      <span>{a.ends[1]} →</span>
                    </div>
                    <Sealed locked={locked && a.status !== "out"}>
                      <p className="text-[14px] text-white/70 leading-relaxed normal-case mt-2.5">
                        <span className="font-bold" style={{ color: s.ink }}>{s.label}</span> · released
                        sit <span className="text-white/85">{a.band}</span>
                        {a.estimated && (
                          <span className={`${mono.className} text-white/40`}> (estimated band)</span>
                        )}{" "}
                        — {a.note}
                      </p>
                    </Sealed>
                  </div>
                );
              })}
            </div>

            <p className={`${mono.className} text-[12px] text-white/45 mt-8 normal-case border-t border-white/10 pt-5 leading-relaxed`}>
              {anyEstimated ? (
                <>
                  the bands marked <span className="text-white/65">estimated</span> are derived from
                  genre norms while the released-track reference corpus is still being built — they
                  move toward measured as it fills. clearing every band doesn&apos;t make a hit; it
                  makes a track that won&apos;t get skipped or passed on for a fixable reason.
                </>
              ) : (
                <>
                  clearing every band doesn&apos;t make a hit — it makes a track that won&apos;t get
                  skipped or passed on for a fixable reason. what catches fire after that, no one can
                  measure.
                </>
              )}
            </p>
          </SectionCard>
        )}

        {/* ── WHAT STANDS BETWEEN THIS AND RELEASE ── */}
        {blockers.length > 0 && (
          <SectionCard id="next">
            <SectionHead
              n="02"
              kicker="what stands between this and release"
              title={blockers.length === 1 ? "one thing to clear" : `${blockers.length} things, ranked`}
            >
              {outOfBand > 0 ? (
                <>clear the top one and the call moves toward <span style={{ color: GREEN }}>release ready</span>.</>
              ) : (
                <>nothing is blocking release — these are the polish passes, ranked.</>
              )}
            </SectionHead>
            <div className="space-y-px bg-white/10 border border-white/10">
              {blockers.map((b, i) => {
                const ink = i === 0 && outOfBand > 0 ? WARN : i === 0 ? ACCENT : "rgba(255,255,255,0.35)";
                return (
                  <div key={b.rank} className="bg-[#0a0a0a] p-5 flex items-start gap-4">
                    <span
                      className={`${mono.className} flex-shrink-0 w-8 h-8 flex items-center justify-center text-base font-bold text-black`}
                      style={{ background: ink }}
                    >
                      {b.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[15px] font-bold text-white leading-snug">{b.label}</p>
                        <span
                          className={`${mono.className} text-[11px] whitespace-nowrap text-right max-w-[40%]`}
                          style={{ color: ink }}
                        >
                          {b.weight}
                        </span>
                      </div>
                      <Sealed locked={locked && i > 0}>
                        <p className="text-[15px] text-white/70 leading-relaxed normal-case mt-2">
                          {b.detail}
                        </p>
                      </Sealed>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ── THE MOMENT MAP — the real measured waveform ── */}
        {D.waveform && (
          <SectionCard>
            <SectionHead
              n="03"
              kicker="the moment map · from your audio"
              title="where it happens in the track"
            >
              the real frequency-split waveform the verdict is grounded in — every marker the
              analysis flagged.
            </SectionHead>
            <ReportWaveform data={D.waveform} moments={waveMoments} sealed={locked} />
          </SectionCard>
        )}

        {/* ── THE CRAFT CHECK — dimensions, framed as the verdict's evidence ── */}
        {D.categories.length > 0 && (
          <SectionCard>
            <SectionHead
              n="04"
              kicker="the craft check · quality on its own terms"
              title="how strong the craft is, genre aside"
            >
              the release bar above asks <em>&quot;is this where released tracks sit?&quot;</em> this
              asks a different question —{" "}
              <strong className="text-white">how good is the craft itself?</strong> scored 0–5 per
              dimension, independent of genre.
            </SectionHead>
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
        )}

        {/* ── THE FULL READ — gated synthesis (open on unlock / open-read) ── */}
        {D.aiSummary && (
          <SectionCard id="read">
            <SectionHead
              n="05"
              kicker="the read · the full synthesis"
              title="the full read"
              ink={VIOLET}
            >
              the verdict in long form — the energy arc, the moments, and the one thing the call
              hangs on.
            </SectionHead>
            <Sealed locked={locked}>
              <p className="text-[15px] text-white/80 leading-relaxed normal-case whitespace-pre-line">
                {D.aiSummary}
              </p>
            </Sealed>
          </SectionCard>
        )}

        {/* ── THE MOVE — the report distilled to one action (replaces trust block) ── */}
        {(() => {
          const strongest = D.categories.find((c) => c.tag === "strongest");
          const top = blockers[0];
          const curIdx = LADDER.findIndex((l) => l.key === D.verdict);
          const nextRung =
            curIdx >= 0 && curIdx < LADDER.length - 1 ? LADDER[curIdx + 1] : null;
          if (!strongest && !top) return null;
          return (
            <SectionCard>
              <SectionHead
                n="06"
                kicker="the bottom line · what to do next"
                title="your next move"
                ink={GREEN}
              >
                the whole report in one line — what to protect, and the one thing to change first.
              </SectionHead>
              <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
                {strongest && (
                  <div className="bg-[#0a0a0a] p-5">
                    <p className={`${mono.className} text-[11px] tracking-wide mb-2`} style={{ color: GREEN }}>
                      protect this
                    </p>
                    <p className="text-[15px] font-bold text-white leading-snug normal-case">
                      {strongest.label} is your strongest axis — don&apos;t lose it in the fix.
                    </p>
                  </div>
                )}
                {top && (
                  <div className="bg-[#0a0a0a] p-5">
                    <p
                      className={`${mono.className} text-[11px] tracking-wide mb-2`}
                      style={{ color: outOfBand ? WARN : ACCENT }}
                    >
                      {outOfBand ? "fix this first" : "polish this first"}
                    </p>
                    <p className="text-[15px] font-bold text-white leading-snug normal-case">
                      {top.label}
                    </p>
                    {outOfBand > 0 && nextRung && (
                      <p className="text-[13px] text-white/60 leading-relaxed normal-case mt-2">
                        clear it and the call moves toward{" "}
                        <span style={{ color: nextRung.ink }}>{nextRung.label}</span>.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          );
        })()}

        {/* honest provenance — compact strip, not its own section */}
        <div
          className={`${mono.className} flex items-start gap-2.5 text-[11px] text-white/40 normal-case leading-relaxed border-t border-white/10 pt-5`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0 mt-px" style={{ color: GREEN }} />
          <span>
            every axis is measured straight from your audio — no fabricated stats, no percentile we
            can&apos;t back.
            {anyEstimated &&
              " bands marked estimated are genre norms until the released-track corpus lands."}
          </span>
        </div>

        {/* ── UNLOCK / RE-CHECK CTA ── */}
        {!D.unlocked && (
          <section id="unlock" className="border border-white/12 bg-[#0c0c0c] p-7 sm:p-10 text-center">
            <Kicker>{openRead ? "fill the room + go deeper" : "unlock the verdict"}</Kicker>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              {openRead
                ? "send it to the room + open the deep read."
                : "open the full release decision."}
            </h2>
            <p className="text-white/70 text-[15px] normal-case leading-relaxed max-w-lg mx-auto mb-7">
              {openRead
                ? "the verdict and release bar are yours. unlock to put it in front of 5 real listeners and open the deep, moment-by-moment read."
                : "unlock the release decision, every blocker, the moment map, and 5 real listeners on your track."}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="border border-white/15 bg-[#0a0a0a] p-6 flex flex-col">
                <p className={`${mono.className} text-[12px] text-white/55`}>this track</p>
                <p className="text-4xl font-extrabold mt-2 normal-case">
                  $6.95<span className="text-base text-white/45 font-medium"> once</span>
                </p>
                <p className={`${mono.className} text-[12px] text-white/55 mt-2 normal-case flex-1`}>
                  the full verdict, every blocker, the moment map and 5 real listeners on this one
                  track — yours forever.
                </p>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[15px] py-3.5 transition-colors disabled:opacity-60"
                >
                  {unlocking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> opening checkout…</>
                  ) : (
                    <>
                      unlock this track
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
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
                  a verdict and a room on every track you make, and the bar tracks every version so
                  you can see what each fix changed.
                </p>
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors disabled:opacity-60"
                >
                  {subscribing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> opening checkout…</>
                  ) : (
                    <>
                      run every release
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── RE-CHECK (unlocked) — the gate every release goes through ── */}
        {D.unlocked && (
          <section className="border border-white/12 bg-[#0c0c0c] p-7 sm:p-10 text-center">
            <Kicker>before every release</Kicker>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              run the next one through the gate.
            </h2>
            <p className="text-white/70 text-[15px] normal-case leading-relaxed max-w-lg mx-auto mb-7">
              fix it, re-upload, and the bar tells you what changed — the same check on every track
              you put out, so you never ship one that wasn&apos;t ready.
            </p>
            <Link
              href={D.recheckHref ?? "/score-review"}
              className={`${mono.className} inline-flex items-center gap-2 text-[13px] hover:brightness-110 transition normal-case`}
              style={{ color: GREEN }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              already fixed it? re-check this version
            </Link>
          </section>
        )}
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
