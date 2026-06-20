"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ScoreRing } from "@/components/score/score-ring";
import { ReportWaveform, deriveWaveMoments } from "@/components/score/report-waveform";
import { ScoreRadar } from "@/components/score/score-radar";
import { RetentionCurve } from "@/components/score/retention-curve";
import {
  CreepingBar,
  EqBars,
  RotatingLine,
  Elapsed,
  LISTEN_FLAVOR,
  WRITE_FLAVOR,
} from "@/components/score/analyzing-bits";
import { Logo } from "@/components/ui/logo";
import { SCORE_GENRES } from "@/lib/score-genres";
import { FREE_FULL_READ } from "@/lib/score-free-tier";
import { scoreConversions } from "@/lib/score-conversions";
import type { SubPlan } from "@/lib/score-pricing";
import { ArrowRight, Share2, Lock, Hourglass, User, Loader2, Check } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";
const GREEN = "#7cffc4";
const LENSES = [
  "producer's read",
  "casual first listen",
  "playlist curator",
  "hook check",
  "arrangement & energy",
  "mix lens",
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
  /** Open-read (free-tier) model: the full AI read renders without payment —
      `unlocked` then gates only the human room + deep read. */
  openRead?: boolean;
  trackTitle: string;
  artworkUrl: string | null;
  genre: string;
  scoredAt: string;
  roomSize: number;
  score: number;
  percentile: number;
  verdict: Verdict;
  categories: { label: string; score: number; pct: number; note: string }[];
  summaryHeadline: string;
  aiSummary: string;
  reactions: {
    /** Which analytical angle this read takes (falls back to LENSES by order). */
    lens?: string;
    genre: string;
    /** One-line finding — always shown. */
    headline: string;
    /** The analytical read for this angle — gated until unlock. */
    quote: string;
    /** Short chips summarising what this angle flags. */
    tags?: string[];
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
  /** Subscriber over their monthly room allowance: AI read only, no human room. */
  roomSkipped?: boolean;
  /** When their real-reviewer rounds refresh (formatted), for the skipped notice. */
  roomResetsAt?: string | null;
  priorityFixes: { label: string; detail: string; count: number }[];
  /** The artist's pre-reveal prediction (pending-screen widget), if they made one. */
  scoreGuess?: number | null;
  /** Set when the clip was too short to score as a real track. */
  invalid?: { reason: string; durationSec?: number } | null;
  /** False when the read wasn't grounded in measured audio (title/metadata only). */
  grounded?: boolean;
  /** The measured 3-band waveform (worker analysis) — drawn when unlocked. */
  waveform?: import("@/components/score/report-waveform").ReportWaveformData | null;
};

/** Verdict-specific standing + the line pointing at the locked "why".
    Honest by construction: the read really does contain the specifics. */
const VERDICT_LINES: Record<Verdict, { standing: string; tease: string }> = {
  RELEASE_READY: {
    standing: "a release-ready score",
    tease:
      "the read breaks down what's carrying it — and the one thing that could still hold it back.",
  },
  ALMOST_THERE: {
    standing: "close, one push from ready",
    tease: "the read found what's holding it back. it's specific, and it's fixable.",
  },
  NEEDS_WORK: {
    standing: "a fixable score",
    tease: "something specific is dragging this down — the read pinpoints exactly what.",
  },
  NOT_READY: {
    standing: "an early-days score",
    tease: "the read maps where to start — the biggest win is in the breakdown.",
  },
};

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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>
      [ {children} ]
    </p>
  );
}

// ── main ─────────────────────────────────────────────────────────────

