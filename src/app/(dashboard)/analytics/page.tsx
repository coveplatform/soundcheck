import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  if (tracks.length === 0 && isSubscribed) {
    return (
      <div className="pt-16 px-6 sm:px-8 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-neutral-200">
            <div>
              <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">Analytics</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-500">All time</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="font-semibold">0 reviews</span>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          <Card variant="soft" elevated className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center py-12">
              <BarChart3 className="h-12 w-12 text-black/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">No analytics yet</h3>
              <p className="text-sm text-black/60 mb-6">
                Submit a track and get reviews to start seeing insights and trends.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              >
                Submit your first track
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasAnalyticsData = tracks.length > 0;

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
    { name: "Production", score: avgProduction, color: "bg-purple-500" },
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

  if (!isSubscribed) {
    // Generate demo data for visual appeal when blurred
    const demoData = hasAnalyticsData ? {
      tracks: trackData,
      totalReviews,
      totalEarnings,
      totalTracks,
      overallAvg,
      highestScore,
      improvementRate,
      wouldListenAgainPercent,
      categories,
      trendData,
      earningsData,
      reviewVelocity,
      feedbackPatterns,
    } : {
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
      <div className="pt-16 px-6 sm:px-8 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-neutral-200">
            <div>
              <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">Analytics</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-500">MixReflect Pro</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="font-semibold">$9.95/month</span>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

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
              <Card variant="soft" elevated className="border-2 border-purple-400 rounded-3xl overflow-hidden w-full max-w-2xl">
                <CardContent className="pt-6 text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-5">
                    <BarChart3 className="h-7 w-7 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Unlock Analytics</h2>
                  <p className="text-sm text-black/60 mb-6">
                    MixReflect Pro &middot; <span className="font-bold text-black">$9.95/month</span>
                  </p>

                  <p className="text-sm text-black/70 max-w-lg mx-auto mb-6">
                    See what&apos;s improving, what&apos;s holding you back, and which tracks are actually landing -- without digging through every review.
                  </p>

                  <div className="bg-white/50 rounded-2xl p-5 max-w-lg mx-auto mb-7">
                    <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-3">Includes</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">&#10003;</span>
                        <div>
                          <p className="text-sm font-bold">Trend graphs</p>
                          <p className="text-xs text-black/60">Scores over time + recent momentum</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">&#10003;</span>
                        <div>
                          <p className="text-sm font-bold">Category breakdowns</p>
                          <p className="text-xs text-black/60">Production, vocals, originality</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">&#10003;</span>
                        <div>
                          <p className="text-sm font-bold">Top tracks</p>
                          <p className="text-xs text-black/60">Quickly spot what&apos;s working</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">&#10003;</span>
                        <div>
                          <p className="text-sm font-bold">Patterns &amp; velocity</p>
                          <p className="text-xs text-black/60">Common feedback + review pace</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/account"
                  >
                    <Button variant="primary" size="lg">
                      Upgrade to Pro
                      <Sparkles className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 px-6 sm:px-8 lg:px-12 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-neutral-200">
          <div>
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">Analytics</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-500">All time</span>
              <span className="text-neutral-300">&bull;</span>
              <span className="font-semibold">{totalReviews} reviews</span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

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
