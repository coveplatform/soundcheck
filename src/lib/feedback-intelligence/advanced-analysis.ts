/**
 * Feedback Intelligence Engine — Advanced Analysis
 *
 * Higher-order algorithms that combine behavioral metrics, text quality,
 * and alignment data to produce rich, multi-dimensional insights.
 *
 * All functions are pure and stateless — safe for client or server use.
 */

import type { BehaviorMetrics } from "@/hooks/use-listen-behavior";
import type { AlignmentResult } from "./behavior-analysis";
import type { ReviewTextQualityResult } from "./text-quality";

// ═══════════════════════════════════════════════════════════════
// 1. LISTENER ARCHETYPE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

export type ListenerArchetype =
  | "DEEP_LISTENER"
  | "ENGAGED_CRITIC"
  | "SCANNER"
  | "DISTRACTED"
  | "SPEED_RUNNER"
  | "CASUAL_LISTENER";

export interface ArchetypeResult {
  archetype: ListenerArchetype;
  label: string;
  description: string;
  confidence: number; // 0-1
  traits: string[];   // key behavioral traits that led to this classification
}

const ARCHETYPE_META: Record<ListenerArchetype, { label: string; description: string }> = {
  DEEP_LISTENER: {
    label: "Deep Listener",
    description: "Fully immersed — high completion, sustained attention, and replayed key sections to form a thorough opinion.",
  },
  ENGAGED_CRITIC: {
    label: "Engaged Critic",
    description: "Analytical approach — paused at key moments to take notes, moderate replays, and maintained focus throughout.",
  },
  SCANNER: {
    label: "Scanner",
    description: "Sampled the track — skipped through multiple sections, low completion, looking for standout moments.",
  },
  DISTRACTED: {
    label: "Distracted Reviewer",
    description: "Attention divided — frequent tab switches, long pauses, and inconsistent engagement patterns.",
  },
  SPEED_RUNNER: {
    label: "Speed Runner",
    description: "Quick pass — listened through without replaying or pausing, forming a rapid first impression.",
  },
  CASUAL_LISTENER: {
    label: "Casual Listener",
    description: "Moderate engagement — listened to a reasonable portion without extreme patterns in either direction.",
  },
};

/**
 * Classify a reviewer's listening behavior into a named archetype
 * using a weighted scoring system across multiple behavioral dimensions.
 */
