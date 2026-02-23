import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp } from "lucide-react";

function FeedbackSummaryBanner({ reviews }: { reviews: any[] }) {
  const counted = reviews.filter((r) => r.countsTowardAnalytics !== false);
  const total = counted.length;
  if (total === 0) return null;

  const replayYes = counted.filter((r) => r.wouldListenAgain === true).length;
  const replayTotal = counted.filter((r) => r.wouldListenAgain !== null).length;

  const hookCount = counted.filter((r) => r.firstImpression === "STRONG_HOOK").length;
  const decentCount = counted.filter((r) => r.firstImpression === "DECENT").length;

  // Dominant quality level
  const qualityVotes = counted.map((r) => r.qualityLevel).filter(Boolean) as string[];
  const qualityFreq = qualityVotes.reduce<Record<string, number>>((acc, q) => {
    acc[q] = (acc[q] ?? 0) + 1;
    return acc;
  }, {});
  const topQuality = Object.entries(qualityFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

  const qualityLabels: Record<string, string> = {
    PROFESSIONAL: "Professional",
    RELEASE_READY: "Release Ready",
    ALMOST_THERE: "Almost There",
    DEMO_STAGE: "Demo Stage",
    NOT_READY: "Not Ready Yet",
  };

  const gradientByQuality: Record<string, string> = {
    PROFESSIONAL: "from-lime-500 to-emerald-600",
    RELEASE_READY: "from-lime-500 to-emerald-600",
    ALMOST_THERE: "from-purple-600 to-indigo-700",
    DEMO_STAGE: "from-amber-500 to-orange-600",
    NOT_READY: "from-orange-500 to-red-600",
  };
  const gradient =
    (topQuality && gradientByQuality[topQuality]) || "from-purple-600 to-indigo-700";

  // Consensus issues — show any that appear in at least 1 review
  type Issue = { label: string; count: number };
  const issues: Issue[] = [];

  const vocalBuried = counted.filter((r) => r.vocalClarity === "BURIED").length;
  const lowEndMuddy = counted.filter((r) => r.lowEndClarity === "BOTH_MUDDY").length;
  const tooCompressed = counted.filter((r) => r.dynamics === "TOO_COMPRESSED").length;
  const repetitive = counted.filter((r) => r.tooRepetitive === true).length;
  const tooLong = counted.filter((r) => r.trackLength === "WAY_TOO_LONG").length;
  const harshHighs = counted.filter((r) => r.highEndQuality === "TOO_HARSH").length;
  const tooNarrow = counted.filter((r) => r.stereoWidth === "TOO_NARROW").length;

  if (vocalBuried > 0) issues.push({ label: "Vocals buried", count: vocalBuried });
  if (lowEndMuddy > 0) issues.push({ label: "Low end muddy", count: lowEndMuddy });
  if (tooCompressed > 0) issues.push({ label: "Over-compressed", count: tooCompressed });
  if (repetitive > 0) issues.push({ label: "Repetitive", count: repetitive });
  if (tooLong > 0) issues.push({ label: "Too long", count: tooLong });
  if (harshHighs > 0) issues.push({ label: "Highs harsh", count: harshHighs });
  if (tooNarrow > 0) issues.push({ label: "Too narrow", count: tooNarrow });

  const impressionLine =
    hookCount === total && total > 0
      ? `All ${total} listeners hooked`
      : hookCount > 0
      ? `${hookCount} of ${total} listeners hooked`
      : decentCount === total && total > 0
      ? "Solid reception across the board"
      : `${total} listener${total !== 1 ? "s" : ""} reviewed`;

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white`}>
      <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/60 mb-3">
        Listener Verdict · {total} review{total !== 1 ? "s" : ""}
      </p>
      {topQuality && qualityLabels[topQuality] && (
        <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-2">
          {qualityLabels[topQuality]}
        </h2>
      )}
      <p className="text-sm text-white/80 mb-4">
        {impressionLine}
        {replayTotal > 0 && ` · ${replayYes}/${replayTotal} would replay`}
      </p>
      <div className="flex flex-wrap gap-2">
        {issues.map(({ label, count }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-xs font-semibold text-white"
          >
            ⚠ {label}
            {count === total && total > 1 ? " · all" : count > 1 ? ` · ${count}/${total}` : ""}
          </span>
        ))}
        {issues.length === 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
            ✓ No major technical issues flagged
          </span>
        )}
      </div>
    </div>
  );
}

interface ReviewsTabProps {
  reviews: any[];
  trackId: string;
}

export function ReviewsTab({ reviews, trackId }: ReviewsTabProps) {
  const displayedReviews = reviews;
  const totalReviews = reviews.length;

  return (
    <div className="space-y-5">
      {/* Wrapped-style summary banner */}
      <FeedbackSummaryBanner reviews={reviews} />

      {/* Reviews Carousel */}
      <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
        <CardHeader className="sr-only">
          <CardTitle>Reviews ({totalReviews})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ReviewCarousel reviews={displayedReviews} showControls={true} />
        </CardContent>
      </Card>

      {/* Insights nudge */}
      {totalReviews >= 2 && (
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-white p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-black mb-1">See your full analytics</h4>
              <p className="text-xs text-black/60 leading-relaxed mb-3">
                Score trends over time, category breakdowns, and feedback patterns across all your
                tracks.
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] text-black/40 mb-4">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Score breakdowns
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Trend analysis
                </span>
              </div>
              <Link href="/tracks?view=insights">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.6)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.6)] active:shadow-[1px_1px_0_rgba(0,0,0,0.6)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  View Insights
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
