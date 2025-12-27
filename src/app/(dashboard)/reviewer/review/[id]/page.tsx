"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, Check, Music, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { funnels, track } from "@/lib/analytics";

interface Review {
  id: string;
  status: string;
  createdAt?: string;
  paidAmount?: number;
  firstImpression?: FirstImpression | null;
  productionScore?: number | null;
  vocalScore?: number | null;
  originalityScore?: number | null;
  wouldListenAgain?: boolean | null;
  perceivedGenre?: string | null;
  similarArtists?: string | null;
  bestPart?: string | null;
  weakestPart?: string | null;
  additionalNotes?: string | null;
  addressedArtistNote?: "YES" | "PARTIALLY" | "NO" | null;
  nextActions?: string | null;
  timestamps?: Array<{ seconds: number; note: string }> | null;
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

function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function countWords(text: string): number {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).length;
}

function getTierEarningsCents(tier: string | null | undefined): number {
  return tier === "PRO" ? 150 : 50;
}

function formatFirstImpression(value: FirstImpression | null | undefined) {
  if (!value) return "—";
  if (value === "STRONG_HOOK") return "Strong Hook";
  if (value === "DECENT") return "Decent";
  return "Lost Interest";
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const draftKey = `review_draft_${id}`;

  const lastHeartbeatSentAt = useRef<number>(0);
  const heartbeatInFlight = useRef(false);

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  // Form state
  const [listenTime, setListenTime] = useState(0);
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
  const [addressedArtistNote, setAddressedArtistNote] = useState<
    "YES" | "PARTIALLY" | "NO" | null
  >(null);
  const [nextActions, setNextActions] = useState("");
  const [timestampNotes, setTimestampNotes] = useState<
    Array<{ seconds: number; note: string }>
  >([]);
  const [playerSeconds, setPlayerSeconds] = useState(0);

  useEffect(() => {
    async function fetchReview() {
      try {
        const response = await fetch(`/api/reviews/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReview(data);
          if (data.status === "SKIPPED" || data.status === "EXPIRED") {
            try {
              localStorage.removeItem(draftKey);
            } catch {
            }

            const notice = data.status === "SKIPPED" ? "skipped" : "expired";
            router.push(`/reviewer/queue?notice=${notice}`);
            router.refresh();
            return;
          }
          if (data.status !== "COMPLETED") {
            funnels.review.start(data.track.id, data.id);
          }
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

  const isDirty =
    Boolean(firstImpression) ||
    productionScore > 0 ||
    vocalScore > 0 ||
    originalityScore > 0 ||
    wouldListenAgain !== null ||
    perceivedGenre.trim().length > 0 ||
    similarArtists.trim().length > 0 ||
    bestPart.trim().length > 0 ||
    weakestPart.trim().length > 0 ||
    additionalNotes.trim().length > 0 ||
    addressedArtistNote !== null ||
    nextActions.trim().length > 0 ||
    timestampNotes.some((t) => t.note.trim().length > 0);

  const confirmLeave = () => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Leave this review?");
  };

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!review) return;
      if (review.status === "COMPLETED") return;
      if (success) return;
      if (!isDirty) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, review, success]);

  useEffect(() => {
    if (!review) return;
    if (review.status === "COMPLETED") return;

    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        if (parsed && parsed.reviewId === review.id) {
          setFirstImpression(parsed.firstImpression ?? null);
          setProductionScore(typeof parsed.productionScore === "number" ? parsed.productionScore : 0);
          setVocalScore(typeof parsed.vocalScore === "number" ? parsed.vocalScore : 0);
          setOriginalityScore(typeof parsed.originalityScore === "number" ? parsed.originalityScore : 0);
          setWouldListenAgain(
            typeof parsed.wouldListenAgain === "boolean" ? parsed.wouldListenAgain : null
          );
          setPerceivedGenre(typeof parsed.perceivedGenre === "string" ? parsed.perceivedGenre : "");
          setSimilarArtists(typeof parsed.similarArtists === "string" ? parsed.similarArtists : "");
          setBestPart(typeof parsed.bestPart === "string" ? parsed.bestPart : "");
          setWeakestPart(typeof parsed.weakestPart === "string" ? parsed.weakestPart : "");
          setAdditionalNotes(typeof parsed.additionalNotes === "string" ? parsed.additionalNotes : "");
          setAddressedArtistNote(parsed.addressedArtistNote ?? null);
          setNextActions(typeof parsed.nextActions === "string" ? parsed.nextActions : "");
          setTimestampNotes(Array.isArray(parsed.timestampNotes) ? parsed.timestampNotes : []);
          setDraftSavedAt(typeof parsed.savedAt === "number" ? parsed.savedAt : null);
          setDraftReady(true);
          return;
        }
      }
    } catch {
    }

    setAddressedArtistNote(review.addressedArtistNote ?? null);
    setNextActions(typeof review.nextActions === "string" ? review.nextActions : "");
    setTimestampNotes(Array.isArray(review.timestamps) ? review.timestamps : []);
    setDraftReady(true);
  }, [draftKey, review]);

  useEffect(() => {
    if (!draftReady) return;
    if (!review) return;
    if (review.status === "COMPLETED") return;
    if (success) return;

    const handle = window.setTimeout(() => {
      const savedAt = Date.now();

      const payload = {
        reviewId: review.id,
        savedAt,
        firstImpression,
        productionScore,
        vocalScore,
        originalityScore,
        wouldListenAgain,
        perceivedGenre,
        similarArtists,
        bestPart,
        weakestPart,
        additionalNotes,
        addressedArtistNote,
        nextActions,
        timestampNotes,
      };

      try {
        localStorage.setItem(draftKey, JSON.stringify(payload));
        setDraftSavedAt(savedAt);
      } catch {
      }
    }, 500);

    return () => window.clearTimeout(handle);
  }, [
    draftKey,
    draftReady,
    review,
    success,
    firstImpression,
    productionScore,
    vocalScore,
    originalityScore,
    wouldListenAgain,
    perceivedGenre,
    similarArtists,
    bestPart,
    weakestPart,
    additionalNotes,
    addressedArtistNote,
    nextActions,
    timestampNotes,
  ]);

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

    if (!addressedArtistNote) {
      setError("Please indicate whether you addressed the artist note");
      return;
    }

    const actionLines = nextActions
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (actionLines.length < 3) {
      setError("Next actions must include at least 3 lines (one actionable step per line)");
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
          addressedArtistNote,
          nextActions,
          timestamps:
            timestampNotes
              .map((t) => ({ seconds: t.seconds, note: t.note.trim() }))
              .filter((t) => t.note.length > 0).length > 0
              ? timestampNotes
                  .map((t) => ({ seconds: t.seconds, note: t.note.trim() }))
                  .filter((t) => t.note.length > 0)
              : undefined,
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
        data.earnings || getTierEarningsCents(review.reviewer.tier)
      );

      try {
        localStorage.removeItem(draftKey);
      } catch {
      }

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

    if (!confirmLeave()) {
      return;
    }

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

      try {
        localStorage.removeItem(draftKey);
      } catch {
      }

      router.push("/reviewer/queue?notice=skipped");
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
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="border-2 border-black bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="border-2 border-black bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <div className="grid sm:grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-red-100 border-2 border-black flex items-center justify-center mx-auto mb-6">
          <Music className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
        <p className="text-neutral-600 mb-6">{error}</p>
        <Link href="/reviewer/queue">
          <Button variant="outline">Back to Queue</Button>
        </Link>
      </div>
    );
  }

  if (!review) return null;

  if (review.status === "COMPLETED") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/reviewer/history"
            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Link>
          <div className="text-right">
            <p className="text-xs text-neutral-600 font-mono">Earned</p>
            <p className="text-lg font-black">{formatCurrency(review.paidAmount ?? 0)}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b-2 border-black">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                <Music className="h-6 w-6 text-black" />
              </div>
              <div>
                <CardTitle className="text-xl">{review.track.title}</CardTitle>
                <p className="text-sm text-neutral-600">
                  {review.track.genres.map((g) => g.name).join(", ")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <AudioPlayer
              sourceUrl={review.track.sourceUrl}
              sourceType={review.track.sourceType}
              showListenTracker={false}
              showWaveform={review.track.sourceType === "UPLOAD"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b-2 border-black">
            <CardTitle>Your Submitted Review</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="px-3 py-1.5 bg-neutral-100 border-2 border-black">
                <span className="text-neutral-600">First impression:</span>{" "}
                <span className="font-bold">{formatFirstImpression(review.firstImpression)}</span>
              </div>
              {typeof review.productionScore === "number" && (
                <div className="px-3 py-1.5 bg-neutral-100 border-2 border-black">
                  <span className="text-neutral-600">Production:</span>{" "}
                  <span className="font-bold">{review.productionScore}/5</span>
                </div>
              )}
              {typeof review.vocalScore === "number" && (
                <div className="px-3 py-1.5 bg-neutral-100 border-2 border-black">
                  <span className="text-neutral-600">Vocals:</span>{" "}
                  <span className="font-bold">{review.vocalScore}/5</span>
                </div>
              )}
              {typeof review.originalityScore === "number" && (
                <div className="px-3 py-1.5 bg-neutral-100 border-2 border-black">
                  <span className="text-neutral-600">Originality:</span>{" "}
                  <span className="font-bold">{review.originalityScore}/5</span>
                </div>
              )}
              {review.wouldListenAgain !== null && review.wouldListenAgain !== undefined && (
                <div className="px-3 py-1.5 bg-neutral-100 border-2 border-black">
                  <span className="text-neutral-600">Would listen again:</span>{" "}
                  <span className="font-bold">{review.wouldListenAgain ? "Yes" : "No"}</span>
                </div>
              )}
            </div>

            {(review.perceivedGenre || review.similarArtists) && (
              <div className="text-sm p-3 bg-neutral-50 border-2 border-black">
                {review.perceivedGenre ? (
                  <p>
                    <span className="text-neutral-600 font-medium">Perceived genre:</span>{" "}
                    <span className="font-bold">{review.perceivedGenre}</span>
                  </p>
                ) : null}
                {review.similarArtists ? (
                  <p className={review.perceivedGenre ? "mt-1" : ""}>
                    <span className="text-neutral-600 font-medium">Similar artists:</span>{" "}
                    <span className="font-bold">{review.similarArtists}</span>
                  </p>
                ) : null}
              </div>
            )}

            {review.bestPart ? (
              <div className="bg-lime-50 border-2 border-lime-500 p-4">
                <p className="text-xs font-bold text-lime-700 mb-2">Best Part</p>
                <p className="text-sm text-lime-900">{review.bestPart}</p>
              </div>
            ) : null}

            {review.weakestPart ? (
              <div className="bg-red-50 border-2 border-red-400 p-4">
                <p className="text-xs font-bold text-red-700 mb-2">Areas for Improvement</p>
                <p className="text-sm text-red-900">{review.weakestPart}</p>
              </div>
            ) : null}

            {review.additionalNotes ? (
              <div className="bg-neutral-100 border-2 border-black p-4">
                <p className="text-xs font-bold text-neutral-700 mb-2">Additional Notes</p>
                <p className="text-sm text-neutral-800">{review.additionalNotes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  const bestPartWords = countWords(bestPart);
  const weakestPartWords = countWords(weakestPart);
  const nextActionCount = nextActions
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
  const meetsTextMinimum =
    bestPartWords >= MIN_WORDS_PER_SECTION &&
    weakestPartWords >= MIN_WORDS_PER_SECTION;
  const hasNextActions = nextActionCount >= 3;
  const hasAddressedArtistNote = addressedArtistNote !== null;

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-lime-500 border-2 border-black flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-black" />
        </div>
        <h2 className="text-2xl font-black mb-2">Review Submitted!</h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500 border-2 border-black mb-4">
          <DollarSign className="h-5 w-5 text-black" />
          <span className="font-black text-lg">
            +{formatCurrency(getTierEarningsCents(review.reviewer.tier))}
          </span>
        </div>
        <p className="text-neutral-600 mb-6">
          Your feedback helps artists improve their music.
        </p>
        <Link href="/reviewer/queue">
          <Button variant="primary">Continue Reviewing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (!confirmLeave()) return;
            router.push("/reviewer/queue");
            router.refresh();
          }}
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSkip}
          isLoading={isSkipping}
          className="w-full sm:w-auto"
        >
          Skip Track
        </Button>
      </div>

      {/* Track Info */}
      <Card>
        <CardHeader className="border-b-2 border-black">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
              <Music className="h-6 w-6 text-black" />
            </div>
            <div>
              <CardTitle className="text-xl">{review.track.title}</CardTitle>
              <p className="text-sm text-neutral-600">
                {review.track.genres.map((g) => g.name).join(", ")}
              </p>
            </div>
          </div>
          {review.track.feedbackFocus && (
            <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-400">
              <p className="text-sm font-bold text-amber-800">
                Artist note: <span className="font-medium">{review.track.feedbackFocus}</span>
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <AudioPlayer
            sourceUrl={review.track.sourceUrl}
            sourceType={review.track.sourceType}
            showWaveform={review.track.sourceType === "UPLOAD"}
            minListenTime={MIN_LISTEN_SECONDS}
            onTimeUpdate={(seconds) => setPlayerSeconds(seconds)}
            onListenProgress={(seconds) => {
              setListenTime((prev) => Math.max(prev, seconds));
              void maybeSendHeartbeat();
            }}
            onMinimumReached={() => {
              setCanSubmit(true);
              funnels.review.minimumReached(review.track.id, MIN_LISTEN_SECONDS);
            }}
            onAddTimestamp={
              review.track.sourceType === "UPLOAD"
                ? (seconds) => {
                    setTimestampNotes((prev) => [
                      ...prev,
                      { seconds, note: "" },
                    ]);
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader className="border-b-2 border-black">
          <CardTitle>Your Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {error}
            </div>
          )}

          {/* First Impression */}
          <div className="space-y-3">
            <Label className="text-base font-bold">First Impression (after 30 seconds)</Label>
            <div className="flex gap-2">
              {[
                { value: "STRONG_HOOK", label: "Strong Hook", color: "lime" },
                { value: "DECENT", label: "Decent", color: "orange" },
                { value: "LOST_INTEREST", label: "Lost Interest", color: "neutral" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFirstImpression(option.value as FirstImpression)}
                  className={cn(
                    "flex-1 py-2.5 px-3 text-sm font-bold transition-colors border-2 border-black",
                    firstImpression === option.value
                      ? option.color === "lime"
                        ? "bg-lime-500 text-black"
                        : option.color === "orange"
                        ? "bg-orange-400 text-black"
                        : "bg-neutral-800 text-white"
                      : "bg-white text-black hover:bg-neutral-100"
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
          <div className="space-y-3">
            <Label className="text-base font-bold">Would you listen to this again?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWouldListenAgain(true)}
                className={cn(
                  "flex-1 py-2.5 px-3 text-sm font-bold transition-colors border-2 border-black",
                  wouldListenAgain === true
                    ? "bg-lime-500 text-black"
                    : "bg-white text-black hover:bg-neutral-100"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldListenAgain(false)}
                className={cn(
                  "flex-1 py-2.5 px-3 text-sm font-bold transition-colors border-2 border-black",
                  wouldListenAgain === false
                    ? "bg-neutral-800 text-white"
                    : "bg-white text-black hover:bg-neutral-100"
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
          <div className="space-y-3">
            <Label htmlFor="best" className="text-base font-bold">Best part of the track *</Label>
            <textarea
              id="best"
              placeholder="What stood out to you? What worked well?"
              value={bestPart}
              onChange={(e) => setBestPart(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            />
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs font-mono",
                bestPartWords >= MIN_WORDS_PER_SECTION ? "text-lime-600" : "text-neutral-500"
              )}>
                {bestPartWords}/{MIN_WORDS_PER_SECTION} words
              </p>
              {bestPartWords >= MIN_WORDS_PER_SECTION && (
                <span className="text-xs font-bold text-lime-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="weakest" className="text-base font-bold">Weakest part / Areas for improvement *</Label>
            <textarea
              id="weakest"
              placeholder="What could be better? Be constructive."
              value={weakestPart}
              onChange={(e) => setWeakestPart(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            />
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs font-mono",
                weakestPartWords >= MIN_WORDS_PER_SECTION ? "text-lime-600" : "text-neutral-500"
              )}>
                {weakestPartWords}/{MIN_WORDS_PER_SECTION} words
              </p>
              {weakestPartWords >= MIN_WORDS_PER_SECTION && (
                <span className="text-xs font-bold text-lime-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-bold">Additional notes (optional)</Label>
            <textarea
              id="notes"
              placeholder="Any other thoughts..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            />
          </div>

          {/* Did you address the artist note */}
          <div className="space-y-3">
            <Label className="text-base font-bold">Did you address the artist note? *</Label>
            <div className="flex gap-2">
              {([
                { value: "YES", label: "Yes" },
                { value: "PARTIALLY", label: "Partially" },
                { value: "NO", label: "No" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAddressedArtistNote(opt.value)}
                  className={cn(
                    "flex-1 py-2.5 px-3 text-sm font-bold transition-colors border-2 border-black",
                    addressedArtistNote === opt.value
                      ? "bg-purple-400 text-black"
                      : "bg-white text-black hover:bg-neutral-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="next-actions" className="text-base font-bold">Next actions (3+ lines) *</Label>
            <textarea
              id="next-actions"
              placeholder={`- Lower the vocal 1-2 dB in the hook\n- Reduce reverb tail on the snare\n- Tighten the drop by shortening the pre-drop fill`}
              value={nextActions}
              onChange={(e) => setNextActions(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-base font-bold">Timestamped notes (optional)</Label>
              <button
                type="button"
                onClick={() => {
                  if (!review) return;
                  if (review.track.sourceType !== "UPLOAD") {
                    setError("Timestamps are only available for uploaded tracks right now.");
                    return;
                  }
                  setTimestampNotes((prev) => [
                    ...prev,
                    { seconds: Math.floor(playerSeconds), note: "" },
                  ]);
                }}
                className="px-3 py-2 text-xs font-bold border-2 border-black bg-white hover:bg-neutral-100"
              >
                Add current time ({formatTimestamp(playerSeconds)})
              </button>
            </div>

            {timestampNotes.length === 0 ? (
              <p className="text-xs text-neutral-600 font-mono">
                Tip: click the waveform to jump to a moment, then add a timestamp note.
              </p>
            ) : (
              <div className="space-y-2">
                {timestampNotes.map((t, idx) => (
                  <div key={`${t.seconds}-${idx}`} className="border-2 border-black p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-mono text-neutral-600">
                        {formatTimestamp(t.seconds)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTimestampNotes((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-xs font-bold text-neutral-600 hover:text-black"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      value={t.note}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTimestampNotes((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, note: v } : p))
                        );
                      }}
                      placeholder="What happens here? (e.g. drop hits hard, vocal gets buried, etc.)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Card */}
      <Card className="bg-black text-white border-black">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-neutral-400 text-sm font-medium">You&apos;ll earn</p>
              <p className="text-3xl font-black text-lime-500">
                {formatCurrency(getTierEarningsCents(review.reviewer.tier))}
              </p>
              {draftSavedAt ? (
                <p className="text-neutral-400 text-xs font-mono mt-2">
                  Draft saved {new Date(draftSavedAt).toLocaleTimeString()}
                </p>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                {canSubmit ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-500 text-black font-bold text-xs">
                    <Check className="h-3 w-3" /> Listening complete
                  </span>
                ) : (
                  <span className="text-neutral-400 font-mono">
                    {formatTimestamp(Math.min(listenTime, MIN_LISTEN_SECONDS))}/{formatTimestamp(MIN_LISTEN_SECONDS)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
                {meetsTextMinimum ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-500 text-black font-bold text-xs">
                    <Check className="h-3 w-3" /> Feedback complete
                  </span>
                ) : (
                  <span className="text-neutral-400 font-mono">
                    {MIN_WORDS_PER_SECTION} words min per section
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
                {hasNextActions ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-500 text-black font-bold text-xs">
                    <Check className="h-3 w-3" /> Next actions ready
                  </span>
                ) : (
                  <span className="text-neutral-400 font-mono">
                    Next actions: {nextActionCount}/3 lines
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
                {hasAddressedArtistNote ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-500 text-black font-bold text-xs">
                    <Check className="h-3 w-3" /> Artist note answered
                  </span>
                ) : (
                  <span className="text-neutral-400 font-mono">
                    Address artist note
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!canSubmit || !meetsTextMinimum || !hasNextActions || !hasAddressedArtistNote}
            variant="primary"
            className="w-full"
          >
            {canSubmit && meetsTextMinimum && hasNextActions && hasAddressedArtistNote
              ? `Submit Review & Earn ${formatCurrency(getTierEarningsCents(review.reviewer.tier))}`
              : "Complete requirements to submit"}
          </Button>
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
    <div className="space-y-3">
      <Label className="font-bold">{label}</Label>
      <div className="flex gap-1 p-2 border-2 border-black bg-white">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className="flex-1 p-1 hover:bg-neutral-100 transition-colors"
          >
            <Star
              className={cn(
                "h-6 w-6 mx-auto transition-colors",
                score <= value
                  ? "text-amber-500 fill-amber-500"
                  : "text-neutral-300 hover:text-neutral-400"
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs font-mono text-neutral-600 text-center">{value}/5</p>
      )}
    </div>
  );
}
