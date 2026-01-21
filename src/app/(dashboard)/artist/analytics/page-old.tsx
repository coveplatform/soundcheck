import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  TrendingUp,
  TrendingDown,
  Music,
  Award,
  Target,
  Sparkles,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

interface CategoryScore {
  production: number;
  vocals: number;
  originality: number;
}

interface TrackWithReviews {
  id: string;
  title: string;
  artworkUrl: string | null;
  createdAt: Date;
  reviewsCompleted: number;
  avgScore: number;
  categoryScores: CategoryScore;
}

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

        <PageHeader
          title="Analytics"
          description="Track your progress and insights across all your submissions"
        />

        <div className="max-w-4xl mx-auto mt-12">
          <Card variant="soft" elevated className="border-2 border-lime-400 rounded-3xl overflow-hidden">
            <CardContent className="pt-6 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-lime-100 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-lime-600" />
              </div>
              <h2 className="text-3xl font-black mb-4">Analytics is a Pro Feature</h2>
              <p className="text-lg text-black/70 mb-2 max-w-2xl mx-auto">
                Unlock detailed insights, track your improvement over time, and see patterns across all your submissions.
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
    );
  }

  // Fetch all tracks with completed reviews
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

        <PageHeader
          title="Analytics"
          description="Track your progress and insights across all your submissions"
        />

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
    allReviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) /
    (allReviews.length || 1);
  const avgOriginality =
    allReviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) /
    (allReviews.length || 1);
  const avgVocals =
    allReviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) /
    (allReviews.length || 1);
  const overallAvg = (avgProduction + avgOriginality + avgVocals) / 3;

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
            ((r.productionScore || 0) +
              (r.originalityScore || 0) +
              (r.vocalScore || 0)) /
              3,
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
            ((r.productionScore || 0) +
              (r.originalityScore || 0) +
              (r.vocalScore || 0)) /
              3,
          0
        ) / (t.reviews.length || 1);
      return sum + trackAvg;
    }, 0) / (earlierTracks.length || 1);
  const improvementRate =
    tracks.length >= 3 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

  // Prepare track comparison data
  const trackComparison: TrackWithReviews[] = tracks.map((t) => {
    const production =
      t.reviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) /
      (t.reviews.length || 1);
    const vocals =
      t.reviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) /
      (t.reviews.length || 1);
    const originality =
      t.reviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) /
      (t.reviews.length || 1);
    const avgScore = (production + vocals + originality) / 3;

    return {
      id: t.id,
      title: t.title,
      artworkUrl: t.artworkUrl,
      createdAt: t.createdAt,
      reviewsCompleted: t.reviews.length,
      avgScore,
      categoryScores: { production, vocals, originality },
    };
  });

  // Sort by score
  const topTracks = [...trackComparison].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);

  // Calculate engagement metrics
  const wouldListenAgain = allReviews.filter((r) => r.wouldListenAgain).length;
  const wouldListenAgainPercent = Math.round(
    (wouldListenAgain / (allReviews.length || 1)) * 100
  );
  const playlistYes = allReviews.filter((r) => r.wouldAddToPlaylist === true).length;
  const playlistTotal = allReviews.filter((r) => r.wouldAddToPlaylist !== null).length;
  const shareYes = allReviews.filter((r) => r.wouldShare === true).length;
  const shareTotal = allReviews.filter((r) => r.wouldShare !== null).length;

  return (
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12 pb-24">
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <PageHeader
        title="Analytics"
        description="Track your progress and insights across all your submissions"
      />

      <div className="max-w-6xl mx-auto space-y-8 mt-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                    Total Reviews
                  </p>
                  <p className="text-3xl font-black">{totalReviews}</p>
                  <p className="text-xs text-black/50 mt-1">
                    Across {totalTracks} track{totalTracks === 1 ? "" : "s"}
                  </p>
                </div>
                <Music className="h-8 w-8 text-black/20" />
              </div>
            </CardContent>
          </Card>

          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                    Overall Score
                  </p>
                  <p className="text-3xl font-black">{overallAvg.toFixed(1)}</p>
                  <p className="text-xs text-black/50 mt-1">Out of 5.0</p>
                </div>
                <Award className="h-8 w-8 text-black/20" />
              </div>
            </CardContent>
          </Card>

          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                    Improvement
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black">
                      {improvementRate > 0 ? "+" : ""}
                      {improvementRate.toFixed(0)}%
                    </p>
                    {improvementRate > 0 ? (
                      <TrendingUp className="h-5 w-5 text-lime-600" />
                    ) : improvementRate < 0 ? (
                      <TrendingDown className="h-5 w-5 text-amber-600" />
                    ) : null}
                  </div>
                  <p className="text-xs text-black/50 mt-1">
                    {tracks.length >= 3 ? "Recent vs earlier" : "Need more tracks"}
                  </p>
                </div>
                <Target className="h-8 w-8 text-black/20" />
              </div>
            </CardContent>
          </Card>

          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-2">
                    Engagement
                  </p>
                  <p className="text-3xl font-black">{wouldListenAgainPercent}%</p>
                  <p className="text-xs text-black/50 mt-1">Would listen again</p>
                </div>
                <Sparkles className="h-8 w-8 text-black/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Strengths */}
        <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
              Your Strengths
            </p>
            <div className="space-y-4">
              {categories.map((category, index) => {
                const percentage = (category.score / 5) * 100;
                return (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Award className="h-4 w-4 text-lime-600" />
                        )}
                        <span className="text-sm font-bold">{category.name}</span>
                      </div>
                      <span className="text-lg font-black">
                        {category.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          category.color
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        {(playlistTotal > 0 || shareTotal > 0) && (
          <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
            <CardContent className="pt-6">
              <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
                Listener Engagement
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black mb-2">{wouldListenAgainPercent}%</p>
                  <p className="text-sm text-black/60">Would listen again</p>
                  <p className="text-xs text-black/40 font-mono mt-1">
                    {wouldListenAgain} / {allReviews.length}
                  </p>
                </div>
                {playlistTotal > 0 && (
                  <div className="text-center">
                    <p className="text-4xl font-black mb-2">
                      {Math.round((playlistYes / playlistTotal) * 100)}%
                    </p>
                    <p className="text-sm text-black/60">Would add to playlist</p>
                    <p className="text-xs text-black/40 font-mono mt-1">
                      {playlistYes} / {playlistTotal}
                    </p>
                  </div>
                )}
                {shareTotal > 0 && (
                  <div className="text-center">
                    <p className="text-4xl font-black mb-2">
                      {Math.round((shareYes / shareTotal) * 100)}%
                    </p>
                    <p className="text-sm text-black/60">Would share</p>
                    <p className="text-xs text-black/40 font-mono mt-1">
                      {shareYes} / {shareTotal}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Tracks */}
        <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
              Top Performing Tracks
            </p>
            <div className="space-y-3">
              {topTracks.map((track, index) => (
                <Link
                  key={track.id}
                  href={`/artist/tracks/${track.id}`}
                  className="block p-4 rounded-xl bg-white hover:bg-black/5 border-2 border-black/5 hover:border-black/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white font-black text-sm">
                      {index + 1}
                    </div>
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{track.title}</p>
                      <p className="text-xs text-black/50">
                        {track.reviewsCompleted} review{track.reviewsCompleted === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{track.avgScore.toFixed(1)}</p>
                      <p className="text-xs text-black/40">avg score</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Tracks Comparison */}
        <Card variant="soft" elevated className="rounded-3xl overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-xs font-mono text-black/40 uppercase tracking-widest mb-6">
              All Tracks
            </p>
            <div className="space-y-2">
              {trackComparison.map((track) => (
                <Link
                  key={track.id}
                  href={`/artist/tracks/${track.id}`}
                  className="block p-3 sm:p-4 rounded-lg bg-white hover:bg-black/5 border border-black/5 hover:border-black/10 transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-sm sm:text-base">{track.title}</p>
                        <p className="text-xs text-black/50">
                          {new Date(track.createdAt).toLocaleDateString()} · {track.reviewsCompleted} reviews
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <div className="text-center">
                            <p className="text-xs text-black/40">Prod</p>
                            <p className="text-sm font-bold">
                              {track.categoryScores.production.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/40">Orig</p>
                            <p className="text-sm font-bold">
                              {track.categoryScores.originality.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/40">Vocals</p>
                            <p className="text-sm font-bold">
                              {track.categoryScores.vocals.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right pl-4 border-l border-black/10">
                          <p className="text-xl sm:text-2xl font-black">{track.avgScore.toFixed(1)}</p>
                          <p className="text-xs text-black/40">avg</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
