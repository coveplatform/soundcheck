"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Music, MessageSquare, ChevronDown, ThumbsUp, ThumbsDown,
  User, ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────

const NEXT_FOCUS_LABELS: Record<string, string> = {
  MIXING:            "Mixing",
  ARRANGEMENT:       "Arrangement",
  SOUND_DESIGN:      "Sound Design",
  SONGWRITING:       "Songwriting",
  PERFORMANCE:       "Performance",
  READY_TO_RELEASE:  "Ready to Release",
};

const QUALITY_CONFIG: Record<string, { label: string; bg: string; text: string; order: number }> = {
  PROFESSIONAL:  { label: "Professional",  bg: "bg-purple-100", text: "text-purple-700", order: 5 },
  RELEASE_READY: { label: "Release Ready", bg: "bg-emerald-100", text: "text-emerald-700", order: 4 },
  ALMOST_THERE:  { label: "Almost There",  bg: "bg-amber-100",  text: "text-amber-700",  order: 3 },
  DEMO_STAGE:    { label: "Demo Stage",    bg: "bg-orange-100", text: "text-orange-700", order: 2 },
  NOT_READY:     { label: "Needs Work",    bg: "bg-red-100",    text: "text-red-600",    order: 1 },
};

const QUALITY_ORDER: Record<string, number> = {
  PROFESSIONAL: 5, RELEASE_READY: 4, ALMOST_THERE: 3, DEMO_STAGE: 2, NOT_READY: 1,
};

const STATUS_ORDER: Record<string, number> = {
  IN_PROGRESS: 0, QUEUED: 1, UPLOADED: 2, COMPLETED: 3, PENDING_PAYMENT: 4, CANCELLED: 5,
};

// ── Types ──────────────────────────────────────────────────────────────────

type SortKey = "title" | "status" | "reviews" | "hookRate" | "quality" | "listenAgain";

interface ReviewDetail {
  id: string;
  productionScore: number | null;
  wouldListenAgain: boolean | null;
  firstImpression: string | null;
  qualityLevel: string | null;
  nextFocus: string | null;
  bestPart: string | null;
  weakestPart: string | null;
  reviewerName: string;
  createdAt: string | null;
}

interface TrackStat {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  genreName: string | null;
  reviewsRequested: number;
  reviewsCompleted: number;
  avgProduction: number | null;
  overallAvg: number | null;
  wouldListenAgainPct: number | null;
  hookRate: number | null;
  qualityConsensus: string | null;
  createdAt: Date;
  reviews: ReviewDetail[];
}

interface CareerStats {
  trajectory: Array<{ title: string; score: number }>;
  topNextFocus: string | null;
  overallListenAgain: number | null;
  totalReviews: number;
}

interface TrackStatsViewProps {
  tracks: TrackStat[];
  career: CareerStats | null;
}

// ── Small components ───────────────────────────────────────────────────────

function QualityBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-black/20">—</span>;
  const cfg = QUALITY_CONFIG[value];
  if (!cfg) return null;
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", cfg.bg, cfg.text)}>
      {cfg.label}
    </span>
  );
}

function HookRateCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-black/20">—</span>;
  const color = value >= 60 ? "text-emerald-600" : value >= 35 ? "text-amber-600" : "text-black/40";
  const barColor = value >= 60 ? "bg-emerald-400" : value >= 35 ? "bg-amber-400" : "bg-black/15";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-black/5 rounded-full overflow-hidden flex-shrink-0">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-xs font-bold tabular-nums", color)}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Done</span>;
    case "QUEUED":         return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Queued</span>;
    case "IN_PROGRESS":    return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Reviewing</span>;
    case "UPLOADED":       return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">Uploaded</span>;
    case "PENDING_PAYMENT":return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">Pending</span>;
    case "CANCELLED":      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-600">Cancelled</span>;
    default:               return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">{status}</span>;
  }
}

