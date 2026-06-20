"use client";

// ── FAKE submit → analyze → report flow, for screen recordings ──────────
// The form screen is a twin of the real landing-page hero, but makes ZERO
// network calls and never runs a real read. Paste any link (or drag an mp3),
// hit submit, watch the short (timed, not polled) analyzing screen, land on a
// full pre-built report. Edit DEMO_* below to record a different track.
//
// Not linked anywhere — reach it directly at /demo-record.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ScoreRing } from "@/components/score/score-ring";
import { isSupportedTrackUrl, normalizeTrackUrl, SUPPORTED_TRACK_HINT } from "@/lib/track-url";
import {
  CreepingBar,
  EqBars,
  RotatingLine,
  Elapsed,
  LISTEN_FLAVOR,
  WRITE_FLAVOR,
} from "@/components/score/analyzing-bits";
import { ReportView, type ReportViewModel } from "../report/[id]/report-view";
import demoWaveRaw from "../report/demo-free/cutandrun-wave.json";
import { ArrowRight, Loader2, Music, X, Upload, Zap } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

// How long the fake "analyzing" screen runs before the report appears. Kept
// short for a snappy recording — bump it if you want more time to narrate.
const ANALYZE_MS = 6000;
// Fallback artwork shown in the preview card + report when a link has none.
const DEMO_ARTWORK = "/activity-artwork/5.jpg";

// Source marks (monochrome official paths) shown under the paste bar.
const SC_PATH = "M1 14.5c.28 0 .5-.9.5-2s-.22-2-.5-2-.5.9-.5 2 .22 2 .5 2zm2 1c.28 0 .5-1.34.5-3s-.22-3-.5-3-.5 1.34-.5 3 .22 3 .5 3zm2 .5c.28 0 .5-1.79.5-4s-.22-4-.5-4-.5 1.79-.5 4 .22 4 .5 4zm2 0c.28 0 .5-2.01.5-4.5S7.78 7 7.5 7s-.5 2.01-.5 4.5.22 4.5.5 4.5zm2 0c.28 0 .5-2.24.5-5s-.22-5-.5-5-.5 2.24-.5 5 .22 5 .5 5zm12.5 0a3.5 3.5 0 0 0 0-7c-.34 0-.67.05-.98.14A5.5 5.5 0 0 0 11 7.5c0 .3.03.6.08.88-.18-.08-.38-.13-.58-.13-.28 0-.5 2.24-.5 5s.22 4.27.5 4.27h11z";
const YT_PATH = "M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12c.34-1.9.5-3.84.5-5.8 0-1.96-.16-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z";
const BC_PATH = "M0 18.75l7.437-13.5H24l-7.437 13.5H0z";
const SUPPORTED: { name: string; path: string; color: string }[] = [
  { name: "soundcloud", path: SC_PATH, color: "#FF5500" },
  { name: "youtube", path: YT_PATH, color: "#FF0000" },
  { name: "bandcamp", path: BC_PATH, color: "#1DA0C3" },
];

// ── pre-built report (the "nice looking" result) ────────────────────────

const waveB64 = (cols: number[]) =>
  Buffer.from(cols.map((v) => Math.max(0, Math.min(255, Math.round(v * 255))))).toString("base64");

const DEMO_WAVE: ReportViewModel["waveform"] = {
  n: demoWaveRaw.lo.length,
  lo: waveB64(demoWaveRaw.lo),
  mid: waveB64(demoWaveRaw.mid),
  hi: waveB64(demoWaveRaw.hi),
  durationSec: 359,
};

