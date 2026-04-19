"use client";

import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA — 4 mock reviewers with different archetypes
// ═══════════════════════════════════════════════════════════════

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const TRACK = {
  title: "Midnight Frequencies",
  artist: "You",
  duration: 234, // 3:54
  genre: "Electronic / Ambient",
  submittedAt: "2 days ago",
};

interface MockReviewer {
  id: string;
  name: string;
  avatar: string; // emoji
  archetype: { label: string; confidence: number };
  credibility: { score: number; grade: string; label: string; breakdown: { listeningDepth: number; focusConsistency: number; feedbackQuality: number; behavioralAlignment: number; engagementAuthenticity: number }; insights: string[] };
  fingerprint: { axis: string; value: number; label: string }[];
  metrics: { completionRate: number; attentionScore: number; uniqueSecondsHeard: number; totalEvents: number };
  engagementCurve: number[];
  anomalies: { icon: string; label: string; description: string; timestamp: number; severity: string }[];
  alignmentScore: number;
  alignmentSignals: { signal: string; alignment: string; detail: string }[];
  textQuality: { overall: number; specificity: number; actionability: number; technicalDepth: number };
  feedback: { firstImpression: number; wouldListenAgain: boolean; playlistAction: string; qualityLevel: string; mainFeedback: string; bestMoment: string; technicalIssues: string[] };
}

