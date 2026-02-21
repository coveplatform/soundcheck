"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Music, MessageSquare, Lock, Crown, Coins, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [initialTrackId, setInitialTrackId] = useState<string | null>(null);
  const usedSlots = Math.min(activeTracks.length, maxSlots);

  const openPickerFor = (trackId?: string) => {
    setInitialTrackId(trackId ?? null);
    setPickerOpen(true);
  };

  return (
    <div>
      {/* Queue status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 p-4 rounded-xl bg-neutral-50 border border-black/5">
        <div className="flex items-center gap-4">
          {/* Slot usage dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxSlots }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-3 rounded-full transition-colors",
                  i < usedSlots ? "bg-purple-500" : "bg-black/10"
                )}
              />
            ))}
            {!isPro && Array.from({ length: 3 - maxSlots }, (_, i) => (
              <div key={`locked-${i}`} className="h-3 w-3 rounded-full bg-black/5 border border-dashed border-black/10" />
            ))}
          </div>
          <span className="text-sm text-black/50">
            <span className="font-bold text-black">{usedSlots}/{maxSlots}</span> slots used
          </span>
          {!isPro && (
            <Link href="/pro" className="hidden sm:inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold">
              <Crown className="h-3 w-3" />
              Get 3 slots
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-black/25" />
          <span className="text-sm text-black/50"><span className="font-bold text-black">{credits}</span> credits</span>
          <Link href="/review" className="text-xs text-purple-600 hover:text-purple-700 font-medium ml-1">Earn more →</Link>
        </div>
      </div>

      {/* Permanent explainer */}
      <p className="text-xs text-black/35 mb-8 max-w-2xl mx-auto">
        Submit a track → it sits in a slot while artists review it → slot frees up when done.
      </p>

      {/* Slot grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl mx-auto">
        {Array.from({ length: 3 }, (_, slotIndex) => {
          const track = activeTracks[slotIndex];
          const isLocked = !isPro && slotIndex >= maxSlots;
          const slotNum = slotIndex + 1;

          // Filled slot
          if (track) {
            const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
            const hasReviews = track.reviewsRequested > 0;
            const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
            const isQueued = track.status === "QUEUED";
            const isInProgress = track.status === "IN_PROGRESS";
            const isPending = track.status === "PENDING_PAYMENT";

            return (
              <div key={track.id} className="flex flex-col items-center">
                <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/25 mb-1.5 text-center">{slotNum}</p>
                <div className="group relative w-full">
                  <Card variant="soft" interactive className="overflow-hidden">
                    <Link href={`/tracks/${track.id}`} className="block">
                      <div className="relative aspect-square bg-neutral-100">
                        {track.artworkUrl ? (
                          <Image
                            src={track.artworkUrl}
                            alt={track.title}
                            fill
                            className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02]"
                            sizes="(max-width: 640px) 33vw, 200px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <Music className="h-6 w-6 text-black/15" />
                          </div>
                        )}
                        <div className="absolute top-1.5 left-1.5">
                          {isPending ? (
                            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 text-black/60 border border-black/10 backdrop-blur-sm">Pending</span>
                          ) : isQueued ? (
                            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-600 text-white shadow-sm">Queued</span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-600 text-white shadow-sm">Reviewing</span>
                          ) : null}
                        </div>
                        <DequeueButton trackId={track.id} trackTitle={track.title} />
                        {hasReviews && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent pt-4 pb-1.5 px-1.5">
                            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </Card>
                  <div className="mt-2 text-center px-1">
                    <p className="text-xs font-semibold text-black truncate">{track.title}</p>
                    {hasReviews ? (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <MessageSquare className="h-2.5 w-2.5 text-purple-500" />
                        <span className="text-[11px] font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-black/30 mt-0.5">Waiting for reviewers</p>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Locked slot
          if (isLocked) {
            return (
              <div key={`locked-${slotIndex}`} className="flex flex-col items-center">
                <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/15 mb-1.5 text-center">{slotNum}</p>
                <Link href="/pro" className="group w-full">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-black/[0.06] bg-neutral-50/50 hover:bg-purple-50/30 hover:border-purple-200 flex flex-col items-center justify-center gap-1.5 transition-colors">
                    <Lock className="h-5 w-5 text-black/[0.08] group-hover:text-purple-400 transition-colors" />
                    <Crown className="h-3 w-3 text-purple-300 group-hover:text-purple-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-center mt-2 font-medium text-black/20 group-hover:text-purple-600 transition-colors">Pro slot</p>
                </Link>
              </div>
            );
          }

          // Empty slot — add to queue
          return (
            <div key={`empty-${slotIndex}`} className="flex flex-col items-center">
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/25 mb-1.5 text-center">{slotNum}</p>
              <button
                onClick={() => openPickerFor()}
                className="w-full group"
              >
                <div className="aspect-square rounded-xl border-2 border-dashed border-black/10 bg-white/50 hover:bg-purple-50/40 hover:border-purple-300 flex flex-col items-center justify-center gap-2 transition-all">
                  <div className="h-9 w-9 rounded-full bg-black/[0.04] group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                    <Plus className="h-4 w-4 text-black/25 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <span className="text-[11px] font-medium text-black/30 group-hover:text-purple-600 transition-colors">Add track</span>
                </div>
              </button>
              <p className="text-[11px] text-center mt-2 text-black/20">Open</p>
            </div>
          );
        })}
      </div>

      {/* Grandfathered tracks beyond slot limit */}
      {activeTracks.length > 3 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-amber-600 mb-3">Grandfathered tracks</p>
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {activeTracks.slice(3).map((track) => {
              const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
              const hasReviews = track.reviewsRequested > 0;
              const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
              return (
                <div key={track.id} className="flex flex-col items-center">
                  <Link href={`/tracks/${track.id}`} className="group w-full">
                    <Card variant="soft" interactive className="overflow-hidden ring-2 ring-amber-300">
                      <div className="relative aspect-square bg-neutral-100">
                        {track.artworkUrl ? (
                          <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="200px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <Music className="h-6 w-6 text-black/15" />
                          </div>
                        )}
                        {hasReviews && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent pt-4 pb-1.5 px-1.5">
                            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                    <div className="mt-2 text-center px-1">
                      <p className="text-xs font-semibold text-black truncate">{track.title}</p>
                      {hasReviews && (
                        <span className="text-[11px] font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested}</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your Library section */}
      {eligibleTracks.length > 0 && (
        <div className="mt-10 max-w-2xl mx-auto">
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-black/30 mb-4">Your Library</p>
          <div className="space-y-2">
            {eligibleTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-black/5 bg-white/60 hover:bg-white/90 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden relative">
                  {track.artworkUrl ? (
                    <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-4 w-4 text-black/15" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black truncate">{track.title}</p>
                  <div className="flex items-center gap-2">
                    {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      track.status === "COMPLETED" ? "text-emerald-600" : "text-black/25"
                    )}>
                      {track.status === "COMPLETED" ? `Completed · ${track.reviewsCompleted} reviews` : "Uploaded"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openPickerFor(track.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors flex-shrink-0"
                >
                  Queue it
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Track picker modal */}
      <Dialog open={pickerOpen} onOpenChange={(o) => !o && setPickerOpen(false)}>
        <DialogContent className="p-0 max-w-md gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Add track to queue</DialogTitle>
          </DialogHeader>
          <QueueTrackPicker
            tracks={eligibleTracks}
            credits={credits}
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            initialTrackId={initialTrackId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
