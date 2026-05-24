import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (score >= 4.5) return { label: "Exceptional", color: "text-lime-600" };
  if (score >= 4.0) return { label: "Strong", color: "text-lime-600" };
  if (score >= 3.5) return { label: "Solid", color: "text-neutral-600" };
  if (score >= 3.0) return { label: "Average", color: "text-neutral-500" };
  if (score >= 2.5) return { label: "Developing", color: "text-amber-600" };
  return { label: "Needs work", color: "text-amber-600" };
}

function ComparisonIndicator({ score, platformAvg }: { score: number; platformAvg?: number }) {
  if (!platformAvg || platformAvg === 0) {
    const { label, color } = getScoreLabel(score);
    return <div className={`text-xs font-medium ${color}`}>{label}</div>;
  }

  const diff = score - platformAvg;
  const absDiff = Math.abs(diff).toFixed(1);
  const { label } = getScoreLabel(score);

  if (diff > 0.2) {
    return (
      <div className="flex items-center gap-1 text-xs text-lime-600 font-medium" title={`Platform average: ${platformAvg.toFixed(1)}`}>
        <TrendingUp className="h-3 w-3" />
        <span>{label} · +{absDiff}</span>
      </div>
    );
  } else if (diff < -0.2) {
    return (
      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium" title={`Platform average: ${platformAvg.toFixed(1)}`}>
        <TrendingDown className="h-3 w-3" />
        <span>{label} · -{absDiff}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium" title={`Platform average: ${platformAvg.toFixed(1)}`}>
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
  tooltipContent,
}: {
  score: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  platformAvg?: number;
  tooltipContent: string;
}) {
  const percentage = (score / 5) * 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f5f5f5" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={score >= 4 ? "#84cc16" : score >= 3 ? "#fbbf24" : "#f87171"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black leading-none">{score.toFixed(1)}</span>
          <span className="text-[9px] font-bold text-neutral-400 leading-none mt-0.5">/ 5</span>
        </div>
      </div>
      <Tooltip content={tooltipContent}>
        <div className="mt-2 flex items-center gap-1.5 cursor-help">
          <Icon className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-bold text-neutral-700">{label}</span>
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
    <div className="space-y-3">
      <div>
        <div className="text-sm font-bold text-neutral-700">First Impressions</div>
        <p className="text-xs text-neutral-400 mt-0.5">How listeners felt within the first few seconds of your track</p>
      </div>
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-neutral-100">
        {hookPct > 0 && (
          <div className="h-full bg-lime-500 transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${hookPct}%` }} title={`Strong Hook: ${hookPct}%`} />
        )}
        {decentPct > 0 && (
          <div className="h-full bg-amber-400 transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${decentPct}%` }} title={`Decent: ${decentPct}%`} />
        )}
        {lostPct > 0 && (
          <div className="h-full bg-neutral-300 transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${lostPct}%` }} title={`Lost Interest: ${lostPct}%`} />
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
      <p className="text-xs text-neutral-500 mt-2">
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

  const barColor =
    issuePct === 0 ? "bg-lime-400" :
    issuePct < 40 ? "bg-amber-400" :
    "bg-red-400";

  const textColor =
    issuePct === 0 ? "text-lime-600" :
    issuePct < 40 ? "text-amber-600" :
    "text-red-500";

  return (
    <div className="flex items-center gap-3">
      <Tooltip content={tooltip}>
        <span className="text-sm text-neutral-600 w-32 flex-shrink-0 cursor-help underline decoration-dotted decoration-neutral-300 underline-offset-2">{label}</span>
      </Tooltip>
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-[width] duration-300 ${barColor}`} style={{ width: `${Math.max(issuePct, issuePct === 0 ? 0 : 4)}%` }} />
      </div>
      <span className={`text-xs font-bold w-28 text-right flex-shrink-0 ${textColor}`}>
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

  const hasData = [lowEndReviews, vocalReviews, highEndReviews, stereoReviews, dynamicsReviews, lengthReviews, repetitiveReviews].some(arr => arr.length > 0);
  if (!hasData) return null;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-bold text-neutral-700">Technical Quality</div>
        <p className="text-xs text-neutral-400 mt-0.5">Lower bars are better — shows how many reviewers flagged each issue</p>
      </div>
      <div className="space-y-2.5">
        <TechMetricRow label="Low end" issueCount={lowEndIssues} totalCount={lowEndReviews.length} issueLabel="muddy" tooltip="How many reviewers felt the bass and low frequencies were muddy or overpowering." />
        <TechMetricRow label="Vocal presence" issueCount={vocalIssues} totalCount={vocalReviews.length} issueLabel="buried" tooltip="How many reviewers felt the vocals were too quiet or buried under the music." />
        <TechMetricRow label="High end" issueCount={highEndIssues} totalCount={highEndReviews.length} issueLabel="too harsh" tooltip="How many reviewers found the treble or high frequencies too bright or ear-fatiguing." />
        <TechMetricRow label="Stereo width" issueCount={stereoIssues} totalCount={stereoReviews.length} issueLabel="imbalanced" tooltip="How many reviewers felt the mix was too narrow or unbalanced across left and right channels." />
        <TechMetricRow label="Dynamics" issueCount={dynamicsIssues} totalCount={dynamicsReviews.length} issueLabel="compressed" tooltip="How many reviewers felt the track was over-compressed — making it sound flat and lifeless instead of punchy." />
        <TechMetricRow label="Track length" issueCount={lengthIssues} totalCount={lengthReviews.length} issueLabel="too long" tooltip="How many reviewers felt the track ran on too long and should be trimmed." />
        <TechMetricRow label="Repetitiveness" issueCount={repetitiveIssues} totalCount={repetitiveReviews.length} issueLabel="repetitive" tooltip="How many reviewers felt the track repeated itself too much without enough variation or progression." />
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
          <ScoreCircle score={avgProduction} label="Production" icon={Zap} platformAvg={platformAverages?.production} tooltipContent="How polished and professional the overall mix sounds — clarity, balance, and technical execution. 4.0+ is strong." />
          <ScoreCircle score={avgOriginality} label="Originality" icon={Sparkles} platformAvg={platformAverages?.originality} tooltipContent="How fresh and distinctive your sound feels. Higher scores mean reviewers found it unique and memorable." />
          <ScoreCircle score={avgVocals} label="Vocals" icon={Music} platformAvg={platformAverages?.vocals} tooltipContent="How clearly your vocals cut through the mix. A low score means reviewers felt vocals were too buried. Not shown for instrumentals." />
        </div>

        {/* First Impressions */}
        <ImpressionsBar impressions={impressions} total={impressionsTotal} />

        {/* Technical Quality */}
        <TechnicalQualitySection reviews={reviews} />

        {/* Similar Artists */}
        {topArtists.length > 0 && (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-bold text-neutral-700">Sounds Like...</div>
              <p className="text-xs text-neutral-400 mt-0.5">Artists your reviewers most commonly compared your sound to</p>
            </div>
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
