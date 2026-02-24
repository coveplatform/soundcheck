"use client";

import { useState, useRef, useCallback, useEffect, useId, useMemo } from "react";
import { useListenBehavior, type RawBehaviorEvent } from "@/hooks/use-listen-behavior";
import {
  computeBehavioralAlignment,
  scoreReviewTextQuality,
  scoreTextQuality,
  classifyListenerArchetype,
  computeCredibilityScore,
  detectEngagementAnomalies,
  computeBehavioralFingerprint,
  type ExplicitFeedback,
  type ArchetypeResult,
  type CredibilityResult,
  type EngagementAnomaly,
  type BehavioralFingerprint,
} from "@/lib/feedback-intelligence";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Music,
  Check,
  Download,
  SkipForward,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  Eye,
  ArrowRight,
  Ear,
  Target,
  Brain,
  Radio,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Helpers ─────────────────────────────────────────────────────

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function pct(v: number): string { return `${Math.round(v * 100)}%`; }
function countWords(t: string): number { return t.trim().split(/\s+/).filter(Boolean).length; }

type SourceType = "DIRECT" | "YOUTUBE" | "SOUNDCLOUD" | "BANDCAMP";
function detectSource(url: string): SourceType {
  if (!url) return "DIRECT";
  const l = url.toLowerCase();
  if (l.includes("youtube.com") || l.includes("youtu.be")) return "YOUTUBE";
  if (l.includes("soundcloud.com")) return "SOUNDCLOUD";
  if (l.includes("bandcamp.com")) return "BANDCAMP";
  return "DIRECT";
}
function embedUrl(url: string, st: SourceType): string {
  if (st === "SOUNDCLOUD") return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%239333ea&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
  if (st === "YOUTUBE") { try { const p = new URL(url); let vid = p.searchParams.get("v"); if (!vid) vid = p.pathname.split("/").pop() || ""; return `https://www.youtube.com/embed/${vid}?enablejsapi=1`; } catch { return url; } }
  return url;
}

