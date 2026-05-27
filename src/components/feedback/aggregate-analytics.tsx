import { Tooltip } from "@/components/ui/tooltip";
import { Zap, Sparkles, Music, TrendingUp, TrendingDown, Minus } from "lucide-react";

type FirstImpression = "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";

type ReviewLike = {
  productionScore: number | null;
  vocalScore: number | null;
  originalityScore: number | null;
  similarArtists: string | null;
  firstImpression: FirstImpression | null;
  lowEndClarity: string | null;
  vocalClarity: string | null;
  highEndQuality: string | null;
  stereoWidth: string | null;
  dynamics: string | null;
  tooRepetitive: boolean | null;
  trackLength: string | null;
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

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 4.5) return { label: "Exceptional", color: "text-purple-600" };
  if (score >= 4.0) return { label: "Strong", color: "text-purple-600" };
  if (score >= 3.5) return { label: "Solid", color: "text-black/50" };
  if (score >= 3.0) return { label: "Average", color: "text-black/40" };
  if (score >= 2.5) return { label: "Developing", color: "text-amber-600" };
  return { label: "Needs work", color: "text-amber-600" };
}

function ComparisonIndicator({ score, platformAvg }: { score: number; platformAvg?: number }) {
  if (!platformAvg || platformAvg === 0) {
    const { label, color } = getScoreLabel(score);
    return <p className={`text-xs font-medium mt-0.5 ${color}`}>{label}</p>;
  }
  const diff = score - platformAvg;
  const absDiff = Math.abs(diff).toFixed(1);
  const { label } = getScoreLabel(score);
  if (diff > 0.2) {
    return (
      <div className="flex items-center justify-center gap-1 text-xs font-medium text-purple-600 mt-0.5">
        <TrendingUp className="h-3 w-3" />
        <span>{label} +{absDiff}</span>
      </div>
    );
  } else if (diff < -0.2) {
    return (
      <div className="flex items-center justify-center gap-1 text-xs font-medium text-amber-600 mt-0.5">
        <TrendingDown className="h-3 w-3" />
        <span>{label} -{absDiff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1 text-xs font-medium text-black/40 mt-0.5">
      <Minus className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}

function ScoreBlock({
  score,
  label,
  icon: Icon,
  platformAvg,
  tooltipContent,
  isLast,
}: {
  score: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  platformAvg?: number;
  tooltipContent: string;
  isLast?: boolean;
}) {
  return (
    <div className={`flex-1 px-5 py-5 text-center ${!isLast ? "border-r border-black/6" : ""}`}>
      <div className="text-3xl font-black tabular-nums leading-none text-black">
        {score.toFixed(1)}
      </div>
      <Tooltip content={tooltipContent}>
        <div className="flex items-center justify-center gap-1 mt-2 cursor-help">
          <Icon className="h-3 w-3 text-black/25" />
          <span className="text-xs font-medium text-black/40">{label}</span>
        </div>
      </Tooltip>
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
    <div>
      <p className="text-xs font-semibold text-black/40 mb-3">First Impressions</p>
      <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-black/6 mb-3">
        {hookPct > 0 && <div className="h-full bg-purple-500" style={{ width: `${hookPct}%` }} title={`Strong Hook: ${hookPct}%`} />}
        {decentPct > 0 && <div className="h-full bg-amber-400" style={{ width: `${decentPct}%` }} title={`Decent: ${decentPct}%`} />}
        {lostPct > 0 && <div className="h-full bg-black/15" style={{ width: `${lostPct}%` }} title={`Lost Interest: ${lostPct}%`} />}
      </div>
      <div className="flex gap-4 text-xs text-black/50 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
          Strong Hook {hookPct}%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
          Decent {decentPct}%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-black/15 flex-shrink-0" />
          Lost {lostPct}%
        </div>
      </div>
      <p className="text-xs text-black/40 leading-relaxed">
        {hookPct >= 60
          ? `${hookPct}% of listeners were immediately hooked — that's a strong opening.`
          : hookPct >= 40
          ? `${hookPct}% got a strong first impression — there's room to sharpen your opening.`
          : lostPct >= 40
          ? `${lostPct}% of listeners lost interest early — your intro may need work.`
          : "Mixed first impressions — consider whether your opening grabs attention fast enough."}
      </p>
    </div>
  );
}

function TechMetricRow({
  label,
  issueCount,
  totalCount,
  issueLabel,
  tooltip,
}: {
  label: string;
  issueCount: number;
  totalCount: number;
  issueLabel: string;
  tooltip: string;
}) {
  if (totalCount === 0) return null;
  const issuePct = Math.round((issueCount / totalCount) * 100);
  const barColor = issuePct === 0 ? "bg-purple-400" : issuePct < 40 ? "bg-amber-400" : "bg-red-400";
  const textColor = issuePct === 0 ? "text-purple-600" : issuePct < 40 ? "text-amber-600" : "text-red-500";

  return (
    <div className="flex items-center gap-3">
      <Tooltip content={tooltip}>
        <span className="text-xs font-medium text-black/40 w-28 flex-shrink-0 cursor-help">
          {label}
        </span>
      </Tooltip>
      <div className="flex-1 h-1.5 bg-black/6 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(issuePct, issuePct === 0 ? 0 : 4)}%` }} />
      </div>
      <span className={`text-xs font-medium w-24 text-right flex-shrink-0 ${textColor}`}>
        {issuePct === 0 ? "All clear" : `${issuePct}% — ${issueLabel}`}
      </span>
    </div>
  );
}

function TechnicalQualitySection({ reviews }: { reviews: ReviewLike[] }) {
  const lowEndReviews = reviews.filter(r => r.lowEndClarity !== null);
  const lowEndIssues = lowEndReviews.filter(r => r.lowEndClarity !== "PERFECT").length;
  const vocalReviews = reviews.filter(r => r.vocalClarity !== null && r.vocalClarity !== "NOT_APPLICABLE");
  const vocalIssues = vocalReviews.filter(r => r.vocalClarity !== "CRYSTAL_CLEAR").length;
  const highEndReviews = reviews.filter(r => r.highEndQuality !== null);
  const highEndIssues = highEndReviews.filter(r => r.highEndQuality !== "PERFECT" && r.highEndQuality !== "ACCEPTABLE").length;
  const stereoReviews = reviews.filter(r => r.stereoWidth !== null);
  const stereoIssues = stereoReviews.filter(r => r.stereoWidth !== "GOOD_BALANCE").length;
  const dynamicsReviews = reviews.filter(r => r.dynamics !== null);
  const dynamicsIssues = dynamicsReviews.filter(r => r.dynamics !== "GREAT_DYNAMICS" && r.dynamics !== "ACCEPTABLE").length;
  const lengthReviews = reviews.filter(r => r.trackLength !== null);
  const lengthIssues = lengthReviews.filter(r => r.trackLength !== "PERFECT").length;
  const repetitiveReviews = reviews.filter(r => r.tooRepetitive !== null);
  const repetitiveIssues = repetitiveReviews.filter(r => r.tooRepetitive === true).length;
  const hasData = [lowEndReviews, vocalReviews, highEndReviews, stereoReviews, dynamicsReviews, lengthReviews, repetitiveReviews].some(a => a.length > 0);
  if (!hasData) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-black/40 mb-1">Technical Quality</p>
      <p className="text-xs text-black/30 mb-4">Lower bars are better</p>
      <div className="space-y-3">
        <TechMetricRow label="Low end" issueCount={lowEndIssues} totalCount={lowEndReviews.length} issueLabel="muddy" tooltip="How many reviewers felt the bass and low frequencies were muddy or overpowering." />
        <TechMetricRow label="Vocal presence" issueCount={vocalIssues} totalCount={vocalReviews.length} issueLabel="buried" tooltip="How many reviewers felt the vocals were too quiet or buried under the music." />
        <TechMetricRow label="High end" issueCount={highEndIssues} totalCount={highEndReviews.length} issueLabel="too harsh" tooltip="How many reviewers found the treble or high frequencies too bright or ear-fatiguing." />
        <TechMetricRow label="Stereo width" issueCount={stereoIssues} totalCount={stereoReviews.length} issueLabel="imbalanced" tooltip="How many reviewers felt the mix was too narrow or unbalanced across left and right channels." />
        <TechMetricRow label="Dynamics" issueCount={dynamicsIssues} totalCount={dynamicsReviews.length} issueLabel="compressed" tooltip="How many reviewers felt the track was over-compressed." />
        <TechMetricRow label="Track length" issueCount={lengthIssues} totalCount={lengthReviews.length} issueLabel="too long" tooltip="How many reviewers felt the track ran on too long." />
        <TechMetricRow label="Repetitive" issueCount={repetitiveIssues} totalCount={repetitiveReviews.length} issueLabel="repetitive" tooltip="How many reviewers felt the track repeated itself too much without enough variation." />
      </div>
    </div>
  );
}

export function AggregateAnalytics({
  reviews,
  platformAverages,
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
  const topArtists = topFrequencies(artistsItems, 6);

  const hasScores = avgProduction > 0 || avgOriginality > 0 || avgVocals > 0;
  const scoreBlocks = [
    avgProduction > 0 ? { score: avgProduction, label: "Production", icon: Zap, platformAvg: platformAverages?.production, tooltip: "How polished and professional the overall mix sounds — clarity, balance, and technical execution. 4.0+ is strong." } : null,
    avgOriginality > 0 ? { score: avgOriginality, label: "Originality", icon: Sparkles, platformAvg: platformAverages?.originality, tooltip: "How fresh and distinctive your sound feels. Higher scores mean reviewers found it unique and memorable." } : null,
    avgVocals > 0 ? { score: avgVocals, label: "Vocals", icon: Music, platformAvg: platformAverages?.vocals, tooltip: "How clearly your vocals cut through the mix. A low score means reviewers felt vocals were too buried." } : null,
  ].filter(Boolean) as { score: number; label: string; icon: any; platformAvg?: number; tooltip: string }[];

  return (
    <div className="space-y-4">

      {/* Score card */}
      {hasScores && (
        <div className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-black/6">
            <p className="text-xs font-semibold text-black/40">Scores · {completed} review{completed !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex divide-x divide-black/6">
            {scoreBlocks.map((b, i) => (
              <ScoreBlock
                key={b.label}
                score={b.score}
                label={b.label}
                icon={b.icon}
                platformAvg={b.platformAvg}
                tooltipContent={b.tooltip}
                isLast={i === scoreBlocks.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* First Impressions card */}
      {impressionsTotal > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white shadow-sm p-5">
          <ImpressionsBar impressions={impressions} total={impressionsTotal} />
        </div>
      )}

      {/* Technical Quality card */}
      <div className="rounded-2xl border border-black/8 bg-white shadow-sm p-5">
        <TechnicalQualitySection reviews={reviews} />
      </div>

      {/* Similar Artists card */}
      {topArtists.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white shadow-sm p-5">
          <p className="text-xs font-semibold text-black/40 mb-1">Sounds Like</p>
          <p className="text-xs text-black/30 mb-4">Artists your reviewers most commonly compared your sound to</p>
          <div className="flex flex-wrap gap-2">
            {topArtists.map((a) => (
              <span key={a.label} className="px-3 py-1.5 rounded-full bg-black/[0.04] text-sm font-medium text-black/70">
                {a.label}
                <span className="ml-1.5 text-xs text-black/30">×{a.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
