"use client";

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const qualityConfig: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  PROFESSIONAL: {
    label: "Professional",
    bg: "bg-lime-50",
    border: "border-lime-300",
    text: "text-lime-800",
    dot: "bg-lime-500",
  },
  RELEASE_READY: {
    label: "Release Ready",
    bg: "bg-lime-50",
    border: "border-lime-300",
    text: "text-lime-800",
    dot: "bg-lime-500",
  },
  ALMOST_THERE: {
    label: "Almost There",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-400",
  },
  DEMO_STAGE: {
    label: "Demo Stage",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    dot: "bg-orange-400",
  },
  NOT_READY: {
    label: "Not Ready Yet",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-400",
  },
};

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
  tooRepetitive?: boolean | null;
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
  const reviewerName =
    review.ReviewerProfile?.User?.name ??
    review.ArtistProfile?.User?.name ??
    "Reviewer";
  const reviewerProfileId =
    review.ReviewerProfile?.id ?? review.ArtistProfile?.id;

  const quality = review.qualityLevel
    ? qualityConfig[review.qualityLevel as string]
    : null;

  // Issue chips — only show problems, not clean signals
  const issueChips: string[] = [];
  if (review.vocalClarity === "BURIED") issueChips.push("Vocals buried");
  if (review.lowEndClarity === "BOTH_MUDDY") issueChips.push("Low end muddy");
  if (review.highEndQuality === "TOO_HARSH") issueChips.push("Highs harsh");
  if (review.stereoWidth === "TOO_NARROW") issueChips.push("Too narrow");
  if (review.dynamics === "TOO_COMPRESSED") issueChips.push("Over-compressed");
  if (review.tooRepetitive) issueChips.push("Too repetitive");
  if (review.trackLength === "WAY_TOO_LONG") issueChips.push("Too long");

  return (
    <article className="px-5 sm:px-6 py-5">
      {/* Header: Reviewer + Actions */}
      <header className="mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {showControls && reviewerProfileId ? (
            <Link
              href={`/reviewers/${reviewerProfileId}`}
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
                  href={`/reviewers/${reviewerProfileId}`}
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

      {/* Quality verdict + replay — prominent badges */}
      {(quality || review.wouldListenAgain !== null) && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {quality && (
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${quality.bg} ${quality.border} ${quality.text}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${quality.dot}`} />
              {quality.label}
            </span>
          )}
          {review.wouldListenAgain !== null && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                review.wouldListenAgain
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : "bg-black/5 border-black/10 text-black/40"
              }`}
            >
              {review.wouldListenAgain ? "↺ Would replay" : "✕ Wouldn't replay"}
            </span>
          )}
        </div>
      )}

      {/* Written feedback — the HERO */}
      <div className="space-y-3 mb-5">
        {review.addressedArtistNote && (
          <p className="text-xs text-black/40 font-mono">
            Re: your note —{" "}
            <strong className="text-black/60">{review.addressedArtistNote}</strong>
          </p>
        )}

        {review.bestPart && (
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              What worked
            </p>
            <p className="text-sm text-black/80 leading-relaxed">{review.bestPart}</p>
          </div>
        )}

        {/* Legacy: quickWin */}
        {review.quickWin && (
          <div className="rounded-xl bg-lime-50 border-2 border-lime-300 p-4">
            <p className="text-[10px] font-bold text-lime-800 uppercase tracking-widest mb-2">
              🎯 Quick Win
            </p>
            <p className="text-sm text-lime-900 font-medium leading-relaxed">{review.quickWin}</p>
          </div>
        )}

        {/* Main feedback — v3 (biggestWeaknessSpecific) or legacy (weakestPart only) */}
        {review.biggestWeaknessSpecific ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              {review.quickWin ? "Biggest weakness" : "Main feedback"}
            </p>
            <p className="text-sm text-black/80 leading-relaxed">
              {review.biggestWeaknessSpecific}
            </p>
          </div>
        ) : review.weakestPart ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              To improve
            </p>
            <p className="text-sm text-black/80 leading-relaxed">{review.weakestPart}</p>
          </div>
        ) : null}

        {review.additionalNotes && (
          <div>
            <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest mb-1.5">
              Additional notes
            </p>
            <p className="text-sm text-black/70 leading-relaxed pl-3 border-l-2 border-black/10">
              {review.additionalNotes}
            </p>
          </div>
        )}

        {review.nextActions && (
          <div>
            <p className="text-[11px] font-bold text-black/70 uppercase tracking-widest mb-1.5">
              Next actions
            </p>
            <p className="text-sm text-black/80 leading-relaxed pl-3 border-l-2 border-black/30 whitespace-pre-wrap">
              {review.nextActions}
            </p>
          </div>
        )}
      </div>

      {/* Technical issue chips — amber, only problems */}
      {issueChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {issueChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800"
            >
              ⚠ {chip}
            </span>
          ))}
        </div>
      )}

      {/* Legacy: nextFocus / expectedPlacement */}
      {(review.nextFocus || review.expectedPlacement) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {review.nextFocus && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              📋 Focus: {formatEnum(review.nextFocus)}
            </span>
          )}
          {review.expectedPlacement && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              📍 {formatEnum(review.expectedPlacement)}
            </span>
          )}
        </div>
      )}

      {/* Scores — compact row, moved to bottom */}
      {(review.productionScore != null ||
        review.vocalScore != null ||
        review.originalityScore != null) && (
        <div className="flex flex-wrap gap-2 mb-4">
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
        </div>
      )}

      {/* Timestamps */}
      {Array.isArray(review.timestamps) &&
        review.timestamps.filter(isTimestampNote).length > 0 && (
          <div className="mb-4">
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
                  <p className="text-sm text-black/80 leading-relaxed">{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Genre / similar artists */}
      {(review.perceivedGenre || review.similarArtists) && (
        <div className="text-xs text-black/40 mb-4">
          {review.perceivedGenre && (
            <span>
              Sounds like{" "}
              <strong className="text-black/60">{review.perceivedGenre}</strong>
            </span>
          )}
          {review.perceivedGenre && review.similarArtists && (
            <span className="mx-1.5">·</span>
          )}
          {review.similarArtists && (
            <span>
              Similar to{" "}
              <strong className="text-black/60">{review.similarArtists}</strong>
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

            {/* Gem */}
            <div className="flex items-start gap-3 rounded-lg bg-white border border-black/10 p-3">
              <ReviewGem reviewId={review.id} initialIsGem={review.isGem ?? false} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-black/80">
                  Award a Gem for exceptional feedback
                </p>
                <p className="text-[11px] text-black/50 mt-0.5">
                  Gems reward reviewers who go above and beyond. They&apos;ll earn recognition and
                  priority in future reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Flag */}
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
