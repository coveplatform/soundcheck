"use client";

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ReviewRating } from "@/components/artist/review-rating";
import { ReviewFlag } from "@/components/artist/review-flag";
import { ReviewGem } from "@/components/artist/review-gem";

function isTimestampNote(
  value: Prisma.JsonValue
): value is { seconds: number; note: string } {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.seconds === "number" && typeof v.note === "string" && v.note.length > 0;
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
  return value.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

const qualityConfig: Record<string, { label: string; bg: string; text: string }> = {
  PROFESSIONAL:  { label: "Professional",   bg: "bg-purple-500",   text: "text-white" },
  RELEASE_READY: { label: "Release Ready",  bg: "bg-purple-500",   text: "text-white" },
  ALMOST_THERE:  { label: "Almost There",   bg: "bg-amber-400",  text: "text-black" },
  DEMO_STAGE:    { label: "Demo Stage",     bg: "bg-orange-400", text: "text-black" },
  NOT_READY:     { label: "Not Ready Yet",  bg: "bg-red-500",    text: "text-white" },
};

// ── Engagement curve ──────────────────────────────────────────────────────────

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
  if (peak.level >= 4) insights.push(`Peaked at "${curveLabel(peak.level)}" around ${fmtTime(peak.seconds)}`);
  if (openAvg >= 4) insights.push("Opening hook landed immediately — held from the first second");
  else if (openAvg <= 2) insights.push("Slow to grab attention — the opening didn't pull them in");
  if (trajectory >= 1.5) insights.push("Engagement built consistently — the track improved as it went on");
  else if (trajectory <= -1.5) insights.push(`Dropped off in the final section — ended at "${curveLabel(Math.round(closeAvg))}"`);
  if (midDip && midDip.level <= 2 && peak.level >= 4) insights.push(`Dipped to "${curveLabel(midDip.level)}" mid-track around ${fmtTime(midDip.seconds)} — a weak moment`);
  let summary = "";
  if (avg >= 4.2) summary = "This listener was hooked throughout — strong all-round engagement.";
  else if (avg >= 3.5) summary = trajectory > 0.5 ? "Good overall engagement with a positive arc — built well toward the end." : trajectory < -0.5 ? "Started strong but lost momentum — the second half needs attention." : "Solid, consistent engagement throughout with no major drops.";
  else if (avg >= 2.5) summary = trajectory > 0.5 ? "Started tentative but eventually found its footing." : "Mixed engagement — moments of interest but also stretches that lost them.";
  else summary = "This listener struggled to stay engaged — the track didn't hold attention.";
  return { summary, insights };
}

