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
import { ArrowRight, MessageCircle, Trophy, Music, Headphones, BarChart3, Sparkles, Target, Zap } from "lucide-react";
import {
  SparklesDoodle,
  SquiggleDoodle,
  DotsDoodle,
  MusicDoodle,
  StarDoodle,
} from "@/components/dashboard/doodles";
import { ClaimCard } from "@/components/dashboard/claim-card";

import {
  DashboardArtistProfile,
  MinimalArtistProfile,
  PendingPeerReview,
} from "@/types/dashboard";
import { StatCardGrid } from "@/components/dashboard/stat-card-grid";
import { TrackCard } from "@/components/dashboard/track-card";
import { PendingReviewCard } from "@/components/dashboard/pending-review-card";
import { WhatsNextCard } from "@/components/dashboard/whats-next-card";
import { CreditGuide } from "@/components/dashboard/credit-guide";
import { MobileStickyCTA } from "@/components/dashboard/mobile-sticky-cta";
import {
  calculateDashboardStats,
  getWhatsNextGuidance,
} from "@/lib/dashboard-helpers";

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
          take: 4,
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
          take: 4,
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
  const isSubscribed = artistProfile.subscriptionStatus === "active";
  const tracks = artistProfile.Track ?? [];

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
      ArtistProfile: { select: { artistName: true, User: { select: { email: true } } } },
      _count: { select: { Review: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] } } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  const availableQueueTracks = availableTracksRaw
    .filter((t) => t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      const aIsSeed = a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed = b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0;
    })
    .slice(0, 3);

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

        {/* NEW: Release Decision Announcement Banner */}
        <Link
          href="/submit"
          className="relative block mb-5 group overflow-visible"
        >
          <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 px-6 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 ease-out active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]">

            {/* Animated NEW badge */}
            <div className="absolute -top-2 -right-2 bg-black border-2 border-white text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg animate-pulse">
              NEW ✨
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-300 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-pink-300 rounded-full blur-xl opacity-50"></div>

            <div className="flex items-start sm:items-center gap-4 relative z-10">
              {/* Icon */}
              <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-150">
                <Target className="h-7 w-7 text-white drop-shadow-md" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-xl font-black text-white drop-shadow-md tracking-tight">Release Decision</h3>
                  <Zap className="h-5 w-5 text-yellow-300 drop-shadow-md animate-pulse" />
                </div>
                <p className="text-sm text-white/95 leading-snug font-medium drop-shadow">
                  <strong className="text-white font-bold">Should you release this track?</strong> Get expert panel + AI analysis for just <span className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-md font-black text-yellow-300 border border-white/30">$9.95</span>
                  <span className="hidden sm:inline text-white/90"> • Clear Go/No-Go verdict with actionable fixes in 24 hours</span>
                </p>
              </div>

              {/* CTA Arrow */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0 text-white font-bold bg-white/20 px-4 py-2 rounded-lg border-2 border-white/30 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <span className="text-sm">Learn More</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        {/* Feedback Alert Banner */}
        {tracksWithFeedback.length > 0 && (
          <Link
            href={`/artist/tracks/${tracksWithFeedback[0].id}`}
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
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-lime-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Welcome to MixReflect!</h3>
                  <p className="text-sm text-black/60 mt-1">
                    You have <span className="font-bold text-lime-700">{credits} free credits</span> to get started. Here&apos;s what to do:
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4 ml-13">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-bold text-lime-700 flex-shrink-0">1.</span>
                  <p className="text-sm text-black/80">
                    <strong>Submit a track</strong> and spend credits to request feedback
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-bold text-lime-700 flex-shrink-0">2.</span>
                  <p className="text-sm text-black/80">
                    <strong>Review other tracks</strong> to earn more credits (1 review = 1 credit)
                  </p>
                </div>
              </div>
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
                    Review Tracks to Earn Credits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Zero credits banner */}
        {credits === 0 && !isSubscribed && (
          <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white p-5 mb-5">
            <p className="text-base font-bold text-black">You&apos;re out of credits</p>
            <p className="text-sm text-black/50 mt-1">You need credits to get feedback on your tracks.</p>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <Link href="/review">
                <Button className="w-full sm:w-auto border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 font-semibold text-sm h-10 px-5 rounded-xl">
                  <Headphones className="h-3.5 w-3.5 mr-2" />
                  Review a track to earn one
                </Button>
              </Link>
              <Link href="/submit">
                <Button className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out text-sm h-10 px-5 rounded-xl">
                  Buy credits
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


            {/* Your Tracks */}
            <section aria-label="Your tracks" className="relative">
              <SquiggleDoodle className="absolute -top-2 -right-2 w-10 h-10 text-black/[0.04] pointer-events-none hidden sm:block" />
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-black">Your Tracks</h2>
                <div className="flex items-center gap-3">
                  <Link
                    href="/submit"
                    className="text-[11px] font-mono tracking-[0.15em] uppercase text-purple-600 hover:text-purple-800 font-semibold transition-colors duration-150 ease-out"
                  >
                    + Submit
                  </Link>
                  <Link
                    href="/tracks"
                    className="text-[11px] font-mono tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-150 ease-out"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {tracks.length > 0 ? (
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      priority={index === 0}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <Card variant="soft" className="border border-black/10 bg-white/50">
                  <CardContent className="py-8">
                    <EmptyState
                      doodle="music"
                      title="No tracks yet"
                      description="Upload your first track and request feedback from peers."
                      action={{ label: "Submit a track", href: "/submit" }}
                    />
                  </CardContent>
                </Card>
              )}
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
                <div className="space-y-2">
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
              <Link href="/tracks" className="block">
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
            </aside>
        </div>

        <MobileStickyCTA show={tracks.length === 0 || credits > 0} />
      </div>
    </div>
  );
}
