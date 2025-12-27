import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import { AudioPlayer } from "@/components/audio/audio-player";
import { GenreTagList } from "@/components/ui/genre-tag";
import { ReviewDisplay } from "@/components/reviews/review-display";
import {
  ArrowLeft,
  Music,
  ExternalLink,
  Star,
  ThumbsUp,
} from "lucide-react";

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
                <ReviewDisplay
                  key={review.id}
                  review={review}
                  index={index}
                  showControls={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
