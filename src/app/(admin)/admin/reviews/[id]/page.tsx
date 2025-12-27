import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { ReviewDisplay } from "@/components/reviews/review-display";
import { ArrowLeft, Star, Flag, Gem } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReviewPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reviewer: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      track: {
        include: {
          artist: { include: { user: { select: { email: true } } } },
          genres: true,
        },
      },
    },
  });

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/admin/tracks/${review.trackId}`}
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Track
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Review Preview</h1>
        <p className="text-neutral-500">
          This is exactly what the artist sees for this review
        </p>
      </div>

      {/* Admin metadata */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Status</div>
          <div className="font-medium">{review.status}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Artist Rating</div>
          <div className="font-medium flex items-center gap-1">
            {review.artistRating ? (
              <>
                {review.artistRating}/5
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </>
            ) : (
              <span className="text-neutral-400">Not rated</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Flagged</div>
          <div className="font-medium flex items-center gap-1">
            {review.wasFlagged ? (
              <>
                <Flag className="h-4 w-4 text-red-500" />
                {review.flagReason || "Yes"}
              </>
            ) : (
              <span className="text-neutral-400">No</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Is Gem</div>
          <div className="font-medium flex items-center gap-1">
            {review.isGem ? (
              <>
                <Gem className="h-4 w-4 text-amber-500" />
                Yes
              </>
            ) : (
              <span className="text-neutral-400">No</span>
            )}
          </div>
        </div>
      </div>

      {/* Track info */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral-500 mb-2">Track</div>
        <div className="font-medium">{review.track.title}</div>
        <div className="text-sm text-neutral-500">
          by {review.track.artist.user.email}
        </div>
        {review.track.feedbackFocus && (
          <p className="text-sm text-amber-600 font-medium mt-2">
            Artist note: {review.track.feedbackFocus}
          </p>
        )}
        <div className="mt-4">
          <AudioPlayer
            sourceUrl={review.track.sourceUrl}
            sourceType={review.track.sourceType}
            showListenTracker={false}
            showWaveform={review.track.sourceType === "UPLOAD"}
          />
        </div>
      </div>

      {/* Review content (what artist sees) */}
      {review.status === "COMPLETED" ? (
        <Card>
          <CardHeader className="border-b-2 border-black">
            <CardTitle>Artist View</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y-2 divide-black">
              <ReviewDisplay
                review={review}
                index={0}
                showControls={false}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6 text-center">
          <p className="text-neutral-500">
            Review is not completed yet (status: {review.status})
          </p>
        </div>
      )}
    </div>
  );
}
