"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Music, MessageSquare, Lock, Crown, Coins, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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
    <div>
      {/* Slim header: credits + pro upsell */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-black/25" />
          <span className="text-sm text-black/50">
            <span className="font-bold text-black">{credits}</span> credits
          </span>
          <Link href="/review" className="text-xs text-purple-600 hover:text-purple-700 font-medium ml-2">
            Earn more →
          </Link>
        </div>
        {!isPro && (
          <Link href="/pro" className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-semibold">
            <Crown className="h-3 w-3" />
            Get 3 slots
          </Link>
        )}
      </div>

      {/* Slot grid — full width */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }, (_, slotIndex) => {
          const track = activeTracks[slotIndex];
          const isLocked = !isPro && slotIndex >= maxSlots;

          // Filled slot
          if (track) {
            const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
            const hasReviews = track.reviewsRequested > 0;
            const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
            const isQueued = track.status === "QUEUED";
            const isInProgress = track.status === "IN_PROGRESS";
            const isPending = track.status === "PENDING_PAYMENT";

            return (
              <div key={track.id} className="group">
                <Card variant="soft" interactive className="overflow-hidden">
                  <Link href={`/tracks/${track.id}`} className="block">
                    <div className="relative aspect-square bg-neutral-100">
                      {track.artworkUrl ? (
                        <Image
                          src={track.artworkUrl}
                          alt={track.title}
                          fill
                          className="object-cover transition-transform duration-150 ease-out group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 33vw, 400px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                          <Music className="h-10 w-10 text-black/10" />
                        </div>
                      )}
                      {/* Status badge */}
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
                    </div>
                  </Link>
                </Card>

                {/* Info below artwork */}
                <div className="mt-3 px-0.5">
                  <p className="text-sm font-semibold text-black truncate mb-2">{track.title}</p>
                  {hasReviews ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-purple-500" />
                          <span className="text-[11px] font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested} reviews</span>
                        </div>
                        <span className="text-[11px] text-black/30">{Math.round(reviewProgress * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-[width] duration-300"
                          style={{ width: `${reviewProgress * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-black/30">Waiting for reviewers</p>
                  )}
                </div>
              </div>
            );
          }

          // Locked slot
          if (isLocked) {
            return (
              <div key={`locked-${slotIndex}`}>
                <Link href="/pro" className="group block">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-black/[0.06] bg-neutral-50/30 hover:bg-purple-50/40 hover:border-purple-200 flex flex-col items-center justify-center gap-3 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-black/[0.03] group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                      <Lock className="h-5 w-5 text-black/[0.08] group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-semibold text-black/20 group-hover:text-purple-600 transition-colors">Pro slot</p>
                      <p className="text-[11px] text-black/15 group-hover:text-purple-400 transition-colors mt-0.5">Run 3 tracks at once</p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 group-hover:text-purple-600 transition-colors">
                      <Crown className="h-3 w-3" />
                      Upgrade
                    </div>
                  </div>
                </Link>
                <div className="mt-3 px-0.5 h-[42px]" />
              </div>
            );
          }

          // Empty slot
          return (
            <div key={`empty-${slotIndex}`}>
              <button onClick={() => openPickerFor()} className="w-full group">
                <div className="aspect-square rounded-xl border-2 border-dashed border-black/10 bg-white/50 hover:bg-purple-50/40 hover:border-purple-300 flex flex-col items-center justify-center gap-3 transition-all">
                  <div className="h-12 w-12 rounded-full bg-black/[0.04] group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                    <Plus className="h-5 w-5 text-black/20 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-semibold text-black/30 group-hover:text-purple-600 transition-colors">Add a track</p>
                    <p className="text-[11px] text-black/20 group-hover:text-purple-400 transition-colors mt-0.5">Slot is open</p>
                  </div>
                </div>
              </button>
              <div className="mt-3 px-0.5 h-[42px]" />
            </div>
          );
        })}
      </div>

      {/* Grandfathered tracks beyond slot limit */}
      {activeTracks.length > 3 && (
        <div className="mt-10">
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-amber-600 mb-4">Grandfathered tracks</p>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {activeTracks.slice(3).map((track) => {
              const completedReviews = track.reviews.filter((r) => r.status === "COMPLETED").length;
              const hasReviews = track.reviewsRequested > 0;
              const reviewProgress = hasReviews ? completedReviews / track.reviewsRequested : 0;
              return (
                <div key={track.id}>
                  <Link href={`/tracks/${track.id}`} className="group block">
                    <Card variant="soft" interactive className="overflow-hidden ring-2 ring-amber-300">
                      <div className="relative aspect-square bg-neutral-100">
                        {track.artworkUrl ? (
                          <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="400px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <Music className="h-10 w-10 text-black/10" />
                          </div>
                        )}
                      </div>
                    </Card>
                    <div className="mt-3 px-0.5">
                      <p className="text-sm font-semibold text-black truncate mb-2">{track.title}</p>
                      {hasReviews && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-purple-700">{completedReviews}/{track.reviewsRequested} reviews</span>
                          </div>
                          <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${reviewProgress * 100}%` }} />
                          </div>
                        </div>
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
        <div className="mt-10">
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
