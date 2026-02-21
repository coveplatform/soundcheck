"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Music, MessageSquare, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DequeueButton } from "@/components/tracks/dequeue-button";
import { QueueTrackPicker } from "@/components/tracks/queue-track-picker";

interface ActiveTrack {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  reviewsRequested: number;
  reviews: { id: string; status: string }[];
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

interface QueueViewProps {
  activeTracks: ActiveTrack[];
  eligibleTracks: EligibleTrack[];
  maxSlots: number;
  isPro: boolean;
  credits: number;
}

export function QueueView({ activeTracks, eligibleTracks, maxSlots, isPro, credits }: QueueViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasOpenSlots = activeTracks.length < maxSlots;

  return (
    <div>
      {/* Queue header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <p className="text-sm text-black/40">
          Submit a track → it fills a slot → artists review it → slot frees up.
          {!isPro && <>{" "}<Link href="/pro" className="text-purple-600 hover:text-purple-700 font-medium">Upgrade to Pro for 3 slots →</Link></>}
        </p>
      </div>

      {/* Slot grid — always show all 3 slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }, (_, slotIndex) => {
          const track = activeTracks[slotIndex];
          const isLocked = !isPro && slotIndex >= maxSlots;
          const slotNum = slotIndex + 1;

          if (track) {
            const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
            const hasReviews = track.reviewsRequested > 0;
            const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
            const isQueued = track.status === "QUEUED";
            const isInProgress = track.status === "IN_PROGRESS";
            const isPending = track.status === "PENDING_PAYMENT";

            return (
              <div key={track.id}>
                <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/30 mb-2">Slot {slotNum}</p>
                <div className="group relative">
                  <Card variant="soft" interactive className="overflow-hidden">
                    <Link href={`/tracks/${track.id}`} className="block">
                      <div className="relative aspect-[4/3] bg-neutral-100">
                        {track.artworkUrl ? (
                          <Image
                            src={track.artworkUrl}
                            alt={track.title}
                            fill
                            className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02]"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <Music className="h-8 w-8 text-black/15" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          {isPending ? (
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/80 text-black/60 border border-black/10 backdrop-blur-sm">Pending</span>
                          ) : isQueued ? (
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-600 text-white shadow-sm">Queued</span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-600 text-white shadow-sm">Reviewing</span>
                          ) : null}
                        </div>
                        <DequeueButton trackId={track.id} trackTitle={track.title} />
                        {hasReviews && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-6 pb-2 px-2">
                            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full transition-[width] duration-150 ease-out" style={{ width: `${reviewProgress * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-1.5">
                        <h3 className="font-semibold text-[13px] leading-snug text-black line-clamp-2 group-hover:text-black/70 transition-colors duration-150 ease-out">{track.title}</h3>
                        {hasReviews ? (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested} reviews</span>
                          </div>
                        ) : (
                          <p className="text-xs text-black/30">Awaiting reviews</p>
                        )}
                      </div>
                    </Link>
                  </Card>
                </div>
              </div>
            );
          }

          if (isLocked) {
            return (
              <div key={`locked-${slotIndex}`}>
                <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/20 mb-2">Slot {slotNum}</p>
                <Link href="/pro" className="group block">
                  <Card variant="soft" interactive className="border-2 border-dashed border-black/5 bg-neutral-50/50 hover:bg-purple-50/50 hover:border-purple-200">
                    <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2">
                      <Lock className="h-6 w-6 text-black/10 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-xs font-semibold text-black/20 group-hover:text-purple-600 transition-colors">Unlock with Pro</p>
                    </div>
                  </Card>
                </Link>
              </div>
            );
          }

          // Empty slot — add to queue
          return (
            <div key={`empty-${slotIndex}`}>
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/30 mb-2">Slot {slotNum} — open</p>
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full group text-left"
              >
                <Card variant="soft" interactive className="border-2 border-dashed border-black/10 bg-white/40 hover:bg-white/60 hover:border-purple-200">
                  <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-black/5 group-hover:bg-purple-100 flex items-center justify-center transition-colors duration-150 ease-out">
                      <Plus className="h-4 w-4 text-black/30 group-hover:text-purple-600 transition-colors duration-150 ease-out" />
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs font-semibold text-black/40 group-hover:text-purple-600 transition-colors">Add to queue</p>
                  </div>
                </Card>
              </button>
            </div>
          );
        })}
      </div>

      {/* Grandfathered tracks beyond slot limit */}
      {activeTracks.length > 3 && (
        <div className="mt-6">
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-amber-600 mb-2">Grandfathered</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeTracks.slice(3).map((track) => {
              const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
              const hasReviews = track.reviewsRequested > 0;
              const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
              return (
                <Link key={track.id} href={`/tracks/${track.id}`} className="group block">
                  <Card variant="soft" interactive className="overflow-hidden ring-2 ring-amber-300">
                    <div className="relative aspect-[4/3] bg-neutral-100">
                      {track.artworkUrl ? (
                        <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="33vw" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                          <Music className="h-8 w-8 text-black/15" />
                        </div>
                      )}
                      {hasReviews && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-6 pb-2 px-2">
                          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-semibold text-[13px] text-black line-clamp-2">{track.title}</h3>
                      {hasReviews && (
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Track picker panel — appears below slots when "Add to queue" is clicked */}
      <QueueTrackPicker
        tracks={eligibleTracks}
        credits={credits}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