const REVIEWERS: MockReviewer[] = [
  {
    id: "r1",
    name: "Alex M.",
    avatar: "🎧",
    archetype: { label: "Deep Listener", confidence: 0.92 },
    credibility: { score: 87, grade: "A", label: "Highly Credible", breakdown: { listeningDepth: 95, focusConsistency: 88, feedbackQuality: 82, behavioralAlignment: 85, engagementAuthenticity: 78 }, insights: ["Thorough listening — heard most of the track", "Sustained focus throughout the session", "Feedback contains specific, actionable suggestions", "Listening behavior closely matches written feedback"] },
    fingerprint: [
      { axis: "Completion", value: 0.95, label: "95%" },
      { axis: "Focus", value: 0.88, label: "88%" },
      { axis: "Exploration", value: 0.72, label: "72%" },
      { axis: "Consistency", value: 0.85, label: "85%" },
      { axis: "Text Quality", value: 0.82, label: "82%" },
      { axis: "Alignment", value: 0.85, label: "85%" },
    ],
    metrics: { completionRate: 0.95, attentionScore: 0.88, uniqueSecondsHeard: 210, totalEvents: 34 },
    engagementCurve: [0.9, 0.85, 0.8, 0.92, 0.95, 0.88, 0.7, 0.65, 0.82, 0.9, 0.85, 0.78, 0.72, 0.68, 0.55, 0.62, 0.7, 0.75, 0.82, 0.88, 0.85, 0.9, 0.92, 0.88],
    anomalies: [
      { icon: "🎣", label: "Hook Detected", description: "Strong engagement in the opening (85% avg) — the intro grabbed attention immediately", timestamp: 0, severity: "high" },
      { icon: "🔁", label: "Replay Cluster", description: "Concentrated replay activity around 0:30–0:50 — this section demanded repeated listening", timestamp: 30, severity: "high" },
      { icon: "😴", label: "Listener Fatigue", description: "Sustained engagement decline starting at 2:10 — attention faded 22% across 30 seconds", timestamp: 130, severity: "medium" },
      { icon: "🔄", label: "Second Wind", description: "Engagement recovered at 3:10 after a dip — track pulled the listener back in", timestamp: 190, severity: "medium" },
    ],
    alignmentScore: 0.85,
    alignmentSignals: [
      { signal: "COMPLETION_MATCHES_RATING", alignment: "HIGH", detail: "Listened to 95% of track and rated quality as 'Release ready' — consistent" },
      { signal: "REPLAY_CONFIRMS_BEST_PART", alignment: "HIGH", detail: "Replayed the section they described as the best moment (0:30–0:50)" },
      { signal: "WOULD_LISTEN_AGAIN_MATCHES_BEHAVIOR", alignment: "HIGH", detail: "Said 'Yes' to listen again — behavior shows 95% completion rate supports this" },
    ],
    textQuality: { overall: 0.82, specificity: 0.88, actionability: 0.78, technicalDepth: 0.72 },
    feedback: {
      firstImpression: 5,
      wouldListenAgain: true,
      playlistAction: "ADD_TO_LIBRARY",
      qualityLevel: "RELEASE_READY",
      mainFeedback: "The low-mid frequencies around 200-350Hz are competing with the pad texture in the verse sections. Try a gentle 2dB cut on the pads around that range to let the bass breathe. The stereo width on the synth at 1:20 is really wide — consider narrowing it slightly so the vocal sits more centered. The transition at 2:30 could use a filter sweep or riser to build tension rather than the hard cut.",
      bestMoment: "The atmospheric pad that enters at 0:35 is gorgeous — it creates this space that makes you want to just float in it. The way the beat drops at 1:45 with that sidechained bass is perfect. The vocal processing in the bridge section has this haunting quality that really elevates the whole thing.",
      technicalIssues: ["muddy-low"],
    },
  },
  {
    id: "r2",
    name: "Jordan K.",
    avatar: "🎹",
    archetype: { label: "Engaged Critic", confidence: 0.78 },
    credibility: { score: 72, grade: "B", label: "Credible", breakdown: { listeningDepth: 68, focusConsistency: 75, feedbackQuality: 78, behavioralAlignment: 70, engagementAuthenticity: 65 }, insights: ["Feedback contains specific, actionable suggestions", "Sustained focus throughout the session"] },
    fingerprint: [
      { axis: "Completion", value: 0.72, label: "72%" },
      { axis: "Focus", value: 0.75, label: "75%" },
      { axis: "Exploration", value: 0.55, label: "55%" },
      { axis: "Consistency", value: 0.68, label: "68%" },
      { axis: "Text Quality", value: 0.78, label: "78%" },
      { axis: "Alignment", value: 0.70, label: "70%" },
    ],
    metrics: { completionRate: 0.72, attentionScore: 0.75, uniqueSecondsHeard: 168, totalEvents: 22 },
    engagementCurve: [0.8, 0.75, 0.7, 0.65, 0.72, 0.78, 0.82, 0.85, 0.8, 0.7, 0.55, 0.45, 0.5, 0.55, 0.62, 0.58, 0.52, 0.48, 0.55, 0.6, 0.65, 0.7, 0.72, 0.68],
    anomalies: [
      { icon: "📉", label: "Engagement Cliff", description: "Sharp engagement drop at 1:40 — lost 25% engagement in 10 seconds", timestamp: 100, severity: "high" },
      { icon: "⏭️", label: "Late-Track Skip Pattern", description: "3 skips in the second half vs 0 in the first — possible structural fatigue", timestamp: 117, severity: "medium" },
    ],
    alignmentScore: 0.70,
    alignmentSignals: [
      { signal: "COMPLETION_MATCHES_RATING", alignment: "MODERATE", detail: "Listened to 72% but rated 'Almost there' — partially consistent" },
      { signal: "SKIP_ZONE_MATCHES_WEAKNESS", alignment: "HIGH", detail: "Skipped in the section they identified as needing arrangement work" },
    ],
    textQuality: { overall: 0.78, specificity: 0.82, actionability: 0.75, technicalDepth: 0.68 },
    feedback: {
      firstImpression: 4,
      wouldListenAgain: true,
      playlistAction: "LET_PLAY",
      qualityLevel: "ALMOST_THERE",
      mainFeedback: "The arrangement feels a bit long — the section from 1:40 to 2:20 could be tightened up or have more variation introduced. Consider adding a new element or melodic motif to keep interest. The kick drum could punch harder in the chorus — maybe try parallel compression or boosting the click around 3-5kHz. The reverb tail on the snare is washing out in the busier sections.",
      bestMoment: "The intro sets a great mood immediately. The sound design on the main synth is unique and memorable — it has this organic, evolving quality. The bass tone at 0:45 is really well-designed, warm but still defined.",
      technicalIssues: ["repetitive", "too-long"],
    },
  },
  {
    id: "r3",
    name: "Sam T.",
    avatar: "🎸",
    archetype: { label: "Scanner", confidence: 0.85 },
    credibility: { score: 41, grade: "D", label: "Low Credibility", breakdown: { listeningDepth: 32, focusConsistency: 38, feedbackQuality: 55, behavioralAlignment: 35, engagementAuthenticity: 42 }, insights: ["Limited listening — only heard a small portion", "Attention was fragmented — possible multitasking", "Disconnect between listening behavior and stated opinions"] },
    fingerprint: [
      { axis: "Completion", value: 0.35, label: "35%" },
      { axis: "Focus", value: 0.38, label: "38%" },
      { axis: "Exploration", value: 0.25, label: "25%" },
      { axis: "Consistency", value: 0.30, label: "30%" },
      { axis: "Text Quality", value: 0.55, label: "55%" },
      { axis: "Alignment", value: 0.35, label: "35%" },
    ],
    metrics: { completionRate: 0.35, attentionScore: 0.38, uniqueSecondsHeard: 82, totalEvents: 8 },
    engagementCurve: [0.6, 0.5, 0.3, 0.15, 0, 0, 0, 0, 0, 0, 0.4, 0.3, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.15, 0.1],
    anomalies: [
      { icon: "📉", label: "Engagement Cliff", description: "Sharp engagement drop at 0:30 — lost 35% engagement in 10 seconds", timestamp: 30, severity: "high" },
      { icon: "⏭️", label: "Skip Pattern", description: "Jumped from 0:40 to 1:40 skipping the entire first verse and chorus", timestamp: 40, severity: "high" },
    ],
    alignmentScore: 0.35,
    alignmentSignals: [
      { signal: "LOW_LISTEN_HIGH_RATING", alignment: "LOW", detail: "Only heard 35% of the track but rated quality as 'Almost there' — insufficient listening for this assessment" },
      { signal: "SKIPPED_BEST_PART", alignment: "LOW", detail: "Claimed the chorus was the best part but skipped over most of it" },
    ],
    textQuality: { overall: 0.55, specificity: 0.50, actionability: 0.58, technicalDepth: 0.42 },
    feedback: {
      firstImpression: 3,
      wouldListenAgain: false,
      playlistAction: "SKIP",
      qualityLevel: "ALMOST_THERE",
      mainFeedback: "The mix sounds decent but could be better. The vocals need work and the overall production feels a bit flat. I think adding more layers would help. The ending could be stronger too.",
      bestMoment: "The chorus has a nice energy to it. The melody is catchy and the synths sound cool. Good vibes overall in the hook section.",
      technicalIssues: [],
    },
  },
  {
    id: "r4",
    name: "River L.",
    avatar: "🎤",
    archetype: { label: "Speed Runner", confidence: 0.88 },
    credibility: { score: 62, grade: "C", label: "Moderately Credible", breakdown: { listeningDepth: 78, focusConsistency: 82, feedbackQuality: 45, behavioralAlignment: 55, engagementAuthenticity: 50 }, insights: ["Thorough listening — heard most of the track", "Sustained focus throughout the session", "Feedback lacks specificity — mostly generic comments"] },
    fingerprint: [
      { axis: "Completion", value: 0.90, label: "90%" },
      { axis: "Focus", value: 0.82, label: "82%" },
      { axis: "Exploration", value: 0.15, label: "15%" },
      { axis: "Consistency", value: 0.78, label: "78%" },
      { axis: "Text Quality", value: 0.45, label: "45%" },
      { axis: "Alignment", value: 0.55, label: "55%" },
    ],
    metrics: { completionRate: 0.90, attentionScore: 0.82, uniqueSecondsHeard: 200, totalEvents: 12 },
    engagementCurve: [0.7, 0.7, 0.65, 0.65, 0.7, 0.7, 0.68, 0.65, 0.62, 0.6, 0.62, 0.65, 0.68, 0.7, 0.68, 0.65, 0.62, 0.6, 0.62, 0.65, 0.68, 0.7, 0.68, 0.65],
    anomalies: [],
    alignmentScore: 0.55,
    alignmentSignals: [
      { signal: "FLAT_ENGAGEMENT", alignment: "NEUTRAL", detail: "Very consistent engagement (low variance) — listened but without strong reactions" },
      { signal: "NO_REPLAYS_HIGH_RATING", alignment: "MODERATE", detail: "Rated 'Release ready' but didn't replay any sections — quick judgment" },
    ],
    textQuality: { overall: 0.45, specificity: 0.40, actionability: 0.48, technicalDepth: 0.35 },
    feedback: {
      firstImpression: 4,
      wouldListenAgain: true,
      playlistAction: "LET_PLAY",
      qualityLevel: "RELEASE_READY",
      mainFeedback: "I think the track is solid. The mix sounds clean and the arrangement flows well. Maybe the bridge could have a bit more energy. Otherwise it sounds great and ready to go.",
      bestMoment: "Love the overall vibe and production quality. The drop hits well and the melody is memorable. Nice work on this one.",
      technicalIssues: [],
    },
  },
];

