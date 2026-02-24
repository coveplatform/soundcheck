import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SparklesDoodle } from "@/components/dashboard/doodles";
import { AudioPlayer } from "@/components/audio/audio-player";
import { TrackDashboardTabs } from "@/components/tracks/track-dashboard-tabs";
import { StatsTab } from "@/components/tracks/stats-tab";
import { ReviewsTab } from "@/components/tracks/reviews-tab";
import { SettingsTab } from "@/components/tracks/settings-tab";
import { ReleaseDecisionReportView } from "@/components/tracks/release-decision-report-view";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Music,
  CheckCircle2,
  Crown,
  Play,
} from "lucide-react";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";

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

  // Slot availability check for "Request Reviews" button
  const isPro = track.ArtistProfile.subscriptionStatus === "active";
  const maxSlots = getMaxSlots(isPro);
  const isTrackActive = (ACTIVE_TRACK_STATUSES as readonly string[]).includes(track.status);
  const activeTrackCount = await prisma.track.count({
    where: {
      artistId: track.ArtistProfile.id,
      status: { in: ACTIVE_TRACK_STATUSES as any },
    },
  });
  const hasAvailableSlot = activeTrackCount < maxSlots || isTrackActive;

  // Auto-fetch missing artwork from oEmbed and persist it
  if (!track.artworkUrl && track.sourceType !== "UPLOAD" && track.sourceUrl) {
    try {
      const hostname = new URL(track.sourceUrl).hostname.toLowerCase();
      let oembedUrl: string | null = null;
      if (hostname.includes("soundcloud.com")) {
        oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(track.sourceUrl)}&format=json`;
      } else if (hostname.includes("bandcamp.com")) {
        oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(track.sourceUrl)}&format=json`;
      } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(track.sourceUrl)}&format=json`;
      }
      if (oembedUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(oembedUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data.thumbnail_url) {
            track.artworkUrl = data.thumbnail_url;
            prisma.track.update({
              where: { id },
              data: { artworkUrl: data.thumbnail_url },
            }).catch(() => {});
          }
        }
      }
    } catch { /* best-effort */ }
  }

  const completedReviews = track.Review.length;
  const countedCompletedReviews = track.Review.filter(
    (r) => r.countsTowardCompletion !== false
  ).length;
  const progress =
    track.reviewsRequested > 0
      ? Math.round((countedCompletedReviews / track.reviewsRequested) * 100)
      : 0;

  const canUpdateSource = track.status !== "CANCELLED" && completedReviews === 0;


  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <SparklesDoodle className="absolute top-2 right-[30%] w-9 h-9 text-purple-500/20 pointer-events-none" />
          <Link
            href="/tracks"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            My Music
          </Link>

          <div className="flex items-start gap-5">
            {/* Artwork */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-black/8 shadow-sm">
              {track.artworkUrl ? (
                <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <span className="text-3xl font-black text-white/80 select-none">
                    {track.title.trim()[0]?.toUpperCase() ?? "♪"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-tight break-words">
                  {track.title}
                </h1>
                {track.status === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-lime-400 text-black">
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {track.Genre.map((genre) => (
                  <span key={genre.id} className="px-2.5 py-0.5 bg-black/5 rounded-full text-xs font-bold text-black/50">
                    {genre.name}
                  </span>
                ))}
                {(track.publicPlayCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/5 rounded-full text-xs font-bold text-black/50">
                    <Play className="w-3 h-3 fill-black/40 text-black/40" />
                    {track.publicPlayCount.toLocaleString()} plays
                  </span>
                )}
              </div>

              {track.reviewsRequested > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-black tabular-nums">{completedReviews}</span>
                    <span className="text-xs text-black/40 font-medium">/ {track.reviewsRequested} reviews</span>
                  </div>
                  <div className="flex-1 max-w-[140px] h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progress >= 100 ? "bg-lime-400" : "bg-purple-500"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-black/30">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">

          {/* LEFT — tabs */}
          <div className="min-w-0 overflow-hidden">
            {track.releaseDecisionReport && (
              <div className="mb-8">
                <ReleaseDecisionReportView
                  report={track.releaseDecisionReport as any}
                  trackTitle={track.title}
                />
              </div>
            )}

            {completedReviews > 0 ? (
              <TrackDashboardTabs
                defaultTab="reviews"
                trackTitle={track.title}
                hasCompletedReviews={completedReviews > 0}
                statsTab={
                  <StatsTab
                    reviews={track.Review}
                    platformAverages={{
                      production: platformStats._avg.productionScore ?? 0,
                      originality: platformStats._avg.originalityScore ?? 0,
                      vocals: platformStats._avg.vocalScore ?? 0,
                    }}
                  />
                }
                reviewsTab={
                  <ReviewsTab reviews={track.Review} trackId={track.id} />
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
                    completedReviewCount={track.Review?.length || 0}
                  />
                }
              />
            ) : (
              <div className="border-2 border-black/8 rounded-2xl px-6 py-14 text-center bg-white/40">
                <Music className="h-12 w-12 text-black/15 mx-auto mb-4" />
                <h3 className="text-xl font-black text-black mb-2">No reviews yet</h3>
                <p className="text-sm text-black/40 font-medium mb-6 max-w-sm mx-auto">
                  {track.status === "UPLOADED" || track.status === "PENDING_PAYMENT"
                    ? "Request reviews to start getting feedback on your track."
                    : "Reviews will appear here once they're completed."}
                </p>
                {(track.status === "UPLOADED" || track.status === "PENDING_PAYMENT") && (
                  hasAvailableSlot ? (
                    <Link href={`/tracks/${track.id}/request-reviews`}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 px-6 rounded-xl">
                        Request reviews
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <Button disabled className="opacity-40 cursor-not-allowed h-10 px-6 rounded-xl border-2 border-black/10">
                        All slots full
                      </Button>
                      <p className="text-xs text-black/40 font-medium">
                        <Link href="/pro" className="text-purple-600 hover:text-purple-800 font-black">Upgrade to Pro</Link>{" "}
                        for more slots.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-4">

            {/* Player */}
            <div className="bg-neutral-900 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Listen</p>
              <AudioPlayer
                sourceUrl={track.sourceUrl}
                sourceType={track.sourceType}
                showListenTracker={false}
                showWaveform={track.sourceType === "UPLOAD"}
              />
            </div>

            {/* Actions */}
            {(track.status === "UPLOADED" || track.status === "PENDING_PAYMENT" || track.status === "COMPLETED") && (
              <div className="bg-white rounded-2xl border-2 border-black/8 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Actions</p>
                {hasAvailableSlot ? (
                  <Link href={`/tracks/${track.id}/request-reviews`} className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-10 rounded-xl">
                      {track.status === "COMPLETED" ? "Request more reviews" : "Request reviews"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Button disabled className="w-full opacity-40 cursor-not-allowed h-10 rounded-xl border-2 border-black/10">
                      All slots full
                    </Button>
                    <Link href="/pro" className="flex items-center justify-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-black transition-colors">
                      <Crown className="h-3 w-3" />
                      Upgrade to Pro for more slots
                    </Link>
                  </div>
                )}
                <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="airy" className="w-full h-10 rounded-xl border-2 border-black/10 font-bold text-sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {track.sourceType === "UPLOAD" ? "Download track" : "Open track"}
                  </Button>
                </a>
              </div>
            )}

            {/* Share */}
            {track.trackShareId && completedReviews > 0 && (
              <div className="bg-white rounded-2xl border-2 border-black/8 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Share Results</p>
                <p className="text-sm text-black/40 font-medium mb-3">
                  Share your feedback publicly — great for socials or press kits.
                </p>
                <a href={`/t/${track.trackShareId}`} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="airy" className="w-full h-10 rounded-xl border-2 border-black/10 font-bold text-sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View share page
                  </Button>
                </a>
              </div>
            )}

            {/* Artist Note */}
            {track.feedbackFocus && (
              <div className="bg-white rounded-2xl border-2 border-black/8 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">Artist Note</p>
                <p className="text-sm text-black/70 leading-relaxed">{track.feedbackFocus}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
