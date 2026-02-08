import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, ArrowRight, Star, Gem, MessageSquare, Tag } from "lucide-react";
import { GenreTagList } from "@/components/ui/genre-tag";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

interface ReviewWithTrack {
  id: string;
  status: string;
  createdAt: Date;
  track: {
    title: string;
    feedbackFocus: string | null;
    genres: Array<{ id: string; name: string }>;
    artist: {
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, email: true },
  });

  if (!user?.emailVerified) {
    const email = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    redirect(`/verify-email${email}`);
  }

  const artistProfile = await (prisma.artistProfile as any).findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      reviewCredits: true,
      totalPeerReviews: true,
      peerReviewRating: true,
      peerGemCount: true,
      reviewGenres: {
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
        track: {
          status: { not: "COMPLETED" },
        },
      },
      include: {
        track: {
          include: {
            genres: true,
            artist: {
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
    : "--";

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 pb-20">
      {/* Notices */}
      {notice === "skipped" && (
        <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm font-medium text-black">Track skipped.</p>
          <p className="text-sm text-black/50 mt-1">We removed it from your queue and reassigned it.</p>
          <Link href="/review" className="text-sm font-medium text-purple-600 hover:text-purple-800 mt-2 inline-block">
            Dismiss
          </Link>
        </div>
      )}

      {notice === "expired" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-black">Review expired.</p>
          <p className="text-sm text-black/50 mt-1">This review timed out and was reassigned.</p>
          <Link href="/review" className="text-sm font-medium text-red-600 hover:text-red-800 mt-2 inline-block">
            Dismiss
          </Link>
        </div>
      )}

      {notice === "unplayable" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-black">Audio issue reported.</p>
          <p className="text-sm text-black/50 mt-1">We removed it from your queue and reassigned it.</p>
          <Link href="/review" className="text-sm font-medium text-red-600 hover:text-red-800 mt-2 inline-block">
            Dismiss
          </Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Review Queue</h1>
          <p className="mt-2 text-sm text-black/40">
            {pendingReviews.length} track{pendingReviews.length !== 1 ? "s" : ""} waiting for your feedback
            {" "}&mdash; earn 1 credit per review
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">tracks to review</p>

                {pendingReviews.length === 0 ? (
                  <EmptyState
                    doodle="music"
                    title="No tracks to review"
                    description="No tracks in your genre right now. Check back soon!"
                    className="py-12"
                  />
                ) : (
                  <div className="space-y-3">
                    {pendingReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Music className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-black truncate">{review.track.title}</p>
                            <p className="text-xs text-black/40 mb-1">by {review.track.artist.artistName}</p>
                            <div className="flex items-center gap-2">
                              <GenreTagList
                                genres={review.track.genres}
                                variant="artist"
                                size="sm"
                                maxDisplay={2}
                              />
                              {review.status === "IN_PROGRESS" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                  In progress
                                </span>
                              )}
                            </div>
                            {review.track.feedbackFocus && (
                              <p className="text-xs text-purple-600 mt-1">
                                Focus: {review.track.feedbackFocus}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link href={`/review/${review.id}`} className="flex-shrink-0">
                          <Button variant="primary" className="h-9 px-4">
                            Review
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">your stats</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-black/60">Credits earned</span>
                    </div>
                    <span className="text-lg font-semibold tabular-nums">{artistProfile.reviewCredits ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Music className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-black/60">Reviews given</span>
                    </div>
                    <span className="text-lg font-semibold tabular-nums">{artistProfile.totalPeerReviews ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Star className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-black/60">Avg rating</span>
                    </div>
                    <span className="text-lg font-semibold tabular-nums">{avgRating}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Gem className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-black/60">Gems received</span>
                    </div>
                    <span className="text-lg font-semibold tabular-nums">{artistProfile.peerGemCount ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Genres */}
            {artistProfile.reviewGenres && artistProfile.reviewGenres.length > 0 && (
              <Card variant="soft" elevated>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-3.5 w-3.5 text-black/40" />
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase">your review genres</p>
                  </div>
                  <GenreTagList
                    genres={artistProfile.reviewGenres}
                    variant="artist"
                    size="sm"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
