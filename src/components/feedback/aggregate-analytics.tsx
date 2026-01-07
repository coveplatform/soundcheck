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

function calculateAverage(reviews: ReviewLike[], field: keyof ReviewLike): number {
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

function ComparisonIndicator({ score, platformAvg }: { score: number; platformAvg?: number }) {
  if (!platformAvg || platformAvg === 0) return null;

  const diff = score - platformAvg;
  const threshold = 0.3; // Need to be 0.3+ above/below to show trend

  if (diff > threshold) {
    return (
      <div className="flex items-center gap-1 text-xs text-lime-600 font-medium">
        <TrendingUp className="h-3 w-3" />
        <span>Above avg</span>
      </div>
    );
  } else if (diff < -threshold) {
    return (
      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
        <TrendingDown className="h-3 w-3" />
        <span>Below avg</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
        <Minus className="h-3 w-3" />
        <span>Average</span>
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
            className="transition-all duration-500"
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
            className="h-full bg-lime-500 transition-all"
            style={{ width: `${hookPct}%` }}
            title={`Strong Hook: ${hookPct}%`}
          />
        )}
        {decentPct > 0 && (
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${decentPct}%` }}
            title={`Decent: ${decentPct}%`}
          />
        )}
        {lostPct > 0 && (
          <div
            className="h-full bg-neutral-300 transition-all"
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
            className="h-full bg-lime-500 rounded-full transition-all"
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

function EngagementSection({ reviews }: { reviews: ReviewLike[] }) {
  const validReviews = reviews.filter(r => r.wouldListenAgain !== null);
  const total = validReviews.length;

  if (total === 0) return null;

  const listenAgainCount = validReviews.filter(r => r.wouldListenAgain === true).length;
  const playlistCount = reviews.filter(r => r.wouldAddToPlaylist === true).length;
  const shareCount = reviews.filter(r => r.wouldShare === true).length;
  const followCount = reviews.filter(r => r.wouldFollow === true).length;

  const listenAgainPct = Math.round((listenAgainCount / total) * 100);
  const playlistPct = Math.round((playlistCount / total) * 100);
  const sharePct = Math.round((shareCount / total) * 100);
  const followPct = Math.round((followCount / total) * 100);

  // Overall engagement score (weighted average)
  const overallEngagement = Math.round(
    (listenAgainPct * 0.4 + playlistPct * 0.3 + sharePct * 0.2 + followPct * 0.1)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-neutral-700">Listener Engagement</div>
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
      </div>
      <div className="space-y-2">
        <EngagementRow
          label="Would listen again"
          percentage={listenAgainPct}
          count={listenAgainCount}
          total={total}
        />
        <EngagementRow
          label="Would add to playlist"
          percentage={playlistPct}
          count={playlistCount}
          total={total}
        />
        <EngagementRow
          label="Would share with friends"
          percentage={sharePct}
          count={shareCount}
          total={total}
        />
        <EngagementRow
          label="Would follow artist"
          percentage={followPct}
          count={followCount}
          total={total}
        />
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
  reviews: ReviewLike[];
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Pattern Analytics
        </CardTitle>
        <p className="text-sm text-neutral-400 mt-1">
          Insights from {completed} review{completed === 1 ? "" : "s"}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
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
