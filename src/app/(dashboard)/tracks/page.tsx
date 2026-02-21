import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Music, MessageSquare, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";
import { TracksViewToggle } from "@/components/tracks/tracks-view-toggle";
import { PortfolioView } from "@/components/tracks/portfolio-view";
import { DequeueButton } from "@/components/tracks/dequeue-button";
import { TrackStatsView } from "@/components/tracks/track-stats-view";
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
    };
  });

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-black/10">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40 mb-2">
            Tracks
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black">
            My Music
          </h1>
          <div className="flex items-center gap-4 text-sm mt-2">
            <span className="text-black/60">{tracks.length} {tracks.length === 1 ? "track" : "tracks"}</span>
          </div>
        </div>

        {/* ===== TABS: Queue / My Tracks / Insights ===== */}
        <TracksViewToggle
          queueView={
            <div>
              {/* Queue header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <p className="text-sm text-black/40">
                  Submit a track → it fills a slot → artists review it → slot frees up.
                  {!isPro && <>{" "}<Link href="/pro" className="text-purple-600 hover:text-purple-700 font-medium">Upgrade to Pro for 3 slots →</Link></>}
                </p>
                {activeTracks.length < maxSlots && (
                  <Link href="/submit">
                    <Button variant="airyPrimary" className="text-sm h-9 px-4">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Submit track
                    </Button>
                  </Link>
                )}
              </div>

              {/* Slot grid — always show all 3 slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 3 }, (_, slotIndex) => {
                  const track = activeTracks[slotIndex];
                  const isLocked = !isPro && slotIndex >= maxSlots;
                  const slotNum = slotIndex + 1;

                  if (track) {
                    const completedReviews = (track.Review ?? []).filter(
                      (r: any) => r.status === "COMPLETED"
                    ).length;
                    const hasReviews = track.reviewsRequested > 0;
                    const reviewProgress = hasReviews
                      ? completedReviews / track.reviewsRequested
                      : 0;
                    const isQueued = track.status === "QUEUED";
                    const isInProgress = track.status === "IN_PROGRESS";
                    const isPending = track.status === "PENDING_PAYMENT";

                    return (
                      <div key={track.id}>
                        <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/30 mb-2">Slot {slotNum}</p>
                        <div className="group relative">
                          <Card variant="soft" interactive className="overflow-hidden">
                            <Link href={`/tracks/${track.id}`} className="block">
                              <div className="relative aspect-[4/3] bg-neutral-100">
                                {track.artworkUrl ? (
                                  <Image
                                    src={track.artworkUrl}
                                    alt={track.title}
                                    fill
                                    className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02]"
                                    sizes="(max-width: 640px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                    <Music className="h-8 w-8 text-black/15" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2">
                                  {isPending ? (
                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/80 text-black/60 border border-black/10 backdrop-blur-sm">Pending</span>
                                  ) : isQueued ? (
                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-600 text-white shadow-sm">Queued</span>
                                  ) : isInProgress ? (
                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-600 text-white shadow-sm">Reviewing</span>
                                  ) : null}
                                </div>
                                <DequeueButton trackId={track.id} trackTitle={track.title} />
                                {hasReviews && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-6 pb-2 px-2">
                                    <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                      <div className="h-full bg-white rounded-full transition-[width] duration-150 ease-out" style={{ width: `${reviewProgress * 100}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 space-y-1.5">
                                <h3 className="font-semibold text-[13px] leading-snug text-black line-clamp-2 group-hover:text-black/70 transition-colors duration-150 ease-out">{track.title}</h3>
                                {hasReviews ? (
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare className="h-3 w-3 text-purple-500" />
                                    <span className="text-xs font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested} reviews</span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-black/30">Awaiting reviews</p>
                                )}
                              </div>
                            </Link>
                          </Card>
                        </div>
                      </div>
                    );
                  }

                  if (isLocked) {
                    return (
                      <div key={`locked-${slotIndex}`}>
                        <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/20 mb-2">Slot {slotNum}</p>
                        <Link href="/pro" className="group block">
                          <Card variant="soft" interactive className="border-2 border-dashed border-black/5 bg-neutral-50/50 hover:bg-purple-50/50 hover:border-purple-200">
                            <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2">
                              <Lock className="h-6 w-6 text-black/10 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div className="p-3 text-center">
                              <p className="text-xs font-semibold text-black/20 group-hover:text-purple-600 transition-colors">Unlock with Pro</p>
                            </div>
                          </Card>
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div key={`empty-${slotIndex}`}>
                      <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/30 mb-2">Slot {slotNum} — open</p>
                      <Card variant="soft" className="border-2 border-dashed border-black/10 bg-white/40 overflow-hidden">
                        <div className="aspect-[4/3] flex flex-col items-center justify-center gap-3 p-4">
                          <div className="h-10 w-10 rounded-full bg-black/5 flex items-center justify-center">
                            <Plus className="h-4 w-4 text-black/30" />
                          </div>
                          <p className="text-xs font-semibold text-black/40">Add to queue</p>
                        </div>
                        <div className="border-t border-black/5">
                          <Link href="/submit" className="flex items-center gap-2 px-3 py-2.5 hover:bg-black/[0.03] transition-colors group">
                            <Plus className="h-3 w-3 text-black/30 group-hover:text-black/60" />
                            <span className="text-xs font-medium text-black/50 group-hover:text-black/80 transition-colors">Upload new track</span>
                          </Link>
                          {eligibleForQueue.length > 0 && (
                            <Link href={`/tracks/${eligibleForQueue[0].id}`} className="flex items-center gap-2 px-3 py-2.5 hover:bg-purple-50/50 transition-colors group border-t border-black/5">
                              <Music className="h-3 w-3 text-purple-400 group-hover:text-purple-600" />
                              <span className="text-xs font-medium text-purple-500 group-hover:text-purple-700 transition-colors">Queue existing track</span>
                            </Link>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* Grandfathered tracks beyond slot limit */}
              {activeTracks.length > 3 && (
                <div className="mt-6">
                  <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-amber-600 mb-2">Grandfathered</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                    {activeTracks.slice(3).map((track) => {
                      const completedReviews = (track.Review ?? []).filter((r: any) => r.status === "COMPLETED").length;
                      const hasReviews = track.reviewsRequested > 0;
                      const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
                      return (
                        <Link key={track.id} href={`/tracks/${track.id}`} className="group block">
                          <Card variant="soft" interactive className="overflow-hidden ring-2 ring-amber-300">
                            <div className="relative aspect-[4/3] bg-neutral-100">
                              {track.artworkUrl ? (
                                <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="33vw" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                  <Music className="h-8 w-8 text-black/15" />
                                </div>
                              )}
                              {hasReviews && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-6 pb-2 px-2">
                                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-3 space-y-1.5">
                              <h3 className="font-semibold text-[13px] text-black line-clamp-2">{track.title}</h3>
                              {hasReviews && (
                                <div className="flex items-center gap-1.5">
                                  <MessageSquare className="h-3 w-3 text-purple-500" />
                                  <span className="text-xs font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested}</span>
                                </div>
                              )}
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ready to queue — eligible tracks that can be added to a slot */}
              {eligibleForQueue.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-sm font-bold text-black">Ready to queue</h3>
                    <div className="h-px flex-1 bg-black/5" />
                    {hasOpenSlots ? (
                      <span className="text-xs text-lime-700 font-medium">{maxSlots - activeTracks.length} {maxSlots - activeTracks.length === 1 ? "slot" : "slots"} open</span>
                    ) : (
                      <span className="text-xs text-black/30">All slots full</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                    {eligibleForQueue.map((track) => {
                      const completedReviews = (track.Review ?? []).filter((r: any) => r.status === "COMPLETED").length;
                      const hasReviews = track.reviewsRequested > 0;
                      const isCompleted = track.status === "COMPLETED";
                      return (
                        <Link key={track.id} href={`/tracks/${track.id}`} className="group block">
                          <Card variant="soft" interactive className={cn("overflow-hidden", !hasOpenSlots && "opacity-50")}>
                            <div className="relative aspect-[4/3] bg-neutral-100">
                              {track.artworkUrl ? (
                                <Image src={track.artworkUrl} alt={track.title} fill className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02]" sizes="33vw" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                  <Music className="h-8 w-8 text-black/15" />
                                </div>
                              )}
                              <div className="absolute top-2 left-2">
                                <span className={cn(
                                  "inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm",
                                  isCompleted
                                    ? "bg-lime-100 text-lime-800 border border-lime-300"
                                    : "bg-white/80 text-black/50 border border-black/10"
                                )}>
                                  {isCompleted ? "Completed" : "Uploaded"}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 space-y-1.5">
                              <h3 className="font-semibold text-[13px] leading-snug text-black line-clamp-2 group-hover:text-black/70 transition-colors">{track.title}</h3>
                              {hasReviews ? (
                                <p className="text-xs text-black/40">{completedReviews}/{track.reviewsRequested} reviews done</p>
                              ) : (
                                <p className="text-xs text-black/30">No reviews yet</p>
                              )}
                              {hasOpenSlots && (
                                <p className="text-xs font-semibold text-purple-600 group-hover:text-purple-700">Request reviews →</p>
                              )}
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          }
          gridView={
            tracks.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                <Link
                  href="/submit"
                  className="group aspect-square"
                >
                  <Card
                    variant="soft"
                    interactive
                    className="h-full border-2 border-dashed border-black/10 bg-white/40 hover:bg-white/60 hover:border-black/20"
                  >
                    <div className="h-full flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-black/5 group-hover:bg-black flex items-center justify-center transition-colors duration-150 ease-out motion-reduce:transition-none">
                        <Plus className="h-5 w-5 text-black/40 group-hover:text-white transition-colors duration-150 ease-out motion-reduce:transition-none" />
                      </div>
                      <span className="text-sm text-black/50 group-hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none">
                        Upload track
                      </span>
                    </div>
                  </Card>
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

  return (
    <Link href={`/tracks/${id}`} className="group block">
      <Card variant="soft" interactive className="overflow-hidden">
        {/* Artwork - 4:3 ratio to leave more room for text */}
        <div className="relative aspect-[4/3] bg-neutral-100">
          {artworkUrl ? (
            <Image
              src={artworkUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
              <Music className="h-8 w-8 text-black/15" />
            </div>
          )}

          {/* Status badge */}
          {isComplete ? (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500 text-white shadow-sm">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </span>
            </div>
          ) : isReviewing ? (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-600 text-white shadow-sm">
                Reviewing
              </span>
            </div>
          ) : isUploaded ? (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/80 text-black/60 border border-black/10 backdrop-blur-sm">
                Uploaded
              </span>
            </div>
          ) : null}

          {/* Review progress bar */}
          {isReviewing && hasReviews && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-6 pb-2 px-2">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-[width] duration-150 ease-out motion-reduce:transition-none"
                  style={{ width: `${reviewProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="p-3 space-y-1.5">
          <h3 className="font-semibold text-[13px] leading-snug text-black line-clamp-2 group-hover:text-black/70 transition-colors duration-150 ease-out motion-reduce:transition-none">
            {title}
          </h3>

          {/* Review count - prominent */}
          {hasReviews ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className={cn("h-3 w-3", isComplete ? "text-emerald-600" : "text-purple-500")} />
                <span className={cn("text-xs font-semibold", isComplete ? "text-emerald-700" : "text-purple-700")}>
                  {completedReviews}/{totalReviews} reviews
                </span>
              </div>
            </div>
          ) : (
            <p className={cn("text-xs", isUploaded ? "text-purple-600 font-medium" : "text-black/30")}>
              {isUploaded ? "Request reviews →" : "No reviews yet"}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-32">
      <div className="relative mb-8">
        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-neutral-200 transform rotate-6 absolute inset-0" />
        <div
          className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl transform -rotate-3 absolute inset-0"
          style={{ backgroundColor: "#e8e8e8" }}
        />
        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-neutral-100 relative flex items-center justify-center">
          <Music className="h-10 w-10 text-black/20" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-center mb-3">
        Upload your first track
      </h2>
      <p className="text-black/40 text-center max-w-sm mb-8">
        Get it heard by real listeners. Get feedback. Get paid.
      </p>

      <Link href="/submit">
        <Button variant="airyPrimary" className="h-12 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Upload your first track
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
