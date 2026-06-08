"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { JetBrains_Mono } from "next/font/google";
import { Play, Pause } from "lucide-react";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

// Real listen gate: counts only while the track is actually playing (detected
// via the SoundCloud Widget / YouTube IFrame APIs, native audio events, or a
// manual toggle for sources with no API). Shorter than the artist-side review.
const LISTEN_SECONDS = 45;

type Source = "SOUNDCLOUD" | "YOUTUBE" | "BANDCAMP" | "DIRECT";

// Minimal shapes for the third-party player APIs.
interface SCWidget {
  bind: (event: string, cb: () => void) => void;
}
interface SCApi {
  (iframe: HTMLIFrameElement): SCWidget;
  Events: { PLAY: string; PAUSE: string; FINISH: string };
}
interface YTPlayer {
  getPlayerState: () => number;
  destroy: () => void;
}
type WinWithPlayers = Window & {
  SC?: { Widget: SCApi };
  YT?: { Player: new (id: string, cfg: { events: { onReady?: () => void; onStateChange?: (e: { data: number }) => void } }) => YTPlayer };
  onYouTubeIframeAPIReady?: () => void;
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function ytId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export function ReviewExperience({
  reviewId,
  trackUrl,
  source,
}: {
  reviewId: string;
  trackUrl: string;
  source: Source;
}) {
  const router = useRouter();

  // ── form state ──
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── listen state ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const listened = seconds >= LISTEN_SECONDS;

  const scIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytReady = useRef(false);
  const ytContainerId = useId().replace(/:/g, "");

  // tick while playing
  useEffect(() => {
    if (!isPlaying || listened) return;
    const t = setInterval(() => setSeconds((s) => (s >= LISTEN_SECONDS ? s : s + 1)), 1000);
    return () => clearInterval(t);
  }, [isPlaying, listened]);

  // SoundCloud Widget API — detect play/pause
  useEffect(() => {
    if (source !== "SOUNDCLOUD") return;
    let mounted = true;
    const w = window as WinWithPlayers;

    const init = () => {
      const iframe = scIframeRef.current;
      if (!iframe || !w.SC?.Widget) return;
      const widget = w.SC.Widget(iframe);
      widget.bind(w.SC.Widget.Events.PLAY, () => mounted && setIsPlaying(true));
      widget.bind(w.SC.Widget.Events.PAUSE, () => mounted && setIsPlaying(false));
      widget.bind(w.SC.Widget.Events.FINISH, () => mounted && setIsPlaying(false));
    };

    if (w.SC?.Widget) {
      const t = setTimeout(init, 500);
      return () => { mounted = false; clearTimeout(t); };
    }
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => setTimeout(init, 500);
    document.body.appendChild(script);
    return () => { mounted = false; };
  }, [source]);

  // YouTube IFrame API — detect play/pause
  useEffect(() => {
    if (source !== "YOUTUBE") return;
    let mounted = true;
    ytReady.current = false;
    const w = window as WinWithPlayers;

    const init = () => {
      if (!w.YT?.Player || !mounted) return;
      try {
        ytPlayerRef.current = new w.YT.Player(ytContainerId, {
          events: {
            onReady: () => { ytReady.current = true; },
            onStateChange: (e) => {
              if (!mounted) return;
              if (e.data === 1) setIsPlaying(true);
              else if (e.data === 2 || e.data === 0) setIsPlaying(false);
            },
          },
        });
      } catch {
        /* iframe not ready */
      }
    };

    if (w.YT?.Player) {
      const t = setTimeout(init, 500);
      return () => { mounted = false; clearTimeout(t); try { ytPlayerRef.current?.destroy(); } catch {} };
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { prev?.(); setTimeout(init, 500); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
    return () => { mounted = false; try { ytPlayerRef.current?.destroy(); } catch {} };
  }, [source, ytContainerId]);

  const valid =
    listened && rating >= 1 && headline.trim().length > 0 && quote.trim().length >= 20;
  const pct = Math.min(100, Math.round((seconds / LISTEN_SECONDS) * 100));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/score-review/${reviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, headline, quote, positive: rating >= 3 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push("/score-review");
      router.refresh();
    } catch {
      setError("Failed to submit. Try again.");
      setSubmitting(false);
    }
  };

  const inputCls = `${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none transition-colors normal-case`;
  const isDirect = source === "DIRECT";
  const needsManual = source === "BANDCAMP" || (isDirect && !/\.(mp3|wav|m4a|ogg|flac)(\?|$)/i.test(trackUrl));

  return (
    <div className="space-y-8">
      {/* ── player ── */}
      <div>
        {source === "SOUNDCLOUD" ? (
          <iframe
            ref={scIframeRef}
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%236ee7ff&visual=true`}
            className="w-full h-[166px] border border-white/10"
            allow="autoplay; encrypted-media"
            title="track"
          />
        ) : source === "YOUTUBE" ? (
          <iframe
            id={ytContainerId}
            src={`https://www.youtube.com/embed/${ytId(trackUrl)}?enablejsapi=1`}
            className="w-full aspect-video border border-white/10"
            allow="autoplay; encrypted-media"
            title="track"
          />
        ) : isDirect && !needsManual ? (
          <audio
            src={trackUrl}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
          />
        ) : (
          <a
            href={trackUrl}
            target="_blank"
            rel="noreferrer"
            className={`${mono.className} inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 text-sm transition-colors`}
          >
            open the track ↗
          </a>
        )}
      </div>

      {/* ── listen gate ── */}
      <div
        className="border p-4"
        style={{
          borderColor: listened ? "rgba(110,231,255,0.35)" : "rgba(255,255,255,0.12)",
          background: listened ? "rgba(110,231,255,0.06)" : "#101010",
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className={`${mono.className} text-[12px]`} style={{ color: listened ? ACCENT : "rgba(255,255,255,0.6)" }}>
            {listened
              ? "✓ listened — your reaction's unlocked"
              : isPlaying
              ? "listening… keep it playing"
              : needsManual
              ? "press play, then tap “i'm listening”"
              : "press play and give it a real listen"}
          </span>
          <span className={`${mono.className} text-[12px] tabular-nums text-white/45`}>
            {fmt(Math.min(seconds, LISTEN_SECONDS))} / {fmt(LISTEN_SECONDS)}
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.08] overflow-hidden">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%`, background: ACCENT }}
          />
        </div>

        {/* manual toggle for sources with no playback API */}
        {needsManual && !listened && (
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={`${mono.className} mt-3 inline-flex items-center gap-2 text-[12px] px-3 py-2 transition-colors ${
              isPlaying ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#6ee7ff] text-black hover:bg-white"
            }`}
          >
            {isPlaying ? <><Pause className="h-3.5 w-3.5" /> pause</> : <><Play className="h-3.5 w-3.5" /> i&apos;m listening</>}
          </button>
        )}
      </div>

      {/* ── form ── */}
      <form onSubmit={submit} className="space-y-6">
        {/* rating */}
        <div>
          <label className={`${mono.className} block text-[12px] text-white/45 mb-2`}>
            your rating <span style={{ color: ACCENT }}>*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} of 5`}
                className="w-11 h-11 flex items-center justify-center border text-base font-bold transition-colors"
                style={{
                  borderColor: n <= rating ? ACCENT : "rgba(255,255,255,0.15)",
                  background: n <= rating ? ACCENT : "transparent",
                  color: n <= rating ? "#000" : "rgba(255,255,255,0.5)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* headline */}
        <div>
          <label className={`${mono.className} block text-[12px] text-white/45 mb-2`}>
            one-line reaction <span style={{ color: ACCENT }}>*</span>
            <span className="text-white/25"> (shown free on the report)</span>
          </label>
          <input
            type="text"
            value={headline}
            maxLength={140}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. hook caught me straight away"
            className={inputCls}
          />
        </div>

        {/* quote */}
        <div>
          <label className={`${mono.className} block text-[12px] text-white/45 mb-2`}>
            your full reaction <span style={{ color: ACCENT }}>*</span>
            <span className="text-white/25"> (gated until the artist unlocks)</span>
          </label>
          <textarea
            value={quote}
            rows={5}
            maxLength={1200}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="how did it actually land? what worked, where did it lose you? talk like a real listener — honest and specific."
            className={`${inputCls} resize-none`}
          />
          <p className={`${mono.className} text-[11px] text-white/30 mt-1.5`}>
            {quote.trim().length < 20 ? `${20 - quote.trim().length} more characters` : "looks good"}
          </p>
        </div>

        {error && <p className={`${mono.className} text-[13px] text-red-400`}>{error}</p>}

        <button
          type="submit"
          disabled={!valid || submitting}
          className="w-full bg-[#6ee7ff] text-black font-extrabold text-base py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting
            ? "submitting…"
            : !listened
            ? `keep listening… ${fmt(LISTEN_SECONDS - Math.min(seconds, LISTEN_SECONDS))} left`
            : "submit my reaction"}
        </button>
      </form>
    </div>
  );
}