export function classifyListenerArchetype(
  metrics: BehaviorMetrics,
  trackDuration: number
): ArchetypeResult {
  const dur = trackDuration > 0 ? trackDuration : 1;
  const traits: string[] = [];

  // ── Compute dimension scores ──
  const completionHigh = metrics.completionRate >= 0.85;
  const completionMid = metrics.completionRate >= 0.5;
  const completionLow = metrics.completionRate < 0.5;

  const attentionHigh = metrics.attentionScore >= 0.8;
  const attentionLow = metrics.attentionScore < 0.5;

  const hasReplays = metrics.replayZones.length > 0;
  const manyReplays = metrics.replayZones.length >= 3;
  const hasSkips = metrics.skipZones.length > 0;
  const manySkips = metrics.skipZones.length >= 3;

  const hasPauses = metrics.pausePoints.length > 0;
  const longPauses = metrics.pausePoints.some(p => p.durationMs > 10000);

  const uniqueRatio = dur > 0 ? metrics.uniqueSecondsHeard / dur : 0;

  // ── Score each archetype ──
  const scores: Record<ListenerArchetype, number> = {
    DEEP_LISTENER: 0,
    ENGAGED_CRITIC: 0,
    SCANNER: 0,
    DISTRACTED: 0,
    SPEED_RUNNER: 0,
    CASUAL_LISTENER: 0,
  };

  // Deep Listener: high completion + high attention + replays
  if (completionHigh) { scores.DEEP_LISTENER += 3; traits.push("High completion (85%+)"); }
  if (attentionHigh) { scores.DEEP_LISTENER += 2.5; }
  if (manyReplays) { scores.DEEP_LISTENER += 2; traits.push(`${metrics.replayZones.length} replay zones`); }
  else if (hasReplays) { scores.DEEP_LISTENER += 1; }
  if (uniqueRatio > 0.8) { scores.DEEP_LISTENER += 1.5; }

  // Engaged Critic: pauses + moderate completion + some replays
  if (hasPauses) { scores.ENGAGED_CRITIC += 2.5; traits.push(`${metrics.pausePoints.length} deliberate pauses`); }
  if (longPauses) { scores.ENGAGED_CRITIC += 1.5; traits.push("Long pauses (note-taking)"); }
  if (completionMid) { scores.ENGAGED_CRITIC += 1.5; }
  if (hasReplays && !manyReplays) { scores.ENGAGED_CRITIC += 1.5; }
  if (attentionHigh) { scores.ENGAGED_CRITIC += 1; }

  // Scanner: many skips + low completion
  if (manySkips) { scores.SCANNER += 3; traits.push(`${metrics.skipZones.length} skip zones`); }
  else if (hasSkips) { scores.SCANNER += 1.5; }
  if (completionLow) { scores.SCANNER += 2; }
  if (metrics.firstSkipAt !== null && metrics.firstSkipAt < 30) { scores.SCANNER += 1.5; traits.push(`First skip at ${Math.round(metrics.firstSkipAt)}s`); }
  if (uniqueRatio < 0.4) { scores.SCANNER += 1; }

  // Distracted: low attention + tab blurs
  if (attentionLow) { scores.DISTRACTED += 3; traits.push(`Low attention (${Math.round(metrics.attentionScore * 100)}%)`); }
  const tabBlurs = metrics.totalEvents > 0 ? metrics.pausePoints.filter(p => p.durationMs > 5000).length : 0;
  if (tabBlurs >= 2) { scores.DISTRACTED += 2; traits.push("Frequent long interruptions"); }
  if (!completionHigh && !hasReplays && attentionLow) { scores.DISTRACTED += 1.5; }

  // Speed Runner: high completion + no replays + no pauses + no skips
  if (completionHigh && !hasReplays && !hasPauses) { scores.SPEED_RUNNER += 3; traits.push("Straight playthrough"); }
  if (!hasSkips && completionHigh) { scores.SPEED_RUNNER += 2; }
  if (attentionHigh && !hasReplays) { scores.SPEED_RUNNER += 1; }

  // Casual Listener: baseline — moderate everything
  scores.CASUAL_LISTENER = 2; // base score
  if (completionMid && !completionHigh) { scores.CASUAL_LISTENER += 1.5; }
  if (!manySkips && !manyReplays) { scores.CASUAL_LISTENER += 1; }

  // ── Pick winner ──
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winner, winnerScore] = sorted[0];
  const totalScore = sorted.reduce((s, [, v]) => s + v, 0);
  const confidence = totalScore > 0 ? Math.min(1, winnerScore / (totalScore * 0.5)) : 0.5;

  const archetype = winner as ListenerArchetype;
  const meta = ARCHETYPE_META[archetype];

  // Deduplicate traits
  const uniqueTraits = [...new Set(traits)].slice(0, 5);

  return {
    archetype,
    label: meta.label,
    description: meta.description,
    confidence: Math.round(confidence * 100) / 100,
    traits: uniqueTraits,
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. REVIEW CREDIBILITY SCORE
// ═══════════════════════════════════════════════════════════════

export interface CredibilityResult {
  score: number;        // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  breakdown: {
    listeningDepth: number;     // 0-100: how thoroughly they listened
    focusConsistency: number;   // 0-100: sustained attention
    feedbackQuality: number;    // 0-100: text quality composite
    behavioralAlignment: number; // 0-100: behavior matches words
    engagementAuthenticity: number; // 0-100: genuine engagement patterns
  };
  insights: string[];
}

/**
 * Compute a composite credibility score that answers:
 * "How much should an artist trust this review?"
 */
