/**
 * Feedback Intelligence Engine — Behavioral Analysis
 *
 * Server-side (or client-side) functions to compute derived behavioral metrics
 * and behavioral-explicit alignment scores from raw listening events.
 */

import type { RawBehaviorEvent, BehaviorMetrics } from "@/hooks/use-listen-behavior";

// Re-export types for convenience
export type { RawBehaviorEvent, BehaviorMetrics };

// ── Behavioral-Explicit Alignment ───────────────────────────────

export interface ExplicitFeedback {
  firstImpression?: string | null;     // "STRONG_HOOK" | "DECENT_START" | "LOST_INTEREST"
  wouldListenAgain?: boolean | null;
  bestPart?: string | null;            // free text
  weakestPart?: string | null;         // free text
  bestPartTimestamp?: number | null;    // seconds
  qualityLevel?: string | null;        // "PROFESSIONAL" | ... | "NOT_READY"
  playlistAction?: string | null;
  tooRepetitive?: boolean | null;
}

export interface AlignmentResult {
  score: number;           // 0-1 composite alignment
  signals: AlignmentSignal[];
  summary: string;         // human-readable summary
}

export interface AlignmentSignal {
  signal: string;
  alignment: "HIGH" | "MODERATE" | "LOW" | "NEUTRAL";
  detail: string;
}

/**
 * Compute how well the reviewer's listening behavior matches their explicit feedback.
 * This is the KEY INNOVATION — no other platform does this.
 */