function SortHeader({
  label, icon, sortKey, activeSortKey, sortAsc, onSort, className,
}: {
  label?: string; icon?: React.ReactNode; sortKey: SortKey;
  activeSortKey: SortKey | null; sortAsc: boolean;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const isActive = activeSortKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 group transition-colors",
        isActive ? "text-purple-600" : "text-black/30 hover:text-black/60",
        className,
      )}
    >
      {label && <span>{label}</span>}
      {icon}
      {isActive
        ? sortAsc ? <ArrowUp className="h-3 w-3 flex-shrink-0" /> : <ArrowDown className="h-3 w-3 flex-shrink-0" />
        : <ArrowUpDown className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
      }
    </button>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Career Banner ──────────────────────────────────────────────────────────

function CareerBanner({ career }: { career: CareerStats }) {
  const { trajectory, topNextFocus, overallListenAgain, totalReviews } = career;

  const hasTrajectory = trajectory.length >= 2;
  const firstScore = trajectory[0]?.score ?? 0;
  const lastScore = trajectory[trajectory.length - 1]?.score ?? 0;
  const trendUp = hasTrajectory && lastScore > firstScore;
  const trendPct = hasTrajectory && firstScore > 0
    ? Math.round(((lastScore - firstScore) / firstScore) * 100)
    : 0;

  return (
    <div className="rounded-2xl bg-[#0d0d0d] overflow-hidden mb-6">
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40">Your Progress</p>
      </div>

      {/* 3 headline numbers */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
        <div className="px-4 sm:px-5 py-5">
          <p className="text-3xl sm:text-4xl font-black text-white tabular-nums leading-none">{totalReviews}</p>
          <p className="text-[10px] font-medium text-white/35 mt-2">total reviews</p>
        </div>
        <div className="px-4 sm:px-5 py-5">
          <p className={cn(
            "text-3xl sm:text-4xl font-black tabular-nums leading-none",
            overallListenAgain === null ? "text-white/20"
            : overallListenAgain >= 70 ? "text-lime-400"
            : overallListenAgain >= 40 ? "text-white"
            : "text-white/50",
          )}>
            {overallListenAgain !== null ? `${overallListenAgain}%` : "—"}
          </p>
          <p className="text-[10px] font-medium text-white/35 mt-2">would listen again</p>
        </div>
        <div className="px-4 sm:px-5 py-5">
          <p className={cn(
            "text-3xl sm:text-4xl font-black tabular-nums leading-none",
            !hasTrajectory ? "text-white/20"
            : trendUp ? "text-lime-400"
            : trendPct < 0 ? "text-white/40"
            : "text-white/60",
          )}>
            {hasTrajectory ? (trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`) : "—"}
          </p>
          <p className="text-[10px] font-medium text-white/35 mt-2">production growth</p>
        </div>
      </div>

      {/* Production trajectory */}
      {hasTrajectory && (
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/25 mb-3">Production across tracks</p>
          <div className="flex items-start gap-3 flex-wrap">
            {trajectory.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl font-black text-white tabular-nums leading-none">{t.score.toFixed(1)}</span>
                  <span className="text-[9px] text-white/25 max-w-[64px] truncate text-center leading-tight">{t.title}</span>
                </div>
                {i < trajectory.length - 1 && (
                  <span className="text-white/15 text-sm mt-0.5">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring focus */}
      {topNextFocus && (
        <div className="px-5 py-3.5">
          {topNextFocus === "READY_TO_RELEASE" ? (
            <p className="text-xs text-white/40">
              Reviewers say your tracks are{" "}
              <span className="font-black text-lime-400">ready to release</span>
            </p>
          ) : (
            <p className="text-xs text-white/40">
              Reviewers consistently say: focus on{" "}
              <span className="font-black text-white">{NEXT_FOCUS_LABELS[topNextFocus] ?? topNextFocus}</span>
              {" "}across your tracks
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const GRID = "sm:grid-cols-[1fr_80px_60px_90px_140px_80px]";

export function TrackStatsView({ tracks, career }: TrackStatsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const tracksWithReviews = tracks.filter((t) => t.reviewsCompleted > 0);

  const sorted = [...tracks].sort((a, b) => {
    if (!sortKey) {
      if (a.reviewsCompleted > 0 && b.reviewsCompleted === 0) return -1;
      if (a.reviewsCompleted === 0 && b.reviewsCompleted > 0) return 1;
      return 0;
    }
    let aVal: string | number, bVal: string | number;
    switch (sortKey) {
      case "title":       aVal = a.title.toLowerCase();                           bVal = b.title.toLowerCase();                           break;
      case "status":      aVal = STATUS_ORDER[a.status] ?? 99;                    bVal = STATUS_ORDER[b.status] ?? 99;                    break;
      case "reviews":     aVal = a.reviewsCompleted;                              bVal = b.reviewsCompleted;                              break;
      case "hookRate":    aVal = a.hookRate ?? -1;                                bVal = b.hookRate ?? -1;                                break;
      case "quality":     aVal = QUALITY_ORDER[a.qualityConsensus ?? ""] ?? -1;   bVal = QUALITY_ORDER[b.qualityConsensus ?? ""] ?? -1;   break;
      case "listenAgain": aVal = a.wouldListenAgainPct ?? -1;                     bVal = b.wouldListenAgainPct ?? -1;                     break;
      default: return 0;
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  if (tracks.length === 0) {
    return (
      <div className="text-center py-16">
        <Music className="h-8 w-8 text-black/15 mx-auto mb-3" />
        <p className="text-sm text-black/40">No tracks yet. Upload a track to get started.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Career banner */}
      {career && career.totalReviews > 0 && <CareerBanner career={career} />}

      {/* Summary cards */}
      {tracksWithReviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-2xl font-black text-black">{tracks.length}</p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Tracks</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-2xl font-black text-black">
              {tracksWithReviews.reduce((sum, t) => sum + t.reviewsCompleted, 0)}
            </p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Reviews received</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-2xl font-black text-black">
              {(() => {
                const hooks = tracksWithReviews.filter(t => t.hookRate !== null);
                return hooks.length > 0
                  ? Math.round(hooks.reduce((s, t) => s + t.hookRate!, 0) / hooks.length) + "%"
                  : "—";
              })()}
            </p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Avg hook rate</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-2xl font-black text-black">
              {(() => {
                const pcts = tracksWithReviews.filter(t => t.wouldListenAgainPct !== null);
                return pcts.length > 0
                  ? Math.round(pcts.reduce((s, t) => s + t.wouldListenAgainPct!, 0) / pcts.length) + "%"
                  : "—";
              })()}
            </p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Would listen again</p>
          </div>
        </div>
      )}

      {/* Track table */}
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        {/* Header */}
        <div className={cn("hidden sm:grid gap-3 px-4 py-2.5 bg-neutral-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-[0.15em]", GRID)}>
          <SortHeader label="Track"      sortKey="title"       activeSortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortHeader label="Status"     sortKey="status"      activeSortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortHeader icon={<MessageSquare className="h-3 w-3" />} sortKey="reviews" activeSortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortHeader label="Hook Rate"  sortKey="hookRate"    activeSortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortHeader label="Quality"    sortKey="quality"     activeSortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortHeader icon={<ThumbsUp className="h-3 w-3" />} sortKey="listenAgain" activeSortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
        </div>

        {/* Rows */}
        {sorted.map((track, i) => {
          const isExpanded = expandedId === track.id;
          const hasReviews = track.reviewsCompleted > 0;

          return (
            <div key={track.id} className={cn(i > 0 && "border-t border-black/[0.03]")}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : track.id)}
                className={cn(
                  "w-full text-left px-4 py-3 sm:grid gap-3 items-center transition-colors",
                  GRID,
                  isExpanded ? "bg-purple-50/40" : "hover:bg-purple-50/20",
                  !hasReviews && "cursor-default",
                )}
                disabled={!hasReviews}
              >
                {/* Track */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden relative">
                    {track.artworkUrl
                      ? <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="40px" />
                      : <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-black/15" /></div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-black truncate">{track.title}</p>
                      {hasReviews && (
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 text-black/20 flex-shrink-0 transition-transform duration-200",
                          isExpanded && "rotate-180",
                        )} />
                      )}
                    </div>
                    {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                  </div>
                </div>

                {/* Status */}
                <div className="hidden sm:flex items-center"><StatusBadge status={track.status} /></div>

                {/* Reviews */}
                <div className="hidden sm:flex items-center">
                  {hasReviews
                    ? <span className="text-xs font-bold text-black/60 tabular-nums">{track.reviewsCompleted}<span className="text-black/25">/{track.reviewsRequested}</span></span>
                    : <span className="text-xs text-black/20">0</span>
                  }
                </div>

                {/* Hook rate */}
                <div className="hidden sm:flex items-center"><HookRateCell value={track.hookRate} /></div>

                {/* Quality verdict */}
                <div className="hidden sm:flex items-center"><QualityBadge value={track.qualityConsensus} /></div>

                {/* Listen again */}
                <div className="hidden sm:block">
                  {track.wouldListenAgainPct !== null
                    ? <span className={cn(
                        "text-xs font-bold tabular-nums",
                        track.wouldListenAgainPct >= 70 ? "text-emerald-600"
                        : track.wouldListenAgainPct >= 40 ? "text-amber-600"
                        : "text-red-500",
                      )}>{Math.round(track.wouldListenAgainPct)}%</span>
                    : <span className="text-xs text-black/20">—</span>
                  }
                </div>

                {/* Mobile summary */}
                <div className="flex items-center gap-3 mt-2 sm:hidden">
                  <StatusBadge status={track.status} />
                  {hasReviews && (
                    <>
                      <span className="text-[11px] text-black/40 flex items-center gap-0.5">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {track.reviewsCompleted}/{track.reviewsRequested}
                      </span>
                      {track.hookRate !== null && (
                        <span className="text-[11px] font-semibold text-black/50">{track.hookRate}% hooked</span>
                      )}
                    </>
                  )}
                  {!hasReviews && <span className="text-[11px] text-black/25">No reviews yet</span>}
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && hasReviews && (
                <div className="border-t border-black/5 bg-neutral-50/50">
                  <div className="max-h-96 overflow-y-auto divide-y divide-black/[0.03]">
                    {track.reviews.map((review, ri) => (
                      <div key={review.id} className="px-4 sm:px-6 py-4">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-black/5 flex items-center justify-center">
                              <User className="h-3 w-3 text-black/30" />
                            </div>
                            <span className="text-xs font-bold text-black/60">{review.reviewerName}</span>
                            {review.createdAt && <span className="text-[10px] text-black/25">{formatDate(review.createdAt)}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {review.qualityLevel && <QualityBadge value={review.qualityLevel} />}
                            {review.nextFocus && review.nextFocus !== "READY_TO_RELEASE" && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.06] text-black/50">
                                Focus: {NEXT_FOCUS_LABELS[review.nextFocus] ?? review.nextFocus}
                              </span>
                            )}
                            {review.wouldListenAgain !== null && (
                              review.wouldListenAgain
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><ThumbsUp className="h-3 w-3" /> Again</span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500"><ThumbsDown className="h-3 w-3" /> Wouldn&apos;t replay</span>
                            )}
                          </div>
                        </div>

                        {/* First impression */}
                        {review.firstImpression && (
                          <div className="mb-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              review.firstImpression === "STRONG_HOOK" ? "text-purple-600"
                              : review.firstImpression === "LOST_INTEREST" ? "text-red-500"
                              : "text-black/30",
                            )}>
                              {review.firstImpression === "STRONG_HOOK" ? "⚡ Strong hook"
                               : review.firstImpression === "LOST_INTEREST" ? "Lost interest"
                               : "Decent"}
                            </span>
                          </div>
                        )}

                        {/* Feedback text */}
                        <div className="space-y-2">
                          {review.bestPart && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/60 mb-0.5">Best moment</p>
                              <p className="text-xs text-black/60 leading-relaxed">{review.bestPart}</p>
                            </div>
                          )}
                          {review.weakestPart && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/60 mb-0.5">Main feedback</p>
                              <p className="text-xs text-black/60 leading-relaxed">{review.weakestPart}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
