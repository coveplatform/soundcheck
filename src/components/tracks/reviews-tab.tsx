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
  PROFESSIONAL: "text-lime-600",
  RELEASE_READY: "text-lime-600",
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

  const color = (topQuality && qualityColor[topQuality]) || "text-black";

  return (
    <div className="mb-10">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/25 mb-2">
        Listener Verdict · {total} review{total !== 1 ? "s" : ""}
      </p>
      {topQuality && qualityLabels[topQuality] && (
        <h2 className={`text-6xl sm:text-7xl font-black leading-none tracking-tighter mb-3 ${color}`}>
          {qualityLabels[topQuality]}
        </h2>
      )}
      <p className="text-sm text-black/40 mb-3">
        {impressionLine}
        {replayTotal > 0 && (
          <span className="text-black/60 font-bold">
            {" "}· {replayYes}/{replayTotal} would replay
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        {issues.length === 0 ? (
          <span className="text-[11px] font-black text-black/25 uppercase tracking-wide">✓ No major technical issues</span>
        ) : (
          issues.map(({ label, count }) => (
            <span key={label} className="text-[11px] font-black text-amber-600 uppercase tracking-wide">
              ⚠ {label}{count > 1 ? ` · ${count}/${total}` : ""}
            </span>
          ))
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
  const totalReviews = reviews.length;

  return (
    <div className="space-y-0">
      <FeedbackSummaryBanner reviews={reviews} />

      {/* Reviews — no outer box */}
      <ReviewCarousel reviews={reviews} showControls={true} />

      {/* Insights nudge */}
      {totalReviews >= 2 && (
        <div className="mt-10 pt-6 border-t border-black/10 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BarChart3 className="h-3.5 w-3.5 text-black/25 flex-shrink-0" />
            <p className="text-xs text-black/40">
              Score trends, category breakdowns, and feedback patterns across all your tracks.
            </p>
          </div>
          <Link href="/tracks?view=insights" className="flex-shrink-0">
            <Button
              size="sm"
              className="bg-black hover:bg-black/80 text-white font-black border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs rounded-none h-8"
            >
              Full Insights
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
