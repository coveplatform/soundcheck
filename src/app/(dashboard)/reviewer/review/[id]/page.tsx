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
import { ScoreInput } from "@/components/ui/score-input";
import { YesNoToggle } from "@/components/ui/yes-no-toggle";
import { WordCounter, countWords } from "@/components/ui/word-counter";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ArrowLeft, Check, Music, DollarSign, AlertTriangle, Download, ShoppingCart, SkipForward, VolumeX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { funnels, track } from "@/lib/analytics";
import { getReferralCookie, clearReferralCookie } from "@/lib/referral";
import { Review, FirstImpression, MIN_LISTEN_SECONDS, MIN_WORDS_PER_SECTION } from "./types";
import {
  formatTimestamp,
  getTierEarningsCents,
  formatFirstImpression,
  makeClientId,
  firstImpressionLabel,
  firstImpressionColor,
  firstImpressionEnumFromScore,
} from "./utils";

// Types and utilities imported from ./types and ./utils

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
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showUnplayableDialog, setShowUnplayableDialog] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Purchase state
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [reviewerBalance, setReviewerBalance] = useState<number | null>(null);

  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  // Form state
  const [listenTime, setListenTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(null);
  const [firstImpressionScore, setFirstImpressionScore] = useState<number>(3);
  const [firstImpressionTouched, setFirstImpressionTouched] = useState(false);
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
    Array<{ id: string; seconds: number; note: string }>
  >([]);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [pendingTimestampFocusId, setPendingTimestampFocusId] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<Array<{ id: string; message: string; section: string }>>([]);

  // Section refs for scroll-to functionality
  const firstImpressionRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef<HTMLDivElement>(null);
  const wouldListenAgainRef = useRef<HTMLDivElement>(null);
  const bestPartRef = useRef<HTMLDivElement>(null);
  const weakestPartRef = useRef<HTMLDivElement>(null);
  const timestampNotesRef = useRef<HTMLDivElement>(null);
  const timestampInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const scrollToSection = useCallback((sectionId: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      firstImpression: firstImpressionRef,
      scores: scoresRef,
      wouldListenAgain: wouldListenAgainRef,
      bestPart: bestPartRef,
      weakestPart: weakestPartRef,
      timestamps: timestampNotesRef,
    };
    const ref = refs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const addTimestampNote = useCallback((seconds: number) => {
    const id = makeClientId();
    setTimestampNotes((prev) => {
      const next = [...prev, { id, seconds: Math.max(0, Math.floor(seconds)), note: "" }];
      next.sort((a, b) => (a.seconds - b.seconds) || a.id.localeCompare(b.id));
      return next;
    });
    setPendingTimestampFocusId(id);
    setTimeout(() => scrollToSection("timestamps"), 0);
  }, [scrollToSection]);

  useEffect(() => {
    if (!pendingTimestampFocusId) return;
    const el = timestampInputRefs.current[pendingTimestampFocusId];
    if (el) {
      el.focus();
    }
    setPendingTimestampFocusId(null);
  }, [pendingTimestampFocusId]);

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
            // Keep loading state active during navigation
            router.push(`/review?notice=${notice}`);
            router.refresh();
            return;
          }
          if (data.status !== "COMPLETED") {
            funnels.review.start(data.Track.id, data.id);
          }
          setIsLoading(false);
        } else {
          const data = await response.json().catch(() => null);
          const message = data?.error || "Review not found";

          if (response.status === 401) {
            // Keep loading state active during navigation
            router.push("/login");
            router.refresh();
            return;
          }

          if (response.status === 403) {
            if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
              // Keep loading state active during navigation
              router.push("/onboarding");
              router.refresh();
              return;
            }
            if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
              // Keep loading state active during navigation
              router.push("/dashboard");
              router.refresh();
              return;
            }
          }

          setError(message);
          setIsLoading(false);
        }
      } catch {
        setError("Failed to load review");
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
          const restoredScore = typeof parsed.firstImpressionScore === "number" ? parsed.firstImpressionScore : null;
          if (restoredScore && restoredScore >= 1 && restoredScore <= 5) {
            setFirstImpressionScore(restoredScore);
            setFirstImpressionTouched(true);
            setFirstImpression(firstImpressionEnumFromScore(restoredScore));
          } else if (parsed.firstImpression) {
            setFirstImpressionTouched(true);
            setFirstImpressionScore(parsed.firstImpression === "STRONG_HOOK" ? 5 : parsed.firstImpression === "DECENT" ? 3 : 1);
          }
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
          const restoredTimestamps = Array.isArray(parsed.timestampNotes) ? parsed.timestampNotes : [];
          const normalized = restoredTimestamps
            .map((t: unknown) => {
              if (!t || typeof t !== "object") return null;
              const rec = t as Record<string, unknown>;
              const seconds = typeof rec.seconds === "number" ? rec.seconds : null;
              const note = typeof rec.note === "string" ? rec.note : "";
              if (seconds === null) return null;
              return { id: typeof rec.id === "string" ? rec.id : makeClientId(), seconds, note };
            })
            .filter(Boolean) as Array<{ id: string; seconds: number; note: string }>;
          normalized.sort((a, b) => (a.seconds - b.seconds) || a.id.localeCompare(b.id));
          setTimestampNotes(normalized);
          setDraftSavedAt(typeof parsed.savedAt === "number" ? parsed.savedAt : null);
          setDraftReady(true);
          return;
        }
      }
    } catch {
      // Draft parse failed, fall through to restore from server
    }

    // No draft found or draft didn't match, restore from server
    setListenTime(serverListenTime);
    if (serverListenTime >= MIN_LISTEN_SECONDS) {
      setCanSubmit(true);
    }

    const initialTimestamps = Array.isArray(review.timestamps) ? review.timestamps : [];
    const normalized = initialTimestamps
      .map((t) => ({ id: makeClientId(), seconds: t.seconds, note: t.note }))
      .sort((a, b) => (a.seconds - b.seconds) || a.id.localeCompare(b.id));
    setTimestampNotes(normalized);

    if (review.firstImpression) {
      setFirstImpressionTouched(true);
      setFirstImpressionScore(review.firstImpression === "STRONG_HOOK" ? 5 : review.firstImpression === "DECENT" ? 3 : 1);
      setFirstImpression(review.firstImpression);
    }
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
        firstImpressionScore,
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

    if (!firstImpression || !firstImpressionTouched) {
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
          // Keep loading state active during navigation
          router.push("/login");
          router.refresh();
          return;
        }

        if (response.status === 403) {
          if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
            // Keep loading state active during navigation
            router.push("/onboarding");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
            // Keep loading state active during navigation
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }

        setError(message);
        track("review_form_validation_failed", { field: "api", error: message });
        setIsSubmitting(false);
        return;
      }

      // Track successful review completion
      funnels.review.complete(
        review.Track.id,
        review.id,
        data.earnings || (review.ReviewerProfile ? getTierEarningsCents(review.ReviewerProfile.tier) : 0)
      );

      try {
        localStorage.removeItem(draftKey);
      } catch {
      }

      // Keep loading state active - success screen will handle any navigation
      setSuccess(true);
    } catch {
      setError("Something went wrong");
      track("review_form_validation_failed", { field: "api", error: "network_error" });
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!review) return;

    setShowSkipDialog(false);
    setError("");
    setIsSkipping(true);
    track("reviewer_track_skipped", { trackId: review.Track.id });

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
          // Keep loading state active during navigation
          router.push("/login");
          router.refresh();
          return;
        }

        if (response.status === 403) {
          if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
            // Keep loading state active during navigation
            router.push("/onboarding");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
            // Keep loading state active during navigation
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }

        setError(message);
        setIsSkipping(false);
        return;
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {
      }

      // Keep loading state active during navigation
      router.push("/review?notice=skipped");
      router.refresh();
    } catch {
      setError("Failed to skip review");
      setIsSkipping(false);
    }
  };

  const handleUnplayable = async () => {
    if (!review) return;

    setShowUnplayableDialog(false);
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
          // Keep loading state active during navigation
          router.push("/login");
          router.refresh();
          return;
        }

        if (response.status === 403) {
          if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
            // Keep loading state active during navigation
            router.push("/onboarding");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
            // Keep loading state active during navigation
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }

        setError(message);
        setIsMarkingUnplayable(false);
        return;
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {
      }

      // Keep loading state active during navigation
      router.push("/review?notice=unplayable");
      router.refresh();
    } catch {
      setError("Failed to mark review unplayable");
      setIsMarkingUnplayable(false);
    }
  };

  const handlePurchase = async () => {
    if (!review) return;

    setPurchaseError("");
    setIsPurchasing(true);

    try {
      // Get referral data from cookie if it matches this track
      const referralCookie = getReferralCookie();
      const referral =
        referralCookie && referralCookie.trackId === review.Track.id
          ? { reviewerId: referralCookie.reviewerId, shareId: referralCookie.shareId }
          : undefined;

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: review.Track.id, referral }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPurchaseError(data?.error || "Failed to purchase track");
        return;
      }

      // Clear referral cookie after successful purchase
      clearReferralCookie();

      setHasPurchased(true);
      // Update balance after purchase
      if (reviewerBalance !== null) {
        setReviewerBalance(reviewerBalance - 50);
      }
    } catch {
      setPurchaseError("Failed to purchase track");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDownload = async () => {
    if (!review) return;

    try {
      const response = await fetch(`/api/tracks/${review.Track.id}/download`);
      const data = await response.json();

      if (!response.ok) {
        setPurchaseError(data?.error || "Failed to get download link");
        return;
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename || "track.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setPurchaseError("Failed to download track");
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
          if (msg.includes("onboarding")) {
            router.push("/onboarding");
            router.refresh();
            return;
          }
          if (msg.includes("restricted")) {
            router.push("/dashboard");
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
      <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="rounded-3xl border border-black/10 bg-white/70 p-6 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="rounded-3xl border border-black/10 bg-white/70 p-6 space-y-4">
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
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="pt-8 pb-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 text-center py-20">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Music className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
        <p className="text-neutral-600 mb-6">{error}</p>
        <Link href="/review">
          <Button variant="outline">Back to Queue</Button>
        </Link>
      </div>
      </div>
    );
  }

  if (!review) return null;

  if (review.status === "COMPLETED") {
    return (
      <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/review/history"
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

        <Card variant="soft" elevated>
          <CardHeader className="border-b border-black/10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Music className="h-6 w-6 text-neutral-400" />
              </div>
              <div>
                <CardTitle className="text-xl">{review.Track.title}</CardTitle>
                <p className="text-sm text-neutral-600">
                  {review.Track.Genre.map((g) => g.name).join(", ")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <AudioPlayer
              sourceUrl={review.Track.sourceUrl}
              sourceType={review.Track.sourceType}
              showListenTracker={false}
              showWaveform={review.Track.sourceType === "UPLOAD"}
            />
          </CardContent>
        </Card>

        <Card variant="soft" elevated>
          <CardHeader className="border-b border-black/10">
            <CardTitle>Your Submitted Review</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                <span className="text-neutral-600">First impression:</span>{" "}
                <span className="font-bold">{formatFirstImpression(review.firstImpression)}</span>
              </div>
              {typeof review.productionScore === "number" && (
                <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                  <span className="text-neutral-600">Production:</span>{" "}
                  <span className="font-bold">{review.productionScore}/5</span>
                </div>
              )}
              {typeof review.vocalScore === "number" && (
                <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                  <span className="text-neutral-600">Vocals:</span>{" "}
                  <span className="font-bold">{review.vocalScore}/5</span>
                </div>
              )}
              {typeof review.originalityScore === "number" && (
                <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                  <span className="text-neutral-600">Originality:</span>{" "}
                  <span className="font-bold">{review.originalityScore}/5</span>
                </div>
              )}
              {review.wouldListenAgain !== null && review.wouldListenAgain !== undefined && (
                <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-2xl">
                  <span className="text-neutral-600">Would listen again:</span>{" "}
                  <span className="font-bold">{review.wouldListenAgain ? "Yes" : "No"}</span>
                </div>
              )}
            </div>

            {(review.perceivedGenre || review.similarArtists) && (
              <div className="text-sm p-3 bg-white/70 border border-black/10 rounded-2xl">
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
              <div className="bg-lime-50 border border-lime-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-lime-700 mb-2">Best Part</p>
                <p className="text-sm text-lime-900">{review.bestPart}</p>
              </div>
            ) : null}

            {review.weakestPart ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-700 mb-2">Areas for Improvement</p>
                <p className="text-sm text-red-900">{review.weakestPart}</p>
              </div>
            ) : null}

            {review.additionalNotes ? (
              <div className="bg-neutral-50 border border-black/10 rounded-2xl p-4">
                <p className="text-xs font-bold text-neutral-700 mb-2">Additional Notes</p>
                <p className="text-sm text-neutral-800">{review.additionalNotes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      </div>
    );
  }

  const bestPartWords = countWords(bestPart);
  const weakestPartWords = countWords(weakestPart);
  const meetsTextMinimum =
    bestPartWords >= MIN_WORDS_PER_SECTION &&
    weakestPartWords >= MIN_WORDS_PER_SECTION;

  if (success) {
    const canPurchase = review.Track.sourceType === "UPLOAD" && review.Track.allowPurchase;

    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 text-center py-20">
        <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-black" />
        </div>
        <h2 className="text-2xl font-black mb-2">Review Submitted!</h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500 border border-lime-400 mb-4 rounded-full">
          <DollarSign className="h-5 w-5 text-black" />
          <span className="font-black text-lg">
            {review.ReviewerProfile
              ? `+${formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier))}`
              : "+1 credit"}
          </span>
        </div>
        <p className="text-neutral-600 mb-6">
          Your feedback helps artists improve their music.
        </p>

        {/* Purchase option for uploaded tracks */}
        {canPurchase && (
          <div className="mb-6 p-4 border border-black/10 bg-white/70 rounded-3xl text-left">
            <div className="flex items-center gap-3 mb-3">
              <Music className="h-5 w-5 text-neutral-600" />
              <div>
                <p className="font-bold text-black">{review.Track.title}</p>
                {review.Track.ArtistProfile?.artistName && (
                  <p className="text-sm text-neutral-500">{review.Track.ArtistProfile.artistName}</p>
                )}
              </div>
            </div>

            {purchaseError && (
              <p className="text-sm text-red-600 mb-3">{purchaseError}</p>
            )}

            {hasPurchased ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download MP3
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePurchase}
                isLoading={isPurchasing}
                disabled={isPurchasing}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Track - $0.50
              </Button>
            )}
            <p className="text-xs text-neutral-500 mt-2 text-center">
              {hasPurchased ? "Thanks for supporting the artist!" : "Support the artist by purchasing their track"}
            </p>
          </div>
        )}

        <Link href="/review">
          <Button variant="primary">Continue Listening</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (!confirmLeave()) return;
            router.push("/review");
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
            onClick={() => setShowUnplayableDialog(true)}
            isLoading={isMarkingUnplayable}
            className="w-full sm:w-auto"
          >
            Audio not working
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowSkipDialog(true)}
            isLoading={isSkipping}
            className="w-full sm:w-auto"
          >
            Skip Track
          </Button>
        </div>
      </div>

      {/* Track Info */}
      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Music className="h-6 w-6 text-neutral-400" />
            </div>
            <div>
              <CardTitle className="text-xl">{review.Track.title}</CardTitle>
              <p className="text-sm text-neutral-500">
                {review.Track.Genre.map((g) => g.name).join(", ")}
              </p>
            </div>
          </div>
          {review.Track.feedbackFocus && (
            <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Artist note:</span> {review.Track.feedbackFocus}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <AudioPlayer
              sourceUrl={review.Track.sourceUrl}
              sourceType={review.Track.sourceType}
              showWaveform={review.Track.sourceType === "UPLOAD"}
              minListenTime={MIN_LISTEN_SECONDS}
              initialListenTime={listenTime}
              onTimeUpdate={(seconds) => setPlayerSeconds(seconds)}
              onListenProgress={(seconds) => {
                setListenTime((prev) => Math.max(prev, seconds));
                void maybeSendHeartbeat();
              }}
              onMinimumReached={() => {
                setCanSubmit(true);
                funnels.review.minimumReached(review.Track.id, MIN_LISTEN_SECONDS);
              }}
              onAddTimestamp={(seconds) => {
                addTimestampNote(seconds);
              }}
              showListenTracker
            />
        </CardContent>
      </Card>

      <Card variant="soft" elevated>
        <CardContent className="pt-6">
          {/* Inline timestamp controls */}
          <div className="border-t border-black/10 pt-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-bold text-neutral-700">
                Timestamp Notes
                {timestampNotes.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-black text-white rounded-full">
                    {timestampNotes.length}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => addTimestampNote(playerSeconds)}
                className="px-3 py-1.5 text-xs font-semibold border border-black/10 rounded-lg bg-white hover:bg-neutral-50 transition-colors duration-150 ease-out"
              >
                + Add at {formatTimestamp(playerSeconds)}
              </button>
            </div>

            {timestampNotes.length === 0 ? (
              <p className="text-xs text-neutral-500">
                Click the button above to mark moments in the track
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {timestampNotes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      scrollToSection("timestamps");
                      setTimeout(() => {
                        const el = timestampInputRefs.current[t.id];
                        if (el) el.focus();
                      }, 300);
                    }}
                    className={cn(
                      "px-2 py-1 text-xs font-mono rounded-lg border transition-colors duration-150 ease-out",
                      t.note.trim()
                        ? "border-lime-300 bg-lime-50 text-lime-800 hover:bg-lime-100"
                        : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    )}
                  >
                    {formatTimestamp(t.seconds)}
                    {!t.note.trim() && <span className="ml-1 text-amber-600">•</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <CardTitle>Your Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm p-3 font-medium">
              {error}
            </div>
          )}

          {/* First Impression */}
          <div
            ref={firstImpressionRef}
            className={cn(
              "space-y-3 p-4 -m-4 rounded-lg transition-colors",
              validationIssues.some((i) => i.section === "firstImpression") && "bg-red-50/60 border border-red-200 rounded-xl"
            )}
          >
            <Label className="text-base font-bold">First Impression (after 30 seconds)</Label>
            {validationIssues.some((i) => i.section === "firstImpression") && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationIssues.find((i) => i.section === "firstImpression")?.message}
              </p>
            )}
            <div className="space-y-3">
              {/* Current selection display */}
              {firstImpressionTouched ? (
                <div className={cn("px-3 py-2 border rounded-xl text-sm font-bold transition-colors duration-150 ease-out", firstImpressionColor(firstImpressionScore))}>
                  {firstImpressionLabel(firstImpressionScore)}
                </div>
              ) : (
                <div className="px-3 py-2 border border-dashed border-neutral-200 rounded-xl text-sm text-neutral-500">
                  Tap a point below to rate your first impression
                </div>
              )}

              {/* Clickable scale */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => {
                      setFirstImpressionScore(score);
                      setFirstImpressionTouched(true);
                      setFirstImpression(firstImpressionEnumFromScore(score));
                    }}
                    className={cn(
                      "flex-1 py-3 text-xs font-bold rounded-lg border transition-colors duration-150 ease-out motion-reduce:transition-none",
                      firstImpressionTouched && firstImpressionScore === score
                        ? firstImpressionColor(score)
                        : "border-black/10 bg-neutral-50 hover:border-neutral-300 hover:bg-white text-neutral-600"
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                <span>Lost interest</span>
                <span>Hooked</span>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div
            ref={scoresRef}
            className={cn(
              "p-4 -m-4 rounded-lg transition-colors",
              validationIssues.some((i) => i.section === "scores") && "bg-red-50/60 border border-red-200 rounded-xl"
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
              validationIssues.some((i) => i.section === "wouldListenAgain") && "bg-red-50/60 border border-red-200 rounded-xl"
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
                  "flex-1 py-2.5 px-3 text-sm font-bold transition-colors duration-150 ease-out rounded-lg border",
                  wouldListenAgain === true
                    ? "border-purple-400 bg-purple-600 text-white"
                    : "border-black/10 bg-white text-black hover:bg-neutral-50"
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldListenAgain(false)}
                className={cn(
                  "flex-1 py-2.5 px-3 text-sm font-bold transition-colors duration-150 ease-out rounded-lg border",
                  wouldListenAgain === false
                    ? "border-neutral-700 bg-neutral-800 text-white"
                    : "border-black/10 bg-white text-black hover:bg-neutral-50"
                )}
              >
                No
              </button>
            </div>
          </div>

          {/* Listener Signals */}
          <div className="space-y-4 p-4 bg-neutral-50/60 border border-black/10 rounded-2xl mt-4">
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
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors duration-150 ease-out rounded-lg border",
                      wouldAddToPlaylist === true
                        ? "border-purple-400 bg-purple-600 text-white"
                        : "border-black/10 bg-white text-black hover:bg-neutral-50"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldAddToPlaylist(false)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors duration-150 ease-out rounded-lg border",
                      wouldAddToPlaylist === false
                        ? "border-neutral-700 bg-neutral-800 text-white"
                        : "border-black/10 bg-white text-black hover:bg-neutral-50"
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
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors duration-150 ease-out rounded-lg border",
                      wouldShare === true
                        ? "border-purple-400 bg-purple-600 text-white"
                        : "border-black/10 bg-white text-black hover:bg-neutral-50"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldShare(false)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors duration-150 ease-out rounded-lg border",
                      wouldShare === false
                        ? "border-neutral-700 bg-neutral-800 text-white"
                        : "border-black/10 bg-white text-black hover:bg-neutral-50"
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
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors duration-150 ease-out rounded-lg border",
                      wouldFollow === true
                        ? "border-purple-400 bg-purple-600 text-white"
                        : "border-black/10 bg-white text-black hover:bg-neutral-50"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setWouldFollow(false)}
                    className={cn(
                      "flex-1 py-2 px-2 text-xs font-bold transition-colors duration-150 ease-out rounded-lg border",
                      wouldFollow === false
                        ? "border-neutral-700 bg-neutral-800 text-white"
                        : "border-black/10 bg-white text-black hover:bg-neutral-50"
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
          <div ref={bestPartRef} className={cn("space-y-3 p-4 -m-4 rounded-lg transition-colors", validationIssues.some((i) => i.section === "bestPart") && "bg-red-50/60 border border-red-200 rounded-xl")}>
            <Label htmlFor="best" className="text-base font-bold">Best part of the track *</Label>
            {validationIssues.some((i) => i.section === "bestPart") && (<p className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{validationIssues.find((i) => i.section === "bestPart")?.message}</p>)}
            <textarea
              id="best"
              placeholder="What stood out to you? What worked well?"
              value={bestPart}
              onChange={(e) => setBestPart(e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
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
          <div ref={weakestPartRef} className={cn("space-y-3 p-4 -m-4 rounded-lg transition-colors", validationIssues.some((i) => i.section === "weakestPart") && "bg-red-50/60 border border-red-200 rounded-xl")}>
            <Label htmlFor="weakest" className="text-base font-bold">Weakest part / Areas for improvement *</Label>
            {validationIssues.some((i) => i.section === "weakestPart") && (<p className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{validationIssues.find((i) => i.section === "weakestPart")?.message}</p>)}
            <textarea
              id="weakest"
              placeholder="What could be better? Be constructive."
              value={weakestPart}
              onChange={(e) => setWeakestPart(e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
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
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
            />
          </div>

          {/* Timestamped notes - edit section */}
          {timestampNotes.length > 0 && (
            <div ref={timestampNotesRef} className="space-y-3 p-4 bg-neutral-50/60 border border-black/10 rounded-2xl">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base font-bold">
                  Timestamp Notes
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {timestampNotes.filter(t => t.note.trim()).length}/{timestampNotes.length} filled
                  </span>
                </Label>
              </div>

              <div className="space-y-2">
                {timestampNotes.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "border p-3 bg-white rounded-xl transition-colors duration-150 ease-out",
                      t.note.trim() ? "border-lime-300" : "border-amber-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-mono font-bold rounded-md",
                        t.note.trim() ? "bg-lime-100 text-lime-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {formatTimestamp(t.seconds)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTimestampNotes((prev) => prev.filter((p) => p.id !== t.id))
                        }
                        className="text-xs font-bold text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      ref={(el) => {
                        timestampInputRefs.current[t.id] = el;
                      }}
                      value={t.note}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTimestampNotes((prev) =>
                          prev.map((p) => (p.id === t.id ? { ...p, note: v } : p))
                        );
                      }}
                      placeholder="What happens here? (e.g. drop hits hard, vocal gets buried)"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Card */}
      <Card variant="soft" elevated className="bg-neutral-950 text-white border-neutral-900">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-neutral-400 text-sm font-medium">You&apos;ll earn</p>
              <p className="text-3xl font-black text-lime-500">
                {review.ReviewerProfile
                  ? formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier))
                  : "1 credit"}
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
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-500 text-black font-bold text-xs rounded-lg">
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
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-500 text-black font-bold text-xs rounded-lg">
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
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/40 rounded-xl">
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
              ? `Submit Review & Earn ${review.ReviewerProfile ? formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier)) : "1 credit"}`
              : "Complete requirements to submit"}
          </Button>
        </CardContent>
      </Card>
    </div>

      {/* Skip Track Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <SkipForward className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Skip this track?</DialogTitle>
            <DialogDescription className="text-center">
              This will remove it from your queue. You have a limited number of skips per day.
              {isDirty && (
                <span className="block mt-2 font-medium text-amber-600">
                  You have unsaved review progress that will be lost.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSkipDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSkip}
              isLoading={isSkipping}
            >
              Skip Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Not Working Dialog */}
      <Dialog open={showUnplayableDialog} onOpenChange={setShowUnplayableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <VolumeX className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Report audio not working?</DialogTitle>
            <DialogDescription className="text-center">
              This will notify the artist that their track link may be broken and remove it from your queue.
              {isDirty && (
                <span className="block mt-2 font-medium text-amber-600">
                  You have unsaved review progress that will be lost.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowUnplayableDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleUnplayable}
              isLoading={isMarkingUnplayable}
            >
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
