"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Music, Lock, Crown, ArrowRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  const openPickerFor = (trackId?: string) => {
    setInitialTrackId(trackId ?? null);
    setPickerOpen(true);
  };

  return (
    <div className="space-y-8">

      {/* ── ACTIVE SLOTS ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">
            Active Review Slots
          </p>
          <div className="flex items-center gap-1.5">
            <Coins className="h-3 w-3 text-black/25" />
            <span className="text-[11px] font-black text-black/50">
              <span className="text-black">{credits}</span> credits
            </span>
            <Link href="/review" className="text-[11px] font-black text-purple-600 hover:text-purple-800 transition-colors ml-1">
              Earn →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }, (_, slotIndex) => {
            const track = activeTracks[slotIndex];
            const isLocked = !isPro && slotIndex >= maxSlots;

            if (track) {
              const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
              const hasReviews = track.reviewsRequested > 0;
              const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
              const isQueued = track.status === "QUEUED";
              const isInProgress = track.status === "IN_PROGRESS";
              const isPending = track.status === "PENDING_PAYMENT";

              return (
                <div key={track.id} className="group">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-black/8 group-hover:border-black/20 transition-all shadow-[2px_2px_0_rgba(0,0,0,0.06)] group-hover:shadow-[4px_4px_0_rgba(0,0,0,0.1)] aspect-square">
                    <Link href={`/tracks/${track.id}`} className="block w-full h-full">
                      {track.artworkUrl ? (
                        <Image
                          src={track.artworkUrl}
                          alt={track.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          sizes="(max-width: 640px) 33vw, 280px"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                          <Music className="h-8 w-8 text-black/15" />
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="absolute top-2 left-2">
                        {isPending ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-black/60 text-white/80">Pending</span>
                        ) : isQueued ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-purple-600 text-white">Queued</span>
                        ) : isInProgress ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-purple-600 text-white">Live</span>
                        ) : null}
                      </div>

                      {/* Review progress overlay */}
                      {hasReviews && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pt-6 pb-2.5">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-xs font-black text-white tabular-nums">{completedReviews}/{track.reviewsRequested}</span>
                            <span className="text-[9px] font-bold text-white/40">reviews</span>
                          </div>
                          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-400 rounded-full transition-all"
                              style={{ width: `${reviewProgress * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                    <DequeueButton trackId={track.id} trackTitle={track.title} />
                  </div>
                  <p className="text-[12px] font-black text-black mt-2.5 truncate">{track.title}</p>
                </div>
              );
            }

            if (isLocked) {
              return (
                <Link key={`locked-${slotIndex}`} href="/pro" className="group block">
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-black/10 bg-white hover:border-purple-200 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-2.5 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-black/5 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                      <Lock className="h-4 w-4 text-black/20 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div className="text-center px-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-black/20 group-hover:text-purple-600 transition-colors">Pro slot</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Crown className="h-3 w-3 text-purple-300 group-hover:text-purple-500 transition-colors" />
                        <span className="text-[10px] font-black text-purple-300 group-hover:text-purple-500 transition-colors">Upgrade</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-black/20 mt-2 text-center">Locked</p>
                </Link>
              );
            }

            return (
              <div key={`empty-${slotIndex}`}>
                <button onClick={() => openPickerFor()} className="w-full group">
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-black/10 bg-white hover:border-black/25 flex flex-col items-center justify-center gap-2.5 transition-all shadow-[2px_2px_0_rgba(0,0,0,0.04)] group-hover:shadow-[3px_3px_0_rgba(0,0,0,0.08)]">
                    <div className="h-10 w-10 rounded-xl bg-black/5 group-hover:bg-black/8 flex items-center justify-center transition-colors">
                      <Plus className="h-5 w-5 text-black/25 group-hover:text-black/50 transition-colors" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-black/25 group-hover:text-black/50 transition-colors">Add track</span>
                  </div>
                </button>
                <p className="text-[11px] font-bold text-black/20 mt-2 text-center">Open slot</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GRANDFATHERED ─────────────────────────────────────── */}
      {activeTracks.length > 3 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/70 mb-4">Grandfathered tracks</p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {activeTracks.slice(3).map((track) => {
              const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
              const hasReviews = track.reviewsRequested > 0;
              const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
              return (
                <Link key={track.id} href={`/tracks/${track.id}`} className="group block">
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-amber-300/60">
                    {track.artworkUrl ? (
                      <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="280px" />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <Music className="h-8 w-8 text-black/15" />
                      </div>
                    )}
                    {hasReviews && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pt-6 pb-2.5">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] font-black text-black mt-2.5 truncate">{track.title}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── YOUR LIBRARY ──────────────────────────────────────── */}
      {eligibleTracks.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-4">Your Library</p>
          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden">
            {eligibleTracks.map((track, i) => (
              <div
                key={track.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5",
                  i > 0 && "border-t border-black/5"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex-shrink-0 overflow-hidden relative border border-black/5">
                  {track.artworkUrl ? (
                    <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-4 w-4 text-black/15" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-black text-black truncate">{track.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {track.genreName && (
                      <span className="text-[10px] text-black/30 font-medium">{track.genreName}</span>
                    )}
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      track.status === "COMPLETED" ? "text-purple-500" : "text-black/25"
                    )}>
                      {track.status === "COMPLETED" ? `${track.reviewsCompleted} reviews` : "Uploaded"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openPickerFor(track.id)}
                  className="flex items-center gap-1.5 text-[11px] font-black text-purple-600 hover:text-purple-800 transition-colors flex-shrink-0"
                >
                  Queue
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
          <DialogTitle className="sr-only">Add track to queue</DialogTitle>
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
