"use client";

import { useState, useRef, useCallback, useEffect, useId } from "react";
import { useListenBehavior } from "@/hooks/use-listen-behavior";
import {
  computeBehavioralAlignment,
  scoreReviewTextQuality,
  type ExplicitFeedback,
} from "@/lib/feedback-intelligence";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Activity,
  Eye,
  Rewind,
  SkipForward,
  TrendingUp,
  Zap,
  MessageSquare,
  Check,
  RotateCcw,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

type SourceType = "DIRECT" | "YOUTUBE" | "SOUNDCLOUD" | "BANDCAMP";

function detectSourceType(url: string): SourceType {
  if (!url) return "DIRECT";
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YOUTUBE";
  if (lower.includes("soundcloud.com")) return "SOUNDCLOUD";
  if (lower.includes("bandcamp.com")) return "BANDCAMP";
  return "DIRECT";
}

function getEmbedUrl(url: string, sourceType: SourceType): string {
  if (sourceType === "SOUNDCLOUD") {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%239333ea&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
  }
  if (sourceType === "YOUTUBE") {
    try {
      const parsed = new URL(url);
      let videoId = parsed.searchParams.get("v");
      if (!videoId) videoId = parsed.pathname.split("/").pop() || "";
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    } catch {
      return url;
    }
  }
  if (sourceType === "BANDCAMP") {
    // Bandcamp embeds need album/track ID — show the page in an iframe as fallback
    return url;
  }
  return url;
}

// YouTube & SoundCloud types (Window.SC / Window.YT already declared in audio-player.tsx)
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Sample tracks for testing ───────────────────────────────────

