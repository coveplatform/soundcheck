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
import { ArrowRight, MessageCircle, Trophy, Music, Headphones } from "lucide-react";

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
              select: { status: true, createdAt: true },
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
              select: { status: true, createdAt: true },
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

  // Fetch pending peer reviews
  let pendingPeerReviews: PendingPeerReview[] = [];
  try {
    pendingPeerReviews = await prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        Track: {
          status: { not: "COMPLETED" },
        },
      },
      select: {
        id: true,
        createdAt: true,
        Track: {
          select: {
            title: true,
            Genre: true,
            ArtistProfile: {
              select: { artistName: true },
            },
          },
        },
      },
      take: 3,
      orderBy: { createdAt: "asc" },
    });
  } catch {
    pendingPeerReviews = [];
  }

  // Fetch highest rated track of the day (community feature)
  type TopTrack = { id: string; title: string; artworkUrl: string | null; artistName: string; avgScore: number };
  const topRatedTrack: TopTrack | null = await (async (): Promise<TopTrack | null> => {
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
  })();

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
    pendingPeerReviews,
  });

  // Get personalized guidance
  const whatsNext = getWhatsNextGuidance({
    tracks,
    reviewCredits: credits,
    subscriptionStatus: artistProfile.subscriptionStatus,
    pendingPeerReviews,
    totalPeerReviews:
      "totalPeerReviews" in artistProfile
        ? artistProfile.totalPeerReviews
        : undefined,
  });

  const showSideRail = true;

  return (
    <div className="pt-6 pb-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Hero */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5 border-b border-black/10">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black truncate">
              Hey, {artistProfile.artistName}
            </h1>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
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
            <Link href="/submit">
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out motion-reduce:transition-none text-sm h-9 px-4"
              >
                Submit track
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

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
            <section aria-label="Your tracks">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-black">Your Tracks</h2>
                <Link
                  href="/tracks"
                  className="text-[11px] font-mono tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-150 ease-out"
                >
                  View all →
                </Link>
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
            <section aria-label="Tracks to review">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-black">Tracks to Review</h2>
                  {pendingPeerReviews.length > 0 && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                      {pendingPeerReviews.length}
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

              {pendingPeerReviews.length > 0 ? (
                <div className="space-y-2">
                  {pendingPeerReviews.map((review) => (
                    <PendingReviewCard key={review.id} review={review} />
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

          <aside className="space-y-4 mt-2 lg:mt-0 lg:sticky lg:top-6 h-fit" aria-label="Sidebar">
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
              {!isSubscribed && (
                <div className="border border-purple-200 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="h-4 w-4 text-white rotate-[-45deg]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">Upgrade to Pro</p>
                      <p className="text-xs text-neutral-500">40 credits/mo + listener revenue</p>
                    </div>
                  </div>
                  <Link href="/account">
                    <Button
                      className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 ease-out motion-reduce:transition-none text-sm h-9"
                    >
                      Learn More
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </aside>
        </div>

        <MobileStickyCTA show={tracks.length === 0 || credits > 0} />
      </div>
    </div>
  );
}
