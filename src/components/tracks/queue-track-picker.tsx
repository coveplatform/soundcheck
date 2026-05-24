"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Music, Plus, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BuyCreditsButton } from "@/components/credits/buy-credits-button";

interface EligibleTrack {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  genreName: string | null;
  reviewsCompleted: number;
  reviewsRequested: number;
}

interface QueueTrackPickerProps {
  tracks: EligibleTrack[];
  credits: number;
  open: boolean;
  onClose: () => void;
  initialTrackId?: string | null;
}

export function QueueTrackPicker({ tracks, credits, open, onClose, initialTrackId }: QueueTrackPickerProps) {
  const router = useRouter();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTrackId(initialTrackId ?? null);
      setReviewCount(1);
      setSuccess(false);
    }
  }, [open, initialTrackId]);

  if (!open) return null;

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const canAfford = credits >= reviewCount;

  const handleSubmit = async () => {
    if (!selectedTrackId || !canAfford) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tracks/${selectedTrackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredReviews: reviewCount }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          onClose();
          setSuccess(false);
          setSelectedTrackId(null);
          setReviewCount(1);
        }, 1200);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to queue track");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedTrackId(null);
    setReviewCount(1);
    setSuccess(false);
  };

  // Success state
  if (success) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-lime-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-black">Queued!</p>
        <p className="text-xs text-black/40 mt-1">Your track is now in the review queue.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 pr-10 border-b border-black/5 bg-neutral-50/50">
        <h3 className="text-sm font-bold text-black">
          {selectedTrack ? "Request reviews" : "Choose a track"}
        </h3>
      </div>

      {!selectedTrack ? (
        /* Track list */
        <div className="max-h-80 overflow-y-auto">
          {tracks.length === 0 ? (
            <div className="p-8 text-center">
              <Music className="h-6 w-6 text-black/15 mx-auto mb-2" />
              <p className="text-sm text-black/40">No tracks to queue.</p>
              <Link href="/submit" className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block">
                Upload a new track →
              </Link>
            </div>
          ) : (
            <div>
              {/* Upload new option */}
              <Link
                href="/submit"
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-black/5 group"
              >
                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-black/10 flex items-center justify-center flex-shrink-0 group-hover:border-black/20">
                  <Plus className="h-4 w-4 text-black/30 group-hover:text-black/60" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black/60 group-hover:text-black">Upload new track</p>
                </div>
              </Link>

              {/* Eligible tracks */}
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50/40 transition-colors border-b border-black/[0.03] text-left group"
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
                    <p className="text-sm font-semibold text-black truncate group-hover:text-purple-700 transition-colors">{track.title}</p>
                    <div className="flex items-center gap-2">
                      {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        track.status === "COMPLETED" ? "text-emerald-600" : "text-black/25"
                      )}>
                        {track.status === "COMPLETED" ? `${track.reviewsCompleted} reviews` : "Uploaded"}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-black/15 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Review request form */
        <div className="p-5">
          {/* Selected track preview */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b-2 border-black/8">
            <div className="w-14 h-14 rounded-xl bg-neutral-100 flex-shrink-0 overflow-hidden relative border border-black/5">
              {selectedTrack.artworkUrl ? (
                <Image src={selectedTrack.artworkUrl} alt={selectedTrack.title} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-5 w-5 text-black/15" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-black truncate">{selectedTrack.title}</p>
              {selectedTrack.genreName && <p className="text-xs text-black/30 font-medium">{selectedTrack.genreName}</p>}
            </div>
            <button
              onClick={() => setSelectedTrackId(null)}
              className="text-xs text-purple-600 hover:text-purple-700 font-black flex-shrink-0"
            >
              Change
            </button>
          </div>

          {/* Review count — big number + blocky quick-select */}
          <div className="mb-5">
            <div className="text-center mb-4">
              <span className="text-7xl font-black text-black tabular-nums leading-none">{reviewCount}</span>
              <p className="text-sm font-black text-black/30 mt-1 uppercase tracking-widest">
                {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 5, 7, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setReviewCount(count)}
                  className={cn(
                    "py-4 rounded-xl border-2 font-black text-lg transition-all",
                    reviewCount === count
                      ? "border-purple-600 bg-purple-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      : "border-black/10 bg-white text-black/40 hover:border-black/30 hover:text-black"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Cost row */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/[0.03] rounded-xl border border-black/5 mb-4">
            <span className="text-sm font-bold text-black/40">Cost</span>
            <span className={cn("text-sm font-black", canAfford ? "text-black" : "text-red-500")}>
              {reviewCount} {reviewCount === 1 ? "credit" : "credits"}
              <span className="font-normal text-black/30 ml-2">({credits} available)</span>
            </span>
          </div>

          {/* Not enough credits */}
          {!canAfford && (
            <div className="mb-4 space-y-2.5">
              <p className="text-sm font-black text-red-600">
                Need {reviewCount - credits} more {reviewCount - credits === 1 ? "credit" : "credits"}
              </p>
              <BuyCreditsButton
                variant="primary"
                className="w-full h-11 font-black text-sm rounded-xl"
              />
              <div className="flex gap-2">
                <Link href="/review" className="flex-1">
                  <Button className="w-full h-10 border-2 border-black bg-white hover:bg-neutral-50 text-black font-black text-xs rounded-xl">
                    Earn by reviewing
                  </Button>
                </Link>
                <Link href="/pro" className="flex-1">
                  <Button className="w-full h-10 border-2 border-black bg-white hover:bg-neutral-50 text-black font-black text-xs rounded-xl">
                    Go Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canAfford || loading}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 font-black text-base h-12 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Queuing…</>
            ) : (
              <>Request {reviewCount} {reviewCount === 1 ? "review" : "reviews"}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
