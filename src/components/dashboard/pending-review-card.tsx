import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PendingPeerReview } from "@/types/dashboard";
import { formatRelativeDate } from "@/lib/utils";
import { Music } from "lucide-react";

interface PendingReviewCardProps {
  review: PendingPeerReview;
}

export function PendingReviewCard({ review }: PendingReviewCardProps) {
  const artwork = review.Track.artworkUrl;

  return (
    <div className="group flex items-stretch gap-3 sm:gap-4 rounded-xl border border-black/8 bg-white overflow-hidden transition-colors duration-150 ease-out hover:bg-white/90 hover:border-black/12 motion-reduce:transition-none">
      <div className="w-14 sm:w-16 aspect-square flex-shrink-0 relative">
        {artwork ? (
          <Image
            src={artwork}
            alt={review.Track.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <Music className="h-5 w-5 text-neutral-400" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-3">
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
      <div className="flex items-center pr-3 sm:pr-4">
        <Link href={`/review/${review.id}`}>
          <Button size="sm" variant="primary" className="text-xs h-8 px-3">
            Review
          </Button>
        </Link>
      </div>
    </div>
  );
}
