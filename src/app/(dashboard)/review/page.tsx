import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Music, ArrowRight, Star, Gem, MessageSquare, Tag, DollarSign, TrendingUp } from "lucide-react";
import { isPeerReviewerPro, PRO_TIER_MIN_REVIEWS, PRO_TIER_MIN_RATING, TIER_RATES } from "@/lib/queue";
import { GenreTagList } from "@/components/ui/genre-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { ClaimButton } from "./claim-button";

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

  const isPro = artistProfile.subscriptionStatus === "active";
  const MAX_REVIEWS_PER_DAY = 5;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Run independent queries in parallel for speed
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

  const reviewsRemaining = isPro ? null : Math.max(0, MAX_REVIEWS_PER_DAY - reviewsTodayCount);
  const claimedTrackIds = claimedReviews.map((r) => r.Track.id);
  const excludeTrackIds = [
    ...claimedTrackIds,
    ...pastReviewTrackIds.map((r) => r.trackId),
  ];

  // Available tracks: PEER package, QUEUED/IN_PROGRESS, not own tracks,
  // not already reviewed, still need more reviews
  const availableTracksResult = await prisma.track.findMany({
    where: {
      packageType: "PEER",
      status: { in: ["QUEUED", "IN_PROGRESS"] },
      artistId: { not: artistProfile.id },
      id: { notIn: excludeTrackIds },
    },
    include: {
      Genre: true,
      ArtistProfile: {
        select: {
          artistName: true,
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

  // Filter to only tracks that still need more reviewers
  // Sort: real user tracks first, seeded tracks last
  const available = availableTracksResult
    .filter((t) => t._count.Review < t.reviewsRequested)
    .sort((a, b) => {
      const aIsSeed = a.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      const bIsSeed = b.ArtistProfile?.User?.email?.endsWith("@seed.mixreflect.com") ?? false;
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return 0; // preserve createdAt order within each group
    });

  const totalQueue = claimedReviews.length + available.length;

  const avgRating = artistProfile.peerReviewRating
    ? (artistProfile.peerReviewRating as number).toFixed(1)
    : "—";

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notices */}
        {notice === "skipped" && (
          <div className="mb-6 rounded-2xl border border-lime-200 bg-lime-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-black">Track skipped.</p>
            <p className="text-sm text-neutral-600 mt-1">It&apos;s been removed from your queue.</p>
            <Link href="/review" className="text-sm font-semibold text-lime-700 hover:text-lime-800 mt-2 inline-block transition-colors">
              Dismiss
            </Link>
          </div>
        )}

        {notice === "expired" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-black">Review expired.</p>
            <p className="text-sm text-neutral-600 mt-1">This review timed out.</p>
            <Link href="/review" className="text-sm font-semibold text-red-600 hover:text-red-700 mt-2 inline-block transition-colors">
              Dismiss
            </Link>
          </div>
        )}

        {notice === "unplayable" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-black">Audio issue reported.</p>
            <p className="text-sm text-neutral-600 mt-1">It&apos;s been removed from your queue.</p>
            <Link href="/review" className="text-sm font-semibold text-red-600 hover:text-red-700 mt-2 inline-block transition-colors">
              Dismiss
            </Link>
          </div>
        )}
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-neutral-200">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">Review</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black mt-2">
            Review Queue
          </h1>
          <div className="flex items-center gap-3 text-sm text-neutral-600 mt-3 flex-wrap">
            <span>
              {totalQueue} track{totalQueue !== 1 ? "s" : ""} available
            </span>
            <span className="text-neutral-300">•</span>
            <span>Earn 1 credit per review</span>
            <span className="text-neutral-300">•</span>
            {isPro ? (
              <span className="text-lime-600 font-semibold">Unlimited reviews (Pro)</span>
            ) : (
              <span>{reviewsRemaining} of {MAX_REVIEWS_PER_DAY} reviews left today</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Already claimed / in-progress */}
            {claimedReviews.length > 0 && (
              <div className="border border-black/8 rounded-xl bg-white/60 p-5">
                <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase mb-4">
                  Continue Reviewing
                </p>
                <div className="space-y-3">
                  {claimedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-stretch gap-0 rounded-xl border border-black/8 bg-white overflow-hidden transition-colors duration-150 ease-out hover:bg-white/80 hover:border-black/12"
                    >
                      <div className="w-[100px] flex-shrink-0 self-stretch relative bg-neutral-100">
                        {review.Track.artworkUrl ? (
                          <Image src={review.Track.artworkUrl} alt={review.Track.title} fill className="object-cover" sizes="100px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-5 w-5 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4 flex-1 min-w-0 px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-black truncate">{review.Track.title}</p>
                          <p className="text-sm text-neutral-600 mb-1">by {review.Track.ArtistProfile.artistName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <GenreTagList genres={review.Track.Genre} variant="neutral" size="sm" maxDisplay={2} />
                            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded-full bg-lime-100 text-lime-700 border border-lime-200">
                              {review.status === "IN_PROGRESS" ? "In progress" : "Claimed"}
                            </span>
                          </div>
                        </div>
                        <Link href={`/reviewer/review/${review.id}`} className="flex-shrink-0">
                          <Button size="sm" variant="primary">
                            Continue
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available tracks to claim */}
            <div className="border border-black/8 rounded-xl bg-white/60 p-5">
              <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase mb-4">
                Available Tracks
              </p>

              {available.length === 0 ? (
                <EmptyState
                  doodle="music"
                  title="No tracks to review"
                  description="No tracks available right now. Check back soon!"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {available.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-stretch gap-0 rounded-xl border border-black/8 bg-white overflow-hidden transition-colors duration-150 ease-out hover:bg-white/80 hover:border-black/12 min-h-[100px]"
                    >
                      <div className="w-[100px] flex-shrink-0 self-stretch relative bg-neutral-100">
                        {track.artworkUrl ? (
                          <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="100px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-5 w-5 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4 flex-1 min-w-0 px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-black truncate">{track.title}</p>
                          <p className="text-sm text-neutral-600 mb-1">by {track.ArtistProfile.artistName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <GenreTagList genres={track.Genre} variant="neutral" size="sm" maxDisplay={2} />
                          </div>
                        </div>
                        <ClaimButton trackId={track.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="border border-black/8 rounded-xl bg-white/60 p-4">
              <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase mb-3">
                Your Stats
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-lime-100 flex items-center justify-center">
                      <MessageSquare className="h-3.5 w-3.5 text-lime-600" />
                    </div>
                    <span className="text-xs text-black/50">Credits</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{artistProfile.reviewCredits ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-neutral-100 flex items-center justify-center">
                      <Music className="h-3.5 w-3.5 text-neutral-600" />
                    </div>
                    <span className="text-xs text-black/50">Reviews</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{artistProfile.totalPeerReviews ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-amber-100 flex items-center justify-center">
                      <Star className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <span className="text-xs text-black/50">Avg rating</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{avgRating}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-lime-100 flex items-center justify-center">
                      <Gem className="h-3.5 w-3.5 text-lime-600" />
                    </div>
                    <span className="text-xs text-black/50">Gems</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{artistProfile.peerGemCount ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Earnings Info */}
            {(() => {
              const totalReviews = artistProfile.totalPeerReviews ?? 0;
              const rating = artistProfile.peerReviewRating ?? 0;
              const isProTier = isPeerReviewerPro(totalReviews, rating);
              const reviewsNeeded = Math.max(0, PRO_TIER_MIN_REVIEWS - totalReviews);
              const ratingMet = rating >= PRO_TIER_MIN_RATING;
              const reviewProgress = Math.min(100, Math.round((totalReviews / PRO_TIER_MIN_REVIEWS) * 100));

              return (
                <div className="border border-black/8 rounded-xl bg-white/60 p-4">
                  <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase mb-3">
                    Earnings
                  </p>
                  {isProTier ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-purple-100 flex items-center justify-center">
                          <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-purple-600">PRO Reviewer</span>
                          <p className="text-xs text-black/50">${(TIER_RATES.PRO / 100).toFixed(2)} per review</p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        You earn 1 credit <span className="font-semibold">+ ${(TIER_RATES.PRO / 100).toFixed(2)} cash</span> per review
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-neutral-100 flex items-center justify-center">
                          <TrendingUp className="h-3.5 w-3.5 text-neutral-500" />
                        </div>
                        <div>
                          <span className="text-sm font-bold">1 credit per review</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 space-y-2">
                        <p className="text-xs font-bold text-purple-700">Unlock PRO Reviewer</p>
                        <p className="text-xs text-purple-600/80">
                          Complete {PRO_TIER_MIN_REVIEWS} reviews with a {PRO_TIER_MIN_RATING}+ avg rating to earn <span className="font-bold">${(TIER_RATES.PRO / 100).toFixed(2)} cash</span> per review
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-purple-600/70">
                            <span>Reviews: {totalReviews}/{PRO_TIER_MIN_REVIEWS}</span>
                            <span>{reviewProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                              style={{ width: `${reviewProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-purple-600/70">
                            <span>Avg rating: {rating > 0 ? rating.toFixed(1) : "—"}/{PRO_TIER_MIN_RATING}</span>
                            <span>{ratingMet ? "✓" : `${reviewsNeeded > 0 ? "" : "Needs improvement"}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Review Genres */}
            {artistProfile.Genre_ArtistReviewGenres && artistProfile.Genre_ArtistReviewGenres.length > 0 && (
              <div className="border border-black/8 rounded-xl bg-white/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-3.5 w-3.5 text-black/40" />
                  <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase">
                    Your Review Genres
                  </p>
                </div>
                <GenreTagList
                  genres={artistProfile.Genre_ArtistReviewGenres}
                  variant="neutral"
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
