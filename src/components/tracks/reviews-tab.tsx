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

  const qualityAccent: Record<string, string> = {
    PROFESSIONAL: "bg-lime-400",
    RELEASE_READY: "bg-lime-400",
    ALMOST_THERE: "bg-amber-400",
    DEMO_STAGE: "bg-orange-400",
    NOT_READY: "bg-red-500",
  };

  const accent = (topQuality && qualityAccent[topQuality]) || "bg-purple-500";

  const issues: { label: string; count: number }[] = [];
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
      ? total === 1 ? "1 listener hooked" : `All ${total} listeners hooked`
      : hookCount > 0
      ? `${hookCount} of ${total} listeners hooked`
      : decentCount === total && total > 0
      ? total === 1 ? "Solid reception" : "Solid reception across the board"
      : `${total} listener${total !== 1 ? "s" : ""} reviewed`;

  return (
    <div className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
      {/* Accent bar */}
      <div className={`h-2 ${accent}`} />
      {/* Header */}
      <div className="bg-black px-5 py-3.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Listener Verdict · {total} review{total !== 1 ? "s" : ""}
        </p>
      </div>
      {/* Body */}
      <div className="bg-white px-5 py-5">
        {topQuality && qualityLabels[topQuality] && (
          <h2 className="text-4xl sm:text-5xl font-black text-black leading-none tracking-tight mb-2">
            {qualityLabels[topQuality]}
          </h2>
        )}
        <p className="text-sm text-black/50 mb-4">
          {impressionLine}
          {replayTotal > 0 && (
            <span className="text-black font-bold">
              {" "}· {replayYes}/{replayTotal} would replay
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {issues.map(({ label, count }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black bg-amber-400 text-xs font-black text-black"
            >
              ⚠ {label}
              {count === total && total > 1 ? " · all" : count > 1 ? ` · ${count}/${total}` : ""}
            </span>
          ))}
          {issues.length === 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-black bg-lime-400 text-xs font-black text-black">
              ✓ No major technical issues
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewsTabProps {
  reviews: any[];
  trackId: string;
}

export function ReviewsTab({ reviews, trackId }: ReviewsTabProps) {
  const totalReviews = reviews.length;

  return (
    <div className="space-y-5">
      <FeedbackSummaryBanner reviews={reviews} />

      {/* Reviews Carousel */}
      <div className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
        <ReviewCarousel reviews={reviews} showControls={true} />
      </div>

      {/* Insights nudge */}
      {totalReviews >= 2 && (
        <div className="border-2 border-black flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-9 w-9 border-2 border-black bg-black flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-black">See your full analytics</p>
              <p className="text-xs text-black/50 leading-snug">
                Score trends, category breakdowns, and feedback patterns across all your tracks.
              </p>
            </div>
          </div>
          <Link href="/tracks?view=insights" className="flex-shrink-0">
            <Button
              size="sm"
              className="bg-black hover:bg-black/80 text-white font-black border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs rounded-none h-9"
            >
              View Insights
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
