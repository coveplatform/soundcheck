"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ScoreRing } from "@/components/score/score-ring";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Share2, Lock, Hourglass } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";
const LENSES = [
  "the producer",
  "a casual listener",
  "a playlist curator",
  "the hook check",
  "a fellow artist",
  "the mix lens",
];
const IMPACT = ["high", "medium", "low"];

// ── View model ──────────────────────────────────────────────────────

export type Verdict =
  | "RELEASE_READY"
  | "ALMOST_THERE"
  | "NEEDS_WORK"
  | "NOT_READY";

export type ReportViewModel = {
  slug: string;
  isDemo: boolean;
  pending: boolean;
  unlocked: boolean;
  trackTitle: string;
  genre: string;
  scoredAt: string;
  roomSize: number;
  score: number;
  percentile: number;
  verdict: Verdict;
  categories: { label: string; score: number; pct: number }[];
  summaryHeadline: string;
  aiSummary: string;
  reactions: {
    initial: string;
    genre: string;
    rating: number;
    headline: string;
    quote: string;
    positive: boolean;
  }[];
  /** Real human listeners ("room of 5"). */
  humanReviews: {
    rating: number;
    headline: string;
    quote: string;
    positive: boolean;
  }[];
  humanReviewsIn: number;
  humanReviewsTotal: number;
  priorityFixes: { label: string; detail: string; count: number }[];
};

/** Honest, score-derived standing — no fabricated population ranking. */
function scoreStanding(score: number): string {
  if (score >= 85) return "a standout score";
  if (score >= 70) return "a strong score";
  if (score >= 50) return "a solid score";
  return "an early-days score";
}

const VERDICTS: Record<Verdict, { label: string; ink: string }> = {
  RELEASE_READY: { label: "release ready", ink: "#7cffc4" },
  ALMOST_THERE: { label: "almost there", ink: ACCENT },
  NEEDS_WORK: { label: "needs work", ink: "#b8a4ff" },
  NOT_READY: { label: "not ready yet", ink: "#ff7a90" },
};

// ── pieces ───────────────────────────────────────────────────────────

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

/** Gated content: blur it and stamp a locked bar over the top. */
function Sealed({
  locked,
  children,
  label = "locked",
}: {
  locked: boolean;
  children: React.ReactNode;
  label?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative select-none">
      <div className="blur-[6px] opacity-50 pointer-events-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`${mono.className} inline-flex items-center gap-1.5 text-[12px] text-black px-3 py-1`}
          style={{ background: ACCENT }}
        >
          <Lock className="h-3 w-3" />
          {label}
        </span>
      </div>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>
      [ {children} ]
    </p>
  );
}

// ── main ─────────────────────────────────────────────────────────────

