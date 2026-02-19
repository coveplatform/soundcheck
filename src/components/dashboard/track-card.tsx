import Link from "next/link";
import Image from "next/image";
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

export function TrackCard({ track, priority = false }: TrackCardProps) {
  const badge = getTrackStatusBadge(track.status);
  const completed = track.Review.filter((r) => r.status === "COMPLETED").length;
  const reviewCount = formatReviewCount(completed, track.reviewsRequested);
  const action = getTrackAction(track);
  const completedReviews = track.Review.filter((r) => r.status === "COMPLETED");
  const newFeedbackCount = completedReviews.filter((r) => {
    if (!track.feedbackViewedAt) return true;
    return new Date(r.createdAt).getTime() > new Date(track.feedbackViewedAt).getTime();
  }).length;
  const hasFeedback = newFeedbackCount > 0;

  return (
    <Link href={action.href} className="block group">
      <div className="rounded-xl border border-black/8 bg-white overflow-hidden transition-all duration-150 ease-out hover:border-black/12 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:translate-y-0 active:shadow-none motion-reduce:transition-none motion-reduce:transform-none">
        {/* Square artwork */}
        <div className="relative aspect-square bg-neutral-100">
          {track.artworkUrl ? (
            <Image
              src={track.artworkUrl}
              alt={track.title}
              fill
              priority={priority}
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-8 w-8 text-neutral-400" />
            </div>
          )}
          {hasFeedback && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white bg-lime-500 px-1.5 py-0.5 rounded-full shadow-sm">
                <MessageCircle className="h-2.5 w-2.5" />
                {newFeedbackCount}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5">
          <p className="text-xs font-semibold text-black truncate leading-tight mb-1.5">
            {track.title}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[9px] font-mono tracking-[0.12em] uppercase px-1.5 py-0.5 rounded-full border flex-shrink-0 ${badge.className}`}
            >
              {badge.label}
            </span>
            <span className="text-[9px] font-mono text-black/40">
              {reviewCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
