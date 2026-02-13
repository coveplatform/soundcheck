import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";

interface PortfolioViewProps {
  isPro: boolean;
  hasData: boolean;
  trackData?: any[];
  totalReviews?: number;
  totalEarnings?: number;
  totalTracks?: number;
  overallAvg?: number;
  highestScore?: number;
  improvementRate?: number;
  wouldListenAgainPercent?: number;
  categories?: any[];
  trendData?: any[];
  earningsData?: any[];
  reviewVelocity?: any;
  feedbackPatterns?: any;
}

export function PortfolioView({
  isPro,
  hasData,
  trackData = [],
  totalReviews = 0,
  totalEarnings = 0,
  totalTracks = 0,
  overallAvg = 0,
  highestScore = 0,
  improvementRate = 0,
  wouldListenAgainPercent = 0,
  categories = [],
  trendData = [],
  earningsData = [],
  reviewVelocity,
  feedbackPatterns,
}: PortfolioViewProps) {
  // Empty state for subscribed users with no data
  if (isPro && !hasData) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card variant="soft" elevated>
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="h-12 w-12 text-black/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No analytics yet</h3>
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

  // Upgrade prompt for non-Pro users
  if (!isPro) {
    // Show demo data blurred
    const demoData = {
      tracks: [
        { id: '1', title: 'Summer Vibes', artworkUrl: null, createdAt: new Date(), completedAt: new Date(), reviewsCompleted: 10, avgScore: 4.2, categoryScores: { production: 4.3, vocals: 4.0, originality: 4.3 }, engagement: { listenAgain: 85, playlist: 72, share: 68 }, earnings: 12.50 },
        { id: '2', title: 'Night Drive', artworkUrl: null, createdAt: new Date(), completedAt: new Date(), reviewsCompleted: 10, avgScore: 4.5, categoryScores: { production: 4.6, vocals: 4.3, originality: 4.6 }, engagement: { listenAgain: 90, playlist: 80, share: 75 }, earnings: 18.00 },
        { id: '3', title: 'Lost in Thought', artworkUrl: null, createdAt: new Date(), completedAt: new Date(), reviewsCompleted: 10, avgScore: 3.8, categoryScores: { production: 3.9, vocals: 3.7, originality: 3.8 }, engagement: { listenAgain: 70, playlist: 60, share: 55 }, earnings: 8.50 },
      ],
      totalReviews: 30,
      totalEarnings: 39.00,
      totalTracks: 3,
      overallAvg: 4.17,
      highestScore: 4.5,
      improvementRate: 15.8,
      wouldListenAgainPercent: 82,
      categories: [
        { name: "Production", score: 4.27, color: "bg-purple-500" },
        { name: "Originality", score: 4.23, color: "bg-purple-500" },
        { name: "Vocals", score: 4.0, color: "bg-blue-500" },
      ],
      trendData: [
        { month: "Jan 2024", production: 4.1, vocals: 3.8, originality: 4.0, overall: 3.97 },
        { month: "Feb 2024", production: 4.3, vocals: 4.0, originality: 4.2, overall: 4.17 },
        { month: "Mar 2024", production: 4.5, vocals: 4.2, originality: 4.4, overall: 4.37 },
      ],
      earningsData: [
        { month: "Jan 2024", earnings: 8.50, trackCount: 1 },
        { month: "Feb 2024", earnings: 12.50, trackCount: 1 },
        { month: "Mar 2024", earnings: 18.00, trackCount: 1 },
      ],
      reviewVelocity: {
        avgTimeToComplete: 2.3,
        fastestTrack: { title: 'Night Drive', days: 1.2 },
        slowestTrack: { title: 'Lost in Thought', days: 3.8 },
        reviewsPerWeek: 10.5
      },
      feedbackPatterns: {
        commonPraise: [
          { word: "production", count: 18 },
          { word: "mix", count: 15 },
          { word: "energy", count: 12 },
          { word: "catchy", count: 10 },
          { word: "professional", count: 9 },
        ],
        commonCritiques: [
          { word: "vocals", count: 8 },
          { word: "repetitive", count: 6 },
          { word: "clarity", count: 5 },
        ],
        improvingAreas: ["Production quality", "Originality"],
        consistentStrengths: ["Production", "Originality"],
      },
    };

    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-md opacity-40">
          <AnalyticsDashboard
            tracks={demoData.tracks}
            totalReviews={demoData.totalReviews}
            totalEarnings={demoData.totalEarnings}
            totalTracks={demoData.totalTracks}
            overallAvg={demoData.overallAvg}
            highestScore={demoData.highestScore}
            improvementRate={demoData.improvementRate}
            wouldListenAgainPercent={demoData.wouldListenAgainPercent}
            categories={demoData.categories}
            trendData={demoData.trendData}
            earningsData={demoData.earningsData}
            reviewVelocity={demoData.reviewVelocity}
            feedbackPatterns={demoData.feedbackPatterns}
          />
        </div>

        <div className="absolute inset-0 flex items-start justify-center pt-10">
          <Card
            variant="soft"
            elevated
            className="border-2 border-purple-400 rounded-3xl overflow-hidden w-full max-w-2xl"
          >
            <CardContent className="pt-6 text-center py-10">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-5">
                <BarChart3 className="h-7 w-7 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black mb-2">See what&apos;s working</h2>
              <p className="text-sm text-black/60 mb-6">
                MixReflect Pro &middot; <span className="font-bold text-black">$9.95/month</span>
              </p>

              <p className="text-sm text-black/70 max-w-lg mx-auto mb-6">
                Track your growth across every track. See which areas are improving, spot patterns in your feedback, and know exactly where to focus next.
              </p>

              <div className="bg-white/50 rounded-2xl p-5 max-w-lg mx-auto mb-7">
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-3">Includes</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">✓</span>
                    <div>
                      <p className="text-sm font-bold">Trend graphs</p>
                      <p className="text-xs text-black/60">Scores over time + recent momentum</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">✓</span>
                    <div>
                      <p className="text-sm font-bold">Category breakdowns</p>
                      <p className="text-xs text-black/60">Production, vocals, originality</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">✓</span>
                    <div>
                      <p className="text-sm font-bold">Top tracks</p>
                      <p className="text-xs text-black/60">Quickly spot what&apos;s working</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">✓</span>
                    <div>
                      <p className="text-sm font-bold">Patterns &amp; velocity</p>
                      <p className="text-xs text-black/60">Common feedback + review pace</p>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/account">
                <Button variant="primary" size="lg">
                  Upgrade to Pro
                  <Sparkles className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pro user with data - show full analytics
  return (
    <AnalyticsDashboard
      tracks={trackData}
      totalReviews={totalReviews}
      totalEarnings={totalEarnings}
      totalTracks={totalTracks}
      overallAvg={overallAvg}
      highestScore={highestScore}
      improvementRate={improvementRate}
      wouldListenAgainPercent={wouldListenAgainPercent}
      categories={categories}
      trendData={trendData}
      earningsData={earningsData}
      reviewVelocity={reviewVelocity}
      feedbackPatterns={feedbackPatterns}
    />
  );
}
