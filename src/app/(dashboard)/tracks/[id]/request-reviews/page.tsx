"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Sparkles, X, Zap } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BuyCreditsButton } from "@/components/credits/buy-credits-button";

const REVIEW_BENEFITS = [
  { minReviews: 1, label: "Get initial feedback" },
  { minReviews: 3, label: "Start seeing patterns" },
  { minReviews: 5, label: "Reliable consensus" },
  { minReviews: 8, label: "Detailed insights" },
  { minReviews: 10, label: "Comprehensive feedback" },
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
    return () => { cancelled = true; };
  }, [trackId]);

  const requestReviews = async () => {
    if (!trackId) { setError("No track specified"); return; }
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
      router.push(`/tracks/${trackId}`);
    } catch {
      setError("Failed to request reviews");
      setIsSubmitting(false);
    }
  };

  const needsCredits = !isLoadingProfile && desiredReviews > reviewTokens;
  const backHref = trackId ? `/tracks/${trackId}` : "/tracks";
  const insightLabel = REVIEW_BENEFITS.filter((b) => desiredReviews >= b.minReviews).slice(-1)[0]?.label ?? "Select reviews";

  return (
    <div className="min-h-screen bg-neutral-950 flex items-start justify-center pt-6 sm:pt-14 px-4 pb-10">
      <div className="w-full max-w-sm shadow-2xl overflow-hidden">

        {/* ── HEADER ── */}
        <div className="bg-neutral-900 px-5 py-4 flex items-center gap-3">
          <div className="w-11 h-11 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
            {trackInfo?.artworkUrl ? (
              <Image src={trackInfo.artworkUrl} alt={trackInfo.title} width={44} height={44} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <Music className="h-4 w-4 text-white/20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-0.5">More reviews for</p>
            <p className="text-sm font-black text-white truncate leading-tight">
              {trackInfo?.title ?? "Loading…"}
            </p>
          </div>
          <Link href={backHref} className="flex-shrink-0 p-1 text-white/25 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </Link>
        </div>

        {/* ── BODY ── */}
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
              <span className="text-[80px] font-black text-black tabular-nums leading-none">{desiredReviews}</span>
              <p className="text-[11px] font-black uppercase tracking-widest text-black/25 mt-1">
                {desiredReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Picker */}
            {isPro ? (
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 3, 5, 7, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setDesiredReviews(count)}
                    className={cn(
                      "py-4 font-black text-lg transition-all",
                      desiredReviews === count
                        ? "bg-purple-600 text-white"
                        : "bg-black/[0.04] text-black/40 hover:bg-black/8 hover:text-black"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-black px-4 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Free Plan</p>
                <p className="text-lg font-black text-white leading-none">1 review / track</p>
                <p className="text-xs text-white/40 mt-1.5">
                  <Link href="/pro" className="text-purple-400 hover:text-purple-300 font-black">Upgrade to Pro</Link>
                  {" "}for up to 10 reviews per track
                </p>
              </div>
            )}

            {/* Insight bar */}
            <div className="mt-5 pt-5 border-t border-black/6">
              <div className="flex gap-1 mb-2.5">
                {REVIEW_BENEFITS.map((b) => (
                  <div
                    key={b.label}
                    className={cn(
                      "h-2 flex-1 transition-all duration-300",
                      desiredReviews >= b.minReviews ? "bg-purple-600" : "bg-black/8"
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

          {/* ── CREDITS ── */}
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
                <p className="text-3xl font-black text-black tabular-nums leading-none">{isLoadingProfile ? "…" : reviewTokens}</p>
                <p className="text-[10px] text-black/30 font-bold mt-0.5">credits</p>
              </div>
              <div className={cn("px-4 py-3", needsCredits ? "bg-red-50" : "bg-purple-50")}>
                <p className="text-[9px] font-black uppercase tracking-wider text-black/30 mb-0.5">Will use</p>
                <p className={cn("text-3xl font-black tabular-nums leading-none", needsCredits ? "text-red-500" : "text-purple-600")}>{desiredReviews}</p>
                <p className="text-[10px] text-black/30 font-bold mt-0.5">credits</p>
              </div>
            </div>

            {/* Stock up — free users with enough credits */}
            {!needsCredits && !isPro && (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-black text-black">Stock up for next time</p>
                  <p className="text-[11px] text-black/40">10 credits, use across any track</p>
                </div>
                <BuyCreditsButton label="Buy 10 — $9.95" className="h-8 text-xs rounded-none font-black ml-4" />
              </div>
            )}
          </div>

          {/* ── OUT OF CREDITS ── */}
          {needsCredits && (
            <div className="border-t border-black/6 px-5 py-4 space-y-2">
              <p className="text-sm font-black text-black mb-1">
                Need <span className="text-red-500">{desiredReviews - reviewTokens} more</span> {desiredReviews - reviewTokens === 1 ? "credit" : "credits"}
              </p>
              <BuyCreditsButton
                variant="primary"
                className="w-full h-11 font-black text-sm rounded-none"
                label="Buy 10 credits — $9.95"
              />
              <Link href="/review" className="block">
                <Button className="w-full bg-black hover:bg-neutral-800 text-white font-black h-11 rounded-none text-sm">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                  Earn credits by reviewing
                </Button>
              </Link>
            </div>
          )}

          {/* ── PRO UPSELL ── */}
          {!isPro && (
            <div className="border-t border-black/6">
              <div className="bg-neutral-900">
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Pro Plan</p>
                    <p className="text-[10px] font-black text-white/25">$24.95 / month</p>
                  </div>
                  <p className="text-base font-black text-white leading-tight mb-0.5">30 credits monthly.</p>
                  <p className="text-base font-black text-purple-400 leading-tight mb-3">Front of the queue.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["⚡ Priority", "3 tracks at once", "10 reviews/track"].map((f) => (
                      <span key={f} className="text-[10px] font-black text-white/40 bg-white/5 px-2 py-1">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <Link href="/pro" className="block">
                  <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-sm py-3 transition-colors">
                    Upgrade to Pro — $24.95/mo
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* ── SUBMIT ── */}
          <button
            onClick={requestReviews}
            disabled={!trackId || isSubmitting || needsCredits}
            className="w-full bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base py-4 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Requesting…" : (
              <>
                Request {desiredReviews} {desiredReviews === 1 ? "review" : "reviews"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
