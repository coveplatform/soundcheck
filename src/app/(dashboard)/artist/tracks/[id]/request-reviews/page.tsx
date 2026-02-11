"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowRight, Check } from "lucide-react";
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
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reviewTokens, setReviewTokens] = useState<number>(0);
  const [desiredReviews, setDesiredReviews] = useState<number>(5);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const buyCredits = async (payload: { kind: "quantity"; quantity: number } | { kind: "pack"; pack: 5 | 20 | 50 }) => {
    if (isBuyingCredits) return;
    setIsBuyingCredits(true);
    setError("");

    try {
      const res = await fetch("/api/review-credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, trackId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        setError(data?.error || "Failed to start checkout");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Failed to start checkout");
    } finally {
      setIsBuyingCredits(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/artist/profile");
        if (!res.ok) {
          if (cancelled) return;
          setIsLoadingProfile(false);
          return;
        }
        const data = (await res.json()) as any;
        if (cancelled) return;
        setIsSubscribed(data?.subscriptionStatus === "active");
        setReviewTokens(typeof data?.reviewCredits === "number" ? data.reviewCredits : 0);
        setDesiredReviews(data?.subscriptionStatus === "active" ? 20 : 5);
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
  }, []);

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
      router.push(`/artist/tracks/${trackId}`);
    } catch {
      setError("Failed to request reviews");
      setIsSubmitting(false);
    }
  };

  const needsCredits = !isLoadingProfile && desiredReviews > reviewTokens;

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-10 pb-6 border-b border-black/10">
            <Link
              href={trackId ? `/artist/tracks/${trackId}` : "/artist/tracks"}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-4"
            >
              ← Back to track
            </Link>

            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40 mb-2">
              Reviews
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black">
              Request Reviews
            </h1>
            <p className="text-sm text-black/50 mt-2">
              Get feedback from fellow artists in your genre
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-4 font-medium mb-6 rounded-2xl">
              {error}
            </div>
          )}

          <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-neutral-950 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Your track will be matched with reviewers in your genre</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Each reviewer provides detailed, structured feedback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>You'll receive notifications as reviews come in</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm p-6 mb-6 space-y-6">
            {/* Large display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-5xl font-bold text-purple-600 tabular-nums">
                  {desiredReviews}
                </span>
                <span className="text-xl text-neutral-600 font-medium">
                  {desiredReviews === 1 ? "review" : "reviews"}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                {desiredReviews} {desiredReviews === 1 ? "credit" : "credits"} required
              </p>
            </div>

            {/* Slider */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={desiredReviews}
                  onChange={(e) => setDesiredReviews(parseInt(e.target.value))}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110"
                  style={{
                    background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((desiredReviews - 1) / 49) * 100}%, rgb(229 231 235) ${((desiredReviews - 1) / 49) * 100}%, rgb(229 231 235) 100%)`
                  }}
                />

                {/* Quick select markers */}
                <div className="flex justify-between mt-2 px-1">
                  {[1, 5, 10, 20, 30, 50].map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      onClick={() => setDesiredReviews(mark)}
                      className={cn(
                        "text-xs font-medium transition-colors",
                        desiredReviews === mark
                          ? "text-purple-600"
                          : "text-neutral-400 hover:text-purple-600"
                      )}
                    >
                      {mark}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Unlocked benefits - show current level */}
            <div className="text-center py-4 border-t border-neutral-200">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {REVIEW_BENEFITS.map((benefit) => (
                  <div
                    key={benefit.label}
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-all duration-300",
                      desiredReviews >= benefit.minReviews
                        ? "bg-purple-600"
                        : "bg-neutral-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-neutral-900">
                {REVIEW_BENEFITS.filter((b) => desiredReviews >= b.minReviews).slice(-1)[0]?.label || "Select reviews"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Current insight level
              </p>
            </div>

            {/* Credit balance */}
            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Available credits</p>
                <p className="text-2xl font-bold text-neutral-950">{isLoadingProfile ? "…" : reviewTokens}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">Will use</p>
                <p className="text-2xl font-bold text-purple-600">{desiredReviews}</p>
              </div>
            </div>

            {(needsCredits || error.toLowerCase().includes("not enough") || error.toLowerCase().includes("token")) && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-neutral-600">
                    You need <span className="font-bold text-neutral-950">{Math.max(1, desiredReviews - reviewTokens)}</span> more {Math.max(1, desiredReviews - reviewTokens) === 1 ? "credit" : "credits"}
                  </p>
                </div>

                <Link href="/account" className="block">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Buy credits
                  </Button>
                </Link>
              </div>
            )}
        </div>

          <Button
            onClick={requestReviews}
            isLoading={isSubmitting}
            variant="primary"
            className="w-full h-12 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
            disabled={!trackId || isSubmitting || needsCredits}
          >
            Request reviews
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
