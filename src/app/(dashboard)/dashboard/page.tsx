import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip } from "@/components/ui/tooltip";
import { ArrowRight, MessageCircle, Trophy, Music, Headphones, BarChart3, Lock, Crown, Plus } from "lucide-react";
import {
  SparklesDoodle,
  SquiggleDoodle,
  DotsDoodle,
  MusicDoodle,
  StarDoodle,
} from "@/components/dashboard/doodles";
import { ClaimCard } from "@/components/dashboard/claim-card";
import { ReferralCard } from "@/components/referral/referral-card";

import {
  DashboardArtistProfile,
  MinimalArtistProfile,
  PendingPeerReview,
} from "@/types/dashboard";
import { StatCardGrid } from "@/components/dashboard/stat-card-grid";
import { PendingReviewCard } from "@/components/dashboard/pending-review-card";
import { WhatsNextCard } from "@/components/dashboard/whats-next-card";
import { CreditGuide } from "@/components/dashboard/credit-guide";
import { MobileStickyCTA } from "@/components/dashboard/mobile-sticky-cta";
import {
  calculateDashboardStats,
  getWhatsNextGuidance,
} from "@/lib/dashboard-helpers";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch artist profile with peer review fields
  let artistProfile: DashboardArtistProfile | MinimalArtistProfile | null =
    null;
  try {
    artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        reviewCredits: true,
        totalPeerReviews: true,
        peerReviewRating: true,
        peerGemCount: true,
        hasSeenCreditGuide: true,
        subscriptionStatus: true,
        Genre_ArtistReviewGenres: true,
        Track: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            sourceUrl: true,
            status: true,
            reviewsRequested: true,
            reviewsCompleted: true,
            feedbackViewedAt: true,
            Genre: true,
            Review: {
              select: {
                status: true,
                createdAt: true,
                productionScore: true,
                vocalScore: true,
                originalityScore: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        subscriptionStatus: true,
        Track: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            sourceUrl: true,
            status: true,
            reviewsRequested: true,
            reviewsCompleted: true,
            feedbackViewedAt: true,
            Genre: true,
            Review: {
              select: {
                status: true,
                createdAt: true,
                productionScore: true,
                vocalScore: true,
                originalityScore: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const credits: number =
    "reviewCredits" in artistProfile ? artistProfile.reviewCredits ?? 0 : 0;
  const hasSeenCreditGuide: boolean =
    "hasSeenCreditGuide" in artistProfile
      ? artistProfile.hasSeenCreditGuide ?? false
      : true;
  const tracks = artistProfile.Track ?? [];

  // Slot computation
  const isPro = artistProfile.subscriptionStatus === "active";
  const maxSlots = getMaxSlots(isPro);
  const activeTracks = tracks.filter((t) => (ACTIVE_TRACK_STATUSES as readonly string[]).includes(t.status));

  // Detect tracks with NEW feedback (completed reviews since last viewed)
  const tracksWithFeedback = tracks.filter((t) => {
    const completedReviews = t.Review.filter((r) => r.status === "COMPLETED");
    if (completedReviews.length === 0) return false;
    // If artist has never viewed feedback, any completed review counts
    if (!t.feedbackViewedAt) return true;
    // Check if any review was completed after the last time the artist viewed
    const viewedAt = new Date(t.feedbackViewedAt).getTime();
    return completedReviews.some((r) => new Date(r.createdAt).getTime() > viewedAt);
  });

  // Run independent queries in parallel for speed
  type TopTrack = { id: string; title: string; artworkUrl: string | null; artistName: string; avgScore: number };

  const [excludeTrackIds, topRatedTrack] = await Promise.all([
    // 1. Track IDs this user already reviewed/claimed
    prisma.review.findMany({
      where: { peerReviewerArtistId: artistProfile.id },
      select: { trackId: true },
    }).then((r: { trackId: string }[]) => r.map((x) => x.trackId)).catch(() => [] as string[]),

    // 2. Highest rated track of the day (community feature)
    (async (): Promise<TopTrack | null> => {
      try {
        const recentTracks = await prisma.track.findMany({
          where: {
            status: { in: ["IN_PROGRESS", "COMPLETED"] },
            reviewsCompleted: { gte: 3 },
            artistId: { not: artistProfile.id },
          },
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            ArtistProfile: { select: { artistName: true } },
            Review: {
              where: { status: "COMPLETED" },
              select: {
                productionScore: true,
                originalityScore: true,
                vocalScore: true,
              },
            },
          },
          orderBy: { completedAt: "desc" },
          take: 20,
        });

        let best: TopTrack | null = null;
        let bestAvg = 0;
        for (const t of recentTracks) {
          const scores = t.Review.flatMap((r) =>
            [r.productionScore, r.originalityScore, r.vocalScore].filter(
              (s): s is number => s !== null && s >= 1
            )
          );
          if (scores.length < 3) continue;
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg > bestAvg) {
            bestAvg = avg;
            best = {
              id: t.id,
              title: t.title,
              artworkUrl: t.artworkUrl,
              artistName: t.ArtistProfile.artistName,
              avgScore: Math.round(avg * 10) / 10,
            };
          }
        }
        return best;
      } catch {
        return null;
      }
    })(),
  ]);

  // Fetch available tracks (depends on excludeTrackIds from above)
  const availableTracksRaw = await prisma.track.findMany({
    where: {
      packageType: "PEER",
      status: { in: ["QUEUED", "IN_PROGRESS"] },
      artistId: { not: artistProfile.id },
      id: { notIn: excludeTrackIds },
    },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      createdAt: true,
      reviewsRequested: true,
      Genre: true,
      ArtistProfile: { select: { artistName: true, subscriptionStatus: true, User: { select: { email: true } } } },
      _count: { select: { Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  const availableQueueTracks = availableTracksRaw
    .filter((t) => t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      // Pro subscribers get priority
      const aIsPro = a.ArtistProfile?.subscriptionStatus === "active";
      const bIsPro = b.ArtistProfile?.subscriptionStatus === "active";
      if (aIsPro !== bIsPro) return aIsPro ? -1 : 1;

      const aIsSeed = a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed = b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0;
    })
    .slice(0, 4);

  // Calculate stats
  const stats = calculateDashboardStats({
    totalPeerReviews:
      "totalPeerReviews" in artistProfile
        ? artistProfile.totalPeerReviews
        : undefined,
    peerReviewRating:
      "peerReviewRating" in artistProfile
        ? artistProfile.peerReviewRating
        : undefined,
    peerGemCount:
      "peerGemCount" in artistProfile ? artistProfile.peerGemCount : undefined,
    tracks,
    pendingPeerReviews: [],
  });

  // Get personalized guidance
  const whatsNext = getWhatsNextGuidance({
    tracks,
    reviewCredits: credits,
    subscriptionStatus: artistProfile.subscriptionStatus,
    pendingPeerReviews: availableQueueTracks.map((t) => ({ id: t.id, createdAt: t.createdAt, Track: { title: t.title, artworkUrl: t.artworkUrl, Genre: t.Genre, ArtistProfile: t.ArtistProfile } })),
    totalPeerReviews:
      "totalPeerReviews" in artistProfile
        ? artistProfile.totalPeerReviews
        : undefined,
  });

  const showSideRail = true;

  return (
    <div className="pt-8 pb-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Hero */}
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5 border-b border-black/10">
          <SparklesDoodle className="absolute -top-1 -left-3 w-7 h-7 text-black/[0.04] pointer-events-none" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black truncate">
              Hey, {artistProfile.artistName}
            </h1>
          </div>
          <Tooltip
            content={
              credits > 0
                ? "Spend on reviews"
                : "Earn by reviewing tracks"
            }
          >
            <div className="flex items-baseline gap-1.5 rounded-lg border border-black/8 bg-white px-3 py-2">
              <p className="text-lg font-bold text-black tabular-nums">{credits}</p>
              <p className="text-[10px] font-medium text-black/40 uppercase tracking-wider">credits</p>
            </div>
          </Tooltip>
        </div>

        {/* Feedback Alert Banner */}
        {tracksWithFeedback.length > 0 && (
          <Link
            href={`/tracks/${tracksWithFeedback[0].id}`}
            className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 mb-5 group transition-colors duration-150 ease-out hover:bg-purple-100/80"
          >
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-purple-900">
                You have feedback waiting
                {tracksWithFeedback.length > 1
                  ? ` on ${tracksWithFeedback.length} tracks`
                  : ` on "${tracksWithFeedback[0].title}"`}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
          </Link>
        )}

        {/* First-time user welcome banner */}
        {tracks.length === 0 && credits >= 2 && (
          <div className="rounded-xl border-2 border-lime-300 bg-gradient-to-br from-lime-50 via-white to-lime-50/50 p-6 mb-5 relative overflow-hidden">
            <StarDoodle className="absolute top-2 right-3 w-12 h-12 text-lime-600/10 pointer-events-none" />
            <div className="relative">
              <p className="text-xl font-bold text-black mb-1">Your queue is empty.</p>
              <p className="text-sm text-black/60 mb-5">
                You&apos;ve got <span className="font-bold text-lime-700">{credits} credits</span> to spend. That&apos;s enough to get your first track reviewed by real artists. Drop it in your slot.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link href="/submit" className="flex-1">
                  <Button className="w-full bg-lime-600 text-white hover:bg-lime-700 active:bg-lime-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out text-sm h-10 px-5 rounded-xl">
                    <Music className="h-3.5 w-3.5 mr-2" />
                    Submit Your First Track
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
                <Link href="/review" className="flex-1">
                  <Button className="w-full border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 font-semibold text-sm h-10 px-5 rounded-xl">
                    <Headphones className="h-3.5 w-3.5 mr-2" />
                    Review Others First →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Zero credits banner */}
        {credits === 0 && (
          <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white p-5 mb-5">
            <p className="text-base font-bold text-black">You&apos;re out of credits</p>
            <p className="text-sm text-black/50 mt-1">You need credits to get feedback on your tracks.</p>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <Link href="/review">
                <Button className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out text-sm h-10 px-5 rounded-xl">
                  <Headphones className="h-3.5 w-3.5 mr-2" />
                  Review a track to earn credits
                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div
          className={`grid gap-6 ${
            showSideRail ? "lg:grid-cols-[minmax(0,1fr)_280px]" : ""
          }`}
        >
          <div className="space-y-6 min-w-0">
            {/* Stats */}
            <section aria-label="Dashboard statistics">
              <StatCardGrid stats={stats} />
            </section>


            {/* Your Queue */}
            <section aria-label="Your queue" className="relative">
              <SquiggleDoodle className="absolute -top-2 -right-2 w-10 h-10 text-black/[0.04] pointer-events-none hidden sm:block" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-black">Your Queue</h2>
                <Link
                  href="/tracks"
                  className="text-[11px] font-mono tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-150 ease-out"
                >
                  Manage queue →
                </Link>
              </div>

              {/* Slot grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {Array.from({ length: 3 }, (_, slotIndex) => {
                  const track = activeTracks[slotIndex];
                  const isLocked = !isPro && slotIndex >= maxSlots;

                  // Filled slot
                  if (track) {
                    const completedReviews = track.Review.filter((r) => r.status === "COMPLETED").length;
                    const hasReviews = track.reviewsRequested > 0;
                    const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
                    const isQueued = track.status === "QUEUED";
                    const isInProgress = track.status === "IN_PROGRESS";

                    return (
                      <Link key={track.id} href={`/tracks/${track.id}`} className="group block">
                        <Card variant="soft" interactive className="overflow-hidden">
                          <div className="relative aspect-square bg-neutral-100">
                            {track.artworkUrl ? (
                              <Image
                                src={track.artworkUrl}
                                alt={track.title}
                                fill
                                className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02]"
                                sizes="(max-width: 640px) 33vw, 200px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                <Music className="h-5 w-5 text-black/15" />
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5">
                              {isQueued ? (
                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-600 text-white shadow-sm">Queued</span>
                              ) : isInProgress ? (
                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-600 text-white shadow-sm">Reviewing</span>
                              ) : null}
                            </div>
                            {hasReviews && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent pt-4 pb-1.5 px-1.5">
                                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                  <div className="h-full bg-white rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                        <div className="mt-1.5 px-0.5">
                          <p className="text-xs font-semibold text-black truncate">{track.title}</p>
                          {hasReviews && (
                            <p className="text-[11px] text-purple-700 font-semibold">{completedReviews}/{track.reviewsRequested} reviews</p>
                          )}
                        </div>
                      </Link>
                    );
                  }

                  // Locked slot
                  if (isLocked) {
                    return (
                      <Link key={`locked-${slotIndex}`} href="/pro" className="group block">
                        <div className="aspect-square rounded-xl border-2 border-dashed border-black/[0.06] bg-neutral-50/50 hover:bg-purple-50/30 hover:border-purple-200 flex flex-col items-center justify-center gap-1.5 transition-colors">
                          <Lock className="h-4 w-4 text-black/[0.08] group-hover:text-purple-400 transition-colors" />
                          <Crown className="h-3 w-3 text-purple-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-[11px] text-center mt-1.5 font-medium text-black/20 group-hover:text-purple-600 transition-colors">Go Pro</p>
                      </Link>
                    );
                  }

                  // Empty slot
                  return (
                    <Link key={`empty-${slotIndex}`} href="/tracks" className="group block">
                      <div className="aspect-square rounded-xl border-2 border-dashed border-black/10 bg-white/50 hover:bg-purple-50/40 hover:border-purple-300 flex flex-col items-center justify-center gap-1.5 transition-all">
                        <div className="h-8 w-8 rounded-full bg-black/[0.04] group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                          <Plus className="h-3.5 w-3.5 text-black/25 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <span className="text-[10px] font-medium text-black/30 group-hover:text-purple-600 transition-colors">Add a track</span>
                      </div>
                      <p className="text-[11px] text-center mt-1.5 text-black/20">Open</p>
                    </Link>
                  );
                })}
              </div>

              {/* Credits + manage link */}
              <div className="mt-3 flex items-center gap-2 text-xs text-black/40">
                <span>Credits: <span className="font-bold text-black">{credits}</span></span>
                <span>·</span>
                <Link href="/tracks" className="text-purple-600 hover:text-purple-700 font-medium">
                  Manage queue →
                </Link>
              </div>
            </section>

            {/* Tracks to Review */}
            <section aria-label="Tracks to review" className="relative">
              <DotsDoodle className="absolute -top-1 -right-1 w-8 h-8 text-black/[0.04] pointer-events-none hidden sm:block" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-black">Tracks to Review</h2>
                  {availableQueueTracks.length > 0 && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                      {availableQueueTracks.length}
                    </span>
                  )}
                </div>
                <Link
                  href="/review"
                  className="text-[11px] font-mono tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-150 ease-out"
                >
                  View queue →
                </Link>
              </div>

              {availableQueueTracks.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableQueueTracks.map((track) => (
                    <ClaimCard
                      key={track.id}
                      trackId={track.id}
                      title={track.title}
                      artistName={track.ArtistProfile.artistName}
                      artworkUrl={track.artworkUrl}
                    />
                  ))}
                </div>
              ) : (
                <Card variant="soft" className="border border-black/10 bg-white/50">
                  <CardContent className="py-8">
                    <EmptyState
                      doodle="headphones"
                      title="Queue empty"
                      description="No tracks to review right now. Check back soon!"
                    />
                  </CardContent>
                </Card>
              )}
            </section>

          </div>

          <aside className="relative space-y-4 mt-2 lg:mt-0 lg:sticky lg:top-6 h-fit" aria-label="Sidebar">
              <MusicDoodle className="absolute -top-3 right-2 w-8 h-8 text-black/[0.04] pointer-events-none hidden lg:block" />
              {whatsNext && <WhatsNextCard {...whatsNext} />}
              {!hasSeenCreditGuide && <CreditGuide />}

              {/* Top Rated Today */}
              <div className="border border-amber-200/60 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Top Rated Today</span>
                </div>
                {topRatedTrack ? (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-neutral-100 border border-black/5 flex-shrink-0">
                      {topRatedTrack.artworkUrl ? (
                        <Image
                          src={topRatedTrack.artworkUrl}
                          alt={topRatedTrack.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-300">
                          <Music className="h-5 w-5 text-amber-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{topRatedTrack.title}</p>
                      <p className="text-xs text-black/40 truncate">{topRatedTrack.artistName}</p>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="text-xl font-black text-amber-600 leading-none">{topRatedTrack.avgScore}</span>
                      <span className="text-[9px] text-amber-500/60 font-medium">/5</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black/40">No ratings yet today</p>
                      <p className="text-xs text-black/25">Submit a track to be featured</p>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/tracks?view=insights" className="block">
                <div className="border rounded-2xl p-4 transition-colors duration-150 ease-out border-black/10 bg-white/60 hover:bg-white/80">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Insights</span>
                  </div>
                  <p className="text-sm font-bold text-black mb-0.5">
                    See what&apos;s working
                  </p>
                  <p className="text-xs text-black/40">
                    Track your scores, spot patterns, and know where to focus next.
                  </p>
                </div>
              </Link>

              <ReferralCard />
            </aside>
        </div>

        <MobileStickyCTA show={tracks.length === 0 || credits > 0} />
      </div>
    </div>
  );
}
