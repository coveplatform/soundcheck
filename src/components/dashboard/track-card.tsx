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
  // Only show "new" badge for reviews completed after last viewed
  const completedReviews = track.Review.filter((r) => r.status === "COMPLETED");
  const newFeedbackCount = completedReviews.filter((r) => {
    if (!track.feedbackViewedAt) return true;
    return new Date(r.createdAt).getTime() > new Date(track.feedbackViewedAt).getTime();
  }).length;
  const hasFeedback = newFeedbackCount > 0;

  return (
    <div className="group flex items-stretch gap-0 rounded-xl border border-black/8 bg-white overflow-hidden transition-all duration-150 ease-out hover:border-black/12 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:translate-y-0 active:shadow-none motion-reduce:transition-none motion-reduce:transform-none">
      {/* Artwork */}
      <div className={`${compact ? 'w-16 sm:w-[72px]' : 'w-20 sm:w-[100px]'} flex-shrink-0 self-stretch relative bg-neutral-100`}>
        {track.artworkUrl ? (
          <Image
            src={track.artworkUrl}
            alt={track.title}
            fill
            priority={priority}
            className="object-cover"
            sizes={compact ? "72px" : "100px"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-5 w-5 text-neutral-400" />
          </div>
        )}
      </div>

      {/* Track Info + Action */}
      <div className="flex items-center justify-between gap-3 flex-1 min-w-0 px-3 sm:px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-black truncate">
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
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-lime-700 bg-lime-50 px-1.5 py-0.5 rounded-full">
                <MessageCircle className="h-2.5 w-2.5" />
                {newFeedbackCount} new
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
    </div>
  );
}
