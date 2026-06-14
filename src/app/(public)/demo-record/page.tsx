"use client";

// ── FAKE submit → analyze → report flow, for screen recordings ──────────
// Looks pixel-identical to the real /submit-score → /report/[slug] journey,
// but makes ZERO network calls and never runs a real read. Paste any link,
// hit submit, watch the (timed, not polled) analyzing screen, land on a full
// pre-built report. Edit DEMO below to record a different track.
//
// Not linked anywhere — reach it directly at /demo-record.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Loader2, Music, X, Upload } from "lucide-react";
import { isSupportedTrackUrl, normalizeTrackUrl, SUPPORTED_TRACK_HINT } from "@/lib/track-url";
import {
  CreepingBar,
  EqBars,
  RotatingLine,
  Elapsed,
  LISTEN_FLAVOR,
  WRITE_FLAVOR,
} from "@/components/score/analyzing-bits";
import { SCORE_GENRES } from "@/lib/score-genres";
import { ReportView, type ReportViewModel } from "../report/[id]/report-view";
import demoWaveRaw from "../report/demo-free/cutandrun-wave.json";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

// How long the fake "analyzing" screen runs before the report appears. The real
// read takes 1–2 min; this is tuned short for a clean recording. Bump it if you
// want more time to narrate over the progress log.
const ANALYZE_MS = 14000;
// Fallback artwork shown in the preview card + report when a link has none.
const DEMO_ARTWORK = "/activity-artwork/5.jpg";

const GENRES = [
  "Electronic", "Hip-Hop", "Pop", "R&B / Soul", "Rock", "Indie", "Lo-Fi",
  "Dance / Club", "Ambient", "Singer-Songwriter", "Metal", "Jazz",
  "Classical", "Country", "Latin", "Other",
];

// ── pre-built report (the "nice looking" result) ────────────────────────
// Same shape the real report page feeds ReportView. Tweak any of this to
// record a different-looking result.

const waveB64 = (cols: number[]) =>
  Buffer.from(cols.map((v) => Math.max(0, Math.min(255, Math.round(v * 255))))).toString("base64");

const DEMO_WAVE: ReportViewModel["waveform"] = {
  n: demoWaveRaw.lo.length,
  lo: waveB64(demoWaveRaw.lo),
  mid: waveB64(demoWaveRaw.mid),
  hi: waveB64(demoWaveRaw.hi),
  durationSec: 359,
};

