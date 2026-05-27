"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { QueueTrackPicker } from "@/components/tracks/queue-track-picker";

interface ActiveTrack {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  reviewsRequested: number;
  reviewsCompleted: number;
}

interface EligibleTrack {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  genreName: string | null;
  reviewsCompleted: number;
  reviewsRequested: number;
}

interface DashboardQueueProps {
  activeTracks: ActiveTrack[];
  eligibleTracks: EligibleTrack[];
  maxSlots: number;
  isPro: boolean;
  credits: number;
}

export function DashboardQueue({ activeTracks, eligibleTracks, maxSlots, isPro, credits }: DashboardQueueProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const router = useRouter();

  const hasUploadedTracks = eligibleTracks.length > 0;

  const handleEmptySlotClick = () => {
    if (hasUploadedTracks) {
      setPickerOpen(true);
    } else {
      router.push("/submit");
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: maxSlots }, (_, slotIndex) => {
          const track = activeTracks[slotIndex];

          if (track) {
            const hasReviews = track.reviewsRequested > 0;
            const reviewProgress = hasReviews ? track.reviewsCompleted / track.reviewsRequested : 0;
            const isDone = reviewProgress >= 1;

            return (
              <Link key={track.id} href={`/tracks/${track.id}`} className="group block">
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-black/8 group-hover:border-black/20 transition-all duration-150 shadow-sm">
                  {track.artworkUrl ? (
                    <Image
                      src={track.artworkUrl}
                      alt={track.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-200"
                      sizes="(max-width: 640px) 33vw, 220px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                      <Music className="h-8 w-8 text-black/20" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm ${
                      track.status === "QUEUED" ? "bg-purple-600 text-white"
                        : track.status === "IN_PROGRESS" ? "bg-lime-400 text-black"
                        : "bg-white/90 text-black"
                    }`}>
                      {track.status === "QUEUED" ? "Queued" : track.status === "IN_PROGRESS" ? "Reviewing" : track.status}
                    </span>
                  </div>
                  {hasReviews && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-4 pb-2">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-black text-white leading-none">{track.reviewsCompleted}/{track.reviewsRequested}</span>
                        <span className="text-[9px] text-white/50">reviews</span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isDone ? "bg-lime-400" : "bg-white"}`} style={{ width: `${reviewProgress * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs font-black text-black mt-2 truncate leading-tight">{track.title}</p>
              </Link>
            );
          }

          return (
            <div key={`empty-${slotIndex}`}>
              <button onClick={handleEmptySlotClick} className="w-full group">
                <div className="aspect-square rounded-2xl border-2 border-dashed border-black/10 bg-white/40 hover:border-purple-400 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-2 transition-all duration-150">
                  <div className="h-10 w-10 rounded-full bg-black/[0.04] group-hover:bg-purple-100 flex items-center justify-center transition-colors border-2 border-black/[0.06] group-hover:border-purple-200">
                    <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20 group-hover:text-purple-600 transition-colors">
                    Add track
                  </span>
                </div>
              </button>
              <p className="text-[11px] font-medium text-center text-black/20 mt-2">Open slot</p>
            </div>
          );
        })}
      </div>

      <Dialog open={pickerOpen} onOpenChange={(o) => !o && setPickerOpen(false)}>
        <DialogContent className="p-0 max-w-sm gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Add track to queue</DialogTitle>
          <QueueTrackPicker
            tracks={eligibleTracks}
            credits={credits}
            isPro={isPro}
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
