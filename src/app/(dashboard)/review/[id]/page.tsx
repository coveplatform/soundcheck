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
// Removed unused imports
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
import { getReferralCookie, clearReferralCookie } from "@/lib/referral";
import { Review, FirstImpression, MIN_LISTEN_SECONDS } from "./types";
import { ReleaseDecisionForm, type ReleaseDecisionFormData } from "./components/release-decision-form";
import {
  formatTimestamp,
  getTierEarningsCents,
  formatFirstImpression,
  makeClientId,
  firstImpressionLabel,
  firstImpressionColor,
  firstImpressionEnumFromScore,
} from "./utils";
// V2 components removed - using streamlined inline form instead

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

  // Form state - streamlined for fast reviews
  const [listenTime, setListenTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(null);
  const [firstImpressionScore, setFirstImpressionScore] = useState<number>(3);
  const [firstImpressionTouched, setFirstImpressionTouched] = useState(false);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [bestPart, setBestPart] = useState(""); // Reused as "Best Moment"
  const [timestampNotes, setTimestampNotes] = useState<
    Array<{ id: string; seconds: number; note: string }>
  >([]);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [pendingTimestampFocusId, setPendingTimestampFocusId] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<Array<{ id: string; message: string; section: string }>>([]);

  // V2 Streamlined State
  const [technicalIssues, setTechnicalIssues] = useState<string[]>([]);
  const [playlistAction, setPlaylistAction] = useState<string | null>(null);
  const [biggestWeaknessSpecific, setBiggestWeaknessSpecific] = useState<string>("");
  const [nextFocus, setNextFocus] = useState<string | null>(null);
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);

  const [audioDuration, setAudioDuration] = useState(0);

  // Section refs for scroll-to functionality
  const firstImpressionRef = useRef<HTMLDivElement>(null);
  const wouldListenAgainRef = useRef<HTMLDivElement>(null);
  const playlistActionRef = useRef<HTMLDivElement>(null);
  const technicalIssuesRef = useRef<HTMLDivElement>(null);
  const bestPartRef = useRef<HTMLDivElement>(null);
  const biggestIssueRef = useRef<HTMLDivElement>(null);
  const qualityLevelRef = useRef<HTMLDivElement>(null);
  const nextFocusRef = useRef<HTMLDivElement>(null);
  const timestampNotesRef = useRef<HTMLDivElement>(null);
  const timestampInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const scrollToSection = useCallback((sectionId: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      firstImpression: firstImpressionRef,
      wouldListenAgain: wouldListenAgainRef,
      playlistAction: playlistActionRef,
      technicalIssues: technicalIssuesRef,
      bestPart: bestPartRef,
      biggestIssue: biggestIssueRef,
      qualityLevel: qualityLevelRef,
      nextFocus: nextFocusRef,
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
          }
          if (data.skipListenTimer) {
            setCanSubmit(true);
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
    wouldListenAgain !== null ||
    technicalIssues.length > 0 ||
    playlistAction !== null ||
    bestPart.trim().length > 0 ||
    biggestWeaknessSpecific.trim().length > 0 ||
    nextFocus !== null ||
    qualityLevel !== null ||
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
          setWouldListenAgain(
            typeof parsed.wouldListenAgain === "boolean" ? parsed.wouldListenAgain : null
          );
          setBestPart(typeof parsed.bestPart === "string" ? parsed.bestPart : "");
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

          // Restore streamlined v2 fields
          setTechnicalIssues(Array.isArray(parsed.technicalIssues) ? parsed.technicalIssues : []);
          setPlaylistAction(typeof parsed.playlistAction === "string" ? parsed.playlistAction : null);
          setBiggestWeaknessSpecific(typeof parsed.biggestWeaknessSpecific === "string" ? parsed.biggestWeaknessSpecific : "");
          setNextFocus(typeof parsed.nextFocus === "string" ? parsed.nextFocus : null);
          setQualityLevel(typeof parsed.qualityLevel === "string" ? parsed.qualityLevel : null);

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
        wouldListenAgain,
        bestPart,
        timestampNotes,
        // Streamlined V2 fields
        technicalIssues,
        playlistAction,
        biggestWeaknessSpecific,
        nextFocus,
        qualityLevel,
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
    firstImpressionScore,
    wouldListenAgain,
    bestPart,
    timestampNotes,
    // Streamlined V2 fields
    technicalIssues,
    playlistAction,
    biggestWeaknessSpecific,
    nextFocus,
    qualityLevel,
  ]);

  const handleSubmit = async () => {
    if (!review) return;

    // Build validation issues
    const issues: Array<{ id: string; message: string; section: string }> = [];

    if (!firstImpression || !firstImpressionTouched) {
      issues.push({ id: "firstImpression", message: "Select your first impression", section: "firstImpression" });
    }
    if (wouldListenAgain === null) {
      issues.push({ id: "wouldListenAgain", message: "Indicate if you would listen again", section: "wouldListenAgain" });
    }
    if (!playlistAction) {
      issues.push({ id: "playlistAction", message: "Select playlist action", section: "playlistAction" });
    }
    if (!qualityLevel) {
      issues.push({ id: "qualityLevel", message: "Select quality level", section: "qualityLevel" });
    }
    if (!nextFocus) {
      issues.push({ id: "nextFocus", message: "Select what to focus on next", section: "nextFocus" });
    }
    if (countWords(bestPart) < 15) {
      issues.push({ id: "bestPart", message: `Best moment needs ${15 - countWords(bestPart)} more words`, section: "bestPart" });
    }
    if (countWords(biggestWeaknessSpecific) < 20) {
      issues.push({ id: "biggestIssue", message: `Main feedback needs ${20 - countWords(biggestWeaknessSpecific)} more words`, section: "biggestIssue" });
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
      // Send a final heartbeat with client listen time before submission
      try {
        await fetch(`/api/reviews/${review.id}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientListenTime: Math.floor(listenTime),
          }),
        });
      } catch {
        // Non-fatal: submission will still attempt
      }

      // Map streamlined inputs to full schema for analytics
      const qualityToScore = (level: string | null): number => {
        if (!level) return 3;
        const mapping: Record<string, number> = {
          PROFESSIONAL: 5,
          RELEASE_READY: 4,
          ALMOST_THERE: 3,
          DEMO_STAGE: 2,
          NOT_READY: 1,
        };
        return mapping[level] || 3;
      };

      // Map technical checkboxes to enum fields
      const hasVocalIssue = technicalIssues.includes("vocals-buried");
      const lowEndIssue = technicalIssues.includes("muddy-low");
      const compressionIssue = technicalIssues.includes("compressed");
      const harshHighs = technicalIssues.includes("harsh-highs");
      const narrowStereo = technicalIssues.includes("narrow-stereo");
      const tooRepetitive = technicalIssues.includes("repetitive");
      const tooLong = technicalIssues.includes("too-long");

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          firstImpression,
          // Derived scores for analytics
          productionScore: qualityToScore(qualityLevel),
          vocalScore: hasVocalIssue ? 2 : 4,
          originalityScore: firstImpressionScore,
          wouldListenAgain,
          bestPart,
          weakestPart: biggestWeaknessSpecific, // Map biggest issue to weakest part
          timestamps:
            timestampNotes
              .map((t) => ({ seconds: t.seconds, note: t.note.trim() }))
              .filter((t) => t.note.length > 0).length > 0
              ? timestampNotes
                  .map((t) => ({ seconds: t.seconds, note: t.note.trim() }))
                  .filter((t) => t.note.length > 0)
              : undefined,
          // V2 mapped from checkboxes
          lowEndClarity: lowEndIssue ? "BOTH_MUDDY" : "PERFECT",
          vocalClarity: hasVocalIssue ? "BURIED" : "CRYSTAL_CLEAR",
          highEndQuality: harshHighs ? "TOO_HARSH" : "PERFECT",
          stereoWidth: narrowStereo ? "TOO_NARROW" : "GOOD_BALANCE",
          dynamics: compressionIssue ? "TOO_COMPRESSED" : "GREAT_DYNAMICS",
          tooRepetitive,
          trackLength: tooLong ? "WAY_TOO_LONG" : "PERFECT",
          playlistAction,
          biggestWeaknessSpecific,
          nextFocus,
          qualityLevel,
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
        setIsSubmitting(false);
        return;
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {
      }

      // Keep loading state active - success screen will handle any navigation
      setSuccess(true);
    } catch {
      setError("Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!review) return;

    setShowSkipDialog(false);
    setError("");
    setIsSkipping(true);

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

  const isReleaseDecision = review?.Track?.packageType === "RELEASE_DECISION";

  const handleReleaseDecisionSubmit = async (data: ReleaseDecisionFormData) => {
    if (!review) return;

    setError("");
    setIsSubmitting(true);

    try {
      // Send a final heartbeat with client listen time
      try {
        await fetch(`/api/reviews/${review.id}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientListenTime: Math.floor(listenTime) }),
        });
      } catch {
        // Non-fatal
      }

      // Map RD fields to required base fields
      const verdictToImpression: Record<string, string> = {
        RELEASE_NOW: "STRONG_HOOK",
        FIX_FIRST: "DECENT",
        NEEDS_WORK: "LOST_INTEREST",
      };
      const qualityToScore = (level: string): number => {
        const mapping: Record<string, number> = {
          PROFESSIONAL: 5, RELEASE_READY: 4, ALMOST_THERE: 3, DEMO_STAGE: 2, NOT_READY: 1,
        };
        return mapping[level] || 3;
      };

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          // Required base fields (derived from RD data)
          firstImpression: verdictToImpression[data.releaseVerdict] || "DECENT",
          productionScore: qualityToScore(data.qualityLevel),
          originalityScore: Math.max(1, Math.min(5, Math.round(data.releaseReadinessScore / 20))),
          wouldListenAgain: data.releaseVerdict === "RELEASE_NOW",
          bestPart: data.strongestElement,
          weakestPart: data.biggestRisk,
          qualityLevel: data.qualityLevel,
          // Release Decision specific fields
          releaseVerdict: data.releaseVerdict,
          releaseReadinessScore: data.releaseReadinessScore,
          topFixRank1: data.topFixRank1,
          topFixRank1Impact: data.topFixRank1Impact,
          topFixRank1TimeMin: data.topFixRank1TimeMin,
          topFixRank2: data.topFixRank2,
          topFixRank2Impact: data.topFixRank2Impact,
          topFixRank2TimeMin: data.topFixRank2TimeMin,
          topFixRank3: data.topFixRank3,
          topFixRank3Impact: data.topFixRank3Impact,
          topFixRank3TimeMin: data.topFixRank3TimeMin,
          strongestElement: data.strongestElement,
          biggestRisk: data.biggestRisk,
          competitiveBenchmark: data.competitiveBenchmark,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const message = responseData?.error || "Failed to submit review";
        if (response.status === 401) {
          router.push("/login");
          router.refresh();
          return;
        }
        if (response.status === 403) {
          if (typeof message === "string" && message.toLowerCase().includes("onboarding")) {
            router.push("/onboarding");
            router.refresh();
            return;
          }
          if (typeof message === "string" && message.toLowerCase().includes("restricted")) {
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }
        setError(message);
        setIsSubmitting(false);
        return;
      }

      try { localStorage.removeItem(draftKey); } catch {}
      setSuccess(true);
    } catch {
      setError("Something went wrong");
      setIsSubmitting(false);
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
        body: JSON.stringify({ clientListenTime: Math.floor(listenTime) }),
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

  const bestMomentWords = countWords(bestPart);
  const biggestIssueWords = countWords(biggestWeaknessSpecific);

  const meetsTextMinimum =
    bestMomentWords >= 15 &&
    biggestIssueWords >= 20;

  if (success) {
    const canPurchase = review.Track.sourceType === "UPLOAD" && review.Track.allowPurchase;
    const isPeer = review.isPeerReview || !!review.peerReviewerArtistId;
    const totalReviews = review.ArtistProfile?.totalPeerReviews ?? 0;
    const avgRating = review.ArtistProfile?.peerReviewRating ?? 0;
    const isProReviewer = totalReviews >= 25 && avgRating >= 4.5;
    const reviewsUntilPro = Math.max(0, 25 - totalReviews);

    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Check className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-black mb-2">Review Submitted!</h2>
          <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-100 border border-purple-200 rounded-full mb-3">
            <span className="font-black text-lg text-purple-700">
              {isPeer ? "+1 credit earned" : `+${formatCurrency(getTierEarningsCents(review.ReviewerProfile?.tier ?? "NORMAL"))}`}
            </span>
          </div>
          <p className="text-sm text-black/50">
            Your feedback helps artists improve their music.
          </p>
        </div>

        {/* PRO Reviewer promotion */}
        {isPeer && !isProReviewer && (
          <div className="rounded-xl border border-black/10 bg-[#faf8f5] p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-bold text-black">Earn $1.50 cash per review</p>
            </div>
            <p className="text-xs text-black/50 mb-3">
              Become a PRO Reviewer and get paid for every review you complete:
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${totalReviews >= 25 ? 'bg-purple-600 text-white' : 'bg-black/10 text-black/40'}`}>
                  {totalReviews >= 25 ? '✓' : '1'}
                </span>
                <span className="text-xs text-black/70">
                  <span className="font-semibold">Complete 25 reviews</span>
                  <span className="text-black/40"> — {reviewsUntilPro > 0 ? `${reviewsUntilPro} to go` : 'Done!'}</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${avgRating >= 4.5 ? 'bg-purple-600 text-white' : 'bg-black/10 text-black/40'}`}>
                  {avgRating >= 4.5 ? '✓' : '2'}
                </span>
                <span className="text-xs text-black/70">
                  <span className="font-semibold">Maintain a 4.5+ average rating</span>
                  <span className="text-black/40"> — {avgRating > 0 ? `currently ${avgRating.toFixed(1)}` : 'no ratings yet'}</span>
                </span>
              </li>
            </ul>
            {totalReviews > 0 && (
              <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (totalReviews / 25) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Already PRO Reviewer */}
        {isPeer && isProReviewer && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 text-center">
            <p className="text-sm font-bold text-amber-800">You&apos;re a PRO Reviewer</p>
            <p className="text-xs text-amber-700/60 mt-0.5">You earn $1.50 cash for every review</p>
          </div>
        )}

        {/* Purchase option for uploaded tracks */}
        {canPurchase && (
          <div className="mb-6 p-4 border border-black/10 bg-white rounded-xl text-left">
            <div className="flex items-center gap-3 mb-3">
              <Music className="h-5 w-5 text-neutral-600" />
              <div>
                <p className="font-bold text-black">{review.Track.title}</p>
                {review.Track.ArtistProfile?.artistName && (
                  <p className="text-sm text-black/50">{review.Track.ArtistProfile.artistName}</p>
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
            <p className="text-xs text-black/40 mt-2 text-center">
              {hasPurchased ? "Thanks for supporting the artist!" : "Support the artist by purchasing their track"}
            </p>
          </div>
        )}

        <Link href="/review">
          <Button className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-12 rounded-xl">
            Review another track
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
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

      {/* TRACK INFO + AUDIO PLAYER - Full Width */}
      <Card variant="soft" elevated className="mt-6">
        <CardHeader className="border-b border-black/10">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-200/50">
              <Music className="h-7 w-7 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl">{review.Track.title}</CardTitle>
              <p className="text-sm text-neutral-600 font-medium mt-1">
                {review.Track.Genre.map((g) => g.name).join(", ")}
              </p>
            </div>
            {/* Quick add timestamp in header on desktop */}
            <div className="hidden lg:flex lg:flex-col lg:gap-2 lg:items-end">
              {timestampNotes.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500 font-medium">Timestamps:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold font-mono rounded-md">
                    {timestampNotes.filter(t => t.note.trim()).length}/{timestampNotes.length}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => addTimestampNote(playerSeconds)}
                className="px-3 py-2 text-xs font-bold border-2 border-black/10 rounded-lg bg-white hover:bg-neutral-50 hover:border-black/20 transition-all duration-150 ease-out"
              >
                + Timestamp {formatTimestamp(playerSeconds)}
              </button>
            </div>
          </div>
          {review.Track.feedbackFocus && (
            <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-300/50 rounded-xl">
              <p className="text-sm text-amber-900">
                <span className="font-bold">Artist note:</span> {review.Track.feedbackFocus}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <AudioPlayer
            sourceUrl={review.Track.sourceUrl}
            sourceType={review.Track.sourceType}
            showWaveform={review.Track.sourceType === "UPLOAD"}
            minListenTime={review.skipListenTimer ? 0 : MIN_LISTEN_SECONDS}
            initialListenTime={listenTime}
            onTimeUpdate={(seconds) => {
              setPlayerSeconds(seconds);
              if (seconds > audioDuration) setAudioDuration(seconds);
            }}
            onListenProgress={(seconds) => {
              setListenTime((prev) => Math.max(prev, seconds));
              void maybeSendHeartbeat();
            }}
            onMinimumReached={() => {
              setCanSubmit(true);
            }}
            onAddTimestamp={(seconds) => {
              addTimestampNote(seconds);
            }}
            showListenTracker
          />

          {/* Timestamp quick access - visible on mobile */}
          <div className="lg:hidden mt-4 pt-4 border-t border-black/10">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-sm font-bold text-neutral-700">
                Timestamp Notes
                {timestampNotes.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-black text-white rounded-full font-mono">
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
            {timestampNotes.length > 0 && (
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

      {/* RELEASE DECISION FORM or STANDARD FORM */}
      {isReleaseDecision ? (
        <div className="mt-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm p-3 font-medium">
              {error}
            </div>
          )}
          <ReleaseDecisionForm
            trackId={review.Track.id}
            trackTitle={review.Track.title}
            listenTime={listenTime}
            minListenTime={review.skipListenTimer ? 0 : MIN_LISTEN_SECONDS}
            onSubmit={handleReleaseDecisionSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : (
      <>
      {/* VALIDATION ALERT - Prominent at top */}
      {validationIssues.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400 rounded-xl shadow-lg">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white mb-2">
                {validationIssues.length === 1
                  ? "Please fix 1 issue before submitting:"
                  : `Please fix ${validationIssues.length} issues before submitting:`}
              </p>
              <div className="space-y-1.5">
                {validationIssues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => scrollToSection(issue.section)}
                    className="w-full text-left text-sm text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-150 ease-out flex items-center gap-2 font-medium"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80 flex-shrink-0"></span>
                    {issue.message}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT - 2 Balanced Columns on Desktop */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">

        {/* LEFT COLUMN: Quick Reactions & Scores */}
        <div className="space-y-6">

      {/* Quick Reactions */}
      <Card variant="soft" elevated className="border-l-4 border-l-purple-500">
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            Quick Reactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">

          {/* First Impression */}
          <div
            ref={firstImpressionRef}
            className={cn(
              "space-y-3 p-4 -m-4 rounded-xl transition-all duration-200",
              validationIssues.some((i) => i.section === "firstImpression")
                ? "bg-red-50 border-2 border-red-300"
                : "bg-gradient-to-br from-purple-50/50 to-transparent"
            )}
          >
            <div>
              <Label className="text-base font-bold text-purple-900">First Impression</Label>
              <p className="text-xs text-purple-700/60 mt-0.5">How did the first 30 seconds make you feel?</p>
            </div>
            {validationIssues.some((i) => i.section === "firstImpression") && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationIssues.find((i) => i.section === "firstImpression")?.message}
              </p>
            )}
            <div className="grid grid-cols-5 gap-1.5">
              {([
                { score: 1, num: "1", short: "Nah" },
                { score: 2, num: "2", short: "Meh" },
                { score: 3, num: "3", short: "Solid" },
                { score: 4, num: "4", short: "Into it" },
                { score: 5, num: "5", short: "Hooked" },
              ] as const).map(({ score, num, short }) => {
                const isSelected = firstImpressionTouched && firstImpressionScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => {
                      setFirstImpressionScore(score);
                      setFirstImpressionTouched(true);
                      setFirstImpression(firstImpressionEnumFromScore(score));
                    }}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl border-2 cursor-pointer transition-colors duration-150 ease-out motion-reduce:transition-none",
                      isSelected
                        ? firstImpressionColor(score)
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600"
                    )}
                  >
                    <span className="text-lg font-black leading-none">{num}</span>
                    <span className="text-[10px] font-semibold leading-tight">{short}</span>
                  </button>
                );
              })}
            </div>
            {firstImpressionTouched && (
              <p className={cn(
                "text-sm font-semibold px-3 py-2 rounded-lg transition-colors duration-150 ease-out",
                firstImpressionColor(firstImpressionScore)
              )}>
                {firstImpressionLabel(firstImpressionScore)}
              </p>
            )}
          </div>

          {/* Would Listen Again */}
          <div
            ref={wouldListenAgainRef}
            className={cn(
              "space-y-3 p-4 -m-4 rounded-xl transition-all duration-200",
              validationIssues.some((i) => i.section === "wouldListenAgain")
                ? "bg-red-50 border-2 border-red-300"
                : "bg-gradient-to-br from-indigo-50/40 to-transparent"
            )}
          >
            <Label className="text-base font-bold text-indigo-900">Would you listen to this again?</Label>
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

          {/* Technical Issues */}
          <div
            ref={technicalIssuesRef}
            className="space-y-3 p-4 -m-4 rounded-xl transition-all duration-200 bg-gradient-to-br from-orange-50/40 to-transparent"
          >
            <Label className="text-base font-bold text-orange-900">Technical Issues (optional)</Label>
            <p className="text-xs text-orange-700/60">Select any technical problems you noticed</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "vocals-buried", label: "Vocals buried" },
                { id: "muddy-low", label: "Muddy low end" },
                { id: "compressed", label: "Over-compressed" },
                { id: "harsh-highs", label: "Harsh highs" },
                { id: "narrow-stereo", label: "Narrow stereo" },
                { id: "repetitive", label: "Too repetitive" },
                { id: "too-long", label: "Too long" },
              ].map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => {
                    setTechnicalIssues((prev) =>
                      prev.includes(issue.id)
                        ? prev.filter((i) => i !== issue.id)
                        : [...prev, issue.id]
                    );
                  }}
                  className={cn(
                    "py-2 px-3 text-sm font-bold transition-colors duration-150 ease-out rounded-lg border-2",
                    technicalIssues.includes(issue.id)
                      ? "border-orange-400 bg-orange-500 text-white"
                      : "border-neutral-200 bg-white text-black hover:bg-neutral-50 hover:border-neutral-300"
                  )}
                >
                  {issue.label}
                </button>
              ))}
            </div>
          </div>

          {/* Playlist Action */}
          <div
            ref={playlistActionRef}
            className={cn(
              "space-y-3 p-4 -m-4 rounded-xl transition-all duration-200",
              validationIssues.some((i) => i.section === "playlistAction")
                ? "bg-red-50 border-2 border-red-300"
                : "bg-gradient-to-br from-purple-50/50 to-transparent"
            )}
          >
            <Label className="text-base font-bold text-purple-900">Playlist Action *</Label>
            <p className="text-xs text-purple-700/60">What would you do if you heard this?</p>
            {validationIssues.some((i) => i.section === "playlistAction") && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationIssues.find((i) => i.section === "playlistAction")?.message}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "ADD_TO_LIBRARY", label: "Add to library", icon: Download },
                { id: "LET_PLAY", label: "Let it play", icon: Music },
                { id: "SKIP", label: "Skip", icon: SkipForward },
                { id: "DISLIKE", label: "Dislike", icon: VolumeX },
              ].map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setPlaylistAction(action.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-3 text-sm font-bold transition-colors duration-150 ease-out rounded-lg border-2",
                    playlistAction === action.id
                      ? "border-purple-400 bg-purple-600 text-white"
                      : "border-neutral-200 bg-white text-black hover:bg-neutral-50 hover:border-neutral-300"
                  )}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
        </div>

        {/* RIGHT COLUMN: Written Feedback */}
        <div className="space-y-6">

      {/* Actionable Feedback */}
      <Card variant="soft" elevated className="border-l-4 border-l-emerald-500">
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Actionable Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm p-3 font-medium">
              {error}
            </div>
          )}

          {/* Main Feedback */}
          <div ref={biggestIssueRef} className={cn("space-y-3 p-4 -m-4 rounded-xl transition-all duration-200", validationIssues.some((i) => i.section === "biggestIssue") ? "bg-red-50 border-2 border-red-300" : "bg-gradient-to-br from-orange-50/50 to-transparent border border-orange-200/30")}>
            <Label htmlFor="mainfeedback" className="text-base font-bold text-orange-900">Main Feedback *</Label>
            <p className="text-xs text-orange-700/60">What's holding the track back, and what would you change? Be specific — mention elements, timestamps, or frequency ranges if relevant.</p>
            {validationIssues.some((i) => i.section === "biggestIssue") && (<p className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{validationIssues.find((i) => i.section === "biggestIssue")?.message}</p>)}
            <textarea
              id="mainfeedback"
              placeholder="E.g., 'The low-mids are building up around 200-300Hz which makes the mix feel heavy on a proper system. A few surgical cuts there and some more air above 10kHz would open it up significantly.'"
              value={biggestWeaknessSpecific}
              onChange={(e) => setBiggestWeaknessSpecific(e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[120px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
            />
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs font-mono",
                biggestIssueWords >= 20 ? "text-lime-600" : "text-neutral-500"
              )}>
                {biggestIssueWords}/20 words
              </p>
              {biggestIssueWords >= 20 && (
                <span className="text-xs font-bold text-lime-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>

          {/* Best Moment */}
          <div ref={bestPartRef} className={cn("space-y-3 p-4 -m-4 rounded-xl transition-all duration-200", validationIssues.some((i) => i.section === "bestPart") ? "bg-red-50 border-2 border-red-300" : "bg-gradient-to-br from-emerald-50/50 to-transparent border border-emerald-200/30")}>
            <Label htmlFor="bestmoment" className="text-base font-bold text-emerald-900">Best Moment *</Label>
            <p className="text-xs text-emerald-700/60">What stood out? What should they keep doing?</p>
            {validationIssues.some((i) => i.section === "bestPart") && (<p className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{validationIssues.find((i) => i.section === "bestPart")?.message}</p>)}
            <textarea
              id="bestmoment"
              placeholder="E.g., 'The vocal ad-libs at 2:15 add energy and personality' or 'The synth texture in the breakdown is unique'"
              value={bestPart}
              onChange={(e) => setBestPart(e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
            />
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs font-mono",
                bestMomentWords >= 15 ? "text-lime-600" : "text-neutral-500"
              )}>
                {bestMomentWords}/15 words
              </p>
              {bestMomentWords >= 15 && (
                <span className="text-xs font-bold text-lime-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Quality Assessment & Next Steps - Full Width */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">

        {/* Quality Level */}
        <Card variant="soft" elevated className="border-l-4 border-l-purple-500">
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              Quality Level
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div
              ref={qualityLevelRef}
              className={cn(
                "space-y-3 p-4 -m-4 rounded-xl transition-all duration-200",
                validationIssues.some((i) => i.section === "qualityLevel")
                  ? "bg-red-50 border-2 border-red-300"
                  : "bg-gradient-to-br from-purple-50/50 to-transparent"
              )}
            >
              <Label className="text-base font-bold text-purple-900">Overall quality *</Label>
              <p className="text-xs text-purple-700/60">Where is this track at?</p>
              {validationIssues.some((i) => i.section === "qualityLevel") && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationIssues.find((i) => i.section === "qualityLevel")?.message}
                </p>
              )}
              <div className="grid gap-2">
                {[
                  { id: "PROFESSIONAL", label: "Professional", desc: "Ready for commercial release" },
                  { id: "RELEASE_READY", label: "Release ready", desc: "Could be released with minor tweaks" },
                  { id: "ALMOST_THERE", label: "Almost there", desc: "Needs some work but on the right track" },
                  { id: "DEMO_STAGE", label: "Demo stage", desc: "Good ideas, needs more refinement" },
                  { id: "NOT_READY", label: "Not ready", desc: "Needs significant work" },
                ].map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setQualityLevel(level.id)}
                    className={cn(
                      "text-left py-3 px-4 transition-colors duration-150 ease-out rounded-lg border-2",
                      qualityLevel === level.id
                        ? "border-purple-400 bg-purple-600 text-white"
                        : "border-neutral-200 bg-white text-black hover:bg-neutral-50 hover:border-neutral-300"
                    )}
                  >
                    <div className="font-bold text-sm">{level.label}</div>
                    <div className={cn(
                      "text-xs mt-0.5",
                      qualityLevel === level.id ? "text-purple-100" : "text-neutral-500"
                    )}>
                      {level.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Focus */}
        <Card variant="soft" elevated className="border-l-4 border-l-blue-500">
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Next Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div
              ref={nextFocusRef}
              className={cn(
                "space-y-3 p-4 -m-4 rounded-xl transition-all duration-200",
                validationIssues.some((i) => i.section === "nextFocus")
                  ? "bg-red-50 border-2 border-red-300"
                  : "bg-gradient-to-br from-blue-50/50 to-transparent"
              )}
            >
              <Label className="text-base font-bold text-blue-900">What should they focus on next? *</Label>
              <p className="text-xs text-blue-700/60">The one area that would improve this track most</p>
              {validationIssues.some((i) => i.section === "nextFocus") && (
                <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationIssues.find((i) => i.section === "nextFocus")?.message}
                </p>
              )}
              <div className="grid gap-2">
                {[
                  { id: "MIXING", label: "Mixing", desc: "Balance, EQ, compression, clarity" },
                  { id: "ARRANGEMENT", label: "Arrangement", desc: "Structure, transitions, dynamics" },
                  { id: "SOUND_DESIGN", label: "Sound design", desc: "Sounds, textures, production choices" },
                  { id: "SONGWRITING", label: "Songwriting", desc: "Melody, harmony, lyrics" },
                  { id: "PERFORMANCE", label: "Performance", desc: "Vocals, playing, delivery" },
                  { id: "READY_TO_RELEASE", label: "Ready to release!", desc: "This is good to go" },
                ].map((focus) => (
                  <button
                    key={focus.id}
                    type="button"
                    onClick={() => setNextFocus(focus.id)}
                    className={cn(
                      "text-left py-3 px-4 transition-colors duration-150 ease-out rounded-lg border-2",
                      nextFocus === focus.id
                        ? "border-blue-400 bg-blue-600 text-white"
                        : "border-neutral-200 bg-white text-black hover:bg-neutral-50 hover:border-neutral-300"
                    )}
                  >
                    <div className="font-bold text-sm">{focus.label}</div>
                    <div className={cn(
                      "text-xs mt-0.5",
                      nextFocus === focus.id ? "text-blue-100" : "text-neutral-500"
                    )}>
                      {focus.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TIMESTAMP NOTES - Full Width */}
      {timestampNotes.length > 0 && (
        <Card variant="soft" elevated className="mt-6 border-l-4 border-l-blue-500">
          <CardHeader className="border-b border-black/10">
            <div ref={timestampNotesRef} className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Timestamp Notes
                <span className="ml-2 px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded-lg">
                  {timestampNotes.filter(t => t.note.trim()).length}/{timestampNotes.length} filled
                </span>
              </CardTitle>
              <button
                type="button"
                onClick={() => addTimestampNote(playerSeconds)}
                className="hidden lg:block px-3 py-1.5 text-xs font-semibold border-2 border-black/10 rounded-lg bg-white hover:bg-neutral-50 hover:border-black/20 transition-all duration-150 ease-out"
              >
                + Add at {formatTimestamp(playerSeconds)}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {timestampNotes.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "border-2 p-3 bg-white rounded-xl transition-all duration-150 ease-out hover:shadow-md",
                    t.note.trim() ? "border-lime-400/60" : "border-amber-400/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={cn(
                      "px-2 py-1 text-xs font-mono font-bold rounded-lg",
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
          </CardContent>
        </Card>
      )}

      {/* SUBMIT CARD - Full Width */}
      <Card variant="soft" elevated className="mt-6 bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border-2 border-neutral-800">
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
                    Complete all required sections
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Validation Warnings - Above Submit Button */}
          {validationIssues.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-2">
                    {validationIssues.length === 1
                      ? "Fix 1 issue to submit:"
                      : `Fix ${validationIssues.length} issues to submit:`}
                  </p>
                  <div className="space-y-1.5">
                    {validationIssues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => scrollToSection(issue.section)}
                        className="w-full text-left text-sm text-white/90 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-150 ease-out flex items-center gap-2 font-medium"
                      >
                        <span className="h-1 w-1 rounded-full bg-white/80 flex-shrink-0"></span>
                        {issue.message}
                      </button>
                    ))}
                  </div>
                </div>
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
      </>
      )}
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
