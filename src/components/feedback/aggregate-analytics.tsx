import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Sparkles, Music, TrendingUp, TrendingDown, Minus } from "lucide-react";

type FirstImpression = "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";

type ReviewLike = {
  productionScore: number | null;
  vocalScore: number | null;
  originalityScore: number | null;
  wouldListenAgain: boolean | null;
  perceivedGenre: string | null;
  similarArtists: string | null;
  firstImpression: FirstImpression | null;
  wouldAddToPlaylist: boolean | null;
  wouldShare: boolean | null;
  wouldFollow: boolean | null;
};

type PlatformAverages = {
  production: number;
  originality: number;
  vocals: number;
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function calculateAverage(Review: ReviewLike[], field: keyof ReviewLike): number {
  const scores = reviews
    .map((r) => r[field])
    .filter((v): v is number => typeof v === "number" && v >= 1 && v <= 5);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function topFrequencies(items: string[], limit: number) {
  const map = new Map<string, number>();
  for (const raw of items) {
    const token = normalizeToken(raw);
    if (!token) continue;
    map.set(token, (map.get(token) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, v]) => ({ label: titleCase(k), count: v }));
}

function getScoreLabel(score: number): { label: string; color: string } {
  // Absolute quality labels based on 1-5 scale
  if (score >= 4.5) return { label: "Exceptional", color: "text-lime-600" };
  if (score >= 4.0) return { label: "Strong", color: "text-lime-600" };
  if (score >= 3.5) return { label: "Solid", color: "text-neutral-600" };
  if (score >= 3.0) return { label: "Average", color: "text-neutral-500" };
  if (score >= 2.5) return { label: "Developing", color: "text-amber-600" };
  return { label: "Needs work", color: "text-amber-600" };
}

function ComparisonIndicator({ score, platformAvg }: { score: number; platformAvg?: number }) {
  // If no platform average available, just show the quality label
  if (!platformAvg || platformAvg === 0) {
    const { label, color } = getScoreLabel(score);
    return (
      <div className={`text-xs font-medium ${color}`}>
        {label}
      </div>
    );
  }

  const diff = score - platformAvg;
  const absDiff = Math.abs(diff).toFixed(1);
  const { label } = getScoreLabel(score);

  // Show: "Strong · +0.8 vs avg" or "Developing · -0.5 vs avg"
  if (diff > 0.2) {
    return (
      <div
        className="flex items-center gap-1 text-xs text-lime-600 font-medium"
        title={`Platform average: ${platformAvg.toFixed(1)}`}
      >
        <TrendingUp className="h-3 w-3" />
        <span>{label} · +{absDiff}</span>
      </div>
    );
  } else if (diff < -0.2) {
    return (
      <div
        className="flex items-center gap-1 text-xs text-amber-600 font-medium"
        title={`Platform average: ${platformAvg.toFixed(1)}`}
      >
        <TrendingDown className="h-3 w-3" />
        <span>{label} · -{absDiff}</span>
      </div>
    );
  } else {
    return (
      <div
        className="flex items-center gap-1 text-xs text-neutral-500 font-medium"
        title={`Platform average: ${platformAvg.toFixed(1)}`}
      >
        <Minus className="h-3 w-3" />
        <span>{label} · avg</span>
      </div>
    );
  }
}

function ScoreCircle({
  score,
  label,
  icon: Icon,
  platformAvg,
}: {
  score: number;
  label: string;
  icon: React.ElementType;
  platformAvg?: number;
}) {
  const percentage = (score / 5) * 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#f5f5f5"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={score >= 4 ? "#84cc16" : score >= 3 ? "#fbbf24" : "#f87171"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{score.toFixed(1)}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-bold text-neutral-700">{label}</span>
      </div>
      <ComparisonIndicator score={score} platformAvg={platformAvg} />
    </div>
  );
}

function ImpressionsBar({ impressions, total }: { impressions: { hook: number; decent: number; lost: number }; total: number }) {
  if (total === 0) return null;

  const hookPct = Math.round((impressions.hook / total) * 100);
  const decentPct = Math.round((impressions.decent / total) * 100);
  const lostPct = Math.round((impressions.lost / total) * 100);

  return (
    <div className="space-y-3">
      <div className="text-sm font-bold text-neutral-700">First Impressions</div>
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-neutral-100">
        {hookPct > 0 && (
          <div
            className="h-full bg-lime-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${hookPct}%` }}
            title={`Strong Hook: ${hookPct}%`}
          />
        )}
        {decentPct > 0 && (
          <div
            className="h-full bg-amber-400 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${decentPct}%` }}
            title={`Decent: ${decentPct}%`}
          />
        )}
        {lostPct > 0 && (
          <div
            className="h-full bg-neutral-300 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${lostPct}%` }}
            title={`Lost Interest: ${lostPct}%`}
          />
        )}
      </div>
      <div className="flex justify-between text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lime-500" />
          <span>Strong Hook {hookPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span>Decent {decentPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span>Lost {lostPct}%</span>
        </div>
      </div>
    </div>
  );
}

function EngagementRow({
  label,
  percentage,
  count,
  total
}: {
  label: string;
  percentage: number;
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-lime-500 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-bold text-neutral-800 w-12 text-right">
          {percentage}%
        </span>
        <span className="text-xs text-neutral-400 w-10">
          {count}/{total}
        </span>
      </div>
    </div>
  );
}

function EngagementSection({ reviews }: { Review: ReviewLike[] }) {
  // Calculate each metric with its OWN denominator (reviews that have that field answered)
  // This handles old reviews that may not have newer fields
  const listenAgainTotal = reviews.filter(r => r.wouldListenAgain !== null).length;
  const listenAgainYes = reviews.filter(r => r.wouldListenAgain === true).length;

  const playlistTotal = reviews.filter(r => r.wouldAddToPlaylist !== null).length;
  const playlistYes = reviews.filter(r => r.wouldAddToPlaylist === true).length;

  const shareTotal = reviews.filter(r => r.wouldShare !== null).length;
  const shareYes = reviews.filter(r => r.wouldShare === true).length;

  const followTotal = reviews.filter(r => r.wouldFollow !== null).length;
  const followYes = reviews.filter(r => r.wouldFollow === true).length;

  // Only show if at least one metric has data
  const hasAnyData = listenAgainTotal > 0 || playlistTotal > 0 || shareTotal > 0 || followTotal > 0;
  if (!hasAnyData) return null;

  // Calculate percentages safely
  const listenAgainPct = listenAgainTotal > 0 ? Math.round((listenAgainYes / listenAgainTotal) * 100) : null;
  const playlistPct = playlistTotal > 0 ? Math.round((playlistYes / playlistTotal) * 100) : null;
  const sharePct = shareTotal > 0 ? Math.round((shareYes / shareTotal) * 100) : null;
  const followPct = followTotal > 0 ? Math.round((followYes / followTotal) * 100) : null;

  // Overall engagement: weighted average of available metrics only
  // Normalizes to account for missing metrics (old reviews without newer fields)
  let overallEngagement: number | null = null;
  const weights: { pct: number | null; weight: number }[] = [
    { pct: listenAgainPct, weight: 0.4 },
    { pct: playlistPct, weight: 0.3 },
    { pct: sharePct, weight: 0.2 },
    { pct: followPct, weight: 0.1 },
  ];
  const availableMetrics = weights.filter(w => w.pct !== null);
  if (availableMetrics.length > 0) {
    const totalWeight = availableMetrics.reduce((sum, w) => sum + w.weight, 0);
    const weightedSum = availableMetrics.reduce((sum, w) => sum + (w.pct! * w.weight), 0);
    overallEngagement = Math.round(weightedSum / totalWeight);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-neutral-700">Listener Engagement</div>
        {overallEngagement !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Overall</span>
            <span className={`text-sm font-black px-2 py-0.5 rounded ${
              overallEngagement >= 60 ? 'bg-lime-100 text-lime-700' :
              overallEngagement >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-neutral-100 text-neutral-600'
            }`}>
              {overallEngagement}%
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {listenAgainPct !== null && (
          <EngagementRow
            label="Would listen again"
            percentage={listenAgainPct}
            count={listenAgainYes}
            total={listenAgainTotal}
          />
        )}
        {playlistPct !== null && (
          <EngagementRow
            label="Would add to playlist"
            percentage={playlistPct}
            count={playlistYes}
            total={playlistTotal}
          />
        )}
        {sharePct !== null && (
          <EngagementRow
            label="Would share with friends"
            percentage={sharePct}
            count={shareYes}
            total={shareTotal}
          />
        )}
        {followPct !== null && (
          <EngagementRow
            label="Would follow artist"
            percentage={followPct}
            count={followYes}
            total={followTotal}
          />
        )}
      </div>
    </div>
  );
}

function ArtistChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100 border border-neutral-200 text-sm">
      <span className="font-semibold text-neutral-800">{label}</span>
      <span className="text-xs text-neutral-500 bg-white px-1.5 py-0.5 rounded">{count}</span>
    </span>
  );
}

export function AggregateAnalytics({
  reviews,
  platformAverages
}: {
  Review: ReviewLike[];
  platformAverages?: PlatformAverages;
}) {
  const completed = reviews.length;

  const avgProduction = calculateAverage(reviews, "productionScore");
  const avgVocals = calculateAverage(reviews, "vocalScore");
  const avgOriginality = calculateAverage(reviews, "originalityScore");

  const impressions = {
    hook: reviews.filter((r) => r.firstImpression === "STRONG_HOOK").length,
    decent: reviews.filter((r) => r.firstImpression === "DECENT").length,
    lost: reviews.filter((r) => r.firstImpression === "LOST_INTEREST").length,
  };
  const impressionsTotal = impressions.hook + impressions.decent + impressions.lost;

  const artistsItems = reviews
    .flatMap((r) => (r.similarArtists ?? "").split(","))
    .map((v) => v.trim())
    .filter(Boolean);

  // Limit to top 6 artists
  const topArtists = topFrequencies(artistsItems, 6);

  return (
    <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
      <CardHeader className="border-b border-black/10">
        <div className="text-xs font-mono tracking-widest text-black/40 uppercase">
          Pattern Analytics
        </div>
        <CardTitle className="flex items-center gap-2 text-neutral-900 mt-2">
          <Sparkles className="h-5 w-5 text-neutral-700" />
          Insights from {completed} review{completed === 1 ? "" : "s"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-8">
        {/* Score Circles with Platform Comparison */}
        <div className="flex justify-center gap-8 sm:gap-12">
          <ScoreCircle
            score={avgProduction}
            label="Production"
            icon={Zap}
            platformAvg={platformAverages?.production}
          />
          <ScoreCircle
            score={avgOriginality}
            label="Originality"
            icon={Sparkles}
            platformAvg={platformAverages?.originality}
          />
          <ScoreCircle
            score={avgVocals}
            label="Vocals"
            icon={Music}
            platformAvg={platformAverages?.vocals}
          />
        </div>

        {/* Impressions Bar */}
        <ImpressionsBar impressions={impressions} total={impressionsTotal} />

        {/* Listener Engagement */}
        <EngagementSection reviews={reviews} />

        {/* Similar Artists */}
        {topArtists.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-neutral-700">Sounds Like...</div>
            <div className="flex flex-wrap gap-2">
              {topArtists.map((a) => (
                <ArtistChip key={a.label} label={a.label} count={a.count} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
