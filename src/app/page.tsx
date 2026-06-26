"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/components/providers";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ScoreRing } from "@/components/score/score-ring";
import { RealReviews } from "@/components/landing/real-reviews";
import { RoomShowcase } from "@/components/landing/room-showcase";
import { posts } from "@/lib/blog-posts";
import { isSupportedTrackUrl, normalizeTrackUrl, SUPPORTED_TRACK_HINT, unsupportedReason } from "@/lib/track-url";
import { CreepingBar, EqBars, Elapsed } from "@/components/score/analyzing-bits";
import { scoreConversions } from "@/lib/score-conversions";
import { SealedPaywall } from "@/components/score/sealed-paywall";
import { FREE_FULL_READ } from "@/lib/score-free-tier";
import { ArrowRight, ArrowDown, Music, Loader2, X, Zap, Users, Headphones, Play, Upload } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

// ── Real brand marks (official paths, monochrome) ───────────────────

const SC_PATH = "M1 14.5c.28 0 .5-.9.5-2s-.22-2-.5-2-.5.9-.5 2 .22 2 .5 2zm2 1c.28 0 .5-1.34.5-3s-.22-3-.5-3-.5 1.34-.5 3 .22 3 .5 3zm2 .5c.28 0 .5-1.79.5-4s-.22-4-.5-4-.5 1.79-.5 4 .22 4 .5 4zm2 0c.28 0 .5-2.01.5-4.5S7.78 7 7.5 7s-.5 2.01-.5 4.5.22 4.5.5 4.5zm2 0c.28 0 .5-2.24.5-5s-.22-5-.5-5-.5 2.24-.5 5 .22 5 .5 5zm12.5 0a3.5 3.5 0 0 0 0-7c-.34 0-.67.05-.98.14A5.5 5.5 0 0 0 11 7.5c0 .3.03.6.08.88-.18-.08-.38-.13-.58-.13-.28 0-.5 2.24-.5 5s.22 4.27.5 4.27h11z";
const YT_PATH = "M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12c.34-1.9.5-3.84.5-5.8 0-1.96-.16-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z";
const BC_PATH = "M0 18.75l7.437-13.5H24l-7.437 13.5H0z";

// "Trusted by / releasing on" strip — every platform artists release to (aspirational).
const BRANDS: { name: string; path: string; color: string }[] = [
  { name: "spotify", color: "#1DB954", path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" },
  { name: "apple music", color: "#FA243C", path: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" },
  { name: "soundcloud", color: "#FF5500", path: SC_PATH },
  { name: "youtube", color: "#FF0000", path: YT_PATH },
  { name: "bandcamp", color: "#1DA0C3", path: BC_PATH },
];

// Sources we can actually pull + analyze — shown under the paste bar.
const SUPPORTED: { name: string; path: string; color: string }[] = [
  { name: "soundcloud", path: SC_PATH, color: "#FF5500" },
  { name: "youtube", path: YT_PATH, color: "#FF0000" },
  { name: "bandcamp", path: BC_PATH, color: "#1DA0C3" },
];

// ── Instant AI read sequence (the room of real listeners comes after unlock) ──

const STEPS = [
  "fetching your track",
  "mapping the energy curve",
  "checking the hook + structure",
  "measuring it against released tracks",
  "weighing it across 5 dimensions",
  "calling the release verdict",
  "almost there…",
];

const CHECKS: { t: string; d: string }[] = [
  { t: "hook strength", d: "does it grab in the first 15 seconds?" },
  { t: "listener retention", d: "where attention holds, and where it drifts." },
  { t: "production quality", d: "muddy low end, harsh highs, buried vocal." },
  { t: "emotional impact", d: "does it actually make people feel something?" },
  { t: "structure & pacing", d: "intro length, drop timing, energy arc." },
  { t: "release readiness", d: "ready to put out, or one fix away?" },
];

// ── Real sample (mirrors /report/demo) ──────────────────────────────

const SAMPLE = {
  title: "Midnight Drive",
  genre: "electronic",
  score: 82,
  bars: [
    { label: "hook strength", v: 4.2 },
    { label: "production", v: 3.8 },
    { label: "retention", v: 3.4 },
    { label: "emotional impact", v: 4.0 },
    { label: "commercial pull", v: 3.6 },
  ],
  reactions: [
    { lens: "the producer", rating: 5, headline: "felt release-ready to me" },
    { lens: "a casual listener", rating: 4, headline: "hook caught me straight away" },
    { lens: "the mix lens", rating: 3, headline: "low end is a touch polite" },
  ],
  fixes: [
    "get to the hook 8–12 seconds sooner",
    "add a small change in the mid-section",
    "give the outro a softer landing",
  ],
};

// Reactions that cycle through the hero preview's "just landed" chip — real
// listener names, so it reads like the room is reacting live.
const HERO_REACTIONS: { name: string; lens: string; rating: number; headline: string }[] = [
  { name: "nova reyes", lens: "producer", rating: 5, headline: "felt release-ready to me" },
  { name: "jules okafor", lens: "casual listener", rating: 4, headline: "hook caught me straight away" },
  { name: "mara linde", lens: "mix engineer", rating: 3, headline: "low end's a touch polite" },
  { name: "theo brandt", lens: "fellow artist", rating: 5, headline: "this would slap live" },
  { name: "kavi anand", lens: "first-time listener", rating: 4, headline: "kept me till the very end" },
  { name: "sienna cole", lens: "producer", rating: 4, headline: "tighten the intro and it's there" },
];

// ── Recently read by the room (real artwork) ────────────────────────

// Kept wide on purpose: each rendered copy must be wider than the viewport or
// the seamless -50% marquee shows an empty gap before the loop catches up.
const RECENT: { src: string; score: number }[] = [
  { src: "/activity-artwork/1.jpg", score: 82 },
  { src: "/activity-artwork/7.jpg", score: 74 },
  { src: "/activity-artwork/12.jpg", score: 91 },
  { src: "/activity-artwork/18.jpg", score: 68 },
  { src: "/activity-artwork/4.jpg", score: 79 },
  { src: "/activity-artwork/22.jpg", score: 88 },
  { src: "/activity-artwork/27.jpg", score: 71 },
  { src: "/activity-artwork/31.jpg", score: 85 },
  { src: "/activity-artwork/9.jpg", score: 64 },
  { src: "/activity-artwork/20.jpg", score: 90 },
  { src: "/activity-artwork/25.jpg", score: 77 },
  { src: "/activity-artwork/3.jpg", score: 83 },
  { src: "/activity-artwork/15.jpg", score: 76 },
  { src: "/activity-artwork/28.jpg", score: 87 },
  { src: "/activity-artwork/6.jpg", score: 70 },
  { src: "/activity-artwork/33.jpg", score: 92 },
  { src: "/activity-artwork/11.jpg", score: 66 },
  { src: "/activity-artwork/24.jpg", score: 81 },
  { src: "/activity-artwork/2.jpg", score: 78 },
  { src: "/activity-artwork/19.jpg", score: 84 },
  { src: "/activity-artwork/30.jpg", score: 73 },
  { src: "/activity-artwork/8.jpg", score: 89 },
  { src: "/activity-artwork/16.jpg", score: 69 },
  { src: "/activity-artwork/34.jpg", score: 86 },
];

type Phase = "idle" | "running" | "done";
type Meta = { title: string; artist: string | null; artworkUrl: string | null };

// ── small pieces ────────────────────────────────────────────────────

function Dots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1 shrink-0" aria-label={`${count} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="w-2 h-2"
          style={{ background: i < count ? ACCENT : "rgba(255,255,255,0.14)" }}
        />
      ))}
    </div>
  );
}

