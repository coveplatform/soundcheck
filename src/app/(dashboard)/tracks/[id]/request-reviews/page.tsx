"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ArrowRight, Crown, Lock, Music, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BuyCreditsButton } from "@/components/credits/buy-credits-button";

// Benefits that unlock at different review counts
const REVIEW_BENEFITS = [
  { minReviews: 1, label: "Get initial feedback", icon: "💬" },
  { minReviews: 3, label: "Start seeing patterns", icon: "📊" },
  { minReviews: 5, label: "Reliable consensus", icon: "✓" },
  { minReviews: 8, label: "Detailed insights", icon: "🔍" },
  { minReviews: 10, label: "Comprehensive feedback", icon: "⭐" },
] as const;

export default function RequestReviewsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const trackId = params?.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [reviewTokens, setReviewTokens] = useState<number>(0);
  const [isPro, setIsPro] = useState(false);
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
            const proStatus = data?.subscriptionStatus === "active";
            setReviewTokens(typeof data?.reviewCredits === "number" ? data.reviewCredits : 0);
            setIsPro(proStatus);
            setDesiredReviews(proStatus ? 10 : 1);
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

  const needsCredits = !isLoadingProfile && !isPro && desiredReviews > reviewTokens;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border-b-2 border-black">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href={trackId ? `/tracks/${trackId}` : "/tracks"}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/30 hover:text-white transition-colors mb-4"
          >
            ← Back to track
          </Link>

          {/* Track info inline with hero */}
          {trackInfo ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/10">
                {trackInfo.artworkUrl ? (
                  <Image
                    src={trackInfo.artworkUrl}
                    alt={trackInfo.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Music className="h-6 w-6 text-white/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-1">Requesting reviews for</p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight truncate">{trackInfo.title}</h1>
                {trackInfo.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {trackInfo.genres.slice(0, 3).map((g: any) => (
                      <span key={g.id} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/40">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-[0.95]">
              Request Reviews.
            </h1>
          )}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Error */}
        {error && (
          <div className="bg-red-500 text-white text-sm px-4 py-3 font-bold rounded-xl border-2 border-black">
            {error}
          </div>
        )}

        {/* Review count selector */}
        <div className="bg-white rounded-2xl border-2 border-black p-6 space-y-6">

          {/* Big count display */}
          <div className="text-center pb-6 border-b-2 border-black/8">
            <span className="text-7xl sm:text-8xl font-black text-black tabular-nums leading-none">{desiredReviews}</span>
            <p className="text-base font-black text-black/30 mt-2 uppercase tracking-widest">
              {desiredReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Count picker — blocky buttons for Pro, locked note for free */}
          {isPro ? (
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 5, 7, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setDesiredReviews(count)}
                  className={cn(
                    "py-5 rounded-xl border-2 font-black text-xl transition-all",
                    desiredReviews === count
                      ? "border-purple-600 bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      : "border-black/10 bg-white text-black/40 hover:border-black/30 hover:text-black"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 bg-black/[0.03] rounded-xl border-2 border-black/8">
              <Lock className="h-4 w-4 text-black/25 flex-shrink-0" />
              <p className="text-sm text-black/40 font-bold">Free plan: 1 review per track.</p>
            </div>
          )}

          {/* Insight level bar */}
          <div className="border-t-2 border-black/8 pt-5">
            <div className="flex gap-1.5 mb-3">
              {REVIEW_BENEFITS.map((benefit) => (
                <div
                  key={benefit.label}
                  className={cn(
                    "h-2.5 flex-1 rounded-sm transition-all duration-300",
                    desiredReviews >= benefit.minReviews ? "bg-purple-600" : "bg-black/8"
                  )}
                />
              ))}
            </div>
            <p className="text-base font-black text-black">
              {REVIEW_BENEFITS.filter((b) => desiredReviews >= b.minReviews).slice(-1)[0]?.label || "Select reviews"}
            </p>
            <p className="text-xs text-black/30 font-bold uppercase tracking-wider mt-0.5">Insight level</p>
          </div>

          {/* Credit balance */}
          {isPro ? (
            <div className="border-t-2 border-black/8 pt-5 flex items-center gap-3">
              <Crown className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <p className="text-base font-black text-purple-700">Pro — no credits needed</p>
            </div>
          ) : (
            <div className="border-t-2 border-black/8 pt-5 grid grid-cols-2 gap-4">
              <div className="bg-black/[0.03] rounded-xl px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-black/30 mb-1">You have</p>
                <p className="text-4xl font-black text-black tabular-nums leading-none">{isLoadingProfile ? "…" : reviewTokens}</p>
                <p className="text-xs text-black/30 font-bold mt-1">credits</p>
              </div>
              <div className={cn("rounded-xl px-4 py-4", needsCredits ? "bg-red-50" : "bg-purple-50")}>
                <p className="text-[10px] font-black uppercase tracking-wider text-black/30 mb-1">Will use</p>
                <p className={cn("text-4xl font-black tabular-nums leading-none", needsCredits ? "text-red-500" : "text-purple-600")}>{desiredReviews}</p>
                <p className="text-xs text-black/30 font-bold mt-1">credits</p>
              </div>
            </div>
          )}

          {/* Out of credits */}
          {needsCredits && (
            <div className="border-t-2 border-black/8 pt-5 space-y-3">
              <p className="text-base font-black text-black">
                Need <span className="text-red-500">{desiredReviews - reviewTokens} more</span> {desiredReviews - reviewTokens === 1 ? "credit" : "credits"} to submit
              </p>
              <BuyCreditsButton
                variant="primary"
                className="w-full h-13 font-black text-sm rounded-xl"
                label="Buy 10 credits — $9.95"
              />
              <Link href="/review" className="block">
                <Button className="w-full border-2 border-black bg-white hover:bg-neutral-50 text-black font-black h-12 rounded-xl text-sm">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  Earn credits by reviewing
                </Button>
              </Link>
            </div>
          )}

          {/* Pro upsell */}
          {!isPro && (
            <div className="border-t-2 border-black/8 pt-5">
              <div className="bg-neutral-900 rounded-2xl px-6 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-4 w-4 text-purple-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Pro Plan</span>
                </div>
                <p className="text-2xl font-black text-white leading-tight">Submitting often?</p>
                <p className="text-2xl font-black text-purple-400 leading-tight mb-3">Go Pro.</p>
                <p className="text-sm text-white/40 font-medium leading-relaxed mb-6">
                  30 credits every month + priority placement. Cheaper than buying 3 credit packs.
                </p>
                <Link href="/pro" className="block">
                  <Button className="w-full h-12 bg-purple-600 text-white hover:bg-purple-500 font-black rounded-xl text-base">
                    See Pro plan <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={requestReviews}
          isLoading={isSubmitting}
          variant="primary"
          className="w-full h-14 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black text-base border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all rounded-xl"
          disabled={!trackId || isSubmitting || (!isPro && needsCredits)}
        >
          Request {desiredReviews} {desiredReviews === 1 ? "review" : "reviews"}
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
