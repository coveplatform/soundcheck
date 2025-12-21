import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewRating } from "@/components/artist/review-rating";
import { ReviewFlag } from "@/components/artist/review-flag";
import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import {
  ArrowLeft,
  Music,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

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
      reviews: {
        where: { status: "COMPLETED" },
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

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Track Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-neutral-100 rounded-lg flex items-center justify-center">
            <Music className="h-8 w-8 text-neutral-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{track.title}</h1>
            <p className="text-neutral-500">
              {track.genres.map((g) => g.name).join(", ")}
            </p>
            {track.feedbackFocus && (
              <p className="text-sm text-neutral-400 mt-1">
                Focus: {track.feedbackFocus}
              </p>
            )}
          </div>
        </div>
        <a
          href={track.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ExternalLink className="h-4 w-4" />
          View Track
        </a>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Review Progress</span>
            <span className="text-sm text-neutral-500">
              {completedReviews} of {track.reviewsRequested} reviews
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-100 rounded-full">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {completedReviews > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{avgProduction.toFixed(1)}</p>
              <p className="text-sm text-neutral-500">Avg. Production Score</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= Math.round(avgProduction)
                        ? "text-amber-400 fill-amber-400"
                        : "text-neutral-200"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{avgOriginality.toFixed(1)}</p>
              <p className="text-sm text-neutral-500">Avg. Originality Score</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= Math.round(avgOriginality)
                        ? "text-amber-400 fill-amber-400"
                        : "text-neutral-200"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{wouldListenAgainPercent}%</p>
              <p className="text-sm text-neutral-500">Would Listen Again</p>
              <div className="flex justify-center gap-2 mt-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-neutral-500">
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
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {completedReviews === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">
                No reviews yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {track.reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="border-b border-neutral-100 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-500">
                      Reviewer #{index + 1}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {review.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <ReviewRating
                      reviewId={review.id}
                      initialRating={review.artistRating ?? null}
                    />
                    <ReviewFlag
                      reviewId={review.id}
                      wasFlagged={review.wasFlagged}
                      flagReason={review.flagReason}
                    />
                  </div>

                  {/* First Impression */}
                  {review.firstImpression && (
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          review.firstImpression === "STRONG_HOOK"
                            ? "bg-green-100 text-green-700"
                            : review.firstImpression === "DECENT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        First Impression:{" "}
                        {review.firstImpression === "STRONG_HOOK"
                          ? "Strong Hook"
                          : review.firstImpression === "DECENT"
                          ? "Decent"
                          : "Lost Interest"}
                      </span>
                    </div>
                  )}

                  {/* Scores */}
                  <div className="flex flex-wrap gap-4 mb-3 text-sm">
                    {review.productionScore && (
                      <div>
                        <span className="text-neutral-500">Production:</span>{" "}
                        <span className="font-medium">
                          {review.productionScore}/5
                        </span>
                      </div>
                    )}
                    {review.vocalScore && (
                      <div>
                        <span className="text-neutral-500">Vocals:</span>{" "}
                        <span className="font-medium">
                          {review.vocalScore}/5
                        </span>
                      </div>
                    )}
                    {review.originalityScore && (
                      <div>
                        <span className="text-neutral-500">Originality:</span>{" "}
                        <span className="font-medium">
                          {review.originalityScore}/5
                        </span>
                      </div>
                    )}
                    {review.wouldListenAgain !== null && (
                      <div className="flex items-center gap-1">
                        {review.wouldListenAgain ? (
                          <>
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">
                              Would listen again
                            </span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-500">
                              Wouldn&apos;t listen again
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Genre & Similar Artists */}
                  {(review.perceivedGenre || review.similarArtists) && (
                    <div className="text-sm mb-3">
                      {review.perceivedGenre && (
                        <p>
                          <span className="text-neutral-500">
                            Perceived genre:
                          </span>{" "}
                          {review.perceivedGenre}
                        </p>
                      )}
                      {review.similarArtists && (
                        <p>
                          <span className="text-neutral-500">
                            Similar artists:
                          </span>{" "}
                          {review.similarArtists}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Best & Weakest Parts */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-3">
                    {review.bestPart && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-green-700 mb-1">
                          Best Part
                        </p>
                        <p className="text-sm text-green-800">
                          {review.bestPart}
                        </p>
                      </div>
                    )}
                    {review.weakestPart && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Weakest Part
                        </p>
                        <p className="text-sm text-red-800">
                          {review.weakestPart}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  {review.additionalNotes && (
                    <div className="bg-neutral-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-neutral-500 mb-1">
                        Additional Notes
                      </p>
                      <p className="text-sm text-neutral-700">
                        {review.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
