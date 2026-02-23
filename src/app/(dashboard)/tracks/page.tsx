import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Music, CheckCircle2, Lock, Crown } from "lucide-react";
import { SquiggleDoodle, StarDoodle } from "@/components/dashboard/doodles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";
import { TracksViewToggle } from "@/components/tracks/tracks-view-toggle";
import { PortfolioView } from "@/components/tracks/portfolio-view";
import { TrackStatsView } from "@/components/tracks/track-stats-view";
import { QueueView } from "@/components/tracks/queue-view";
import {
  analyzeFeedbackPatterns,
  calculateReviewVelocity,
  analyzeQualityLevels,
  analyzeTechnicalIssues,
  analyzeNextFocus,
  analyzePlaylistActions,
  getTopQuickWins,
} from "@/lib/analytics-helpers";

export const dynamic = "force-dynamic";

export default async function TracksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { view } = await searchParams;
  const isInsightsView = view === "insights";
  const isStatsView = view === "stats";

  // Get basic artist profile with subscription info for slots
  const basicProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      subscriptionStatus: true,
    },
  });

  if (!basicProfile) {
    redirect("/onboarding");
  }

  // Grid view: lightweight query — only what the track cards need
  // Insights view: full analytics query with all review fields
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      Track: {
        include: {
          Genre: true,
          Review: {
            select: {
              id: true,
              status: true,
              productionScore: true,
              originalityScore: true,
              vocalScore: true,
              wouldListenAgain: true,
              bestPart: true,
              weakestPart: true,
              additionalNotes: true,
              firstImpression: true,
              createdAt: true,
              ReviewerProfile: {
                select: {
                  User: { select: { name: true } },
                },
              },
              ArtistProfile: {
                select: {
                  User: { select: { name: true } },
                },
              },
              ...(isInsightsView ? {
                wouldAddToPlaylist: true,
                wouldShare: true,
                wouldFollow: true,
                countsTowardAnalytics: true,
                createdAt: true,
                lowEndClarity: true,
                vocalClarity: true,
                highEndQuality: true,
                stereoWidth: true,
                dynamics: true,
                energyCurve: true,
                trackLength: true,
                emotionalImpact: true,
                playlistAction: true,
                qualityLevel: true,
                nextFocus: true,
                expectedPlacement: true,
                quickWin: true,
                biggestWeaknessSpecific: true,
              } : {}),
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const tracks = artistProfile.Track;

  // Slot computation
  const isPro = basicProfile.subscriptionStatus === "active";
  const maxSlots = getMaxSlots(isPro);
  const activeStatuses = ACTIVE_TRACK_STATUSES as readonly string[];
  const activeTracks = tracks.filter((t) => activeStatuses.includes(t.status));
  const completedTracks = tracks.filter((t) => !activeStatuses.includes(t.status));
  const eligibleForQueue = tracks.filter((t) => t.status === "UPLOADED" || t.status === "COMPLETED");
  const hasOpenSlots = activeTracks.length < maxSlots;

  // Calculate portfolio analytics data
  const tracksWithReviews = tracks.filter(t => t.Review && t.Review.length > 0);
  const hasAnalyticsData = tracksWithReviews.length > 0;

  let portfolioData = null;

  if (hasAnalyticsData) {
    const totalReviews = tracks.reduce(
      (sum, t) => sum + t.Review.filter((r: any) => r.status === "COMPLETED").length,
      0
    );
    const totalTracks = tracksWithReviews.length;

    // Calculate overall averages
    const allReviews = tracks.flatMap((t) => t.Review);
    const avgProduction =
      allReviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) / (allReviews.length || 1);
    const avgOriginality =
      allReviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / (allReviews.length || 1);
    const avgVocals =
      allReviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / (allReviews.length || 1);
    const overallAvg = (avgProduction + avgOriginality + avgVocals) / 3;

    // Calculate highest score
    const trackScores = tracksWithReviews.map((t) => {
      const production = t.Review.reduce((sum, r) => sum + (r.productionScore || 0), 0) / (t.Review.length || 1);
      const vocals = t.Review.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / (t.Review.length || 1);
      const originality = t.Review.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / (t.Review.length || 1);
      return (production + vocals + originality) / 3;
    });
    const highestScore = trackScores.length > 0 ? Math.max(...trackScores) : 0;

    // Calculate improvement
    const recentTracks = tracksWithReviews.slice(0, 3);
    const earlierTracks = tracksWithReviews.slice(-3);
    const recentAvg =
      recentTracks.reduce((sum, t) => {
        const trackAvg =
          t.Review.reduce(
            (s, r) =>
              s +
              ((r.productionScore || 0) + (r.originalityScore || 0) + (r.vocalScore || 0)) / 3,
            0
          ) / (t.Review.length || 1);
        return sum + trackAvg;
      }, 0) / (recentTracks.length || 1);
    const earlierAvg =
      earlierTracks.reduce((sum, t) => {
        const trackAvg =
          t.Review.reduce(
            (s, r) =>
              s +
              ((r.productionScore || 0) + (r.originalityScore || 0) + (r.vocalScore || 0)) / 3,
            0
          ) / (t.Review.length || 1);
        return sum + trackAvg;
      }, 0) / (earlierTracks.length || 1);
    const improvementRate = tracksWithReviews.length >= 3 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

    // Calculate engagement
    const wouldListenAgain = allReviews.filter((r) => r.wouldListenAgain).length;
    const wouldListenAgainPercent = Math.round(
      (wouldListenAgain / (allReviews.length || 1)) * 100
    );

    // Categories
    const categories = [
      { name: "Production", score: avgProduction, color: "bg-purple-500" },
      { name: "Originality", score: avgOriginality, color: "bg-purple-500" },
      { name: "Vocals", score: avgVocals, color: "bg-blue-500" },
    ].sort((a, b) => b.score - a.score);

    // Prepare track data
    const trackData = tracksWithReviews.map((t) => {
      const production =
        t.Review.reduce((sum, r) => sum + (r.productionScore || 0), 0) / (t.Review.length || 1);
      const vocals =
        t.Review.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / (t.Review.length || 1);
      const originality =
        t.Review.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / (t.Review.length || 1);
      const avgScore = (production + vocals + originality) / 3;

      const listenAgain = t.Review.filter((r) => r.wouldListenAgain).length;
      const listenAgainPercent = Math.round((listenAgain / (t.Review.length || 1)) * 100);

      const playlistYes = t.Review.filter((r) => r.wouldAddToPlaylist === true).length;
      const playlistTotal = t.Review.filter((r) => r.wouldAddToPlaylist !== null).length;
      const playlistPercent = playlistTotal > 0 ? Math.round((playlistYes / playlistTotal) * 100) : 0;

      const shareYes = t.Review.filter((r) => r.wouldShare === true).length;
      const shareTotal = t.Review.filter((r) => r.wouldShare !== null).length;
      const sharePercent = shareTotal > 0 ? Math.round((shareYes / shareTotal) * 100) : 0;

      return {
        id: t.id,
        title: t.title,
        artworkUrl: t.artworkUrl,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        reviewsCompleted: t.Review.length,
        avgScore,
        categoryScores: { production, vocals, originality },
        engagement: {
          listenAgain: listenAgainPercent,
          playlist: playlistPercent,
          share: sharePercent,
        },
      };
    });

    // Generate trend data
    const trendData = generateTrendData(tracksWithReviews);

    // Calculate review velocity
    const reviewVelocityTracks = tracksWithReviews.map((t) => ({
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      reviewsCompleted: t.Review.length,
      title: t.title,
    }));
    const reviewVelocity = calculateReviewVelocity(reviewVelocityTracks);

    // Analyze feedback patterns
    const feedbackPatterns = analyzeFeedbackPatterns(allReviews);

    // V2 Analytics
    const qualityLevels = analyzeQualityLevels(allReviews);
    const technicalIssues = analyzeTechnicalIssues(allReviews);
    const nextFocusData = analyzeNextFocus(allReviews);
    const playlistActionsData = analyzePlaylistActions(allReviews);
    const topQuickWins = getTopQuickWins(allReviews, 3);

    portfolioData = {
      trackData,
      totalReviews,
      totalTracks,
      overallAvg,
      highestScore,
      improvementRate,
      wouldListenAgainPercent,
      categories,
      trendData,
      reviewVelocity,
      feedbackPatterns,
      // V2 analytics
      qualityLevels,
      technicalIssues,
      nextFocusData,
      playlistActionsData,
      topQuickWins,
    };
  }

  // Compute per-track stats for Stats tab
  const trackStats = tracks.map((track) => {
    const completed = (track.Review ?? []).filter((r: any) => r.status === "COMPLETED");
    const scores = completed.filter((r: any) => r.productionScore != null);
    const avgProduction = scores.length > 0 ? scores.reduce((s: number, r: any) => s + r.productionScore, 0) / scores.length : null;
    const avgOriginality = scores.length > 0 ? scores.reduce((s: number, r: any) => s + r.originalityScore, 0) / scores.length : null;
    const avgVocal = scores.length > 0 ? scores.reduce((s: number, r: any) => s + (r.vocalScore ?? 0), 0) / scores.length : null;
    const overallAvg = avgProduction !== null && avgOriginality !== null
      ? (avgProduction + avgOriginality + (avgVocal ?? 0)) / (avgVocal !== null ? 3 : 2)
      : null;
    const listenAgain = completed.filter((r: any) => r.wouldListenAgain != null);
    const wouldListenAgainPct = listenAgain.length > 0
      ? (listenAgain.filter((r: any) => r.wouldListenAgain === true).length / listenAgain.length) * 100
      : null;

    return {
      id: track.id,
      title: track.title,
      artworkUrl: track.artworkUrl,
      status: track.status,
      genreName: (track as any).Genre?.[0]?.name ?? null,
      reviewsRequested: track.reviewsRequested ?? 0,
      reviewsCompleted: completed.length,
      avgProduction,
      avgOriginality,
      avgVocal,
      overallAvg,
      wouldListenAgainPct,
      createdAt: track.createdAt,
      reviews: completed.map((r: any) => ({
        id: r.id,
        productionScore: r.productionScore as number | null,
        originalityScore: r.originalityScore as number | null,
        vocalScore: r.vocalScore as number | null,
        wouldListenAgain: r.wouldListenAgain as boolean | null,
        firstImpression: (r.firstImpression as string) ?? null,
        bestPart: (r.bestPart as string) ?? null,
        weakestPart: (r.weakestPart as string) ?? null,
        additionalNotes: (r.additionalNotes as string) ?? null,
        reviewerName: r.ReviewerProfile?.User?.name ?? r.ArtistProfile?.User?.name ?? "Anonymous",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      })),
    };
  });

  const credits = artistProfile.reviewCredits ?? 0;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <SquiggleDoodle className="absolute -bottom-5 left-[45%] w-20 h-20 text-purple-400/20 pointer-events-none rotate-6" />
          <div className="flex items-start justify-between gap-6 relative">
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                My Music.
              </h1>
              <p className="text-sm text-black/40 font-medium mt-2">
                {tracks.length === 0 ? "No tracks yet — upload your first." : `${tracks.length} track${tracks.length === 1 ? "" : "s"} in your library.`}
              </p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10 relative">
              <StarDoodle className="absolute -top-4 -right-1 w-12 h-12 text-purple-400/30 pointer-events-none" />
              <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">{credits}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                {credits === 1 ? "credit" : "credits"}
              </p>
              <Link
                href={credits > 0 ? "/submit" : "/review"}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 mt-2 block transition-colors"
              >
                {credits > 0 ? "Spend →" : "Earn more →"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS + CONTENT ─────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <TracksViewToggle
          queueView={
            <QueueView
              activeTracks={activeTracks.map((t) => ({
                id: t.id,
                title: t.title,
                artworkUrl: t.artworkUrl,
                status: t.status,
                reviewsRequested: t.reviewsRequested ?? 0,
                reviews: (t.Review ?? []).map((r: any) => ({ id: r.id, status: r.status })),
              }))}
              eligibleTracks={eligibleForQueue.map((t) => {
                const completed = (t.Review ?? []).filter((r: any) => r.status === "COMPLETED").length;
                return {
                  id: t.id,
                  title: t.title,
                  artworkUrl: t.artworkUrl,
                  status: t.status,
                  genreName: (t as any).Genre?.[0]?.name ?? null,
                  reviewsCompleted: completed,
                  reviewsRequested: t.reviewsRequested ?? 0,
                };
              })}
              maxSlots={maxSlots}
              isPro={isPro}
              credits={artistProfile.reviewCredits ?? 0}
            />
          }
          gridView={
            tracks.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                <Link href="/submit" className="group block">
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-black/10 bg-white/40 hover:border-purple-400 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-2 transition-all duration-150">
                    <div className="h-10 w-10 rounded-full bg-black/[0.04] group-hover:bg-purple-100 flex items-center justify-center transition-colors border-2 border-black/[0.06] group-hover:border-purple-200">
                      <Plus className="h-5 w-5 text-black/20 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/20 group-hover:text-purple-600 transition-colors">
                      Add track
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-center text-black/20 mt-2">Open slot</p>
                </Link>

                {tracks.map((track) => {
                  const completedReviews = (track.Review ?? []).filter(
                    (r: any) => r.status === "COMPLETED"
                  ).length;
                  const hasReviews = track.reviewsRequested > 0;
                  const reviewProgress = hasReviews
                    ? completedReviews / track.reviewsRequested
                    : 0;

                  return (
                    <TrackCard
                      key={track.id}
                      id={track.id}
                      title={track.title}
                      artworkUrl={track.artworkUrl}
                      status={track.status}
                      hasReviews={hasReviews}
                      reviewProgress={reviewProgress}
                      completedReviews={completedReviews}
                      totalReviews={track.reviewsRequested}
                    />
                  );
                })}
              </div>
            )
          }
          statsView={
            <TrackStatsView tracks={trackStats} />
          }
          insightsView={
            <PortfolioView
              hasData={hasAnalyticsData}
              {...portfolioData}
            />
          }
        />
      </div>
    </div>
  );
}

function TrackCard({
  id,
  title,
  artworkUrl,
  status,
  hasReviews,
  reviewProgress,
  completedReviews,
  totalReviews,
}: {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  hasReviews: boolean;
  reviewProgress: number;
  completedReviews: number;
  totalReviews: number;
}) {
  const isPending = status === "PENDING_PAYMENT";
  const isReviewing = status === "IN_PROGRESS" || status === "QUEUED";
  const isComplete = status === "COMPLETED";
  const isUploaded = status === "UPLOADED" || isPending;
  const isDone = reviewProgress >= 1;

  return (
    <Link href={`/tracks/${id}`} className="group block">
      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-black/8 group-hover:border-black/20 transition-all duration-150 shadow-sm">
        {artworkUrl ? (
          <Image
            src={artworkUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
            <Music className="h-8 w-8 text-black/20" />
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm",
            isComplete ? "bg-lime-400 text-black" :
            isReviewing ? "bg-purple-600 text-white" :
            "bg-white/90 text-black/60"
          )}>
            {isComplete ? "Done" : isReviewing ? (status === "QUEUED" ? "Queued" : "Reviewing") : "Uploaded"}
          </span>
        </div>

        {hasReviews && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-4 pb-2">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-black text-white leading-none">{completedReviews}/{totalReviews}</span>
              <span className="text-[9px] text-white/50">reviews</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", isDone ? "bg-lime-400" : "bg-white")}
                style={{ width: `${reviewProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <p className="text-xs font-black text-black mt-2 truncate leading-tight">{title}</p>
      {!hasReviews && isUploaded && (
        <p className="text-[11px] text-purple-600 font-bold mt-0.5">Request reviews →</p>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border-2 border-dashed border-black/10 rounded-2xl px-6 py-16 text-center bg-white/40">
      <div className="h-16 w-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4">
        <Music className="h-8 w-8 text-black/20" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-black mb-2">No tracks yet.</h2>
      <p className="text-black/40 font-medium text-sm max-w-xs mx-auto mb-6">
        Upload your first track and get real feedback from fellow artists.
      </p>
      <Link href="/submit">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 px-6 rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Upload a track
        </Button>
      </Link>
    </div>
  );
}

// Helper function to generate trend data grouped by month
function generateTrendData(tracks: any[]) {
  const monthMap = new Map<string, { production: number[]; vocals: number[]; originality: number[] }>();

  tracks.forEach((track) => {
    track.Review.forEach((review: any) => {
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
