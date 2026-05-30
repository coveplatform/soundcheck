"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Music, Plus, ArrowRight, Loader2, Check, X, Zap } from "lucide-react";
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
  { min: 1,  label: "Initial feedback"   },
  { min: 3,  label: "See patterns"       },
  { min: 5,  label: "Reliable consensus" },
  { min: 8,  label: "Detailed insights"  },
  { min: 10, label: "Comprehensive"      },
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
      setReviewCount(Math.min(3, Math.max(1, credits)));
      setSuccess(false);
      setError("");
    }
  }, [open, initialTrackId, credits]);

  if (!open) return null;

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const canAfford = isPro || credits >= reviewCount;
  const currentBenefit = REVIEW_BENEFITS.filter(b => reviewCount >= b.min).slice(-1)[0];

  const handleSubmit = async () => {
    if (!selectedTrackId || !canAfford) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/tracks/${selectedTrackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredReviews: reviewCount }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { router.refresh(); onClose(); setSuccess(false); setSelectedTrackId(null); setReviewCount(1); }, 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to queue track");
      }
    } catch { setError("Something went wrong"); } finally { setLoading(false); }
  };

  // ── Success ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div>
        <div className="bg-[#0f0f18] px-6 py-5 flex items-center justify-between">
          <p className="text-sm font-black text-white">Done!</p>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="bg-white py-16 text-center">
          <div className="h-12 w-12 bg-[#0f0f18] flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-white" />
          </div>
          <p className="text-base font-black text-black">You&apos;re in the queue</p>
          <p className="text-sm text-black/40 mt-1">Reviews will start coming in shortly.</p>
        </div>
      </div>
    );
  }

  // ── Track picker ──────────────────────────────────────────────────
  if (!selectedTrack) {
    return (
      <div>
        <div className="bg-[#0f0f18] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">Get more reviews</p>
            <p className="text-lg font-black text-white leading-tight">Choose a track</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white transition-colors p-1"><X className="h-4 w-4" /></button>
        </div>

        <div className="bg-white">
          {tracks.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="h-12 w-12 bg-[#f2ede4] flex items-center justify-center mx-auto mb-4">
                <Music className="h-5 w-5 text-black/20" />
              </div>
              <p className="text-base font-black text-black mb-1">No tracks yet</p>
              <p className="text-sm text-black/40 mb-6">Upload a track first to get reviews.</p>
              <Link href="/submit" onClick={onClose} className="inline-flex items-center gap-2 bg-[#0f0f18] text-white font-bold text-sm px-5 py-3">
                Upload a track <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div>
              <Link href="/submit" onClick={onClose}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#faf7f2] transition-colors border-b border-black/6 group"
              >
                <div className="w-12 h-12 border border-dashed border-black/15 flex items-center justify-center flex-shrink-0 group-hover:border-black/30 transition-colors">
                  <Plus className="h-4 w-4 text-black/25 group-hover:text-black/50 transition-colors" />
                </div>
                <p className="text-sm font-bold text-black/40 group-hover:text-black transition-colors">Upload a new track</p>
              </Link>

              <div className="max-h-[360px] overflow-y-auto">
                {tracks.map((track) => (
                  <button key={track.id} onClick={() => setSelectedTrackId(track.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#faf7f2] transition-colors border-b border-black/5 text-left group"
                  >
                    <div className="w-12 h-12 bg-[#f2ede4] flex-shrink-0 overflow-hidden relative">
                      {track.artworkUrl
                        ? <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="48px" />
                        : <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-black/15" /></div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-black truncate group-hover:text-purple-700 transition-colors">{track.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                        <span className={cn("text-[11px] font-bold", track.status === "COMPLETED" ? "text-purple-500" : "text-black/25")}>
                          {track.status === "COMPLETED" ? `${track.reviewsCompleted} reviews` : "Uploaded"}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-black/15 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Review count form ─────────────────────────────────────────────
  return (
    <div>
      <div className="bg-[#0f0f18] px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-white/5">
          {selectedTrack.artworkUrl
            ? <Image src={selectedTrack.artworkUrl} alt={selectedTrack.title} width={48} height={48} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-white/20" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-0.5">Reviews for</p>
          <p className="text-base font-black text-white truncate">{selectedTrack.title}</p>
        </div>
        <button onClick={() => setSelectedTrackId(null)} className="flex-shrink-0 text-white/25 hover:text-white transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <div className="bg-red-500 px-6 py-3"><p className="text-sm font-bold text-white">{error}</p></div>}

      <div className="bg-white">
        <div className="px-6 pt-8 pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30 mb-6 text-center">How many reviews?</p>

          {/* Counter */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <button type="button" onClick={() => setReviewCount(c => Math.max(1, c - 1))}
              className="h-12 w-12 border border-black/10 hover:border-black/30 text-black/40 hover:text-black text-xl font-light transition-colors flex items-center justify-center select-none"
            >−</button>
            <div className="text-center min-w-[80px]">
              <span className="text-[72px] font-black text-black leading-none tabular-nums">{reviewCount}</span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25 mt-1">
                {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
            <button type="button" onClick={() => setReviewCount(c => Math.min(10, c + 1))}
              className="h-12 w-12 border border-black/10 hover:border-black/30 text-black/40 hover:text-black text-xl font-light transition-colors flex items-center justify-center select-none"
            >+</button>
          </div>

          {/* Quick picks */}
          <div className="flex gap-1.5 justify-center mb-6">
            {[1, 3, 5, 8, 10].map(n => (
              <button key={n} type="button" onClick={() => setReviewCount(n)}
                className={cn(
                  "h-9 w-10 text-sm font-black transition-all border",
                  reviewCount === n ? "bg-[#0f0f18] border-[#0f0f18] text-white" : "border-black/10 text-black/40 hover:border-black/25 hover:text-black"
                )}
              >{n}</button>
            ))}
          </div>

          {/* Insight bar */}
          <div className="bg-[#faf7f2] px-4 py-3.5">
            <div className="flex gap-1 mb-2">
              {REVIEW_BENEFITS.map(b => (
                <div key={b.label} className={cn("h-1 flex-1 transition-all duration-300", reviewCount >= b.min ? "bg-purple-600" : "bg-black/8")} />
              ))}
            </div>
            <p className="text-sm font-bold text-black">{currentBenefit?.label ?? "Select"}</p>
            <p className="text-[10px] text-black/35 mt-0.5 uppercase tracking-wider font-bold">Insight level</p>
          </div>
        </div>

        {/* Credits */}
        <div className="border-t border-black/6 px-6 py-5">
          {isPro ? (
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <p className="text-sm font-bold text-purple-700">Pro — no credits deducted · priority placement</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 mb-1">You have</p>
                <p className={cn("text-4xl font-black tabular-nums leading-none", credits === 0 ? "text-red-500" : "text-black")}>{credits}</p>
                <p className="text-[10px] text-black/30 mt-0.5 font-bold">credits</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 mb-1">This costs</p>
                <p className={cn("text-4xl font-black tabular-nums leading-none", !canAfford ? "text-red-500" : "text-purple-600")}>{reviewCount}</p>
                <p className="text-[10px] text-black/30 mt-0.5 font-bold">credits</p>
              </div>
            </div>
          )}
        </div>

        {/* Out of credits */}
        {!isPro && !canAfford && (
          <div className="border-t border-black/6 px-6 py-5 space-y-2.5 bg-[#faf7f2]">
            <p className="text-sm font-bold text-black">
              You need <span className="text-red-500 font-black">{reviewCount - credits}</span> more {reviewCount - credits === 1 ? "credit" : "credits"}.
            </p>
            <BuyCreditsButton variant="primary" className="w-full h-11 font-black text-sm rounded-none" label="Buy 10 credits — $9.95" />
            <div className="grid grid-cols-2 gap-2">
              <Link href="/review" onClick={onClose}>
                <button className="w-full h-10 bg-[#0f0f18] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors">Earn credits</button>
              </Link>
              <Link href="/pro" onClick={onClose}>
                <button className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-colors">Go Pro</button>
              </Link>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canAfford || loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-black/10 disabled:text-black/20 disabled:cursor-not-allowed text-white font-black text-[15px] py-5 transition-colors flex items-center justify-center gap-2.5"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Queuing…</>
            : <>Request {reviewCount} {reviewCount === 1 ? "review" : "reviews"} <ArrowRight className="h-4 w-4" /></>
          }
        </button>
      </div>
    </div>
  );
}
