"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { ArrowLeft, Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { funnels, track } from "@/lib/analytics";

interface Review {
  id: string;
  status: string;
  track: {
    id: string;
    title: string;
    sourceUrl: string;
    sourceType: string;
    feedbackFocus: string | null;
    genres: { id: string; name: string }[];
  };
  reviewer: {
    tier: string;
  };
}

type FirstImpression = "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";

const MIN_LISTEN_SECONDS = 180;
const MIN_WORDS_PER_SECTION = 30;

function countWords(text: string): number {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).length;
}

const TIER_EARNINGS: Record<string, number> = {
  ROOKIE: 15,
  VERIFIED: 30,
  PRO: 50,
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const lastHeartbeatSentAt = useRef<number>(0);
  const heartbeatInFlight = useRef(false);

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [, setListenTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(null);
  const [productionScore, setProductionScore] = useState<number>(0);
  const [vocalScore, setVocalScore] = useState<number>(0);
  const [originalityScore, setOriginalityScore] = useState<number>(0);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [perceivedGenre, setPerceivedGenre] = useState("");
  const [similarArtists, setSimilarArtists] = useState("");
  const [bestPart, setBestPart] = useState("");
  const [weakestPart, setWeakestPart] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    async function fetchReview() {
      try {
        const response = await fetch(`/api/reviews/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReview(data);
          // Track review started
          funnels.review.start(data.track.id, data.id);
        } else {
          const data = await response.json().catch(() => null);
          const message = data?.error || "Review not found";

          if (response.status === 401) {
            router.push("/login");
            router.refresh();
            return;
          }

          if (response.status === 403) {
            if (typeof message === "string" && message.toLowerCase().includes("verify")) {
              router.push("/verify-email");
              router.refresh();
              return;
            }
            if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
              router.push("/reviewer/onboarding");
              router.refresh();
              return;
            }
            if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
              router.push("/reviewer/dashboard");
              router.refresh();
              return;
            }
          }

          setError(message);
        }
      } catch {
        setError("Failed to load review");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReview();
  }, [id]);

  const handleSubmit = async () => {
    if (!review) return;

    // Validate
    if (!firstImpression) {
      setError("Please select your first impression");
      return;
    }
    if (productionScore === 0) {
      setError("Please rate the production quality");
      return;
    }
    if (originalityScore === 0) {
      setError("Please rate the originality");
      return;
    }
    if (wouldListenAgain === null) {
      setError("Please indicate if you would listen again");
      return;
    }
    if (countWords(bestPart) < MIN_WORDS_PER_SECTION) {
      setError(`Best part must be at least ${MIN_WORDS_PER_SECTION} words`);
      return;
    }
    if (countWords(weakestPart) < MIN_WORDS_PER_SECTION) {
      setError(`Weakest part must be at least ${MIN_WORDS_PER_SECTION} words`);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          firstImpression,
          productionScore,
          vocalScore: vocalScore || null,
          originalityScore,
          wouldListenAgain,
          perceivedGenre: perceivedGenre || undefined,
          similarArtists: similarArtists || undefined,
          bestPart,
          weakestPart,
          additionalNotes: additionalNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || "Failed to submit review";

        if (response.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }

        if (response.status === 403) {
          if (typeof message === "string" && message.toLowerCase().includes("verify")) {
            router.push("/verify-email");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
            router.push("/reviewer/onboarding");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
            router.push("/reviewer/dashboard");
            router.refresh();
            return;
          }
        }

        setError(message);
        track("review_form_validation_failed", { field: "api", error: message });
        return;
      }

      // Track successful review completion
      funnels.review.complete(
        review.track.id,
        review.id,
        data.earnings || TIER_EARNINGS[review.reviewer.tier]
      );
      setSuccess(true);
    } catch {
      setError("Something went wrong");
      track("review_form_validation_failed", { field: "api", error: "network_error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!review) return;

    setError("");
    setIsSkipping(true);
    track("reviewer_track_skipped", { trackId: review.track.id });

    try {
      const response = await fetch(`/api/reviews/${review.id}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || "Failed to skip review";

        if (response.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }

        if (response.status === 403) {
          if (typeof message === "string" && message.toLowerCase().includes("verify")) {
            router.push("/verify-email");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
            router.push("/reviewer/onboarding");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
            router.push("/reviewer/dashboard");
            router.refresh();
            return;
          }
        }

        setError(message);
        return;
      }

      router.push("/reviewer/queue");
      router.refresh();
    } catch {
      setError("Failed to skip review");
    } finally {
      setIsSkipping(false);
    }
  };

  const maybeSendHeartbeat = async () => {
    if (!review) return;
    if (heartbeatInFlight.current) return;

    const now = Date.now();
    if (now - lastHeartbeatSentAt.current < 4000) return;

    heartbeatInFlight.current = true;
    lastHeartbeatSentAt.current = now;

    try {
      const res = await fetch(`/api/reviews/${review.id}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error;

        if (res.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }

        if (res.status === 403) {
          const msg = typeof message === "string" ? message.toLowerCase() : "";
          if (msg.includes("verify")) {
            router.push("/verify-email");
            router.refresh();
            return;
          }
          if (msg.includes("onboarding")) {
            router.push("/reviewer/onboarding");
            router.refresh();
            return;
          }
          if (msg.includes("restricted")) {
            router.push("/reviewer/dashboard");
            router.refresh();
            return;
          }
        }
      }

      if (res.ok) {
        const data = await res.json();
        const serverListen = typeof data.listenDuration === "number" ? data.listenDuration : null;
        if (serverListen !== null) {
          setListenTime((prev) => Math.max(prev, serverListen));
        }
        if (data.minimumReached) {
          setCanSubmit(true);
        }
      }
    } catch {
    } finally {
      heartbeatInFlight.current = false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
        <Link href="/reviewer/queue" className="text-sm text-neutral-500 hover:text-neutral-900 mt-4 inline-block">
          Back to queue
        </Link>
      </div>
    );
  }

  if (!review) return null;

  const bestPartWords = countWords(bestPart);
  const weakestPartWords = countWords(weakestPart);
  const meetsTextMinimum =
    bestPartWords >= MIN_WORDS_PER_SECTION &&
    weakestPartWords >= MIN_WORDS_PER_SECTION;

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Review Submitted!</h2>
        <p className="text-neutral-500 mb-2">
          You earned {formatCurrency(TIER_EARNINGS[review.reviewer.tier])}
        </p>
        <p className="text-sm text-neutral-400 mb-6">
          Your feedback helps artists improve their music.
        </p>
        <Link href="/reviewer/queue">
          <Button>Continue Reviewing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/reviewer/queue"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSkip}
          isLoading={isSkipping}
        >
          Skip
        </Button>
      </div>

      {/* Track Info */}
      <Card>
        <CardHeader>
          <CardTitle>{review.track.title}</CardTitle>
          <p className="text-sm text-neutral-500">
            {review.track.genres.map((g) => g.name).join(", ")}
          </p>
          {review.track.feedbackFocus && (
            <p className="text-sm text-amber-600 mt-2">
              Artist is looking for: {review.track.feedbackFocus}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <AudioPlayer
            sourceUrl={review.track.sourceUrl}
            sourceType={review.track.sourceType}
            minListenTime={MIN_LISTEN_SECONDS}
            onListenProgress={(seconds) => {
              setListenTime((prev) => Math.max(prev, seconds));
              void maybeSendHeartbeat();
            }}
            onMinimumReached={() => {
              setCanSubmit(true);
              funnels.review.minimumReached(review.track.id, MIN_LISTEN_SECONDS);
            }}
          />
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* First Impression */}
          <div className="space-y-2">
            <Label>First Impression (after 30 seconds)</Label>
            <div className="flex gap-2">
              {[
                { value: "STRONG_HOOK", label: "Strong Hook" },
                { value: "DECENT", label: "Decent" },
                { value: "LOST_INTEREST", label: "Lost Interest" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFirstImpression(option.value as FirstImpression)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors border",
                    firstImpression === option.value
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scores */}
          <div className="grid sm:grid-cols-3 gap-4">
            <ScoreInput
              label="Production Quality"
              value={productionScore}
              onChange={setProductionScore}
            />
            <ScoreInput
              label="Vocals (optional)"
              value={vocalScore}
              onChange={setVocalScore}
            />
            <ScoreInput
              label="Originality"
              value={originalityScore}
              onChange={setOriginalityScore}
            />
          </div>

          {/* Would Listen Again */}
          <div className="space-y-2">
            <Label>Would you listen to this again?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWouldListenAgain(true)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors border",
                  wouldListenAgain === true
                    ? "bg-green-600 text-white border-green-600"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldListenAgain(false)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors border",
                  wouldListenAgain === false
                    ? "bg-neutral-600 text-white border-neutral-600"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                No
              </button>
            </div>
          </div>

          {/* Genre & Similar Artists */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">What genre is this? (optional)</Label>
              <Input
                id="genre"
                placeholder="e.g., Lo-fi Hip-Hop"
                value={perceivedGenre}
                onChange={(e) => setPerceivedGenre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="similar">Similar artists (optional)</Label>
              <Input
                id="similar"
                placeholder="e.g., Nujabes, J Dilla"
                value={similarArtists}
                onChange={(e) => setSimilarArtists(e.target.value)}
              />
            </div>
          </div>

          {/* Best & Weakest Parts */}
          <div className="space-y-2">
            <Label htmlFor="best">Best part of the track *</Label>
            <textarea
              id="best"
              placeholder="What stood out to you? What worked well?"
              value={bestPart}
              onChange={(e) => setBestPart(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
            />
            <p className="text-xs text-neutral-400">
              {bestPartWords}/{MIN_WORDS_PER_SECTION} words minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weakest">Weakest part / Areas for improvement *</Label>
            <textarea
              id="weakest"
              placeholder="What could be better? Be constructive."
              value={weakestPart}
              onChange={(e) => setWeakestPart(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
            />
            <p className="text-xs text-neutral-400">
              {weakestPartWords}/{MIN_WORDS_PER_SECTION} words minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <textarea
              id="notes"
              placeholder="Any other thoughts..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-neutral-100">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canSubmit || !meetsTextMinimum}
              className="w-full"
            >
              {canSubmit && meetsTextMinimum
                ? `Submit Review & Earn ${formatCurrency(TIER_EARNINGS[review.reviewer.tier])}`
                : `Listen for ${Math.floor(MIN_LISTEN_SECONDS / 60)} minutes and complete feedback to submit`}
            </Button>
            {(!canSubmit || !meetsTextMinimum) && (
              <p className="text-xs text-neutral-400 text-center mt-2">
                Keep listening and write detailed feedback to unlock submit
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className="flex-1"
          >
            <Star
              className={cn(
                "h-6 w-6 mx-auto transition-colors",
                score <= value
                  ? "text-amber-400 fill-amber-400"
                  : "text-neutral-200 hover:text-neutral-300"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
