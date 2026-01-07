import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import { TrackUpdateSourceForm } from "@/components/artist/track-update-source-form";
import { TrackFeedbackViewTracker } from "@/components/artist/track-feedback-view-tracker";
import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";
import { AudioPlayer } from "@/components/audio/audio-player";
import { GenreTagList } from "@/components/ui/genre-tag";
import { ReviewDisplay } from "@/components/reviews/review-display";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import {
  ArrowLeft,
  Music,
  ExternalLink,
  Star,
  ThumbsUp,
  ListMusic,
  Share2,
  UserPlus,
  CreditCard,
  AlertCircle,
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
  const countedCompletedReviews = track.reviews.filter(
    (r) => r.countsTowardCompletion !== false
  ).length;
  const progress = Math.round((countedCompletedReviews / track.reviewsRequested) * 100);

  // Calculate averages
  const analyticsReviews = track.reviews.filter(
    (r) => r.countsTowardAnalytics !== false
  );

  const avgProduction =
    analyticsReviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) /
    (analyticsReviews.length || 1);
  const avgOriginality =
    analyticsReviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) /
    (analyticsReviews.length || 1);
  const wouldListenAgain = analyticsReviews.filter((r) => r.wouldListenAgain).length;
  const wouldListenAgainPercent = Math.round(
    (wouldListenAgain / (analyticsReviews.length || 1)) * 100
  );

  // Listener signals
  const playlistYes = analyticsReviews.filter((r) => r.wouldAddToPlaylist === true).length;
  const playlistTotal = analyticsReviews.filter((r) => r.wouldAddToPlaylist !== null).length;
  const shareYes = analyticsReviews.filter((r) => r.wouldShare === true).length;
  const shareTotal = analyticsReviews.filter((r) => r.wouldShare !== null).length;
  const followYes = analyticsReviews.filter((r) => r.wouldFollow === true).length;
  const followTotal = analyticsReviews.filter((r) => r.wouldFollow !== null).length;
  const hasListenerSignals = playlistTotal > 0 || shareTotal > 0 || followTotal > 0;

  return (
    <div className="space-y-6">
      <TrackFeedbackViewTracker trackId={track.id} reviewCount={completedReviews} />
      {/* Back Link */}
      <Link
        href="/artist/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Track Header */}
      <div className="space-y-4">
        {track.linkIssueNotifiedAt && track.status !== "CANCELLED" && (
          <div className="bg-red-50 border-2 border-red-500 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Track Link Issue</p>
                <p className="text-sm text-red-700 mt-1">
                  Your track link appears to be broken, private, or unavailable. Reviewers cannot listen to your track until this is fixed.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Please update your track link below to continue receiving reviews.
                </p>
              </div>
            </div>
          </div>
        )}

        {track.status === "PENDING_PAYMENT" && (
          <div className="bg-orange-50 border-2 border-orange-400 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-bold text-orange-900">Payment Pending</p>
                <p className="text-sm text-orange-700">Finish submitting this track to start receiving feedback.</p>
              </div>
            </div>
            <Link href={`/artist/submit/checkout?trackId=${track.id}`}>
              <Button variant="primary" className="bg-orange-500 hover:bg-orange-600 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Payment
              </Button>
            </Link>
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Album art placeholder - stays square */}
          <div className="h-16 w-16 min-w-[4rem] aspect-square flex-shrink-0 bg-gradient-to-br from-neutral-100 to-neutral-200 border-2 border-black flex items-center justify-center">
            <Music className="h-8 w-8 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black truncate">{track.title}</h1>
            <GenreTagList
              genres={track.genres}
              variant="artist"
              size="sm"
            />
            {track.feedbackFocus && (
              <p className="text-sm text-amber-600 font-medium mt-2 line-clamp-2">
                Artist note: {track.feedbackFocus}
              </p>
            )}
          </div>
        </div>
        {/* Actions row - separate on mobile */}
        <div className="flex items-center gap-3 flex-wrap">
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
            {track.sourceType === "UPLOAD" ? "Download" : "View Track"}
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
          {track.status !== "CANCELLED" && completedReviews === 0 ? (
            <div className="mt-6">
              <TrackUpdateSourceForm trackId={track.id} initialUrl={track.sourceUrl} />
            </div>
          ) : null}
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
                {countedCompletedReviews} of {track.reviewsRequested} reviews
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
      {analyticsReviews.length > 0 && (
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
                  {wouldListenAgain} of {analyticsReviews.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Listener Signals */}
      {analyticsReviews.length > 0 && hasListenerSignals && (
        <Card>
          <CardHeader className="border-b-2 border-black">
            <CardTitle className="flex items-center gap-2">
              Listener Signals
              <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                How listeners would engage
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-3 gap-6">
              {playlistTotal > 0 && (
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      playlistYes / playlistTotal >= 0.5
                        ? "bg-lime-100 text-lime-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      <ListMusic className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-2xl font-black">
                    {Math.round((playlistYes / playlistTotal) * 100)}%
                  </p>
                  <p className="text-sm text-neutral-600">Would add to playlist</p>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    {playlistYes} of {playlistTotal}
                  </p>
                </div>
              )}
              {shareTotal > 0 && (
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      shareYes / shareTotal >= 0.5
                        ? "bg-lime-100 text-lime-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      <Share2 className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-2xl font-black">
                    {Math.round((shareYes / shareTotal) * 100)}%
                  </p>
                  <p className="text-sm text-neutral-600">Would share with friends</p>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    {shareYes} of {shareTotal}
                  </p>
                </div>
              )}
              {followTotal > 0 && (
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      followYes / followTotal >= 0.5
                        ? "bg-lime-100 text-lime-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      <UserPlus className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-2xl font-black">
                    {Math.round((followYes / followTotal) * 100)}%
                  </p>
                  <p className="text-sm text-neutral-600">Would follow artist</p>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    {followYes} of {followTotal}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsReviews.length > 0 && <AggregateAnalytics reviews={analyticsReviews} />}

      {/* Reviews - Carousel for better presentation */}
      <Card>
        <CardHeader className="border-b-2 border-black p-0">
          <CardTitle className="sr-only">Reviews ({completedReviews})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ReviewCarousel reviews={track.reviews} showControls={true} />
        </CardContent>
      </Card>
    </div>
  );
}
