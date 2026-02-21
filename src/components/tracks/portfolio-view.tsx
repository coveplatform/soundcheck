import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { BarChart3, TrendingUp } from "lucide-react";
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
  // Empty state - no tracks submitted yet
  if (!hasData) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card variant="soft" elevated>
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="h-12 w-12 text-black/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No insights yet</h3>
            <p className="text-sm text-black/60 mb-6">
              Submit a track and get reviews to start seeing insights and trends.
            </p>
            <Link href="/submit">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                Submit your first track
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not enough reviews for meaningful insights
  if (totalReviews < MIN_REVIEWS_FOR_INSIGHTS) {
    const reviewsNeeded = MIN_REVIEWS_FOR_INSIGHTS - totalReviews;

    return (
      <div className="max-w-3xl mx-auto">
        <Card variant="soft" elevated className="border-2 border-amber-200">
          <CardContent className="pt-6 text-center py-12">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-5">
              <TrendingUp className="h-7 w-7 text-amber-700" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Get {reviewsNeeded} more {reviewsNeeded === 1 ? 'review' : 'reviews'} for insights</h3>
            <p className="text-sm text-black/60 mb-6 max-w-md mx-auto">
              You have <span className="font-bold text-amber-700">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span> so far.
              We need at least <span className="font-bold">{MIN_REVIEWS_FOR_INSIGHTS} reviews</span> to show meaningful analytics like trends, patterns, and category breakdowns.
            </p>

            <div className="mb-6">
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (totalReviews / MIN_REVIEWS_FOR_INSIGHTS) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2 font-mono">
                {totalReviews} / {MIN_REVIEWS_FOR_INSIGHTS} reviews
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 max-w-md mx-auto mb-6">
              <p className="text-xs font-mono text-purple-700/60 uppercase tracking-widest mb-3">What you'll unlock</p>
              <div className="grid grid-cols-1 gap-2 text-left text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">📈</span>
                  <span className="text-black/70">Score trends over time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">🎯</span>
                  <span className="text-black/70">Category breakdowns (production, vocals, originality)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">💬</span>
                  <span className="text-black/70">Common feedback patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">⚡</span>
                  <span className="text-black/70">Review velocity and engagement metrics</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/submit">
                <Button variant="primary" size="lg">
                  Get more reviews
                </Button>
              </Link>
              <Link href="/tracks">
                <Button variant="outline" size="lg">
                  View my tracks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enough reviews - show full analytics
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
