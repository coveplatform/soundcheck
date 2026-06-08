"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ScoreRing } from "@/components/score/score-ring";
import { posts } from "@/lib/blog-posts";
import { ArrowRight, ArrowDown, Music, Loader2, X, Zap, Users, Headphones, Play } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

// ── Real brand marks (official paths, monochrome) ───────────────────

const BRANDS: { name: string; path: string; color: string }[] = [
  {
    name: "soundcloud",
    color: "#FF5500",
    path: "M1 14.5c.28 0 .5-.9.5-2s-.22-2-.5-2-.5.9-.5 2 .22 2 .5 2zm2 1c.28 0 .5-1.34.5-3s-.22-3-.5-3-.5 1.34-.5 3 .22 3 .5 3zm2 .5c.28 0 .5-1.79.5-4s-.22-4-.5-4-.5 1.79-.5 4 .22 4 .5 4zm2 0c.28 0 .5-2.01.5-4.5S7.78 7 7.5 7s-.5 2.01-.5 4.5.22 4.5.5 4.5zm2 0c.28 0 .5-2.24.5-5s-.22-5-.5-5-.5 2.24-.5 5 .22 5 .5 5zm12.5 0a3.5 3.5 0 0 0 0-7c-.34 0-.67.05-.98.14A5.5 5.5 0 0 0 11 7.5c0 .3.03.6.08.88-.18-.08-.38-.13-.58-.13-.28 0-.5 2.24-.5 5s.22 4.27.5 4.27h11z",
  },
  {
    name: "youtube",
    color: "#FF0000",
    path: "M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12c.34-1.9.5-3.84.5-5.8 0-1.96-.16-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z",
  },
  { name: "bandcamp", color: "#1DA0C3", path: "M0 18.75l7.437-13.5H24l-7.437 13.5H0z" },
  { name: "mp3 / wav", color: "#6ee7ff", path: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" },
];

// ── Assignment sequence ─────────────────────────────────────────────

const STEPS = [
  "fetching your track",
  "mapping the energy curve",
  "checking the hook + structure",
  "weighing it across 5 dimensions",
  "writing your instant ai read",
  "assigning 5 real listeners to your track",
  "the room is tuning in…",
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

// ── Recently read by the room (real artwork) ────────────────────────

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
  return (
    <div className="relative border border-white/12 bg-[#0e0e0e] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
      {/* track header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <div className="w-11 h-11 bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
          <Music className="h-4 w-4 text-white/40" />
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

      {/* score */}
      <div className="flex flex-col items-center text-center px-6 pt-7 pb-6 border-b border-white/10">
        <p className={`${mono.className} text-[11px] text-white/40 mb-4`}>resonance score</p>
        <ScoreRing score={SAMPLE.score} size="md" dark animate />
      </div>

      {/* breakdown */}
      <div className="px-6 py-5 space-y-3 border-b border-white/10">
        {SAMPLE.bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12.5px] text-white/70">{b.label}</span>
              <span className={`${mono.className} text-[12px] font-bold`}>
                {b.v.toFixed(1)}
                <span className="text-white/30"> / 5</span>
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.07] overflow-hidden">
              <div className="h-full" style={{ width: `${(b.v / 5) * 100}%`, background: ACCENT }} />
            </div>
          </div>
        ))}
      </div>

      {/* one reaction */}
      <div className="flex gap-3 px-6 py-5">
        <span
          className={`${mono.className} w-8 h-8 shrink-0 flex items-center justify-center text-[12px] font-bold text-black`}
          style={{ background: ACCENT }}
        >
          S
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`${mono.className} text-[11px] text-white/50`}>the producer</span>
            <Dots count={5} />
          </div>
          <p className="text-[13px] font-bold leading-snug">“felt release-ready to me”</p>
          <p className="text-[12.5px] text-white/55 leading-relaxed normal-case mt-1">
            this one is clean. everthing sits nicely and it kept my attention the whole way.
          </p>
        </div>
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
  const lines = ["fetching track", "energy curve", "hook + structure", "5 dimensions", "your read"];
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

