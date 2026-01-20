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

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reviewTokens, setReviewTokens] = useState<number>(0);
  const [desiredReviews, setDesiredReviews] = useState<number>(5);

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
          return;
        }

        setError((data as any)?.error || "Failed to request reviews");
        return;
      }

      // Redirect to track page after successful submission
      router.push(`/artist/tracks/${trackId}`);
    } catch {
      setError("Failed to request reviews");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">plan</p>
                <p className="mt-1 text-sm font-bold text-black">
                  {isSubscribed ? "MixReflect Pro" : "Trial"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">review tokens</p>
                <p className="mt-1 text-sm font-bold text-black">
                  {isLoadingProfile ? "…" : reviewTokens}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">reviews</p>
                <p className="text-sm font-bold text-black">{isSubscribed ? desiredReviews : 5}</p>
              </div>

              {isSubscribed ? (
                <div className="mt-3">
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={1}
                    value={desiredReviews}
                    onChange={(e) => setDesiredReviews(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-2 text-sm text-black/50">
                    Spend <span className="font-bold text-black">{desiredReviews}</span> tokens to request <span className="font-bold text-black">{desiredReviews}</span> reviews.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-black/50">
                  Trial requests use <span className="font-bold text-black">5</span> tokens for <span className="font-bold text-black">5</span> reviews.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={requestReviews}
          isLoading={isSubmitting}
          variant="airyPrimary"
          className="w-full h-12"
          disabled={!trackId || isSubmitting}
        >
          Request reviews
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