export function computeCredibilityScore(
  metrics: BehaviorMetrics,
  alignment: AlignmentResult,
  textQuality: ReviewTextQualityResult,
  trackDuration: number
): CredibilityResult {
  const dur = trackDuration > 0 ? trackDuration : 1;
  const insights: string[] = [];

  // ── Dimension 1: Listening Depth (25%) ──
  // How much of the track did they actually hear?
  const uniqueRatio = Math.min(1, metrics.uniqueSecondsHeard / dur);
  const completionFactor = metrics.completionRate;
  const replayBonus = Math.min(0.2, metrics.replayZones.length * 0.05);
  const listeningDepth = Math.min(100, Math.round(
    (uniqueRatio * 0.4 + completionFactor * 0.4 + replayBonus + (metrics.totalEvents > 10 ? 0.1 : 0)) * 100
  ));
  if (listeningDepth >= 80) insights.push("Thorough listening — heard most of the track");
  else if (listeningDepth < 40) insights.push("Limited listening — only heard a small portion");

  // ── Dimension 2: Focus Consistency (20%) ──
  // Were they actually paying attention the whole time?
  const attentionBase = metrics.attentionScore;
  // Penalize if engagement curve has high variance (inconsistent)
  const curve = metrics.engagementCurve;
  let engVariance = 0;
  if (curve.length > 2) {
    const mean = curve.reduce((a, b) => a + b, 0) / curve.length;
    engVariance = curve.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / curve.length;
  }
  const consistencyPenalty = Math.min(0.3, engVariance);
  const focusConsistency = Math.min(100, Math.round(
    (attentionBase * 0.7 + (1 - consistencyPenalty) * 0.3) * 100
  ));
  if (focusConsistency >= 80) insights.push("Sustained focus throughout the session");
  else if (focusConsistency < 40) insights.push("Attention was fragmented — possible multitasking");

  // ── Dimension 3: Feedback Quality (25%) ──
  const feedbackQuality = Math.min(100, Math.round(textQuality.compositeOverall * 100));
  if (feedbackQuality >= 60) insights.push("Feedback contains specific, actionable suggestions");
  else if (feedbackQuality < 25) insights.push("Feedback lacks specificity — mostly generic comments");

  // ── Dimension 4: Behavioral Alignment (20%) ──
  const behavioralAlignment = Math.min(100, Math.round(alignment.score * 100));
  if (behavioralAlignment >= 70) insights.push("Listening behavior closely matches written feedback");
  else if (behavioralAlignment < 40) insights.push("Disconnect between listening behavior and stated opinions");

  // ── Dimension 5: Engagement Authenticity (10%) ──
  // Detect patterns suggesting genuine engagement vs. gaming
  let authenticityScore = 50; // baseline
  // Positive signals
  if (metrics.pausePoints.length > 0 && metrics.pausePoints.length <= 5) authenticityScore += 15; // paused to think
  if (metrics.replayZones.length > 0 && metrics.replayZones.length <= 6) authenticityScore += 10; // genuine replays
  if (curve.length > 3) {
    // Organic engagement has some variation — perfect flat curves are suspicious
    const hasVariation = engVariance > 0.01 && engVariance < 0.3;
    if (hasVariation) authenticityScore += 15;
  }
  // Negative signals
  if (metrics.totalEvents < 3 && metrics.completionRate > 0.9) authenticityScore -= 20; // suspiciously clean
  if (metrics.skipZones.length > 5) authenticityScore -= 10; // excessive skipping

  const engagementAuthenticity = Math.max(0, Math.min(100, authenticityScore));

  // ── Composite ──
  const score = Math.round(
    listeningDepth * 0.25 +
    focusConsistency * 0.20 +
    feedbackQuality * 0.25 +
    behavioralAlignment * 0.20 +
    engagementAuthenticity * 0.10
  );

  const grade: CredibilityResult["grade"] =
    score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "F";

  const labels: Record<string, string> = {
    A: "Highly Credible",
    B: "Credible",
    C: "Moderately Credible",
    D: "Low Credibility",
    F: "Questionable",
  };

  return {
    score,
    grade,
    label: labels[grade],
    breakdown: {
      listeningDepth,
      focusConsistency,
      feedbackQuality,
      behavioralAlignment,
      engagementAuthenticity,
    },
    insights: insights.slice(0, 4),
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. ENGAGEMENT ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════

export type AnomalyType =
  | "HOOK_DETECTED"
  | "FATIGUE_POINT"
  | "INTEREST_SPIKE"
  | "ATTENTION_DROP"
  | "REPLAY_CLUSTER"
  | "ENGAGEMENT_CLIFF"
  | "SECOND_WIND"
  | "SKIP_PATTERN";

export interface EngagementAnomaly {
  type: AnomalyType;
  label: string;
  description: string;
  timestamp: number;     // seconds into the track
  severity: "high" | "medium" | "low";
  icon: string;          // emoji
}

/**
 * Detect anomalous patterns in the engagement curve and behavioral events.
 * Uses derivative analysis, z-score detection, and pattern matching.
 */
export function detectEngagementAnomalies(
  metrics: BehaviorMetrics,
  trackDuration: number
): EngagementAnomaly[] {
  const anomalies: EngagementAnomaly[] = [];
  const curve = metrics.engagementCurve;
  const dur = trackDuration > 0 ? trackDuration : 1;

  if (curve.length < 3) return anomalies;

  // ── Compute derivatives (rate of change) ──
  const derivatives: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    derivatives.push(curve[i] - curve[i - 1]);
  }

  // ── Compute mean and stddev for z-score detection ──
  const mean = curve.reduce((a, b) => a + b, 0) / curve.length;
  const stddev = Math.sqrt(curve.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / curve.length);
  const threshold = stddev > 0 ? stddev * 1.5 : 0.3;

  // ── Hook Detection: High engagement in first 3 buckets ──
  if (curve.length >= 3) {
    const earlyAvg = (curve[0] + curve[1] + curve[2]) / 3;
    if (earlyAvg > 0.7) {
      anomalies.push({
        type: "HOOK_DETECTED",
        label: "Hook Detected",
        description: `Strong engagement in the opening (${Math.round(earlyAvg * 100)}% avg) — the intro grabbed attention immediately`,
        timestamp: 0,
        severity: "high",
        icon: "🎣",
      });
    }
  }

  // ── Engagement Cliff: Sharp drop (derivative < -0.3) ──
  for (let i = 0; i < derivatives.length; i++) {
    if (derivatives[i] < -0.3) {
      const ts = (i + 1) * 10;
      anomalies.push({
        type: "ENGAGEMENT_CLIFF",
        label: "Engagement Cliff",
        description: `Sharp engagement drop at ${formatTimestamp(ts)} — lost ${Math.round(Math.abs(derivatives[i]) * 100)}% engagement in 10 seconds`,
        timestamp: ts,
        severity: "high",
        icon: "📉",
      });
    }
  }

  // ── Interest Spike: Sudden increase (derivative > 0.3) ──
  for (let i = 0; i < derivatives.length; i++) {
    if (derivatives[i] > 0.3 && i > 0) {
      const ts = (i + 1) * 10;
      anomalies.push({
        type: "INTEREST_SPIKE",
        label: "Interest Spike",
        description: `Engagement surged at ${formatTimestamp(ts)} — something caught the listener's ear (+${Math.round(derivatives[i] * 100)}%)`,
        timestamp: ts,
        severity: "medium",
        icon: "⚡",
      });
    }
  }

  // ── Second Wind: Low engagement followed by recovery ──
  for (let i = 2; i < curve.length - 1; i++) {
    if (curve[i - 1] < mean - threshold && curve[i] > mean && curve[i + 1] > mean) {
      const ts = i * 10;
      anomalies.push({
        type: "SECOND_WIND",
        label: "Second Wind",
        description: `Engagement recovered at ${formatTimestamp(ts)} after a dip — track pulled the listener back in`,
        timestamp: ts,
        severity: "medium",
        icon: "🔄",
      });
    }
  }

  // ── Fatigue Point: Gradual decline over 3+ buckets ──
  for (let i = 0; i < curve.length - 3; i++) {
    if (curve[i] > curve[i + 1] && curve[i + 1] > curve[i + 2] && curve[i + 2] > curve[i + 3]) {
      const totalDrop = curve[i] - curve[i + 3];
      if (totalDrop > 0.2) {
        const ts = i * 10;
        anomalies.push({
          type: "FATIGUE_POINT",
          label: "Listener Fatigue",
          description: `Sustained engagement decline starting at ${formatTimestamp(ts)} — attention faded over ${Math.round(totalDrop * 100)}% across 30 seconds`,
          timestamp: ts,
          severity: totalDrop > 0.4 ? "high" : "medium",
          icon: "😴",
        });
        break; // Only report first fatigue point
      }
    }
  }

  // ── Replay Cluster: Multiple replay zones in a small area ──
  if (metrics.replayZones.length >= 2) {
    const zones = [...metrics.replayZones].sort((a, b) => a.start - b.start);
    for (let i = 0; i < zones.length - 1; i++) {
      if (zones[i + 1].start - zones[i].end < 20) {
        anomalies.push({
          type: "REPLAY_CLUSTER",
          label: "Replay Cluster",
          description: `Concentrated replay activity around ${formatTimestamp(zones[i].start)}–${formatTimestamp(zones[i + 1].end)} — this section demanded repeated listening`,
          timestamp: zones[i].start,
          severity: "high",
          icon: "🔁",
        });
        break;
      }
    }
  }

  // ── Skip Pattern: Skips concentrated in one area ──
  if (metrics.skipZones.length >= 2) {
    const skips = [...metrics.skipZones].sort((a, b) => a.from - b.from);
    const halfDur = dur / 2;
    const firstHalfSkips = skips.filter(s => s.from < halfDur).length;
    const secondHalfSkips = skips.filter(s => s.from >= halfDur).length;
    if (secondHalfSkips >= 2 && secondHalfSkips > firstHalfSkips) {
      anomalies.push({
        type: "SKIP_PATTERN",
        label: "Late-Track Skip Pattern",
        description: `${secondHalfSkips} skips in the second half vs ${firstHalfSkips} in the first — possible structural fatigue or repetition`,
        timestamp: halfDur,
        severity: "medium",
        icon: "⏭️",
      });
    }
  }

  // ── Attention Drop: z-score outlier (bucket far below mean) ──
  if (stddev > 0.1) {
    for (let i = 1; i < curve.length - 1; i++) {
      const zScore = (curve[i] - mean) / stddev;
      if (zScore < -1.8 && curve[i] < 0.3) {
        const ts = i * 10;
        // Don't duplicate with engagement cliff
        if (!anomalies.some(a => a.type === "ENGAGEMENT_CLIFF" && Math.abs(a.timestamp - ts) < 15)) {
          anomalies.push({
            type: "ATTENTION_DROP",
            label: "Attention Drop",
            description: `Anomalously low engagement at ${formatTimestamp(ts)} (z-score: ${zScore.toFixed(1)}) — statistical outlier in listening pattern`,
            timestamp: ts,
            severity: "low",
            icon: "📊",
          });
        }
      }
    }
  }

  // Sort by timestamp and deduplicate nearby anomalies
  return anomalies
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((a, i, arr) => {
      if (i === 0) return true;
      return a.timestamp - arr[i - 1].timestamp > 5 || a.type !== arr[i - 1].type;
    })
    .slice(0, 8);
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
// 4. BEHAVIORAL FINGERPRINT
// ═══════════════════════════════════════════════════════════════

export interface FingerprintDimension {
  axis: string;
  value: number; // 0-1
  label: string;
}

export interface BehavioralFingerprint {
  dimensions: FingerprintDimension[];
  summary: string;
}

/**
 * Generate a 6-axis behavioral fingerprint for radar chart visualization.
 * Each dimension is normalized 0-1 for consistent rendering.
 */
export function computeBehavioralFingerprint(
  metrics: BehaviorMetrics,
  alignment: AlignmentResult,
  textQuality: ReviewTextQualityResult,
  trackDuration: number
): BehavioralFingerprint {
  const dur = trackDuration > 0 ? trackDuration : 1;

  // ── Axis 1: Completion ──
  const completion = Math.min(1, metrics.completionRate);

  // ── Axis 2: Focus ──
  const focus = Math.min(1, metrics.attentionScore);

  // ── Axis 3: Exploration (replay tendency) ──
  const replayFactor = Math.min(1, metrics.replayZones.length * 0.2);
  const uniqueRatio = Math.min(1, metrics.uniqueSecondsHeard / dur);
  const exploration = Math.min(1, replayFactor * 0.6 + uniqueRatio * 0.4);

  // ── Axis 4: Consistency (low variance in engagement) ──
  const curve = metrics.engagementCurve;
  let consistency = 0.5;
  if (curve.length > 2) {
    const mean = curve.reduce((a, b) => a + b, 0) / curve.length;
    const variance = curve.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / curve.length;
    consistency = Math.max(0, Math.min(1, 1 - variance * 3)); // Lower variance = higher consistency
  }

  // ── Axis 5: Text Quality ──
  const textScore = Math.min(1, textQuality.compositeOverall);

  // ── Axis 6: Alignment ──
  const alignScore = Math.min(1, alignment.score);

  const dimensions: FingerprintDimension[] = [
    { axis: "Completion", value: completion, label: `${Math.round(completion * 100)}%` },
    { axis: "Focus", value: focus, label: `${Math.round(focus * 100)}%` },
    { axis: "Exploration", value: exploration, label: `${Math.round(exploration * 100)}%` },
    { axis: "Consistency", value: consistency, label: `${Math.round(consistency * 100)}%` },
    { axis: "Text Quality", value: textScore, label: `${Math.round(textScore * 100)}%` },
    { axis: "Alignment", value: alignScore, label: `${Math.round(alignScore * 100)}%` },
  ];

  // Generate summary
  const high = dimensions.filter(d => d.value >= 0.7).map(d => d.axis);
  const low = dimensions.filter(d => d.value < 0.3).map(d => d.axis);

  let summary: string;
  if (high.length >= 4) {
    summary = `Well-rounded reviewer — strong across ${high.join(", ")}`;
  } else if (high.length >= 2) {
    summary = `Strengths in ${high.join(" & ")}${low.length > 0 ? ` — room to improve ${low.join(", ")}` : ""}`;
  } else if (low.length >= 3) {
    summary = `Review needs more depth — low scores in ${low.join(", ")}`;
  } else {
    summary = "Moderate review profile — no extreme strengths or weaknesses";
  }

  return { dimensions, summary };
}
