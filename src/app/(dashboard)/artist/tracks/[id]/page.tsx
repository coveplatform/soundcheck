import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackFeedbackViewTracker } from "@/components/artist/track-feedback-view-tracker";
import { AudioPlayer } from "@/components/audio/audio-player";
import { TrackDashboardTabs } from "@/components/tracks/track-dashboard-tabs";
import { StatsTab } from "@/components/tracks/stats-tab";
import { ReviewsTab } from "@/components/tracks/reviews-tab";
import { SalesTab } from "@/components/tracks/sales-tab";
import { SettingsTab } from "@/components/tracks/settings-tab";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Music,
  CheckCircle2,
  Sparkles,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  console.log("[TrackDetail] userId:", session.user.id, "trackId:", id);

  // Fetch all data needed for the dashboard tabs
  const [track, platformStats] = await Promise.all([
    prisma.track.findUnique({
      where: { id },
      include: {
        ArtistProfile: {
          include: { User: true },
        },
        Genre: true,
        Payment: true,
        Review: {
          where: { status: "COMPLETED" },
          include: {
            ReviewerProfile: {
              include: {
                User: { select: { name: true } },
              },
            },
            ArtistProfile: {
              include: {
                User: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        Purchase: {
          include: {
            ReviewerProfile_Purchase_reviewerIdToReviewerProfile: {
              include: {
                User: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        ExternalPurchase: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
        },
        TrackAffiliateLink: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.review.aggregate({
      where: {
        status: "COMPLETED",
        countsTowardAnalytics: true,
      },
      _avg: {
        productionScore: true,
        originalityScore: true,
        vocalScore: true,
      },
    }),
  ]);

  if (!track) {
    console.log("[TrackDetail] Track not found:", id);
    notFound();
  }

  // Verify ownership
  if (track.ArtistProfile.userId !== session.user.id) {
    console.log("[TrackDetail] Ownership mismatch:", track.ArtistProfile.userId, "!==", session.user.id);
    notFound();
  }

  // Mark feedback as viewed (fire-and-forget so it doesn't slow page load)
  if (track.Review.length > 0) {
    prisma.track.update({
      where: { id },
      data: { feedbackViewedAt: new Date() },
    }).catch(() => {});
  }

  // Check subscription status
  const isSubscribed = track.ArtistProfile.subscriptionStatus === "active";
  const isFreeTier = !isSubscribed;

  const completedReviews = track.Review.length;
  const countedCompletedReviews = track.Review.filter(
    (r) => r.countsTowardCompletion !== false
  ).length;
  const progress =
    track.reviewsRequested > 0
      ? Math.round((countedCompletedReviews / track.reviewsRequested) * 100)
      : 0;

  // Calculate earnings
  const totalInternalEarnings = track.Purchase.reduce((sum, p) => sum + p.amount, 0);
  const totalExternalEarnings = track.ExternalPurchase.reduce(
    (sum, p) => sum + p.artistAmount,
    0
  );

  const canUpdateSource = track.status !== "CANCELLED" && completedReviews === 0;

  return (
    <div className="pt-8 pb-24">
      <TrackFeedbackViewTracker trackId={track.id} reviewCount={completedReviews} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/artist/tracks"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tracks
        </Link>

        {/* Compact Header */}
        <div className="mb-8 pb-6 border-b border-black/10">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Compact Album Art */}
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)] overflow-hidden">
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-10 h-10 text-white/30" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-black break-words">
                  {track.title}
                </h1>
                {track.status === "COMPLETED" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-400 to-purple-500 border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-black tracking-wide">COMPLETED</span>
                  </div>
                )}
              </div>

              {/* Genre Pills */}
              {track.Genre.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {track.Genre.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2.5 py-0.5 bg-white border border-black/20 rounded-full text-xs font-bold text-black/70"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Pills */}
              {track.reviewsRequested > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">{completedReviews}</span>
                    <span className="text-black/50">reviews</span>
                  </div>
                  <div className="w-px h-4 bg-black/10"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">{progress}%</span>
                    <span className="text-black/50">complete</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-1 min-w-[150px] max-w-[200px]">
                    <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Tabs + Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          {/* Main Content - Tabs (LEFT) */}
          <div className="min-w-0 overflow-hidden">
            {completedReviews > 0 ? (
              <TrackDashboardTabs
                defaultTab="reviews"
                isPro={isSubscribed}
                statsTab={
                  <StatsTab
                    reviews={track.Review}
                    platformAverages={{
                      production: platformStats._avg.productionScore ?? 0,
                      originality: platformStats._avg.originalityScore ?? 0,
                      vocals: platformStats._avg.vocalScore ?? 0,
                    }}
                    isFreeTier={isFreeTier}
                  />
                }
                reviewsTab={
                  <ReviewsTab
                    reviews={track.Review}
                    isFreeTier={isFreeTier}
                    trackId={track.id}
                  />
                }
                salesTab={
                  isSubscribed ? (
                    <SalesTab
                      track={{
                        id: track.id,
                        title: track.title,
                        sourceType: track.sourceType,
                        sharingEnabled: track.sharingEnabled,
                        sharingMode: track.sharingMode,
                        salePrice: track.salePrice,
                        trackShareId: track.trackShareId,
                        publicPlayCount: track.publicPlayCount,
                      }}
                      internalPurchases={track.Purchase}
                      externalPurchases={track.ExternalPurchase}
                      affiliateLinks={track.TrackAffiliateLink}
                      totalInternalEarnings={totalInternalEarnings}
                      totalExternalEarnings={totalExternalEarnings}
                    />
                  ) : undefined
                }
                settingsTab={
                  <SettingsTab
                    track={{
                      id: track.id,
                      title: track.title,
                      sourceUrl: track.sourceUrl,
                      sourceType: track.sourceType,
                      status: track.status,
                      linkIssueNotifiedAt: track.linkIssueNotifiedAt,
                      feedbackFocus: track.feedbackFocus,
                    }}
                    payment={track.Payment}
                    canUpdateSource={canUpdateSource}
                  />
                }
              />
            ) : (
              <Card variant="soft" elevated>
                <CardContent className="pt-6 text-center py-16">
                  <Music className="h-16 w-16 text-black/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">No reviews yet</h3>
                  <p className="text-sm text-black/60 mb-6 max-w-md mx-auto">
                    {track.status === "UPLOADED" || track.status === "PENDING_PAYMENT"
                      ? "Request reviews to start getting feedback on your track."
                      : "Reviews will appear here once they're completed."}
                  </p>
                  {(track.status === "UPLOADED" || track.status === "PENDING_PAYMENT") && (
                    <Link href={`/artist/tracks/${track.id}/request-reviews`}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.6)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.6)] active:shadow-[1px_1px_0_rgba(0,0,0,0.6)] transition-all">
                        Request reviews
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (RIGHT) */}
          <div className="space-y-6">
            {/* Player Card */}
            <Card variant="soft" elevated className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs font-mono tracking-widest uppercase text-black/40 mb-3">
                  Listen
                </p>
                <AudioPlayer
                  sourceUrl={track.sourceUrl}
                  sourceType={track.sourceType}
                  showListenTracker={false}
                  showWaveform={track.sourceType === "UPLOAD"}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="soft" elevated>
              <CardContent className="pt-6 space-y-3">
                <p className="text-xs font-mono tracking-widest uppercase text-black/40 mb-2">
                  Quick Actions
                </p>
                {(track.status === "UPLOADED" || track.status === "PENDING_PAYMENT" || track.status === "COMPLETED") && (
                  <Link href={`/artist/tracks/${track.id}/request-reviews`} className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.6)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.6)] active:shadow-[1px_1px_0_rgba(0,0,0,0.6)] active:translate-x-[1px] active:translate-y-[1px] transition-all">
                      {track.status === "COMPLETED" ? "Request more reviews" : "Request reviews"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
                <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="airy" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {track.sourceType === "UPLOAD" ? "Download track" : "Open track"}
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Artist Note */}
            {track.feedbackFocus && (
              <Card variant="soft" elevated>
                <CardContent className="pt-6">
                  <p className="text-xs font-mono tracking-widest uppercase text-black/40 mb-3">
                    Artist Note
                  </p>
                  <p className="text-sm text-black/80 leading-relaxed">{track.feedbackFocus}</p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
