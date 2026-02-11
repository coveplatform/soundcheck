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
    <div className="group flex items-center gap-3 sm:gap-4 rounded-2xl border border-black/8 bg-white px-3 sm:px-4 py-3 transition-colors duration-150 ease-out hover:bg-white/90 hover:border-black/12 motion-reduce:transition-none">
      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
        <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-black truncate">
          {review.Track.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-black/40 truncate">
            by {review.Track.ArtistProfile?.artistName ?? "Unknown"}
          </p>
          <span className="text-[10px] text-black/20">•</span>
          <p className="text-[10px] text-black/30">
            {formatRelativeDate(review.createdAt)}
          </p>
        </div>
      </div>
      <Link href={`/review/${review.id}`} className="flex-shrink-0">
        <Button
          size="sm"
          className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150 ease-out motion-reduce:transition-none text-xs h-8 px-3"
        >
          Review
        </Button>
      </Link>
    </div>
  );
}
