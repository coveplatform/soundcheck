import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Zap, Sparkles, Music } from "lucide-react";

type FirstImpression = "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";

type ReviewLike = {
  productionScore: number | null;
  vocalScore: number | null;
  originalityScore: number | null;
  wouldListenAgain: boolean | null;
  perceivedGenre: string | null;
  similarArtists: string | null;
  firstImpression: FirstImpression | null;
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

function ScoreCircle({
  score,
  label,
  icon: Icon,
}: {
  score: number;
  label: string;
  icon: React.ElementType;
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

function GenreChip({ label, count, isTop }: { label: string; count: number; isTop: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
        isTop
          ? "bg-black text-white"
          : "bg-neutral-100 text-neutral-700 border-2 border-neutral-200"
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs ${isTop ? "text-neutral-400" : "text-neutral-500"}`}>
        {count}
      </span>
    </span>
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

export function AggregateAnalytics({ reviews }: { reviews: ReviewLike[] }) {
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

  const genreItems = reviews
    .map((r) => r.perceivedGenre)
    .filter((v): v is string => Boolean(v && v.trim().length));

  const artistsItems = reviews
    .flatMap((r) => (r.similarArtists ?? "").split(","))
    .map((v) => v.trim())
    .filter(Boolean);

  // Limit to top 5 genres and top 6 artists
  const topGenres = topFrequencies(genreItems, 5);
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
        {/* Score Circles */}
        <div className="flex justify-center gap-8 sm:gap-12">
          <ScoreCircle score={avgProduction} label="Production" icon={Zap} />
          <ScoreCircle score={avgOriginality} label="Originality" icon={Sparkles} />
          <ScoreCircle score={avgVocals} label="Vocals" icon={Music} />
        </div>

        {/* Impressions Bar */}
        <ImpressionsBar impressions={impressions} total={impressionsTotal} />

        {/* Genre Consensus */}
        {topGenres.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-neutral-700">What Genre Is This?</div>
            <div className="flex flex-wrap gap-2">
              {topGenres.map((g, i) => (
                <GenreChip key={g.label} label={g.label} count={g.count} isTop={i === 0} />
              ))}
            </div>
          </div>
        )}

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
