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
import { Music } from "lucide-react";

interface TrackCardProps {
  track: DashboardTrack;
  priority?: boolean;
}

export function TrackCard({ track, priority = false }: TrackCardProps) {
  const badge = getTrackStatusBadge(track.status);
  const completed = track.Review.filter((r) => r.status === "COMPLETED").length;
  const reviewCount = formatReviewCount(completed, track.reviewsRequested);
  const action = getTrackAction(track);

  return (
    <div className="group flex items-center gap-3 sm:gap-5 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 ease-out hover:shadow-md motion-reduce:transition-none">
      {/* Artwork */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-neutral-100 border border-black/5">
          {track.artworkUrl ? (
            <Image
              src={track.artworkUrl}
              alt={track.title}
              width={64}
              height={64}
              priority={priority}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
              <Music className="h-6 w-6 text-neutral-400" />
            </div>
          )}
        </div>
        {track.sourceUrl && <TrackPlayButton audioUrl={track.sourceUrl} />}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-black truncate">
          {track.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className={`text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-[11px] font-mono text-black/40">
            {reviewCount}
          </span>
        </div>
        {track.Genre && track.Genre.length > 0 && (
          <div className="mt-2">
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
      <Link href={action.href}>
        <Button
          variant="outline"
          size="sm"
          className="border-black/20 text-black hover:bg-black/5 hover:border-black/30 transition-colors duration-150 ease-out motion-reduce:transition-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {action.label}
        </Button>
      </Link>
    </div>
  );
}