function buildReport(opts: { title: string; artworkUrl: string | null }): ReportViewModel {
  return {
    slug: "demo-record",
    isDemo: true,
    pending: false,
    unlocked: true,
    trackTitle: opts.title || "Midnight Drive",
    artworkUrl: opts.artworkUrl || DEMO_ARTWORK,
    genre: "Electronic",
    scoredAt: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    roomSize: 20,
    score: 82,
    percentile: 27,
    verdict: "ALMOST_THERE",
    categories: [
      { label: "Hook Strength", score: 4.2, pct: 84, note: "The hook lands fast — the first vocal phrase is the strongest moment and most of the room caught it on one listen. It could hit even harder if it arrived a few seconds sooner." },
      { label: "Production Quality", score: 3.8, pct: 76, note: "The mix is clean and confident; nothing sounds amateur. The low end is a touch polite for the genre — a bit more weight under the drop would make it feel finished." },
      { label: "Listener Retention", score: 3.4, pct: 68, note: "Attention is locked through the first drop, then dips around the 1:10 mark where the track sits on one idea too long before the back half pulls it back." },
      { label: "Emotional Impact", score: 4.0, pct: 80, note: "There's a genuine warmth that reads as honest rather than manufactured. The emotional peak is real — leaning into it harder rather than pulling back would deepen it." },
      { label: "Commercial Potential", score: 3.6, pct: 72, note: "Strong playlist fit for late-night electronic — it has a clear audience. What caps its reach is the absence of one undeniable, quotable moment to anchor a share." },
    ],
    summaryHeadline: "The room leaned in early, drifted a touch mid-way.",
    aiSummary:
      "The opening grabbed people fast — most of the room was locked in by the first hook. Energy held strong through the first drop, then a few listeners drifted in the mid-section where the track sits in one idea a beat too long. The back half pulls it back and the emotional read stays warm throughout. Get people to the hook a little sooner and this holds the whole room.",
    reactions: [
      { lens: "producer's read", genre: "Electronic · Pop", headline: "Hook lands fast, the intro slightly delays it", quote: "The first vocal phrase is the strongest moment and it arrives early enough to catch the room. Trimming a few seconds off the intro would let it hit sooner and carry the energy straight into the drop.", tags: ["strong hook", "trim intro"], positive: true },
      { lens: "mix lens", genre: "Electronic", headline: "Clean and confident, low end a touch polite", quote: "Nothing reads as amateur — the balance is controlled and the highs are crisp. The sub sits politely for the genre, so a little more weight under the drop would make it feel fully finished.", tags: ["clean mix", "more low-end"], positive: true },
      { lens: "casual first listen", genre: "Pop", headline: "Locked in early, a dip around the middle", quote: "The opening pulls you in and the first drop keeps it moving. Around the 1:10 mark the track sits on one idea a beat too long, which is where a first-time listener is most likely to drift before the back half pulls it back.", tags: ["mid-track dip"], positive: false },
      { lens: "playlist curator", genre: "Indie", headline: "Strong late-night fit, needs one quotable moment", quote: "It slots naturally into a late-night electronic playlist and the warmth reads as honest rather than manufactured. What caps its reach is the absence of one undeniable moment to anchor a share or a save.", tags: ["playlist-ready", "no standout"], positive: true },
    ],
    priorityFixes: [
      { label: "Get to the hook 8–12 seconds sooner", detail: "Most of the room wanted the hook earlier. Trimming the intro keeps people from drifting before the best part.", count: 13 },
      { label: "Add a small change in the mid-section", detail: "A few people drifted around the middle. A new element or a filter sweep would re-grab attention.", count: 7 },
      { label: "Give the outro a softer landing", detail: "The ending felt abrupt to some. A short tail or fade rounds the whole thing off.", count: 4 },
    ],
    humanReviewsIn: 3,
    humanReviewsTotal: 5,
    waveform: DEMO_WAVE,
    humanReviews: [
      { rating: 4, headline: "Hook stuck with me after one listen", quote: "Played it twice back to back. The drop has real bounce and the hook is sticky. Middle sagged a touch for me but honestly its close to done.", positive: true },
      { rating: 5, headline: "Would put this on a playlist today", quote: "Clean and confident. Everthing sits right and it kept me the whole way through. Talented!", positive: true },
      { rating: 3, headline: "Intro made me wait a bit", quote: "Took a while to get going for me. Once the hook hit I was in, just wanted to get there sooner.", positive: false },
    ],
  };
}

// ── live report preview (right side of the hero — mirrors the landing) ───

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
};

const HERO_REACTIONS: { name: string; lens: string; rating: number; headline: string }[] = [
  { name: "nova reyes", lens: "producer", rating: 5, headline: "felt release-ready to me" },
  { name: "jules okafor", lens: "casual listener", rating: 4, headline: "hook caught me straight away" },
  { name: "mara linde", lens: "mix engineer", rating: 3, headline: "low end's a touch polite" },
  { name: "theo brandt", lens: "fellow artist", rating: 5, headline: "this would slap live" },
  { name: "kavi anand", lens: "first-time listener", rating: 4, headline: "kept me till the very end" },
];

