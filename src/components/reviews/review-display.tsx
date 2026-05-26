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

function getReviewerTitle(p: {
  isIndustryExpert: boolean;
  gemCount: number;
  averageRating: number;
  totalReviews: number;
}): string | null {
  if (p.isIndustryExpert) return "Industry Expert";
  if (p.gemCount >= 10) return "Gem Listener";
  if (p.averageRating >= 4.5 && p.totalReviews >= 30) return "Top Reviewer";
  if (p.averageRating >= 4.0 && p.totalReviews >= 15) return "Trusted Ear";
  if (p.totalReviews >= 50) return "Veteran Listener";
  if (p.totalReviews >= 20) return "Active Reviewer";
  return null;
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

// ---------------------------------------------------------------------------
// Engagement curve helpers
// ---------------------------------------------------------------------------

type CurvePoint = { seconds: number; level: number };

const CURVE_LEVELS = [
  { value: 1, label: "Lost it", color: "#525252" },
  { value: 2, label: "Meh",     color: "#3b82f6" },
  { value: 3, label: "Okay",    color: "#f59e0b" },
  { value: 4, label: "Good",    color: "#10b981" },
  { value: 5, label: "Hooked",  color: "#9333ea" },
];

function curveColor(level: number) {
  return CURVE_LEVELS.find((l) => l.value === level)?.color ?? "#9333ea";
}

function curveLabel(level: number) {
  return CURVE_LEVELS.find((l) => l.value === level)?.label ?? "";
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function parseCurve(raw: Prisma.JsonValue): CurvePoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is CurvePoint =>
      typeof (p as any)?.seconds === "number" && typeof (p as any)?.level === "number"
  );
}

function analyzeCurve(curve: CurvePoint[]): { summary: string; insights: string[] } {
  if (curve.length < 5) return { summary: "", insights: [] };

  const levels = curve.map((p) => p.level);
  const avg = levels.reduce((a, b) => a + b, 0) / levels.length;

  const peakIdx = levels.indexOf(Math.max(...levels));
  const peak = curve[peakIdx];

  const opening = curve.slice(0, Math.ceil(curve.length * 0.2));
  const openAvg = opening.reduce((a, b) => a + b.level, 0) / opening.length;

  const closing = curve.slice(Math.floor(curve.length * 0.8));
  const closeAvg = closing.reduce((a, b) => a + b.level, 0) / closing.length;

  const midSection = curve.slice(Math.floor(curve.length * 0.25), Math.floor(curve.length * 0.75));
  const midMin = midSection.length ? Math.min(...midSection.map((p) => p.level)) : 3;
  const midMinIdx = midSection.findIndex((p) => p.level === midMin);
  const midDip = midSection[midMinIdx];

  const trajectory = closeAvg - openAvg;

  const insights: string[] = [];

  if (peak.level >= 4) {
    insights.push(`Peaked at "${curveLabel(peak.level)}" around ${fmtTime(peak.seconds)}`);
  }

  if (openAvg >= 4) {
    insights.push("Opening hook landed immediately — held from the first second");
  } else if (openAvg <= 2) {
    insights.push("Slow to grab attention — the opening didn't pull them in");
  }

  if (trajectory >= 1.5) {
    insights.push("Engagement built consistently — the track improved as it went on");
  } else if (trajectory <= -1.5) {
    insights.push(`Dropped off in the final section — ended at "${curveLabel(Math.round(closeAvg))}"`);
  }

  if (midDip && midDip.level <= 2 && peak.level >= 4) {
    insights.push(`Dipped to "${curveLabel(midDip.level)}" mid-track around ${fmtTime(midDip.seconds)} — a weak moment`);
  }

  let summary = "";
  if (avg >= 4.2) {
    summary = "This listener was hooked throughout — strong all-round engagement.";
  } else if (avg >= 3.5) {
    summary = trajectory > 0.5
      ? "Good overall engagement with a positive arc — built well toward the end."
      : trajectory < -0.5
      ? "Started strong but lost momentum — the second half needs attention."
      : "Solid, consistent engagement throughout with no major drops.";
  } else if (avg >= 2.5) {
    summary = trajectory > 0.5
      ? "Started tentative but eventually found its footing."
      : "Mixed engagement — moments of interest but also stretches that lost them.";
  } else {
    summary = "This listener struggled to stay engaged — the track didn't hold attention.";
  }

  return { summary, insights };
}

