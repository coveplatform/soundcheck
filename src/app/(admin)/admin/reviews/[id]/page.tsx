import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AudioPlayer } from "@/components/audio/audio-player";
import {
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Gem,
} from "lucide-react";

export const dynamic = "force-dynamic";

function isTimestampNote(
  value: Prisma.JsonValue
): value is { seconds: number; note: string } {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.seconds === "number" &&
    typeof v.note === "string" &&
    v.note.length > 0
  );
}

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/g).filter(Boolean);
    const first = parts[0]?.[0] ?? "?";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase();
  };

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
          This is what the artist sees for this review
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
        <div className="rounded-xl border-2 border-black bg-white shadow-sm">
          <div className="px-6 py-4 border-b-2 border-black bg-neutral-50">
            <h2 className="font-bold">Artist View</h2>
          </div>

          <article className="p-6">
            {/* Header */}
            <header className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-black text-white font-mono text-sm font-bold flex items-center justify-center">
                  01
                </div>
                <div>
                  <time className="text-xs text-neutral-500 font-mono">
                    {review.createdAt.toLocaleDateString()}
                  </time>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-neutral-100 border border-black overflow-hidden flex items-center justify-center text-[10px] font-black text-black">
                      {getInitials(review.reviewer.user.name ?? "Reviewer")}
                    </span>
                    <span className="text-xs font-bold text-neutral-700">
                      {review.reviewer.user.name || "Anonymous"}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({review.reviewer.user.email})
                    </span>
                  </div>
                  {review.firstImpression && (
                    <div className="mt-0.5">
                      <span
                        className={`text-xs font-bold ${
                          review.firstImpression === "STRONG_HOOK"
                            ? "text-lime-600"
                            : review.firstImpression === "DECENT"
                            ? "text-orange-600"
                            : "text-neutral-500"
                        }`}
                      >
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
            </header>

            {/* Scores */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 mb-5">
              {review.productionScore && (
                <span>
                  Production{" "}
                  <strong className="text-black">{review.productionScore}/5</strong>
                </span>
              )}
              {review.vocalScore && (
                <span>
                  Vocals{" "}
                  <strong className="text-black">{review.vocalScore}/5</strong>
                </span>
              )}
              {review.originalityScore && (
                <span>
                  Originality{" "}
                  <strong className="text-black">{review.originalityScore}/5</strong>
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

            {/* Main Feedback */}
            <div className="space-y-4 mb-5">
              {review.addressedArtistNote && (
                <div className="text-xs text-neutral-600 font-mono">
                  Addressed artist note:{" "}
                  <strong className="text-black">{review.addressedArtistNote}</strong>
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
              {Array.isArray(review.timestamps) &&
                review.timestamps.filter(isTimestampNote).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">
                      Timestamps
                    </h4>
                    <div className="space-y-2">
                      {review.timestamps.filter(isTimestampNote).map((t, i) => (
                        <div
                          key={`${t.seconds}-${i}`}
                          className="pl-3 border-l-4 border-purple-400"
                        >
                          <p className="text-xs font-mono text-neutral-600">
                            {`${Math.floor(t.seconds / 60)}:${String(
                              Math.floor(t.seconds % 60)
                            ).padStart(2, "0")}`}
                          </p>
                          <p className="text-sm text-neutral-800 leading-relaxed">
                            {t.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Secondary info */}
            {(review.perceivedGenre || review.similarArtists) && (
              <div className="text-xs text-neutral-500">
                {review.perceivedGenre && (
                  <span>
                    Sounds like{" "}
                    <strong className="text-neutral-700">
                      {review.perceivedGenre}
                    </strong>
                  </span>
                )}
                {review.perceivedGenre && review.similarArtists && (
                  <span className="mx-2">·</span>
                )}
                {review.similarArtists && (
                  <span>
                    Similar to{" "}
                    <strong className="text-neutral-700">
                      {review.similarArtists}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </article>
        </div>
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
