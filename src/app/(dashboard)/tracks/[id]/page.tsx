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

      {/* ── HERO — large artwork, spacious ─────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10 relative overflow-hidden">
          <SparklesDoodle className="absolute top-4 right-[25%] w-10 h-10 text-purple-500/15 pointer-events-none" />

          <Link
            href="/tracks"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            My Music
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Large Artwork */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-black/8 shadow-md">
              {track.artworkUrl ? (
                <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <span className="text-5xl font-black text-white/80 select-none">
                    {track.title.trim()[0]?.toUpperCase() ?? "♪"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-black leading-[0.95] break-words">
                    {track.title}
                  </h1>
                  {track.status === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-lime-400 text-black">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {track.Genre.map((genre) => (
                    <span key={genre.id} className="px-3 py-1 bg-black/[0.04] rounded-full text-xs font-bold text-black/50">
                      {genre.name}
                    </span>
                  ))}
                  {(track.publicPlayCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/[0.04] rounded-full text-xs font-bold text-black/50">
                      <Play className="w-3 h-3 fill-black/40 text-black/40" />
                      {track.publicPlayCount.toLocaleString()} plays
                    </span>
                  )}
                </div>
              </div>

              {/* Review progress + actions row */}
              <div className="flex flex-wrap items-center gap-4">
                {track.reviewsRequested > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-black tabular-nums">{completedReviews}</span>
                      <span className="text-xs text-black/40 font-medium">/ {track.reviewsRequested}</span>
                    </div>
                    <div className="w-24 h-2 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progress >= 100 ? "bg-lime-400" : "bg-purple-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-black text-black/30">{progress}%</span>
                  </div>
                )}

                {/* Inline actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {(track.status === "UPLOADED" || track.status === "PENDING_PAYMENT" || track.status === "COMPLETED") && hasAvailableSlot && (
                    <Link href={`/tracks/${track.id}/request-reviews`}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-9 px-4 text-xs rounded-xl">
                        {track.status === "COMPLETED" ? "More reviews" : "Get reviews"}
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  )}
                  <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="h-9 px-3 text-xs rounded-xl font-bold">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      {track.sourceType === "UPLOAD" ? "Download" : "Open"}
                    </Button>
                  </a>
                  {track.trackShareId && completedReviews > 0 && (
                    <a href={`/t/${track.trackShareId}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="h-9 px-3 text-xs rounded-xl font-bold">
                        Share
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PLAYER — full-width dark strip ──────────────────────── */}
      <div className="bg-neutral-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <AudioPlayer
            sourceUrl={track.sourceUrl}
            sourceType={track.sourceType}
            showListenTracker={false}
            showWaveform={track.sourceType === "UPLOAD"}
          />
        </div>
      </div>

      {/* ── ARTIST NOTE — subtle strip ──────────────────────────── */}
      {track.feedbackFocus && (
        <div className="bg-purple-50 border-b border-purple-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-start gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 flex-shrink-0 mt-0.5">Note</span>
            <p className="text-sm text-purple-900/60 leading-relaxed">{track.feedbackFocus}</p>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT — single column, spacious ──────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {track.releaseDecisionReport && (
          <div className="mb-10">
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
          <div className="rounded-2xl px-8 py-20 text-center bg-white border-2 border-black/6">
            <Music className="h-14 w-14 text-black/10 mx-auto mb-5" />
            <h3 className="text-2xl font-black text-black mb-2">No reviews yet</h3>
            <p className="text-sm text-black/40 font-medium mb-8 max-w-md mx-auto leading-relaxed">
              {track.status === "UPLOADED" || track.status === "PENDING_PAYMENT"
                ? "Request reviews to start getting structured feedback from artists in your genre."
                : "Sit tight — reviews will appear here once they're completed."}
            </p>
            {(track.status === "UPLOADED" || track.status === "PENDING_PAYMENT") && (
              hasAvailableSlot ? (
                <Link href={`/tracks/${track.id}/request-reviews`}>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-12 px-8 text-base rounded-xl">
                    Request reviews
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <Button disabled className="opacity-40 cursor-not-allowed h-12 px-8 rounded-xl border-2 border-black/10 text-base">
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
    </div>
  );
}
