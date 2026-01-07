"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, Check, Music, DollarSign, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { funnels, track } from "@/lib/analytics";

interface Review {
  id: string;
  status: string;
  createdAt?: string;
  paidAmount?: number;
  listenDuration?: number;
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
  const [isMarkingUnplayable, setIsMarkingUnplayable] = useState(false);
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
  const [wouldAddToPlaylist, setWouldAddToPlaylist] = useState<boolean | null>(null);
  const [wouldShare, setWouldShare] = useState<boolean | null>(null);
  const [wouldFollow, setWouldFollow] = useState<boolean | null>(null);
  const [perceivedGenre, setPerceivedGenre] = useState("");
  const [similarArtists, setSimilarArtists] = useState("");
  const [bestPart, setBestPart] = useState("");
  const [weakestPart, setWeakestPart] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [timestampNotes, setTimestampNotes] = useState<
    Array<{ seconds: number; note: string }>
  >([]);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [validationIssues, setValidationIssues] = useState<Array<{ id: string; message: string; section: string }>>([]);

  // Section refs for scroll-to functionality
  const firstImpressionRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef<HTMLDivElement>(null);
  const wouldListenAgainRef = useRef<HTMLDivElement>(null);
  const bestPartRef = useRef<HTMLDivElement>(null);
  const weakestPartRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((sectionId: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      firstImpression: firstImpressionRef,
      scores: scoresRef,
      wouldListenAgain: wouldListenAgainRef,
      bestPart: bestPartRef,
      weakestPart: weakestPartRef,
    };
    const ref = refs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

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
    wouldAddToPlaylist !== null ||
    wouldShare !== null ||
    wouldFollow !== null ||
    perceivedGenre.trim().length > 0 ||
    similarArtists.trim().length > 0 ||
    bestPart.trim().length > 0 ||
    weakestPart.trim().length > 0 ||
    additionalNotes.trim().length > 0 ||
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

    // Restore listen time from server first (most reliable)
    const serverListenTime = typeof review.listenDuration === "number" ? review.listenDuration : 0;

    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        if (parsed && parsed.reviewId === review.id) {
          // Use max of draft and server listen time
          const draftListenTime = typeof parsed.listenTime === "number" ? parsed.listenTime : 0;
          const restoredListenTime = Math.max(draftListenTime, serverListenTime);
          setListenTime(restoredListenTime);
          if (restoredListenTime >= MIN_LISTEN_SECONDS) {
            setCanSubmit(true);
          }
          setFirstImpression(parsed.firstImpression ?? null);
          setProductionScore(typeof parsed.productionScore === "number" ? parsed.productionScore : 0);
          setVocalScore(typeof parsed.vocalScore === "number" ? parsed.vocalScore : 0);
          setOriginalityScore(typeof parsed.originalityScore === "number" ? parsed.originalityScore : 0);
          setWouldListenAgain(
            typeof parsed.wouldListenAgain === "boolean" ? parsed.wouldListenAgain : null
          );
          setWouldAddToPlaylist(
            typeof parsed.wouldAddToPlaylist === "boolean" ? parsed.wouldAddToPlaylist : null
          );
          setWouldShare(
            typeof parsed.wouldShare === "boolean" ? parsed.wouldShare : null
          );
          setWouldFollow(
            typeof parsed.wouldFollow === "boolean" ? parsed.wouldFollow : null
          );
          setPerceivedGenre(typeof parsed.perceivedGenre === "string" ? parsed.perceivedGenre : "");
          setSimilarArtists(typeof parsed.similarArtists === "string" ? parsed.similarArtists : "");
          setBestPart(typeof parsed.bestPart === "string" ? parsed.bestPart : "");
          setWeakestPart(typeof parsed.weakestPart === "string" ? parsed.weakestPart : "");
          setAdditionalNotes(typeof parsed.additionalNotes === "string" ? parsed.additionalNotes : "");
          setNextActions(typeof parsed.nextActions === "string" ? parsed.nextActions : "");
          setTimestampNotes(Array.isArray(parsed.timestampNotes) ? parsed.timestampNotes : []);
          setDraftSavedAt(typeof parsed.savedAt === "number" ? parsed.savedAt : null);
          setDraftReady(true);
          return;
        }
      }
    } catch {
    }

    // No draft found, restore from server
    if (serverListenTime > 0) {
      setListenTime(serverListenTime);
      if (serverListenTime >= MIN_LISTEN_SECONDS) {
        setCanSubmit(true);
      }
    }
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
        listenTime,
        firstImpression,
        productionScore,
        vocalScore,
        originalityScore,
        wouldListenAgain,
        wouldAddToPlaylist,
        wouldShare,
        wouldFollow,
        perceivedGenre,
        similarArtists,
        bestPart,
        weakestPart,
        additionalNotes,
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
    listenTime,
    firstImpression,
    productionScore,
    vocalScore,
    originalityScore,
    wouldListenAgain,
    wouldAddToPlaylist,
    wouldShare,
    wouldFollow,
    perceivedGenre,
    similarArtists,
    bestPart,
    weakestPart,
    additionalNotes,
    nextActions,
    timestampNotes,
  ]);

  const handleSubmit = async () => {
    if (!review) return;

    // Build validation issues
    const issues: Array<{ id: string; message: string; section: string }> = [];

    if (!firstImpression) {
      issues.push({ id: "firstImpression", message: "Select your first impression", section: "firstImpression" });
    }
    if (productionScore === 0) {
      issues.push({ id: "productionScore", message: "Rate the production quality", section: "scores" });
    }
    if (originalityScore === 0) {
      issues.push({ id: "originalityScore", message: "Rate the originality", section: "scores" });
    }
    if (wouldListenAgain === null) {
      issues.push({ id: "wouldListenAgain", message: "Indicate if you would listen again", section: "wouldListenAgain" });
    }
    if (countWords(bestPart) < MIN_WORDS_PER_SECTION) {
      issues.push({ id: "bestPart", message: `Best part needs ${MIN_WORDS_PER_SECTION - countWords(bestPart)} more words`, section: "bestPart" });
    }
    if (countWords(weakestPart) < MIN_WORDS_PER_SECTION) {
      issues.push({ id: "weakestPart", message: `Weakest part needs ${MIN_WORDS_PER_SECTION - countWords(weakestPart)} more words`, section: "weakestPart" });
    }

    if (issues.length > 0) {
      setValidationIssues(issues);
      setError("");
      // Scroll to first issue
      scrollToSection(issues[0].section);
      return;
    }

    setValidationIssues([]);
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
          wouldAddToPlaylist,
          wouldShare,
          wouldFollow,
          perceivedGenre: perceivedGenre || undefined,
          similarArtists: similarArtists || undefined,
          bestPart,
          weakestPart,
          additionalNotes: additionalNotes || undefined,
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

  const handleUnplayable = async () => {
    if (!review) return;

    if (!confirmLeave()) {
      return;
    }

    setError("");
    setIsMarkingUnplayable(true);

    try {
      const response = await fetch(`/api/reviews/${review.id}/unplayable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || "Failed to mark review unplayable";

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

      router.push("/reviewer/queue?notice=unplayable");
      router.refresh();
    } catch {
      setError("Failed to mark review unplayable");
    } finally {
      setIsMarkingUnplayable(false);
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
  const meetsTextMinimum =
    bestPartWords >= MIN_WORDS_PER_SECTION &&
    weakestPartWords >= MIN_WORDS_PER_SECTION;

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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnplayable}
            isLoading={isMarkingUnplayable}
            className="w-full sm:w-auto"
          >
            Audio not working
          </Button>
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
            initialListenTime={listenTime}
            onTimeUpdate={(seconds) => setPlayerSeconds(seconds)}
            onListenProgress={(seconds) => {
              setListenTime((prev) => Math.max(prev, seconds));
              void maybeSendHeartbeat();
            }}
            onMinimumReached={() => {
              setCanSubmit(true);
              funnels.review.minimumReached(review.track.id, MIN_LISTEN_SECONDS);
            }}
            onAddTimestamp={(seconds) => {
              setTimestampNotes((prev) => [
                ...prev,
                { seconds, note: "" },
              ]);
            }}
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
          <div
            ref={firstImpressionRef}
            className={cn(
              "space-y-3 p-4 -m-4 rounded-lg transition-colors",
              validationIssues.some((i) => i.section === "firstImpression") && "bg-red-50 border-2 border-red-300"
            )}
          >
            <Label className="text-base font-bold">First Impression (after 30 seconds)</Label>
            {validationIssues.some((i) => i.section === "firstImpression") && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationIssues.find((i) => i.section === "firstImpression")?.message}
              </p>
            )}
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
          <div
            ref={scoresRef}
            className={cn(
              "p-4 -m-4 rounded-lg transition-colors",
              validationIssues.some((i) => i.section === "scores") && "bg-red-50 border-2 border-red-300"
            )}
          >
            {validationIssues.some((i) => i.section === "scores") && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1 mb-3">
                <AlertTriangle className="h-3 w-3" />
                {validationIssues.filter((i) => i.section === "scores").map((i) => i.message).join(", ")}
              </p>
            )}
            <div className="grid sm:grid-cols-3 gap-4">
              <ScoreInput
                label="Production Quality"
                value={productionScore}
                onChange={setProductionScore}
                hasError={validationIssues.some((i) => i.id === "productionScore")}
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
                hasError={validationIssues.some((i) => i.id === "originalityScore")}
              />
            </div>
          </div>

          {/* Would Listen Again */}
          <div
            ref={wouldListenAgainRef}
            className={cn(
              "space-y-3 p-4 -m-4 rounded-lg transition-colors",
              validationIssues.some((i) => i.section === "wouldListenAgain") && "bg-red-50 border-2 border-red-300"
            )}
          >
            <Label className="text-base font-bold">Would you listen to this again?</Label>
            {validationIssues.some((i) => i.section === "wouldListenAgain") && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationIssues.find((i) => i.section === "wouldListenAgain")?.message}
              </p>
            )}
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

          {/* Listener Signals */}
          <div className="space-y-4 p-4 bg-neutral-50 border-2 border-black mt-4">
            <div>
              <Label className="text-base font-bold">Quick Listener Signals</Label>
              <p className="text-xs text-neutral-600 mt-1">Help the artist understand how listeners might engage with this track</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {/* Would add to playlist */}
              <div className="space-y-2">
                <Label className="text-sm">Add to playlist?</Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setWouldAddToPlaylist(true)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors border-2 border-black",
                      wouldAddToPlaylist === true
                        ? "bg-lime-500 text-black"
                        : "bg-white text-black hover:bg-neutral-100"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldAddToPlaylist(false)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors border-2 border-black",
                      wouldAddToPlaylist === false
                        ? "bg-neutral-800 text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Would share */}
              <div className="space-y-2">
                <Label className="text-sm">Share with a friend?</Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setWouldShare(true)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors border-2 border-black",
                      wouldShare === true
                        ? "bg-lime-500 text-black"
                        : "bg-white text-black hover:bg-neutral-100"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldShare(false)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors border-2 border-black",
                      wouldShare === false
                        ? "bg-neutral-800 text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Would follow */}
              <div className="space-y-2">
                <Label className="text-sm">Follow this artist?</Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setWouldFollow(true)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors border-2 border-black",
                      wouldFollow === true
                        ? "bg-lime-500 text-black"
                        : "bg-white text-black hover:bg-neutral-100"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldFollow(false)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors border-2 border-black",
                      wouldFollow === false
                        ? "bg-neutral-800 text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    )}
                  >
                    No
                  </button>
                </div>
              </div>
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

          {/* Best Part */}
          <div ref={bestPartRef} className={cn("space-y-3 p-4 -m-4 rounded-lg transition-colors", validationIssues.some((i) => i.section === "bestPart") && "bg-red-50 border-2 border-red-300")}>
            <Label htmlFor="best" className="text-base font-bold">Best part of the track *</Label>
            {validationIssues.some((i) => i.section === "bestPart") && (<p className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{validationIssues.find((i) => i.section === "bestPart")?.message}</p>)}
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

          {/* Weakest Part */}
          <div ref={weakestPartRef} className={cn("space-y-3 p-4 -m-4 rounded-lg transition-colors", validationIssues.some((i) => i.section === "weakestPart") && "bg-red-50 border-2 border-red-300")}>
            <Label htmlFor="weakest" className="text-base font-bold">Weakest part / Areas for improvement *</Label>
            {validationIssues.some((i) => i.section === "weakestPart") && (<p className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{validationIssues.find((i) => i.section === "weakestPart")?.message}</p>)}
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

          {/* Timestamped notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-base font-bold">Timestamped notes (optional)</Label>
              {review.track.sourceType === "UPLOAD" && (
                <button
                  type="button"
                  onClick={() => {
                    setTimestampNotes((prev) => [
                      ...prev,
                      { seconds: Math.floor(playerSeconds), note: "" },
                    ]);
                  }}
                  className="px-3 py-2 text-xs font-bold border-2 border-black bg-white hover:bg-neutral-100"
                >
                  Add current time ({formatTimestamp(playerSeconds)})
                </button>
              )}
            </div>

            {timestampNotes.length === 0 ? (
              <p className="text-xs text-neutral-600 font-mono">
                {review.track.sourceType === "UPLOAD"
                  ? "Tip: click the waveform to jump to a moment, then add a timestamp note."
                  : "Tip: use the \"Add timestamp\" button while playing to mark specific moments."}
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
            </div>
          </div>

          {/* Validation Warnings */}
          {validationIssues.length > 0 && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Please fix {validationIssues.length} issue{validationIssues.length === 1 ? "" : "s"} before submitting:
              </p>
              <div className="space-y-1">
                {validationIssues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => scrollToSection(issue.section)}
                    className="w-full text-left text-sm text-red-200 hover:text-white hover:bg-red-500/30 px-2 py-1 rounded transition-colors flex items-center gap-2"
                  >
                    <span className="text-red-400">→</span>
                    {issue.message}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!canSubmit || !meetsTextMinimum}
            variant="primary"
            className="w-full"
          >
            {canSubmit && meetsTextMinimum
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
  hasError = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasError?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className={cn("font-bold", hasError && "text-red-600")}>{label}</Label>
      <div className={cn("flex gap-1 p-2 border-2 bg-white", hasError ? "border-red-400" : "border-black")}>
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
