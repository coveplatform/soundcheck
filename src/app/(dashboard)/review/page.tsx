import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Music, ArrowRight, Star, Gem, MessageSquare, Tag } from "lucide-react";
import { GenreTagList } from "@/components/ui/genre-tag";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

interface ReviewWithTrack {
  id: string;
  status: string;
  createdAt: Date;
  Track: {
    title: string;
    feedbackFocus: string | null;
    Genre: Array<{ id: string; name: string }>;
    ArtistProfile: {
      artistName: string;
    };
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
      Genre_ArtistReviewGenres: {
        select: { id: true, name: true },
      },
    },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  // Fetch pending peer reviews - wrap in try/catch since peerReviewerArtistId
  // may not exist on the Review model yet during migration
  let pendingReviews: ReviewWithTrack[] = [];
  try {
    pendingReviews = await prisma.review.findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        Track: {
          status: { not: "COMPLETED" },
        },
      },
      include: {
        Track: {
          include: {
            Genre: true,
            ArtistProfile: {
              select: { artistName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }) as unknown as ReviewWithTrack[];
  } catch {
    // peerReviewerArtistId may not exist yet during migration - fall back to empty
    pendingReviews = [];
  }

  const avgRating = artistProfile.peerReviewRating
    ? (artistProfile.peerReviewRating as number).toFixed(1)
    : "—";

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notices */}
        {notice === "skipped" && (
          <div className="mb-6 rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-black">Track skipped.</p>
            <p className="text-sm text-neutral-600 mt-1">We removed it from your queue and reassigned it.</p>
            <Link href="/review" className="text-sm font-semibold text-purple-600 hover:text-purple-700 mt-2 inline-block transition-colors">
              Dismiss
            </Link>
          </div>
        )}

        {notice === "expired" && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-black">Review expired.</p>
            <p className="text-sm text-neutral-600 mt-1">This review timed out and was reassigned.</p>
            <Link href="/review" className="text-sm font-semibold text-red-600 hover:text-red-700 mt-2 inline-block transition-colors">
              Dismiss
            </Link>
          </div>
        )}

        {notice === "unplayable" && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-black">Audio issue reported.</p>
            <p className="text-sm text-neutral-600 mt-1">We removed it from your queue and reassigned it.</p>
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
          <div className="flex items-center gap-3 text-sm text-neutral-600 mt-3">
            <span>
              {pendingReviews.length} track{pendingReviews.length !== 1 ? "s" : ""} waiting
            </span>
            <span className="text-neutral-300">•</span>
            <span>Earn 1 credit per review</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main Content */}
          <div>
            <div className="border border-black/8 rounded-xl bg-white/60 p-5">
              <p className="text-[11px] font-mono tracking-[0.2em] text-black/40 uppercase mb-4">
                Tracks to Review
              </p>

              {pendingReviews.length === 0 ? (
                <EmptyState
                  doodle="music"
                  title="No tracks to review"
                  description="No tracks in your genre right now. Check back soon!"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {pendingReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-black/8 bg-white px-4 py-3.5 transition-colors duration-150 ease-out hover:bg-white/80 hover:border-black/12"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Music className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-black truncate">{review.Track.title}</p>
                          <p className="text-sm text-neutral-600 mb-1">by {review.Track.ArtistProfile.artistName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <GenreTagList
                              genres={review.Track.Genre}
                              variant="neutral"
                              size="sm"
                              maxDisplay={2}
                            />
                            {review.status === "IN_PROGRESS" && (
                              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                In progress
                              </span>
                            )}
                          </div>
                          {review.Track.feedbackFocus && (
                            <p className="text-xs text-purple-600 font-medium mt-1">
                              Focus: {review.Track.feedbackFocus}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/review/${review.id}`} className="flex-shrink-0">
                        <Button
                          size="sm"
                          className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-semibold transition-colors duration-150 ease-out"
                        >
                          Review
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
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
                    <div className="h-7 w-7 rounded-md bg-purple-100 flex items-center justify-center">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <span className="text-xs text-black/50">Credits</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{artistProfile.reviewCredits ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                      <Music className="h-3.5 w-3.5 text-emerald-600" />
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

            {/* Review Genres */}
            {artistProfile.Genre_ArtistReviewGenres && artistProfile.Genre_ArtistReviewGenres.length > 0 && (
              <div className="border border-black/8 rounded-xl bg-white/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-3.5 w-3.5 text-purple-600" />
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