function Dots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1 shrink-0" aria-label={`${count} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className="w-2 h-2" style={{ background: i < count ? ACCENT : "rgba(255,255,255,0.14)" }} />
      ))}
    </div>
  );
}

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

      <div className="absolute inset-0 translate-x-3 translate-y-4 border border-white/5 bg-[#0b0b0b] -z-10" />

      <div className="relative border border-white/12 bg-[#0e0e0e] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)] overflow-hidden">
        <div className="relative h-1 w-full overflow-hidden" style={{ background: `linear-gradient(90deg, ${ACCENT}, #a78bfa, ${ACCENT})` }}>
          <div className="absolute inset-y-0 w-1/3 bg-white/60 blur-[2px]" style={{ animation: "sheen 3.2s ease-in-out infinite" }} />
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-11 h-11 shrink-0 flex items-end justify-center gap-[3px] bg-white/5 border border-white/10 p-2.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-[3px] flex-1 origin-bottom" style={{ background: ACCENT, animation: `eqBar ${0.7 + i * 0.18}s ease-in-out ${i * 0.12}s infinite` }} />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold truncate">{SAMPLE.title}</p>
            <p className={`${mono.className} text-[11px] text-white/40 normal-case mt-0.5`}>{SAMPLE.genre} · ai + the room</p>
          </div>
          <span className={`${mono.className} text-[11px] text-black px-2.5 py-1 shrink-0`} style={{ background: ACCENT }}>almost there</span>
        </div>

        <div className="relative flex flex-col items-center text-center px-6 pt-7 pb-6 border-b border-white/10">
          <div className="absolute left-1/2 top-1/2 w-44 h-44 -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl pointer-events-none" style={{ background: ACCENT, opacity: 0.5, animation: "ringGlow 3s ease-in-out infinite" }} />
          <p className={`${mono.className} relative text-[11px] text-white/40 mb-4`}>resonance score</p>
          <div className="relative"><ScoreRing score={SAMPLE.score} size="md" dark animate /></div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {SAMPLE.bars.map((b, i) => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12.5px] text-white/70">{b.label}</span>
                <span className={`${mono.className} text-[12px] font-bold`}>{b.v.toFixed(1)}<span className="text-white/30"> / 5</span></span>
              </div>
              <div className="h-1.5 bg-white/[0.07] overflow-hidden">
                <div className="h-full origin-left" style={{ width: `${(b.v / 5) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, #a78bfa)`, animation: `growBar .9s cubic-bezier(.2,.7,.2,1) ${0.3 + i * 0.12}s both` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div key={ri} className="absolute -bottom-5 left-4 right-8 bg-[#141414] border p-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]" style={{ borderColor: ACCENT, animation: "chipSwap 2.6s ease-in-out both" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: ACCENT, animation: "livePulse 1.4s ease-in-out infinite" }} />
          </span>
          <span className={`${mono.className} text-[10px] text-white/55 uppercase tracking-wider truncate`}>{r.name} · {r.lens}</span>
          <span className="ml-auto shrink-0"><Dots count={r.rating} /></span>
        </div>
        <p className="text-[13px] font-bold leading-snug">“{r.headline}”</p>
      </div>
    </div>
  );
}

type Meta = { title: string; artist: string | null; artworkUrl: string | null };
type Phase = "form" | "analyzing" | "report";

export default function DemoRecordPage() {
  const [phase, setPhase] = useState<Phase>("form");

  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState("");

  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const [dragging, setDragging] = useState(false);

  // Derive a presentable title from a pasted link, e.g.
  // ".../midnight-drive" → "Midnight Drive".
  const titleFromUrl = (u: string): string => {
    try {
      const seg = new URL(u).pathname.split("/").filter(Boolean).pop() || "";
      const t = decodeURIComponent(seg).replace(/[-_]+/g, " ").replace(/\.[a-z0-9]+$/i, "").trim();
      if (!t) return "Midnight Drive";
      return t.replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      return "Midnight Drive";
    }
  };

  // FAKE upload — no presign, no PUT. Just shows the "uploaded" card.
  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");
    setUploading(true);
    await new Promise((r) => setTimeout(r, 900));
    const name = file.name;
    setUploadedName(name);
    setTrackUrl(`https://upload.local/${encodeURIComponent(name)}`);
    setUploading(false);
  };

  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  const isUpload = trackUrl.startsWith("https://upload.local/");
  const isSupported = isUpload || (isUrl && isSupportedTrackUrl(trackUrl));

  let host = "";
  try {
    host = new URL(trackUrl.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* not a url yet */
  }

  // FAKE metadata preview — same debounce/skeleton beats as the real form,
  // but the result is fabricated locally instead of hitting /api/metadata.
  useEffect(() => {
    const u = trackUrl.trim();
    if (isUpload) return; // upload card already shown
    if (!/^https?:\/\//i.test(u) || !isSupportedTrackUrl(u)) {
      setMeta(null);
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMetaLoading(true);
    const t = setTimeout(() => {
      if (cancelled) return;
      setMeta({ title: titleFromUrl(u), artist: "your artist name", artworkUrl: DEMO_ARTWORK });
      setMetaLoading(false);
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trackUrl, isUpload]);

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    if (!trackUrl.trim()) {
      setError("paste a link to your track first");
      return;
    }
    if (!isSupported) {
      setError(`we can't read that link — ${SUPPORTED_TRACK_HINT}`);
      return;
    }
    setError("");
    setPhase("analyzing");
  };

  const reportTitle =
    meta?.title || (uploadedName ? uploadedName.replace(/\.[^/.]+$/, "") : "");

  if (phase === "analyzing") {
    return (
      <AnalyzingFake
        title={reportTitle || "Your track"}
        artworkUrl={meta?.artworkUrl ?? (isUpload ? null : DEMO_ARTWORK)}
        onDone={() => setPhase("report")}
      />
    );
  }

  if (phase === "report") {
    return <ReportView data={buildReport({ title: reportTitle, artworkUrl: meta?.artworkUrl ?? null })} />;
  }

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase scroll-smooth`}>
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <nav className={`${mono.className} hidden md:flex items-center gap-7 text-[13px] text-white/55`}>
            <span className="hover:text-white transition-colors cursor-pointer">sample</span>
            <span className="hover:text-white transition-colors cursor-pointer">how it works</span>
            <span className="hover:text-white transition-colors cursor-pointer">pricing</span>
            <span className="hover:text-white transition-colors cursor-pointer">the drop</span>
          </nav>
          <div className={`${mono.className} flex items-center gap-4 text-[13px] shrink-0`}>
            <span className="hidden sm:inline text-white/55 hover:text-white transition-colors cursor-pointer">log in</span>
            <span className="bg-[#6ee7ff] text-black font-bold px-4 py-1.5 hover:bg-white transition-colors cursor-pointer">sign up</span>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 pt-14 sm:pt-20 pb-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
          {/* left — copy + paste box */}
          <div>
            <p className={`${mono.className} text-[13px] tracking-tight text-white/40 mb-6`}>
              [ honest feedback before you release ]
            </p>
            <h1 className="text-[14vw] sm:text-[64px] lg:text-[76px] leading-[0.9] tracking-[-0.04em] font-extrabold">
              your track,
              <br />
              heard for <span style={{ color: ACCENT }}>real</span>.
            </h1>
            <p className="text-lg text-white/55 mt-7 max-w-md normal-case">
              Honest music feedback and an instant track score — an AI read out
              of 100, then real reactions from a room of five listeners.
            </p>

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
                      const text = e.clipboardData.getData("text");
                      const normalized = normalizeTrackUrl(text);
                      if (normalized !== text) {
                        e.preventDefault();
                        setTrackUrl(normalized);
                      }
                    }}
                    placeholder="paste a soundcloud, youtube or mp3 link…"
                    className={`${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-5 py-4 text-[15px] text-white placeholder:text-white/30 focus:outline-none transition-colors normal-case`}
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
                    borderColor: !isSupported ? "rgba(248,113,113,0.6)" : meta ? ACCENT : "rgba(255,255,255,0.15)",
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
                        <p className="text-[16px] font-bold text-white truncate normal-case">{meta.title}</p>
                        <p className={`${mono.className} text-[12px] text-white/45 truncate normal-case mt-0.5`}>
                          {meta.artist ? `by ${meta.artist}` : "track found"}
                        </p>
                      </>
                    ) : !isSupported ? (
                      <>
                        <p className="text-[15px] font-bold text-red-400 truncate">we can&apos;t read this link</p>
                        <p className={`${mono.className} text-[12px] text-white/45 truncate mt-0.5`}>{SUPPORTED_TRACK_HINT}</p>
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
                    <span className={`${mono.className} text-[11px]`} style={{ color: !isSupported ? "#f87171" : ACCENT }}>
                      {!isSupported ? "✗ unsupported" : metaLoading && !meta ? "reading…" : "✓ ready"}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setTrackUrl(""); setUploadedName(""); setMeta(null); }}
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
                disabled={uploading}
                className="group mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black hover:bg-white font-extrabold text-base px-7 py-4 transition-colors shadow-[0_0_30px_-6px_rgba(110,231,255,0.7)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> uploading your track…</>
                ) : (
                  <>
                    score my track — free
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
                <span className="text-white/30">or a direct mp3 / wav link</span>
              </div>

              {error && <p className={`${mono.className} text-[13px] text-red-400 mt-3`}>{error}</p>}
            </form>

            {/* trust tags */}
            <div className={`${mono.className} mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50`}>
              <span className="inline-flex items-center gap-1.5" style={{ color: ACCENT }}>
                <Zap className="h-3.5 w-3.5" /> instant read
              </span>
              <span className="text-white/20">·</span>
              <span>real listeners</span>
              <span className="text-white/20">·</span>
              <span>unbiased</span>
              <span className="text-white/20">·</span>
              <span>no card</span>
            </div>
          </div>

          {/* right — live example */}
          <div className="relative lg:pl-2">
            <div className="absolute -inset-6 -z-10 opacity-30 blur-3xl" style={{ background: `radial-gradient(circle at 60% 30%, ${ACCENT}, transparent 70%)` }} />
            <ReportPreview />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── fake analyzing screen ───────────────────────────────────────────────
// Visual twin of the real PendingState, but driven by a timer (ANALYZE_MS)
// instead of polling /status. No network calls, no genre picker.

const PENDING_STEPS = [
  "fetching your track",
  "mapping the energy curve",
  "checking the hook + structure",
  "weighing it across 5 dimensions",
  "scoring against released music",
  "writing your instant read",
];

function AnalyzingFake({
  title,
  artworkUrl,
  onDone,
}: {
  title: string;
  artworkUrl: string | null;
  onDone: () => void;
}) {
  const [analyzed, setAnalyzed] = useState(false);
  const [step, setStep] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Flip to the "writing" phase around the halfway mark, then finish.
  useEffect(() => {
    const a = setTimeout(() => setAnalyzed(true), ANALYZE_MS * 0.5);
    const done = setTimeout(() => onDoneRef.current(), ANALYZE_MS);
    return () => { clearTimeout(a); clearTimeout(done); };
  }, []);

  // Step ticker — holds at "checking the hook" until analyzed, like the real one.
  useEffect(() => {
    const cap = analyzed ? PENDING_STEPS.length - 1 : 2;
    if (step >= cap) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, cap)), 450 + Math.random() * 350);
    return () => clearTimeout(t);
  }, [step, analyzed]);

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] flex items-center justify-center px-5 lowercase`}>
      <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/15 p-7">
        <div className="flex items-center justify-between mb-5">
          <p className={`${mono.className} text-[13px] text-white/40`}>[ analyzing your track… ]</p>
          <Elapsed className={`${mono.className} text-[12px] text-white/35`} />
        </div>

        <div className="flex items-center gap-4 bg-[#141414] border border-white/15 p-3.5 mb-5">
          <div className="relative w-14 h-14 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
            {artworkUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artworkUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
                <EqBars className="absolute bottom-1 left-1.5 h-3.5" />
              </>
            ) : (
              <EqBars className="h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold text-white truncate normal-case">{title}</p>
            <p className={`${mono.className} text-[12px] text-white/55 mt-0.5`}>
              {analyzed ? "writing your read…" : "listening through the full track…"}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <CreepingBar target={analyzed ? 94 : 76} monoClass={mono.className} />
        </div>

        <div className={`${mono.className} bg-[#080808] border border-white/12 p-5 text-[13.5px] leading-7`}>
          {PENDING_STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <div
                key={s}
                className={state === "pending" ? "text-white/20" : state === "active" ? "text-white" : "text-white/55"}
              >
                <span
                  className={state === "done" ? "inline-block animate-[fade-in_300ms_ease-out]" : undefined}
                  style={{ color: state === "pending" ? undefined : ACCENT }}
                >
                  {state === "done" ? "✓" : state === "active" ? "▸" : "·"}
                </span>{" "}
                {s}
                {state === "active" && <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#6ee7ff] animate-pulse" />}
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
          your score lands here the moment it&apos;s done. no need to refresh.
        </p>
      </div>
    </div>
  );
}
