import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewRating } from "@/components/artist/review-rating";
import { ReviewFlag } from "@/components/artist/review-flag";
import { ReviewGem } from "@/components/artist/review-gem";
import { Prisma } from "@prisma/client";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import { AudioPlayer } from "@/components/audio/audio-player";
import { GenreTagList } from "@/components/ui/genre-tag";
import {
  ArrowLeft,
  Music,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export const dynamic = 'force-dynamic';

function isTimestampNote(value: Prisma.JsonValue): value is { seconds: number; note: string } {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.seconds === "number" && typeof v.note === "string" && v.note.length > 0;
}

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

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      artist: {
        include: { user: true },
      },
      genres: true,
      payment: true,
      reviews: {
        where: { status: "COMPLETED" },
        include: {
          reviewer: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!track) {
    notFound();
  }

  // Verify ownership
  if (track.artist.userId !== session.user.id) {
    notFound();
  }

  const completedReviews = track.reviews.length;
  const progress = Math.round((completedReviews / track.reviewsRequested) * 100);

  // Calculate averages
  const avgProduction =
    track.reviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) /
    (completedReviews || 1);
  const avgOriginality =
    track.reviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) /
    (completedReviews || 1);
  const wouldListenAgain = track.reviews.filter((r) => r.wouldListenAgain).length;
  const wouldListenAgainPercent = Math.round(
    (wouldListenAgain / (completedReviews || 1)) * 100
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/g).filter(Boolean);
    const first = parts[0]?.[0] ?? "?";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Track Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-neutral-100 border-2 border-black flex items-center justify-center">
            <Music className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black">{track.title}</h1>
            <GenreTagList
              genres={track.genres}
              variant="artist"
              size="sm"
            />
            {track.feedbackFocus && (
              <p className="text-sm text-amber-600 font-medium mt-2">
                Artist note: {track.feedbackFocus}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3">
          {(track.status === "PENDING_PAYMENT" || track.status === "QUEUED") && (
            <TrackCancelButton
              trackId={track.id}
              willRefund={track.payment?.status === "COMPLETED"}
            />
          )}
          <a
            href={track.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {track.sourceType === "UPLOAD" ? "Download audio" : "View Track"}
          </a>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listen</CardTitle>
        </CardHeader>
        <CardContent>
          <AudioPlayer
            sourceUrl={track.sourceUrl}
            sourceType={track.sourceType}
            showListenTracker={false}
            showWaveform={track.sourceType === "UPLOAD"}
          />
        </CardContent>
      </Card>

      {track.status === "CANCELLED" ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">This track was cancelled</p>
                <p className="text-sm text-neutral-500">
                  {track.payment?.status === "REFUNDED"
                    ? "Your payment has been refunded."
                    : track.payment?.status === "COMPLETED"
                    ? "Refund is processing or pending."
                    : "No payment was captured."}
                </p>
              </div>
              <div className="text-sm text-neutral-500">Status: CANCELLED</div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {track.status !== "CANCELLED" ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
              <span className="text-sm font-bold">Review Progress</span>
              <span className="text-sm text-neutral-600 font-mono">
                {completedReviews} of {track.reviewsRequested} reviews
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-200 border-2 border-black">
              <div
                className="h-full bg-lime-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats */}
      {completedReviews > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-black">{avgProduction.toFixed(1)}</p>
              <p className="text-sm text-neutral-600 font-medium">Avg. Production Score</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= Math.round(avgProduction)
                        ? "text-amber-500 fill-amber-500"
                        : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-black">{avgOriginality.toFixed(1)}</p>
              <p className="text-sm text-neutral-600 font-medium">Avg. Originality Score</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= Math.round(avgOriginality)
                        ? "text-amber-500 fill-amber-500"
                        : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-black">{wouldListenAgainPercent}%</p>
              <p className="text-sm text-neutral-600 font-medium">Would Listen Again</p>
              <div className="flex justify-center items-center gap-2 mt-2">
                <ThumbsUp className="h-4 w-4 text-lime-600" />
                <span className="text-sm text-neutral-600 font-mono">
                  {wouldListenAgain} of {completedReviews}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {completedReviews > 0 && <AggregateAnalytics reviews={track.reviews} />}

      {/* Reviews */}
      <Card>
        <CardHeader className="border-b-2 border-black">
          <CardTitle>Reviews ({completedReviews})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {completedReviews === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-black">No reviews yet</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Check back soon!
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {track.reviews.map((review, index) => (
                <article key={review.id} className="p-6">
                  {/* Header: Number + Actions */}
                  <header className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-black text-white font-mono text-sm font-bold flex items-center justify-center">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <time className="text-xs text-neutral-500 font-mono">
                          {review.createdAt.toLocaleDateString()}
                        </time>
                        <div className="mt-0.5">
                          <Link
                            href={`/artist/reviewers/${review.reviewer.id}`}
                            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-black"
                          >
                            <span className="h-6 w-6 rounded-full bg-neutral-100 border border-black overflow-hidden flex items-center justify-center text-[10px] font-black text-black">
                              {getInitials(review.reviewer.user.name ?? "Reviewer")}
                            </span>
                            <span>
                              {review.reviewer.user.name ? review.reviewer.user.name : "Anonymous"}
                            </span>
                          </Link>
                        </div>
                        {/* First Impression inline */}
                        {review.firstImpression && (
                          <div className="mt-0.5">
                            <span className={`text-xs font-bold ${
                              review.firstImpression === "STRONG_HOOK"
                                ? "text-lime-600"
                                : review.firstImpression === "DECENT"
                                ? "text-orange-600"
                                : "text-neutral-500"
                            }`}>
                              {review.firstImpression === "STRONG_HOOK"
                                ? "Strong Hook"
                                : review.firstImpression === "DECENT"
                                ? "Decent Start"
                                : "Lost Interest"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action toolbar */}
                    <div className="flex items-center gap-3">
                      <ReviewRating
                        reviewId={review.id}
                        initialRating={review.artistRating ?? null}
                      />
                      <ReviewGem
                        reviewId={review.id}
                        initialIsGem={(review as any).isGem ?? false}
                      />
                    </div>
                  </header>

                  {/* Scores - Compact inline display */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 mb-5">
                    {review.productionScore && (
                      <span>
                        Production <strong className="text-black">{review.productionScore}/5</strong>
                      </span>
                    )}
                    {review.vocalScore && (
                      <span>
                        Vocals <strong className="text-black">{review.vocalScore}/5</strong>
                      </span>
                    )}
                    {review.originalityScore && (
                      <span>
                        Originality <strong className="text-black">{review.originalityScore}/5</strong>
                      </span>
                    )}
                    {review.wouldListenAgain !== null && (
                      <span className="flex items-center gap-1">
                        {review.wouldListenAgain ? (
                          <>
                            <ThumbsUp className="h-3.5 w-3.5 text-lime-600" />
                            <strong className="text-lime-600">Would listen again</strong>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-3.5 w-3.5 text-neutral-400" />
                            <span className="text-neutral-500">Wouldn&apos;t replay</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Main Feedback - The star of the show */}
                  <div className="space-y-4 mb-5">
                    {review.addressedArtistNote && (
                      <div className="text-xs text-neutral-600 font-mono">
                        Addressed your note: <strong className="text-black">{review.addressedArtistNote}</strong>
                      </div>
                    )}
                    {review.bestPart && (
                      <div>
                        <h4 className="text-xs font-bold text-lime-700 uppercase tracking-wide mb-1.5">
                          What Worked
                        </h4>
                        <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-lime-500">
                          {review.bestPart}
                        </p>
                      </div>
                    )}
                    {review.weakestPart && (
                      <div>
                        <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1.5">
                          To Improve
                        </h4>
                        <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-red-400">
                          {review.weakestPart}
                        </p>
                      </div>
                    )}
                    {review.additionalNotes && (
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5">
                          Additional Notes
                        </h4>
                        <p className="text-sm text-neutral-700 leading-relaxed pl-3 border-l-4 border-neutral-300">
                          {review.additionalNotes}
                        </p>
                      </div>
                    )}

                    {review.nextActions && (
                      <div>
                        <h4 className="text-xs font-bold text-black uppercase tracking-wide mb-1.5">
                          Next Actions
                        </h4>
                        <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-black whitespace-pre-wrap">
                          {review.nextActions}
                        </p>
                      </div>
                    )}

                    {Array.isArray(review.timestamps) && review.timestamps.filter(isTimestampNote).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">
                          Timestamps
                        </h4>
                        <div className="space-y-2">
                          {review.timestamps.filter(isTimestampNote).map((t, i) => (
                            <div key={`${t.seconds}-${i}`} className="pl-3 border-l-4 border-purple-400">
                              <p className="text-xs font-mono text-neutral-600">
                                {`${Math.floor(t.seconds / 60)}:${String(Math.floor(t.seconds % 60)).padStart(2, "0")}`}
                              </p>
                              <p className="text-sm text-neutral-800 leading-relaxed">{t.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secondary info - inline text, not boxed */}
                  {(review.perceivedGenre || review.similarArtists) && (
                    <div className="text-xs text-neutral-500 mb-4">
                      {review.perceivedGenre && (
                        <span>
                          Sounds like <strong className="text-neutral-700">{review.perceivedGenre}</strong>
                        </span>
                      )}
                      {review.perceivedGenre && review.similarArtists && (
                        <span className="mx-2">·</span>
                      )}
                      {review.similarArtists && (
                        <span>
                          Similar to <strong className="text-neutral-700">{review.similarArtists}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Flag control - minimal, at the bottom */}
                  <footer className="pt-4 border-t border-neutral-200">
                    <ReviewFlag
                      reviewId={review.id}
                      wasFlagged={review.wasFlagged}
                      flagReason={review.flagReason}
                    />
                  </footer>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
