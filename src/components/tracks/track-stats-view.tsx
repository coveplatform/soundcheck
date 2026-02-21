import Link from "next/link";
import Image from "next/image";
import { Music, MessageSquare, ArrowRight, Headphones, ThumbsUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function TrackStatsView({ tracks }: TrackStatsViewProps) {
  const tracksWithReviews = tracks.filter((t) => t.reviewsCompleted > 0);
  const tracksWithoutReviews = tracks.filter((t) => t.reviewsCompleted === 0);

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
        <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_100px_100px_80px_40px] gap-3 px-4 py-2.5 bg-neutral-50 border-b border-black/5 text-[10px] font-bold uppercase tracking-[0.15em] text-black/30">
          <span>Track</span>
          <span>Status</span>
          <span>Production</span>
          <span>Originality</span>
          <span>Vocal</span>
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /></span>
          <span></span>
        </div>

        {/* Rows — tracks with reviews first */}
        {[...tracksWithReviews, ...tracksWithoutReviews].map((track, i) => (
          <Link
            key={track.id}
            href={`/tracks/${track.id}`}
            className={cn(
              "group block sm:grid sm:grid-cols-[1fr_80px_100px_100px_100px_80px_40px] gap-3 px-4 py-3 items-center transition-colors hover:bg-purple-50/30",
              i > 0 && "border-t border-black/[0.03]"
            )}
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
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate group-hover:text-purple-700 transition-colors">{track.title}</p>
                <div className="flex items-center gap-2">
                  {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                  {track.reviewsCompleted > 0 && (
                    <span className="text-[11px] text-black/30 flex items-center gap-0.5 sm:hidden">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {track.reviewsCompleted}/{track.reviewsRequested}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="hidden sm:flex items-center">
              <StatusBadge status={track.status} />
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

            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-end">
              <ArrowRight className="h-3.5 w-3.5 text-black/15 group-hover:text-purple-500 transition-colors" />
            </div>

            {/* Mobile scores row */}
            {track.reviewsCompleted > 0 && (
              <div className="flex items-center gap-4 mt-2 sm:hidden">
                <StatusBadge status={track.status} />
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-black/20" />
                  <span className="text-xs font-semibold text-black/60">{track.overallAvg?.toFixed(1) ?? "—"}</span>
                </div>
                {track.wouldListenAgainPct !== null && (
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-black/20" />
                    <span className="text-xs font-semibold text-black/60">{Math.round(track.wouldListenAgainPct)}%</span>
                  </div>
                )}
              </div>
            )}
            {track.reviewsCompleted === 0 && (
              <div className="flex items-center gap-2 mt-2 sm:hidden">
                <StatusBadge status={track.status} />
                <span className="text-[11px] text-black/25">No reviews yet</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