const SAMPLE_TRACKS = [
  { label: "Custom URL", url: "" },
  { label: "Electronic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { label: "Acoustic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
];

function fiColor(score: number): string {
  if (score >= 5) return "border-emerald-400 bg-emerald-600 text-white";
  if (score >= 4) return "border-lime-400 bg-lime-500 text-white";
  if (score >= 3) return "border-blue-400 bg-blue-500 text-white";
  if (score >= 2) return "border-amber-400 bg-amber-500 text-white";
  return "border-red-400 bg-red-500 text-white";
}
function fiLabel(score: number): string {
  if (score >= 5) return "Hooked — Grabbed you immediately";
  if (score >= 4) return "Into it — Kept your attention";
  if (score >= 3) return "Solid — Decent but didn't blow you away";
  if (score >= 2) return "Meh — Didn't really connect";
  return "Nah — Lost interest quickly";
}

const EVT_ICON: Record<string, string> = { PLAY: "▶", PAUSE: "⏸", SEEK: "⏩", VOLUME: "🔊", MUTE: "🔇", TAB_FOCUS: "👁", TAB_BLUR: "💤" };
const EVT_CLR: Record<string, string> = { PLAY: "text-lime-500", PAUSE: "text-amber-400", SEEK: "text-purple-400", VOLUME: "text-blue-400", MUTE: "text-red-400", TAB_FOCUS: "text-lime-400", TAB_BLUR: "text-white/30" };

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function FeedbackEngineSandbox() {
  // ── Audio ──
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
  const sourceType = detectSource(trackUrl);
  const isEmbedded = sourceType !== "DIRECT";

  // ── Form ──
  const [fiScore, setFiScore] = useState<number>(3);
  const [fiTouched, setFiTouched] = useState(false);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [technicalIssues, setTechnicalIssues] = useState<string[]>([]);
  const [playlistAction, setPlaylistAction] = useState<string | null>(null);
  const [mainFeedback, setMainFeedback] = useState("");
  const [bestMoment, setBestMoment] = useState("");
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);
  const [nextFocus, setNextFocus] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Live text quality ──
  const mainQ = useMemo(() => scoreTextQuality(mainFeedback), [mainFeedback]);
  const bestQ = useMemo(() => scoreTextQuality(bestMoment), [bestMoment]);

  // ── Event log ──
  const [eventLog, setEventLog] = useState<RawBehaviorEvent[]>([]);

  // ── Results ──
  const [results, setResults] = useState<{
    metrics: ReturnType<ReturnType<typeof useListenBehavior>["getMetrics"]>;
    alignment: ReturnType<typeof computeBehavioralAlignment>;
    textQuality: ReturnType<typeof scoreReviewTextQuality>;
    archetype: ArchetypeResult;
    credibility: CredibilityResult;
    anomalies: EngagementAnomaly[];
    fingerprint: BehavioralFingerprint;
  } | null>(null);

  // ── Behavioral hook ──
  const behavior = useListenBehavior({
    trackDuration: duration,
    enabled: !submitted,
    onFlush: (events) => { setEventLog((prev) => [...prev, ...events].slice(-200)); },
  });

  // ── Derived ──
  const mainWords = countWords(mainFeedback);
  const bestWords = countWords(bestMoment);
  const meetsText = mainWords >= 20 && bestWords >= 15;
  const canSubmit = meetsText && fiTouched && wouldListenAgain !== null && playlistAction !== null && qualityLevel !== null && nextFocus !== null;
  const rawLiveMetrics = useMemo(() => behavior.getMetrics(), [behavior, behavior.eventCount]);
  // Guard: when duration isn't loaded yet, the hook uses dur=1 which inflates everything
  const liveMetrics = useMemo(() => {
    if (duration <= 0) return { ...rawLiveMetrics, completionRate: 0, engagementCurve: [] };
    return rawLiveMetrics;
  }, [rawLiveMetrics, duration]);

  // ── Audio controls ──
  const togglePlay = useCallback(() => { if (audioRef.current) { if (isPlaying) audioRef.current.pause(); else audioRef.current.play().catch(() => {}); } }, [isPlaying]);
  const seek = useCallback((t: number) => { if (audioRef.current) audioRef.current.currentTime = t; }, []);
  const toggleMute = useCallback(() => { if (!audioRef.current) return; const m = !isMuted; audioRef.current.muted = m; setIsMuted(m); behavior.onMuteToggle(m, audioRef.current.currentTime); }, [isMuted, behavior]);
  const changeVolume = useCallback((v: number) => { if (!audioRef.current) return; audioRef.current.volume = v; setVolume(v); behavior.onVolumeChange(v, audioRef.current.currentTime); }, [behavior]);

  // ── SoundCloud ──
  useEffect(() => {
    if (sourceType !== "SOUNDCLOUD" || !trackUrl) return;
    let m = true;
    const init = () => { if (!m || !scIframeRef.current || !window.SC?.Widget) return; const SC = window.SC as any; const w = SC.Widget(scIframeRef.current); scWidgetRef.current = w; w.bind(SC.Widget.Events.PLAY, () => { if (m) { setIsPlaying(true); behavior.onPlay(currentTime); } }); w.bind(SC.Widget.Events.PAUSE, () => { if (m) { setIsPlaying(false); behavior.onPause(currentTime); } }); };
    if (window.SC?.Widget) { const t = setTimeout(init, 800); return () => { m = false; clearTimeout(t); }; }
    const s = document.createElement("script"); s.src = "https://w.soundcloud.com/player/api.js"; s.async = true; s.onload = () => setTimeout(init, 800); document.body.appendChild(s);
    return () => { m = false; };
  }, [sourceType, trackUrl, behavior, currentTime]);

  // ── YouTube ──
  useEffect(() => {
    if (sourceType !== "YOUTUBE" || !trackUrl) return;
    let m = true; ytReady.current = false;
    const init = () => { if (!m || !window.YT?.Player) return; try { ytPlayerRef.current = new window.YT.Player(ytContainerId, { events: { onReady: () => { ytReady.current = true; }, onStateChange: (e: { data: number }) => { if (!m) return; if (e.data === window.YT!.PlayerState.PLAYING) { setIsPlaying(true); behavior.onPlay(ytPlayerRef.current?.getCurrentTime?.() ?? 0); } else if (e.data === window.YT!.PlayerState.PAUSED) { setIsPlaying(false); behavior.onPause(ytPlayerRef.current?.getCurrentTime?.() ?? 0); } } } }); } catch {} };
    if (window.YT?.Player) { const t = setTimeout(init, 800); return () => { m = false; clearTimeout(t); }; }
    const ex = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { ex?.(); setTimeout(init, 500); }; const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; document.body.appendChild(s);
    return () => { m = false; try { ytPlayerRef.current?.destroy(); } catch {} };
  }, [sourceType, trackUrl, ytContainerId, behavior]);

  // ── Embed polling ──
  useEffect(() => {
    if (!isEmbedded || !trackUrl) return;
    embedPollRef.current = setInterval(() => {
      if (sourceType === "SOUNDCLOUD" && scWidgetRef.current) { scWidgetRef.current.getPosition((ms: number) => { const s = Math.floor(ms / 1000); setCurrentTime(s); behavior.onTimeUpdate(s); }); scWidgetRef.current.getDuration((ms: number) => setDuration(Math.floor(ms / 1000))); }
      else if (sourceType === "YOUTUBE" && ytPlayerRef.current && ytReady.current) { try { const s = Math.floor(ytPlayerRef.current.getCurrentTime()); setCurrentTime(s); behavior.onTimeUpdate(s); setDuration(Math.floor(ytPlayerRef.current.getDuration())); } catch {} }
    }, 1000);
    return () => { if (embedPollRef.current) clearInterval(embedPollRef.current); };
  }, [isEmbedded, sourceType, trackUrl, behavior]);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    const allEvents = behavior.finalFlush();
    const metrics = behavior.getMetrics();
    const impMap: Record<number, string> = { 1: "LOST_INTEREST", 2: "LOST_INTEREST", 3: "DECENT_START", 4: "STRONG_HOOK", 5: "STRONG_HOOK" };
    const explicit: ExplicitFeedback = { firstImpression: impMap[fiScore] ?? null, wouldListenAgain, bestPart: bestMoment, qualityLevel, tooRepetitive: technicalIssues.includes("repetitive") };
    const alignment = computeBehavioralAlignment(metrics, explicit, duration);
    const textQuality = scoreReviewTextQuality({ mainFeedback, bestMoment });
    const archetype = classifyListenerArchetype(metrics, duration);
    const credibility = computeCredibilityScore(metrics, alignment, textQuality, duration);
    const anomalies = detectEngagementAnomalies(metrics, duration);
    const fingerprint = computeBehavioralFingerprint(metrics, alignment, textQuality, duration);
    setResults({ metrics, alignment, textQuality, archetype, credibility, anomalies, fingerprint });
    setSubmitted(true);
    setEventLog((prev) => [...prev, ...allEvents].slice(-200));
  }, [behavior, fiScore, wouldListenAgain, bestMoment, qualityLevel, technicalIssues, mainFeedback, duration]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setSubmitted(false); setResults(null); setFiScore(3); setFiTouched(false); setWouldListenAgain(null); setTechnicalIssues([]); setPlaylistAction(null); setMainFeedback(""); setBestMoment(""); setQualityLevel(null); setNextFocus(null); setEventLog([]);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsPlaying(false); setCurrentTime(0);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // POST-SUBMIT — FULL ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  if (submitted && results) {
    return (
      <div className="min-h-screen bg-[#faf7f2] pb-24">
        {/* Hero — Credibility Grade + Archetype */}
        <div className="bg-white border-b-2 border-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Analysis Complete</p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-[0.95]">
                  FIE Results.
                </h1>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    {results.archetype.label}
                  </span>
                  <span className="text-[10px] text-black/40">{results.archetype.confidence >= 0.7 ? "High confidence" : "Moderate confidence"}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
                <p className={cn("text-6xl font-black leading-none", results.credibility.grade === "A" ? "text-lime-600" : results.credibility.grade === "B" ? "text-purple-600" : results.credibility.grade === "C" ? "text-amber-600" : "text-red-600")}>{results.credibility.grade}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1">{results.credibility.label}</p>
                <p className="text-lg font-black text-black/50 tabular-nums">{results.credibility.score}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Archetype strip */}
        <div className="bg-purple-600 border-b-2 border-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <Brain className="h-4 w-4 text-white flex-shrink-0" />
            <p className="text-sm font-bold text-white">{results.archetype.description}</p>
          </div>
        </div>

        {/* Alignment strip */}
        <div className={cn("border-b-2 border-black", results.alignment.score >= 0.7 ? "bg-lime-400" : results.alignment.score >= 0.4 ? "bg-amber-400" : "bg-red-400")}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <Target className="h-4 w-4 text-black flex-shrink-0" />
            <p className="text-sm font-black text-black">{results.alignment.summary}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Credibility Breakdown + Fingerprint (side by side) ── */}
          <section className="grid lg:grid-cols-2 gap-6">
            {/* Credibility Breakdown */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Review Credibility</p>
              <div className="bg-white border-2 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-black", results.credibility.grade === "A" ? "bg-lime-400 text-black" : results.credibility.grade === "B" ? "bg-purple-400 text-white" : results.credibility.grade === "C" ? "bg-amber-400 text-black" : "bg-red-400 text-white")}>
                    {results.credibility.grade}
                  </div>
                  <div>
                    <p className="text-lg font-black">{results.credibility.label}</p>
                    <p className="text-sm text-black/40">Score: {results.credibility.score}/100</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <CredBar label="Listening Depth" value={results.credibility.breakdown.listeningDepth} />
                  <CredBar label="Focus Consistency" value={results.credibility.breakdown.focusConsistency} />
                  <CredBar label="Feedback Quality" value={results.credibility.breakdown.feedbackQuality} />
                  <CredBar label="Behavior-Word Alignment" value={results.credibility.breakdown.behavioralAlignment} />
                  <CredBar label="Engagement Authenticity" value={results.credibility.breakdown.engagementAuthenticity} />
                </div>
                {results.credibility.insights.length > 0 && (
                  <div className="pt-3 border-t border-black/[0.06] space-y-1">
                    {results.credibility.insights.map((ins, i) => (
                      <p key={i} className="text-[11px] text-black/50 flex items-start gap-1.5">
                        <span className="text-purple-500 mt-0.5">→</span> {ins}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Behavioral Fingerprint Radar */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Behavioral Fingerprint</p>
              <div className="bg-white border-2 border-black rounded-2xl p-5">
                <RadarChart dimensions={results.fingerprint.dimensions} />
                <p className="text-xs text-black/40 mt-3 text-center">{results.fingerprint.summary}</p>
              </div>
            </div>
          </section>

          {/* ── Engagement Anomalies ── */}
          {results.anomalies.length > 0 && (
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Engagement Anomalies ({results.anomalies.length})</p>
              <div className="space-y-2">
                {results.anomalies.map((a, i) => (
                  <div key={i} className={cn("border-2 rounded-2xl p-4 flex items-start gap-3", a.severity === "high" ? "bg-purple-50 border-purple-400" : a.severity === "medium" ? "bg-blue-50 border-blue-300" : "bg-white border-black/10")}>
                    <span className="text-2xl flex-shrink-0">{a.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-black">{a.label}</p>
                        <span className="text-[9px] font-mono text-black/30">@{fmt(a.timestamp)}</span>
                        <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full", a.severity === "high" ? "bg-purple-200 text-purple-800" : a.severity === "medium" ? "bg-blue-200 text-blue-800" : "bg-neutral-200 text-neutral-600")}>{a.severity}</span>
                      </div>
                      <p className="text-xs text-black/50 mt-0.5">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Archetype Detail ── */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Listener Archetype</p>
            <div className="bg-neutral-900 border-2 border-black rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center border-2 border-white/20">
                  <Ear className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xl font-black">{results.archetype.label}</p>
                  <p className="text-xs text-white/40">Confidence: {pct(results.archetype.confidence)}</p>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-3">{results.archetype.description}</p>
              {results.archetype.traits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {results.archetype.traits.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/10 text-white/60 border border-white/10">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Behavioral Intelligence ── */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Behavioral Intelligence</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <StatBlock label="Completion" value={pct(results.metrics.completionRate)} good={results.metrics.completionRate >= 0.6} />
              <StatBlock label="Attention" value={pct(results.metrics.attentionScore)} good={results.metrics.attentionScore >= 0.6} />
              <StatBlock label="Unique Seconds" value={String(results.metrics.uniqueSecondsHeard)} good={results.metrics.uniqueSecondsHeard > 30} />
              <StatBlock label="Total Events" value={String(results.metrics.totalEvents)} good={results.metrics.totalEvents > 5} />
            </div>

            {/* Engagement Heatmap */}
            {duration > 0 && results.metrics.engagementCurve.length > 0 && (
              <div className="bg-white border-2 border-black rounded-2xl p-5 mb-5">
                <p className="text-xs font-black uppercase tracking-wider text-black/40 mb-3">Engagement Heatmap</p>
                <div className="h-12 rounded-xl overflow-hidden flex items-end gap-[1px] bg-black/[0.03]">
                  {results.metrics.engagementCurve.map((v, i) => (
                    <div key={i} className="flex-1 min-w-[3px] rounded-t transition-all" style={{ height: `${Math.max(6, v * 100)}%`, background: v >= 0.8 ? "#a855f7" : v >= 0.6 ? "#c084fc" : v >= 0.3 ? "#e9d5ff" : v > 0 ? "#f5f0ff" : "#fafafa" }} title={`${i * 10}s–${(i + 1) * 10}s: ${pct(v)}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-black/25 mt-1">
                  <span>0:00</span><span>{fmt(results.metrics.engagementCurve.length * 10)}</span>
                </div>
              </div>
            )}

            {/* Zones */}
            <div className="grid sm:grid-cols-3 gap-3">
              <ZoneBlock title="Replay Zones" color="purple" items={results.metrics.replayZones.map(z => `${fmt(z.start)}–${fmt(z.end)} (${z.count}×)`)} />
              <ZoneBlock title="Skip Zones" color="amber" items={results.metrics.skipZones.map(z => `${fmt(z.from)} → ${fmt(z.to)}`)} />
              <ZoneBlock title="Pause Points" color="blue" items={results.metrics.pausePoints.map(p => `${fmt(p.position)} (${Math.round(p.durationMs / 1000)}s)`)} />
            </div>
          </section>

          {/* ── Alignment Signals ── */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Alignment Signals ({results.alignment.signals.length})</p>
            {results.alignment.signals.length === 0 ? (
              <div className="bg-white border-2 border-black/10 rounded-2xl p-6 text-center">
                <p className="text-sm text-black/40">No signals — listen more and fill the form for richer analysis</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.alignment.signals.map((sig, i) => (
                  <div key={i} className={cn("border-2 rounded-2xl p-4 flex items-start gap-3", sig.alignment === "HIGH" ? "bg-lime-50 border-lime-400" : sig.alignment === "LOW" ? "bg-red-50 border-red-400" : sig.alignment === "MODERATE" ? "bg-amber-50 border-amber-400" : "bg-white border-black/10")}>
                    <span className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 border-2 border-black", sig.alignment === "HIGH" ? "bg-lime-400 text-black" : sig.alignment === "LOW" ? "bg-red-400 text-white" : sig.alignment === "MODERATE" ? "bg-amber-400 text-black" : "bg-white text-black/40")}>
                      {sig.alignment === "HIGH" ? "✓" : sig.alignment === "LOW" ? "✗" : "~"}
                    </span>
                    <div>
                      <p className="text-sm font-black text-black">{sig.signal.replace(/_/g, " ")}</p>
                      <p className="text-xs text-black/50 mt-0.5">{sig.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Text Quality ── */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Text Quality Scores</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <StatBlock label="Overall" value={pct(results.textQuality.compositeOverall)} good={results.textQuality.compositeOverall >= 0.4} />
              <StatBlock label="Specificity" value={pct(results.textQuality.compositeSpecificity)} good={results.textQuality.compositeSpecificity >= 0.4} />
              <StatBlock label="Actionability" value={pct(results.textQuality.compositeActionability)} good={results.textQuality.compositeActionability >= 0.4} />
              <StatBlock label="Tech Depth" value={pct(results.textQuality.compositeTechnicalDepth)} good={results.textQuality.compositeTechnicalDepth >= 0.3} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(results.textQuality.fields).map(([field, scores]) => (
                <div key={field} className="bg-white border-2 border-black/10 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-black/40 mb-3">{field === "mainFeedback" ? "Main Feedback" : "Best Moment"}</p>
                  <QBar label="Specificity" value={scores.specificity} />
                  <QBar label="Actionability" value={scores.actionability} />
                  <QBar label="Tech Depth" value={scores.technicalDepth} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Raw Event Log ── */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Raw Events ({eventLog.length})</p>
            <div className="bg-neutral-900 border-2 border-black rounded-2xl p-4 max-h-[240px] overflow-y-auto font-mono text-xs">
              {eventLog.slice(-40).reverse().map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  <span className={EVT_CLR[e.type] ?? "text-white/30"}>{EVT_ICON[e.type]}</span>
                  <span className="text-white/70 font-bold w-20">{e.type}</span>
                  <span className="text-white/30">@{fmt(e.pos)}</span>
                  {e.meta && <span className="text-white/15 truncate">{JSON.stringify(e.meta)}</span>}
                </div>
              ))}
              {eventLog.length === 0 && <p className="text-white/20 text-center py-4">No events captured</p>}
            </div>
          </section>
        </div>

        {/* Reset CTA */}
        <div className="bg-purple-600 border-t-2 border-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4">
            <p className="text-white font-black text-lg">Run another test?</p>
            <button onClick={handleReset} className="bg-white text-black font-black text-sm border-2 border-black px-5 py-2.5 rounded-xl shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // REVIEW FORM — Dashboard aesthetic
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Sandbox</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-[0.95]">
                Feedback<br />Intelligence Engine.
              </h1>
              <p className="text-sm text-black/40 mt-3 max-w-md">
                Play audio. Fill the form. Watch the engine capture your behavior in real-time — then see how it all lines up.
              </p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <p className="text-5xl font-black text-black leading-none tabular-nums">{behavior.eventCount}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1">events</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE INTELLIGENCE STRIP — dark full-bleed ── */}
      <div className="bg-neutral-900 border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Live Intelligence</p>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 leading-none flex items-center gap-2">
                <Radio className="h-4 w-4 text-lime-400 animate-pulse" /> Capturing
              </h2>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{liveMetrics.replayZones.length} replays</span>
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{liveMetrics.skipZones.length} skips</span>
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">{liveMetrics.pausePoints.length} pauses</span>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <DarkStat label="Completion" value={pct(liveMetrics.completionRate)} />
            <DarkStat label="Attention" value={pct(liveMetrics.attentionScore)} />
            <DarkStat label="Unique Secs" value={String(liveMetrics.uniqueSecondsHeard)} />
            <DarkStat label="Events" value={String(liveMetrics.totalEvents)} />
          </div>

          {/* Live engagement heatmap */}
          {duration > 0 && liveMetrics.engagementCurve.length > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Engagement Heatmap</p>
              <div className="h-6 rounded-lg overflow-hidden flex items-end gap-[1px] bg-white/[0.04]">
                {liveMetrics.engagementCurve.map((v, i) => (
                  <div key={i} className="flex-1 min-w-[2px] rounded-t" style={{ height: `${Math.max(8, v * 100)}%`, background: v >= 0.8 ? "#a855f7" : v >= 0.6 ? "#c084fc" : v >= 0.3 ? "#7c3aed40" : v > 0 ? "#7c3aed20" : "transparent" }} />
                ))}
              </div>
            </div>
          )}

          {/* Event stream — last 8 events */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {eventLog.slice(-8).reverse().map((e, i) => (
              <span key={i} className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap border", "bg-white/[0.04] border-white/[0.08]")}>
                <span className={EVT_CLR[e.type]}>{EVT_ICON[e.type]}</span>
                <span className="text-white/50">{e.type}</span>
                <span className="text-white/20 font-mono">@{fmt(e.pos)}</span>
              </span>
            ))}
            {eventLog.length === 0 && <span className="text-white/20 text-xs">Play audio to see events stream here</span>}
          </div>
        </div>
      </div>

      {/* ── AUDIO PLAYER ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-3">Track Source</p>

        {/* Source selection */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SAMPLE_TRACKS.map((t, i) => (
            <button key={i} onClick={() => { if (t.url) { setTrackUrl(t.url); setUseCustomUrl(false); } else { setUseCustomUrl(true); setTrackUrl(customUrl || ""); } }} className={cn("px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all", (t.url ? trackUrl === t.url && !useCustomUrl : useCustomUrl) ? "bg-black text-white border-black" : "bg-white text-black border-black/10 hover:border-black/30")}>
              {t.label}
            </button>
          ))}
        </div>
        {useCustomUrl && (
          <input type="text" placeholder="Paste URL (MP3, YouTube, SoundCloud...)" value={customUrl} onChange={(e) => { setCustomUrl(e.target.value); setTrackUrl(e.target.value.trim() || ""); }} className="w-full px-4 py-3 rounded-xl bg-white border-2 border-black/10 text-sm font-medium placeholder-black/25 outline-none focus:border-black mb-4" />
        )}

        {/* Audio elements */}
        {trackUrl && sourceType === "DIRECT" && (
          <audio ref={audioRef} src={trackUrl}
            onTimeUpdate={() => { if (audioRef.current) { const t = audioRef.current.currentTime; setCurrentTime(t); behavior.onTimeUpdate(t); } }}
            onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
            onPlay={() => { setIsPlaying(true); behavior.onPlay(audioRef.current?.currentTime ?? 0); }}
            onPause={() => { setIsPlaying(false); behavior.onPause(audioRef.current?.currentTime ?? 0); }}
          />
        )}
        {trackUrl && sourceType === "YOUTUBE" && <div className="aspect-video bg-black rounded-2xl overflow-hidden border-2 border-black mb-4"><iframe id={ytContainerId} src={embedUrl(trackUrl, "YOUTUBE")} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /></div>}
        {trackUrl && sourceType === "SOUNDCLOUD" && <div className="h-[166px] rounded-2xl overflow-hidden border-2 border-black mb-4"><iframe ref={scIframeRef} src={embedUrl(trackUrl, "SOUNDCLOUD")} className="w-full h-full" allow="autoplay" scrolling="no" frameBorder="0" /></div>}
        {trackUrl && sourceType === "BANDCAMP" && <div className="mb-4"><iframe src={trackUrl} className="w-full h-[120px] rounded-xl" allow="autoplay" seamless /></div>}

        {/* Waveform / Progress with heatmap */}
        {sourceType === "DIRECT" && trackUrl && (
          <div className="bg-white border-2 border-black rounded-2xl p-5">
            {/* Engagement heatmap on waveform */}
            <div className="mb-2 relative">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/20 mb-1">Waveform Heatmap</p>
              <div className="h-10 rounded-xl overflow-hidden flex items-end gap-[1px] bg-black/[0.02] border border-black/[0.06]">
                {(duration > 0 && liveMetrics.engagementCurve.length > 0 ? liveMetrics.engagementCurve : Array(Math.max(1, Math.ceil((duration || 60) / 10))).fill(0)).map((v, i) => {
                  const barStart = i * 10;
                  const barEnd = (i + 1) * 10;
                  const isCurrent = currentTime >= barStart && currentTime < barEnd;
                  const hasReplay = liveMetrics.replayZones.some(z => z.start < barEnd && z.end > barStart);
                  const hasSkip = liveMetrics.skipZones.some(z => z.from < barEnd && z.to > barStart);
                  let bg = "bg-black/[0.03]";
                  if (v >= 0.8) bg = "bg-purple-500";
                  else if (v >= 0.6) bg = "bg-purple-400";
                  else if (v >= 0.3) bg = "bg-purple-200";
                  else if (v > 0) bg = "bg-purple-100";
                  if (hasReplay) bg = "bg-purple-500";
                  if (hasSkip) bg = "bg-amber-400";
                  return (
                    <div key={i} className={cn("flex-1 min-w-[3px] rounded-t relative transition-all", bg, isCurrent && "ring-2 ring-black ring-offset-1")} style={{ height: `${Math.max(12, (v || 0.05) * 100)}%` }}>
                      {hasReplay && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-b" />}
                      {hasSkip && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t" />}
                    </div>
                  );
                })}
              </div>
              {/* Playhead */}
              {duration > 0 && <div className="absolute bottom-0 h-10 w-[2px] bg-black rounded-full pointer-events-none transition-all" style={{ left: `${(currentTime / duration) * 100}%` }} />}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mb-3 text-[9px] font-bold text-black/30">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-purple-500" /> High engagement</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-purple-200" /> Some engagement</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-400" /> Skipped</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-black/[0.06] rounded-full cursor-pointer overflow-hidden mb-4" onClick={(e) => { if (!duration) return; const r = e.currentTarget.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration); }}>
              <div className="h-full bg-black rounded-full transition-all" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,0.15)] hover:shadow-[1px_1px_0_rgba(0,0,0,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none transition-all">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
                <span className="text-sm font-black font-mono text-black/50">{fmt(currentTime)} / {fmt(duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2", isMuted ? "bg-red-100 border-red-300 text-red-600" : "bg-white border-black/10 text-black/60 hover:border-black/30")}>
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={(e) => changeVolume(parseFloat(e.target.value))} className="w-20 accent-black" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── REVIEW FORM ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* LEFT — Quick Reactions */}
          <div className="space-y-5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Quick Reactions</p>

            {/* First Impression */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
              <Label className="text-sm font-black text-black">First Impression</Label>
              <p className="text-[11px] text-black/40 mt-0.5 mb-3">How did the first 30 seconds hit?</p>
              <div className="grid grid-cols-5 gap-1.5">
                {[{ s: 1, n: "1", l: "Nah" }, { s: 2, n: "2", l: "Meh" }, { s: 3, n: "3", l: "Solid" }, { s: 4, n: "4", l: "Into it" }, { s: 5, n: "5", l: "Hooked" }].map(({ s, n, l }) => (
                  <button key={s} type="button" onClick={() => { setFiScore(s); setFiTouched(true); }} className={cn("flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl border-2 font-black transition-all", fiTouched && fiScore === s ? fiColor(s) : "border-black/10 bg-white hover:border-black/20 text-black/50")}>
                    <span className="text-lg leading-none">{n}</span>
                    <span className="text-[9px] font-bold">{l}</span>
                  </button>
                ))}
              </div>
              {fiTouched && <p className={cn("text-xs font-black px-3 py-2 rounded-lg mt-3", fiColor(fiScore))}>{fiLabel(fiScore)}</p>}
            </div>

            {/* Would Listen Again */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
              <Label className="text-sm font-black text-black">Would you listen again?</Label>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => setWouldListenAgain(true)} className={cn("flex-1 py-3 text-sm font-black rounded-xl border-2 transition-all", wouldListenAgain === true ? "bg-black text-white border-black" : "bg-white text-black border-black/10 hover:border-black/20")}>Yes</button>
                <button type="button" onClick={() => setWouldListenAgain(false)} className={cn("flex-1 py-3 text-sm font-black rounded-xl border-2 transition-all", wouldListenAgain === false ? "bg-black text-white border-black" : "bg-white text-black border-black/10 hover:border-black/20")}>No</button>
              </div>
            </div>

            {/* Technical Issues */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
              <Label className="text-sm font-black text-black">Technical Issues</Label>
              <p className="text-[11px] text-black/40 mt-0.5 mb-3">Optional — select any you noticed</p>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "vocals-buried", l: "Vocals buried" }, { id: "muddy-low", l: "Muddy low end" }, { id: "compressed", l: "Over-compressed" }, { id: "harsh-highs", l: "Harsh highs" }, { id: "narrow-stereo", l: "Narrow stereo" }, { id: "repetitive", l: "Too repetitive" }, { id: "too-long", l: "Too long" }].map((iss) => (
                  <button key={iss.id} type="button" onClick={() => setTechnicalIssues(p => p.includes(iss.id) ? p.filter(x => x !== iss.id) : [...p, iss.id])} className={cn("px-3 py-1.5 text-xs font-black rounded-full border-2 transition-all", technicalIssues.includes(iss.id) ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/10 hover:border-black/20")}>
                    {iss.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Playlist Action */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
              <Label className="text-sm font-black text-black">Playlist Action *</Label>
              <p className="text-[11px] text-black/40 mt-0.5 mb-3">If this came on shuffle, you&apos;d...</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: "ADD_TO_LIBRARY", l: "Add to library", icon: Download }, { id: "LET_PLAY", l: "Let it play", icon: Music }, { id: "SKIP", l: "Skip", icon: SkipForward }, { id: "DISLIKE", l: "Dislike", icon: VolumeX }].map((a) => (
                  <button key={a.id} type="button" onClick={() => setPlaylistAction(a.id)} className={cn("flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl border-2 transition-all", playlistAction === a.id ? "bg-purple-600 text-white border-purple-600" : "bg-white text-black border-black/10 hover:border-black/20")}>
                    <a.icon className="h-3.5 w-3.5" />{a.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality + Next Focus side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border-2 border-black/10 rounded-2xl p-4">
                <Label className="text-xs font-black text-black">Quality *</Label>
                <div className="grid gap-1 mt-2">
                  {[{ id: "PROFESSIONAL", l: "Pro" }, { id: "RELEASE_READY", l: "Release ready" }, { id: "ALMOST_THERE", l: "Almost" }, { id: "DEMO_STAGE", l: "Demo" }, { id: "NOT_READY", l: "Not ready" }].map(lv => (
                    <button key={lv.id} type="button" onClick={() => setQualityLevel(lv.id)} className={cn("text-left py-1.5 px-2.5 rounded-lg text-[11px] font-black border-2 transition-all", qualityLevel === lv.id ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/[0.06] hover:border-black/15")}>{lv.l}</button>
                  ))}
                </div>
              </div>
              <div className="bg-white border-2 border-black/10 rounded-2xl p-4">
                <Label className="text-xs font-black text-black">Next Focus *</Label>
                <div className="grid gap-1 mt-2">
                  {[{ id: "MIXING", l: "Mixing" }, { id: "ARRANGEMENT", l: "Arrangement" }, { id: "SOUND_DESIGN", l: "Sound design" }, { id: "SONGWRITING", l: "Songwriting" }, { id: "PERFORMANCE", l: "Performance" }, { id: "READY_TO_RELEASE", l: "Ship it!" }].map(f => (
                    <button key={f.id} type="button" onClick={() => setNextFocus(f.id)} className={cn("text-left py-1.5 px-2.5 rounded-lg text-[11px] font-black border-2 transition-all", nextFocus === f.id ? "bg-purple-600 text-white border-purple-600" : "bg-white text-black/60 border-black/[0.06] hover:border-black/15")}>{f.l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Written Feedback + Live Scoring */}
          <div className="space-y-5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Written Feedback</p>

            {/* Main Feedback */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
              <Label className="text-sm font-black text-black">Main Feedback *</Label>
              <p className="text-[11px] text-black/40 mt-0.5 mb-3">What&apos;s holding the track back? Be specific — timestamps, elements, frequencies.</p>
              <textarea value={mainFeedback} onChange={(e) => setMainFeedback(e.target.value)} placeholder="E.g., 'The low-mids around 200-300Hz make the mix feel heavy. Try cutting 2-3dB there...'" className="w-full px-3 py-2.5 border-2 border-black/[0.06] rounded-xl text-sm min-h-[130px] resize-none outline-none focus:border-black/20 placeholder:text-black/20" />
              <div className="flex items-center justify-between mt-2">
                <span className={cn("text-xs font-black font-mono", mainWords >= 20 ? "text-lime-600" : "text-black/25")}>{mainWords}/20</span>
                {mainWords >= 20 && <span className="text-[10px] font-black text-lime-600 flex items-center gap-1"><Check className="h-3 w-3" /> Done</span>}
              </div>
              {/* Live text quality */}
              {mainFeedback.length > 15 && (
                <div className="mt-3 pt-3 border-t border-black/[0.04] space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/20">Live Quality Score</p>
                  <QBar label="Specificity" value={mainQ.specificity} />
                  <QBar label="Actionability" value={mainQ.actionability} />
                  <QBar label="Tech Depth" value={mainQ.technicalDepth} />
                </div>
              )}
            </div>

            {/* Best Moment */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-5">
              <Label className="text-sm font-black text-black">Best Moment *</Label>
              <p className="text-[11px] text-black/40 mt-0.5 mb-3">What stood out? What should they keep doing?</p>
              <textarea value={bestMoment} onChange={(e) => setBestMoment(e.target.value)} placeholder="E.g., 'The vocal ad-libs at 2:15 add energy. The synth texture in the breakdown is unique...'" className="w-full px-3 py-2.5 border-2 border-black/[0.06] rounded-xl text-sm min-h-[110px] resize-none outline-none focus:border-black/20 placeholder:text-black/20" />
              <div className="flex items-center justify-between mt-2">
                <span className={cn("text-xs font-black font-mono", bestWords >= 15 ? "text-lime-600" : "text-black/25")}>{bestWords}/15</span>
                {bestWords >= 15 && <span className="text-[10px] font-black text-lime-600 flex items-center gap-1"><Check className="h-3 w-3" /> Done</span>}
              </div>
              {bestMoment.length > 15 && (
                <div className="mt-3 pt-3 border-t border-black/[0.04] space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/20">Live Quality Score</p>
                  <QBar label="Specificity" value={bestQ.specificity} />
                  <QBar label="Actionability" value={bestQ.actionability} />
                  <QBar label="Tech Depth" value={bestQ.technicalDepth} />
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
              <p className="text-xs font-black text-purple-800 mb-2 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Score Higher</p>
              <div className="grid gap-2 text-[10px] text-purple-700/70">
                <p><span className="font-black text-purple-900">Specificity:</span> Use timestamps (1:30), name elements (kick, vocal, pad), reference sections (verse, chorus)</p>
                <p><span className="font-black text-purple-900">Actionability:</span> Give suggestions (try, consider), explain why (because, which causes), compare (instead of X, try Y)</p>
                <p><span className="font-black text-purple-900">Technical:</span> Use production terms (EQ, compression, stereo width), mention dB/Hz values, cover multiple dimensions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBMIT — color-blocked CTA ── */}
      <div className={cn("mt-8 border-t-2 border-black", canSubmit ? "bg-lime-400" : "bg-neutral-200")}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-1", canSubmit ? "text-black/40" : "text-black/25")}>
                {canSubmit ? "Ready to analyze" : "Complete the form"}
              </p>
              <h2 className={cn("text-2xl sm:text-3xl font-black tracking-tight leading-tight", canSubmit ? "text-black" : "text-black/40")}>
                {canSubmit ? "Submit & See Results" : "Fill all required fields"}
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {[
                  { done: fiTouched, l: "Impression" },
                  { done: wouldListenAgain !== null, l: "Listen again" },
                  { done: !!playlistAction, l: "Playlist" },
                  { done: mainWords >= 20, l: "Feedback 20w" },
                  { done: bestWords >= 15, l: "Best moment 15w" },
                  { done: !!qualityLevel, l: "Quality" },
                  { done: !!nextFocus, l: "Focus" },
                ].map(r => (
                  <span key={r.l} className={cn("text-[10px] font-black flex items-center gap-1", r.done ? (canSubmit ? "text-black/60" : "text-black/40") : "text-black/20")}>
                    {r.done ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border-2 border-current" />} {r.l}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={!canSubmit} className={cn("flex-shrink-0 font-black text-base border-2 border-black px-6 py-3 rounded-xl transition-all flex items-center gap-2", canSubmit ? "bg-black text-lime-400 shadow-[4px_4px_0_rgba(0,0,0,0.15)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]" : "bg-black/10 text-black/25 border-black/10 cursor-not-allowed")}>
              Analyze <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatBlock({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={cn("bg-white border-2 rounded-2xl p-4 text-center", good ? "border-purple-300" : "border-black/10")}>
      <p className={cn("text-2xl font-black tabular-nums leading-none", good ? "text-purple-600" : "text-black/40")}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wider text-black/30 mt-1">{label}</p>
    </div>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 text-center">
      <p className="text-lg font-black text-white tabular-nums leading-none">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-wider text-white/30 mt-0.5">{label}</p>
    </div>
  );
}

function QBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-black/35 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-300", value >= 0.5 ? "bg-purple-500" : value >= 0.25 ? "bg-amber-400" : "bg-black/10")} style={{ width: `${Math.max(2, value * 100)}%` }} />
      </div>
      <span className="text-[10px] font-black font-mono text-black/25 w-8 text-right">{pct(value)}</span>
    </div>
  );
}

function ZoneBlock({ title, color, items }: { title: string; color: string; items: string[] }) {
  const styles: Record<string, string> = {
    purple: "bg-purple-50 border-purple-300",
    amber: "bg-amber-50 border-amber-300",
    blue: "bg-blue-50 border-blue-300",
  };
  return (
    <div className={cn("border-2 rounded-2xl p-4", styles[color] ?? styles.purple)}>
      <p className="text-xs font-black mb-2">{title}</p>
      {items.length > 0 ? (
        <div className="space-y-0.5">
          {items.map((item, i) => <p key={i} className="text-[11px] font-mono font-bold text-black/60">{item}</p>)}
        </div>
      ) : (
        <p className="text-[11px] text-black/25 italic">None detected</p>
      )}
    </div>
  );
}

function CredBar({ label, value }: { label: string; value: number }) {
  const good = value >= 60;
  const mid = value >= 35;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-black/35 w-[120px] shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-black/[0.04] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", good ? "bg-purple-500" : mid ? "bg-amber-400" : "bg-red-400")} style={{ width: `${Math.max(3, value)}%` }} />
      </div>
      <span className={cn("text-[10px] font-black font-mono w-8 text-right", good ? "text-purple-600" : mid ? "text-amber-600" : "text-red-500")}>{value}</span>
    </div>
  );
}

function RadarChart({ dimensions }: { dimensions: { axis: string; value: number; label: string }[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const n = dimensions.length;
  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // start from top

  // Compute polygon points for a given radius multiplier
  const ringPoints = (radiusMult: number) =>
    dimensions.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return `${cx + Math.cos(angle) * r * radiusMult},${cy + Math.sin(angle) * r * radiusMult}`;
    }).join(" ");

  // Data polygon
  const dataPoints = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const dr = Math.max(0.05, d.value) * r;
    return `${cx + Math.cos(angle) * dr},${cy + Math.sin(angle) * dr}`;
  }).join(" ");

  return (
    <div className="flex justify-center">
      <svg width={size} height={size + 30} viewBox={`0 0 ${size} ${size + 30}`} className="overflow-visible">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((m) => (
          <polygon key={m} points={ringPoints(m)} fill="none" stroke="black" strokeOpacity={0.06} strokeWidth={1} />
        ))}
        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const angle = startAngle + i * angleStep;
          return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="black" strokeOpacity={0.08} strokeWidth={1} />;
        })}
        {/* Data polygon */}
        <polygon points={dataPoints} fill="#a855f7" fillOpacity={0.15} stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" />
        {/* Data points */}
        {dimensions.map((d, i) => {
          const angle = startAngle + i * angleStep;
          const dr = Math.max(0.05, d.value) * r;
          const px = cx + Math.cos(angle) * dr;
          const py = cy + Math.sin(angle) * dr;
          return <circle key={i} cx={px} cy={py} r={3.5} fill="#a855f7" stroke="white" strokeWidth={2} />;
        })}
        {/* Labels */}
        {dimensions.map((d, i) => {
          const angle = startAngle + i * angleStep;
          const lx = cx + Math.cos(angle) * (r + 18);
          const ly = cy + Math.sin(angle) * (r + 18);
          const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
          return (
            <g key={i}>
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="text-[9px] font-black fill-black/40">{d.axis}</text>
              <text x={lx} y={ly + 11} textAnchor={anchor} dominantBaseline="middle" className="text-[9px] font-mono font-bold fill-purple-600">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