const SAMPLE_TRACKS = [
  {
    label: "Paste your own URL",
    url: "",
  },
  {
    label: "Sample — Electronic (SoundHelix)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    label: "Sample — Acoustic (SoundHelix)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
];

// ── First Impression Options ────────────────────────────────────

const VIBE_OPTIONS = [
  { value: "STRONG_HOOK", emoji: "🔥", label: "Instant hook", color: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  { value: "DECENT_START", emoji: "👍", label: "Solid vibe", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { value: "LOST_INTEREST", emoji: "😴", label: "Lost me", color: "bg-amber-100 border-amber-300 text-amber-800" },
];

const LISTEN_AGAIN_OPTIONS = [
  { value: true, emoji: "🔁", label: "Yeah, I'd play this again" },
  { value: false, emoji: "⏭️", label: "Nah, once was enough" },
];

const QUALITY_OPTIONS = [
  { value: "PROFESSIONAL", label: "Pro quality", emoji: "💎" },
  { value: "RELEASE_READY", label: "Almost there", emoji: "✨" },
  { value: "ALMOST_THERE", label: "Getting close", emoji: "🔧" },
  { value: "DEMO_STAGE", label: "Still a demo", emoji: "📝" },
  { value: "NOT_READY", label: "Needs work", emoji: "🚧" },
];

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function FeedbackEngineSandbox() {
  // ── Audio state ──
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement | null>(null);
  const scWidgetRef = useRef<any>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReady = useRef(false);
  const ytContainerId = useId();
  const embedPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [trackUrl, setTrackUrl] = useState(SAMPLE_TRACKS[1].url);
  const [customUrl, setCustomUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const sourceType = detectSourceType(trackUrl);
  const isEmbedded = sourceType !== "DIRECT";

  // ── Form state ──
  const [firstImpression, setFirstImpression] = useState<string | null>(null);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);
  const [bestPart, setBestPart] = useState("");
  const [bestPartTimestamp, setBestPartTimestamp] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ── Results ──
  const [results, setResults] = useState<{
    metrics: ReturnType<ReturnType<typeof useListenBehavior>["getMetrics"]>;
    alignment: ReturnType<typeof computeBehavioralAlignment>;
    textQuality: ReturnType<typeof scoreReviewTextQuality>;
  } | null>(null);

  // ── Behavioral hook ──
  const behavior = useListenBehavior({
    trackDuration: duration,
    enabled: !submitted,
    onFlush: (events) => {
      // In sandbox, just log
      console.log("[FIE Sandbox] Flushed", events.length, "events");
    },
  });

  // ── Audio player wiring ──
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => { /* interrupted — ignore */ });
      }
    }
    // For embeds, playback is controlled via the embed itself
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
    behavior.onMuteToggle(newMuted, audioRef.current.currentTime);
  }, [isMuted, behavior]);

  const changeVolume = useCallback((v: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = v;
    setVolume(v);
    behavior.onVolumeChange(v, audioRef.current.currentTime);
  }, [behavior]);

  // ── SoundCloud Widget API ──
  useEffect(() => {
    if (sourceType !== "SOUNDCLOUD" || !trackUrl) return;
    let mounted = true;

    const initWidget = () => {
      if (!mounted || !scIframeRef.current || !window.SC?.Widget) return;
      const SC = window.SC as any;
      const widget = SC.Widget(scIframeRef.current);
      scWidgetRef.current = widget;
      widget.bind(SC.Widget.Events.PLAY, () => {
        if (mounted) { setIsPlaying(true); behavior.onPlay(currentTime); }
      });
      widget.bind(SC.Widget.Events.PAUSE, () => {
        if (mounted) { setIsPlaying(false); behavior.onPause(currentTime); }
      });
    };

    if (window.SC?.Widget) {
      const t = setTimeout(initWidget, 800);
      return () => { mounted = false; clearTimeout(t); };
    }

    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => setTimeout(initWidget, 800);
    document.body.appendChild(script);
    return () => { mounted = false; };
  }, [sourceType, trackUrl, behavior, currentTime]);

  // ── YouTube IFrame API ──
  useEffect(() => {
    if (sourceType !== "YOUTUBE" || !trackUrl) return;
    let mounted = true;
    ytReady.current = false;

    const initPlayer = () => {
      if (!mounted || !window.YT?.Player) return;
      try {
        ytPlayerRef.current = new window.YT.Player(ytContainerId, {
          events: {
            onReady: () => { ytReady.current = true; },
            onStateChange: (event: { data: number }) => {
              if (!mounted) return;
              if (event.data === window.YT!.PlayerState.PLAYING) {
                setIsPlaying(true);
                behavior.onPlay(ytPlayerRef.current?.getCurrentTime?.() ?? 0);
              } else if (event.data === window.YT!.PlayerState.PAUSED) {
                setIsPlaying(false);
                behavior.onPause(ytPlayerRef.current?.getCurrentTime?.() ?? 0);
              }
            },
          },
        });
      } catch { /* ignore */ }
    };

    if (window.YT?.Player) {
      const t = setTimeout(initPlayer, 800);
      return () => { mounted = false; clearTimeout(t); };
    }

    const existing = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { existing?.(); setTimeout(initPlayer, 500); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      mounted = false;
      try { ytPlayerRef.current?.destroy(); } catch { /* ignore */ }
    };
  }, [sourceType, trackUrl, ytContainerId, behavior]);

  // ── Embed time polling (SC + YT) ──
  useEffect(() => {
    if (!isEmbedded || !trackUrl) return;
    embedPollRef.current = setInterval(() => {
      if (sourceType === "SOUNDCLOUD" && scWidgetRef.current) {
        scWidgetRef.current.getPosition((ms: number) => {
          const s = Math.floor(ms / 1000);
          setCurrentTime(s);
          behavior.onTimeUpdate(s);
        });
        scWidgetRef.current.getDuration((ms: number) => setDuration(Math.floor(ms / 1000)));
      } else if (sourceType === "YOUTUBE" && ytPlayerRef.current && ytReady.current) {
        try {
          const s = Math.floor(ytPlayerRef.current.getCurrentTime());
          setCurrentTime(s);
          behavior.onTimeUpdate(s);
          setDuration(Math.floor(ytPlayerRef.current.getDuration()));
        } catch { /* ignore */ }
      }
    }, 1000);
    return () => { if (embedPollRef.current) clearInterval(embedPollRef.current); };
  }, [isEmbedded, sourceType, trackUrl, behavior]);

  // ── Submit handler ──
  const handleSubmit = useCallback(() => {
    const allEvents = behavior.finalFlush();
    const metrics = behavior.getMetrics();

    const explicit: ExplicitFeedback = {
      firstImpression,
      wouldListenAgain,
      bestPart,
      bestPartTimestamp,
      qualityLevel,
    };

    const alignment = computeBehavioralAlignment(metrics, explicit, duration);

    const textQuality = scoreReviewTextQuality({
      bestPart,
      feedback,
    });

    setResults({ metrics, alignment, textQuality });
    setSubmitted(true);

    console.log("[FIE Sandbox] Raw events:", allEvents.length);
    console.log("[FIE Sandbox] Metrics:", metrics);
    console.log("[FIE Sandbox] Alignment:", alignment);
    console.log("[FIE Sandbox] Text quality:", textQuality);
  }, [behavior, firstImpression, wouldListenAgain, bestPart, bestPartTimestamp, qualityLevel, feedback, duration]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setSubmitted(false);
    setResults(null);
    setFirstImpression(null);
    setWouldListenAgain(null);
    setQualityLevel(null);
    setBestPart("");
    setBestPartTimestamp(null);
    setFeedback("");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Live metrics (update on event count changes)
  const liveMetrics = !submitted ? behavior.getMetrics() : results?.metrics ?? null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Feedback Intelligence Engine</h1>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Sandbox / Proof of Concept</p>
            </div>
          </div>
          {submitted && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Track Selection ── */}
        <div className="mb-6">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
            Track Source
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SAMPLE_TRACKS.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  if (t.url) {
                    setTrackUrl(t.url);
                    setUseCustomUrl(false);
                  } else {
                    setUseCustomUrl(true);
                    setTrackUrl(customUrl || "");
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                  t.url
                    ? trackUrl === t.url && !useCustomUrl
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    : useCustomUrl
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {useCustomUrl && (
            <input
              type="text"
              placeholder="Paste audio URL (.mp3, .wav, etc.)"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                if (e.target.value.trim()) {
                  setTrackUrl(e.target.value.trim());
                } else {
                  setTrackUrl("");
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ═══ LEFT: Audio + Vibe Check Form ═══ */}
          <div className="lg:col-span-3 space-y-6">
            {/* ── Audio Player ── */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {/* Direct audio */}
              {trackUrl && sourceType === "DIRECT" && (
                <audio
                  ref={audioRef}
                  src={trackUrl}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      const t = audioRef.current.currentTime;
                      setCurrentTime(t);
                      behavior.onTimeUpdate(t);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setDuration(audioRef.current.duration);
                  }}
                  onPlay={() => {
                    setIsPlaying(true);
                    behavior.onPlay(audioRef.current?.currentTime ?? 0);
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    behavior.onPause(audioRef.current?.currentTime ?? 0);
                  }}
                />
              )}

              {/* YouTube embed */}
              {trackUrl && sourceType === "YOUTUBE" && (
                <div className="aspect-video bg-black">
                  <iframe
                    id={ytContainerId}
                    src={getEmbedUrl(trackUrl, "YOUTUBE")}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              )}

              {/* SoundCloud embed */}
              {trackUrl && sourceType === "SOUNDCLOUD" && (
                <div className="h-[166px]">
                  <iframe
                    ref={scIframeRef}
                    src={getEmbedUrl(trackUrl, "SOUNDCLOUD")}
                    className="w-full h-full"
                    allow="autoplay"
                    scrolling="no"
                    frameBorder="0"
                  />
                </div>
              )}

              {/* Bandcamp embed */}
              {trackUrl && sourceType === "BANDCAMP" && (
                <div className="p-4">
                  <p className="text-xs text-white/40 mb-2">
                    Bandcamp detected — use the player below. Behavioral tracking active via tab focus.
                  </p>
                  <iframe
                    src={trackUrl}
                    className="w-full h-[120px] rounded-lg"
                    allow="autoplay"
                    seamless
                  />
                </div>
              )}

              {/* Controls: full controls for direct audio, compact status for embeds */}
              {sourceType === "DIRECT" ? (
                <div className="p-5">
                  {/* Waveform-style progress bar */}
                  <div className="relative mb-4">
                    <div
                      className="h-12 rounded-lg bg-white/5 cursor-pointer overflow-hidden relative"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pctX = (e.clientX - rect.left) / rect.width;
                        seek(pctX * duration);
                      }}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 transition-[width] duration-100"
                        style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                      />
                      {/* Engagement curve overlay (if available) */}
                      {liveMetrics && liveMetrics.engagementCurve.length > 0 && (
                        <div className="absolute inset-0 flex items-end gap-px px-1 pb-1">
                          {liveMetrics.engagementCurve.map((val, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 rounded-t-sm min-w-[2px] transition-all duration-300",
                                val >= 0.8 ? "bg-purple-400/60" :
                                val >= 0.4 ? "bg-indigo-400/40" :
                                val > 0 ? "bg-white/15" : "bg-white/5"
                              )}
                              style={{ height: `${Math.max(4, val * 100)}%` }}
                            />
                          ))}
                        </div>
                      )}
                      {/* Playhead */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="h-12 w-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-black" />
                        ) : (
                          <Play className="h-5 w-5 text-black ml-0.5" />
                        )}
                      </button>
                      <span className="text-xs font-mono text-white/50 tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="text-white/40 hover:text-white/70 transition-colors">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => changeVolume(parseFloat(e.target.value))}
                        className="w-20 h-1 accent-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ) : trackUrl ? (
                /* Compact status bar for embed sources */
                <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      sourceType === "YOUTUBE" ? "bg-red-500/20 text-red-400" :
                      sourceType === "SOUNDCLOUD" ? "bg-orange-500/20 text-orange-400" :
                      "bg-teal-500/20 text-teal-400"
                    )}>
                      {sourceType}
                    </span>
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Playing
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-white/40 tabular-nums">
                    {formatTime(currentTime)}{duration > 0 && ` / ${formatTime(duration)}`}
                  </span>
                </div>
              ) : null}
            </div>

            {/* ── Vibe Check Form ── */}
            {!submitted ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
                <div>
                  <p className="text-lg font-black mb-1">Vibe Check</p>
                  <p className="text-xs text-white/40">
                    Imagine you just heard this at a club. Give your honest reaction — we&apos;ll handle the rest.
                  </p>
                </div>

                {/* First Impression */}
                <div>
                  <p className="text-xs font-bold text-white/60 mb-2">First impression?</p>
                  <div className="flex flex-wrap gap-2">
                    {VIBE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFirstImpression(opt.value)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border text-sm font-bold transition-all",
                          firstImpression === opt.value
                            ? opt.color
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        )}
                      >
                        <span className="mr-1.5">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Would Listen Again */}
                <div>
                  <p className="text-xs font-bold text-white/60 mb-2">Would you play this again?</p>
                  <div className="flex flex-wrap gap-2">
                    {LISTEN_AGAIN_OPTIONS.map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setWouldListenAgain(opt.value)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border text-sm font-bold transition-all",
                          wouldListenAgain === opt.value
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        )}
                      >
                        <span className="mr-1.5">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Level */}
                <div>
                  <p className="text-xs font-bold text-white/60 mb-2">Production quality?</p>
                  <div className="flex flex-wrap gap-2">
                    {QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQualityLevel(opt.value)}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                          qualityLevel === opt.value
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        )}
                      >
                        <span className="mr-1">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Best Part */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-white/60">Best moment?</p>
                    <button
                      onClick={() => setBestPartTimestamp(Math.floor(currentTime))}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/50 transition-colors"
                    >
                      📌 Mark {formatTime(currentTime)}
                    </button>
                  </div>
                  {bestPartTimestamp !== null && (
                    <p className="text-[10px] text-purple-400 font-mono mb-1">
                      Marked at {formatTime(bestPartTimestamp)}
                    </p>
                  )}
                  <textarea
                    value={bestPart}
                    onChange={(e) => setBestPart(e.target.value)}
                    placeholder="What moment stood out to you?"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                {/* Main Feedback */}
                <div>
                  <p className="text-xs font-bold text-white/60 mb-2">What would you tell the artist?</p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Be real — what did you feel? What could be better? Be specific if you can."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!firstImpression}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm transition-all",
                    firstImpression
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  <Check className="h-4 w-4 inline-block mr-2 -mt-0.5" />
                  Submit Vibe Check
                </button>
              </div>
            ) : (
              /* ── Post-Submit Results ── */
              <PostSubmitResults results={results!} />
            )}
          </div>

          {/* ═══ RIGHT: Live Behavioral Dashboard ═══ */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden sticky top-20">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold">Live Behavioral Data</span>
                <span className="ml-auto text-[10px] font-mono text-white/30">
                  {behavior.eventCount} events
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Eye className="h-3.5 w-3.5" />}
                    label="Completion"
                    value={liveMetrics ? pct(liveMetrics.completionRate) : "—"}
                    color={
                      liveMetrics && liveMetrics.completionRate >= 0.8 ? "text-emerald-400" :
                      liveMetrics && liveMetrics.completionRate >= 0.5 ? "text-blue-400" : "text-white/50"
                    }
                  />
                  <StatCard
                    icon={<Activity className="h-3.5 w-3.5" />}
                    label="Attention"
                    value={liveMetrics ? pct(liveMetrics.attentionScore) : "—"}
                    color={
                      liveMetrics && liveMetrics.attentionScore >= 0.8 ? "text-emerald-400" :
                      liveMetrics && liveMetrics.attentionScore >= 0.5 ? "text-blue-400" : "text-amber-400"
                    }
                  />
                  <StatCard
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                    label="Unique Seconds"
                    value={liveMetrics ? `${liveMetrics.uniqueSecondsHeard}s` : "—"}
                    color="text-white/70"
                  />
                  <StatCard
                    icon={<Zap className="h-3.5 w-3.5" />}
                    label="First Skip"
                    value={
                      liveMetrics?.firstSkipAt !== null && liveMetrics?.firstSkipAt !== undefined
                        ? formatTime(liveMetrics.firstSkipAt)
                        : "None"
                    }
                    color={liveMetrics?.firstSkipAt ? "text-amber-400" : "text-white/30"}
                  />
                </div>

                {/* Engagement Curve */}
                {liveMetrics && liveMetrics.engagementCurve.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Engagement Curve
                    </p>
                    <div className="h-10 bg-white/5 rounded-lg flex items-end gap-px px-1 pb-1 overflow-hidden">
                      {liveMetrics.engagementCurve.map((val, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-t-sm min-w-[2px]",
                            val >= 0.8 ? "bg-purple-400" :
                            val >= 0.4 ? "bg-indigo-400/70" :
                            val > 0 ? "bg-white/20" : "bg-white/5"
                          )}
                          style={{ height: `${Math.max(4, val * 100)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Replay Zones */}
                {liveMetrics && liveMetrics.replayZones.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Rewind className="h-3 w-3 text-purple-400" />
                      Replay Zones
                    </p>
                    <div className="space-y-1">
                      {liveMetrics.replayZones.slice(0, 5).map((zone, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20"
                        >
                          <span className="text-[10px] font-mono text-purple-300">
                            {formatTime(zone.start)} – {formatTime(zone.end)}
                          </span>
                          <span className="text-[9px] text-purple-400/60 ml-auto">
                            {zone.count}× replayed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skip Zones */}
                {liveMetrics && liveMetrics.skipZones.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <SkipForward className="h-3 w-3 text-amber-400" />
                      Skip Zones
                    </p>
                    <div className="space-y-1">
                      {liveMetrics.skipZones.slice(0, 5).map((zone, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <span className="text-[10px] font-mono text-amber-300">
                            {formatTime(zone.from)} → {formatTime(zone.to)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pause Points */}
                {liveMetrics && liveMetrics.pausePoints.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Pause className="h-3 w-3 text-indigo-400" />
                      Pause Points (&gt;3s)
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {liveMetrics.pausePoints.slice(0, 5).map((p, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-300"
                        >
                          {formatTime(p.position)} ({(p.durationMs / 1000).toFixed(1)}s)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!liveMetrics || behavior.eventCount === 0) && (
                  <div className="text-center py-6">
                    <Activity className="h-8 w-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">
                      Press play to start capturing behavioral data
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Component ─────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-white/30">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">{label}</span>
      </div>
      <p className={cn("text-lg font-black tabular-nums", color)}>{value}</p>
    </div>
  );
}

// ── Post-Submit Results ─────────────────────────────────────────

function PostSubmitResults({
  results,
}: {
  results: {
    metrics: ReturnType<ReturnType<typeof useListenBehavior>["getMetrics"]>;
    alignment: ReturnType<typeof computeBehavioralAlignment>;
    textQuality: ReturnType<typeof scoreReviewTextQuality>;
  };
}) {
  const { metrics, alignment, textQuality } = results;

  return (
    <div className="space-y-4">
      {/* Alignment Card */}
      <div className="rounded-2xl overflow-hidden">
        <div className={cn(
          "h-1.5",
          alignment.score >= 0.7 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
          alignment.score >= 0.4 ? "bg-gradient-to-r from-blue-500 to-indigo-400" :
          "bg-gradient-to-r from-amber-500 to-orange-400"
        )} />
        <div className="bg-white/5 border border-white/10 border-t-0 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-black",
              alignment.score >= 0.7 ? "bg-emerald-500/20 text-emerald-400" :
              alignment.score >= 0.4 ? "bg-blue-500/20 text-blue-400" :
              "bg-amber-500/20 text-amber-400"
            )}>
              {pct(alignment.score)}
            </div>
            <div>
              <p className="text-sm font-black">Behavioral-Explicit Alignment</p>
              <p className="text-xs text-white/40">{alignment.summary}</p>
            </div>
          </div>

          {/* Alignment signals */}
          {alignment.signals.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Signals</p>
              {alignment.signals.map((signal, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 rounded-lg border text-xs",
                    signal.alignment === "HIGH" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" :
                    signal.alignment === "MODERATE" ? "bg-blue-500/10 border-blue-500/20 text-blue-300" :
                    signal.alignment === "LOW" ? "bg-red-500/10 border-red-500/20 text-red-300" :
                    "bg-white/5 border-white/10 text-white/50"
                  )}
                >
                  <span className="font-bold shrink-0 mt-0.5">
                    {signal.alignment === "HIGH" ? "✓" : signal.alignment === "LOW" ? "✗" : "~"}
                  </span>
                  <span>{signal.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Text Quality Card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <p className="text-sm font-black">Text Quality Analysis</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <QualityBar label="Specificity" value={textQuality.compositeSpecificity} />
          <QualityBar label="Actionability" value={textQuality.compositeActionability} />
          <QualityBar label="Technical Depth" value={textQuality.compositeTechnicalDepth} />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
          <span className="text-xs font-bold text-white/40">Overall Quality</span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                textQuality.compositeOverall >= 0.6 ? "bg-emerald-400" :
                textQuality.compositeOverall >= 0.3 ? "bg-blue-400" : "bg-amber-400"
              )}
              style={{ width: `${textQuality.compositeOverall * 100}%` }}
            />
          </div>
          <span className="text-sm font-black tabular-nums text-white/70">
            {pct(textQuality.compositeOverall)}
          </span>
        </div>
      </div>

      {/* Raw Metrics Summary */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Raw Behavioral Metrics</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <MetricRow label="Completion Rate" value={pct(metrics.completionRate)} />
          <MetricRow label="Attention Score" value={pct(metrics.attentionScore)} />
          <MetricRow label="Unique Seconds" value={`${metrics.uniqueSecondsHeard}s`} />
          <MetricRow label="Total Events" value={String(metrics.totalEvents)} />
          <MetricRow label="Replay Zones" value={String(metrics.replayZones.length)} />
          <MetricRow label="Skip Zones" value={String(metrics.skipZones.length)} />
          <MetricRow label="Pause Points" value={String(metrics.pausePoints.length)} />
          <MetricRow
            label="First Skip"
            value={metrics.firstSkipAt !== null ? formatTime(metrics.firstSkipAt) : "None"}
          />
        </div>
      </div>
    </div>
  );
}

function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="h-16 w-full bg-white/5 rounded-lg flex items-end justify-center pb-1 mb-1">
        <div
          className={cn(
            "w-6 rounded-t-sm transition-all",
            value >= 0.6 ? "bg-emerald-400" :
            value >= 0.3 ? "bg-blue-400" : "bg-amber-400"
          )}
          style={{ height: `${Math.max(4, value * 100)}%` }}
        />
      </div>
      <p className="text-[9px] font-bold text-white/40">{label}</p>
      <p className="text-xs font-black text-white/70">{pct(value)}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5">
      <span className="text-white/40">{label}</span>
      <span className="font-bold font-mono text-white/70">{value}</span>
    </div>
  );
}
