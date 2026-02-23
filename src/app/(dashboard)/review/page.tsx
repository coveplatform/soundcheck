import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Music, ArrowRight, Star, TrendingUp, DollarSign } from "lucide-react";
import { isPeerReviewerPro, PRO_TIER_MIN_REVIEWS, PRO_TIER_MIN_RATING, TIER_RATES } from "@/lib/queue";
import { GenreTagList } from "@/components/ui/genre-tag";
import { ClaimButton } from "./claim-button";
import {
  SparklesDoodle,
  SquiggleDoodle,
} from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

interface ClaimedReview {
  id: string;
  status: string;
  Track: {
    id: string;
    title: string;
    artworkUrl: string | null;
    feedbackFocus: string | null;
    Genre: Array<{ id: string; name: string }>;
    ArtistProfile: { artistName: string };
  };
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const notice = resolvedParams.notice;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      reviewCredits: true,
      totalPeerReviews: true,
      peerReviewRating: true,
      peerGemCount: true,
      subscriptionStatus: true,
      Genre_ArtistReviewGenres: {
        select: { id: true, name: true },
      },
    },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const BYPASS_LIMIT_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
  const bypassLimit = BYPASS_LIMIT_EMAILS.includes((session.user.email ?? "").toLowerCase());

  const MAX_REVIEWS_PER_DAY = 2;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [reviewsTodayCount, claimedReviews, pastReviewTrackIds] = await Promise.all([
    prisma.review.count({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: "COMPLETED",
        updatedAt: { gte: startOfToday },
      },
    }),
    prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        Track: { status: { not: "COMPLETED" } },
      },
      select: {
        id: true,
        status: true,
        Track: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            feedbackFocus: true,
            Genre: true,
            ArtistProfile: { select: { artistName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }) as Promise<ClaimedReview[]>,
    prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["COMPLETED", "SKIPPED", "EXPIRED"] },
      },
      select: { trackId: true },
    }),
  ]);

  const reviewsRemaining = bypassLimit ? null : Math.max(0, MAX_REVIEWS_PER_DAY - reviewsTodayCount);
  const claimedTrackIds = claimedReviews.map((r) => r.Track.id);
  const excludeTrackIds = [
    ...claimedTrackIds,
    ...pastReviewTrackIds.map((r) => r.trackId),
  ];

  const availableTracksResult = await prisma.track.findMany({
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
      feedbackFocus: true,
      packageType: true,
      reviewsRequested: true,
      createdAt: true,
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
  });

  const available = availableTracksResult
    .filter((t) => t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      const aIsPro = a.ArtistProfile?.subscriptionStatus === "active";
      const bIsPro = b.ArtistProfile?.subscriptionStatus === "active";
      if (aIsPro !== bIsPro) return aIsPro ? -1 : 1;
      const aIsSeed = a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed = b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0;
    });

  const totalQueue = claimedReviews.length + available.length;
  const avgRating = artistProfile.peerReviewRating
    ? (artistProfile.peerReviewRating as number).toFixed(1)
    : "—";

  const totalReviews = artistProfile.totalPeerReviews ?? 0;
  const rating = artistProfile.peerReviewRating ?? 0;
  const isProTier = isPeerReviewerPro(totalReviews, rating);
  const reviewProgress = Math.min(100, Math.round((totalReviews / PRO_TIER_MIN_REVIEWS) * 100));
  const ratingMet = rating >= PRO_TIER_MIN_RATING;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <SparklesDoodle className="absolute top-3 right-[32%] w-8 h-8 text-purple-500/20 pointer-events-none" />
          <SquiggleDoodle className="absolute -bottom-5 right-10 w-20 h-20 text-purple-400/15 pointer-events-none -rotate-12" />

          <div className="flex items-start justify-between gap-6 relative">
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Review Queue.
              </h1>
              <p className="text-sm text-black/40 font-medium mt-2 max-w-xs">
                Listen for 3 min. Leave honest feedback. Earn +1 credit.
              </p>
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">
                {totalQueue}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                {totalQueue === 1 ? "track" : "tracks"} available
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-6 pt-5 border-t-2 border-black/8 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-black tabular-nums">{artistProfile.reviewCredits ?? 0}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-black/35">credits</span>
            </div>
            <span className="text-black/15 font-black">·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-black tabular-nums">{totalReviews}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-black/35">reviews done</span>
            </div>
            <span className="text-black/15 font-black">·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-black tabular-nums">{avgRating}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-black/35">avg rating</span>
            </div>
            {!bypassLimit && (
              <>
                <span className="text-black/15 font-black">·</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-black tabular-nums ${reviewsRemaining === 0 ? "text-red-500" : "text-black"}`}>
                    {reviewsRemaining}/{MAX_REVIEWS_PER_DAY}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/35">left today</span>
                </div>
              </>
            )}
            <Link
              href="/review/history"
              className="ml-auto text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors"
            >
              History →
            </Link>
          </div>
        </div>
      </div>

      {/* ── NOTICE STRIPS ──────────────────────────────────────── */}
      {notice === "skipped" && (
        <div className="bg-lime-400 border-b border-lime-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-black">Track skipped — removed from your queue.</p>
            <Link href="/review" className="text-[11px] font-black text-black border-2 border-black px-3 py-1 rounded-full hover:bg-black hover:text-lime-400 transition-colors whitespace-nowrap">
              Dismiss
            </Link>
          </div>
        </div>
      )}
      {notice === "expired" && (
        <div className="bg-red-500 border-b border-red-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Review expired.</p>
            <Link href="/review" className="text-[11px] font-black text-white border-2 border-white px-3 py-1 rounded-full hover:bg-white hover:text-red-500 transition-colors whitespace-nowrap">
              Dismiss
            </Link>
          </div>
        </div>
      )}
      {notice === "unplayable" && (
        <div className="bg-red-500 border-b border-red-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Audio issue reported — removed from your queue.</p>
            <Link href="/review" className="text-[11px] font-black text-white border-2 border-white px-3 py-1 rounded-full hover:bg-white hover:text-red-500 transition-colors whitespace-nowrap">
              Dismiss
            </Link>
          </div>
        </div>
      )}

      {/* ── CONTINUE REVIEWING — dark section ──────────────────── */}
      {claimedReviews.length > 0 && (
        <div className="bg-neutral-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">
              In Progress
            </p>
            <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-5">
              Continue reviewing
            </h2>
            <div className="space-y-3">
              {claimedReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-stretch rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="w-20 h-20 flex-shrink-0 relative">
                    {review.Track.artworkUrl ? (
                      <Image
                        src={review.Track.artworkUrl}
                        alt={review.Track.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Music className="h-5 w-5 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 flex-1 min-w-0 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-white truncate">{review.Track.title}</p>
                      <p className="text-sm text-white/40 truncate">by {review.Track.ArtistProfile.artistName}</p>
                    </div>
                    <Link href={`/review/${review.id}`} className="flex-shrink-0">
                      <Button className="bg-lime-400 hover:bg-lime-300 text-black font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm h-9 px-4 rounded-xl">
                        Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AVAILABLE TRACKS ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Available</p>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5 leading-none">
              {available.length > 0
                ? `${available.length} track${available.length === 1 ? "" : "s"} to review`
                : "Nothing right now"}
            </h2>
          </div>
        </div>

        {available.length === 0 ? (
          reviewsRemaining === 0 ? (
            <div className="border-2 border-amber-400 bg-amber-50 rounded-2xl px-6 py-8 text-center">
              <p className="text-xl font-black text-black">Daily limit hit</p>
              <p className="text-sm text-black/50 mt-1.5">
                You can review up to {MAX_REVIEWS_PER_DAY} tracks per day. Come back tomorrow!
              </p>
            </div>
          ) : (
            <div className="border-2 border-black/8 rounded-2xl px-6 py-12 text-center bg-white/40">
              <Music className="h-10 w-10 text-black/15 mx-auto mb-3" />
              <p className="text-base font-bold text-black/40">No tracks to review right now.</p>
              <p className="text-sm text-black/25 mt-1">Check back soon — the queue refreshes often.</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {available.map((track) => (
              <div
                key={track.id}
                className="flex items-stretch rounded-2xl border-2 border-black/8 bg-white overflow-hidden hover:border-black/15 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
              >
                <div className="w-20 sm:w-24 flex-shrink-0 relative">
                  {track.artworkUrl ? (
                    <Image
                      src={track.artworkUrl}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                      <Music className="h-5 w-5 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 flex-1 min-w-0 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-black truncate">{track.title}</p>
                    <p className="text-sm text-black/40 truncate mb-1.5">by {track.ArtistProfile.artistName}</p>
                    <GenreTagList genres={track.Genre} variant="neutral" size="sm" maxDisplay={2} />
                  </div>
                  <ClaimButton trackId={track.id} reviewsRemaining={reviewsRemaining} isPro={bypassLimit} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PRO REVIEWER PROGRESS — color-blocked strip ─────────── */}
      {!isProTier && (
        <div className="bg-purple-600 border-t-2 border-purple-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1.5">
                  Level up
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Unlock PRO Reviewer
                </h2>
                <p className="text-sm text-white/60 mt-1.5 font-medium">
                  Complete {PRO_TIER_MIN_REVIEWS} reviews with a {PRO_TIER_MIN_RATING}+ avg rating to earn{" "}
                  <span className="text-white font-black">${(TIER_RATES.PRO / 100).toFixed(2)} cash</span> per review.
                </p>
                {/* Progress bars */}
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5">
                      <span>Reviews: {totalReviews}/{PRO_TIER_MIN_REVIEWS}</span>
                      <span>{reviewProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${reviewProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-white">Avg rating: {rating > 0 ? rating.toFixed(1) : "—"}/{PRO_TIER_MIN_RATING}</span>
                    </div>
                    {ratingMet ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-lime-400">Rating met ✓</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Keep improving</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="h-16 w-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white/60" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/30">
                  ${(TIER_RATES.PRO / 100).toFixed(2)}/review
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRO tier confirmed strip */}
      {isProTier && (
        <div className="bg-lime-400 border-t-2 border-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-6 w-6 text-lime-400" />
            </div>
            <div>
              <p className="text-base font-black text-black">PRO Reviewer</p>
              <p className="text-sm text-black/60 font-medium">You earn 1 credit + <span className="font-black text-black">${(TIER_RATES.PRO / 100).toFixed(2)} cash</span> per review.</p>
            </div>
            <div className="ml-auto">
              <Star className="h-5 w-5 text-black/30" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