/** A real, miniature report — the actual product, shown not described. */
function ReportPreview() {
  const [ri, setRi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRi((n) => (n + 1) % HERO_REACTIONS.length), 2600);
    return () => clearInterval(t);
  }, []);
  const r = HERO_REACTIONS[ri];

  return (
    <div className="relative" style={{ animation: "previewIn .6s cubic-bezier(.2,.7,.2,1) both" }}>
      <style>{`
        @keyframes previewIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes eqBar{0%,100%{transform:scaleY(.32)}50%{transform:scaleY(1)}}
        @keyframes growBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes sheen{0%{transform:translateX(-130%)}55%,100%{transform:translateX(260%)}}
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes ringGlow{0%,100%{opacity:.45}50%{opacity:.9}}
        @keyframes chipSwap{0%{opacity:0;transform:translateY(12px) rotate(-3deg)}14%{opacity:1;transform:translateY(0) rotate(-3deg)}82%{opacity:1;transform:translateY(0) rotate(-3deg)}100%{opacity:0;transform:translateY(-10px) rotate(-3deg)}}
      `}</style>

      {/* depth: ghost card behind */}
      <div className="absolute inset-0 translate-x-3 translate-y-4 border border-white/5 bg-[#0b0b0b] -z-10" />

      <div className="relative border border-white/12 bg-[#0e0e0e] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* animated cyan accent bar + sheen across the top */}
        <div className="relative h-1 w-full overflow-hidden" style={{ background: `linear-gradient(90deg, ${ACCENT}, #a78bfa, ${ACCENT})` }}>
          <div className="absolute inset-y-0 w-1/3 bg-white/60 blur-[2px]" style={{ animation: "sheen 3.2s ease-in-out infinite" }} />
        </div>

        {/* track header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          {/* live equalizer instead of a static icon */}
          <div className="w-11 h-11 shrink-0 flex items-end justify-center gap-[3px] bg-white/5 border border-white/10 p-2.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[3px] flex-1 origin-bottom"
                style={{ background: ACCENT, animation: `eqBar ${0.7 + i * 0.18}s ease-in-out ${i * 0.12}s infinite` }}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold truncate">{SAMPLE.title}</p>
            <p className={`${mono.className} text-[11px] text-white/40 normal-case mt-0.5`}>
              {SAMPLE.genre} · ai + the room
            </p>
          </div>
          <span
            className={`${mono.className} text-[11px] text-black px-2.5 py-1 shrink-0`}
            style={{ background: ACCENT }}
          >
            almost there
          </span>
        </div>

        {/* the verdict — the headline; the score sits beside it as evidence */}
        <div className="relative flex items-center justify-center gap-6 px-6 pt-7 pb-6 border-b border-white/10">
          <div
            className="absolute left-1/2 top-1/2 w-44 h-44 -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl pointer-events-none"
            style={{ background: ACCENT, opacity: 0.5, animation: "ringGlow 3s ease-in-out infinite" }}
          />
          <div className="relative text-left">
            <p className={`${mono.className} text-[11px] text-white/40 mb-1.5`}>the verdict</p>
            <p className="text-3xl font-extrabold leading-none tracking-tight" style={{ color: ACCENT }}>
              almost there
            </p>
            <p className={`${mono.className} text-[11px] text-white/45 normal-case mt-2`}>
              one fix from release ready
            </p>
          </div>
          <div className="relative shrink-0">
            <ScoreRing score={SAMPLE.score} size="sm" dark animate />
          </div>
        </div>

        {/* breakdown — bars grow in with a stagger */}
        <div className="px-6 py-5 space-y-3">
          {SAMPLE.bars.map((b, i) => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12.5px] text-white/70">{b.label}</span>
                <span className={`${mono.className} text-[12px] font-bold`}>
                  {b.v.toFixed(1)}
                  <span className="text-white/30"> / 5</span>
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full origin-left"
                  style={{
                    width: `${(b.v / 5) * 100}%`,
                    background: `linear-gradient(90deg, ${ACCENT}, #a78bfa)`,
                    animation: `growBar .9s cubic-bezier(.2,.7,.2,1) ${0.3 + i * 0.12}s both`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* floating reaction chip — cycles through real listeners as they "land" */}
      <div
        key={ri}
        className="absolute -bottom-5 left-4 right-8 bg-[#141414] border p-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]"
        style={{ borderColor: ACCENT, animation: "chipSwap 2.6s ease-in-out both" }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: ACCENT, animation: "livePulse 1.4s ease-in-out infinite" }} />
          </span>
          <span className={`${mono.className} text-[10px] text-white/55 uppercase tracking-wider truncate`}>
            {r.name} · {r.lens}
          </span>
          <span className="ml-auto shrink-0"><Dots count={r.rating} /></span>
        </div>
        <p className="text-[13px] font-bold leading-snug">“{r.headline}”</p>
      </div>
    </div>
  );
}

/** Step 1 — a track loaded into the paste box (real app chrome). */
function PasteMock() {
  return (
    <div className="flex items-center gap-3 bg-[#141414] border border-white/15 p-3">
      <div className="w-11 h-11 bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
        <Music className="h-4 w-4 text-white/40" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-white truncate normal-case">midnight drive.wav</p>
        <p className={`${mono.className} text-[11px] text-white/45 normal-case mt-0.5`}>soundcloud.com</p>
      </div>
      <span className={`${mono.className} text-[11px] shrink-0`} style={{ color: ACCENT }}>✓ ready</span>
    </div>
  );
}

/** Step 2 — the analysis terminal, finished (real app log). */
function LogMock() {
  const lines = ["fetching track", "energy curve", "hook + structure", "vs released tracks", "the verdict"];
  return (
    <div className={`${mono.className} bg-[#080808] border border-white/12 p-4 text-[11.5px] leading-6`}>
      {lines.map((s) => (
        <div key={s} className="text-white/55 truncate">
          <span style={{ color: ACCENT }}>✓</span> {s}
        </div>
      ))}
    </div>
  );
}

/** Step 3 — the real room of listeners weighing in. */
function RoomMock() {
  return (
    <div className="flex flex-col justify-center gap-3 py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {["S", "M", "A"].map((c) => (
          <span
            key={c}
            className={`${mono.className} w-8 h-8 flex items-center justify-center text-[12px] font-bold text-black`}
            style={{ background: ACCENT }}
          >
            {c}
          </span>
        ))}
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`${mono.className} w-8 h-8 flex items-center justify-center text-[10px] text-white/30 border border-white/15`}
          >
            ···
          </span>
        ))}
      </div>
      <p className={`${mono.className} text-[11px] text-white/45 normal-case`}>3 of 5 real listeners in</p>
    </div>
  );
}

/** Step 4 — the result (real score ring + verdict). */
function VerdictMock() {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <ScoreRing score={SAMPLE.score} size="sm" dark animate />
      <span
        className={`${mono.className} inline-block mt-3 text-[11px] text-black px-2.5 py-1`}
        style={{ background: ACCENT }}
      >
        almost there
      </span>
    </div>
  );
}

