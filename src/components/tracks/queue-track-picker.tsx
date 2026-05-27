"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Music, Plus, ArrowRight, Loader2, CheckCircle2, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
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
  isPro?: boolean;
  open: boolean;
  onClose: () => void;
  initialTrackId?: string | null;
}

const REVIEW_BENEFITS = [
  { minReviews: 1, label: "Initial feedback" },
  { minReviews: 3, label: "See patterns" },
  { minReviews: 5, label: "Reliable consensus" },
  { minReviews: 8, label: "Detailed insights" },
  { minReviews: 10, label: "Comprehensive" },
] as const;

export function QueueTrackPicker({ tracks, credits, isPro = false, open, onClose, initialTrackId }: QueueTrackPickerProps) {
  const router = useRouter();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedTrackId(initialTrackId ?? null);
      setReviewCount(1);
      setSuccess(false);
      setError("");
    }
  }, [open, initialTrackId]);

  if (!open) return null;

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const canAfford = credits >= reviewCount;
  const insightLabel = REVIEW_BENEFITS.filter((b) => reviewCount >= b.minReviews).slice(-1)[0]?.label ?? "Select reviews";

  const handleSubmit = async () => {
    if (!selectedTrackId || !canAfford) return;
    setError("");
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
        setError(data.error || "Failed to queue track");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="overflow-hidden">
        <div className="bg-neutral-900 px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-black text-white">Queued!</p>
          <button onClick={onClose} className="text-white/25 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-white py-10 text-center">
          <CheckCircle2 className="h-9 w-9 text-purple-600 mx-auto mb-3" />
          <p className="text-base font-black text-black">You're in the queue</p>
          <p className="text-xs text-black/35 mt-1">Reviews will start coming in shortly.</p>
        </div>
      </div>
    );
  }

  // ── Track picker ──────────────────────────────────────────────────
  if (!selectedTrack) {
    return (
      <div className="overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 px-5 py-4 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Choose a track</p>
          <button onClick={onClose} className="text-white/25 hover:text-white transition-colors p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-white">
          {tracks.length === 0 ? (
            <div className="py-12 text-center px-5">
              <Music className="h-6 w-6 text-black/15 mx-auto mb-3" />
              <p className="text-sm font-black text-black">No tracks to queue</p>
              <p className="text-xs text-black/35 mt-1 mb-4">Upload a track first to get reviews.</p>
              <Link
                href="/submit"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 bg-black text-white font-black text-xs px-4 py-2.5"
              >
                Upload a track
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {/* Upload new */}
              <Link
                href="/submit"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors border-b border-black/5 group"
              >
                <div className="w-10 h-10 border-2 border-dashed border-black/10 flex items-center justify-center flex-shrink-0 group-hover:border-black/25 transition-colors">
                  <Plus className="h-4 w-4 text-black/25 group-hover:text-black/50 transition-colors" />
                </div>
                <p className="text-sm font-black text-black/40 group-hover:text-black transition-colors">Upload new track</p>
              </Link>

              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-purple-50/50 transition-colors border-b border-black/[0.04] text-left group"
                >
                  <div className="w-10 h-10 bg-neutral-100 flex-shrink-0 overflow-hidden relative">
                    {track.artworkUrl ? (
                      <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-4 w-4 text-black/15" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-black truncate group-hover:text-purple-700 transition-colors">{track.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {track.genreName && <span className="text-[10px] text-black/30 font-medium">{track.genreName}</span>}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        track.status === "COMPLETED" ? "text-purple-500" : "text-black/20"
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
      </div>
    );
  }

  // ── Review request form ───────────────────────────────────────────
  return (
    <div className="overflow-hidden">

      {/* Header */}
      <div className="bg-neutral-900 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0 overflow-hidden border border-white/10">
          {selectedTrack.artworkUrl ? (
            <Image src={selectedTrack.artworkUrl} alt={selectedTrack.title} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <Music className="h-4 w-4 text-white/20" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-0.5">More reviews for</p>
          <p className="text-sm font-black text-white truncate leading-tight">{selectedTrack.title}</p>
        </div>
        <button
          onClick={() => setSelectedTrackId(null)}
          className="flex-shrink-0 text-white/25 hover:text-white transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white">

        {/* Error */}
        {error && (
          <div className="bg-red-500 text-white text-sm px-5 py-3 font-bold">
            {error}
          </div>
        )}

        {/* Count + picker */}
        <div className="px-5 pt-6 pb-5">

          {/* Big number */}
          <div className="text-center mb-5">
            <span className="text-[80px] font-black text-black tabular-nums leading-none">{reviewCount}</span>
            <p className="text-[11px] font-black uppercase tracking-widest text-black/25 mt-1">
              {reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Picker */}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 3, 5, 7, 10].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setReviewCount(count)}
                className={cn(
                  "py-4 font-black text-lg transition-all",
                  reviewCount === count
                    ? "bg-purple-600 text-white"
                    : "bg-black/[0.04] text-black/40 hover:bg-black/8 hover:text-black"
                )}
              >
                {count}
              </button>
            ))}
          </div>

          {/* Insight bar */}
          <div className="mt-5 pt-5 border-t border-black/6">
            <div className="flex gap-1 mb-2.5">
              {REVIEW_BENEFITS.map((b) => (
                <div
                  key={b.label}
                  className={cn(
                    "h-2 flex-1 transition-all duration-300",
                    reviewCount >= b.minReviews ? "bg-purple-600" : "bg-black/8"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-black">{insightLabel}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/25">Insight level</p>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="border-t border-black/6 px-5 py-4 space-y-3">
          {isPro && (
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2.5 border border-purple-100">
              <Zap className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
              <p className="text-xs font-black text-purple-700">Priority placement — your track goes to the front</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/[0.03] px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-black/30 mb-0.5">You have</p>
              <p className="text-3xl font-black text-black tabular-nums leading-none">{credits}</p>
              <p className="text-[10px] text-black/30 font-bold mt-0.5">credits</p>
            </div>
            <div className={cn("px-4 py-3", !canAfford ? "bg-red-50" : "bg-purple-50")}>
              <p className="text-[9px] font-black uppercase tracking-wider text-black/30 mb-0.5">Will use</p>
              <p className={cn("text-3xl font-black tabular-nums leading-none", !canAfford ? "text-red-500" : "text-purple-600")}>{reviewCount}</p>
              <p className="text-[10px] text-black/30 font-bold mt-0.5">credits</p>
            </div>
          </div>
        </div>

        {/* Out of credits */}
        {!canAfford && (
          <div className="border-t border-black/6 px-5 py-4 space-y-2">
            <p className="text-sm font-black text-black mb-1">
              Need <span className="text-red-500">{reviewCount - credits} more</span> {reviewCount - credits === 1 ? "credit" : "credits"}
            </p>
            <BuyCreditsButton
              variant="primary"
              className="w-full h-11 font-black text-sm rounded-none"
              label="Buy 10 credits — $9.95"
            />
            <div className="grid grid-cols-2 gap-2">
              <Link href="/review" onClick={onClose} className="block">
                <button className="w-full h-10 bg-black hover:bg-neutral-800 text-white font-black text-xs transition-colors">
                  Earn by reviewing
                </button>
              </Link>
              <Link href="/pro" onClick={onClose} className="block">
                <button className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-colors">
                  Go Pro
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canAfford || loading}
          className="w-full bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base py-4 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Queuing…</>
          ) : (
            <>
              Request {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

      </div>
    </div>
  );
}
