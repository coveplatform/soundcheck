"use client";

import { useState } from "react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ThumbsUp, ThumbsDown, ListMusic, Share2, UserPlus, Link2, Check } from "lucide-react";
import { ReviewRating } from "@/components/artist/review-rating";
import { ReviewFlag } from "@/components/artist/review-flag";
import { ReviewGem } from "@/components/artist/review-gem";

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export type ReviewData = {
  id: string;
  shareId: string | null;
  createdAt: Date;
  firstImpression: string | null;
  productionScore: number | null;
  vocalScore: number | null;
  originalityScore: number | null;
  wouldListenAgain: boolean | null;
  wouldAddToPlaylist: boolean | null;
  wouldShare: boolean | null;
  wouldFollow: boolean | null;
  addressedArtistNote: string | null;
  bestPart: string | null;
  weakestPart: string | null;
  additionalNotes: string | null;
  nextActions: string | null;
  timestamps: Prisma.JsonValue;
  perceivedGenre: string | null;
  similarArtists: string | null;
  artistRating: number | null;
  isGem: boolean;
  wasFlagged: boolean;
  flagReason: string | null;
  reviewer: {
    id: string;
    user: {
      name: string | null;
    };
  };
};

type ReviewDisplayProps = {
  review: ReviewData;
  index: number;
  showControls?: boolean;
};

export function ReviewDisplay({
  review,
  index,
  showControls = true,
}: ReviewDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!review.shareId) return;
    const url = `${window.location.origin}/r/${review.shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="p-6">
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
              {showControls ? (
                <Link
                  href={`/artist/reviewers/${review.reviewer.id}`}
                  className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-black"
                >
                  <span className="h-8 w-8 min-w-[2rem] aspect-square flex-shrink-0 rounded-full bg-neutral-100 border-2 border-black overflow-hidden flex items-center justify-center text-xs font-black text-black">
                    {getInitials(review.reviewer.user.name ?? "Reviewer")}
                  </span>
                  <span>
                    {review.reviewer.user.name
                      ? review.reviewer.user.name
                      : "Anonymous"}
                  </span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <span className="h-8 w-8 min-w-[2rem] aspect-square flex-shrink-0 rounded-full bg-neutral-100 border-2 border-black overflow-hidden flex items-center justify-center text-xs font-black text-black">
                    {getInitials(review.reviewer.user.name ?? "Reviewer")}
                  </span>
                  <span>
                    {review.reviewer.user.name
                      ? review.reviewer.user.name
                      : "Anonymous"}
                  </span>
                </span>
              )}
            </div>
            {/* First Impression inline */}
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

        {/* Action toolbar */}
        {showControls && (
          <div className="flex items-center gap-3">
            {review.shareId && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Copy share link"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-lime-600" />
                    <span className="text-lime-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            )}
            <ReviewRating
              reviewId={review.id}
              initialRating={review.artistRating ?? null}
            />
            <ReviewGem reviewId={review.id} initialIsGem={review.isGem ?? false} />
          </div>
        )}
      </header>

      {/* Scores - Compact inline display */}
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

      {/* Listener Signals */}
      {(review.wouldAddToPlaylist !== null || review.wouldShare !== null || review.wouldFollow !== null) && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {review.wouldAddToPlaylist !== null && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 ${
              review.wouldAddToPlaylist
                ? "bg-lime-50 border-lime-500 text-lime-700"
                : "bg-neutral-50 border-neutral-300 text-neutral-500"
            }`}>
              <ListMusic className="h-3 w-3" />
              {review.wouldAddToPlaylist ? "Would playlist" : "No playlist"}
            </span>
          )}
          {review.wouldShare !== null && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 ${
              review.wouldShare
                ? "bg-lime-50 border-lime-500 text-lime-700"
                : "bg-neutral-50 border-neutral-300 text-neutral-500"
            }`}>
              <Share2 className="h-3 w-3" />
              {review.wouldShare ? "Would share" : "No share"}
            </span>
          )}
          {review.wouldFollow !== null && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 ${
              review.wouldFollow
                ? "bg-lime-50 border-lime-500 text-lime-700"
                : "bg-neutral-50 border-neutral-300 text-neutral-500"
            }`}>
              <UserPlus className="h-3 w-3" />
              {review.wouldFollow ? "Would follow" : "No follow"}
            </span>
          )}
        </div>
      )}

      {/* Main Feedback - The star of the show */}
      <div className="space-y-4 mb-5">
        {review.addressedArtistNote && (
          <div className="text-xs text-neutral-600 font-mono">
            Addressed your note:{" "}
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

      {/* Secondary info - inline text, not boxed */}
      {(review.perceivedGenre || review.similarArtists) && (
        <div className="text-xs text-neutral-500 mb-4">
          {review.perceivedGenre && (
            <span>
              Sounds like{" "}
              <strong className="text-neutral-700">{review.perceivedGenre}</strong>
            </span>
          )}
          {review.perceivedGenre && review.similarArtists && (
            <span className="mx-2">·</span>
          )}
          {review.similarArtists && (
            <span>
              Similar to{" "}
              <strong className="text-neutral-700">{review.similarArtists}</strong>
            </span>
          )}
        </div>
      )}

      {/* Flag control - minimal, at the bottom */}
      {showControls && (
        <footer className="pt-4 border-t border-neutral-200">
          <ReviewFlag
            reviewId={review.id}
            wasFlagged={review.wasFlagged}
            flagReason={review.flagReason}
          />
        </footer>
      )}
    </article>
  );
}
