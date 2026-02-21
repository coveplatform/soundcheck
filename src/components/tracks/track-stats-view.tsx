"use client";

import { useState } from "react";
import Image from "next/image";
import { Music, MessageSquare, ChevronDown, ThumbsUp, ThumbsDown, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewDetail {
  id: string;
  productionScore: number | null;
  originalityScore: number | null;
  vocalScore: number | null;
  wouldListenAgain: boolean | null;
  firstImpression: string | null;
  bestPart: string | null;
  weakestPart: string | null;
  additionalNotes: string | null;
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
  avgOriginality: number | null;
  avgVocal: number | null;
  overallAvg: number | null;
  wouldListenAgainPct: number | null;
  createdAt: Date;
  reviews: ReviewDetail[];
}

interface TrackStatsViewProps {
  tracks: TrackStat[];
}

function ScoreBar({ value, max = 10 }: { value: number | null; max?: number }) {
  if (value === null) return <span className="text-xs text-black/20">—</span>;
  const pct = (value / max) * 100;
  const color =
    value >= 8 ? "bg-emerald-500" :
    value >= 6 ? "bg-lime-500" :
    value >= 4 ? "bg-amber-400" :
    "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-black/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-black/70 tabular-nums w-7">{value.toFixed(1)}</span>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const color =
    value >= 8 ? "bg-emerald-100 text-emerald-700" :
    value >= 6 ? "bg-lime-100 text-lime-700" :
    value >= 4 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-600";
  return (
    <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold", color)}>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
      {value}/10
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Done</span>;
    case "QUEUED":
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Queued</span>;
    case "IN_PROGRESS":
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Reviewing</span>;
    case "UPLOADED":
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">Uploaded</span>;
    case "PENDING_PAYMENT":
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">Pending</span>;
    case "CANCELLED":
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-600">Cancelled</span>;
    default:
      return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">{status}</span>;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrackStatsView({ tracks }: TrackStatsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tracksWithReviews = tracks.filter((t) => t.reviewsCompleted > 0);
  const tracksWithoutReviews = tracks.filter((t) => t.reviewsCompleted === 0);
  const sorted = [...tracksWithReviews, ...tracksWithoutReviews];

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
      {/* Summary cards */}
      {tracksWithReviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-2xl font-black text-black">{tracks.length}</p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Total tracks</p>
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
                const avgs = tracksWithReviews.filter((t) => t.overallAvg !== null).map((t) => t.overallAvg!);
                return avgs.length > 0 ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1) : "—";
              })()}
            </p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Avg score</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 p-4">
            <p className="text-2xl font-black text-black">
              {(() => {
                const pcts = tracksWithReviews.filter((t) => t.wouldListenAgainPct !== null).map((t) => t.wouldListenAgainPct!);
                return pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) + "%" : "—";
              })()}
            </p>
            <p className="text-xs text-black/40 font-medium mt-0.5">Would listen again</p>
          </div>
        </div>
      )}

      {/* Track stats table */}
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_80px_60px_100px_100px_100px_80px] gap-3 px-4 py-2.5 bg-neutral-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-[0.15em] text-black/30">
          <span>Track</span>
          <span>Status</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /></span>
          <span>Production</span>
          <span>Originality</span>
          <span>Vocal</span>
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /></span>
        </div>

        {/* Rows */}
        {sorted.map((track, i) => {
          const isExpanded = expandedId === track.id;
          const hasReviews = track.reviewsCompleted > 0;

          return (
            <div key={track.id} className={cn(i > 0 && "border-t border-black/[0.03]")}>
              {/* Row header — clickable */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : track.id)}
                className={cn(
                  "w-full text-left px-4 py-3 sm:grid sm:grid-cols-[1fr_80px_60px_100px_100px_100px_80px] gap-3 items-center transition-colors",
                  isExpanded ? "bg-purple-50/40" : "hover:bg-purple-50/20",
                  hasReviews && "cursor-pointer"
                )}
                disabled={!hasReviews}
              >
                {/* Track info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden relative">
                    {track.artworkUrl ? (
                      <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-4 w-4 text-black/15" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-black truncate">{track.title}</p>
                      {hasReviews && (
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 text-black/20 flex-shrink-0 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="hidden sm:flex items-center">
                  <StatusBadge status={track.status} />
                </div>

                {/* Review count */}
                <div className="hidden sm:flex items-center">
                  {hasReviews ? (
                    <span className="text-xs font-bold text-black/60 tabular-nums">
                      {track.reviewsCompleted}<span className="text-black/25">/{track.reviewsRequested}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-black/20">0</span>
                  )}
                </div>

                {/* Scores */}
                <div className="hidden sm:block"><ScoreBar value={track.avgProduction} /></div>
                <div className="hidden sm:block"><ScoreBar value={track.avgOriginality} /></div>
                <div className="hidden sm:block"><ScoreBar value={track.avgVocal} /></div>

                {/* Would listen again */}
                <div className="hidden sm:block">
                  {track.wouldListenAgainPct !== null ? (
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      track.wouldListenAgainPct >= 70 ? "text-emerald-600" :
                      track.wouldListenAgainPct >= 40 ? "text-amber-600" :
                      "text-red-500"
                    )}>
                      {Math.round(track.wouldListenAgainPct)}%
                    </span>
                  ) : (
                    <span className="text-xs text-black/20">—</span>
                  )}
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
                      <span className="text-[11px] font-semibold text-black/50 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        {track.overallAvg?.toFixed(1) ?? "—"}
                      </span>
                    </>
                  )}
                  {!hasReviews && <span className="text-[11px] text-black/25">No reviews yet</span>}
                </div>
              </button>

              {/* Expanded reviews panel */}
              {isExpanded && hasReviews && (
                <div className="border-t border-black/5 bg-neutral-50/50">
                  <div className="max-h-96 overflow-y-auto divide-y divide-black/[0.03]">
                    {track.reviews.map((review, ri) => {
                      const avg = [review.productionScore, review.originalityScore, review.vocalScore]
                        .filter((s): s is number => s !== null);
                      const reviewAvg = avg.length > 0 ? avg.reduce((a, b) => a + b, 0) / avg.length : null;

                      return (
                        <div key={review.id} className="px-4 sm:px-6 py-4">
                          {/* Review header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-black/5 flex items-center justify-center">
                                <User className="h-3 w-3 text-black/30" />
                              </div>
                              <span className="text-xs font-bold text-black/60">{review.reviewerName}</span>
                              <span className="text-[10px] text-black/25">Review {ri + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {review.wouldListenAgain !== null && (
                                review.wouldListenAgain ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                    <ThumbsUp className="h-3 w-3" /> Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                                    <ThumbsDown className="h-3 w-3" /> No
                                  </span>
                                )
                              )}
                              {review.createdAt && (
                                <span className="text-[10px] text-black/25">{formatDate(review.createdAt)}</span>
                              )}
                            </div>
                          </div>

                          {/* Score pills */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <ScorePill label="Prod" value={review.productionScore} />
                            <ScorePill label="Orig" value={review.originalityScore} />
                            <ScorePill label="Vocal" value={review.vocalScore} />
                            {reviewAvg !== null && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-black/5 text-black/50">
                                <span className="text-[10px] font-medium opacity-70">Avg</span>
                                {reviewAvg.toFixed(1)}
                              </div>
                            )}
                          </div>

                          {/* Feedback text */}
                          <div className="space-y-2">
                            {review.firstImpression && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-black/25 mb-0.5">First impression</p>
                                <p className="text-xs text-black/60 capitalize">{review.firstImpression.toLowerCase().replace(/_/g, " ")}</p>
                              </div>
                            )}
                            {review.bestPart && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/60 mb-0.5">Best part</p>
                                <p className="text-xs text-black/60 leading-relaxed">{review.bestPart}</p>
                              </div>
                            )}
                            {review.weakestPart && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/60 mb-0.5">Weakest part</p>
                                <p className="text-xs text-black/60 leading-relaxed">{review.weakestPart}</p>
                              </div>
                            )}
                            {review.additionalNotes && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-black/25 mb-0.5">Notes</p>
                                <p className="text-xs text-black/60 leading-relaxed">{review.additionalNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
