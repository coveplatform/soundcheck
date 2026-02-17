"use client";

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ThumbsUp, ThumbsDown, ListMusic, Share2, UserPlus } from "lucide-react";
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

function getFirstName(name: string) {
  return name.trim().split(/\s+/g)[0] || "Reviewer";
}

function getInitial(name: string) {
  return (name.trim()[0] || "?").toUpperCase();
}

function formatEnum(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
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
  // V2 fields
  lowEndClarity?: string | null;
  vocalClarity?: string | null;
  highEndQuality?: string | null;
  stereoWidth?: string | null;
  dynamics?: string | null;
  energyCurve?: string | null;
  trackLength?: string | null;
  emotionalImpact?: Prisma.JsonValue;
  playlistAction?: string | null;
  qualityLevel?: string | null;
  nextFocus?: string | null;
  expectedPlacement?: string | null;
  quickWin?: string | null;
  biggestWeaknessSpecific?: string | null;
  ReviewerProfile: {
    id: string;
    User: {
      name: string | null;
    };
  } | null;
  ArtistProfile?: {
    id: string;
    User: {
      name: string | null;
    };
  } | null;
};

type ReviewDisplayProps = {
  review: ReviewData;
  index: number;
  showControls?: boolean;
};

export function ReviewDisplay({
  review,
  index: _index,
  showControls = true,
}: ReviewDisplayProps) {
  const reviewerName = review.ReviewerProfile?.User?.name ?? review.ArtistProfile?.User?.name ?? "Reviewer";
  const reviewerProfileId = review.ReviewerProfile?.id ?? review.ArtistProfile?.id;

  return (
    <article className="px-5 sm:px-6 py-5">
      {/* Header: Reviewer + Actions */}
      <header className="mb-5">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {showControls && reviewerProfileId ? (
            <Link
              href={`/artist/reviewers/${reviewerProfileId}`}
              className="h-9 w-9 min-w-[2.25rem] flex-shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xs font-black text-purple-700 hover:from-purple-200 hover:to-purple-300 transition-colors duration-150 ease-out motion-reduce:transition-none"
            >
              {getInitial(reviewerName)}
            </Link>
          ) : (
            <span className="h-9 w-9 min-w-[2.25rem] flex-shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xs font-black text-purple-700">
              {getInitial(reviewerName)}
            </span>
          )}

          {/* Name + Date + Impression */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {showControls && reviewerProfileId ? (
                <Link
                  href={`/artist/reviewers/${reviewerProfileId}`}
                  className="font-bold text-sm text-black hover:underline truncate"
                >
                  {getFirstName(reviewerName)}
                </Link>
              ) : (
                <span className="font-bold text-sm text-black truncate">
                  {getFirstName(reviewerName)}
                </span>
              )}
              {review.firstImpression && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    review.firstImpression === "STRONG_HOOK"
                      ? "bg-purple-100 text-purple-700"
                      : review.firstImpression === "DECENT"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-black/5 text-black/50"
                  }`}
                >
                  {review.firstImpression === "STRONG_HOOK"
                    ? "Hooked"
                    : review.firstImpression === "DECENT"
                    ? "Solid"
                    : "Lost Interest"}
                </span>
              )}
            </div>
            <time className="text-xs text-black/40">
              {review.createdAt.toLocaleDateString()}
            </time>
          </div>
        </div>

      </header>

      {/* Scores */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {review.productionScore != null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 text-xs">
            <span className="text-black/50">Production</span>
            <strong className="text-black">{review.productionScore}/5</strong>
          </span>
        )}
        {review.vocalScore != null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 text-xs">
            <span className="text-black/50">Vocals</span>
            <strong className="text-black">{review.vocalScore}/5</strong>
          </span>
        )}
        {review.originalityScore != null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 text-xs">
            <span className="text-black/50">Originality</span>
            <strong className="text-black">{review.originalityScore}/5</strong>
          </span>
        )}
        {review.wouldListenAgain !== null && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            review.wouldListenAgain
              ? "bg-purple-50 text-purple-700"
              : "bg-black/5 text-black/40"
          }`}>
            {review.wouldListenAgain ? (
              <><ThumbsUp className="h-3 w-3" /> Replay</>            ) : (
              <><ThumbsDown className="h-3 w-3" /> No replay</>            )}
          </span>
        )}
      </div>

      {/* Listener Signals */}
      {(review.wouldAddToPlaylist !== null || review.wouldShare !== null || review.wouldFollow !== null) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {review.wouldAddToPlaylist !== null && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
              review.wouldAddToPlaylist
                ? "bg-purple-50 text-purple-700"
                : "bg-black/5 text-black/35"
            }`}>
              <ListMusic className="h-3 w-3" />
              {review.wouldAddToPlaylist ? "Playlist" : "No playlist"}
            </span>
          )}
          {review.wouldShare !== null && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
              review.wouldShare
                ? "bg-purple-50 text-purple-700"
                : "bg-black/5 text-black/35"
            }`}>
              <Share2 className="h-3 w-3" />
              {review.wouldShare ? "Share" : "No share"}
            </span>
          )}
          {review.wouldFollow !== null && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
              review.wouldFollow
                ? "bg-purple-50 text-purple-700"
                : "bg-black/5 text-black/35"
            }`}>
              <UserPlus className="h-3 w-3" />
              {review.wouldFollow ? "Follow" : "No follow"}
            </span>
          )}
        </div>
      )}

      {/* V2 Quick Win - Prominently displayed */}
      {review.quickWin && (
        <div className="mb-5 p-4 bg-lime-50 border-2 border-lime-300 rounded-xl">
          <h4 className="text-xs font-bold text-lime-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="text-base">🎯</span>
            Quick Win
          </h4>
          <p className="text-sm text-lime-900 font-medium leading-relaxed">
            {review.quickWin}
          </p>
        </div>
      )}

      {/* V2 Technical Feedback */}
      {(review.lowEndClarity || review.vocalClarity || review.highEndQuality || review.stereoWidth || review.dynamics) && (
        <div className="mb-5 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest mb-3">
            Technical Feedback
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {review.lowEndClarity && (
              <div className="flex items-center gap-1.5">
                <span className="text-purple-600/60">Low End:</span>
                <span className="font-semibold text-purple-900">{formatEnum(review.lowEndClarity)}</span>
              </div>
            )}
            {review.vocalClarity && (
              <div className="flex items-center gap-1.5">
                <span className="text-purple-600/60">Vocals:</span>
                <span className="font-semibold text-purple-900">{formatEnum(review.vocalClarity)}</span>
              </div>
            )}
            {review.highEndQuality && (
              <div className="flex items-center gap-1.5">
                <span className="text-purple-600/60">High End:</span>
                <span className="font-semibold text-purple-900">{formatEnum(review.highEndQuality)}</span>
              </div>
            )}
            {review.stereoWidth && (
              <div className="flex items-center gap-1.5">
                <span className="text-purple-600/60">Stereo:</span>
                <span className="font-semibold text-purple-900">{formatEnum(review.stereoWidth)}</span>
              </div>
            )}
            {review.dynamics && (
              <div className="flex items-center gap-1.5">
                <span className="text-purple-600/60">Dynamics:</span>
                <span className="font-semibold text-purple-900">{formatEnum(review.dynamics)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* V2 Quality & Next Steps */}
      {(review.qualityLevel || review.nextFocus || review.expectedPlacement) && (
        <div className="mb-5 flex flex-wrap gap-2 items-center">
          {review.qualityLevel && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              review.qualityLevel === "PROFESSIONAL" || review.qualityLevel === "RELEASE_READY"
                ? "bg-lime-100 text-lime-800"
                : review.qualityLevel === "ALMOST_THERE"
                ? "bg-amber-100 text-amber-800"
                : "bg-orange-100 text-orange-800"
            }`}>
              <span className="text-sm">⭐</span>
              {formatEnum(review.qualityLevel)}
            </span>
          )}
          {review.nextFocus && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              <span className="text-sm">📋</span>
              Focus: {formatEnum(review.nextFocus)}
            </span>
          )}
          {review.expectedPlacement && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              <span className="text-sm">📍</span>
              {formatEnum(review.expectedPlacement)}
            </span>
          )}
        </div>
      )}

      {/* Written Feedback */}
      <div className="space-y-4 mb-5">
        {review.addressedArtistNote && (
          <p className="text-xs text-black/40 font-mono">
            Addressed your note: <strong className="text-black/60">{review.addressedArtistNote}</strong>
          </p>
        )}
        {review.bestPart && (
          <div>
            <h4 className="text-[11px] font-bold text-purple-600 uppercase tracking-widest mb-1.5">
              What Worked
            </h4>
            <p className="text-sm text-black/80 leading-relaxed pl-3 border-l-2 border-purple-400">
              {review.bestPart}
            </p>
          </div>
        )}
        {review.weakestPart && (
          <div>
            <h4 className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">
              To Improve
            </h4>
            <p className="text-sm text-black/80 leading-relaxed pl-3 border-l-2 border-red-300">
              {review.weakestPart}
            </p>
          </div>
        )}
        {review.biggestWeaknessSpecific && (
          <div>
            <h4 className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-1.5">
              Biggest Weakness
            </h4>
            <p className="text-sm text-black/80 leading-relaxed pl-3 border-l-2 border-orange-400">
              {review.biggestWeaknessSpecific}
            </p>
          </div>
        )}
        {review.additionalNotes && (
          <div>
            <h4 className="text-[11px] font-bold text-black/40 uppercase tracking-widest mb-1.5">
              Additional Notes
            </h4>
            <p className="text-sm text-black/70 leading-relaxed pl-3 border-l-2 border-black/10">
              {review.additionalNotes}
            </p>
          </div>
        )}

        {review.nextActions && (
          <div>
            <h4 className="text-[11px] font-bold text-black/70 uppercase tracking-widest mb-1.5">
              Next Actions
            </h4>
            <p className="text-sm text-black/80 leading-relaxed pl-3 border-l-2 border-black/30 whitespace-pre-wrap">
              {review.nextActions}
            </p>
          </div>
        )}

        {Array.isArray(review.timestamps) &&
          review.timestamps.filter(isTimestampNote).length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-purple-600 uppercase tracking-widest mb-1.5">
                Timestamps
              </h4>
              <div className="space-y-2">
                {review.timestamps.filter(isTimestampNote).map((t, i) => (
                  <div
                    key={`${t.seconds}-${i}`}
                    className="pl-3 border-l-2 border-purple-300"
                  >
                    <p className="text-xs font-mono text-black/40">
                      {`${Math.floor(t.seconds / 60)}:${String(
                        Math.floor(t.seconds % 60)
                      ).padStart(2, "0")}`}
                    </p>
                    <p className="text-sm text-black/80 leading-relaxed">
                      {t.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Genre / Similar artists */}
      {(review.perceivedGenre || review.similarArtists) && (
        <div className="text-xs text-black/40 mb-4">
          {review.perceivedGenre && (
            <span>
              Sounds like <strong className="text-black/60">{review.perceivedGenre}</strong>
            </span>
          )}
          {review.perceivedGenre && review.similarArtists && (
            <span className="mx-1.5">·</span>
          )}
          {review.similarArtists && (
            <span>
              Similar to <strong className="text-black/60">{review.similarArtists}</strong>
            </span>
          )}
        </div>
      )}

      {/* Rate this feedback + Gem */}
      {showControls && (
        <footer className="mt-6 pt-5 border-t border-black/10">
          <div className="rounded-xl bg-black/[0.03] border border-black/10 p-4">
            <p className="text-xs font-bold text-black/70 mb-3">
              What did you think of this feedback?
            </p>

            {/* Star rating */}
            <div className="flex items-center gap-2 mb-4">
              <ReviewRating
                reviewId={review.id}
                initialRating={review.artistRating ?? null}
              />
              <span className="text-xs text-black/50">Rate this review</span>
            </div>

            {/* Gem - prominent */}
            <div className="flex items-start gap-3 rounded-lg bg-white border border-black/10 p-3">
              <ReviewGem reviewId={review.id} initialIsGem={review.isGem ?? false} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-black/80">
                  Award a Gem for exceptional feedback
                </p>
                <p className="text-[11px] text-black/50 mt-0.5">
                  Gems reward reviewers who go above and beyond. They&apos;ll earn recognition and priority in future reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Flag - kept small */}
          <div className="mt-3">
            <ReviewFlag
              reviewId={review.id}
              wasFlagged={review.wasFlagged}
              flagReason={review.flagReason}
            />
          </div>
        </footer>
      )}
    </article>
  );
}