function buildReport(opts: { title: string; genre: string; artworkUrl: string | null }): ReportViewModel {
  return {
    slug: "demo-record",
    isDemo: true,
    pending: false,
    unlocked: true,
    trackTitle: opts.title || "Midnight Drive",
    artworkUrl: opts.artworkUrl || DEMO_ARTWORK,
    genre: opts.genre || "Electronic",
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
      { initial: "S", genre: "Electronic · Pop", rating: 4, headline: "Hook caught me straight away", quote: "Really liked this. The hook lands early and I caught myself humming it after. The drop has a nice bounce to it. For me the only thing was the middle felt a tiny bit long, but honestly its close.", positive: true },
      { initial: "M", genre: "Hip-Hop · R&B", rating: 5, headline: "Felt release-ready to me", quote: "This one is clean. Everthing sits nicely and it kept my attention the whole way. Would happily hear this on a playlist. Talented!", positive: true },
      { initial: "A", genre: "Electronic", rating: 3, headline: "Intro dragged a little for me", quote: "Solid track but the intro took a while to get going. I wanted to hit the hook sooner. Once it kicked in I was into it though.", positive: false },
      { initial: "J", genre: "Indie", rating: 4, headline: "Warm and easy to sit with", quote: "Nice vibe. It felt warm and I liked where it went. The ending came up a bit quick on me, would love a little more of a wind down.", positive: true },
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

type Meta = { title: string; artist: string | null; artworkUrl: string | null };
type Phase = "form" | "analyzing" | "report";

export default function DemoRecordPage() {
  const [phase, setPhase] = useState<Phase>("form");

  const [trackUrl, setTrackUrl] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
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
    setTrackTitle((cur) => cur || name.replace(/\.[^/.]+$/, ""));
    setUploading(false);
  };

  const hasEmail = email.trim().length > 0;
  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  const isUpload = trackUrl.startsWith("https://upload.local/");
  const isSupported = isUpload || (isUrl && isSupportedTrackUrl(trackUrl));
  const isValid = isSupported && hasEmail;

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
      const title = titleFromUrl(u);
      setMeta({ title, artist: "your artist name", artworkUrl: DEMO_ARTWORK });
      setTrackTitle((cur) => cur || title);
      setMetaLoading(false);
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trackUrl, isUpload]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || uploading) return;
    setError("");
    setPhase("analyzing");
  };

  if (phase === "analyzing") {
    return (
      <AnalyzingFake
        title={trackTitle || meta?.title || "Your track"}
        artworkUrl={meta?.artworkUrl ?? (isUpload ? null : DEMO_ARTWORK)}
        genre={genre}
        onDone={() => setPhase("report")}
      />
    );
  }

  if (phase === "report") {
    return (
      <ReportView
        data={buildReport({
          title: trackTitle || meta?.title || "",
          genre,
          artworkUrl: meta?.artworkUrl ?? null,
        })}
      />
    );
  }

  const inputCls =
    `${mono.className} w-full bg-[#141414] border border-white/20 focus:border-[#6ee7ff] px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none transition-colors normal-case`;

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link href="/" className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}>
            ← back
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-14">
        <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>[ drop your track ]</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-4">
          get an honest <span style={{ color: ACCENT }}>read</span>.
        </h1>
        <p className="text-white/70 text-lg mb-10 normal-case max-w-md leading-relaxed">
          Your first full report is free — score, written read, fixes, the lot. After that it&apos;s $6.95 a track, or unlimited for $19.95/mo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="track link" required>
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
                  placeholder="paste a soundcloud, youtube, bandcamp or mp3 link…"
                  className={inputCls}
                />
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className={`${mono.className} text-[11px] text-white/30`}>or</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
                <label
                  className={`${mono.className} mt-3 flex items-center justify-center gap-2 border border-dashed text-[13px] py-3.5 cursor-pointer transition-colors ${
                    dragging
                      ? "border-[#6ee7ff] bg-[#6ee7ff]/10 text-white"
                      : "border-white/20 hover:border-[#6ee7ff] text-white/70 hover:text-white"
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
                  borderColor: !isSupported ? "rgba(248,113,113,0.6)" : meta ? ACCENT : "rgba(255,255,255,0.2)",
                  animation: "cardIn .25s ease",
                }}
              >
                <div className="w-16 h-16 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                  {meta?.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={meta.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : metaLoading ? (
                    <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
                  ) : (
                    <Music className="h-5 w-5 text-white/50" />
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
                      <p className={`${mono.className} text-[12px] text-white/60 truncate normal-case mt-0.5`}>
                        {meta.artist ? `by ${meta.artist}` : "track found"}
                      </p>
                    </>
                  ) : !isSupported ? (
                    <>
                      <p className="text-[15px] font-bold text-red-400 truncate">we can&apos;t read this link</p>
                      <p className={`${mono.className} text-[12px] text-white/60 truncate mt-0.5`}>{SUPPORTED_TRACK_HINT}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-bold text-white truncate normal-case">
                        {uploadedName ? "uploaded" : "link added"}
                      </p>
                      <p className={`${mono.className} text-[12px] text-white/60 truncate normal-case mt-0.5`}>
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
                    className="text-white/45 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label="track title" optional>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="e.g. midnight drive"
              className={inputCls}
            />
          </Field>

          <Field label="genre" optional>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className={inputCls}>
              <option value="">pick a genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>

          <Field label="your email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputCls}
            />
          </Field>

          <Field label="anything we should know" optional>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. first release, is the intro too long?"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {error && <p className={`${mono.className} text-[13px] text-red-400 normal-case`}>{error}</p>}

          <button
            type="submit"
            disabled={!isValid || uploading}
            className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            get my read — free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className={`${mono.className} text-center text-[12px] text-white/50 normal-case`}>
            no card needed · first report free · then $6.95 a track or unlimited
          </p>
        </form>
      </div>

      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={`${mono.className} block text-[12px] text-white/60 mb-2`}>
        {label}
        {required && <span style={{ color: ACCENT }}> *</span>}
        {optional && <span className="text-white/30"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}

// ── fake analyzing screen ───────────────────────────────────────────────
// Visual twin of the real PendingState, but driven by a timer (ANALYZE_MS)
// instead of polling /status. No network calls. Calls onDone when "finished".

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
  genre,
  onDone,
}: {
  title: string;
  artworkUrl: string | null;
  genre?: string | null;
  onDone: () => void;
}) {
  const [analyzed, setAnalyzed] = useState(false);
  const [step, setStep] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Genre picker (local only) — mirrors the real wait-time widget.
  const [pickedGenre, setPickedGenre] = useState<string | null>(null);
  const [genreLocked] = useState(false);
  const showGenrePicker = !genreLocked && (!genre || genre === "Other" || genre === "—");

  // Score predictor (local only).
  const [guess, setGuess] = useState(75);
  const [guessLocked, setGuessLocked] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowPredictor(true), Math.min(6000, ANALYZE_MS * 0.35));
    return () => clearTimeout(t);
  }, []);

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
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, cap)), 1100 + Math.random() * 700);
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
                  onClick={() => setPickedGenre(g)}
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

        {showPredictor && (
          <div className="mb-5 border border-white/12 bg-[#101010] p-4" style={{ animation: "fade-in 400ms ease-out" }}>
            {guessLocked ? (
              <p className={`${mono.className} text-[12px] text-white/55 normal-case`}>
                <span style={{ color: ACCENT }}>✓ locked in: {guess}.</span>{" "}
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
                    onClick={() => setGuessLocked(true)}
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