// Read an uploaded file's duration in the browser (null if it can't be decoded).
function audioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const el = document.createElement("audio");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        const d = el.duration;
        URL.revokeObjectURL(el.src);
        resolve(Number.isFinite(d) ? d : null);
      };
      el.onerror = () => { URL.revokeObjectURL(el.src); resolve(null); };
      el.src = URL.createObjectURL(file);
    } catch {
      resolve(null);
    }
  });
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the release verdict work?",
    a: "Paste a link or upload your track and the AI listens to the whole thing, then calls it on a four-state ladder — release ready, almost there, needs work or not ready — measured against what actually gets released in your genre. You also get a score out of 100 as supporting evidence, a written read across five dimensions, and the three fixes that close the gap.",
  },
  {
    q: "Who are the five listeners in the room?",
    a: FREE_FULL_READ
      ? "Real, paid listeners — not bots and not playlist curators. The room joins when you unlock a track ($6.95) or subscribe: five people hear your track end to end and you watch each honest reaction land live on your report."
      : "Real, paid listeners — not bots and not playlist curators. Each track is heard by a room of five people who react honestly to what they hear. You see every reaction headline for free; the full reactions are part of the unlocked report.",
  },
  {
    q: "Is MixReflect actually free?",
    a: FREE_FULL_READ
      ? "Your first track is — the complete report, free: the release verdict, score out of 100, the full written read, all three fixes and the measured waveform, no card needed. After that, each track's report opens for a one-time $6.95 (which also sends it to the room of five real listeners), or $19.95/month for unlimited."
      : "Yes. Submitting a track is free and gets you the release verdict, your score out of 100, the five-dimension breakdown, every reaction headline and your three fixes — no card needed. Unlocking the complete report for one track is a one-time $6.95, or $19.95/month for unlimited auto-unlocks.",
  },
  {
    q: "What can I submit?",
    a: "A SoundCloud, YouTube or direct link to your track, or just drag in an MP3 or WAV. Unreleased demos, rough mixes and finished masters are all fine — most people use it before they release.",
  },
  {
    q: "How is this different from SubmitHub or Groover?",
    a: "Those platforms pitch your music to playlists and curators. MixReflect tells you whether the track is ready to release in the first place — a measured verdict and real listener reactions before you spend a cent promoting it.",
  },
  {
    q: "Do I keep my reports?",
    a: "Yes. Every report stays on your dashboard, and anything you unlock is yours forever — even if you cancel a subscription.",
  },
];

const FOOTER_GENRES: { slug: string; label: string }[] = [
  { slug: "hip-hop", label: "hip-hop" },
  { slug: "trap", label: "trap" },
  { slug: "rnb", label: "r&b" },
  { slug: "pop", label: "pop" },
  { slug: "electronic", label: "electronic" },
  { slug: "house", label: "house" },
  { slug: "techno", label: "techno" },
  { slug: "edm", label: "edm" },
  { slug: "lo-fi", label: "lo-fi" },
  { slug: "rock", label: "rock" },
  { slug: "indie-pop", label: "indie pop" },
  { slug: "singer-songwriter", label: "singer-songwriter" },
];

const FOOTER_ALTERNATIVES: { slug: string; label: string }[] = [
  { slug: "submithub", label: "submithub" },
  { slug: "groover", label: "groover" },
  { slug: "playlist-push", label: "playlist push" },
  { slug: "landr", label: "landr" },
  { slug: "soundbetter", label: "soundbetter" },
  { slug: "musosoup", label: "musosoup" },
  { slug: "reverbnation", label: "reverbnation" },
];