function MiniEngagementChart({ curve }: { curve: CurvePoint[] }) {
  const W = 600;
  const H = 52;
  const PAD = 4;

  const maxDur = Math.max(curve[curve.length - 1]?.seconds ?? 1, 1);
  const toX = (s: number) => PAD + (s / maxDur) * (W - PAD * 2);
  const toY = (l: number) => H - PAD - ((l - 1) / 4) * (H - PAD * 2);
  const pts = curve.map((p) => [toX(p.seconds), toY(p.level)] as [number, number]);

  const segments = pts.length >= 2
    ? pts.slice(0, -1).map((p0, i) => {
        const p1 = pts[i + 1];
        const cpx = (p0[0] + p1[0]) / 2;
        const color = curveColor(curve[i].level);
        return {
          color,
          line: `M ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]}`,
          fill: `M ${p0[0]},${H - PAD} L ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]} L ${p1[0]},${H - PAD} Z`,
        };
      })
    : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 52 }} preserveAspectRatio="none">
      {[1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={0} y1={toY(i)} x2={W} y2={toY(i)} stroke="black" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {segments.map((seg, i) => (
        <path key={`f${i}`} d={seg.fill} fill={seg.color} fillOpacity="0.12" />
      ))}
      {segments.map((seg, i) => (
        <path key={`l${i}`} d={seg.line} fill="none" stroke={seg.color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
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
  engagementCurve?: Prisma.JsonValue;
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
    totalReviews: number;
    averageRating: number;
    gemCount: number;
    isIndustryExpert: boolean;
    User: { name: string | null };
    Genre: { id: string; name: string }[];
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
  const reviewerTitle = review.ReviewerProfile
    ? getReviewerTitle(review.ReviewerProfile)
    : null;
  const reviewerGenres = review.ReviewerProfile?.Genre?.slice(0, 2) ?? [];
  const reviewerCount = review.ReviewerProfile?.totalReviews ?? 0;

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
      {/* Header: Reviewer identity card */}
      <header className="mb-5 pb-4 border-b border-black/6">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {showControls && reviewerProfileId ? (
            <Link
              href={`/reviewers/${reviewerProfileId}`}
              className="h-11 w-11 min-w-[2.75rem] flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-sm font-black text-white hover:opacity-80 transition-opacity"
            >
              {getInitial(reviewerName)}
            </Link>
          ) : (
            <span className="h-11 w-11 min-w-[2.75rem] flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-sm font-black text-white">
              {getInitial(reviewerName)}
            </span>
          )}

          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              {showControls && reviewerProfileId ? (
                <Link href={`/reviewers/${reviewerProfileId}`} className="font-black text-sm text-black hover:underline">
                  {getFirstName(reviewerName)}
                </Link>
              ) : (
                <span className="font-black text-sm text-black">{getFirstName(reviewerName)}</span>
              )}
              {reviewerTitle && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {reviewerTitle}
                </span>
              )}
              {review.firstImpression && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  review.firstImpression === "STRONG_HOOK" ? "bg-purple-100 text-purple-700"
                  : review.firstImpression === "DECENT" ? "bg-amber-50 text-amber-700"
                  : "bg-black/5 text-black/50"
                }`}>
                  {review.firstImpression === "STRONG_HOOK" ? "Hooked"
                    : review.firstImpression === "DECENT" ? "Solid"
                    : "Lost Interest"}
                </span>
              )}
            </div>

            {/* Meta row: genres · count · date */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {reviewerGenres.map((g) => (
                <span key={g.id} className="text-[11px] font-semibold text-neutral-500">{g.name}</span>
              ))}
              {reviewerGenres.length > 0 && reviewerCount > 0 && (
                <span className="text-black/15 text-[10px]">·</span>
              )}
              {reviewerCount > 0 && (
                <span className="text-[11px] text-neutral-400">{reviewerCount} reviews</span>
              )}
              <span className="text-black/15 text-[10px]">·</span>
              <time className="text-[11px] text-neutral-400">
                {review.createdAt.toLocaleDateString()}
              </time>
            </div>

            {/* View reviewer link */}
            {showControls && reviewerProfileId && (
              <Link
                href={`/reviewers/${reviewerProfileId}`}
                className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors"
              >
                View reviewer
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6h8M6 2l4 4-4 4" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Engagement curve + analysis */}
      {(() => {
        const curve = parseCurve(review.engagementCurve ?? null);
        if (curve.length < 5) return null;
        const { summary, insights } = analyzeCurve(curve);
        const lastLevel = curve[curve.length - 1]?.level ?? 3;
        const lastColor = curveColor(lastLevel);
        return (
          <div className="mb-5 rounded-xl border border-black/8 overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                Listener engagement curve
              </p>
              <div className="flex items-center gap-2 mb-2">
                {CURVE_LEVELS.map((l) => (
                  <span key={l.value} className="flex items-center gap-1 text-[9px] font-semibold text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <MiniEngagementChart curve={curve} />
            <div className="px-4 pt-3 pb-4 bg-black/[0.02] border-t border-black/6">
              {summary && (
                <p className="text-sm font-semibold text-black/70 mb-3 leading-snug">{summary}</p>
              )}
              {insights.length > 0 && (
                <ul className="space-y-1.5">
                  {insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-black/60">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: lastColor }} />
                      {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })()}

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
