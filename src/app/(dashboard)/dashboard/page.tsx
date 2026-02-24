import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageCircle,
  Music,
  Headphones,
  ChevronUp,
  Play,
  Trophy,
} from "lucide-react";
import { ClaimCard } from "@/components/dashboard/claim-card";
import { MobileStickyCTA } from "@/components/dashboard/mobile-sticky-cta";
import { DashboardWinner } from "@/components/charts/dashboard-winner";
import {
  SparklesDoodle,
  SquiggleDoodle,
  StarDoodle,
} from "@/components/dashboard/doodles";
import {
  DashboardArtistProfile,
  MinimalArtistProfile,
} from "@/types/dashboard";
import { getWhatsNextGuidance } from "@/lib/dashboard-helpers";
import { getMaxSlots, ACTIVE_TRACK_STATUSES } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

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
  const tracks = artistProfile.Track ?? [];
  const isPro = artistProfile.subscriptionStatus === "active";
  const maxSlots = getMaxSlots(isPro);
  const activeTracks = tracks.filter((t) =>
    (ACTIVE_TRACK_STATUSES as readonly string[]).includes(t.status)
  );

  const tracksWithFeedback = tracks.filter((t) => {
    const completedReviews = t.Review.filter((r) => r.status === "COMPLETED");
    if (completedReviews.length === 0) return false;
    if (!t.feedbackViewedAt) return true;
    const viewedAt = new Date(t.feedbackViewedAt).getTime();
    return completedReviews.some(
      (r) => new Date(r.createdAt).getTime() > viewedAt
    );
  });

  // Discover preview — grab 8 public tracks with artwork for the visual
  const discoverTracks = await prisma.track.findMany({
    where: {
      isPublic: true,
      artworkUrl: { not: null },
      status: { in: ["UPLOADED", "QUEUED", "IN_PROGRESS", "COMPLETED"] },
    },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      ArtistProfile: { select: { artistName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  }).catch(() => [] as { id: string; title: string; artworkUrl: string | null; ArtistProfile: { artistName: string } | null }[]);

  const excludeTrackIds = await prisma.review
    .findMany({
      where: { peerReviewerArtistId: artistProfile.id },
      select: { trackId: true },
    })
    .then((r: { trackId: string }[]) => r.map((x) => x.trackId))
    .catch(() => [] as string[]);

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
      ArtistProfile: {
        select: {
          artistName: true,
          subscriptionStatus: true,
          User: { select: { email: true } },
        },
      },
      _count: {
        select: {
          Review: {
            where: {
              status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const availableQueueTracks = availableTracksRaw
    .filter((t) => t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      const aIsPro = a.ArtistProfile?.subscriptionStatus === "active";
      const bIsPro = b.ArtistProfile?.subscriptionStatus === "active";
      if (aIsPro !== bIsPro) return aIsPro ? -1 : 1;
      const aIsSeed =
        a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed =
        b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0;
    })
    .slice(0, 4);

  const whatsNext = getWhatsNextGuidance({
    tracks,
    reviewCredits: credits,
    subscriptionStatus: artistProfile.subscriptionStatus,
    pendingPeerReviews: availableQueueTracks.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      Track: {
        title: t.title,
        artworkUrl: t.artworkUrl,
        Genre: t.Genre,
        ArtistProfile: t.ArtistProfile,
      },
    })),
    totalPeerReviews:
      "totalPeerReviews" in artistProfile
        ? artistProfile.totalPeerReviews
        : undefined,
  });

  const isHighOrMedium =
    whatsNext?.priority === "high" || whatsNext?.priority === "medium";

  // Today's chart submission (for live activity strip)
  let todayChartSubmission: {
    rank: number | null;
    voteCount: number;
    playCount: number;
    title: string;
  } | null = null;
  try {
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    todayChartSubmission = await (prisma as any).chartSubmission.findFirst({
      where: { artistId: artistProfile.id, chartDate: todayUTC },
      select: { rank: true, voteCount: true, playCount: true, title: true },
    });
  } catch {
    // chartSubmission table may not exist in all environments
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          {/* Doodles — big, intentional, not shy */}
          <SquiggleDoodle className="absolute -bottom-5 left-[42%] w-24 h-24 text-purple-400/20 pointer-events-none rotate-6" />
          <SparklesDoodle className="absolute top-2 right-[36%] w-9 h-9 text-purple-500/25 pointer-events-none" />

          <div className="flex items-start justify-between gap-6 relative">
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Hey,{" "}
                <span className="block sm:inline">
                  {artistProfile.artistName}.
                </span>
              </h1>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10 relative">
              <StarDoodle className="absolute -top-4 -right-1 w-12 h-12 text-purple-400/30 pointer-events-none" />
              <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">
                {credits}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                {credits === 1
                  ? "credit to spend"
                  : credits > 0
                  ? "credits to spend"
                  : "credits"}
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

      {/* ── ALERT STRIPS ───────────────────────────────────────── */}
      {tracksWithFeedback.length > 0 && (
        <Link
          href={`/tracks/${tracksWithFeedback[0].id}`}
          className="block bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-white flex-shrink-0" />
              <p className="text-sm font-bold text-white">
                Feedback ready
                {tracksWithFeedback.length > 1
                  ? ` on ${tracksWithFeedback.length} tracks`
                  : ` — "${tracksWithFeedback[0].title}"`}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/60 flex-shrink-0" />
          </div>
        </Link>
      )}

      {credits === 0 && (
        <div className="bg-amber-400 border-b border-amber-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <p className="text-sm font-black text-black flex-1">
              You&apos;re out of credits
            </p>
            <Link
              href="/review"
              className="text-[11px] font-black text-black border-2 border-black px-3 py-1 rounded-full hover:bg-black hover:text-amber-400 transition-colors whitespace-nowrap"
            >
              Review a track →
            </Link>
          </div>
        </div>
      )}

      {/* ── LIVE CHART ACTIVITY ────────────────────────────────── */}
      {todayChartSubmission && (
        <Link
          href="/charts"
          className="block bg-neutral-900 hover:bg-neutral-800 transition-colors"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
            {/* Rank */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10">
              {todayChartSubmission.rank === 1 ? (
                <Trophy className="h-4 w-4 text-amber-400" />
              ) : (
                <span className={`text-base font-black tabular-nums ${todayChartSubmission.rank && todayChartSubmission.rank <= 3 ? "text-white" : "text-white/50"}`}>
                  {todayChartSubmission.rank ? `#${todayChartSubmission.rank}` : "—"}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-0.5">
                Live on today&apos;s chart
              </p>
              <p className="text-sm font-bold text-white truncate">
                {todayChartSubmission.title}
              </p>
            </div>
            {/* Stats */}
            <div className="flex-shrink-0 flex items-center gap-3 text-white/40">
              <span className="flex items-center gap-1 text-[11px] font-bold tabular-nums">
                <ChevronUp className="h-3 w-3" />
                {todayChartSubmission.voteCount}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold tabular-nums">
                <Play className="h-3 w-3" />
                {todayChartSubmission.playCount}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-white/20 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* ── TRACK OF THE DAY WINNER ─────────────────────────────── */}
      <DashboardWinner />

      {/* ── WEEKLY DISCOVER — immersive full-bleed section ────── */}
      {discoverTracks.length > 0 && (
        <Link href="/discover" className="block group">
          <div className="relative overflow-hidden bg-black">
            {/* Radial glow background */}
            <div className="absolute inset-0 opacity-60" style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,240,255,0.12) 0%, rgba(168,85,247,0.06) 40%, transparent 70%)",
            }} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
              <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">

                {/* Floating album artwork mosaic */}
                <div className="relative w-full sm:w-[340px] h-[200px] sm:h-[220px] flex-shrink-0">
                  {discoverTracks.slice(0, 6).map((dt, i) => {
                    const transforms = [
                      { x: 0, y: 10, rot: -6, scale: 1, z: 10 },
                      { x: 90, y: 0, rot: 3, scale: 1.08, z: 30 },
                      { x: 180, y: 15, rot: -4, scale: 0.95, z: 20 },
                      { x: 40, y: 90, rot: 5, scale: 0.9, z: 15 },
                      { x: 140, y: 85, rot: -3, scale: 1, z: 25 },
                      { x: 230, y: 70, rot: 2, scale: 0.85, z: 5 },
                    ];
                    const t = transforms[i];
                    const glowColors = ["#00f0ff", "#a855f7", "#ff2d9b", "#fbbf24", "#10b981", "#00f0ff"];
                    return dt.artworkUrl ? (
                      <div
                        key={dt.id}
                        className="absolute rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105"
                        style={{
                          left: t.x,
                          top: t.y,
                          width: 100 * t.scale,
                          height: 100 * t.scale,
                          transform: `rotate(${t.rot}deg)`,
                          zIndex: t.z,
                          boxShadow: `0 0 30px ${glowColors[i]}20, 0 8px 32px rgba(0,0,0,0.5)`,
                          border: `1px solid ${glowColors[i]}30`,
                        }}
                      >
                        <Image
                          src={dt.artworkUrl}
                          alt={dt.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    ) : null;
                  })}
                </div>

                {/* Text + CTA */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/60 mb-2">
                    Weekly Discover
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[0.95]">
                    Explore music in 3D.
                  </h2>
                  <p className="text-sm text-white/40 mt-3 font-medium leading-relaxed max-w-sm">
                    Float through a galaxy of independent tracks. Click any album to listen instantly.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white/80 text-sm font-bold group-hover:bg-white/[0.14] group-hover:border-white/[0.2] transition-all duration-200">
                    Enter the space
                    <ArrowRight className="h-4 w-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── YOUR QUEUE — compact strip ──────────────────────── */}
      <div className="bg-white border-b-2 border-black/8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Label + slot dots */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black/35">
                Queue
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: maxSlots }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < activeTracks.length ? "bg-purple-500" : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-black/40 tabular-nums">
                {activeTracks.length}/{maxSlots}
              </span>
            </div>

            {/* Active track thumbnails */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto min-w-0">
              {activeTracks.map((track) => {
                const completedReviews = track.Review.filter(
                  (r) => r.status === "COMPLETED"
                ).length;
                return (
                  <Link
                    key={track.id}
                    href={`/tracks/${track.id}`}
                    className="flex items-center gap-2.5 flex-shrink-0 group/track"
                  >
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-black/10 flex-shrink-0">
                      {track.artworkUrl ? (
                        <Image
                          src={track.artworkUrl}
                          alt={track.title}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                          <Music className="h-3.5 w-3.5 text-black/20" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-black truncate max-w-[100px] group-hover/track:text-purple-600 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[10px] text-black/35 font-medium">
                        {completedReviews}/{track.reviewsRequested} reviews
                      </p>
                    </div>
                  </Link>
                );
              })}
              {activeTracks.length === 0 && (
                <p className="text-xs text-black/30 font-medium">No active tracks</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {activeTracks.length < maxSlots && (
                <Link
                  href="/submit"
                  className="text-[11px] font-black text-purple-600 hover:text-purple-800 transition-colors whitespace-nowrap"
                >
                  + Add
                </Link>
              )}
              <Link
                href="/tracks"
                className="text-[11px] font-black uppercase tracking-wider text-black/25 hover:text-black transition-colors whitespace-nowrap"
              >
                Manage →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* First-time user CTA */}
      {tracks.length === 0 && credits >= 2 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <div className="border-2 border-lime-500 bg-lime-50 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-black">
                You&apos;ve got {credits} credits.
              </p>
              <p className="text-sm text-black/50 mt-0.5">
                Drop your first track and get real ears on it.
              </p>
            </div>
            <Link href="/submit" className="flex-shrink-0">
              <Button className="w-full sm:w-auto bg-lime-500 hover:bg-lime-600 text-white font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm h-10 px-5 rounded-xl">
                Submit track <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── REVIEW & EARN — full-bleed dark section ─────────── */}
      <div className="bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                Review & Earn
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 leading-none">
                {availableQueueTracks.length > 0
                  ? `${availableQueueTracks.length} track${availableQueueTracks.length === 1 ? "" : "s"} need ears`
                  : "Nothing in queue"}
              </h2>
              <p className="text-sm text-white/40 mt-1.5 font-medium">
                Listen. Leave feedback. Get +1 credit.
              </p>
            </div>
            <Link
              href="/review"
              className="text-[11px] font-black uppercase tracking-wider text-white/30 hover:text-white transition-colors flex-shrink-0"
            >
              View all →
            </Link>
          </div>

          {availableQueueTracks.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
            <div className="border border-white/10 rounded-2xl py-12 text-center">
              <Headphones className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-base font-bold text-white/40">
                No tracks to review right now.
              </p>
              <p className="text-sm text-white/25 mt-1">
                Check back soon — the queue refreshes often.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── YOUR NEXT MOVE — color-blocked CTA strip ────────── */}
      {whatsNext && (
        <div
          className={
            whatsNext.priority === "high"
              ? "bg-lime-400 border-t-2 border-black"
              : whatsNext.priority === "medium"
              ? "bg-amber-400 border-t-2 border-black"
              : "bg-purple-600 border-t-2 border-purple-700"
          }
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 ${
                    isHighOrMedium ? "text-black/40" : "text-white/40"
                  }`}
                >
                  Your next move
                </p>
                <h2
                  className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${
                    isHighOrMedium ? "text-black" : "text-white"
                  }`}
                >
                  {whatsNext.title}
                </h2>
                <p
                  className={`text-sm mt-1.5 font-medium ${
                    isHighOrMedium ? "text-black/60" : "text-white/60"
                  }`}
                >
                  {whatsNext.description}
                </p>
              </div>
              <Link href={whatsNext.action.href} className="flex-shrink-0">
                <Button
                  className={`w-full sm:w-auto font-black border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 h-12 px-6 text-base rounded-xl ${
                    isHighOrMedium
                      ? "bg-black text-white hover:bg-neutral-900"
                      : "bg-white text-purple-700 hover:bg-neutral-50 border-white"
                  }`}
                >
                  {whatsNext.action.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <MobileStickyCTA show={tracks.length === 0 || credits > 0} />
    </div>
  );
}