export function computeBehavioralAlignment(
  metrics: BehaviorMetrics,
  explicit: ExplicitFeedback,
  trackDuration: number
): AlignmentResult {
  const signals: AlignmentSignal[] = [];
  const dur = trackDuration > 0 ? trackDuration : 1;

  // ─── Signal 1: First Impression vs Early Behavior ───
  if (explicit.firstImpression) {
    if (explicit.firstImpression === "STRONG_HOOK") {
      // Said strong hook — check if they stayed engaged in first 30s
      const earlySkip = metrics.firstSkipAt !== null && metrics.firstSkipAt < 30;
      if (earlySkip) {
        signals.push({
          signal: "hook_skip_contradiction",
          alignment: "LOW",
          detail: `Said "Strong Hook" but skipped forward at ${metrics.firstSkipAt}s`,
        });
      } else {
        signals.push({
          signal: "hook_confirmed",
          alignment: "HIGH",
          detail: "Said \"Strong Hook\" and stayed engaged through the opening",
        });
      }
    } else if (explicit.firstImpression === "LOST_INTEREST") {
      // Said lost interest — check completion
      if (metrics.completionRate > 0.85) {
        signals.push({
          signal: "lost_interest_but_completed",
          alignment: "MODERATE",
          detail: "Said \"Lost Interest\" but listened to 85%+ of track (pushed through)",
        });
      } else {
        signals.push({
          signal: "lost_interest_confirmed",
          alignment: "HIGH",
          detail: "Said \"Lost Interest\" and completion rate reflects this",
        });
      }
    }
  }

  // ─── Signal 2: Would Listen Again vs Engagement ───
  if (explicit.wouldListenAgain !== null && explicit.wouldListenAgain !== undefined) {
    if (explicit.wouldListenAgain) {
      if (metrics.completionRate < 0.5 && metrics.replayZones.length === 0) {
        signals.push({
          signal: "listen_again_low_engagement",
          alignment: "LOW",
          detail: "Would listen again but only heard <50% with no replays",
        });
      } else if (metrics.replayZones.length > 0 || metrics.completionRate > 0.8) {
        signals.push({
          signal: "listen_again_confirmed",
          alignment: "HIGH",
          detail: "Would listen again — backed by high completion/replay behavior",
        });
      }
    } else {
      // Wouldn't listen again
      if (metrics.replayZones.length >= 2) {
        signals.push({
          signal: "no_again_but_replayed",
          alignment: "LOW",
          detail: "Wouldn't listen again but replayed multiple sections",
        });
      }
    }
  }

  // ─── Signal 3: Best Part Timestamp vs Replay Data ───
  if (explicit.bestPartTimestamp && explicit.bestPartTimestamp > 0) {
    const ts = explicit.bestPartTimestamp;
    const wasReplayed = metrics.replayZones.some(
      (z) => ts >= z.start - 5 && ts <= z.end + 5
    );
    const wasHighEngagement = metrics.engagementCurve.length > 0 &&
      (() => {
        const bucket = Math.floor(ts / 10);
        return bucket < metrics.engagementCurve.length && metrics.engagementCurve[bucket] > 0.7;
      })();

    if (wasReplayed) {
      signals.push({
        signal: "best_part_replayed",
        alignment: "HIGH",
        detail: `Best part at ${ts}s was replayed — strong behavioral confirmation`,
      });
    } else if (wasHighEngagement) {
      signals.push({
        signal: "best_part_engaged",
        alignment: "HIGH",
        detail: `Best part at ${ts}s shows high engagement in that zone`,
      });
    } else {
      signals.push({
        signal: "best_part_no_behavioral_signal",
        alignment: "NEUTRAL",
        detail: `Best part at ${ts}s — no strong behavioral signal either way`,
      });
    }
  }

  // ─── Signal 4: Quality Level vs Completion ───
  if (explicit.qualityLevel) {
    const highQuality = ["PROFESSIONAL", "RELEASE_READY"].includes(explicit.qualityLevel);
    const lowQuality = ["NOT_READY", "DEMO_STAGE"].includes(explicit.qualityLevel);

    if (highQuality && metrics.skipZones.length >= 3) {
      signals.push({
        signal: "high_quality_many_skips",
        alignment: "LOW",
        detail: `Rated as "${explicit.qualityLevel}" but skipped ${metrics.skipZones.length} sections`,
      });
    } else if (lowQuality && metrics.completionRate > 0.9 && metrics.replayZones.length > 0) {
      signals.push({
        signal: "low_quality_but_engaged",
        alignment: "MODERATE",
        detail: "Rated low quality but completed 90%+ with replays — might be harsh",
      });
    }
  }

  // ─── Signal 5: Repetitive Claim vs Skip Pattern ───
  if (explicit.tooRepetitive === true) {
    // If they skipped forward multiple times in the latter half, consistent
    const lateSkips = metrics.skipZones.filter((z) => z.from > dur * 0.4);
    if (lateSkips.length >= 2) {
      signals.push({
        signal: "repetitive_confirmed_by_skips",
        alignment: "HIGH",
        detail: "Said \"too repetitive\" and skipped ahead multiple times in the latter half",
      });
    } else if (metrics.completionRate > 0.9 && lateSkips.length === 0) {
      signals.push({
        signal: "repetitive_but_stayed",
        alignment: "MODERATE",
        detail: "Said \"too repetitive\" but listened through without skipping",
      });
    }
  }

  // ─── Signal 6: Attention Score ───
  if (metrics.attentionScore < 0.5) {
    signals.push({
      signal: "low_attention",
      alignment: "LOW",
      detail: `Attention score ${(metrics.attentionScore * 100).toFixed(0)}% — likely multitasking`,
    });
  } else if (metrics.attentionScore > 0.85) {
    signals.push({
      signal: "high_attention",
      alignment: "HIGH",
      detail: `Attention score ${(metrics.attentionScore * 100).toFixed(0)}% — fully focused`,
    });
  }

  // ─── Compute composite score ───
  const weights = { HIGH: 1.0, MODERATE: 0.6, LOW: 0.2, NEUTRAL: 0.5 };
  if (signals.length === 0) {
    return {
      score: 0.5,
      signals: [],
      summary: "No behavioral signals to compare against explicit feedback",
    };
  }

  const weightedSum = signals.reduce((sum, s) => sum + weights[s.alignment], 0);
  const score = weightedSum / signals.length;

  // Generate summary
  const highCount = signals.filter((s) => s.alignment === "HIGH").length;
  const lowCount = signals.filter((s) => s.alignment === "LOW").length;

  let summary: string;
  if (score >= 0.8) {
    summary = `Strong alignment — behavior closely matches feedback (${highCount} confirming signals)`;
  } else if (score >= 0.6) {
    summary = `Good alignment — mostly consistent with minor discrepancies`;
  } else if (score >= 0.4) {
    summary = `Mixed alignment — some signals conflict (${lowCount} contradictions found)`;
  } else {
    summary = `Low alignment — significant disconnect between behavior and stated feedback`;
  }

  return { score, signals, summary };
}