export function ReportView({ data }: { data: ReportViewModel }) {
  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const locked = !data.unlocked;
  const verdict = VERDICTS[data.verdict];

  const handleShare = () => {
    navigator.clipboard
      .writeText(typeof window !== "undefined" ? window.location.href : "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handleUnlock = async () => {
    if (data.isDemo) {
      window.location.href = "/score";
      return;
    }
    setUnlocking(true);
    try {
      const res = await fetch(`/api/score/${data.slug}/unlock`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (json?.alreadyUnlocked) return window.location.reload();
      if (json?.url) return (window.location.href = json.url);
      setUnlocking(false);
    } catch {
      setUnlocking(false);
    }
  };

  const handleSubscribe = async (plan: "monthly" | "annual" = "monthly") => {
    if (data.isDemo) {
      window.location.href = "/score#pricing";
      return;
    }
    try {
      const res = await fetch(`/api/score/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: `/report/${data.slug}`, plan }),
      });
      const json = await res.json().catch(() => null);
      if (json?.alreadySubscribed) return window.location.reload();
      if (json?.url) return (window.location.href = json.url);
      // not signed in / no email on file → send them to sign in
      window.location.href = `/login?callbackUrl=${encodeURIComponent(`/report/${data.slug}`)}`;
    } catch {
      /* no-op */
    }
  };

  if (data.pending) {
    return <PendingState slug={data.slug} trackTitle={data.trackTitle} />;
  }

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}
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
            {data.isDemo && (
              <span className="text-white/40">[ sample ]</span>
            )}
            <button
              onClick={handleShare}
              className="text-white/55 hover:text-white transition-colors"
            >
              {copied ? "copied!" : "share"}
            </button>
          </div>
        </div>
      </header>

      {/* ── VERDICT HERO ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
        <Kicker>an honest read on your track</Kicker>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] mb-1">
          {data.trackTitle}
        </h1>
        <p className={`${mono.className} text-[13px] text-white/40 mb-9`}>
          {data.genre} · ai feedback · {data.scoredAt}
        </p>

        <p className={`${mono.className} text-[12px] text-white/40 mb-3`}>
          resonance score
        </p>
        <div className="flex justify-center mb-3">
          <ScoreRing score={data.score} size="xl" dark animate />
        </div>
        <p className={`${mono.className} text-[11px] text-white/30 mb-6 normal-case max-w-xs mx-auto`}>
          how your track scores across hook, retention, production, emotion
          &amp; commercial pull
        </p>

        <div
          className={`${mono.className} inline-block text-[13px] text-black px-4 py-1.5 mb-5`}
          style={{ background: verdict.ink }}
        >
          {verdict.label}
        </div>

        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          that&apos;s {scoreStanding(data.score)} —{" "}
          <span style={{ color: ACCENT }}>{data.score}</span>
          <span className="text-white/35"> / 100</span>
        </p>
        <div className="w-56 sm:w-72 mx-auto mt-5">
          <div className="h-1.5 bg-white/10 overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${data.score}%`, background: ACCENT }}
            />
          </div>
          <div className={`${mono.className} flex justify-between mt-1.5 text-[10px] text-white/25`}>
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-16 space-y-14">
        {/* ── BREAKDOWN ── */}
        <section>
          <Kicker>the breakdown</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
            how it scored, dimension by dimension
          </h2>
          <div className="space-y-5">
            {data.categories.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] text-white/80">{cat.label}</span>
                  <span className={`${mono.className} text-[15px] font-bold`}>
                    {cat.score.toFixed(1)}
                    <span className="text-white/35"> / 5</span>
                  </span>
                </div>
                <div className="h-2.5 bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${cat.pct}%`, background: ACCENT }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SYNTHESIS ── */}
        <section>
          <Kicker>the honest read</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            {data.summaryHeadline}
          </h2>
          <div className="border-l-2 pl-5" style={{ borderColor: ACCENT }}>
            <Sealed locked={locked} label="unlock to read the full read">
              <p className="text-lg sm:text-xl leading-relaxed text-white/85 normal-case">
                {data.aiSummary}
              </p>
            </Sealed>
          </div>
        </section>

        {/* ── REACTIONS ── */}
        <section>
          <Kicker>from a few angles</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            how it reads from every seat
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
            your track through different ai lenses.
            {locked && " headlines are free — unlock to read the rest."}
          </p>

          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {data.reactions.map((r, i) => (
              <div key={i} className="bg-[#0a0a0a] p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`${mono.className} text-[10px] font-bold text-black px-1.5 py-0.5`}
                      style={{ background: r.positive ? ACCENT : "#b8a4ff" }}
                    >
                      ai
                    </span>
                    <p className={`${mono.className} text-[12px] text-white/70`}>
                      {LENSES[i % LENSES.length]}
                    </p>
                  </div>
                  <Meter count={r.rating} />
                </div>

                <p className="text-[15px] font-bold text-white leading-snug">
                  “{r.headline}”
                </p>

                <Sealed locked={locked} label="unlock">
                  <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                    {r.quote}
                  </p>
                </Sealed>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE ROOM (real humans) ── */}
        {data.humanReviewsTotal > 0 && (
          <section>
            <Kicker>the room</Kicker>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              {data.humanReviewsIn} of {data.humanReviewsTotal} real listeners in
            </h2>
            <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
              {data.humanReviewsIn < data.humanReviewsTotal
                ? "more reactions land as the room finishes — check back."
                : "the whole room weighed in."}
              {locked && " headlines are free — unlock to read the rest."}
            </p>

            {data.humanReviews.length === 0 ? (
              <div className="border border-white/10 bg-[#0a0a0a] p-6">
                <p className={`${mono.className} text-[13px] text-white/45 normal-case`}>
                  your track is with the room now — the first reactions are on their way.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
                {data.humanReviews.map((r, i) => (
                  <div key={i} className="bg-[#0a0a0a] p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`${mono.className} text-[10px] font-bold text-black px-1.5 py-0.5`}
                        style={{ background: r.positive ? ACCENT : "#b8a4ff" }}
                      >
                        listener
                      </span>
                      <Meter count={r.rating} />
                    </div>
                    <p className="text-[15px] font-bold text-white leading-snug">
                      “{r.headline}”
                    </p>
                    <Sealed locked={locked} label="unlock">
                      <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                        {r.quote}
                      </p>
                    </Sealed>
                  </div>
                ))}
                {/* pending seats */}
                {Array.from({
                  length: Math.max(0, data.humanReviewsTotal - data.humanReviews.length),
                }).map((_, i) => (
                  <div
                    key={`pending-${i}`}
                    className="bg-[#0a0a0a] p-5 flex items-center justify-center min-h-[120px]"
                  >
                    <span className={`${mono.className} text-[12px] text-white/25`}>
                      still listening…
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── FIXES ── */}
        <section>
          <Kicker>if you change three things</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
what to fix first
          </h2>
          <div className="space-y-px bg-white/10 border border-white/10">
            {data.priorityFixes.map((fix, i) => (
              <div key={i} className="bg-[#0a0a0a] p-5 flex items-start gap-4">
                <span
                  className={`${mono.className} flex-shrink-0 w-8 h-8 flex items-center justify-center text-base font-bold text-black`}
                  style={{ background: ACCENT }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-bold text-white leading-snug">
                      {fix.label}
                    </p>
                    <span className={`${mono.className} text-[12px] whitespace-nowrap`} style={{ color: i === 0 ? ACCENT : undefined }}>
                      {IMPACT[Math.min(i, 2)]} impact
                    </span>
                  </div>
                  <div className="mt-2">
                    <Sealed locked={locked} label="unlock for the detail">
                      <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                        {fix.detail}
                      </p>
                    </Sealed>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── UNLOCK / SHARE ── */}
        {locked ? (
          <section className="border border-white/12 bg-[#101010] p-7 sm:p-10">
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-12 h-12 mb-5"
                style={{ background: ACCENT }}
              >
                <Lock className="h-5 w-5 text-black" />
              </div>
              <Kicker>the full read is right here</Kicker>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                unlock the full read
              </h2>
              <p className="text-white/70 text-[15px] max-w-md mx-auto normal-case leading-relaxed">
                Every reaction in full, the complete synthesis, and the detail
                behind all three fixes.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* this track */}
              <div className="border border-white/15 bg-[#0a0a0a] p-6 flex flex-col">
                <p className={`${mono.className} text-[13px] text-white/60`}>this track</p>
                <p className="text-4xl font-extrabold mt-2">
                  $6.95<span className="text-base text-white/45 font-medium"> once</span>
                </p>
                <p className={`${mono.className} text-[12px] text-white/55 mt-1 normal-case`}>
                  unlock this one report — yours forever
                </p>
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="group mt-auto pt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[15px] py-3.5 transition-colors disabled:opacity-60"
                >
                  {unlocking ? "opening…" : "unlock this track"}
                  {!unlocking && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </div>

              {/* unlimited — highlighted */}
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
                  every track you submit, auto-unlocked
                </p>
                <button
                  onClick={() => handleSubscribe("monthly")}
                  className="group mt-auto pt-6 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors"
                >
                  go unlimited
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => handleSubscribe("annual")}
                  className={`${mono.className} mt-2 text-[12px] text-white/55 hover:text-white transition-colors`}
                >
                  or $143.40/yr (save 40%)
                </button>
              </div>
            </div>
            <p className={`${mono.className} text-[12px] text-white/40 mt-6 text-center normal-case`}>
              one-time or subscription · cancel anytime · secured by stripe
            </p>
          </section>
        ) : (
          <section className="border border-white/12 bg-[#101010] p-8 text-center">
            <Kicker>that&apos;s the full read</Kicker>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
              share your verdict, or run another
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleShare}
                className={`${mono.className} inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-3 transition-colors`}
              >
                <Share2 className="h-4 w-4" />
                {copied ? "link copied!" : "copy share link"}
              </button>
              <Link href="/score">
                <button className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-sm px-5 py-3 hover:bg-white transition-colors">
                  play another track
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </section>
        )}
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

// ── pending ──────────────────────────────────────────────────────────

function PendingState({ slug, trackTitle }: { slug: string; trackTitle: string }) {
  const [stalled, setStalled] = useState(false);

  // Self-heal + poll: kick generation (idempotent — no-op if the read is
  // already in, re-runs it if submit timed out), then poll until it lands and
  // reload into the full report. Falls back to a manual refresh if it stalls.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/score/${slug}/generate`, { method: "POST" });
        const json = (await res.json().catch(() => null)) as { ready?: boolean } | null;
        if (cancelled) return;
        if (json?.ready) {
          window.location.reload();
          return;
        }
      } catch {
        /* transient — keep trying */
      }
      if (cancelled) return;
      if (attempts >= 4) {
        setStalled(true);
        return;
      }
      setTimeout(tick, 4000);
    };

    const t = setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] flex items-center justify-center px-5 lowercase`}
    >
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-14 h-14 mb-6"
          style={{ background: ACCENT }}
        >
          <Hourglass className="h-6 w-6 text-black animate-pulse" />
        </div>
        <p className={`${mono.className} text-[13px] text-white/40 mb-3`}>
          [ analyzing your track ]
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          {trackTitle} is being analyzed
        </h1>
        <p className="text-white/50 mb-7 normal-case">
          {stalled
            ? "This is taking longer than usual. Give it a moment and refresh."
            : "Your read is being put together right now. This page updates on its own."}
        </p>
        {stalled && (
          <Link href={`/report/${slug}`}>
            <button className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-sm px-6 py-3">
              refresh
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
