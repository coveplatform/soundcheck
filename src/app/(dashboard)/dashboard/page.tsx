import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenreTagList } from "@/components/ui/genre-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { TrackPlayButton } from "@/components/dashboard/track-play-button";
import {
  Music,
  Coins,
  Headphones,
  Star,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch artist profile with peer review fields - use `as any` since new
  // columns may not be reflected in the generated Prisma client yet.
  let artistProfile: any = null;
  try {
    artistProfile = await (prisma.artistProfile as any).findUnique({
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
        reviewGenres: true,
        tracks: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            sourceUrl: true,
            status: true,
            reviewsRequested: true,
            reviewsCompleted: true,
            reviews: {
              select: { status: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });
  } catch {
    // Fallback if new fields don't exist yet - fetch without them
    artistProfile = await (prisma.artistProfile as any).findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistName: true,
        subscriptionStatus: true,
        tracks: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
            sourceUrl: true,
            status: true,
            reviewsRequested: true,
            reviewsCompleted: true,
            reviews: {
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

  // Safe defaults for peer review fields that may not exist yet
  const credits: number = artistProfile.reviewCredits ?? 0;
  const totalPeerReviews: number = artistProfile.totalPeerReviews ?? 0;
  const peerReviewRating: number = artistProfile.peerReviewRating ?? 0;
  const hasSeenCreditGuide: boolean = artistProfile.hasSeenCreditGuide ?? false;
  const isSubscribed = artistProfile.subscriptionStatus === "active";
  const tracks: any[] = artistProfile.tracks ?? [];
  const totalTracks = tracks.length;

  // Fetch pending peer reviews assigned to this artist
  let pendingPeerReviews: any[] = [];
  try {
    pendingPeerReviews = await (prisma.review as any).findMany({
      where: {
        peerReviewerArtistId: artistProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        track: {
          status: { not: "COMPLETED" },
        },
      },
      select: {
        id: true,
        track: {
          select: {
            title: true,
            genres: true,
            artist: {
              select: { artistName: true },
            },
          },
        },
      },
      take: 3,
      orderBy: { createdAt: "asc" },
    });
  } catch {
    // peerReviewerArtistId field may not exist yet
    pendingPeerReviews = [];
  }

  // Build status badge for tracks
  function getTrackStatusBadge(track: any) {
    const status = track.status as string;
    if (status === "COMPLETED") {
      return { label: "Completed", className: "bg-emerald-100 text-emerald-700" };
    }
    if (status === "IN_PROGRESS" || status === "QUEUED") {
      return { label: "In Review", className: "bg-purple-100 text-purple-700" };
    }
    if (status === "UPLOADED") {
      return { label: "Uploaded", className: "bg-neutral-100 text-neutral-600" };
    }
    if (status === "PENDING_PAYMENT") {
      return { label: "Draft", className: "bg-amber-100 text-amber-700" };
    }
    return { label: status.replaceAll("_", " "), className: "bg-neutral-100 text-neutral-600" };
  }

  function getReviewCount(track: any): string {
    const completed = (track.reviews as any[]).filter(
      (r: any) => r.status === "COMPLETED"
    ).length;
    const requested = track.reviewsRequested ?? 0;
    return `${completed}/${requested} reviews`;
  }

  function getTrackAction(track: any): { label: string; href: string } {
    const status = track.status as string;
    if (status === "UPLOADED" || track.reviewsRequested === 0) {
      return { label: "Request Reviews", href: `/tracks/${track.id}/request-reviews` };
    }
    return { label: "View Reviews", href: `/tracks/${track.id}` };
  }

  return (
    <div className="pt-16 px-6 sm:px-8 lg:px-12 pb-20">
      <div className="max-w-6xl">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">
              Welcome back, {artistProfile.artistName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Coins className="h-4 w-4 text-purple-600" />
              <span className="text-lg font-semibold text-purple-600">
                {credits} credit{credits !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                your tracks
              </p>
              <p className="mt-2 text-3xl font-light tracking-tight">
                {totalTracks}
              </p>
              <p className="mt-1 text-sm text-black/40">uploaded</p>
            </CardContent>
          </Card>

          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                credits
              </p>
              <p className="mt-2 text-3xl font-light tracking-tight text-purple-600">
                {credits}
              </p>
              <p className="mt-1 text-sm text-black/40">available</p>
            </CardContent>
          </Card>

          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                reviews given
              </p>
              <p className="mt-2 text-3xl font-light tracking-tight">
                {totalPeerReviews}
              </p>
              <p className="mt-1 text-sm text-black/40">completed</p>
            </CardContent>
          </Card>

          <Card variant="soft">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                avg rating
              </p>
              <p className="mt-2 text-3xl font-light tracking-tight">
                {peerReviewRating > 0 ? peerReviewRating.toFixed(1) : "—"}
              </p>
              <p className="mt-1 text-sm text-black/40">on your reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Your Tracks Section */}
        {tracks.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Tracks</h2>
              <Link
                href="/tracks"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {tracks.map((track: any) => {
                const badge = getTrackStatusBadge(track);
                const reviewCount = getReviewCount(track);
                const action = getTrackAction(track);

                return (
                  <div
                    key={track.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white rounded-xl px-5 py-4 border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    {/* Artwork + Play Button */}
                    <div className="relative flex-shrink-0 group">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                        {track.artworkUrl ? (
                          <Image
                            src={track.artworkUrl}
                            alt={track.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                            <Music className="h-6 w-6 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      {track.sourceUrl && (
                        <TrackPlayButton audioUrl={track.sourceUrl} />
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate mb-1">
                        {track.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {reviewCount}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={action.href}
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      <Button variant="primary" className="w-full sm:w-auto">
                        {action.label}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Card variant="soft" className="mb-10">
            <CardContent className="pt-6">
              <EmptyState
                doodle="music"
                title="No tracks yet"
                description="Upload your first track and request feedback from peers."
                action={{ label: "Submit a track", href: "/submit" }}
                className="py-8"
              />
            </CardContent>
          </Card>
        )}

        {/* Tracks to Review Section */}
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-semibold">Tracks to Review</h2>
            <Link
              href="/review"
              className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              View queue &rarr;
            </Link>
          </div>

          {pendingPeerReviews.length > 0 ? (
            <div className="space-y-3">
              {pendingPeerReviews.map((review: any) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between gap-3 bg-white rounded-xl border border-neutral-200 hover:border-purple-300 hover:shadow-md px-5 py-4 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Headphones className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {review.track.title}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        by {review.track.artist?.artistName ?? "Unknown"}
                      </p>
                      {review.track.genres && review.track.genres.length > 0 && (
                        <GenreTagList
                          genres={review.track.genres}
                          variant="neutral"
                          size="sm"
                          maxDisplay={2}
                        />
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/review/${review.id}`}
                    className="flex-shrink-0"
                  >
                    <Button variant="primary" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Card variant="soft">
              <CardContent className="pt-6">
                <EmptyState
                  doodle="headphones"
                  title="No tracks in your queue"
                  description="No tracks in your queue right now. Check back soon!"
                  className="py-8"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Credit Guide (dismissible) */}
        {!hasSeenCreditGuide && (
          <CreditGuide />
        )}

        {/* Pro Upsell */}
        {!isSubscribed && (
          <Card
            variant="soft"
            elevated
            className="overflow-hidden border-l-4 border-l-purple-600"
          >
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-base">
                      Save time with Pro
                    </p>
                    <p className="text-sm text-neutral-600 mt-0.5">
                      10 credits/month + sell your music
                    </p>
                  </div>
                </div>
                <Link href="/account">
                  <Button variant="primary">
                    Learn More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Credit Guide - client component for dismiss behaviour              */
/* ------------------------------------------------------------------ */

function CreditGuide() {
  // We render a client island for the dismiss interaction.  The wrapper
  // is a server component but the interactive part needs "use client".
  // For simplicity, we inline a small client component via a separate
  // island below.
  return <CreditGuideClient />;
}

// This must be extracted as a client component. Since we are in a server
// component file we use the pattern of a separate named export that is
// itself a client component.  However Next.js does not allow mixing
// directives in a single file, so we render a simple HTML-only version
// with a form POST for the dismiss action.

function CreditGuideClient() {
  return (
    <div className="mb-10">
      <Card variant="soft" className="border-l-4 border-l-purple-300">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono tracking-widest text-purple-600 uppercase mb-2">
                How credits work
              </p>
              <ol className="text-sm text-neutral-700 space-y-2 list-decimal list-inside">
                <li>
                  Upload a track and choose how many reviews you want (costs
                  credits).
                </li>
                <li>
                  Review other artists&apos; tracks to earn credits (1 review = 1
                  credit).
                </li>
                <li>Your starter credits are ready to use.</li>
              </ol>
            </div>
            <form action="/api/artist/welcome-seen" method="POST">
              <button
                type="submit"
                className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                aria-label="Dismiss credit guide"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
