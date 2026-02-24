import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PortfolioViewProps {
  hasData: boolean;
  trackData?: any[];
  totalReviews?: number;
  totalTracks?: number;
  overallAvg?: number;
  highestScore?: number;
  improvementRate?: number;
  wouldListenAgainPercent?: number;
  categories?: any[];
  trendData?: any[];
  reviewVelocity?: any;
  feedbackPatterns?: any;
  // V2 analytics
  qualityLevels?: any;
  technicalIssues?: any[];
  nextFocusData?: any;
  playlistActionsData?: any;
  topQuickWins?: string[];
}

const MIN_REVIEWS_FOR_INSIGHTS = 3;

export function PortfolioView({
  hasData,
  trackData = [],
  totalReviews = 0,
  totalTracks = 0,
  overallAvg = 0,
  highestScore = 0,
  improvementRate = 0,
  wouldListenAgainPercent = 0,
  categories = [],
  trendData = [],
  reviewVelocity,
  feedbackPatterns,
  qualityLevels,
  technicalIssues,
  nextFocusData,
  playlistActionsData,
  topQuickWins,
}: PortfolioViewProps) {
  // Empty state — no tracks submitted yet
  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,0.06)]">
        <div className="bg-black px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_rgba(0,0,0,0.5)]">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-2xl font-black tracking-tighter text-white mb-1">No insights yet</h3>
          <p className="text-sm text-white/40 max-w-xs mx-auto">
            Submit a track and get reviews to unlock trends, scores, and feedback patterns.
          </p>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <p className="text-[13px] font-bold text-black/40">
            Insights unlock after your first reviews
          </p>
          <Link href="/submit">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 px-5 rounded-xl whitespace-nowrap">
              Submit a track
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not enough reviews yet
  if (totalReviews < MIN_REVIEWS_FOR_INSIGHTS) {
    const reviewsNeeded = MIN_REVIEWS_FOR_INSIGHTS - totalReviews;

    return (
      <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,0.06)]">
        {/* Dark header */}
        <div className="bg-black px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Insights</p>
              <h3 className="text-2xl font-black tracking-tighter text-white leading-tight">
                {reviewsNeeded} more {reviewsNeeded === 1 ? "review" : "reviews"} to go
              </h3>
            </div>
            <div className="flex-shrink-0 text-right pl-5 border-l border-white/10">
              <p className="text-4xl font-black text-white tabular-nums leading-none">{totalReviews}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/30 mt-1">
                of {MIN_REVIEWS_FOR_INSIGHTS}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalReviews / MIN_REVIEWS_FOR_INSIGHTS) * 100)}%` }}
            />
          </div>
        </div>

        {/* What unlocks */}
        <div className="px-6 py-5 border-b border-black/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-4">What you'll unlock</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Score trends", sub: "Over time" },
              { label: "Category breakdown", sub: "Production · Vocals · Originality" },
              { label: "Feedback patterns", sub: "What reviewers keep saying" },
              { label: "Review velocity", sub: "Engagement metrics" },
            ].map((item) => (
              <div key={item.label} className="bg-neutral-50 rounded-xl px-3 py-2.5 border border-black/5">
                <p className="text-[12px] font-black text-black">{item.label}</p>
                <p className="text-[10px] text-black/35 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <p className="text-[13px] font-bold text-black/40">
            You have <span className="font-black text-black">{totalReviews}</span> so far
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/submit">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-9 px-4 rounded-xl whitespace-nowrap text-[11px]">
                Get more reviews
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enough reviews — show full analytics
  return (
    <AnalyticsDashboard
      tracks={trackData}
      totalReviews={totalReviews}
      totalTracks={totalTracks}
      overallAvg={overallAvg}
      highestScore={highestScore}
      improvementRate={improvementRate}
      wouldListenAgainPercent={wouldListenAgainPercent}
      categories={categories}
      trendData={trendData}
      reviewVelocity={reviewVelocity}
      feedbackPatterns={feedbackPatterns}
      qualityLevels={qualityLevels}
      technicalIssues={technicalIssues}
      nextFocusData={nextFocusData}
      playlistActionsData={playlistActionsData}
      topQuickWins={topQuickWins}
    />
  );
}
