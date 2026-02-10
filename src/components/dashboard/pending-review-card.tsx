import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GenreTagList } from "@/components/ui/genre-tag";
import { PendingPeerReview } from "@/types/dashboard";
import { formatRelativeDate } from "@/lib/utils";
import { Headphones } from "lucide-react";

interface PendingReviewCardProps {
  review: PendingPeerReview;
}

export function PendingReviewCard({ review }: PendingReviewCardProps) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 ease-out hover:shadow-md motion-reduce:transition-none">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="h-12 w-12 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
          <Headphones className="h-5 w-5 text-purple-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-black truncate">
            {review.track.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-black/50 truncate">
              by {review.track.artist?.artistName ?? "Unknown"}
            </p>
            <span className="text-xs text-black/30">•</span>
            <p className="text-xs text-black/40">
              {formatRelativeDate(review.createdAt)}
            </p>
          </div>
          {review.track.Genre && review.track.Genre.length > 0 && (
            <div className="mt-1">
              <GenreTagList
                genres={review.track.Genre}
                variant="neutral"
                size="sm"
                maxDisplay={2}
              />
            </div>
          )}
        </div>
      </div>
      <Link href={`/review/${review.id}`}>
        <Button
          size="sm"
          className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150 ease-out motion-reduce:transition-none"
        >
          Review
        </Button>
      </Link>
    </div>
  );
}
