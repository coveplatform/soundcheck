"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Music, Plus, Minus, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
        <div className="p-4">
          {/* Selected track preview */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden relative">
              {selectedTrack.artworkUrl ? (
                <Image src={selectedTrack.artworkUrl} alt={selectedTrack.title} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-5 w-5 text-black/15" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-black truncate">{selectedTrack.title}</p>
              {selectedTrack.genreName && <p className="text-[11px] text-black/30">{selectedTrack.genreName}</p>}
            </div>
            <button
              onClick={() => setSelectedTrackId(null)}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex-shrink-0"
            >
              Change
            </button>
          </div>

          {/* Review count selector */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-black/5 px-4 py-3 mb-4">
            <span className="text-sm text-black/60">Reviews</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReviewCount(Math.max(1, reviewCount - 1))}
                disabled={reviewCount <= 1}
                className="h-7 w-7 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 disabled:opacity-30 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-lg font-black text-black w-6 text-center tabular-nums">{reviewCount}</span>
              <button
                onClick={() => setReviewCount(Math.min(10, reviewCount + 1))}
                disabled={reviewCount >= 10}
                className="h-7 w-7 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 disabled:opacity-30 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Cost display */}
          <div className="flex items-center justify-between text-sm mb-5">
            <span className="text-black/40">Cost</span>
            <span className={cn("font-bold", canAfford ? "text-black" : "text-red-500")}>
              {reviewCount} {reviewCount === 1 ? "credit" : "credits"}
              <span className="font-normal text-black/30 ml-1.5">({credits} available)</span>
            </span>
          </div>

          {!canAfford && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 mb-4">
              <p className="text-xs text-red-600">
                Not enough credits.{" "}
                <Link href="/review" className="font-bold hover:underline">Earn more by reviewing →</Link>
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!canAfford || loading}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold text-sm h-10 rounded-xl disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Queuing…</>
            ) : (
              <>Add to queue · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
