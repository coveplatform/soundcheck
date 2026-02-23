"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Benefits that unlock at different review counts
const REVIEW_BENEFITS = [
  { minReviews: 1, label: "Get initial feedback", icon: "💬" },
  { minReviews: 3, label: "Start seeing patterns", icon: "📊" },
  { minReviews: 5, label: "Reliable consensus", icon: "✓" },
  { minReviews: 8, label: "Detailed insights", icon: "🔍" },
  { minReviews: 12, label: "Statistical significance", icon: "📈" },
  { minReviews: 20, label: "Comprehensive feedback", icon: "⭐" },
  { minReviews: 30, label: "Expert-level analysis", icon: "🎯" },
] as const;

export default function RequestReviewsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const trackId = params?.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [reviewTokens, setReviewTokens] = useState<number>(0);
  const [desiredReviews, setDesiredReviews] = useState<number>(5);

  const [trackInfo, setTrackInfo] = useState<{
    title: string;
    artworkUrl: string | null;
    status: string;
    genres: { id: string; name: string }[];
    sourceUrl: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profileRes, trackRes] = await Promise.all([
          fetch("/api/profile"),
          trackId ? fetch(`/api/tracks/${trackId}`) : null,
        ]);

        if (profileRes.ok) {
          const data = (await profileRes.json()) as any;
          if (!cancelled) {
            setReviewTokens(typeof data?.reviewCredits === "number" ? data.reviewCredits : 0);
            setDesiredReviews(data?.subscriptionStatus === "active" ? 10 : 5);
          }
        }

        if (trackRes?.ok) {
          const tData = (await trackRes.json()) as any;
          if (!cancelled && tData) {
            setTrackInfo({
              title: tData.title ?? "Untitled",
              artworkUrl: tData.artworkUrl ?? null,
              status: tData.status ?? "",
              genres: tData.Genre ?? tData.genres ?? [],
              sourceUrl: tData.sourceUrl ?? null,
            });
          }
        }
      } catch {
        if (cancelled) return;
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  const requestReviews = async () => {
    if (!trackId) {
      setError("No track specified");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tracks/${trackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredReviews }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError((data as any)?.error || "Failed to request reviews");
        setIsSubmitting(false);
        return;
      }

      // Redirect to track page after successful submission
      // Keep loading state active during navigation
      router.push(`/tracks/${trackId}`);
    } catch {
      setError("Failed to request reviews");
      setIsSubmitting(false);
    }
  };

  const needsCredits = !isLoadingProfile && desiredReviews > reviewTokens;

  return (
    <div className="min-h-screen bg-[#f7f5f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href={trackId ? `/tracks/${trackId}` : "/tracks"}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mb-3"
          >
            ← Back to track
          </Link>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-2">Reviews</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
            Request Reviews.
          </h1>
          <p className="text-sm text-black/40 font-medium mt-3">
            Get feedback from fellow artists in your genre.
          </p>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Track info */}
        {trackInfo && (
          <div className="flex items-center gap-4 rounded-2xl border-2 border-black/8 bg-white px-4 py-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-black/5">
              {trackInfo.artworkUrl ? (
                <Image
                  src={trackInfo.artworkUrl}
                  alt={trackInfo.title}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                  <Music className="h-5 w-5 text-neutral-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-black truncate">{trackInfo.title}</p>
              {trackInfo.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {trackInfo.genres.slice(0, 3).map((g: any) => (
                    <span key={g.id} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 text-black/40">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500 text-white text-sm px-4 py-3 font-bold rounded-2xl">
            {error}
          </div>
        )}

        {/* What happens next — dark block */}
        <div className="bg-neutral-900 rounded-2xl px-6 py-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Process</p>
          <h3 className="text-xl font-black text-white mb-4">What happens next?</h3>
          <ul className="space-y-3">
            {[
              "Your track is matched with reviewers in your genre",
              "Each reviewer listens for 3+ minutes and leaves structured feedback",
              "You get notified as reviews come in",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="text-sm text-white/60 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Review count selector */}
        <div className="bg-white rounded-2xl border-2 border-black/8 p-6 space-y-6">
          {/* Big number */}
          <div className="text-center">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-6xl font-black text-black tabular-nums">{desiredReviews}</span>
              <span className="text-xl text-black/40 font-black">{desiredReviews === 1 ? "review" : "reviews"}</span>
            </div>
            <p className="text-sm text-black/40 font-medium mt-1">
              {desiredReviews} {desiredReviews === 1 ? "credit" : "credits"} required
            </p>
          </div>

          {/* Slider */}
          <div>
            <input
              type="range"
              min="1"
              max="10"
              value={desiredReviews}
              onChange={(e) => setDesiredReviews(parseInt(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((desiredReviews - 1) / 9) * 100}%, rgb(229 231 235) ${((desiredReviews - 1) / 9) * 100}%, rgb(229 231 235) 100%)`
              }}
            />
            <div className="flex justify-between mt-2">
              {[1, 3, 5, 7, 10].map((mark) => (
                <button
                  key={mark}
                  type="button"
                  onClick={() => setDesiredReviews(mark)}
                  className={cn(
                    "text-xs font-black transition-colors",
                    desiredReviews === mark ? "text-purple-600" : "text-black/25 hover:text-purple-600"
                  )}
                >
                  {mark}
                </button>
              ))}
            </div>
          </div>

          {/* Insight level */}
          <div className="border-t-2 border-black/8 pt-5">
            <div className="flex items-center gap-1.5 mb-2">
              {REVIEW_BENEFITS.map((benefit) => (
                <div
                  key={benefit.label}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-300",
                    desiredReviews >= benefit.minReviews ? "bg-purple-600" : "bg-black/8"
                  )}
                />
              ))}
            </div>
            <p className="text-sm font-black text-black">
              {REVIEW_BENEFITS.filter((b) => desiredReviews >= b.minReviews).slice(-1)[0]?.icon}{" "}
              {REVIEW_BENEFITS.filter((b) => desiredReviews >= b.minReviews).slice(-1)[0]?.label || "Select reviews"}
            </p>
            <p className="text-[11px] text-black/30 font-medium mt-0.5">Current insight level</p>
          </div>

          {/* Credit balance */}
          <div className="border-t-2 border-black/8 pt-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-black/30">Available</p>
              <p className="text-3xl font-black text-black tabular-nums">{isLoadingProfile ? "…" : reviewTokens}</p>
              <p className="text-[11px] text-black/30 font-medium">credits</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black uppercase tracking-wider text-black/30">Will use</p>
              <p className={`text-3xl font-black tabular-nums ${needsCredits ? "text-red-500" : "text-purple-600"}`}>{desiredReviews}</p>
              <p className="text-[11px] text-black/30 font-medium">credits</p>
            </div>
          </div>

          {/* Not enough credits */}
          {(needsCredits || error.toLowerCase().includes("not enough") || error.toLowerCase().includes("token")) && (
            <div className="border-t-2 border-black/8 pt-5 space-y-3">
              <p className="text-sm text-black/50 font-medium text-center">
                You need <span className="font-black text-black">{Math.max(1, desiredReviews - reviewTokens)}</span> more {Math.max(1, desiredReviews - reviewTokens) === 1 ? "credit" : "credits"}
              </p>
              <Link href="/review" className="block">
                <Button className="w-full border-2 border-black/10 bg-white hover:bg-purple-50 text-black font-black h-10 rounded-xl text-sm">
                  <Sparkles className="h-4 w-4 mr-1.5 text-purple-600" />
                  Earn credits by reviewing
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={requestReviews}
          isLoading={isSubmitting}
          variant="primary"
          className="w-full h-12 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all rounded-xl"
          disabled={!trackId || isSubmitting || needsCredits}
        >
          Request {desiredReviews} {desiredReviews === 1 ? "review" : "reviews"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
