import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { GenreTagList } from "@/components/ui/genre-tag";
import { ReviewDisplay } from "@/components/reviews/review-display";
import {
  ArrowLeft,
  Music,
  ExternalLink,
} from "lucide-react";

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
      ReviewerProfile: {
        include: {
          User: { select: { name: true, email: true } },
        },
      },
      Track: {
        include: {
          ArtistProfile: { include: { User: { select: { email: true, name: true } } } },
          Genre: true,
        },
      },
    },
  });

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/reviews"
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reviews
      </Link>

      {/* Track Header - Same as artist view */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-neutral-100 border-2 border-black flex items-center justify-center">
            <Music className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black">{review.Track.title}</h1>
            <GenreTagList
              genres={review.Track.Genre}
              variant="artist"
              size="sm"
            />
            {review.Track.feedbackFocus && (
              <p className="text-sm text-amber-600 font-medium mt-2">
                Artist note: {review.Track.feedbackFocus}
              </p>
            )}
          </div>
        </div>
        <a
          href={review.Track.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {review.Track.sourceType === "UPLOAD" ? "Download audio" : "View Track"}
        </a>
      </div>

      {/* Audio Player - Same as artist view */}
      <Card>
        <CardHeader>
          <CardTitle>Listen</CardTitle>
        </CardHeader>
        <CardContent>
          <AudioPlayer
            sourceUrl={review.Track.sourceUrl}
            sourceType={review.Track.sourceType}
            showListenTracker={false}
            showWaveform={review.Track.sourceType === "UPLOAD"}
          />
        </CardContent>
      </Card>

      {/* Review - Same styling as artist view */}
      {review.status === "COMPLETED" ? (
        <Card>
          <CardHeader className="border-b-2 border-black">
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y-2 divide-black">
              <ReviewDisplay
                review={{
                  ...review,
                  ReviewerProfile: review.ReviewerProfile ?? { id: "", User: { name: "Peer Reviewer" } },
                } as any}
                index={0}
                showControls={false}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 px-6">
              <div className="mx-auto w-12 h-12 bg-neutral-100 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-black">Review not completed</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Status: {review.status}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