export function ReportView({ data }: { data: ReportViewModel }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [subscribing, setSubscribing] = useState<"monthly" | "annual" | null>(null);
  // openRead: the read is free in full — nothing seals, and `locked` (which
  // drives the sealed-teaser page + every blur) never engages. Payment then
  // only buys the room + deep read, gated off `data.unlocked` directly.
  const openRead = Boolean(data.openRead);
  const locked = !data.unlocked && !openRead;

  // Open-read page furniture: a numbered section index (hero nav + kickers) so
  // the long page reads as a guided report, plus shared card styling that
  // chunks each section visually.
  const toc = openRead
    ? [
        ...(data.waveform ? [{ id: "listen", label: "the listen" }] : []),
        { id: "breakdown", label: "the breakdown" },
        { id: "read", label: "the read" },
        { id: "angles", label: "the angles" },
        { id: "fixes", label: "the fixes" },
      ]
    : [];
  const secNum = (id: string) => {
    const i = toc.findIndex((s) => s.id === id);
    return i >= 0 ? `${String(i + 1).padStart(2, "0")} · ` : "";
  };
  const sectionCard = openRead
    ? "scroll-mt-24 border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
    : "";

  // Sticky buy bar (open-read, room not purchased) — hides while the pricing
  // section itself is on screen so it never doubles the CTA.
  const [buyBarHidden, setBuyBarHidden] = useState(false);
  useEffect(() => {
    if (!openRead || data.unlocked) return;
    const el = document.getElementById("unlock");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setBuyBarHidden(e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, [openRead, data.unlocked]);
  // Measured moment markers, derived client-side from the stored waveform.
  const waveMoments = data.waveform ? deriveWaveMoments(data.waveform) : [];

  // Back from Stripe with a success param: report the conversion to the ad
  // pixels. Runs regardless of lock state (the webhook may beat the redirect);
  // the helper dedupes via localStorage so refreshes don't double-fire.
  useEffect(() => {
    if (data.isDemo) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("unlocked")) {
      scoreConversions.unlockPurchased(data.slug);
    } else if (params.has("subscribed")) {
      const plan: SubPlan = params.get("plan") === "annual" ? "annual" : "monthly";
      scoreConversions.subscribed(plan);
    }
  }, [data.isDemo, data.slug]);

  // Just back from Stripe? The success redirect lands a beat before the webhook
  // flips `paidAt`, so the report can still read unpaid. Poll a refresh until
  // the unlock lands (or we give up) instead of stranding a paying customer on
  // the paywall. Keyed off `data.unlocked` (not `locked`) — an open-read report
  // is never `locked`, but a room purchase on it still needs this poll.
  const [finalizing, setFinalizing] = useState(false);
  useEffect(() => {
    if (data.isDemo || data.unlocked) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("unlocked") && !params.has("subscribed")) return;
    setFinalizing(true);
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      if (tries > 10) {
        setFinalizing(false);
        clearInterval(t);
        return;
      }
      router.refresh();
    }, 2000);
    return () => clearInterval(t);
  }, [data.isDemo, data.unlocked, router]);

  // Live room: while listeners are still coming in, quietly re-fetch so new
  // reactions appear without a manual refresh.
  const roomPending =
    !data.isDemo && data.humanReviewsIn < data.humanReviewsTotal;
  useEffect(() => {
    if (!roomPending) return;
    const t = setInterval(() => router.refresh(), 25000);
    return () => clearInterval(t);
  }, [roomPending, router]);
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
      window.location.href = "/";
      return;
    }
    setUnlocking(true);
    try {
      const res = await fetch(`/api/score/${data.slug}/unlock`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (json?.alreadyUnlocked) return window.location.reload();
      if (json?.url) {
        scoreConversions.startUnlockCheckout(data.slug);
        return (window.location.href = json.url);
      }
      setUnlocking(false);
    } catch {
      setUnlocking(false);
    }
  };

  const handleSubscribe = async (plan: "monthly" | "annual" = "monthly") => {
    if (subscribing) return;
    if (data.isDemo) {
      window.location.href = "/#pricing";
      return;
    }
    setSubscribing(plan);
    try {
      const res = await fetch(`/api/score/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: `/report/${data.slug}`, plan }),
      });
      const json = await res.json().catch(() => null);
      if (json?.alreadySubscribed) return window.location.reload();
      if (json?.url) {
        scoreConversions.startSubscribeCheckout(plan);
        return (window.location.href = json.url);
      }
      // not signed in / no email on file → send them to sign in
      window.location.href = `/login?callbackUrl=${encodeURIComponent(`/report/${data.slug}`)}`;
    } catch {
      setSubscribing(null);
    }
  };

  if (data.pending) {
    return (
      <PendingState
        slug={data.slug}
        trackTitle={data.trackTitle}
        artworkUrl={data.artworkUrl}
        genre={data.genre}
        scoreGuess={data.scoreGuess}
      />
    );
  }

  // Not scoreable — too short (a clip), too long (a set/mix/podcast), or the
  // link itself is dead (deleted/private/wrong → nothing to listen to). Don't
  // show a fabricated score; say which and what to do.
  if (data.invalid) {
    const tooLong = data.invalid.reason === "too_long";
    const unavailable = data.invalid.reason === "unavailable";
    const mins =
      tooLong && data.invalid.durationSec != null
        ? Math.round(data.invalid.durationSec / 60)
        : null;
    return (
      <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] flex items-center justify-center px-5 lowercase`}>
        <div className="max-w-md w-full border border-white/12 bg-[#101010] p-8 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center text-2xl mb-5" style={{ background: ACCENT, color: "#000" }}>!</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            {unavailable
              ? "we couldn't reach that track"
              : tooLong
                ? "that's more than one track"
                : "that's not a full track"}
          </h1>
          <p className="text-white/65 normal-case leading-relaxed mb-7">
            {unavailable
              ? "The link looks deleted, private, or wrong — we couldn't pull any audio from it. Check the track plays in a private browser window, then submit it again and we'll give it a real read."
              : tooLong
                ? `${mins ? `This runs about ${mins} minutes — ` : "This is "}longer than a single song, so one score wouldn't be honest. Submit one track (under 13 minutes) and we'll give it a real read.`
                : `${
                    data.invalid.durationSec != null
                      ? `We measured only ${data.invalid.durationSec}s of audio — too short to score. `
                      : "This clip is too short to score as a track. "
                  }Submit the complete song and we'll give you a real read.`}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] px-6 py-3.5 hover:bg-white transition-colors">
            {unavailable ? "submit a working link →" : tooLong ? "score one track →" : "score a full track →"}
          </Link>
        </div>
      </div>
    );
  }

  // ── LOCKED REPORT (pre-purchase) ─────────────────────────────────────
  // A deliberately lean three-beat page so cold traffic isn't buried: (1) the
  // SEALED score + a prose verdict — the number is the thing they came for, so
  // it's the thing we gate; (2) one proof block — the measured waveform + a
  // sealed teaser of the real read; (3) one decision — what unlock delivers +
  // pricing. The full breakdown, the six AI lenses and every fix detail render
  // only on the UNLOCKED report below; we don't render-then-blur the whole
  // thing here. One CTA target (#unlock), one label.
  if (locked) {
    const sorted = [...data.categories].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const topFix = data.priorityFixes[0];
    // One complete, readable free sentence (no squinting at half-blurred prose).
    const firstSentence =
      (data.aiSummary || "").trim().split(/(?<=[.!?])\s+/)[0] || data.summaryHeadline;
    const summaryWords = (data.aiSummary || "").trim().split(/\s+/).filter(Boolean).length;
    // What's behind the seal, as a clean scannable manifest — the free signal
    // (strongest/weakest dimension, the #1 fix label, the word count) lives in
    // readable sub-lines, not in blurred text you have to strain to parse.
    const readRows: { label: string; sub: string }[] = [
      { label: "the full written read", sub: `${summaryWords} words on what's landing and what isn't` },
      {
        label: "all 5 dimensions, scored + explained",
        sub: `strongest: ${strongest.label.toLowerCase()} · most to gain: ${weakest.label.toLowerCase()}`,
      },
      ...(topFix ? [{ label: "3 fixes, ranked by impact", sub: `#1 — ${topFix.label}` }] : []),
      { label: "the same track heard from 6 angles", sub: "producer · curator · casual listener + 3 more" },
    ];

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
          <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/">
              <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
            </Link>
            <div className={`${mono.className} flex items-center gap-3 text-[13px]`}>
              {data.isDemo && <span className="text-white/40">[ sample ]</span>}
              <a href="#unlock" className="text-white/35 hover:text-white/60 transition-colors">
                🔒 unlock
              </a>
            </div>
          </div>
        </header>

        {/* ── BEAT 1 · the sealed score + prose verdict ── */}
        <section className="relative z-10 max-w-2xl mx-auto px-5 pt-14 pb-12 text-center">
          <Kicker>your read is in</Kicker>
          <div className={`flex items-center gap-4 sm:gap-5 mb-9 ${data.artworkUrl ? "justify-center text-left" : "justify-center text-center flex-col gap-0"}`}>
            {data.artworkUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.artworkUrl}
                alt=""
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-white/15 shrink-0"
              />
            )}
            <div className={data.artworkUrl ? "min-w-0" : ""}>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-1 break-words">
                {data.trackTitle}
              </h1>
              <p className={`${mono.className} text-[13px] text-white/40`}>
                {data.genre} · ai feedback · {data.scoredAt}
              </p>
            </div>
          </div>

          <p className={`${mono.className} text-[12px] text-white/40 mb-3`}>resonance score</p>
          {/* the score, sealed: real ring, blurred, with a single reveal pill */}
          <div className="relative inline-block">
            <div className="blur-[12px] opacity-60 pointer-events-none select-none" aria-hidden>
              <ScoreRing score={data.score} size="xl" dark animate={false} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
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

          {data.grounded === false && !data.isDemo && (
            <p className={`${mono.className} text-[11px] text-amber-300/80 text-center normal-case mt-4 max-w-sm mx-auto`}>
              ⚠ scored from the title &amp; metadata — we couldn&apos;t analyse the audio this time, so treat the number as a rough read.
            </p>
          )}

          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-7 max-w-xl mx-auto">
            the read says it&apos;s{" "}
            <span style={{ color: ACCENT }}>{VERDICT_LINES[data.verdict].standing}</span>.
          </p>
          <p className={`${mono.className} text-[12.5px] mt-3 normal-case max-w-sm mx-auto`} style={{ color: ACCENT }}>
            {VERDICT_LINES[data.verdict].tease}
          </p>
          {FREE_FULL_READ && !data.isDemo && (
            <p className={`${mono.className} text-[12px] text-white/40 mt-3 normal-case max-w-sm mx-auto`}>
              your first track&apos;s report was free — this one opens with a one-time
              unlock, or go unlimited and never see a seal again.
            </p>
          )}
          {data.scoreGuess != null && (
            <p className={`${mono.className} text-[13px] text-white/55 mt-3 normal-case`}>
              you called <span className="font-bold text-white">{data.scoreGuess}</span> — unlock to see how close you were.
            </p>
          )}

          <a
            href="#unlock"
            className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] px-6 py-3.5 mt-9 hover:bg-white transition-colors"
          >
            unlock the score, the read &amp; the room
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <p className={`${mono.className} text-[11px] text-white/30 mt-4 normal-case`}>
            one scroll, one unlock — here&apos;s what&apos;s under the seal.
          </p>
        </section>

        <div className="relative z-10 max-w-2xl mx-auto px-5 pb-16 space-y-12">
          {/* ── BEAT 2 · the proof — measured waveform + a sealed read teaser ── */}
          {data.waveform && (
            <section>
              <Kicker>we listened · measured from your audio</Kicker>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                we listened to the whole thing.
              </h2>
              <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
                Your track&apos;s real frequency-split waveform, marked where the read found its
                moments. One is open — the rest unlock with the full read.
              </p>
              <ReportWaveform data={data.waveform} moments={waveMoments} sealed />
            </section>
          )}

          <section>
            <Kicker>the honest read</Kicker>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              {data.summaryHeadline}
            </h2>
            {/* one complete, readable free line — proof the read is real & specific */}
            <p
              className="text-lg sm:text-xl leading-relaxed text-white/85 normal-case border-l-2 pl-5"
              style={{ borderColor: ACCENT }}
            >
              {firstSentence}
            </p>

            {/* what's behind the seal — a clean checklist, scannable in one glance */}
            <p className={`${mono.className} text-[12px] text-white/45 mt-8 mb-3 normal-case`}>
              unlocking opens the rest:
            </p>
            <div className="border border-white/10">
              {readRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 p-4 border-b border-white/10 last:border-b-0"
                >
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-white leading-snug">{row.label}</p>
                    <p className={`${mono.className} text-[12px] text-white/45 mt-0.5 normal-case`}>
                      {row.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── BEAT 3 · one decision — what unlock does + pricing ── */}
          <section id="unlock" className="scroll-mt-20 border border-white/12 bg-[#101010] p-7 sm:p-10">
            {finalizing && (
              <div
                className="mb-7 flex items-center justify-center gap-3 border p-4 text-center"
                style={{ borderColor: "rgba(110,231,255,0.4)", background: "rgba(110,231,255,0.06)" }}
              >
                <Hourglass className="h-4 w-4 animate-pulse" style={{ color: ACCENT }} />
                <p className="text-[14px] normal-case" style={{ color: ACCENT }}>
                  payment received — finalizing your unlock…
                </p>
              </div>
            )}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-5" style={{ background: ACCENT }}>
                <Lock className="h-5 w-5 text-black" />
              </div>
              <Kicker>unlock — here&apos;s exactly what happens</Kicker>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                unlock &amp; send it to the room
              </h2>
              <p className="text-white/65 text-[14px] max-w-md mx-auto normal-case leading-relaxed">
                The score and read are instant AI. The room is{" "}
                <strong className="text-white">5 real people</strong> — actual humans who listen to
                your track and write back.
              </p>
            </div>

            {/* what unlock does — a VERTICAL sequence (steps, top to bottom) so it
                reads as a timeline and never mirrors the two price cards below */}
            <div className="max-w-xl mx-auto mb-9 border border-white/10 divide-y divide-white/10">
              <div className="flex items-start gap-3.5 p-4">
                <span
                  className={`${mono.className} flex-shrink-0 w-7 h-7 flex items-center justify-center text-[13px] font-bold text-black`}
                  style={{ background: ACCENT }}
                >
                  1
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-white normal-case leading-snug">
                    instantly — your score reveals &amp; the full read opens
                  </p>
                  <p className={`${mono.className} text-[12px] text-white/50 mt-0.5 normal-case`}>
                    every dimension, the why behind each, and the 3 ranked fixes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-4">
                <span
                  className={`${mono.className} flex-shrink-0 w-7 h-7 flex items-center justify-center text-[13px] font-bold text-black`}
                  style={{ background: GREEN }}
                >
                  2
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-white normal-case leading-snug">
                    over the next hours — 5 real people react
                  </p>
                  <p className={`${mono.className} text-[12px] text-white/50 mt-0.5 normal-case`}>
                    actual humans, not AI — they listen end to end and write honest feedback, landing
                    here seat by seat
                  </p>
                </div>
              </div>
            </div>

            <p className={`${mono.className} text-[12px] text-white/45 text-center mb-4 normal-case`}>
              both plans get you everything above — pick how you pay:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto items-stretch">
              {/* one-time */}
              <div className="border border-white/15 bg-[#0a0a0a] p-6 flex flex-col">
                <p className={`${mono.className} text-[13px] text-white/60`}>just this track</p>
                <p className="text-4xl font-extrabold mt-2">
                  $6.95<span className="text-base text-white/45 font-medium"> once</span>
                </p>
                <ul className={`${mono.className} text-[12.5px] text-white/65 normal-case mt-5 space-y-2.5 flex-1`}>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <span>this track&apos;s full report — score + written read</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <span>5 real people review this track</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <span>yours forever · no subscription</span>
                  </li>
                </ul>
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[15px] py-3.5 transition-colors disabled:opacity-60"
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
                <ul className={`${mono.className} text-[12.5px] text-white/65 normal-case mt-5 space-y-2.5 flex-1`}>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <span><strong className="text-white">unlimited</strong> full reports — submit as many tracks as you want</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <span>5 real people review <strong className="text-white">3 tracks</strong> each month</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <span>cancel anytime</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={subscribing !== null}
                  className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-wait"
                >
                  {subscribing === "monthly" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> opening checkout…</>
                  ) : (
                    <>go unlimited <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </button>
              </div>
            </div>
            <p className={`${mono.className} text-[12px] text-white/50 mt-6 text-center normal-case`}>
              want to see a full unlocked report first?{" "}
              <Link href="/report/demo" className="font-bold hover:brightness-110 transition" style={{ color: ACCENT }}>
                view a sample →
              </Link>
            </p>
            <p className={`${mono.className} text-[12px] text-white/40 mt-2 text-center normal-case`}>
              one-time or subscription · cancel anytime · secured by stripe
            </p>
          </section>
        </div>

        <footer className="relative z-10 border-t border-white/10">
          <div className={`${mono.className} max-w-2xl mx-auto px-5 py-8 flex items-center justify-between text-[13px] text-white/40`}>
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    );
  }

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
          <div className="flex items-center gap-5 sm:gap-7">
            <Link href="/">
              <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
            </Link>
            <nav className={`${mono.className} hidden sm:flex items-center gap-5 text-[13px]`}>
              <Link href="/dashboard" className="text-white/55 hover:text-white transition-colors">
                dashboard
              </Link>
              <Link href="/score-review" className="text-white/55 hover:text-white transition-colors">
                review queue
              </Link>
            </nav>
          </div>
          <div className={`${mono.className} flex items-center gap-3 text-[13px]`}>
            {data.isDemo && (
              <span className="text-white/40">[ sample ]</span>
            )}
            {/* Share only once unlocked — a shared link shows the full report publicly. */}
            {!locked ? (
              <button
                onClick={handleShare}
                className="text-white/55 hover:text-white transition-colors"
              >
                {copied ? "copied!" : "share"}
              </button>
            ) : (
              <a href="#unlock" className="text-white/35 hover:text-white/60 transition-colors">
                🔒 unlock to share
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── status banner: initial analysis ready, reviews still landing ── */}
      {roomPending && (
        <div
          className="relative z-20 border-b"
          style={{ background: "rgba(110,231,255,0.08)", borderColor: "rgba(110,231,255,0.25)" }}
        >
          <div className={`${mono.className} max-w-3xl mx-auto px-5 py-3 flex items-center justify-center gap-2.5 text-[12px] text-center`}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACCENT }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ACCENT }} />
            </span>
            <span className="text-white/80">
              <span className="font-bold" style={{ color: ACCENT }}>instant read ready</span>
              <span className="text-white/30"> · </span>
              real listeners tuning in
              <span className="text-white/30"> · </span>
              <span className="font-bold text-white">{data.humanReviewsIn}/{data.humanReviewsTotal} in</span>
              <span className="hidden sm:inline">
                <span className="text-white/30"> · </span>reactions land live
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── VERDICT HERO ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
        <Kicker>{openRead ? "your full read — free, nothing sealed" : "an honest read on your track"}</Kicker>
        <div className={`flex items-center gap-4 sm:gap-5 mb-9 ${data.artworkUrl ? "justify-center text-left" : "justify-center text-center flex-col gap-0"}`}>
          {data.artworkUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.artworkUrl}
              alt=""
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-white/15 shrink-0"
            />
          )}
          <div className={data.artworkUrl ? "min-w-0" : ""}>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-1 break-words">
              {data.trackTitle}
            </h1>
            <p className={`${mono.className} text-[13px] text-white/40`}>
              {data.genre} · ai feedback · {data.scoredAt}
            </p>
          </div>
        </div>

        <p className={`${mono.className} text-[12px] text-white/40 mb-3`}>
          resonance score
        </p>
        <div className="flex justify-center mb-3">
          <ScoreRing score={data.score} size="xl" dark animate />
        </div>

        {/* Honesty: this read wasn't grounded in measured audio. */}
        {data.grounded === false && !data.isDemo && (
          <p className={`${mono.className} text-[11px] text-amber-300/80 text-center normal-case mb-3 max-w-sm mx-auto`}>
            ⚠ scored from the title &amp; metadata — we couldn&apos;t analyse the audio this time, so treat the number as a rough read.
          </p>
        )}
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
          that&apos;s {VERDICT_LINES[data.verdict].standing} —{" "}
          <span style={{ color: ACCENT }}>{data.score}</span>
          <span className="text-white/35"> / 100</span>
        </p>
        {/* the prediction reveal — they called it on the pending screen */}
        {data.scoreGuess != null && (
          <p className={`${mono.className} text-[13px] text-white/60 mt-3 normal-case`}>
            {Math.abs(data.score - data.scoreGuess) <= 3 ? (
              <>you called <span className="font-bold text-white">{data.scoreGuess}</span> — dead on. you know this track.</>
            ) : data.score > data.scoreGuess ? (
              <>you called <span className="font-bold text-white">{data.scoreGuess}</span> — the read came in <span className="font-bold" style={{ color: ACCENT }}>{data.score - data.scoreGuess} higher</span>.</>
            ) : (
              <>you called <span className="font-bold text-white">{data.scoreGuess}</span> — the read says <span className="font-bold" style={{ color: ACCENT }}>{data.scoreGuess - data.score} lower</span>. the why is below.</>
            )}
          </p>
        )}
        {locked && (
          <p className={`${mono.className} text-[12.5px] mt-3 normal-case max-w-sm mx-auto`} style={{ color: ACCENT }}>
            {VERDICT_LINES[data.verdict].tease}
          </p>
        )}
        {!openRead && (
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
        )}

        {/* the report's index — one glance says what's here and where to go */}
        {openRead && toc.length > 0 && (
          <nav
            className={`${mono.className} flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-10 pt-6 border-t border-white/10 text-[12px]`}
          >
            {toc.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-white/45 hover:text-white transition-colors"
              >
                <span style={{ color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>{" "}
                {s.label}
              </a>
            ))}
            {!data.unlocked && (
              <a href="#unlock" className="font-bold hover:brightness-110 transition" style={{ color: ACCENT }}>
                → the room
              </a>
            )}
          </nav>
        )}
      </section>

      <div
        className={`relative z-10 max-w-3xl mx-auto px-5 space-y-14 ${
          openRead && !data.unlocked ? "pb-32" : "pb-16"
        }`}
      >
        {/* ── ROOM SKIPPED (subscriber over their monthly rounds) ── */}
        {!locked && !data.isDemo && data.humanReviewsTotal === 0 && data.roomSkipped && (
          <section className="border border-white/12 bg-[#0c0c0c] p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/40" />
              <span className={`${mono.className} text-[12px] tracking-wide text-white/55`}>
                the room · not this one
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
              Your AI read is here — but this track didn&apos;t get the real room.
            </h3>
            <p className="text-white/65 normal-case leading-relaxed max-w-lg">
              You&apos;ve used all your{" "}
              <strong className="text-white">real-listener rounds</strong> for this cycle (each round
              is a full room of 5 real people on one track).
              {data.roomResetsAt && (
                <> Your rounds refresh on <strong className="text-white">{data.roomResetsAt}</strong>.</>
              )}{" "}
              The instant AI read above is still yours in full.
            </p>
          </section>
        )}

        {/* ── THE ROOM (real humans) — live, up top ── */}
        {data.humanReviewsTotal > 0 && (
          <section className="border-2 bg-[#0c0c0c] p-6 sm:p-7" style={{ borderColor: "rgba(110,231,255,0.35)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  {data.humanReviewsIn < data.humanReviewsTotal && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACCENT }} />
                  )}
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: ACCENT }} />
                </span>
                <span className={`${mono.className} text-[12px] tracking-wide`} style={{ color: ACCENT }}>
                  {data.humanReviewsIn < data.humanReviewsTotal ? "the room · live" : "the room"}
                </span>
              </div>
              <div className={`${mono.className} text-[12px] text-white/55`}>
                <span className="text-white font-bold">{data.humanReviewsIn}</span> / {data.humanReviewsTotal} listeners in
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              real listeners are reviewing your track
            </h2>
            <p className={`${mono.className} text-[13px] text-white/55 mb-6 normal-case`}>
              {data.humanReviewsIn < data.humanReviewsTotal
                ? "reactions land here live as each listener finishes."
                : "the whole room has weighed in."}
              {locked && " headlines + ratings are free — unlock to read the rest."}
            </p>

            <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
              {data.humanReviews.map((r, i) => (
                <div key={i} className="bg-[#0a0a0a] p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`${mono.className} inline-flex items-center gap-1 text-[10px] font-bold text-black px-1.5 py-0.5`}
                      style={{ background: r.positive ? ACCENT : "#b8a4ff" }}
                    >
                      <User className="h-2.5 w-2.5" /> real listener
                    </span>
                    <Meter count={r.rating} />
                  </div>
                  <p className="text-[15px] font-bold text-white leading-snug">“{r.headline}”</p>
                  <Sealed locked={locked} label="unlock">
                    <p className="text-[14px] text-white/70 leading-relaxed normal-case">{r.quote}</p>
                  </Sealed>
                </div>
              ))}
              {/* pending seats — animated "listening now" */}
              {Array.from({
                length: Math.max(0, data.humanReviewsTotal - data.humanReviews.length),
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

        {/* ── THE MEASURED WAVEFORM — locked reports get 1 open moment marker,
            the rest blur their note (timestamps visible); unlocked opens all ── */}
        {data.waveform && (
          <section id="listen" className={sectionCard}>
            <Kicker>{secNum("listen")}the read · measured from your audio</Kicker>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              we listened to it.
            </h2>
            <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
              {locked && waveMoments.length > 0
                ? "Your track's real frequency-split waveform, with moment markers from the read. One is unlocked — the rest open with the full read."
                : "Your track's real frequency-split waveform — bass body, mids, highs — straight from the analysis the read is grounded in."}
            </p>
            <ReportWaveform data={data.waveform} moments={waveMoments} sealed={locked} />

            {/* the energy / attention arc, from the same measured envelope as
                the markers above — where the track builds and where it dips */}
            <div className="mt-9">
              <RetentionCurve data={data.waveform} moments={waveMoments} />
            </div>
          </section>
        )}

        {/* ── BREAKDOWN ── */}
        <section id="breakdown" className={sectionCard}>
          <Kicker>{secNum("breakdown")}the breakdown</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-7">
            how it scored, dimension by dimension
          </h2>
          <div className="grid md:grid-cols-[280px_1fr] gap-8 lg:gap-10 items-center mb-2">
            <div className="mx-auto w-full max-w-[320px] order-first md:order-none">
              <ScoreRadar categories={data.categories} />
              <p className={`${mono.className} text-[11px] text-white/40 text-center mt-1 normal-case`}>
                the shape of the read — further out is stronger
              </p>
            </div>
            <div className="space-y-7">
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
                {cat.note && (
                  <div className="mt-2.5">
                    <Sealed locked={locked} label="unlock the breakdown">
                      <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                        {cat.note}
                      </p>
                    </Sealed>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
          {locked && (
            <p className={`${mono.className} text-[12px] text-white/45 mt-4 normal-case`}>
              scores are free — unlock to read why each dimension landed where it did.
            </p>
          )}
        </section>

        {/* ── SYNTHESIS ── */}
        <section id="read" className={sectionCard}>
          <Kicker>{secNum("read")}the honest read</Kicker>
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

        {/* ── ANGLES — AI lenses on the one read (NOT people; the real
            listeners are the paid human room below) ── */}
        <section id="angles" className={sectionCard}>
          <Kicker>{secNum("angles")}from a few angles</Kicker>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            the read, broken into six angles
          </h2>
          <p className={`${mono.className} text-[13px] text-white/55 mb-7 normal-case`}>
            one AI read, weighed six ways — each lens looks for a different thing
            (hook, mix, playlist fit). these are angles on the analysis, not six listeners.
            {locked && " findings are free — unlock the detail."}
          </p>

          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {data.reactions.map((r, i) => {
              const lens = r.lens || LENSES[i % LENSES.length];
              return (
                <div key={i} className="bg-[#0a0a0a] p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`${mono.className} text-[12px] font-bold uppercase tracking-wide`}
                      style={{ color: r.positive ? ACCENT : "#b8a4ff" }}
                    >
                      {lens}
                    </p>
                    <span
                      className={`${mono.className} inline-flex items-center gap-1.5 text-[10px] text-white/40 whitespace-nowrap`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: r.positive ? ACCENT : "#b8a4ff" }}
                      />
                      {r.positive ? "strength" : "watch-out"}
                    </span>
                  </div>

                  <p className="text-[15px] font-bold text-white leading-snug">
                    {r.headline}
                  </p>

                  <Sealed locked={locked} label="unlock the detail">
                    <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                      {r.quote}
                    </p>
                  </Sealed>

                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                      {r.tags.map((t, j) => (
                        <span
                          key={j}
                          className={`${mono.className} text-[10px] text-white/55 border border-white/15 px-1.5 py-0.5 normal-case`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FIXES ── */}
        <section id="fixes" className={sectionCard}>
          <Kicker>{secNum("fixes")}if you change three things</Kicker>
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

        {/* ── SEND TO THE ROOM / SHARE — in the open-read model the read is
            already free in full; the purchase is the human room + deep read ── */}
        {!data.unlocked ? (
          <section
            id="unlock"
            className="scroll-mt-20 border-2 bg-[#0c0c0c] p-7 sm:p-10"
            style={{ borderColor: "rgba(110,231,255,0.45)" }}
          >
            {finalizing && (
              <div
                className="mb-7 flex items-center justify-center gap-3 border p-4 text-center"
                style={{ borderColor: "rgba(110,231,255,0.4)", background: "rgba(110,231,255,0.06)" }}
              >
                <Hourglass className="h-4 w-4 animate-pulse" style={{ color: ACCENT }} />
                <p className="text-[14px] normal-case" style={{ color: ACCENT }}>
                  payment received — finalizing your unlock…
                </p>
              </div>
            )}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-12 h-12 mb-5"
                style={{ background: ACCENT }}
              >
                <User className="h-5 w-5 text-black" />
              </div>
              <Kicker>the room — the one thing the machine can&apos;t do</Kicker>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                you&apos;ve read the machine.{" "}
                <span style={{ color: ACCENT }}>now hear the humans.</span>
              </h2>
              <p className="text-white/70 text-[15px] max-w-md mx-auto normal-case leading-relaxed">
                Everything above was your free read. The room is{" "}
                <strong className="text-white">5 real people</strong> — they listen end to end
                and write back honestly, plus your mix gets the deeper stem-level read. You watch
                every reaction land on this page.
              </p>
            </div>

            {/* proof: one real reaction + the 5 empty seats */}
            <div className="max-w-md mx-auto mb-9">
              <p className={`${mono.className} text-[11px] text-white/45 mb-2.5 normal-case text-center`}>
                here&apos;s what one seat delivers, from another artist&apos;s room:
              </p>
              <div className="relative bg-[#0a0a0a] border border-white/12 p-5 flex flex-col gap-3">
                <span
                  className={`${mono.className} absolute -top-2 right-4 text-[10px] font-bold text-black px-2 py-0.5`}
                  style={{ background: "#b8a4ff" }}
                >
                  sample
                </span>
                <div className="flex items-center justify-between">
                  <span
                    className={`${mono.className} inline-flex items-center gap-1 text-[10px] font-bold text-black px-1.5 py-0.5`}
                    style={{ background: ACCENT }}
                  >
                    <User className="h-2.5 w-2.5" /> real listener
                  </span>
                  <Meter count={4} />
                </div>
                <p className="text-[15px] font-bold text-white leading-snug">
                  “Hook stuck with me after one listen”
                </p>
                <p className="text-[14px] text-white/70 leading-relaxed normal-case">
                  Played it twice back to back. The drop has real bounce and the hook is sticky.
                  Middle sagged a touch for me but honestly its close to done.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`${mono.className} w-9 h-9 flex items-center justify-center text-[14px] border border-dashed`}
                    style={{ borderColor: "rgba(110,231,255,0.4)", color: "rgba(255,255,255,0.35)" }}
                  >
                    ?
                  </span>
                ))}
                <span className={`${mono.className} text-[12px] text-white/45 ml-2 normal-case`}>
                  your 5 seats, ready &amp; waiting
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* this track */}
              <div className="border border-white/15 bg-[#0a0a0a] p-6 flex flex-col">
                <p className={`${mono.className} text-[13px] text-white/60`}>this track</p>
                <p className="text-4xl font-extrabold mt-2">
                  $6.95<span className="text-base text-white/45 font-medium"> once</span>
                </p>
                <p className={`${mono.className} text-[12px] text-white/55 mt-1 normal-case`}>
                  5 real people review this track + the deep stem read — yours forever
                </p>
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="group mt-auto pt-6 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[15px] py-3.5 transition-colors disabled:opacity-60"
                >
                  {unlocking ? "opening…" : "send it to the room"}
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
                  full reads on every track you make · the room on 3 a month
                </p>
                <button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={subscribing !== null}
                  className="group mt-auto pt-6 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-wait"
                >
                  {subscribing === "monthly" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> opening checkout…</>
                  ) : (
                    <>go unlimited <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </button>
                <button
                  onClick={() => handleSubscribe("annual")}
                  disabled={subscribing !== null}
                  className={`${mono.className} mt-2 text-[12px] text-white/55 hover:text-white transition-colors disabled:opacity-70 disabled:cursor-wait`}
                >
                  {subscribing === "annual" ? "opening checkout…" : "or $143.40/yr (save 40%)"}
                </button>
              </div>
            </div>
            <p className={`${mono.className} text-[12px] text-white/50 mt-6 text-center normal-case`}>
              want to see what the room delivers?{" "}
              <Link href="/report/demo" className="font-bold hover:brightness-110 transition" style={{ color: ACCENT }}>
                view a sample with all 5 seats in →
              </Link>
            </p>
            <p className={`${mono.className} text-[12px] text-white/40 mt-2 text-center normal-case`}>
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
              <Link href="/">
                <button className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-sm px-5 py-3 hover:bg-white transition-colors">
                  play another track
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ── sticky buy bar (open-read, room not bought) — one persistent,
          unmissable path to the purchase; hides while #unlock is on screen ── */}
      {openRead && !data.unlocked && !buyBarHidden && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/15 bg-[#0a0a0a]/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <p className={`${mono.className} text-[12px] text-white/55 normal-case hidden sm:block`}>
              this read was free · the room of <span className="text-white font-bold">5 real people</span> is the upgrade
            </p>
            <a
              href="#unlock"
              className="group flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[14px] px-5 py-2.5 hover:bg-white transition-colors"
            >
              send it to the room · $6.95
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      )}

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

const PENDING_STEPS = [
  "fetching your track",
  "mapping the energy curve",
  "checking the hook + structure",
  "weighing it across 5 dimensions",
  "scoring against released music",
  "writing your instant read",
];

function PendingState({
  slug,
  trackTitle,
  artworkUrl,
  genre,
  scoreGuess,
}: {
  slug: string;
  trackTitle: string;
  artworkUrl: string | null;
  genre?: string | null;
  scoreGuess?: number | null;
}) {
  const [stalled, setStalled] = useState(false);
  const [title, setTitle] = useState(trackTitle);
  const [artwork, setArtwork] = useState<string | null>(artworkUrl);
  const [analyzed, setAnalyzed] = useState(false);
  const [step, setStep] = useState(0);

  // Genre picker — the landing flow collects no genre (everything lands as
  // "Other"), and generation re-reads genre right before writing the prompt,
  // so a tap during the DSP wait still shapes the read (genre norms,
  // repetition tolerance, the listen pass). Hidden once the read consumed it.
  const [pickedGenre, setPickedGenre] = useState<string | null>(null);
  const [genreLocked, setGenreLocked] = useState(false);
  const showGenrePicker =
    !genreLocked && (!genre || genre === "Other" || genre === "—");
  const pickGenre = (g: string) => {
    setPickedGenre(g);
    void fetch(`/api/score/${slug}/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre: g }),
    })
      .then((r) => {
        if (r.status === 409) setGenreLocked(true);
      })
      .catch(() => {});
  };

  // Score predictor — call the number before the read lands. One shot, stored
  // server-side only while score is null (you can't "predict" a score you've
  // seen). Revealed after a beat so the screen unfolds instead of dumping
  // every widget at once; the reveal on the report compares guess vs read.
  const [guess, setGuess] = useState(75);
  const [guessLocked, setGuessLocked] = useState(scoreGuess != null);
  const [showPredictor, setShowPredictor] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowPredictor(true), 6000);
    return () => clearTimeout(t);
  }, []);
  const lockGuess = () => {
    setGuessLocked(true);
    void fetch(`/api/score/${slug}/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoreGuess: guess }),
    }).catch(() => {});
  };

  // Cosmetic ticker clamped by REAL progress: it sits on "checking the hook"
  // until the DSP has actually finished listening (the slow part — can be a
  // minute or two), then walks to "writing your instant read" and holds until
  // the read lands.
  useEffect(() => {
    const cap = analyzed ? PENDING_STEPS.length - 1 : 2;
    if (step >= cap) return;
    const t = setTimeout(
      () => setStep((s) => Math.min(s + 1, cap)),
      1800 + Math.random() * 1200
    );
    return () => clearTimeout(t);
  }, [step, analyzed]);

  // Progress poll: title/artwork land within seconds (oEmbed staged write), the
  // analyzed marker when the DSP finishes, then ready → reload into the full
  // report. Self-heal: if no generation is running (the background kick was
  // killed or never landed), re-kick via /generate — fire-and-forget, with a
  // startup grace so we never race the kick that /start or /submit scheduled.
  useEffect(() => {
    let cancelled = false;
    let lastKick = 0;
    const startedPolling = Date.now();
    const MAX_POLL_MS = 6 * 60 * 1000;

    const tick = async () => {
      try {
        const res = await fetch(`/api/score/${slug}/status`);
        const s = (await res.json().catch(() => null)) as {
          ready?: boolean;
          running?: boolean;
          analyzed?: boolean;
          trackTitle?: string | null;
          artworkUrl?: string | null;
        } | null;
        if (cancelled) return;
        if (s?.ready) {
          window.location.reload();
          return;
        }
        if (s) {
          if (s.trackTitle) setTitle(s.trackTitle);
          if (s.artworkUrl) setArtwork(s.artworkUrl);
          if (s.analyzed) setAnalyzed(true);
          const sinceStart = Date.now() - startedPolling;
          if (!s.running && sinceStart > 8000 && Date.now() - lastKick > 60_000) {
            lastKick = Date.now();
            void fetch(`/api/score/${slug}/generate`, { method: "POST" }).catch(
              () => {}
            );
          }
        }
      } catch {
        /* transient — keep polling */
      }
      if (cancelled) return;
      if (Date.now() - startedPolling > MAX_POLL_MS) {
        setStalled(true);
        return;
      }
      setTimeout(tick, 3000);
    };

    const t = setTimeout(tick, 1200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] flex items-center justify-center px-5 lowercase`}
    >
      <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/15 p-7">
        <div className="flex items-center justify-between mb-5">
          <p className={`${mono.className} text-[13px] text-white/40`}>
            [ analyzing your track… ]
          </p>
          <Elapsed className={`${mono.className} text-[12px] text-white/35`} />
        </div>

        {/* track card — artwork + title fill in as the metadata lands */}
        <div className="flex items-center gap-4 bg-[#141414] border border-white/15 p-3.5 mb-5">
          <div className="relative w-14 h-14 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
            {artwork ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artwork} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
                <EqBars className="absolute bottom-1 left-1.5 h-3.5" />
              </>
            ) : (
              <EqBars className="h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold text-white truncate normal-case">
              {title}
            </p>
            <p className={`${mono.className} text-[12px] text-white/55 mt-0.5`}>
              {analyzed ? "writing your read…" : "listening through the full track…"}
            </p>
          </div>
        </div>

        {/* one-tap genre while they wait — shapes the read that's being written */}
        {showGenrePicker && (
          <div className="mb-5">
            <p className={`${mono.className} text-[12px] text-white/45 mb-2 normal-case`}>
              {pickedGenre
                ? "noted — the read will judge it by that genre's standards."
                : "what genre is this? one tap sharpens the read —"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SCORE_GENRES.filter((g) => g !== "Other").map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => pickGenre(g)}
                  className={`${mono.className} text-[11.5px] px-2.5 py-1 border transition-colors ${
                    pickedGenre === g
                      ? "bg-[#6ee7ff] text-black border-[#6ee7ff] font-bold"
                      : "border-white/15 text-white/55 hover:border-[#6ee7ff] hover:text-white"
                  }`}
                >
                  {g.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* the score predictor — call it before the read does */}
        {showPredictor && (
          <div
            className="mb-5 border border-white/12 bg-[#101010] p-4"
            style={{ animation: "fade-in 400ms ease-out" }}
          >
            {guessLocked ? (
              <p className={`${mono.className} text-[12px] text-white/55 normal-case`}>
                <span style={{ color: ACCENT }}>✓ locked in: {scoreGuess ?? guess}.</span>{" "}
                we&apos;ll see what the read says.
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between mb-2.5">
                  <p className={`${mono.className} text-[12px] text-white/55 normal-case`}>
                    call it — what does your gut say this scores?
                  </p>
                  <span className={`${mono.className} text-[20px] font-bold`} style={{ color: ACCENT }}>
                    {guess}
                    <span className="text-[11px] text-white/30 font-normal"> /100</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={guess}
                    onChange={(e) => setGuess(Number(e.target.value))}
                    className="flex-1 h-1.5 cursor-pointer"
                    style={{ accentColor: ACCENT }}
                    aria-label="your score prediction"
                  />
                  <button
                    type="button"
                    onClick={lockGuess}
                    className={`${mono.className} shrink-0 text-[12px] font-bold text-black px-3 py-1.5 hover:brightness-110 transition`}
                    style={{ background: ACCENT }}
                  >
                    lock it in
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* always-moving progress — creeps through the listen, jumps when the
            DSP hands off to the read */}
        <div className="mb-5">
          <CreepingBar target={analyzed ? 94 : 76} monoClass={mono.className} />
        </div>

        {/* live progress log — advances with the actual pipeline */}
        <div
          className={`${mono.className} bg-[#080808] border border-white/12 p-5 text-[13.5px] leading-7`}
        >
          {PENDING_STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <div
                key={s}
                className={
                  state === "pending"
                    ? "text-white/20"
                    : state === "active"
                    ? "text-white"
                    : "text-white/55"
                }
              >
                <span
                  className={state === "done" ? "inline-block animate-[fade-in_300ms_ease-out]" : undefined}
                  style={{ color: state === "pending" ? undefined : ACCENT }}
                >
                  {state === "done" ? "✓" : state === "active" ? "▸" : "·"}
                </span>{" "}
                {s}
                {state === "active" && (
                  <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#6ee7ff] animate-pulse" />
                )}
                {state === "active" && (
                  <div className="text-white/35 text-[12px] pl-5 leading-5 pb-1">
                    <RotatingLine lines={analyzed ? WRITE_FLAVOR : LISTEN_FLAVOR} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className={`${mono.className} text-[12px] text-white/45 mt-5 normal-case`}>
          {stalled
            ? "this is taking longer than usual — give it a moment and refresh."
            : "your score lands here the moment it's done. no need to refresh."}
        </p>
        {stalled && (
          <Link href={`/report/${slug}`}>
            <button className="mt-4 inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-sm px-6 py-3">
              refresh
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
