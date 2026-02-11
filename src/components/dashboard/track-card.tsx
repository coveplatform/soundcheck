import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GenreTagList } from "@/components/ui/genre-tag";
import { TrackPlayButton } from "@/components/dashboard/track-play-button";
import { DashboardTrack } from "@/types/dashboard";
import {
  getTrackStatusBadge,
  formatReviewCount,
  getTrackAction,
} from "@/lib/utils";
import { Music, MessageCircle } from "lucide-react";

interface TrackCardProps {
  track: DashboardTrack;
  priority?: boolean;
  compact?: boolean;
}

export function TrackCard({ track, priority = false, compact = false }: TrackCardProps) {
  const badge = getTrackStatusBadge(track.status);
  const completed = track.Review.filter((r) => r.status === "COMPLETED").length;
  const reviewCount = formatReviewCount(completed, track.reviewsRequested);
  const action = getTrackAction(track);
  const hasFeedback = completed > 0 && (track.status === "IN_PROGRESS" || track.status === "COMPLETED");

  return (
    <div className={`group flex items-center gap-3 sm:gap-4 rounded-2xl border border-black/8 bg-white px-3 sm:px-4 py-3 transition-colors duration-150 ease-out hover:bg-white/90 hover:border-black/12 motion-reduce:transition-none ${compact ? '' : 'sm:py-4'}`}>
      {/* Artwork */}
      <div className="relative flex-shrink-0">
        <div className={`${compact ? 'w-11 h-11 sm:w-12 sm:h-12 rounded-lg' : 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl'} overflow-hidden bg-neutral-100 border border-black/5`}>
          {track.artworkUrl ? (
            <Image
              src={track.artworkUrl}
              alt={track.title}
              width={compact ? 48 : 64}
              height={compact ? 48 : 64}
              priority={priority}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
              <Music className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} text-neutral-400`} />
            </div>
          )}
        </div>
        {!compact && track.sourceUrl && <TrackPlayButton audioUrl={track.sourceUrl} />}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-black truncate`}>
          {track.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span
            className={`text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-[10px] font-mono text-black/40">
            {reviewCount}
          </span>
          {hasFeedback && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
              <MessageCircle className="h-2.5 w-2.5" />
              {completed} new
            </span>
          )}
        </div>
        {!compact && track.Genre && track.Genre.length > 0 && (
          <div className="mt-1.5">
            <GenreTagList
              genres={track.Genre}
              variant="neutral"
              size="sm"
              maxDisplay={3}
            />
          </div>
        )}
      </div>

      {/* Action */}
      <Link href={action.href} className="flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="border-black/15 text-black hover:bg-black/5 hover:border-black/25 transition-colors duration-150 ease-out motion-reduce:transition-none text-xs px-2.5"
        >
          {hasFeedback ? "View feedback" : <><span className="hidden sm:inline">{action.label}</span><span className="sm:hidden">View</span></>}
        </Button>
      </Link>
    </div>
  );
}