export default function ScorePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [trackUrl, setTrackUrl] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // ── debounced track preview ──
  useEffect(() => {
    const u = trackUrl.trim();
    if (!/^https?:\/\//i.test(u)) {
      setMeta(null);
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMetaLoading(true);
    const t = setTimeout(async () => {
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
  useEffect(() => {
    if (phase !== "running") return;
    if (step >= STEPS.length) {
      const t = setTimeout(() => setPhase("done"), 560);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 600 + Math.random() * 320);
    return () => clearTimeout(t);
  }, [phase, step]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [step, phase]);

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

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackUrl.trim()) {
      setError("paste a link to your track first");
      return;
    }
    setError("");
    setStep(0);
    setPhase("running");
  };

  const seeResults = async () => {
    if (busy) return;
    setBusy(true);
    const title = meta?.title?.trim() || "";
    const finish =
      `/score/finish?u=${encodeURIComponent(trackUrl.trim())}` +
      (title ? `&t=${encodeURIComponent(title)}` : "");
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(finish)}`);
      return;
    }
    try {
      const res = await fetch("/api/score/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrl: trackUrl.trim(), trackTitle: title || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data?.slug) {
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
    if (!session?.user?.email) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/score#pricing")}`);
      return;
    }
    try {
      const res = await fetch("/api/score/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/reports", plan }),
      });
      const data = await res.json().catch(() => null);
      if (data?.alreadySubscribed) {
        router.push("/reports");
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch {
      /* no-op */
    }
  };

  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  let host = "";
  try {
    host = new URL(trackUrl.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* not a url yet */
  }

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase scroll-smooth`}
    >
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

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
            <Link href="/reports" className="hidden sm:inline text-white/55 hover:text-white transition-colors">
              my reports
            </Link>
            <a
              href="#top"
              className="bg-[#6ee7ff] text-black font-bold px-4 py-1.5 hover:bg-white transition-colors"
            >
              score my track
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="top" className="relative z-10 max-w-6xl mx-auto px-5 pt-14 sm:pt-20 pb-16 scroll-mt-16">
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
              Instant ai analysis, then honest reactions from a room of real
              listeners.
            </p>

            {/* paste box + preview card */}
            <form onSubmit={start} className="mt-8 max-w-xl">
              {!isUrl ? (
                <input
                  type="url"
                  value={trackUrl}
                  onChange={(e) => setTrackUrl(e.target.value)}
                  placeholder="paste your track link…"
                  className={`${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-5 py-4 text-[15px] text-white placeholder:text-white/30 focus:outline-none transition-colors normal-case`}
                />
              ) : (
                <div
                  className="flex items-center gap-4 bg-[#141414] border p-3.5"
                  style={{
                    borderColor: meta ? ACCENT : "rgba(255,255,255,0.15)",
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
                    ) : (
                      <>
                        <p className="text-[15px] font-bold text-white truncate normal-case">
                          link added
                        </p>
                        <p className={`${mono.className} text-[12px] text-white/45 truncate normal-case mt-0.5`}>
                          {host || "ready to go"}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`${mono.className} text-[11px]`} style={{ color: ACCENT }}>
                      {metaLoading && !meta ? "reading…" : "✓ ready"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTrackUrl("")}
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
                disabled={!isUrl}
                className={`${
                  isUrl
                    ? "bg-[#6ee7ff] text-black hover:bg-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                } group mt-3 w-full inline-flex items-center justify-center gap-2 font-extrabold text-base px-7 py-4 transition-colors`}
              >
                score my track — free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {error && (
                <p className={`${mono.className} text-[13px] text-red-400 mt-3`}>{error}</p>
              )}
            </form>

            {/* trust tags */}
            <div className={`${mono.className} mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50`}>
              <span className="inline-flex items-center gap-1.5" style={{ color: ACCENT }}>
                <Zap className="h-3.5 w-3.5" /> instant ai read
              </span>
              <span className="text-white/20">·</span>
              <span>real listeners</span>
              <span className="text-white/20">·</span>
              <span>unbiased</span>
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
            works with everything you release on
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
          <div className="flex gap-3 w-max px-5" style={{ animation: "marquee 50s linear infinite" }}>
            {[...RECENT, ...RECENT].map((r, i) => (
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
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        </div>
      </section>

      {/* ── REAL SAMPLE (this is what you get) ── */}
      <section id="sample" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ a real read ]</p>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                this is what you get<span style={{ color: ACCENT }}>.</span>
              </h2>
            </div>
            <Link
              href="/report/demo"
              className={`${mono.className} inline-flex items-center gap-1.5 text-[13px] text-black bg-[#6ee7ff] hover:bg-white px-4 py-2 transition-colors shrink-0`}
            >
              open the full sample →
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {/* the score */}
            <div className="bg-[#0a0a0a] p-7 flex flex-col items-center text-center">
              <p className={`${mono.className} text-[12px] text-white/40 mb-5`}>resonance score</p>
              <ScoreRing score={SAMPLE.score} size="lg" dark animate />
              <span
                className={`${mono.className} inline-block mt-6 text-[12px] text-black px-3 py-1`}
                style={{ background: ACCENT }}
              >
                almost there
              </span>
              <p className="text-white/55 text-[14px] normal-case mt-4 leading-relaxed">
                one number, weighed across five dimensions — plus the verdict.
              </p>
            </div>

            {/* reactions */}
            <div className="bg-[#0a0a0a] p-7">
              <p className={`${mono.className} text-[12px] text-white/40 mb-5`}>the room reacts</p>
              <div className="space-y-4">
                {SAMPLE.reactions.map((r) => (
                  <div key={r.lens} className="border-l-2 pl-4" style={{ borderColor: ACCENT }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`${mono.className} text-[11px] text-white/50`}>{r.lens}</span>
                      <Dots count={r.rating} />
                    </div>
                    <p className="text-[14px] font-bold leading-snug">“{r.headline}”</p>
                  </div>
                ))}
              </div>
            </div>

            {/* fixes */}
            <div className="bg-[#0a0a0a] p-7">
              <p className={`${mono.className} text-[12px] text-white/40 mb-5`}>fix these three</p>
              <div className="space-y-3">
                {SAMPLE.fixes.map((f, i) => (
                  <div key={f} className="flex items-start gap-3">
                    <span
                      className={`${mono.className} shrink-0 w-7 h-7 flex items-center justify-center text-[13px] font-bold text-black`}
                      style={{ background: ACCENT }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[14px] font-bold leading-snug pt-1">{f}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/45 text-[13px] normal-case mt-6 leading-relaxed">
                ranked by impact — start at the top and your score moves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (visual flow) ── */}
      <section id="how" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">
            paste. ai read. the room. verdict.
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
            {[
              { n: "01", t: "paste your link", v: <PasteMock /> },
              { n: "02", t: "instant ai read", v: <LogMock /> },
              { n: "03", t: "the real room", v: <RoomMock /> },
              { n: "04", t: "your verdict", v: <VerdictMock /> },
            ].map((s) => (
              <div key={s.n} className="bg-[#0a0a0a] p-6 flex flex-col">
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

          {/* verdict spectrum — solid colour blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-px">
            {[
              ["release ready", "#7cffc4"],
              ["almost there", ACCENT],
              ["needs work", "#b8a4ff"],
              ["not ready", "#ff7a90"],
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
            <span className={`${mono.className} text-[12px] text-white/40 mr-1`}>graded on</span>
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
          <p className={`${mono.className} text-[13px] text-black/50 mb-4`}>[ how the read works ]</p>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-[0.9] max-w-2xl">
            an instant read. then real ears.
          </h2>
          <p className="text-black/70 text-lg mt-6 max-w-lg normal-case">
            Two reads on one track — the deep analysis lands now, real listeners
            land after.
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
              <h3 className="text-2xl font-extrabold tracking-tight">instant deep analysis</h3>
              <p className="text-white/55 text-[14.5px] leading-relaxed normal-case mt-2 mb-6">
                ai listens to the actual audio and scores it across five
                dimensions — with the fixes that matter most.
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
                  ["untitled idea", "2:14"],
                  ["new demo v3", "3:08"],
                  ["late night bounce", "2:41"],
                ].map(([title, len]) => (
                  <div key={title} className="flex items-center gap-3 bg-[#0e0e0e] p-3">
                    <span className="w-9 h-9 bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                      <Play className="h-3.5 w-3.5 text-white/45" />
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

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ pricing ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            one plan. no noise.
          </h2>
          <p className="text-white/60 text-lg mb-12 normal-case max-w-md">
            Submitting and your teaser are free.
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
                {["your score out of 100", "verdict + 5-dimension breakdown", "every reaction headline", "the three things to fix"].map((x) => (
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
                {["everything in free", "every reaction in full", "the complete written read", "the detail behind all three fixes"].map((x) => (
                  <li key={x} className="flex gap-2"><span style={{ color: ACCENT }}>+</span>{x}</li>
                ))}
              </ul>
              <a
                href="#top"
                className="mt-7 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-extrabold py-3.5 transition-colors"
              >
                start free →
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
                {["everything in per-track", "unlock every track you submit", "no $6.95 per report", "your dashboard + history", "cancel anytime — unlocks stay"].map((x) => (
                  <li key={x} className="flex gap-2"><span className="font-bold">+</span>{x}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe("monthly")}
                className="mt-7 block w-full text-center bg-black text-[#6ee7ff] font-extrabold py-3.5 hover:bg-[#141414] transition-colors"
              >
                go unlimited — $19.95/mo →
              </button>
              <button
                onClick={() => handleSubscribe("annual")}
                className={`${mono.className} mt-2 block w-full text-center text-[12px] text-black/55 hover:text-black transition-colors`}
              >
                or pay yearly — $143.40/yr (save 40%)
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

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10">
        <div className={`${mono.className} max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/40`}>
          <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
          <div className="flex items-center gap-6">
            <Link href="/report/demo" className="hover:text-white transition-colors">sample report</Link>
            <Link href="/terms" className="hover:text-white transition-colors">terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">privacy</Link>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* ── ASSIGNMENT MODAL (stays in place, page behind) ── */}
      {phase !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md"
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

            <p className={`${mono.className} text-[13px] text-white/40 mb-3`}>
              {phase === "done" ? "[ analysis complete ]" : "[ analyzing your track… ]"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-7 lowercase">
              {phase === "done" ? (
                <>your read is <span style={{ color: ACCENT }}>ready</span>.</>
              ) : (
                <>reading your track…</>
              )}
            </h2>

            <div
              ref={logRef}
              className={`${mono.className} bg-[#080808] border border-white/12 p-5 text-[13.5px] leading-7 max-h-[260px] overflow-y-auto`}
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
                    <span style={{ color: state === "pending" ? undefined : ACCENT }}>
                      {state === "done" ? "✓" : state === "active" ? "▸" : "·"}
                    </span>{" "}
                    {s}
                    {state === "active" && (
                      <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#6ee7ff] animate-pulse" />
                    )}
                  </div>
                );
              })}
              {phase === "done" && (
                <div className="text-white mt-2 pt-2 border-t border-white/10">
                  <span style={{ color: ACCENT }}>✓</span> done · your read is ready
                </div>
              )}
            </div>

            <div className="mt-6">
              {phase === "done" ? (
                <>
                  <button
                    onClick={seeResults}
                    disabled={busy}
                    className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors disabled:opacity-60"
                  >
                    {busy ? "opening…" : "see results"}
                    {!busy && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                  </button>
                  {!session?.user && (
                    <p className={`${mono.className} text-[12px] text-white/35 mt-3 text-center`}>
                      quick log in to keep your report
                    </p>
                  )}
                  {error && (
                    <p className={`${mono.className} text-[13px] text-red-400 mt-3 text-center`}>{error}</p>
                  )}
                </>
              ) : (
                <p className={`${mono.className} text-[13px] text-white/40`}>hang tight…</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