// ── Aggregate Behavioral Insights (Multi-Reviewer) ──────────────

export interface AggregatedInsights {
  avgCompletion: number;
  avgAttention: number;
  hottestMoments: Array<{ start: number; end: number; reviewerCount: number }>;
  dropOffPoints: Array<{ position: number; reviewerCount: number }>;
  pauseHotspots: Array<{ position: number; reviewerCount: number }>;
  aggregatedEngagement: number[];
}

/**
 * Aggregate behavioral insights across multiple reviewers for artist-facing display.
 */
export function aggregateBehavioralInsights(
  allMetrics: BehaviorMetrics[],
  trackDuration: number
): AggregatedInsights {
  if (allMetrics.length === 0) {
    return {
      avgCompletion: 0,
      avgAttention: 0,
      hottestMoments: [],
      dropOffPoints: [],
      pauseHotspots: [],
      aggregatedEngagement: [],
    };
  }

  const dur = trackDuration > 0 ? trackDuration : 300;
  const maxSec = Math.min(Math.ceil(dur), 7200);

  // Averages
  const avgCompletion = allMetrics.reduce((s, m) => s + m.completionRate, 0) / allMetrics.length;
  const avgAttention = allMetrics.reduce((s, m) => s + m.attentionScore, 0) / allMetrics.length;

  // Aggregated engagement curve
  const maxBuckets = Math.max(...allMetrics.map((m) => m.engagementCurve.length), 0);
  const aggregatedEngagement: number[] = [];
  for (let i = 0; i < maxBuckets; i++) {
    const vals = allMetrics
      .map((m) => m.engagementCurve[i])
      .filter((v): v is number => v !== undefined);
    aggregatedEngagement.push(
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    );
  }

  // Hottest moments: aggregate replay zones
  const replayHeat = new Uint16Array(maxSec);
  for (const m of allMetrics) {
    for (const zone of m.replayZones) {
      for (let s = Math.max(0, zone.start); s < Math.min(maxSec, zone.end); s++) {
        replayHeat[s]++;
      }
    }
  }

  const hottestMoments: Array<{ start: number; end: number; reviewerCount: number }> = [];
  let zStart = -1;
  let zMin = 0;
  for (let s = 0; s < maxSec; s++) {
    if (replayHeat[s] >= 2) {
      if (zStart < 0) { zStart = s; zMin = replayHeat[s]; }
      zMin = Math.min(zMin, replayHeat[s]);
    } else if (zStart >= 0) {
      hottestMoments.push({ start: zStart, end: s, reviewerCount: zMin });
      zStart = -1;
    }
  }
  if (zStart >= 0) hottestMoments.push({ start: zStart, end: maxSec, reviewerCount: zMin });

  // Drop-off points
  const skipHeat = new Uint16Array(maxSec);
  for (const m of allMetrics) {
    for (const skip of m.skipZones) {
      const pos = Math.max(0, Math.min(maxSec - 1, skip.from));
      skipHeat[pos]++;
    }
  }
  const dropOffPoints: Array<{ position: number; reviewerCount: number }> = [];
  for (let s = 0; s < maxSec; s++) {
    if (skipHeat[s] >= 2) {
      dropOffPoints.push({ position: s, reviewerCount: skipHeat[s] });
    }
  }

  // Pause hotspots
  const pauseHeat = new Uint16Array(maxSec);
  for (const m of allMetrics) {
    for (const p of m.pausePoints) {
      const pos = Math.max(0, Math.min(maxSec - 1, p.position));
      pauseHeat[pos]++;
    }
  }
  const pauseHotspots: Array<{ position: number; reviewerCount: number }> = [];
  for (let s = 0; s < maxSec; s++) {
    if (pauseHeat[s] >= 2) {
      pauseHotspots.push({ position: s, reviewerCount: pauseHeat[s] });
    }
  }

  return {
    avgCompletion,
    avgAttention,
    hottestMoments: hottestMoments.sort((a, b) => b.reviewerCount - a.reviewerCount).slice(0, 5),
    dropOffPoints: dropOffPoints.sort((a, b) => b.reviewerCount - a.reviewerCount).slice(0, 5),
    pauseHotspots: pauseHotspots.sort((a, b) => b.reviewerCount - a.reviewerCount).slice(0, 3),
    aggregatedEngagement,
  };
}
