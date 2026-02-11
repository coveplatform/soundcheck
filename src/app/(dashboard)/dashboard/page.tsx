import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip } from "@/components/ui/tooltip";
import { ArrowRight } from "lucide-react";

// New imports
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
            Genre: true,
            Review: {
              select: { status: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
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
            Genre: true,
            Review: {
              select: { status: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
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

  // Fetch pending peer reviews with timestamp
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

  // Calculate stats with priority ordering
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

  const showSideRail = !hasSeenCreditGuide || !isSubscribed || whatsNext;

  return (
    <div className="pt-8 pb-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Reduced height */}
        <div className="mb-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-6 border-b border-black/10">
            <div>
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
                Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black mt-2 break-words">
                Welcome back, {artistProfile.artistName}
              </h1>
              <p className="text-sm text-black/50 mt-2 max-w-xl">
                Here's what's happening with your music right now.
              </p>
            </div>

            {/* Credits and CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <Tooltip
                content={
                  credits > 0
                    ? "Spend on reviews"
                    : "Earn by reviewing tracks"
                }
              >
                <div className="rounded-xl border-2 border-neutral-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-black tabular-nums">
                      {credits}
                    </p>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Credits
                    </p>
                  </div>
                  {credits === 0 && (
                    <Link
                      href="/review"
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors mt-1 inline-block"
                    >
                      Earn more →
                    </Link>
                  )}
                </div>
              </Tooltip>

              <Link href="/submit">
                <Button
                  size="lg"
                  className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out motion-reduce:transition-none"
                >
                  Submit a track
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div
          className={`grid gap-8 ${
            showSideRail ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""
          }`}
        >
          <div className="space-y-10 min-w-0">
            {/* Stats Section */}
            <section aria-label="Dashboard statistics">
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40 mb-4">
                Overview
              </p>
              <StatCardGrid stats={stats} />
            </section>
            {/* Your Tracks */}
            <section aria-label="Your tracks">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                <div>
                  <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
                    Library
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-black mt-2">
                    Your Tracks
                  </h2>
                </div>
                <Link
                  href="/tracks"
                  className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] uppercase text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {tracks.length > 0 ? (
                <div className="space-y-4">
                  {tracks.map((track, index) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      priority={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <Card variant="soft" className="border border-black/10 bg-white/50">
                  <CardContent className="py-12">
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
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                <div>
                  <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
                    Queue
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-black mt-2">
                    Tracks to Review
                  </h2>
                </div>
                <Link
                  href="/review"
                  className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] uppercase text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded"
                >
                  View queue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {pendingPeerReviews.length > 0 ? (
                <div className="space-y-4">
                  {pendingPeerReviews.map((review) => (
                    <PendingReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <Card variant="soft" className="border border-black/10 bg-white/50">
                  <CardContent className="py-12">
                    <EmptyState
                      doodle="headphones"
                      title="No tracks in your queue"
                      description="No tracks in your queue right now. Check back soon!"
                    />
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {showSideRail && (
            <aside className="space-y-6 mt-6 lg:mt-0 lg:sticky lg:top-8 h-fit" aria-label="Sidebar">
              {/* What's Next */}
              {whatsNext && <WhatsNextCard {...whatsNext} />}

              {/* Credit Guide */}
              {!hasSeenCreditGuide && <CreditGuide />}

              {/* Pro Upsell */}
              {!isSubscribed && (
                <div className="border-2 border-purple-200 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-100 p-6 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="h-6 w-6 text-white rotate-[-45deg]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-purple-600">
                          Pro
                        </p>
                        <p className="text-lg font-bold text-black mt-1">
                          Upgrade to Pro
                        </p>
                        <p className="text-sm text-neutral-600">
                          Get 40 credits per month and enable listener revenue.
                        </p>
                      </div>
                    </div>
                    <Link href="/account">
                      <Button
                        className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out motion-reduce:transition-none"
                      >
                        Learn More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Mobile Sticky CTA */}
        <MobileStickyCTA show={tracks.length === 0 || credits > 0} />
      </div>
    </div>
  );
}
