import { Headphones, Repeat2, SkipForward, Pause, Zap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

interface ListenBehaviorData {
  completionRate: number;
  attentionScore: number;
  firstSkipAt: number | null;
  replayZones: any[] | null;
  skipZones: any[] | null;
  pausePoints: any[] | null;
  engagementCurve: number[] | null;
  uniqueSecondsHeard: number;
  totalEvents: number;
  behavioralAlignmentScore: number | null;
}

interface BehavioralInsightsProps {
  behaviors: ListenBehaviorData[];
  trackDurationEstimate?: number;
}

// ── Helpers ─────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ── Aggregate multi-reviewer behavioral data ────────────────────

function aggregateBehaviors(behaviors: ListenBehaviorData[]) {
  const avgCompletion = avg(behaviors.map((b) => b.completionRate));
  const avgAttention = avg(behaviors.map((b) => b.attentionScore));
  const avgAlignment = avg(
    behaviors.filter((b) => b.behavioralAlignmentScore != null).map((b) => b.behavioralAlignmentScore!)
  );

  // Merge engagement curves — average across all reviewers
  const curves = behaviors.map((b) => b.engagementCurve).filter((c): c is number[] => Array.isArray(c) && c.length > 0);
  const maxLen = Math.max(...curves.map((c) => c.length), 0);
  const mergedCurve: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const vals = curves.map((c) => c[i] ?? 0).filter((v) => v > 0);
    mergedCurve.push(vals.length > 0 ? avg(vals) : 0);
  }

  // Collect replay zones across all reviewers
  const allReplays: { start: number; end: number; count: number }[] = [];
  for (const b of behaviors) {
    if (Array.isArray(b.replayZones)) {
      for (const z of b.replayZones) {
        if (typeof z.start === "number" && typeof z.end === "number") {
          allReplays.push({ start: z.start, end: z.end, count: z.count ?? 1 });
        }
      }
    }
  }

  // Collect skip zones
  const allSkips: { from: number; to: number }[] = [];
  for (const b of behaviors) {
    if (Array.isArray(b.skipZones)) {
      for (const z of b.skipZones) {
        if (typeof z.from === "number" && typeof z.to === "number") {
          allSkips.push({ from: z.from, to: z.to });
        }
      }
    }
  }

  // Hottest moments — find segments of the merged curve where engagement is highest
  const hottestMoments: { startPct: number; endPct: number; intensity: number }[] = [];
  if (mergedCurve.length > 0) {
    const threshold = 0.6;
    let inHot = false;
    let hotStart = 0;
    for (let i = 0; i < mergedCurve.length; i++) {
      if (mergedCurve[i] >= threshold && !inHot) {
        inHot = true;
        hotStart = i;
      } else if ((mergedCurve[i] < threshold || i === mergedCurve.length - 1) && inHot) {
        inHot = false;
        const endI = mergedCurve[i] >= threshold ? i + 1 : i;
        if (endI - hotStart >= 2) {
          hottestMoments.push({
            startPct: hotStart / mergedCurve.length,
            endPct: endI / mergedCurve.length,
            intensity: avg(mergedCurve.slice(hotStart, endI)),
          });
        }
      }
    }
  }

  return {
    avgCompletion,
    avgAttention,
    avgAlignment,
    mergedCurve,
    allReplays,
    allSkips,
    hottestMoments,
    reviewerCount: behaviors.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BehavioralInsights({ behaviors, trackDurationEstimate }: BehavioralInsightsProps) {
  if (behaviors.length === 0) return null;

  const data = aggregateBehaviors(behaviors);
  const dur = trackDurationEstimate ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
            Listening Intelligence
          </p>
          <h3 className="text-lg font-bold text-black mt-0.5">
            How they actually listened
          </h3>
        </div>
        <span className="text-xs text-neutral-400 font-mono">
          {data.reviewerCount} {data.reviewerCount === 1 ? "listener" : "listeners"}
        </span>
      </div>

      {/* ── Headline Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBubble
          icon={<Eye className="h-5 w-5" />}
          value={pct(data.avgCompletion)}
          label="Heard the track"
          positive={data.avgCompletion >= 0.7}
        />
        <StatBubble
          icon={<Headphones className="h-5 w-5" />}
          value={pct(data.avgAttention)}
          label="Attention held"
          positive={data.avgAttention >= 0.6}
        />
        <StatBubble
          icon={<Repeat2 className="h-5 w-5" />}
          value={String(data.allReplays.length)}
          label="Replay moments"
          positive={data.allReplays.length > 0}
        />
        <StatBubble
          icon={<SkipForward className="h-5 w-5" />}
          value={String(data.allSkips.length)}
          label="Skip zones"
          positive={data.allSkips.length === 0}
          invertColor
        />
      </div>

      {/* ── Engagement Curve ── */}
      {data.mergedCurve.length > 0 && (
        <div className="rounded-2xl bg-white border-2 border-black/6 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-black">Engagement Timeline</p>
            <p className="text-[10px] text-black/30 font-mono">
              {data.reviewerCount} listener{data.reviewerCount !== 1 ? "s" : ""} averaged
            </p>
          </div>

          {/* The curve */}
          <div className="relative h-14 bg-neutral-50 rounded-xl overflow-hidden flex items-end gap-px px-1 pb-1">
            {data.mergedCurve.map((val, i) => {
              const isHot = val >= 0.7;
              const isCold = val < 0.2 && val > 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-t-sm min-w-[2px] transition-all",
                    isHot
                      ? "bg-purple-500"
                      : isCold
                        ? "bg-amber-300"
                        : val > 0
                          ? "bg-purple-300"
                          : "bg-neutral-200"
                  )}
                  style={{ height: `${Math.max(4, val * 100)}%` }}
                />
              );
            })}

            {/* Hottest moment indicators */}
            {data.hottestMoments.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-1 bg-purple-500 rounded-full"
                style={{
                  left: `${m.startPct * 100}%`,
                  width: `${(m.endPct - m.startPct) * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-[10px] font-semibold text-black/40">High engagement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="text-[10px] font-semibold text-black/40">Drop-off</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Hottest Moments + Replay/Skip detail ── */}
      {(data.allReplays.length > 0 || data.allSkips.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Replay zones */}
          {data.allReplays.length > 0 && (
            <div className="rounded-2xl bg-white border-2 border-black/6 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Repeat2 className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <p className="text-sm font-bold text-black">Replayed Moments</p>
              </div>
              <div className="space-y-1.5">
                {data.allReplays.slice(0, 4).map((zone, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 border border-purple-100"
                  >
                    <span className="text-xs font-bold text-purple-700 font-mono">
                      {dur > 0 ? `${formatTime(zone.start)} – ${formatTime(zone.end)}` : `Zone ${i + 1}`}
                    </span>
                    <span className="text-[10px] text-purple-500 font-semibold">
                      {zone.count}× replayed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skip zones */}
          {data.allSkips.length > 0 && (
            <div className="rounded-2xl bg-white border-2 border-black/6 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <SkipForward className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <p className="text-sm font-bold text-black">Skipped Sections</p>
              </div>
              <div className="space-y-1.5">
                {data.allSkips.slice(0, 4).map((zone, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-100"
                  >
                    <span className="text-xs font-bold text-amber-700 font-mono">
                      {dur > 0 ? `${formatTime(zone.from)} → ${formatTime(zone.to)}` : `Skip ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Behavioral alignment (if available) ── */}
      {data.avgAlignment > 0 && (
        <div className="rounded-2xl bg-white border-2 border-black/6 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              data.avgAlignment >= 0.7 ? "bg-lime-100" :
              data.avgAlignment >= 0.4 ? "bg-purple-100" : "bg-amber-100"
            )}>
              <Zap className={cn(
                "h-5 w-5",
                data.avgAlignment >= 0.7 ? "text-lime-600" :
                data.avgAlignment >= 0.4 ? "text-purple-600" : "text-amber-600"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-black">Behavior-Feedback Alignment</p>
              <p className="text-xs text-black/40">
                How well listener actions matched their written feedback
              </p>
            </div>
            <span className={cn(
              "text-2xl font-black tabular-nums",
              data.avgAlignment >= 0.7 ? "text-lime-600" :
              data.avgAlignment >= 0.4 ? "text-purple-600" : "text-amber-500"
            )}>
              {pct(data.avgAlignment)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatBubble({
  icon,
  value,
  label,
  positive,
  invertColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  positive: boolean;
  invertColor?: boolean;
}) {
  const isGood = invertColor ? !positive : positive;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl p-4 border-2 transition-all",
      isGood
        ? "border-purple-200 bg-gradient-to-b from-purple-50 to-white"
        : "border-neutral-200 bg-white"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center mb-2",
        isGood ? "bg-purple-100 text-purple-600" : "bg-neutral-100 text-neutral-400"
      )}>
        {icon}
      </div>
      <p className={cn(
        "text-3xl font-black tabular-nums leading-none mb-1",
        isGood ? "text-purple-600" : "text-neutral-500"
      )}>
        {value}
      </p>
      <p className="text-xs font-semibold text-neutral-600">{label}</p>
    </div>
  );
}
