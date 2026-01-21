import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Sparkles, ArrowLeft } from "lucide-react";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import {
  analyzeFeedbackPatterns,
  calculateReviewVelocity,
  generateEarningsData,
} from "@/lib/analytics-helpers";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get artist profile
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!artistProfile) {
    notFound();
  }

  // Check if user has active subscription (Pro only feature)
  const isSubscribed = artistProfile.subscriptionStatus === "active";

  if (!isSubscribed) {
    return (
      <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12">
        <Link
          href="/artist/dashboard"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.02]">Analytics</h1>
          <p className="mt-2 text-base sm:text-lg text-black/70 leading-relaxed max-w-prose">
            Track your progress and insights across all your submissions
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-12 relative">
          <div className="pointer-events-none select-none blur-sm opacity-60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card variant="soft" elevated>
                <CardContent className="pt-6">
                  <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">Total feedback</p>
                  <p className="text-3xl font-black mt-2">128</p>
                  <p className="text-xs text-black/50 mt-1">Across 9 tracks</p>
                </CardContent>
              </Card>
              <Card variant="soft" elevated>
                <CardContent className="pt-6">
                  <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">Avg score</p>
                  <p className="text-3xl font-black mt-2">4.1</p>
                  <p className="text-xs text-black/50 mt-1">Trending up</p>
                </CardContent>
              </Card>
              <Card variant="soft" elevated>
                <CardContent className="pt-6">
                  <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">Earnings</p>
                  <p className="text-3xl font-black mt-2">$82</p>
                  <p className="text-xs text-black/50 mt-1">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
                <CardContent className="pt-6">
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-5">Score trends</p>
                  <div className="h-40 rounded-2xl border-2 border-black/10 bg-gradient-to-br from-lime-100 via-yellow-50 to-orange-50" />
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="h-10 rounded-xl border-2 border-black/10 bg-white/60" />
                    <div className="h-10 rounded-xl border-2 border-black/10 bg-white/60" />
                    <div className="h-10 rounded-xl border-2 border-black/10 bg-white/60" />
                  </div>
                </CardContent>
              </Card>

              <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
                <CardContent className="pt-6">
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-5">Top tracks</p>
                  <div className="space-y-3">
                    <div className="h-12 rounded-2xl border-2 border-black/10 bg-white/60" />
                    <div className="h-12 rounded-2xl border-2 border-black/10 bg-white/60" />
                    <div className="h-12 rounded-2xl border-2 border-black/10 bg-white/60" />
                    <div className="h-12 rounded-2xl border-2 border-black/10 bg-white/60" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="absolute inset-0 flex items-start justify-center">
            <Card variant="soft" elevated className="border-2 border-lime-400 rounded-3xl overflow-hidden w-full max-w-4xl">
              <CardContent className="pt-6 text-center py-16">
                <div className="w-16 h-16 rounded-full bg-lime-100 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-lime-600" />
                </div>
                <h2 className="text-3xl font-black mb-4">Upgrade to Pro to unlock Analytics</h2>
                <p className="text-lg text-black/70 mb-2 max-w-2xl mx-auto">
                  Get detailed insights, track your improvement over time, and spot patterns across all your submissions.
                </p>
                <p className="text-sm text-black/50 mb-8 max-w-xl mx-auto">
                  Get aggregate analytics, trend graphs, category breakdowns, and actionable insights to level up your music.
                </p>

                <div className="bg-white/50 rounded-2xl p-8 max-w-2xl mx-auto mb-8">
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-4">What you'll get</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Score Trends Over Time</p>
                        <p className="text-xs text-black/60">See how you've improved month by month</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Category Breakdown</p>
                        <p className="text-xs text-black/60">Production, vocals, originality strengths</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Track Comparisons</p>
                        <p className="text-xs text-black/60">See which tracks performed best</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Actionable Insights</p>
                        <p className="text-xs text-black/60">Data-driven recommendations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Earnings Tracking</p>
                        <p className="text-xs text-black/60">Monitor revenue from track purchases</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Expandable Track Details</p>
                        <p className="text-xs text-black/60">Deep dive into each track's performance</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/artist/submit"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold rounded-lg text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  Upgrade to Pro
                  <Sparkles className="h-5 w-5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fetch all tracks with completed reviews and purchases
  const tracks = await prisma.track.findMany({
    where: {
      artistId: artistProfile.id,
      reviewsCompleted: { gt: 0 },
    },
    include: {
      reviews: {
        where: {
          status: "COMPLETED",
          countsTowardAnalytics: true,
        },
      },
      purchases: {
        select: {
          amount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // If no tracks with reviews, show empty state
  if (tracks.length === 0) {
    return (
      <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12">
        <Link
          href="/artist/dashboard"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.02]">Analytics</h1>
          <p className="mt-2 text-base sm:text-lg text-black/70 leading-relaxed max-w-prose">
            Track your progress and insights across all your submissions
          </p>
        </div>

        <Card variant="soft" elevated className="max-w-2xl mx-auto mt-12">
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="h-12 w-12 text-black/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No analytics yet</h3>
            <p className="text-sm text-black/60 mb-6">
              Submit a track and get reviews to start seeing insights and trends.
            </p>
            <Link
              href="/artist/submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black font-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Submit your first track
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate aggregate statistics
  const totalReviews = tracks.reduce((sum, t) => sum + t.reviews.length, 0);
  const totalTracks = tracks.length;

  // Calculate overall averages
  const allReviews = tracks.flatMap((t) => t.reviews);
  const avgProduction =
    allReviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) / (allReviews.length || 1);
  const avgOriginality =
    allReviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / (allReviews.length || 1);
  const avgVocals =
    allReviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / (allReviews.length || 1);
  const overallAvg = (avgProduction + avgOriginality + avgVocals) / 3;

  // Calculate highest score across all tracks
  const trackScores = tracks.map((t) => {
    const production = t.reviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) / (t.reviews.length || 1);
    const vocals = t.reviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / (t.reviews.length || 1);
    const originality = t.reviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / (t.reviews.length || 1);
    return (production + vocals + originality) / 3;
  });
  const highestScore = trackScores.length > 0 ? Math.max(...trackScores) : 0;

  // Calculate total earnings
  const totalEarnings = tracks.reduce((sum, t) => {
    const trackEarnings = t.purchases.reduce((s, p) => s + p.amount, 0);
    return sum + trackEarnings;
  }, 0) / 100; // Convert cents to dollars

  // Calculate category strengths
  const categories = [
    { name: "Production", score: avgProduction, color: "bg-lime-500" },
    { name: "Originality", score: avgOriginality, color: "bg-purple-500" },
    { name: "Vocals", score: avgVocals, color: "bg-blue-500" },
  ].sort((a, b) => b.score - a.score);

  // Calculate improvement (last 3 tracks vs first 3 tracks)
  const recentTracks = tracks.slice(0, 3);
  const earlierTracks = tracks.slice(-3);
  const recentAvg =
    recentTracks.reduce((sum, t) => {
      const trackAvg =
        t.reviews.reduce(
          (s, r) =>
            s +
            ((r.productionScore || 0) + (r.originalityScore || 0) + (r.vocalScore || 0)) / 3,
          0
        ) / (t.reviews.length || 1);
      return sum + trackAvg;
    }, 0) / (recentTracks.length || 1);
  const earlierAvg =
    earlierTracks.reduce((sum, t) => {
      const trackAvg =
        t.reviews.reduce(
          (s, r) =>
            s +
            ((r.productionScore || 0) + (r.originalityScore || 0) + (r.vocalScore || 0)) / 3,
          0
        ) / (t.reviews.length || 1);
      return sum + trackAvg;
    }, 0) / (earlierTracks.length || 1);
  const improvementRate = tracks.length >= 3 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

  // Calculate engagement
  const wouldListenAgain = allReviews.filter((r) => r.wouldListenAgain).length;
  const wouldListenAgainPercent = Math.round(
    (wouldListenAgain / (allReviews.length || 1)) * 100
  );

  // Prepare track data for components
  const trackData = tracks.map((t) => {
    const production =
      t.reviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) / (t.reviews.length || 1);
    const vocals =
      t.reviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / (t.reviews.length || 1);
    const originality =
      t.reviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / (t.reviews.length || 1);
    const avgScore = (production + vocals + originality) / 3;

    const listenAgain = t.reviews.filter((r) => r.wouldListenAgain).length;
    const listenAgainPercent = Math.round((listenAgain / (t.reviews.length || 1)) * 100);

    const playlistYes = t.reviews.filter((r) => r.wouldAddToPlaylist === true).length;
    const playlistTotal = t.reviews.filter((r) => r.wouldAddToPlaylist !== null).length;
    const playlistPercent = playlistTotal > 0 ? Math.round((playlistYes / playlistTotal) * 100) : 0;

    const shareYes = t.reviews.filter((r) => r.wouldShare === true).length;
    const shareTotal = t.reviews.filter((r) => r.wouldShare !== null).length;
    const sharePercent = shareTotal > 0 ? Math.round((shareYes / shareTotal) * 100) : 0;

    const trackEarnings = t.purchases.reduce((sum, p) => sum + p.amount, 0) / 100;

    return {
      id: t.id,
      title: t.title,
      artworkUrl: t.artworkUrl,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      reviewsCompleted: t.reviews.length,
      avgScore,
      categoryScores: { production, vocals, originality },
      engagement: {
        listenAgain: listenAgainPercent,
        playlist: playlistPercent,
        share: sharePercent,
      },
      earnings: trackEarnings,
    };
  });

  // Generate trend data (group by month)
  const trendData = generateTrendData(tracks);

  // Generate earnings data
  const earningsDataTracks = trackData.map((t) => ({
    createdAt: t.createdAt,
    earnings: t.earnings,
  }));
  const earningsData = generateEarningsData(earningsDataTracks);

  // Calculate review velocity
  const reviewVelocityTracks = tracks.map((t) => ({
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    reviewsCompleted: t.reviews.length,
    title: t.title,
  }));
  const reviewVelocity = calculateReviewVelocity(reviewVelocityTracks);

  // Analyze feedback patterns
  const feedbackPatterns = analyzeFeedbackPatterns(allReviews);

  return (
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12 pb-24">
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.02]">Analytics</h1>
        <p className="mt-2 text-base sm:text-lg text-black/70 leading-relaxed max-w-prose">
          Track your progress and insights across all your submissions
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
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
      </div>
    </div>
  );
}

// Helper function to generate trend data grouped by month
function generateTrendData(tracks: any[]) {
  // Group reviews by month
  const monthMap = new Map<string, { production: number[]; vocals: number[]; originality: number[] }>();

  tracks.forEach((track) => {
    track.reviews.forEach((review: any) => {
      const date = new Date(review.createdAt || track.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { production: [], vocals: [], originality: [] });
      }

      const month = monthMap.get(monthKey)!;
      if (review.productionScore) month.production.push(review.productionScore);
      if (review.vocalScore) month.vocals.push(review.vocalScore);
      if (review.originalityScore) month.originality.push(review.originalityScore);
    });
  });

  // Calculate averages and format for chart
  const trendData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, scores]) => {
      const avgProduction = scores.production.length > 0
        ? scores.production.reduce((a, b) => a + b, 0) / scores.production.length
        : 0;
      const avgVocals = scores.vocals.length > 0
        ? scores.vocals.reduce((a, b) => a + b, 0) / scores.vocals.length
        : 0;
      const avgOriginality = scores.originality.length > 0
        ? scores.originality.reduce((a, b) => a + b, 0) / scores.originality.length
        : 0;
      const overall = (avgProduction + avgVocals + avgOriginality) / 3;

      // Format month as "Jan 2024"
      const [year, monthNum] = month.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      return {
        month: monthLabel,
        production: avgProduction,
        vocals: avgVocals,
        originality: avgOriginality,
        overall,
      };
    });

  return trendData;
}