// ── Aggregate stats from all reviewers ──
const AGG = {
  avgCredibility: Math.round(REVIEWERS.reduce((s, r) => s + r.credibility.score, 0) / REVIEWERS.length),
  avgAlignment: Math.round(REVIEWERS.reduce((s, r) => s + r.alignmentScore * 100, 0) / REVIEWERS.length),
  avgTextQuality: Math.round(REVIEWERS.reduce((s, r) => s + r.textQuality.overall * 100, 0) / REVIEWERS.length),
  avgCompletion: Math.round(REVIEWERS.reduce((s, r) => s + r.metrics.completionRate * 100, 0) / REVIEWERS.length),
  wouldListenAgain: REVIEWERS.filter(r => r.feedback.wouldListenAgain).length,
  consensusQuality: (() => {
    const counts: Record<string, number> = {};
    REVIEWERS.forEach(r => { counts[r.feedback.qualityLevel] = (counts[r.feedback.qualityLevel] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, " ") ?? "Mixed";
  })(),
  // Build composite engagement curve (average all)
  compositeEngagement: (() => {
    const len = Math.max(...REVIEWERS.map(r => r.engagementCurve.length));
    return Array.from({ length: len }, (_, i) => {
      const vals = REVIEWERS.map(r => r.engagementCurve[i] ?? 0).filter(v => v > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
  })(),
};

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function ArtistFIEView() {
  const [expandedReviewer, setExpandedReviewer] = useState<string | null>(REVIEWERS[0].id);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">

      {/* ── HERO ── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link href="/sandbox/feedback-engine" className="inline-flex items-center gap-1.5 text-xs font-black text-black/40 hover:text-black/60 mb-4 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sandbox
          </Link>
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Artist View — FIE Insights</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-[0.95]">
                {TRACK.title}
              </h1>
              <p className="text-sm text-black/40 mt-2">{TRACK.genre} · {TRACK.duration ? fmt(TRACK.duration) : ""} · Submitted {TRACK.submittedAt}</p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <p className="text-5xl font-black text-black leading-none tabular-nums">{REVIEWERS.length}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1">reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST OVERVIEW STRIP ── */}
      <div className="bg-purple-600 border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Feedback Intelligence Summary</p>
          <p className="text-sm text-white/80 leading-relaxed">
            <span className="font-black text-white">{REVIEWERS.filter(r => r.credibility.score >= 65).length} of {REVIEWERS.length} reviewers</span> passed credibility checks.
            Your feedback is weighted by how thoroughly each person actually listened — not just what they wrote.
          </p>
        </div>
      </div>

      {/* ── AGGREGATE STATS ── */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">Aggregate Intelligence</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <AgStat label="Avg Credibility" value={`${AGG.avgCredibility}`} sub="/100" good={AGG.avgCredibility >= 65} />
            <AgStat label="Avg Alignment" value={`${AGG.avgAlignment}%`} good={AGG.avgAlignment >= 60} />
            <AgStat label="Text Quality" value={`${AGG.avgTextQuality}%`} good={AGG.avgTextQuality >= 60} />
            <AgStat label="Avg Completion" value={`${AGG.avgCompletion}%`} good={AGG.avgCompletion >= 60} />
            <AgStat label="Listen Again" value={`${AGG.wouldListenAgain}/${REVIEWERS.length}`} good={AGG.wouldListenAgain >= REVIEWERS.length / 2} />
          </div>
        </div>
      </div>

      {/* ── COMPOSITE ENGAGEMENT HEATMAP ── */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Composite Engagement Map</p>
              <p className="text-xs text-white/30 mt-1">Average engagement across all {REVIEWERS.length} reviewers — where they tuned in and where they dropped off</p>
            </div>
            <span className="text-xs font-mono text-white/20">{fmt(TRACK.duration)}</span>
          </div>

          {/* Multi-layer heatmap */}
          <div className="space-y-1.5">
            {/* Composite */}
            <div>
              <p className="text-[9px] font-black text-white/15 mb-1">ALL REVIEWERS (avg)</p>
              <div className="h-8 rounded-lg overflow-hidden flex items-end gap-[2px] bg-white/[0.02]">
                {AGG.compositeEngagement.map((v, i) => (
                  <div key={i} className="flex-1 min-w-[3px] rounded-t transition-all" style={{ height: `${Math.max(6, v * 100)}%`, background: v >= 0.7 ? "#a855f7" : v >= 0.5 ? "#c084fc" : v >= 0.25 ? "rgba(168,85,247,0.3)" : v > 0 ? "rgba(168,85,247,0.1)" : "transparent" }} />
                ))}
              </div>
            </div>

            {/* Per-reviewer mini heatmaps */}
            {REVIEWERS.map(r => (
              <div key={r.id}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-black text-white/15 w-28 truncate">{r.avatar} {r.name}</span>
                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full", gradeColor(r.credibility.grade))}>{r.credibility.grade}</span>
                </div>
                <div className="h-3 rounded overflow-hidden flex items-end gap-[1px] bg-white/[0.02]">
                  {r.engagementCurve.map((v, i) => (
                    <div key={i} className="flex-1 min-w-[2px] rounded-t" style={{ height: `${Math.max(8, v * 100)}%`, background: v >= 0.7 ? "#a855f7" : v >= 0.4 ? "rgba(168,85,247,0.4)" : v > 0 ? "rgba(168,85,247,0.12)" : "transparent" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline markers */}
          <div className="flex justify-between text-[9px] font-mono text-white/15 mt-2">
            <span>0:00</span>
            <span>{fmt(Math.floor(TRACK.duration / 4))}</span>
            <span>{fmt(Math.floor(TRACK.duration / 2))}</span>
            <span>{fmt(Math.floor(TRACK.duration * 3 / 4))}</span>
            <span>{fmt(TRACK.duration)}</span>
          </div>
        </div>
      </div>

      {/* ── KEY INSIGHTS (auto-generated from anomalies) ── */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">Key Insights</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <InsightCard icon="🎣" title="Strong Opening" desc={`${REVIEWERS.filter(r => r.engagementCurve[0] > 0.6).length} of ${REVIEWERS.length} reviewers were engaged in the first 10 seconds. Your intro is working.`} color="purple" />
            <InsightCard icon="📉" title="Drop at 1:40" desc={`${REVIEWERS.filter(r => r.anomalies.some(a => a.timestamp >= 90 && a.timestamp <= 110)).length} reviewers lost engagement around 1:40. Consider tightening this section or adding variation.`} color="amber" />
            <InsightCard icon="⚠️" title="1 Low-Credibility Review" desc="Sam T. only listened to 35% of your track but still gave a quality rating. Their feedback has been de-weighted in the aggregate." color="red" />
            <InsightCard icon="✅" title="Behavioral Consensus" desc={`Credible reviewers agree: quality is "${AGG.consensusQuality}". The highest-trust reviewer gave the most detailed technical feedback.`} color="lime" />
          </div>
        </div>
      </div>

      {/* ── REVIEWER CARDS ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">Individual Reviews — Sorted by Credibility</p>
        <div className="space-y-3">
          {[...REVIEWERS].sort((a, b) => b.credibility.score - a.credibility.score).map(r => (
            <ReviewerCard key={r.id} reviewer={r} expanded={expandedReviewer === r.id} onToggle={() => setExpandedReviewer(expandedReviewer === r.id ? null : r.id)} trackDuration={TRACK.duration} />
          ))}
        </div>
      </div>

      {/* ── TRUST METHODOLOGY ── */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-purple-400" />
              <p className="text-sm font-black text-white">How Credibility Works</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-[11px] text-white/35 leading-relaxed">
              <div>
                <p className="text-white/60 font-black mb-1">We track behavior, not just words</p>
                <p>Every reviewer&apos;s listening behavior is silently captured — play/pause patterns, skip zones, replay areas, tab focus, and engagement curves. This creates an objective behavioral fingerprint.</p>
              </div>
              <div>
                <p className="text-white/60 font-black mb-1">Credibility = Behavior + Quality + Alignment</p>
                <p>We score each review on 5 dimensions: how much they listened, how focused they were, how specific their text is, whether their behavior matches their words, and whether the engagement pattern looks authentic.</p>
              </div>
              <div>
                <p className="text-white/60 font-black mb-1">Low-trust reviews are flagged, not hidden</p>
                <p>We show you every review but clearly label which ones were backed by deep listening and which were surface-level. The aggregate weights credible reviewers more heavily.</p>
              </div>
              <div>
                <p className="text-white/60 font-black mb-1">Anomalies reveal what&apos;s really happening</p>
                <p>Hook detection, engagement cliffs, replay clusters, and fatigue points are algorithmically detected from the behavioral data — giving you insights no written review could provide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function gradeColor(grade: string): string {
  if (grade === "A") return "bg-lime-500/20 text-lime-400 border border-lime-500/20";
  if (grade === "B") return "bg-purple-500/20 text-purple-300 border border-purple-500/20";
  if (grade === "C") return "bg-amber-500/20 text-amber-300 border border-amber-500/20";
  if (grade === "D") return "bg-red-500/20 text-red-400 border border-red-500/20";
  return "bg-red-500/30 text-red-400 border border-red-500/30";
}

function AgStat({ label, value, sub, good }: { label: string; value: string; sub?: string; good: boolean }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      <p className={cn("text-2xl font-black tabular-nums leading-none", good ? "text-purple-400" : "text-white/30")}>
        {value}{sub && <span className="text-sm text-white/20">{sub}</span>}
      </p>
      <p className="text-[9px] font-black uppercase tracking-wider text-white/25 mt-1.5">{label}</p>
    </div>
  );
}

function InsightCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  const colorMap: Record<string, string> = {
    purple: "border-purple-500/30 bg-purple-500/[0.06]",
    amber: "border-amber-500/30 bg-amber-500/[0.06]",
    red: "border-red-500/30 bg-red-500/[0.06]",
    lime: "border-lime-500/30 bg-lime-500/[0.06]",
  };
  return (
    <div className={cn("border rounded-2xl p-4 flex items-start gap-3", colorMap[color] ?? colorMap.purple)}>
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ReviewerCard({ reviewer: r, expanded, onToggle, trackDuration }: { reviewer: MockReviewer; expanded: boolean; onToggle: () => void; trackDuration: number }) {
  const lowTrust = r.credibility.score < 50;

  return (
    <div className={cn("border rounded-2xl overflow-hidden transition-all", lowTrust ? "border-red-500/20 bg-red-500/[0.03]" : "border-white/[0.08] bg-white/[0.03]")}>
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
        <span className="text-2xl">{r.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white">{r.name}</p>
            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", gradeColor(r.credibility.grade))}>{r.credibility.grade} — {r.credibility.label}</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30">{r.archetype.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-white/25">
            <span>Credibility: {r.credibility.score}/100</span>
            <span>·</span>
            <span>Listened: {Math.round(r.metrics.completionRate * 100)}%</span>
            <span>·</span>
            <span>Alignment: {Math.round(r.alignmentScore * 100)}%</span>
            <span>·</span>
            <span>Text: {Math.round(r.textQuality.overall * 100)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mini engagement sparkline */}
          <div className="hidden sm:flex items-end gap-[1px] h-5 w-20">
            {r.engagementCurve.filter((_, i) => i % 3 === 0).map((v, i) => (
              <div key={i} className="flex-1 rounded-t min-w-[2px]" style={{ height: `${Math.max(10, v * 100)}%`, background: v >= 0.6 ? "#a855f7" : v >= 0.3 ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-5 space-y-6">

          {/* Low trust warning */}
          {lowTrust && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-red-400">Low Credibility Warning</p>
                <p className="text-[11px] text-white/35 mt-0.5">This reviewer&apos;s behavior suggests limited engagement with your track. Their feedback has been de-weighted in the aggregate scores.</p>
              </div>
            </div>
          )}

          {/* Credibility breakdown + Engagement */}
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Credibility */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Credibility Breakdown</p>
              <div className="space-y-2">
                <CredDimension label="Listening Depth" value={r.credibility.breakdown.listeningDepth} />
                <CredDimension label="Focus Consistency" value={r.credibility.breakdown.focusConsistency} />
                <CredDimension label="Feedback Quality" value={r.credibility.breakdown.feedbackQuality} />
                <CredDimension label="Behavior-Word Align" value={r.credibility.breakdown.behavioralAlignment} />
                <CredDimension label="Authenticity" value={r.credibility.breakdown.engagementAuthenticity} />
              </div>
              {r.credibility.insights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1">
                  {r.credibility.insights.map((ins, i) => (
                    <p key={i} className="text-[10px] text-white/25 flex items-start gap-1.5">
                      <span className="text-purple-500 mt-px">→</span> {ins}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Engagement curve */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Engagement Over Time</p>
              <div className="h-16 rounded-lg overflow-hidden flex items-end gap-[2px] bg-white/[0.02] mb-2">
                {r.engagementCurve.map((v, i) => (
                  <div key={i} className="flex-1 min-w-[3px] rounded-t transition-all" style={{ height: `${Math.max(6, v * 100)}%`, background: v >= 0.7 ? "#a855f7" : v >= 0.4 ? "rgba(168,85,247,0.4)" : v > 0 ? "rgba(168,85,247,0.12)" : "transparent" }} />
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-mono text-white/15">
                <span>0:00</span><span>{fmt(trackDuration)}</span>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                <MiniStat label="Complete" value={`${Math.round(r.metrics.completionRate * 100)}%`} />
                <MiniStat label="Attention" value={`${Math.round(r.metrics.attentionScore * 100)}%`} />
                <MiniStat label="Unique" value={`${r.metrics.uniqueSecondsHeard}s`} />
                <MiniStat label="Events" value={`${r.metrics.totalEvents}`} />
              </div>
            </div>
          </div>

          {/* Anomalies */}
          {r.anomalies.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Detected Anomalies</p>
              <div className="flex flex-wrap gap-2">
                {r.anomalies.map((a, i) => (
                  <span key={i} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border", a.severity === "high" ? "bg-purple-500/10 border-purple-500/20 text-purple-300" : "bg-white/[0.04] border-white/[0.06] text-white/40")}>
                    {a.icon} {a.label} <span className="text-white/20 font-mono">@{fmt(a.timestamp)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alignment signals */}
          {r.alignmentSignals.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Alignment Signals</p>
              <div className="space-y-1.5">
                {r.alignmentSignals.map((sig, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5", sig.alignment === "HIGH" ? "bg-lime-500/20 text-lime-400" : sig.alignment === "LOW" ? "bg-red-500/20 text-red-400" : sig.alignment === "MODERATE" ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-white/30")}>
                      {sig.alignment === "HIGH" ? "✓" : sig.alignment === "LOW" ? "✗" : "~"}
                    </span>
                    <p className="text-[10px] text-white/35">{sig.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual feedback content */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Main Feedback</p>
              <p className="text-[11px] text-white/50 leading-relaxed">{r.feedback.mainFeedback}</p>
              <div className="flex gap-3 mt-3 pt-2 border-t border-white/[0.04]">
                <span className="text-[9px] text-white/20">Spec: <span className={cn("font-black", r.textQuality.specificity >= 0.5 ? "text-purple-400" : "text-white/30")}>{Math.round(r.textQuality.specificity * 100)}%</span></span>
                <span className="text-[9px] text-white/20">Act: <span className={cn("font-black", r.textQuality.actionability >= 0.5 ? "text-lime-400" : "text-white/30")}>{Math.round(r.textQuality.actionability * 100)}%</span></span>
                <span className="text-[9px] text-white/20">Tech: <span className={cn("font-black", r.textQuality.technicalDepth >= 0.5 ? "text-cyan-400" : "text-white/30")}>{Math.round(r.textQuality.technicalDepth * 100)}%</span></span>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Best Moment</p>
              <p className="text-[11px] text-white/50 leading-relaxed">{r.feedback.bestMoment}</p>
              <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/[0.04]">
                <span className="text-[9px] font-black text-white/20">Impression: <span className="text-purple-300">{r.feedback.firstImpression}/5</span></span>
                <span className="text-[9px] font-black text-white/20">Again: <span className={r.feedback.wouldListenAgain ? "text-lime-400" : "text-red-400"}>{r.feedback.wouldListenAgain ? "Yes" : "No"}</span></span>
                <span className="text-[9px] font-black text-white/20">Playlist: <span className="text-white/40">{r.feedback.playlistAction.replace(/_/g, " ")}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CredDimension({ label, value }: { label: string; value: number }) {
  const good = value >= 65;
  const mid = value >= 40;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-white/25 w-[110px] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", good ? "bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.3)]" : mid ? "bg-amber-500/60" : "bg-red-500/50")} style={{ width: `${Math.max(3, value)}%` }} />
      </div>
      <span className={cn("text-[10px] font-black font-mono w-7 text-right", good ? "text-purple-400" : mid ? "text-amber-400" : "text-red-400")}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.04] rounded-lg p-2 text-center">
      <p className="text-xs font-black text-white/50 tabular-nums">{value}</p>
      <p className="text-[8px] font-black text-white/15 uppercase">{label}</p>
    </div>
  );
}