function MiniEngagementChart({ curve }: { curve: CurvePoint[] }) {
  const W = 600; const H = 52; const PAD = 4;
  const maxDur = Math.max(curve[curve.length - 1]?.seconds ?? 1, 1);
  const toX = (s: number) => PAD + (s / maxDur) * (W - PAD * 2);
  const toY = (l: number) => H - PAD - ((l - 1) / 4) * (H - PAD * 2);
  const pts = curve.map((p) => [toX(p.seconds), toY(p.level)] as [number, number]);
  const segments = pts.length >= 2 ? pts.slice(0, -1).map((p0, i) => {
    const p1 = pts[i + 1];
    const cpx = (p0[0] + p1[0]) / 2;
    const color = curveColor(curve[i].level);
    return {
      color,
      line: `M ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]}`,
      fill: `M ${p0[0]},${H - PAD} L ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]} L ${p1[0]},${H - PAD} Z`,
    };
  }) : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 52 }} preserveAspectRatio="none">
      {[1,2,3,4,5].map((i) => (
        <line key={i} x1={0} y1={toY(i)} x2={W} y2={toY(i)} stroke="black" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {segments.map((seg, i) => <path key={`f${i}`} d={seg.fill} fill={seg.color} fillOpacity="0.12" />)}
      {segments.map((seg, i) => <path key={`l${i}`} d={seg.line} fill="none" stroke={seg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

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
    isRestricted: boolean;
    User: { name: string | null };
    Genre: { id: string; name: string }[];
  } | null;
  ArtistProfile?: {
    id: string;
    User: { name: string | null };
  } | null;
};

type ReviewDisplayProps = {
  review: ReviewData;
  index: number;
  showControls?: boolean;
};

// ── Main component ────────────────────────────────────────────────────────────

export function ReviewDisplay({ review, index: _index, showControls = true }: ReviewDisplayProps) {
  const reviewerName =
    review.ReviewerProfile?.User?.name ?? review.ArtistProfile?.User?.name ?? "Reviewer";
  const isRestricted = review.ReviewerProfile?.isRestricted ?? false;
  const reviewerProfileId =
    !isRestricted ? (review.ReviewerProfile?.id ?? review.ArtistProfile?.id) : null;
  const reviewerTitle = review.ReviewerProfile ? getReviewerTitle(review.ReviewerProfile) : null;
  const reviewerGenres = review.ReviewerProfile?.Genre?.slice(0, 2) ?? [];
  const reviewerCount = review.ReviewerProfile?.totalReviews ?? 0;
  const quality = review.qualityLevel ? qualityConfig[review.qualityLevel as string] : null;

  const issueChips: string[] = [];
  if (review.vocalClarity === "BURIED") issueChips.push("Vocals buried");
  if (review.lowEndClarity === "BOTH_MUDDY") issueChips.push("Low end muddy");
  if (review.highEndQuality === "TOO_HARSH") issueChips.push("Highs harsh");
  if (review.stereoWidth === "TOO_NARROW") issueChips.push("Too narrow");
  if (review.dynamics === "TOO_COMPRESSED") issueChips.push("Over-compressed");
  if (review.tooRepetitive) issueChips.push("Too repetitive");
  if (review.trackLength === "WAY_TOO_LONG") issueChips.push("Too long");

  const mainFeedback = review.biggestWeaknessSpecific || review.weakestPart;

  const curve = parseCurve(review.engagementCurve ?? null);
  const hasCurve = curve.length >= 5;
  const { summary: curveSummary, insights: curveInsights } = hasCurve ? analyzeCurve(curve) : { summary: "", insights: [] };

  return (
    <article className="px-5 sm:px-6 py-6">

      {/* ── BYLINE ──────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-black/8">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar — soft circle */}
          {showControls && reviewerProfileId ? (
            <Link
              href={`/reviewers/${reviewerProfileId}`}
              className="h-9 w-9 min-w-[2.25rem] rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 hover:bg-purple-200 transition-colors flex-shrink-0"
            >
              {getInitial(reviewerName)}
            </Link>
          ) : (
            <span className="h-9 w-9 min-w-[2.25rem] rounded-full bg-black/8 flex items-center justify-center text-sm font-bold text-black/50 flex-shrink-0">
              {getInitial(reviewerName)}
            </span>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {showControls && reviewerProfileId ? (
                <Link href={`/reviewers/${reviewerProfileId}`} className="font-semibold text-sm text-black hover:text-purple-600 transition-colors">
                  {getFirstName(reviewerName)}
                </Link>
              ) : (
                <span className="font-semibold text-sm text-black">{getFirstName(reviewerName)}</span>
              )}
              {reviewerTitle && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/6 text-black/40">
                  {reviewerTitle}
                </span>
              )}
              {reviewerGenres.map((g) => (
                <span key={g.id} className="text-xs text-black/35">{g.name}</span>
              ))}
            </div>
            {reviewerCount > 0 && (
              <p className="text-xs text-black/30 mt-0.5">{reviewerCount} reviews</p>
            )}
          </div>
        </div>

        {/* Right: impression + date */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {review.firstImpression && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              review.firstImpression === "STRONG_HOOK"
                ? "bg-purple-100 text-purple-700"
                : review.firstImpression === "DECENT"
                ? "bg-amber-100 text-amber-700"
                : "bg-black/6 text-black/40"
            }`}>
              {review.firstImpression === "STRONG_HOOK" ? "Hooked"
                : review.firstImpression === "DECENT" ? "Solid"
                : "Lost Interest"}
            </span>
          )}
          <time className="text-xs text-black/30 tabular-nums">
            {review.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
          </time>
        </div>
      </header>

      {/* ── VERDICT ─────────────────────────────────────────────── */}
      {(quality || review.wouldListenAgain !== null) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {quality && (
            <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${quality.bg} ${quality.text}`}>
              {quality.label}
            </span>
          )}
          {review.wouldListenAgain !== null && (
            <span className={`text-xs font-medium px-3 py-1.5 rounded-xl ${
              review.wouldListenAgain
                ? "bg-purple-100 text-purple-700"
                : "bg-black/6 text-black/40"
            }`}>
              {review.wouldListenAgain ? "↺ Would replay" : "✕ Wouldn't replay"}
            </span>
          )}
        </div>
      )}

      {/* ── ARTIST NOTE CALLOUT ─────────────────────────────────── */}
      {review.addressedArtistNote && (
        <p className="text-xs text-black/40 italic mb-5">
          re: your note — <strong className="not-italic text-black/55">{review.addressedArtistNote}</strong>
        </p>
      )}

      {/* ── ENGAGEMENT CURVE ────────────────────────────────────── */}
      {hasCurve && (
        <div className="mb-6 rounded-xl bg-black/[0.02] border border-black/6 p-4">
          <p className="text-xs font-semibold text-black/40 mb-2">Listener Engagement</p>
          <div className="flex gap-3 mb-2 flex-wrap">
            {CURVE_LEVELS.map((l) => (
              <span key={l.value} className="flex items-center gap-1 text-[10px] text-black/40">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <MiniEngagementChart curve={curve} />
          {curveSummary && (
            <p className="text-xs text-black/50 mt-2 leading-relaxed">{curveSummary}</p>
          )}
          {curveInsights.length > 0 && (
            <ul className="mt-2 space-y-1">
              {curveInsights.map((insight, i) => (
                <li key={i} className="text-xs text-black/40 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-black/20 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── WRITTEN FEEDBACK ────────────────────────────────────── */}
      <div className="space-y-5">
        {review.bestPart && (
          <div>
            <p className="text-xs font-semibold text-black/40 mb-2">What Worked</p>
            <p className="text-sm leading-relaxed text-black/80">{review.bestPart}</p>
          </div>
        )}

        {review.quickWin && (
          <>
            <div className="border-t border-black/6" />
            <div>
              <p className="text-xs font-semibold text-black/40 mb-2">Quick Win</p>
              <p className="text-sm leading-relaxed text-black/80">{review.quickWin}</p>
            </div>
          </>
        )}

        {mainFeedback && (
          <>
            <div className="border-t border-black/6" />
            <div>
              <p className="text-xs font-semibold text-black/40 mb-2">
                {review.quickWin ? "Biggest Weakness" : "Main Feedback"}
              </p>
              <p className="text-sm leading-relaxed text-black/80">{mainFeedback}</p>
            </div>
          </>
        )}

        {review.additionalNotes && (
          <>
            <div className="border-t border-black/6" />
            <div>
              <p className="text-xs font-semibold text-black/40 mb-2">Additional Notes</p>
              <p className="text-sm leading-relaxed text-black/60">{review.additionalNotes}</p>
            </div>
          </>
        )}

        {review.nextActions && (
          <>
            <div className="border-t border-black/6" />
            <div>
              <p className="text-xs font-semibold text-black/40 mb-2">Next Actions</p>
              <p className="text-sm leading-relaxed text-black/70 whitespace-pre-wrap">{review.nextActions}</p>
            </div>
          </>
        )}
      </div>

      {/* ── TIMESTAMPS ──────────────────────────────────────────── */}
      {Array.isArray(review.timestamps) && review.timestamps.filter(isTimestampNote).length > 0 && (
        <div className="mt-6 pt-5 border-t border-black/6">
          <p className="text-xs font-semibold text-black/40 mb-3">Timestamps</p>
          <div className="space-y-2.5">
            {review.timestamps.filter(isTimestampNote).map((t, i) => (
              <div key={`${t.seconds}-${i}`} className="flex gap-3">
                <span className="text-xs font-mono text-black/30 flex-shrink-0 bg-black/[0.03] px-2 py-0.5 rounded">
                  {`${Math.floor(t.seconds / 60)}:${String(Math.floor(t.seconds % 60)).padStart(2, "0")}`}
                </span>
                <p className="text-sm text-black/60 leading-snug">{t.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DATA ROW — scores, tags, genre ──────────────────────── */}
      <div className="mt-6 pt-5 border-t border-black/8 space-y-3">
        {/* Scores */}
        {(review.productionScore != null || review.vocalScore != null || review.originalityScore != null) && (
          <div className="flex flex-wrap gap-4">
            {review.productionScore != null && (
              <div>
                <span className="text-[10px] font-medium text-black/35 block mb-0.5">Production</span>
                <span className="text-xl font-black text-black tabular-nums leading-none">{review.productionScore}<span className="text-xs text-black/30 font-medium ml-0.5">/5</span></span>
              </div>
            )}
            {review.originalityScore != null && (
              <div>
                <span className="text-[10px] font-medium text-black/35 block mb-0.5">Originality</span>
                <span className="text-xl font-black text-black tabular-nums leading-none">{review.originalityScore}<span className="text-xs text-black/30 font-medium ml-0.5">/5</span></span>
              </div>
            )}
            {review.vocalScore != null && (
              <div>
                <span className="text-[10px] font-medium text-black/35 block mb-0.5">Vocals</span>
                <span className="text-xl font-black text-black tabular-nums leading-none">{review.vocalScore}<span className="text-xs text-black/30 font-medium ml-0.5">/5</span></span>
              </div>
            )}
          </div>
        )}

        {/* Issue chips */}
        {issueChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {issueChips.map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                ⚠ {chip}
              </span>
            ))}
          </div>
        )}

        {/* Next focus / expected placement */}
        {(review.nextFocus || review.expectedPlacement) && (
          <div className="flex flex-wrap gap-2">
            {review.nextFocus && (
              <span className="px-2.5 py-1 rounded-full bg-black/[0.04] text-xs font-medium text-black/60">
                Focus: {formatEnum(review.nextFocus)}
              </span>
            )}
            {review.expectedPlacement && (
              <span className="px-2.5 py-1 rounded-full bg-black/[0.04] text-xs font-medium text-black/60">
                {formatEnum(review.expectedPlacement)}
              </span>
            )}
          </div>
        )}

        {/* Genre / similar artists */}
        {(review.perceivedGenre || review.similarArtists) && (
          <p className="text-xs text-black/35">
            {review.perceivedGenre && <span>Sounds like <strong className="text-black/50 font-medium">{review.perceivedGenre}</strong></span>}
            {review.perceivedGenre && review.similarArtists && <span className="mx-1.5 text-black/20">·</span>}
            {review.similarArtists && <span>Similar to <strong className="text-black/50 font-medium">{review.similarArtists}</strong></span>}
          </p>
        )}
      </div>

      {/* ── RATE THIS FEEDBACK ──────────────────────────────────── */}
      {showControls && (
        <footer className="mt-6 pt-5 border-t border-black/8 space-y-4">
          <div className="flex items-center gap-3">
            <ReviewRating reviewId={review.id} initialRating={review.artistRating ?? null} />
            <span className="text-xs text-black/40">Rate this review</span>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-black/[0.02] border border-black/6 p-4">
            <ReviewGem reviewId={review.id} initialIsGem={review.isGem ?? false} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-black">Award a Gem for exceptional feedback</p>
              <p className="text-xs text-black/40 mt-0.5 leading-relaxed">
                Gems reward reviewers who go above and beyond. They&apos;ll earn recognition and priority in future reviews.
              </p>
            </div>
          </div>
          <ReviewFlag reviewId={review.id} wasFlagged={review.wasFlagged} flagReason={review.flagReason} />
        </footer>
      )}
    </article>
  );
}
