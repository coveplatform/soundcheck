import { ReviewCarousel } from "@/components/reviews/review-carousel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";

const qualityLabels: Record<string, string> = {
  PROFESSIONAL: "Professional",
  RELEASE_READY: "Release Ready",
  ALMOST_THERE: "Almost There",
  DEMO_STAGE: "Demo Stage",
  NOT_READY: "Not Ready Yet",
};

const qualityColor: Record<string, string> = {
  PROFESSIONAL: "text-purple-600",
  RELEASE_READY: "text-purple-600",
  ALMOST_THERE: "text-amber-600",
  DEMO_STAGE: "text-orange-500",
  NOT_READY: "text-red-500",
};

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

  const issues: { label: string; count: number }[] = [];
  if (counted.filter((r) => r.vocalClarity === "BURIED").length > 0)
    issues.push({ label: "Vocals buried", count: counted.filter((r) => r.vocalClarity === "BURIED").length });
  if (counted.filter((r) => r.lowEndClarity === "BOTH_MUDDY").length > 0)
    issues.push({ label: "Low end muddy", count: counted.filter((r) => r.lowEndClarity === "BOTH_MUDDY").length });
  if (counted.filter((r) => r.dynamics === "TOO_COMPRESSED").length > 0)
    issues.push({ label: "Over-compressed", count: counted.filter((r) => r.dynamics === "TOO_COMPRESSED").length });
  if (counted.filter((r) => r.tooRepetitive === true).length > 0)
    issues.push({ label: "Repetitive", count: counted.filter((r) => r.tooRepetitive === true).length });
  if (counted.filter((r) => r.trackLength === "WAY_TOO_LONG").length > 0)
    issues.push({ label: "Too long", count: counted.filter((r) => r.trackLength === "WAY_TOO_LONG").length });
  if (counted.filter((r) => r.highEndQuality === "TOO_HARSH").length > 0)
    issues.push({ label: "Highs harsh", count: counted.filter((r) => r.highEndQuality === "TOO_HARSH").length });
  if (counted.filter((r) => r.stereoWidth === "TOO_NARROW").length > 0)
    issues.push({ label: "Too narrow", count: counted.filter((r) => r.stereoWidth === "TOO_NARROW").length });

  const impressionLine =
    hookCount === total && total > 0
      ? total === 1 ? "1 listener hooked" : `All ${total} listeners hooked`
      : hookCount > 0
      ? `${hookCount} of ${total} listeners hooked`
      : decentCount === total && total > 0
      ? "Solid reception across the board"
      : `${total} listener${total !== 1 ? "s" : ""} reviewed`;

  const color = (topQuality && qualityColor[topQuality]) || "text-black";

  return (
    <div className="rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden mb-4">
      <div className="px-6 py-5">
        <p className="text-xs font-semibold text-black/40 mb-2">
          Listener Verdict · {total} review{total !== 1 ? "s" : ""}
        </p>
        {topQuality && qualityLabels[topQuality] && (
          <p className={`text-2xl font-black leading-tight mb-1 ${color}`}>
            {qualityLabels[topQuality]}
          </p>
        )}
        <p className="text-sm text-black/50">
          {impressionLine}
          {replayTotal > 0 && (
            <span className="text-black/60 font-medium">
              {" "}· {replayYes}/{replayTotal} would replay
            </span>
          )}
        </p>
        {issues.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {issues.map(({ label, count }) => (
              <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                ⚠ {label}{count > 1 ? ` · ${count}/${total}` : ""}
              </span>
            ))}
          </div>
        )}
        {issues.length === 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
              ✓ No major technical issues
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewsTabProps {
  reviews: any[];
  trackId: string;
  reviewsB?: any[];
  titleA?: string;
  titleB?: string;
  trackTitle?: string;
}

export function ReviewsTab({ reviews, trackId, reviewsB, titleA, titleB, trackTitle }: ReviewsTabProps) {
  const isCompare = !!reviewsB && reviewsB.length > 0;
  const totalReviews = reviews.length + (reviewsB?.length ?? 0);

  return (
    <div className="space-y-4">
      {!isCompare && <FeedbackSummaryBanner reviews={reviews} />}

      {isCompare ? (
        // Compare: show both versions' reviews with labels
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/40 px-1">
              Version A — {titleA ?? "Original"}
            </p>
            <div className="rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden">
              <ReviewCarousel reviews={reviews} showControls={true} trackTitle={trackTitle ?? titleA} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-500 px-1">
              Version B — {titleB ?? "Alternate"}
            </p>
            <div className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden">
              <ReviewCarousel reviews={reviewsB!} showControls={true} trackTitle={titleB} />
            </div>
          </div>
        </div>
      ) : (
        /* Single track: reviews carousel */
        <div className="rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden">
          <ReviewCarousel reviews={reviews} showControls={true} trackTitle={trackTitle} />
        </div>
      )}

      {/* Insights nudge */}
      {totalReviews >= 2 && (
        <div className="rounded-2xl border border-black/8 bg-white shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">See your full analytics</p>
            <p className="text-xs text-black/40 leading-snug">
              Score trends, category breakdowns, and feedback patterns across all your tracks.
            </p>
          </div>
          <Link href="/tracks?view=insights" className="flex-shrink-0">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl h-8 px-3 text-xs"
            >
              View Insights
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
