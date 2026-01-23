"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowRight } from "lucide-react";

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
        setReviewTokens(typeof data?.freeReviewCredits === "number" ? data.freeReviewCredits : 0);
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
        if (
          res.status === 403 &&
          typeof data?.error === "string" &&
          data.error.toLowerCase().includes("verify")
        ) {
          router.push("/verify-email");
          router.refresh();
          // Keep loading state active during navigation
          return;
        }

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
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href={trackId ? `/artist/tracks/${trackId}` : "/artist/tracks"}
            className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none"
          >
            ← Back
          </Link>

          <PageHeader
            className="mt-6"
            eyebrow="Reviews"
            title="Request reviews"
            description="Submit your track to receive feedback from listeners"
          />
        </div>

        {error && (
          <Card variant="soft" elevated className="mb-6 border border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800 font-bold">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card variant="soft" elevated className="mb-6">
          <CardContent className="pt-6">
            <h3 className="text-xl font-light tracking-tight mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-black/60">
              <li>• Your track will be added to the listening queue</li>
              <li>• Listeners will provide detailed feedback</li>
              <li>• You'll receive notifications as reviews come in</li>
            </ul>
          </CardContent>
        </Card>

        <Card variant="soft" elevated className="mb-6">
          <CardContent className="pt-6 space-y-6">
            {isSubscribed ? (
              <>
                {/* Subscribed User View */}
                <div>
                  <label className="block text-sm font-bold text-black mb-3">
                    How many reviews do you want?
                  </label>
                  <div className="flex items-center gap-4 mb-3">
                    <input
                      type="range"
                      min={5}
                      max={20}
                      step={1}
                      value={desiredReviews}
                      onChange={(e) => setDesiredReviews(Number(e.target.value))}
                      className="flex-1 h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-lime-500"
                    />
                    <span className="text-3xl font-black text-black min-w-[3rem] text-right">{desiredReviews}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black/60">Available review credits</p>
                    <p className="text-2xl font-bold text-black">{isLoadingProfile ? "…" : reviewTokens}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-black/60">This request will use</p>
                    <p className="text-2xl font-bold text-purple-600">{desiredReviews}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Free Tier User View */}
                <div className="text-center py-4">
                  <p className="text-sm text-black/60 mb-2">You're requesting</p>
                  <p className="text-5xl font-black text-black mb-2">5</p>
                  <p className="text-sm font-bold text-black">reviews</p>
                </div>

                <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black/60">Available credits</p>
                    <p className="text-2xl font-bold text-black">{isLoadingProfile ? "…" : reviewTokens}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-black/60">This request will use</p>
                    <p className="text-2xl font-bold text-purple-600">5</p>
                  </div>
                </div>
              </>
            )}

            {(needsCredits || error.toLowerCase().includes("not enough") || error.toLowerCase().includes("token")) && (
              <div className="pt-4 border-t border-black/10">
                <div className="bg-white/60 border-2 border-black/10 rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-black">Buy more credits</div>
                      <div className="text-xs text-black/60 mt-1">
                        <span className="font-bold text-black">$1</span> per review • packs available
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-black/40 uppercase tracking-widest">Needed</div>
                      <div className="text-xl font-black text-black">
                        {Math.max(1, desiredReviews - reviewTokens)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                    <Button
                      type="button"
                      variant="airy"
                      onClick={() => buyCredits({ kind: "pack", pack: 5 })}
                      isLoading={isBuyingCredits}
                      className="justify-between"
                    >
                      <span className="font-bold">+5</span>
                      <span className="text-black/50">$5</span>
                    </Button>
                    <Button
                      type="button"
                      variant="airy"
                      onClick={() => buyCredits({ kind: "pack", pack: 20 })}
                      isLoading={isBuyingCredits}
                      className="justify-between"
                    >
                      <span className="font-bold">+20</span>
                      <span className="text-black/50">$18</span>
                    </Button>
                    <Button
                      type="button"
                      variant="airy"
                      onClick={() => buyCredits({ kind: "pack", pack: 50 })}
                      isLoading={isBuyingCredits}
                      className="justify-between"
                    >
                      <span className="font-bold">+50</span>
                      <span className="text-black/50">$40</span>
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="airyPrimary"
                    onClick={() => buyCredits({ kind: "quantity", quantity: Math.max(1, desiredReviews - reviewTokens) })}
                    isLoading={isBuyingCredits}
                    className="w-full mt-3"
                  >
                    Top up {Math.max(1, desiredReviews - reviewTokens)} credits
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={requestReviews}
          isLoading={isSubmitting}
          variant="airyPrimary"
          className="w-full h-12"
          disabled={!trackId || isSubmitting || needsCredits}
        >
          Request reviews
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
