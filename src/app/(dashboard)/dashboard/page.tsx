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
  Lock,
  Crown,
  Plus,
} from "lucide-react";
import { ClaimCard } from "@/components/dashboard/claim-card";
import { MobileStickyCTA } from "@/components/dashboard/mobile-sticky-cta";
import {
  SparklesDoodle,
  SquiggleDoodle,
  StarDoodle,
  DotsDoodle,
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

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── YOUR QUEUE ─────────────────────────────────────── */}
        <section className="pt-10 pb-10 relative">
          <DotsDoodle className="absolute top-8 right-0 w-14 h-14 text-purple-400/15 pointer-events-none" />
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">
                Your Queue
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5 leading-none">
                {activeTracks.length === 0
                  ? "No tracks queued"
                  : `${activeTracks.length} of ${maxSlots} slot${maxSlots === 1 ? "" : "s"} active`}
              </h2>
            </div>
            <Link
              href="/tracks"
              className="text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors"
            >
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }, (_, slotIndex) => {
              const track = activeTracks[slotIndex];
              const isLocked = !isPro && slotIndex >= maxSlots;

              if (track) {
                const completedReviews = track.Review.filter(
                  (r) => r.status === "COMPLETED"
                ).length;
                const hasReviews = track.reviewsRequested > 0;
                const reviewProgress = hasReviews
                  ? completedReviews / track.reviewsRequested
                  : 0;
                const isDone = reviewProgress >= 1;

                return (
                  <Link
                    key={track.id}
                    href={`/tracks/${track.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-black/8 group-hover:border-black/20 transition-all duration-150 shadow-sm">
                      {track.artworkUrl ? (
                        <Image
                          src={track.artworkUrl}
                          alt={track.title}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
                          sizes="(max-width: 640px) 33vw, 220px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                          <Music className="h-8 w-8 text-black/20" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm ${
                            track.status === "QUEUED"
                              ? "bg-purple-600 text-white"
                              : track.status === "IN_PROGRESS"
                              ? "bg-lime-400 text-black"
                              : "bg-white/90 text-black"
                          }`}
                        >
                          {track.status === "QUEUED"
                            ? "Queued"
                            : track.status === "IN_PROGRESS"
                            ? "Reviewing"
                            : track.status}
                        </span>
                      </div>
                      {hasReviews && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-4 pb-2">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-xs font-black text-white leading-none">
                              {completedReviews}/{track.reviewsRequested}
                            </span>
                            <span className="text-[9px] text-white/50">
                              reviews
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDone ? "bg-lime-400" : "bg-white"
                              }`}
                              style={{ width: `${reviewProgress * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-black text-black mt-2 truncate leading-tight">
                      {track.title}
                    </p>
                  </Link>
                );
              }

              if (isLocked) {
                return (
                  <Link
                    key={`locked-${slotIndex}`}
                    href="/pro"
                    className="group block"
                  >
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-black/10 bg-white/60 flex flex-col items-center justify-center gap-2 hover:border-purple-300 hover:bg-purple-50/40 transition-all duration-150">
                      <Lock className="h-5 w-5 text-black/15 group-hover:text-purple-400 transition-colors" />
                      <Crown className="h-4 w-4 text-purple-300/60 group-hover:text-purple-400 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-black/20 group-hover:text-purple-500 transition-colors">
                        Pro only
                      </span>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={`empty-${slotIndex}`}
                  href="/submit"
                  className="group block"
                >
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-black/10 bg-white/40 hover:border-purple-400 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-2 transition-all duration-150">
                    <div className="h-10 w-10 rounded-full bg-black/[0.04] group-hover:bg-purple-100 flex items-center justify-center transition-colors border-2 border-black/[0.06] group-hover:border-purple-200">
                      <Plus className="h-5 w-5 text-black/20 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/20 group-hover:text-purple-600 transition-colors">
                      Add track
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-center text-black/20 mt-2">
                    Open slot
                  </p>
                </Link>
              );
            })}
          </div>

          {/* First-time user CTA */}
          {tracks.length === 0 && credits >= 2 && (
            <div className="mt-5 border-2 border-lime-500 bg-lime-50 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
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
          )}
        </section>
      </div>

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
