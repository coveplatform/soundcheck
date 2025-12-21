import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function buildScoreDistribution(reviews: ReviewLike[], field: keyof ReviewLike) {
  const counts = new Array(5).fill(0) as number[];
  for (const r of reviews) {
    const v = r[field];
    if (typeof v === "number" && v >= 1 && v <= 5) {
      counts[v - 1] += 1;
    }
  }
  const total = counts.reduce((a, b) => a + b, 0);
  return { counts, total };
}

function topFrequencies(items: string[], limit = 8) {
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

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="grid grid-cols-[64px_1fr_44px] items-center gap-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-neutral-900" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-neutral-500 text-right">{pct}%</div>
    </div>
  );
}

function ScoreDistribution({
  title,
  counts,
  total,
}: {
  title: string;
  counts: number[];
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((score) => (
          <BarRow
            key={score}
            label={`${score}`}
            count={counts[score - 1] ?? 0}
            total={total}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, count, max }: { label: string; count: number; max: number }) {
  const intensity = max > 0 ? Math.max(0.25, count / max) : 0.25;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border",
        "border-neutral-200"
      )}
      style={{ backgroundColor: `rgba(0,0,0,${0.06 + intensity * 0.06})` }}
    >
      <span className="font-medium">{label}</span>
      <span className="text-neutral-500">{count}</span>
    </span>
  );
}

export function AggregateAnalytics({ reviews }: { reviews: ReviewLike[] }) {
  const completed = reviews.length;

  const production = buildScoreDistribution(reviews, "productionScore");
  const vocals = buildScoreDistribution(reviews, "vocalScore");
  const originality = buildScoreDistribution(reviews, "originalityScore");

  const impressions = {
    STRONG_HOOK: reviews.filter((r) => r.firstImpression === "STRONG_HOOK").length,
    DECENT: reviews.filter((r) => r.firstImpression === "DECENT").length,
    LOST_INTEREST: reviews.filter((r) => r.firstImpression === "LOST_INTEREST").length,
  };
  const impressionsTotal = impressions.STRONG_HOOK + impressions.DECENT + impressions.LOST_INTEREST;

  const genreItems = reviews
    .map((r) => r.perceivedGenre)
    .filter((v): v is string => Boolean(v && v.trim().length));

  const artistsItems = reviews
    .flatMap((r) => (r.similarArtists ?? "").split(","))
    .map((v) => v.trim())
    .filter(Boolean);

  const topGenres = topFrequencies(genreItems, 10);
  const topArtists = topFrequencies(artistsItems, 12);

  const maxGenre = Math.max(0, ...topGenres.map((g) => g.count));
  const maxArtist = Math.max(0, ...topArtists.map((a) => a.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggregate Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <ScoreDistribution title="Production" counts={production.counts} total={production.total} />
          <ScoreDistribution title="Originality" counts={originality.counts} total={originality.total} />
          <ScoreDistribution title="Vocals" counts={vocals.counts} total={vocals.total} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-sm font-medium">First Impression</div>
            <div className="space-y-2">
              <BarRow label="Hook" count={impressions.STRONG_HOOK} total={impressionsTotal} />
              <BarRow label="Decent" count={impressions.DECENT} total={impressionsTotal} />
              <BarRow label="Lost" count={impressions.LOST_INTEREST} total={impressionsTotal} />
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div className="text-sm font-medium">Perceived Genre Consensus</div>
            {topGenres.length === 0 ? (
              <div className="text-sm text-neutral-500">No genre notes yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topGenres.map((g) => (
                  <Chip key={g.label} label={g.label} count={g.count} max={maxGenre} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-3">
            <div className="text-sm font-medium">Similar Artists (frequency)</div>
            {topArtists.length === 0 ? (
              <div className="text-sm text-neutral-500">No similar artists mentioned yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topArtists.map((a) => (
                  <Chip key={a.label} label={a.label} count={a.count} max={maxArtist} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-neutral-400">Based on {completed} completed review{completed === 1 ? "" : "s"}.</div>
      </CardContent>
    </Card>
  );
}