export default function ScorePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { open: openAuth } = useAuthModal();

  const [trackUrl, setTrackUrl] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [subscribing, setSubscribing] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState("");
  // Free read already used: pause on the sealed-report upsell before the report.
  // Free read already used → the hard pay-to-continue wall. `track` = no row yet
  // (logged-in submit), `slug` = a pre-started row already exists.
  const [paywall, setPaywall] = useState<
    | { mode: "track"; url: string; title?: string }
    | { mode: "slug"; slug: string }
    | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Upload an mp3 (anonymous-friendly): presign → PUT → use the file URL.
  const handleFile = async (file: File) => {
    if (!file) return;
    if (!/\.(mp3)$/i.test(file.name) && !/audio\/(mpeg|mp3)/i.test(file.type)) {
      setError("please choose an mp3 file"); return;
    }
    if (file.size > 25 * 1024 * 1024) { setError("file too large (max 25mb)"); return; }
    // Guard against tiny / non-track clips (e.g. a 2-second sound effect).
    const dur = await audioDuration(file);
    if (dur != null && dur < 20) {
      setError(`that clip is only ${Math.round(dur)}s — upload the full track (20s+).`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const presignRes = await fetch("/api/uploads/track/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/mpeg", contentLength: file.size }),
      });
      if (!presignRes.ok) {
        const d = await presignRes.json().catch(() => null);
        setError(d?.error ?? "upload failed"); setUploading(false); return;
      }
      const { uploadUrl, fileUrl } = await presignRes.json();
      const up = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "audio/mpeg" } });
      if (!up.ok) { setError("upload failed. try again."); setUploading(false); return; }
      setUploadedName(file.name);
      setTrackUrl(fileUrl);
    } catch {
      setError("upload failed. try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── debounced track preview ──
  useEffect(() => {
    const u = trackUrl.trim();
    if (!/^https?:\/\//i.test(u) || !isSupportedTrackUrl(u)) {
      setMeta(null);
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMetaLoading(true);
    const t = setTimeout(async () => {
      // Start the read building NOW — the DSP + AI read run in the background
      // while the user is still looking at the form (and authing, if needed).
      void ensureStarted(u);
      try {
        const res = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: u }),
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.title) {
          setMeta({
            title: data.title,
            artist: data.artist ?? null,
            artworkUrl: data.artworkUrl ?? null,
          });
        } else {
          setMeta(null);
        }
      } catch {
        if (!cancelled) setMeta(null);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }, 550);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trackUrl]);

  // ── drive the assignment log ──
  // Paced to roughly match the real pipeline (~18s before the auth prompt):
  // the actual DSP + read takes 20–60s, and racing through in 5s set up a
  // "ready!" expectation that the report page then appeared to break.
  useEffect(() => {
    if (phase !== "running") return;
    if (step >= STEPS.length) {
      const t = setTimeout(() => setPhase("done"), 560);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 2000 + Math.random() * 1100);
    return () => clearTimeout(t);
  }, [phase, step]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [step, phase]);

  // ── reveal the sticky CTA once the hero scrolls out of view ──
  useEffect(() => {
    const onScroll = () => setScrolledPastHero(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── esc closes the modal ──
  useEffect(() => {
    if (phase === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const cancel = () => {
    setPhase("idle");
    setStep(0);
    setBusy(false);
  };

  // Start-on-paste: the moment a supported link is in the box, create the
  // report and kick the read off in the background (/api/score/start). By the
  // time the user clicks the CTA — and auths, if they're logged out — the read
  // is already building (often done). Keyed by the normalized URL: editing the
  // link fires a fresh start and the old report is left for the
  // abandoned-report GC to sweep.
  const startRef = useRef<{
    url: string;
    promise: Promise<{ slug?: string; claimToken?: string; sealed?: boolean } | null>;
  } | null>(null);
  const ensureStarted = (rawUrl: string) => {
    const url = normalizeTrackUrl(rawUrl);
    if (startRef.current?.url !== url) {
      startRef.current = {
        url,
        promise: fetch("/api/score/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackUrl: url }),
        })
          .then((r) => r.json().catch(() => null))
          .catch(() => null),
      };
    }
    return startRef.current.promise;
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackUrl.trim()) {
      setError("paste a link to your track first");
      return;
    }
    if (!isSupportedTrackUrl(trackUrl)) {
      setError(unsupportedReason(trackUrl) ?? `we can't read that link — ${SUPPORTED_TRACK_HINT}`);
      return;
    }
    setError("");
    // Logged in: there's no auth step to bridge, so skip the modal theater and
    // go straight to the report page — it shows the REAL analysis progress
    // (the modal's step list would just replay there a second time).
    if (session?.user) {
      void seeResults();
      return;
    }
    setStep(0);
    setPhase("running");
    // The paste handler usually fired this already — this is the fallback when
    // the user submits before the debounce got a chance.
    void ensureStarted(trackUrl);
  };

  // Where to land after auth. Preferred: claim the report we already started
  // (slug + claim token). Falls back to the legacy submit-on-return URL if the
  // start call didn't yield a slug.
  const buildFinish = () => {
    const title = meta?.title?.trim() || "";
    return (
      `/score/finish?u=${encodeURIComponent(normalizeTrackUrl(trackUrl))}` +
      (title ? `&t=${encodeURIComponent(title)}` : "")
    );
  };
  const finishUrl = async () => {
    const data = await ensureStarted(trackUrl);
    if (data?.slug && data.claimToken) {
      return `/score/finish?slug=${encodeURIComponent(data.slug)}&claim=${encodeURIComponent(data.claimToken)}`;
    }
    return buildFinish();
  };

  // Logged-out + the modal has reached "done": hand straight off to the real
  // report. There the verdict renders and the signup panel pops over the dimmed
  // page (?signup=1&claim=…) — that's the only account ask. No auth is ever
  // shown inside this modal. We poll briefly so the report opens with the
  // verdict already in; if it's still generating we route anyway and the
  // report's pending view takes over.
  useEffect(() => {
    if (phase !== "done" || session?.user) return;
    let cancelled = false;
    let tries = 0;
    const handoff = async () => {
      if (cancelled) return;
      const started = await ensureStarted(trackUrl);
      // Past their free read → the pay-to-continue wall, not the report.
      if (started?.sealed) {
        setPaywall({
          mode: "track",
          url: normalizeTrackUrl(trackUrl),
          title: meta?.title?.trim() || undefined,
        });
        return;
      }
      const slug = started?.slug;
      if (!slug) {
        // start call hasn't landed yet — wait for the slug, then hand off.
        if (tries++ < 8 && !cancelled) setTimeout(handoff, 2000);
        return;
      }
      const claim = started?.claimToken
        ? `&claim=${encodeURIComponent(started.claimToken)}`
        : "";
      const toReport = () =>
        window.location.assign(`/report/${slug}?signup=1${claim}`);
      try {
        const r = await fetch(`/api/score/${slug}/status`);
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        // Ready → open with the verdict in. Otherwise give it a few tries, then
        // route to the still-generating report rather than stranding the modal.
        if (d?.ready || tries++ >= 5) {
          toReport();
          return;
        }
      } catch {
        if (tries++ >= 5) {
          toReport();
          return;
        }
      }
      if (!cancelled) setTimeout(handoff, 2000);
    };
    void handoff();
    return () => {
      cancelled = true;
    };
  }, [phase, session]);

  const seeResults = async () => {
    if (busy) return;
    setBusy(true);
    if (!session?.user) {
      // In-context: pop the auth panel instead of bouncing to a full page —
      // success lands on /score/finish (claims the report) → the report.
      openAuth("signup", await finishUrl());
      setBusy(false);
      return;
    }
    try {
      // Finalize the report that started building at paste time (slug + claim
      // token attach it to this account); /submit falls back to a fresh create
      // if the start never landed. Fast either way — generation runs in the
      // background and the report page's pending view takes over.
      const started = await ensureStarted(trackUrl);
      // Hard wall: /start flagged this artist as past their free read — nothing
      // generated, go straight to pay-to-continue.
      if (started?.sealed) {
        setBusy(false);
        setPaywall({ mode: "track", url: normalizeTrackUrl(trackUrl), title: meta?.title?.trim() || undefined });
        return;
      }
      const res = await fetch("/api/score/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackUrl: normalizeTrackUrl(trackUrl),
          trackTitle: meta?.title?.trim() || undefined,
          slug: started?.slug,
          claimToken: started?.claimToken,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.sealed) {
        setBusy(false);
        setPaywall({ mode: "track", url: normalizeTrackUrl(trackUrl), title: meta?.title?.trim() || undefined });
        return;
      }
      if (data?.slug) {
        scoreConversions.submitTrack(data.slug);
        if (data.freeReadUsed) {
          // A pre-started row exists (generated before we knew the email) — wall
          // it by slug.
          setBusy(false);
          setPaywall({ mode: "slug", slug: data.slug });
          return;
        }
        router.push(`/report/${data.slug}`);
        return;
      }
      setError(data?.error ?? "something broke. try again.");
      setBusy(false);
    } catch {
      setError("something broke. try again.");
      setBusy(false);
    }
  };

  const handleSubscribe = async (plan: "monthly" | "annual" = "monthly") => {
    if (subscribing) return;
    if (!session?.user?.email) {
      openAuth("signup", "/#pricing");
      return;
    }
    setSubscribing(plan);
    try {
      const res = await fetch("/api/score/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/dashboard", plan }),
      });
      const data = await res.json().catch(() => null);
      if (data?.alreadySubscribed) {
        router.push("/dashboard");
        return;
      }
      if (data?.url) {
        scoreConversions.startSubscribeCheckout(plan);
        window.location.href = data.url;
        return;
      }
      setSubscribing(null);
    } catch {
      setSubscribing(null);
    }
  };

  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  const isSupported = isUrl && isSupportedTrackUrl(trackUrl);
  let host = "";
  try {
    host = new URL(trackUrl.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* not a url yet */
  }

  return (
    <div
      className={`${jakarta.className} min-h-screen overflow-x-clip bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase scroll-smooth`}
    >
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}@keyframes paidBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}`}</style>

      {paywall && (
        <SealedPaywall
          {...(paywall.mode === "slug"
            ? { slug: paywall.slug }
            : { track: { url: paywall.url, title: paywall.title }, trackTitle: paywall.title })}
          email={session?.user?.email ?? undefined}
          dismissHref="/"
        />
      )}

      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* quirky floating "get paid to listen" — top-level so its z-index is real
          (not trapped in a section's stacking context); scrolls to #earn. */}
      <a
        href="#earn"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("earn")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className={`flex fixed right-4 ${scrolledPastHero ? "bottom-[88px]" : "bottom-5"} sm:right-5 sm:bottom-6 z-[60] items-center gap-1.5 sm:gap-2 bg-[#6ee7ff] text-black font-extrabold text-[12px] sm:text-[14px] px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}
        style={{ animation: "paidBob 2.6s ease-in-out infinite" }}
      >
        <span aria-hidden className="text-sm sm:text-base">🎧</span>
        get paid to listen
        <span aria-hidden>↓</span>
      </a>

      {/* mobile sticky CTA — slides up once you scroll past the hero.
          Desktop keeps its persistent CTA in the sticky header above. */}
      <div
        className={`sm:hidden fixed inset-x-0 bottom-0 z-[55] border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ${scrolledPastHero ? "translate-y-0" : "translate-y-full"}`}
      >
        {session ? (
          <Link
            href="/dashboard"
            className="flex items-center justify-center bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3 hover:bg-white transition-colors"
          >
            dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openAuth("signin")}
              className={`${mono.className} text-[13px] text-white/60 hover:text-white px-2 shrink-0`}
            >
              log in
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="flex-1 flex items-center justify-center bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3 hover:bg-white transition-colors"
            >
              sign up free
            </button>
          </div>
        )}
      </div>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <nav
            className={`${mono.className} hidden md:flex items-center gap-7 text-[13px] text-white/55`}
          >
            <a href="#sample" className="hover:text-white transition-colors">sample</a>
            <a href="#how" className="hover:text-white transition-colors">how it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">pricing</a>
            <Link href="/blog" className="hover:text-white transition-colors">the drop</Link>
          </nav>
          <div className={`${mono.className} flex items-center gap-4 text-[13px] shrink-0`}>
            <Link href="/reviewer" className="hidden lg:inline text-white/55 hover:text-white transition-colors">
              review tracks
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="bg-[#6ee7ff] text-black font-bold px-4 py-1.5 hover:bg-white transition-colors"
              >
                dashboard
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className="hidden sm:inline text-white/55 hover:text-white transition-colors"
                >
                  log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="bg-[#6ee7ff] text-black font-bold px-4 py-1.5 hover:bg-white transition-colors"
                >
                  sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="top" className="relative z-10 max-w-6xl mx-auto px-5 pt-14 sm:pt-20 pb-16 scroll-mt-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
          {/* left — copy + paste box */}
          <div>
            <p className={`${mono.className} text-[13px] tracking-tight text-white/40 mb-6`}>
              [ the release verdict ]
            </p>
            <h1 className="text-[12.5vw] sm:text-[58px] lg:text-[70px] leading-[0.9] tracking-[-0.04em] font-extrabold">
              know if it&apos;s
              <br />
              ready to <span style={{ color: ACCENT }}>release</span>.
            </h1>
            <p className="text-lg text-white/55 mt-7 max-w-md normal-case">
              Paste a track and get the verdict — release ready, almost there,
              needs work or not ready — measured against what actually gets
              released. Then a room of five real listeners hears it too.
            </p>

            {/* the four-state verdict ladder — the hero's promise, made literal */}
            <div className="mt-6 flex items-stretch gap-px bg-white/10 border border-white/10 max-w-md overflow-hidden">
              {[
                ["not ready", "#ff7a90"],
                ["needs work", "#b8a4ff"],
                ["almost there", ACCENT],
                ["release ready", "#7cffc4"],
              ].map(([label, ink], i) => (
                <div
                  key={label}
                  className="flex-1 min-w-0 py-2 px-1 flex items-center justify-center text-center"
                  style={{
                    background: i === 2 ? (ink as string) : "#0a0a0a",
                    color: i === 2 ? "#000" : "rgba(255,255,255,0.3)",
                  }}
                >
                  <span className={`${mono.className} block text-[9.5px] sm:text-[11px] font-bold leading-tight tracking-tight`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* paste box + preview card */}
            <form onSubmit={start} className="mt-8 max-w-xl">
              {!isUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                >
                  <input
                    type="url"
                    value={trackUrl}
                    onChange={(e) => setTrackUrl(e.target.value)}
                    onBlur={() => setTrackUrl((v) => normalizeTrackUrl(v))}
                    onPaste={(e) => {
                      // links pasted without a protocol still get the preview card
                      const text = e.clipboardData.getData("text");
                      const normalized = normalizeTrackUrl(text);
                      if (normalized !== text) {
                        e.preventDefault();
                        setTrackUrl(normalized);
                      }
                    }}
                    placeholder="paste a soundcloud, youtube or mp3 link…"
                    className={`${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-5 py-4 text-[16px] text-white placeholder:text-white/30 focus:outline-none transition-colors normal-case`}
                  />
                  <label
                    className={`${mono.className} mt-2.5 flex items-center justify-center gap-2 border border-dashed py-3.5 text-[13px] cursor-pointer transition-colors ${
                      dragging
                        ? "border-[#6ee7ff] bg-[#6ee7ff]/10 text-white"
                        : "border-white/20 hover:border-[#6ee7ff] text-white/60 hover:text-white"
                    } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> uploading…</>
                    ) : dragging ? (
                      "drop your mp3 here"
                    ) : (
                      <><Upload className="h-4 w-4" /> upload or drag an mp3 (max 25mb)</>
                    )}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,.mp3"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </label>
                </div>
              ) : (
                <div
                  className="flex items-center gap-4 bg-[#141414] border p-3.5"
                  style={{
                    borderColor: !isSupported
                      ? "rgba(248,113,113,0.6)"
                      : meta
                      ? ACCENT
                      : "rgba(255,255,255,0.15)",
                    animation: "cardIn .25s ease",
                  }}
                >
                  <div className="w-14 h-14 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {meta?.artworkUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={meta.artworkUrl} alt="" className="w-full h-full object-cover" />
                    ) : metaLoading ? (
                      <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
                    ) : (
                      <Music className="h-5 w-5 text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {metaLoading && !meta ? (
                      <>
                        <div className="h-4 w-44 bg-white/10 animate-pulse" />
                        <div className="h-3 w-28 bg-white/5 mt-2.5 animate-pulse" />
                      </>
                    ) : meta ? (
                      <>
                        <p className="text-[16px] font-bold text-white truncate normal-case">
                          {meta.title}
                        </p>
                        <p className={`${mono.className} text-[12px] text-white/45 truncate normal-case mt-0.5`}>
                          {meta.artist ? `by ${meta.artist}` : "track found"}
                        </p>
                      </>
                    ) : !isSupported ? (
                      <>
                        <p className="text-[15px] font-bold text-red-400 truncate">
                          {unsupportedReason(trackUrl) ? "this link won’t work" : "we can’t read this link"}
                        </p>
                        <p className={`${mono.className} text-[12px] text-white/45 mt-0.5 ${unsupportedReason(trackUrl) ? "normal-case" : "truncate"}`}>
                          {unsupportedReason(trackUrl) ?? SUPPORTED_TRACK_HINT}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[15px] font-bold text-white truncate normal-case">
                          {uploadedName ? "uploaded" : "link added"}
                        </p>
                        <p className={`${mono.className} text-[12px] text-white/45 truncate normal-case mt-0.5`}>
                          {uploadedName || host || "ready to go"}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`${mono.className} text-[11px]`}
                      style={{ color: !isSupported ? "#f87171" : ACCENT }}
                    >
                      {!isSupported ? "✗ unsupported" : metaLoading && !meta ? "reading…" : "✓ ready"}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setTrackUrl(""); setUploadedName(""); }}
                      aria-label="change track"
                      className="text-white/35 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy || uploading}
                className="group mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black hover:bg-white font-extrabold text-base px-7 py-4 transition-colors shadow-[0_0_30px_-6px_rgba(110,231,255,0.7)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> opening your report…
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> uploading your track…
                  </>
                ) : (
                  <>
                    get my verdict — free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* sources we can actually analyse */}
              <div className={`${mono.className} mt-4 flex items-center flex-wrap gap-x-4 gap-y-2 text-[12px] text-white/55`}>
                <span className="text-white/30">paste from</span>
                {SUPPORTED.map((s) => (
                  <span key={s.name} className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={s.color} aria-hidden>
                      <path d={s.path} />
                    </svg>
                    {s.name}
                  </span>
                ))}
                <span className="text-white/30">or mp3/wav</span>
              </div>

              {error && (
                <p className={`${mono.className} text-[13px] text-red-400 mt-3`}>{error}</p>
              )}
            </form>

            {/* trust tags — three, tight */}
            <div className={`${mono.className} mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50`}>
              <span className="inline-flex items-center gap-1.5" style={{ color: ACCENT }}>
                <Zap className="h-3.5 w-3.5" /> instant verdict
              </span>
              <span className="text-white/20">·</span>
              <span>real listeners</span>
              <span className="text-white/20">·</span>
              <span>no card</span>
            </div>
          </div>

          {/* right — real example, fills the frame */}
          <div className="relative lg:pl-2">
            <div
              className="absolute -inset-6 -z-10 opacity-30 blur-3xl"
              style={{ background: `radial-gradient(circle at 60% 30%, ${ACCENT}, transparent 70%)` }}
            />
            <ReportPreview />
          </div>
        </div>

        {/* trusted-by brand strip */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className={`${mono.className} text-[11px] text-white/30 mb-5`}>
            trusted by musicians releasing on
          </p>
          <div className="flex flex-wrap items-center gap-x-9 gap-y-5">
            {BRANDS.map((b) => (
              <div key={b.name} className="group flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill={b.color} aria-hidden>
                  <path d={b.path} />
                </svg>
                <span className={`${mono.className} text-[15px] font-medium text-white/55 group-hover:text-white transition-colors`}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENTLY READ BY THE ROOM (real artwork strip) ── */}
      <section className="relative z-10 border-t border-white/10 overflow-hidden py-8">
        <p className={`${mono.className} max-w-6xl mx-auto px-5 text-[11px] text-white/35 mb-5`}>
          [ recently read by the room ]
        </p>
        <div className="relative">
          {/* two identical groups, each with matching trailing gap → seamless -50% loop */}
          <div className="flex w-max" style={{ animation: "marquee 50s linear infinite" }}>
            {[0, 1].map((g) => (
              <div key={g} className="flex gap-3 pr-3 shrink-0" aria-hidden={g === 1}>
                {RECENT.map((r, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border border-white/10 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <span
                      className={`${mono.className} absolute bottom-0 right-0 text-[10px] font-bold text-black px-1 leading-tight`}
                      style={{ background: ACCENT }}
                    >
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        </div>
      </section>

      {/* ── HOW IT WORKS (visual flow) ── */}
      <section id="how" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">
            paste. measured verdict. the room. release call.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
            {[
              { n: "01", t: "paste your link", v: <PasteMock /> },
              { n: "02", t: "measured against released tracks", v: <LogMock /> },
              { n: "03", t: "the real room hears it", v: <RoomMock /> },
              { n: "04", t: "your release verdict", v: <VerdictMock /> },
            ].map((s) => (
              <div key={s.n} className="bg-[#0a0a0a] p-5 sm:p-6 flex flex-col">
                <div className={`${mono.className} flex items-center gap-2 text-[12px] mb-5`}>
                  <span style={{ color: ACCENT }}>{s.n}</span>
                  <span className="text-white/55">{s.t}</span>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="w-full">{s.v}</div>
                </div>
              </div>
            ))}
          </div>

          {/* the four-state verdict ladder — solid colour blocks, not ready → ready */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-px">
            {[
              ["not ready", "#ff7a90"],
              ["needs work", "#b8a4ff"],
              ["almost there", ACCENT],
              ["release ready", "#7cffc4"],
            ].map(([label, ink]) => (
              <div
                key={label}
                className={`${mono.className} p-4 text-[12px] font-bold text-black text-center`}
                style={{ background: ink }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* what we check — pills, no prose */}
          <div className="flex flex-wrap items-center gap-2.5 mt-10">
            <span className={`${mono.className} text-[12px] text-white/40 mr-1`}>the verdict weighs</span>
            {CHECKS.map((c) => (
              <span
                key={c.t}
                className={`${mono.className} text-[12.5px] text-white/70 border border-white/15 px-3 py-1.5`}
              >
                {c.t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO-STAGE READ (solid blue) ── */}
      <section id="why" className="relative z-10 border-t border-white/10 bg-[#6ee7ff] text-black lowercase scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-black/50 mb-4`}>[ two pillars, one track ]</p>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-[0.9] max-w-2xl">
            the instant verdict. then real ears.
          </h2>
          <p className="text-black/70 text-lg mt-6 max-w-lg normal-case">
            The measured verdict lands now — and the same track goes to a room
            of real listeners, so the call has human ears behind it too.
          </p>

          <div className="grid md:grid-cols-[1fr_auto_1fr] items-stretch gap-6 mt-12">
            {/* stage 1 — instant */}
            <div className="bg-[#0a0a0a] text-white p-7 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className={`${mono.className} text-[11px] text-black px-2.5 py-1`} style={{ background: ACCENT }}>
                  now · in seconds
                </span>
                <Zap className="h-6 w-6" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">the measured verdict</h3>
              <p className="text-white/55 text-[14.5px] leading-relaxed normal-case mt-2 mb-6">
                ai listens to the actual audio, measures it against released
                tracks, and calls it — ready, almost, or not — with the fixes
                that close the gap.
              </p>
              <div className="mt-auto flex items-center gap-5">
                <ScoreRing score={SAMPLE.score} size="sm" dark animate />
                <div className={`${mono.className} space-y-1.5 text-[12px]`}>
                  {["energy curve mapped", "hook + structure read", "5 dimensions scored"].map((s) => (
                    <div key={s} className="text-white/55">
                      <span style={{ color: ACCENT }}>✓</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* connector */}
            <div className="flex md:flex-col items-center justify-center gap-3 text-black/40">
              <span className="hidden md:block h-12 w-px bg-black/20" />
              <ArrowDown className="h-6 w-6" />
              <span className="hidden md:block h-12 w-px bg-black/20" />
            </div>

            {/* stage 2 — real people */}
            <div className="bg-[#0a0a0a] text-white p-7 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className={`${mono.className} text-[11px] text-white border border-white/25 px-2.5 py-1`}>
                  then · real people
                </span>
                <Users className="h-6 w-6" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">a real room hears it</h3>
              <p className="text-white/55 text-[14.5px] leading-relaxed normal-case mt-2 mb-6">
                a room of real listeners plays your track and reacts — honest,
                unbiased takes that land over the next while.
              </p>
              <div className="mt-auto">
                <div className="flex items-center gap-2 mb-3">
                  {["S", "M", "A"].map((c) => (
                    <span
                      key={c}
                      className={`${mono.className} w-9 h-9 flex items-center justify-center text-[13px] font-bold text-black`}
                      style={{ background: ACCENT }}
                    >
                      {c}
                    </span>
                  ))}
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className={`${mono.className} w-9 h-9 flex items-center justify-center text-[11px] text-white/30 border border-white/15`}
                    >
                      ···
                    </span>
                  ))}
                </div>
                <p className={`${mono.className} text-[12px] text-white/45 normal-case`}>
                  3 of 5 listeners in — more land as the room finishes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLAYED FOR THE ROOM (the co-pillar — real listeners, below the verdict) ── */}
      <RoomShowcase />

      {/* ── BECOME A REVIEWER ── */}
      <section id="earn" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* left — the pitch */}
            <div>
              <p className={`${mono.className} text-[13px] text-white/55 mb-4 inline-flex items-center gap-2`}>
                <Headphones className="h-4 w-4" style={{ color: ACCENT }} /> [ the other side of the room ]
              </p>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[0.95]">
                or get paid
                <br />
                to <span style={{ color: ACCENT }}>listen</span>.
              </h2>
              <p className="text-white/55 text-lg mt-6 max-w-md normal-case">
                Hear unreleased tracks first and earn{" "}
                <span className="text-white font-bold">$0.40</span> for every
                honest review you leave.
              </p>

              <div className="flex items-end gap-8 mt-9">
                <div>
                  <p className="text-5xl font-extrabold" style={{ color: ACCENT }}>$0.40</p>
                  <p className={`${mono.className} text-[12px] text-white/45 mt-1 normal-case`}>per review</p>
                </div>
                <div>
                  <p className="text-5xl font-extrabold">~2<span className="text-xl text-white/40 font-medium">min</span></p>
                  <p className={`${mono.className} text-[12px] text-white/45 mt-1 normal-case`}>each, on your time</p>
                </div>
              </div>

              <Link
                href="/reviewer"
                className="group mt-9 inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors"
              >
                become a reviewer
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* right — queue mock (real app shape) */}
            <div className="border border-white/12 bg-[#0e0e0e]">
              <div className={`${mono.className} flex items-center justify-between border-b border-white/10 px-4 h-9 text-[11px]`}>
                <span className="text-white/35">[ your queue ]</span>
                <span style={{ color: ACCENT }}>this week · $14.80</span>
              </div>
              <div className="p-4 space-y-px bg-white/5">
                {[
                  ["untitled idea", "2:14", "/activity-artwork/12.jpg"],
                  ["new demo v3", "3:08", "/activity-artwork/22.jpg"],
                  ["late night bounce", "2:41", "/activity-artwork/31.jpg"],
                ].map(([title, len, art]) => (
                  <div key={title} className="group flex items-center gap-3 bg-[#0e0e0e] p-3">
                    <span className="relative w-9 h-9 shrink-0 overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={art} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-3.5 w-3.5 text-white" />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold truncate normal-case">{title}</p>
                      <p className={`${mono.className} text-[11px] text-white/40 mt-0.5`}>{len} · waiting for ears</p>
                    </div>
                    <span
                      className={`${mono.className} text-[11px] font-bold text-black px-2 py-1 shrink-0`}
                      style={{ background: ACCENT }}
                    >
                      +$0.40
                    </span>
                  </div>
                ))}
              </div>
              <div className={`${mono.className} flex items-center justify-between border-t border-white/10 px-4 h-10 text-[11px] text-white/45`}>
                <span>3 tracks waiting</span>
                <span className="inline-flex items-center gap-1.5 text-white/65">
                  listen + review <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REAL REVIEWS (social proof, just before the ask) ── */}
      <RealReviews />

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ pricing ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            one plan. no noise.
          </h2>
          <p className="text-white/60 text-lg mb-12 normal-case max-w-md">
            {FREE_FULL_READ
              ? "Your first full report is free. After that, $6.95 a track — or go unlimited."
              : "Submitting and your teaser are free."}
          </p>
          <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {/* free */}
            <div className="bg-[#0a0a0a] p-8">
              <p className={`${mono.className} text-[13px] text-white/40`}>free</p>
              <p className="text-5xl font-extrabold mt-3">$0</p>
              <p className={`${mono.className} text-white/40 text-[13px] mt-1 normal-case`}>
                no card needed
              </p>
              <ul className={`${mono.className} mt-7 space-y-2.5 text-[13.5px] text-white/55 normal-case`}>
                {(FREE_FULL_READ
                  ? ["your first track's FULL report", "the release verdict + score, in full", "the complete written read + all 3 fixes", "the measured waveform"]
                  : ["the release verdict", "score out of 100 + 5-dimension read", "every reaction headline", "the three things to fix"]
                ).map((x) => (
                  <li key={x} className="flex gap-2"><span style={{ color: ACCENT }}>+</span>{x}</li>
                ))}
              </ul>
              <a
                href="#top"
                className="mt-7 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-extrabold py-3.5 transition-colors"
              >
                get my read →
              </a>
            </div>
            {/* per track */}
            <div className="bg-[#0a0a0a] p-8">
              <p className={`${mono.className} text-[13px] text-white/40`}>per track</p>
              <p className="text-5xl font-extrabold mt-3">
                $6.95<span className="text-lg text-white/40 font-medium"> once</span>
              </p>
              <p className={`${mono.className} text-white/40 text-[13px] mt-1 normal-case`}>
                one track · yours forever
              </p>
              <ul className={`${mono.className} mt-7 space-y-2.5 text-[13.5px] text-white/70 normal-case`}>
                {(FREE_FULL_READ
                  ? ["every track after your first", "the full report, unsealed", "the room — 5 real people react", "the deep stem-level mix read"]
                  : ["everything in free", "every reaction in full", "the complete written read", "the detail behind all three fixes"]
                ).map((x) => (
                  <li key={x} className="flex gap-2"><span style={{ color: ACCENT }}>+</span>{x}</li>
                ))}
              </ul>
              <a
                href="#top"
                className="mt-7 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-extrabold py-3.5 transition-colors"
              >
                {FREE_FULL_READ ? "score a track →" : "start free →"}
              </a>
            </div>
            {/* unlimited — solid blue */}
            <div className="bg-[#6ee7ff] text-black p-8 relative">
              <p className={`${mono.className} text-[13px] text-black/60`}>unlimited</p>
              <p className="text-5xl font-extrabold mt-3">
                $19.95<span className="text-lg text-black/50 font-medium">/mo</span>
              </p>
              <p className={`${mono.className} text-black/55 text-[13px] mt-1 normal-case`}>
                or $143.40/yr · every track auto-unlocked
              </p>
              <ul className={`${mono.className} mt-7 space-y-2.5 text-[13.5px] text-black/80 normal-case`}>
                {["unlimited AI reads, every one in full", "unlock every track you submit — no $6.95 per report", "the real room on 3 tracks a month (5 listeners each)", "your dashboard + history", "cancel anytime — unlocks stay"].map((x) => (
                  <li key={x} className="flex gap-2"><span className="font-bold">+</span>{x}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={subscribing !== null}
                className="mt-7 w-full inline-flex items-center justify-center gap-2 text-center bg-black text-[#6ee7ff] font-extrabold py-3.5 hover:bg-[#141414] transition-colors disabled:opacity-70 disabled:cursor-wait"
              >
                {subscribing === "monthly" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> opening checkout…</>
                ) : (
                  "go unlimited — $19.95/mo →"
                )}
              </button>
              <button
                onClick={() => handleSubscribe("annual")}
                disabled={subscribing !== null}
                className={`${mono.className} mt-2 block w-full text-center text-[12px] text-black/55 hover:text-black transition-colors disabled:opacity-70 disabled:cursor-wait`}
              >
                {subscribing === "annual" ? "opening checkout…" : "or pay yearly — $143.40/yr (save 40%)"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST FROM THE DROP ── */}
      <section className="relative z-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ the drop ]</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">latest reads</h2>
            </div>
            <Link
              href="/blog"
              className={`${mono.className} text-[13px] text-white/55 hover:text-white transition-colors shrink-0`}
            >
              all posts →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {posts.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group bg-[#0a0a0a] p-6 hover:bg-[#0e0e0e] transition-colors flex flex-col"
              >
                <div className={`${mono.className} flex items-center gap-2 mb-3 text-[11px]`}>
                  <span style={{ color: ACCENT }}>{p.category.toLowerCase()}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40">{p.date}</span>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight leading-snug group-hover:text-[#6ee7ff] transition-colors mb-2">
                  {p.title}
                </h3>
                <p className="text-white/45 text-[13.5px] leading-relaxed normal-case line-clamp-2 flex-1">
                  {p.excerpt}
                </p>
                <span className={`${mono.className} mt-4 inline-flex items-center gap-1 text-[12px] text-white/35 group-hover:text-white transition-colors`}>
                  {p.readTime} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
        <div className="bg-[#6ee7ff] text-black">
          <div className="max-w-6xl mx-auto px-5 py-20">
            <p className={`${mono.className} text-[13px] text-black/55 mb-2`}>[ faq ]</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">
              questions, answered.
            </h2>
            <div className="grid md:grid-cols-2 gap-px bg-black/15 border border-black/15">
              {FAQS.map((f) => (
                <details key={f.q} className="group bg-[#6ee7ff] open:bg-[#85ecff] transition-colors">
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none p-6 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-[15px] font-extrabold tracking-tight leading-snug lowercase">
                      {f.q}
                    </h3>
                    <span
                      className={`${mono.className} shrink-0 text-[15px] leading-snug font-bold group-open:rotate-45 transition-transform`}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-6 text-[13.5px] leading-relaxed text-black/70 normal-case">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 pt-14 pb-10">
          <div className="grid sm:grid-cols-[1.1fr_1.2fr_1fr] gap-10 sm:gap-8">
            {/* product */}
            <div>
              <p className={`${mono.className} text-[12px] text-white/30 mb-4`}>[ product ]</p>
              <ul className={`${mono.className} space-y-2.5 text-[13px] text-white/45`}>
                <li><a href="#pricing" className="hover:text-white transition-colors">pricing</a></li>
                <li><Link href="/report/demo" className="hover:text-white transition-colors">sample report</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">the drop — blog</Link></li>
                <li><Link href="/reviewer" className="hover:text-white transition-colors">become a listener</Link></li>
              </ul>
            </div>
            {/* feedback by genre */}
            <div>
              <p className={`${mono.className} text-[12px] text-white/30 mb-4`}>[ feedback by genre ]</p>
              <ul className={`${mono.className} grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] text-white/45`}>
                {FOOTER_GENRES.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/feedback/${g.slug}`} className="hover:text-white transition-colors">
                      {g.label} feedback
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/feedback" className="text-white/70 hover:text-white transition-colors">
                    all genres →
                  </Link>
                </li>
              </ul>
            </div>
            {/* compare */}
            <div>
              <p className={`${mono.className} text-[12px] text-white/30 mb-4`}>[ compare ]</p>
              <ul className={`${mono.className} space-y-2.5 text-[13px] text-white/45`}>
                {FOOTER_ALTERNATIVES.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/alternatives/${a.slug}`} className="hover:text-white transition-colors">
                      {a.label} alternative
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/alternatives" className="text-white/70 hover:text-white transition-colors">
                    all comparisons →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className={`${mono.className} mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/40`}>
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">privacy</Link>
            </div>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* ── ASSIGNMENT MODAL (stays in place, page behind) ── */}
      {phase !== "idle" && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md">
          <div
            className="flex min-h-full items-center justify-center p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget) cancel();
            }}
          >
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/15 p-7 relative">
            {phase !== "done" && (
              <button
                onClick={cancel}
                className={`${mono.className} absolute top-4 right-4 inline-flex items-center gap-1 text-[12px] text-white/40 hover:text-white transition-colors`}
              >
                <X className="h-3.5 w-3.5" /> esc
              </button>
            )}

            <p className={`${mono.className} text-[13px] text-white/40 mb-3 flex items-center gap-3`}>
              <span>{phase === "done" ? "[ wrapping up ]" : "[ analyzing your track… ]"}</span>
              {phase !== "done" && <Elapsed className="text-[12px] text-white/30" />}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6 lowercase">
              {phase === "done" ? (
                <>your read is <span style={{ color: ACCENT }}>almost in</span>.</>
              ) : (
                <>reading your track…</>
              )}
            </h2>

            {/* track card — proof we grabbed the right song, with the eq
                dancing so the wait reads as listening, not loading */}
            <div className="flex items-center gap-4 bg-[#141414] border border-white/15 p-3.5 mb-5">
              <div className="relative w-14 h-14 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                {meta?.artworkUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={meta.artworkUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
                    <EqBars className="absolute bottom-1 left-1.5 h-3.5" />
                  </>
                ) : (
                  <EqBars className="h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-white truncate normal-case">
                  {meta?.title || "your track"}
                </p>
                <p className={`${mono.className} text-[12px] text-white/55 mt-0.5`}>
                  {phase === "done" ? "read incoming…" : "listening through the full track…"}
                </p>
              </div>
            </div>

            {/* always-moving progress bar — the strongest "not frozen" signal */}
            <div className="mb-4">
              <CreepingBar
                target={phase === "done" ? 100 : 12 + step * 11}
                monoClass={mono.className}
              />
            </div>

            <div
              ref={logRef}
              className={`${mono.className} bg-[#080808] border border-white/12 p-5 text-[13.5px] leading-7`}
            >
              {STEPS.map((s, i) => {
                const state =
                  i < step || phase === "done" ? "done" : i === step ? "active" : "pending";
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
                      <span aria-hidden>
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="animate-pulse"
                            style={{ animationDelay: `${d * 250}ms` }}
                          >
                            .
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
              {phase === "done" && (
                <div className="text-white mt-2 pt-2 border-t border-white/10">
                  <span style={{ color: ACCENT }}>✓</span> done · your verdict is ready
                </div>
              )}
            </div>

            <div className="mt-6">
              {phase === "done" ? (
                session?.user ? (
                  <>
                    <button
                      onClick={seeResults}
                      disabled={busy}
                      className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors disabled:opacity-60"
                    >
                      {busy ? "opening…" : "see my report"}
                      {!busy && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                    </button>
                    {error && (
                      <p className={`${mono.className} text-[13px] text-red-400 mt-3 text-center`}>{error}</p>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: ACCENT }} />
                    <p className={`${mono.className} text-[13px] text-white/55 normal-case`}>
                      your verdict’s ready — opening your report…
                    </p>
                  </div>
                )
              ) : (
                <p className={`${mono.className} text-[13px] text-white/40`}>hang tight…</p>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
