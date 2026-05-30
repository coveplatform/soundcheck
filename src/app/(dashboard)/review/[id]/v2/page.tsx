"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, Check, Music, SkipForward, VolumeX, AlertTriangle,
  DollarSign, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Review, FirstImpression, MIN_LISTEN_SECONDS } from "../types";
import {
  formatTimestamp, getTierEarningsCents, firstImpressionEnumFromScore,
  firstImpressionLabel, firstImpressionColor,
} from "../utils";
import { getReviewFormConfig } from "../feedback-config";

function countWords(text: string): number {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).length;
}

// ---------------------------------------------------------------------------
// Engagement levels
// ---------------------------------------------------------------------------

const LEVELS = [
  { value: 1, label: "Lost it", color: "#525252", active: "bg-neutral-700 text-white border-neutral-700", inactive: "bg-neutral-100 text-neutral-500 border-neutral-200" },
  { value: 2, label: "Meh",     color: "#3b82f6", active: "bg-blue-500 text-white border-blue-500",       inactive: "bg-blue-50 text-blue-500 border-blue-200" },
  { value: 3, label: "Okay",    color: "#f59e0b", active: "bg-amber-400 text-black border-amber-400",     inactive: "bg-amber-50 text-amber-600 border-amber-200" },
  { value: 4, label: "Good",    color: "#10b981", active: "bg-emerald-500 text-white border-emerald-500", inactive: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { value: 5, label: "Hooked",  color: "#9333ea", active: "bg-purple-600 text-white border-purple-600",   inactive: "bg-purple-50 text-purple-600 border-purple-200" },
] as const;

// ---------------------------------------------------------------------------
// Engagement curve
// ---------------------------------------------------------------------------

function EngagementChart({
  curve,
  duration,
  skipPoint,
  mini = false,
}: {
  curve: Array<{ seconds: number; level: number }>;
  duration: number;
  skipPoint: number | null;
  mini?: boolean;
}) {
  const W = 600;
  const H = mini ? 48 : 80;
  const PAD = 6;

  const empty = curve.length < 1;
  const maxDur = Math.max(duration, curve[curve.length - 1]?.seconds ?? 1, 1);
  const toX = (s: number) => PAD + (s / maxDur) * (W - PAD * 2);
  const toY = (l: number) => H - PAD - ((l - 1) / 4) * (H - PAD * 2);

  const pts = curve.map((p) => [toX(p.seconds), toY(p.level)] as [number, number]);
  const getColor = (level: number) => LEVELS.find((l) => l.value === level)?.color ?? "#9333ea";

  // Build individual bezier segments — each gets the color of its start point's level
  const segments = pts.length >= 2
    ? pts.slice(0, -1).map((p0, i) => {
        const p1 = pts[i + 1];
        const cpx = (p0[0] + p1[0]) / 2;
        const color = getColor(curve[i].level);
        return {
          color,
          line: `M ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]}`,
          fill: `M ${p0[0]},${H - PAD} L ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]} L ${p1[0]},${H - PAD} Z`,
        };
      })
    : [];

  const currentLevel = curve[curve.length - 1]?.level ?? 3;
  const currentColor = getColor(currentLevel);
  const last = pts[pts.length - 1];

  return (
    <div className="relative flex" style={{ height: mini ? 48 : 80 }}>
      {/* Y axis labels */}
      {!mini && (
        <div className="flex flex-col justify-between py-1 shrink-0" style={{ width: 40 }}>
          {["Hooked", "Good", "Okay", "Meh", "Lost"].map((label) => (
            <span key={label} className="text-[9px] font-bold text-black/20 leading-none">{label}</span>
          ))}
        </div>
      )}

      <div className="flex-1 relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={0} y1={toY(i)} x2={W} y2={toY(i)}
              stroke="black" strokeOpacity="0.05" strokeWidth="1" />
          ))}
          {skipPoint !== null && (
            <line x1={toX(skipPoint)} y1={0} x2={toX(skipPoint)} y2={H}
              stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" strokeOpacity="0.6" />
          )}
          {/* Per-segment fills */}
          {segments.map((seg, i) => (
            <path key={`f${i}`} d={seg.fill} fill={seg.color} fillOpacity="0.12" />
          ))}
          {/* Per-segment lines */}
          {segments.map((seg, i) => (
            <path key={`l${i}`} d={seg.line} fill="none" stroke={seg.color}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {/* First point dot (waiting for a second sample) */}
          {pts.length === 1 && last && (
            <circle cx={last[0]} cy={last[1]} r="3.5" fill={currentColor} />
          )}
          {/* Pulsing live endpoint */}
          {!mini && last && segments.length >= 1 && (
            <>
              <circle cx={last[0]} cy={last[1]} r="4.5" fill={currentColor} />
              <circle cx={last[0]} cy={last[1]} r="4.5" fill={currentColor} fillOpacity="0.3">
                <animate attributeName="r" values="4.5;9;4.5" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-black/20 font-medium text-center px-4">
              Tap a level above while listening — your curve draws here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Option button (quality / next focus)
// ---------------------------------------------------------------------------

function OptionButton({
  selected, onClick, label, desc, color = "purple",
}: {
  selected: boolean; onClick: () => void;
  label: string; desc?: string; color?: "purple" | "blue";
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border transition-colors duration-100",
        selected
          ? color === "blue" ? "border-blue-400 bg-blue-50 text-blue-900" : "border-purple-400 bg-purple-50 text-purple-900"
          : "border-black/8 bg-white text-black hover:border-black/20 hover:bg-neutral-50"
      )}
    >
      <span className="font-bold text-sm block">{label}</span>
      {desc && <span className={cn("text-xs mt-0.5 block", selected ? "text-black/50" : "text-black/40")}>{desc}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline field error
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs font-bold text-red-600 mt-1">
      <AlertTriangle className="h-3 w-3 shrink-0" />{message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReviewPageV2({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<1 | 2>(1);
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isMarkingUnplayable, setIsMarkingUnplayable] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showUnplayableDialog, setShowUnplayableDialog] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // listen state
  const [listenTime, setListenTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // engagement — null until user first clicks
  const [engagementLevel, setEngagementLevel] = useState<number | null>(null);
  const engagementLevelRef = useRef<number | null>(null);
  const [engagementCurve, setEngagementCurve] = useState<Array<{ seconds: number; level: number }>>([]);
  const lastSampledSecond = useRef(-2);

  // skip point
  const [skipPoint, setSkipPoint] = useState<number | null>(null);

  // form fields (phase 2)
  const [firstImpressionScore, setFirstImpressionScore] = useState(3);
  const [firstImpressionTouched, setFirstImpressionTouched] = useState(false);
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(null);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [bestPart, setBestPart] = useState("");
  const [biggestWeaknessSpecific, setBiggestWeaknessSpecific] = useState("");
  const [technicalIssues, setTechnicalIssues] = useState<string[]>([]);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);
  const [nextFocus, setNextFocus] = useState<string | null>(null);
  const [honestFriend, setHonestFriend] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A/B test state
  const [abTestPreference, setAbTestPreference] = useState<"VERSION_A" | "VERSION_B" | "NO_PREFERENCE" | null>(null);

  // refs for phase 2 scroll
  const firstImpressionRef = useRef<HTMLDivElement>(null);
  const wouldListenRef = useRef<HTMLDivElement>(null);
  const bestPartRef = useRef<HTMLDivElement>(null);
  const mainFeedbackRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);

  // fetch
  useEffect(() => {
    fetch(`/api/reviews/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }
          if (res.status === 403) {
            const msg = (data?.error ?? "").toLowerCase();
            if (msg.includes("onboarding")) { router.push("/onboarding"); return; }
            if (msg.includes("restricted")) { router.push("/dashboard"); return; }
          }
          setError(data?.error ?? "Review not found");
          setIsLoading(false);
          return;
        }
        const r: Review = data;
        if (r.status === "SKIPPED" || r.status === "EXPIRED") {
          router.push(`/review?notice=${r.status === "SKIPPED" ? "skipped" : "expired"}`);
          return;
        }
        if (r.skipListenTimer) setCanSubmit(true);
        const lt = r.listenDuration ?? 0;
        setListenTime(lt);
        if (lt >= MIN_LISTEN_SECONDS) setCanSubmit(true);
        setReview(r);
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load review"); setIsLoading(false); });
  }, [id, router]);

  // heartbeat
  const heartbeatInFlight = useRef(false);
  const lastHeartbeatAt = useRef(0);
  const sendHeartbeat = useCallback(async () => {
    if (!review || heartbeatInFlight.current) return;
    const now = Date.now();
    if (now - lastHeartbeatAt.current < 4000) return;
    heartbeatInFlight.current = true;
    lastHeartbeatAt.current = now;
    try {
      const res = await fetch(`/api/reviews/${review.id}/heartbeat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientListenTime: Math.floor(listenTime) }),
      });
      if (res.ok) {
        const d = await res.json();
        if (typeof d.listenDuration === "number") setListenTime((p) => Math.max(p, d.listenDuration));
        if (d.minimumReached) setCanSubmit(true);
      }
    } catch {}
    finally { heartbeatInFlight.current = false; }
  }, [review, listenTime]);

  const setLevel = useCallback((l: number) => {
    engagementLevelRef.current = l;
    setEngagementLevel(l);
  }, []);

  const handleTimeUpdate = useCallback((seconds: number) => {
    setPlayerSeconds(seconds);
    setAudioDuration((prev) => Math.max(prev, seconds));
    if (engagementLevelRef.current === null) return;
    if (seconds - lastSampledSecond.current >= 0.5) {
      lastSampledSecond.current = seconds;
      setEngagementCurve((prev) => [
        ...prev,
        { seconds: Math.round(seconds * 10) / 10, level: engagementLevelRef.current! },
      ]);
    }
  }, []);

  // submit
  const handleSubmit = async () => {
    if (!review) return;
    const formConfig = getReviewFormConfig(
      review.Track.ArtistProfile?.experienceLevel,
      review.Track.feedbackAreas,
      review.Track.feedbackFocus,
    );
    const nextErrors: Record<string, string> = {};
    if (!firstImpressionTouched) nextErrors.firstImpression = "Select your first impression";
    if (wouldListenAgain === null) nextErrors.wouldListenAgain = "Required";
    if (countWords(bestPart) < formConfig.bestMomentMinWords)
      nextErrors.bestPart = `${formConfig.bestMomentMinWords - countWords(bestPart)} more words needed`;
    if (countWords(biggestWeaknessSpecific) < formConfig.mainFeedbackMinWords)
      nextErrors.mainFeedback = `${formConfig.mainFeedbackMinWords - countWords(biggestWeaknessSpecific)} more words needed`;
    if (!qualityLevel) nextErrors.qualityLevel = "Required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
        firstImpression: firstImpressionRef, wouldListenAgain: wouldListenRef,
        bestPart: bestPartRef, mainFeedback: mainFeedbackRef, qualityLevel: qualityRef,
      };
      const first = ["firstImpression", "wouldListenAgain", "bestPart", "mainFeedback", "qualityLevel"]
        .find((k) => nextErrors[k]);
      if (first) refMap[first]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await fetch(`/api/reviews/${review.id}/heartbeat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientListenTime: Math.floor(listenTime) }),
      }).catch(() => {});

      const hasVocalIssue = !isInstrumental && technicalIssues.includes("vocals-buried");
      const qualityToScore = (lvl: string | null) =>
        ({ PROFESSIONAL: 5, RELEASE_READY: 4, ALMOST_THERE: 3, DEMO_STAGE: 2, NOT_READY: 1 }[lvl ?? ""] ?? 3);

      const timestampNotes = skipPoint !== null
        ? [{ seconds: skipPoint, note: "[Would have skipped here]" }]
        : undefined;

      const res = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id, firstImpression,
          engagementCurve: engagementCurve.length > 0 ? engagementCurve : undefined,
          productionScore: qualityToScore(qualityLevel),
          vocalScore: isInstrumental ? null : (hasVocalIssue ? 2 : 4),
          originalityScore: firstImpressionScore,
          wouldListenAgain, bestPart,
          weakestPart: biggestWeaknessSpecific, biggestWeaknessSpecific,
          timestamps: timestampNotes,
          lowEndClarity: technicalIssues.includes("muddy-low") ? "BOTH_MUDDY" : "PERFECT",
          vocalClarity: isInstrumental ? "NOT_APPLICABLE" : (hasVocalIssue ? "BURIED" : "CRYSTAL_CLEAR"),
          highEndQuality: technicalIssues.includes("harsh-highs") ? "TOO_HARSH" : "PERFECT",
          stereoWidth: technicalIssues.includes("narrow-stereo") ? "TOO_NARROW" : "GOOD_BALANCE",
          dynamics: technicalIssues.includes("compressed") ? "TOO_COMPRESSED" : "GREAT_DYNAMICS",
          tooRepetitive: technicalIssues.includes("repetitive"),
          trackLength: technicalIssues.includes("too-long") ? "WAY_TOO_LONG" : "PERFECT",
          qualityLevel, nextFocus: nextFocus ?? "MIXING",
          additionalNotes: honestFriend.trim() || undefined,
          // A/B test fields
          ...(review.linkedReviewId && abTestPreference ? {
            abTestPreference,
            linkedReviewId: review.linkedReviewId,
          } : {}),
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        const msg = body?.error ?? "Failed to submit";
        if (res.status === 401) { router.push("/login"); return; }
        setError(msg);
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!review) return;
    setShowSkipDialog(false); setIsSkipping(true);
    try {
      await fetch(`/api/reviews/${review.id}/skip`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      router.push("/review?notice=skipped"); router.refresh();
    } catch { setError("Failed to skip"); setIsSkipping(false); }
  };

  const handleUnplayable = async () => {
    if (!review) return;
    setShowUnplayableDialog(false); setIsMarkingUnplayable(true);
    try {
      await fetch(`/api/reviews/${review.id}/unplayable`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      router.push("/review?notice=unplayable"); router.refresh();
    } catch { setError("Failed to report"); setIsMarkingUnplayable(false); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Music className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="font-black text-xl mb-2">Something went wrong</h2>
        <p className="text-sm text-neutral-600 mb-6">{error}</p>
        <Link href="/review"><Button variant="outline">Back to Queue</Button></Link>
      </div>
    );
  }

  if (!review) return null;

  // ── Success ──────────────────────────────────────────────────────────────

  if (success) {
    const isPeer = review.isPeerReview || !!review.peerReviewerArtistId;
    const totalReviews = review.ArtistProfile?.totalPeerReviews ?? 0;
    const avgRating = review.ArtistProfile?.peerReviewRating ?? 0;
    const isProReviewer = totalReviews >= 25 && avgRating >= 4.5;
    const reviewsUntilPro = Math.max(0, 25 - totalReviews);

    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
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
          <p className="text-sm text-black/50">Your feedback helps artists improve their music.</p>
        </div>
        {isPeer && !isProReviewer && (
          <div className="rounded-xl border border-black/10 bg-white p-5 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-bold text-black">Earn $1.50 cash per review</p>
            </div>
            {[
              { done: totalReviews >= 25, text: "Complete 25 reviews", sub: reviewsUntilPro > 0 ? `${reviewsUntilPro} to go` : "Done!" },
              { done: avgRating >= 4.5, text: "Maintain 4.5+ average rating", sub: avgRating > 0 ? `currently ${avgRating.toFixed(1)}` : "no ratings yet" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className={cn("mt-0.5 inline-flex h-4 w-4 rounded-full items-center justify-center text-[9px] font-bold shrink-0", item.done ? "bg-purple-600 text-white" : "bg-black/10 text-black/40")}>
                  {item.done ? "✓" : i + 1}
                </span>
                <span className="text-xs text-black/70">
                  <span className="font-semibold">{item.text}</span>
                  <span className="text-black/40"> — {item.sub}</span>
                </span>
              </div>
            ))}
            {totalReviews > 0 && (
              <div className="h-1.5 bg-black/10 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (totalReviews / 25) * 100)}%` }} />
              </div>
            )}
          </div>
        )}
        <div className="space-y-3">
          <Link href="/review">
            <Button className="w-full bg-purple-600 text-white hover:bg-purple-700 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-12 rounded-xl">
              Review another track
            </Button>
          </Link>
          {isPeer && (
            <Link href="/submit" className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border-2 border-black/10 bg-white hover:border-purple-300 hover:bg-purple-50 text-sm font-bold text-black/60 hover:text-purple-700 transition-all">
              Got a track of your own? Submit it →
            </Link>
          )}
        </div>
      </div>
    );
  }

  const formConfig = getReviewFormConfig(
    review.Track.ArtistProfile?.experienceLevel,
    review.Track.feedbackAreas,
    review.Track.feedbackFocus,
  );

  const listenPct = Math.min(100, Math.round((listenTime / MIN_LISTEN_SECONDS) * 100));
  const currentLevelData = LEVELS.find((l) => l.value === engagementLevel) ?? null;
  const bestPartWords = countWords(bestPart);
  const mainFeedbackWords = countWords(biggestWeaknessSpecific);
  const meetsText = bestPartWords >= formConfig.bestMomentMinWords && mainFeedbackWords >= formConfig.mainFeedbackMinWords;

  // ── Shared dialogs ───────────────────────────────────────────────────────

  const Dialogs = (
    <>
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <SkipForward className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Skip this track?</DialogTitle>
            <DialogDescription className="text-center">Removes it from your queue. You have a limited number of skips per day.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSkipDialog(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleSkip} isLoading={isSkipping}>Skip Track</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showUnplayableDialog} onOpenChange={setShowUnplayableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <VolumeX className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Audio not working?</DialogTitle>
            <DialogDescription className="text-center">Notifies the artist and removes it from your queue.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowUnplayableDialog(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleUnplayable} isLoading={isMarkingUnplayable}>Report Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // ── Top nav ──────────────────────────────────────────────────────────────

  const TopBar = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => phase === 2 ? setPhase(1) : router.push("/review")}
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {phase === 2 ? "Back to listening" : "Back to Queue"}
        </button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowUnplayableDialog(true)} className="text-xs">
          Audio not working
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowSkipDialog(true)} className="text-xs">
          Skip
        </Button>
      </div>
    </div>
  );

  // =========================================================================
  // PHASE 1 — Listen & React
  // =========================================================================

  if (phase === 1) {
    return (
      <div className="pt-8 pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">

          {TopBar}

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">1</div>
              <span className="text-xs font-bold text-neutral-700">Listen &amp; React</span>
            </div>
            <div className="flex-1 h-px bg-black/8" />
            <div className="flex items-center gap-2 opacity-30">
              <div className="w-6 h-6 rounded-full border-2 border-black/20 text-black flex items-center justify-center text-xs font-black">2</div>
              <span className="text-xs font-bold text-neutral-700">Your Feedback</span>
            </div>
          </div>

          {/* Combined track + player + reaction — one cohesive dark card */}
          <Card variant="soft" elevated className="overflow-hidden">
            {/* Track header — light */}
            <CardHeader className="border-b border-black/8 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden border border-purple-200/50">
                  {review.Track.artworkUrl
                    ? <img src={review.Track.artworkUrl} alt={review.Track.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center"><Music className="h-7 w-7 text-purple-600" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-black tracking-tight leading-tight">{review.Track.title}</h1>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {review.Track.Genre.map((g) => (
                      <span key={g.id} className="text-[10px] font-semibold px-2 py-0.5 bg-black/5 rounded-md text-neutral-500">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {formConfig.hasContext && review.Track.feedbackFocus && (
                <div className="mt-4 px-4 py-3 bg-purple-50 rounded-xl border border-purple-200/60">
                  <p className="text-sm text-purple-900">
                    <span className="font-bold">Artist says: </span>&ldquo;{review.Track.feedbackFocus}&rdquo;
                  </p>
                </div>
              )}
              {!formConfig.hasContext && review.Track.feedbackFocus && (
                <div className="mt-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200/60">
                  <p className="text-sm text-amber-900">
                    <span className="font-bold">Artist note: </span>{review.Track.feedbackFocus}
                  </p>
                </div>
              )}
            </CardHeader>

            {/* Audio player — dark */}
            <div className="bg-neutral-900 px-6 py-4">
              {review.Track.isAbTest && review.Track.other_Track && (
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 mb-3">Version A</p>
              )}
              <AudioPlayer
                sourceUrl={review.Track.sourceUrl}
                sourceType={review.Track.sourceType}
                showWaveform={review.Track.sourceType === "UPLOAD"}
                minListenTime={review.skipListenTimer ? 0 : MIN_LISTEN_SECONDS}
                initialListenTime={listenTime}
                onTimeUpdate={(s) => { void handleTimeUpdate(s); }}
                onListenProgress={(s) => {
                  setListenTime((p) => Math.max(p, s));
                  void sendHeartbeat();
                }}
                onMinimumReached={() => setCanSubmit(true)}
                showListenTracker
              />

              {/* A/B: Track B player + preference picker */}
              {review.Track.isAbTest && review.Track.other_Track && (
                <div className="mt-5 space-y-4">
                  <div className="border-t border-white/10 pt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 mb-1">Version B</p>
                    <p className="text-xs text-white/30 mb-3">{review.Track.other_Track.title}</p>
                    <AudioPlayer
                      sourceUrl={review.Track.other_Track.sourceUrl}
                      sourceType={review.Track.other_Track.sourceType}
                      showWaveform={review.Track.other_Track.sourceType === "UPLOAD"}
                      showListenTracker={false}
                      minListenTime={0}
                    />
                  </div>

                  {/* Preference picker */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-black text-white">Which version is stronger?</p>
                    <p className="text-xs text-white/35">Listen to both before choosing — this is the most important part of a compare review.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["VERSION_A", "VERSION_B", "NO_PREFERENCE"] as const).map((val) => {
                        const labels = { VERSION_A: "Version A", VERSION_B: "Version B", NO_PREFERENCE: "No preference" };
                        const isSelected = abTestPreference === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAbTestPreference(val)}
                            className={cn(
                              "px-2 py-3 rounded-xl border text-xs font-black transition-all",
                              isSelected
                                ? val === "VERSION_B" ? "bg-purple-600 border-purple-500 text-white" : "bg-white border-white text-black"
                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/25 hover:text-white/70"
                            )}
                          >
                            {labels[val]}
                          </button>
                        );
                      })}
                    </div>
                    {!abTestPreference && (
                      <p className="text-[11px] text-purple-400 font-bold">Required before submitting ↓</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reaction controls — dark, flows directly from player */}
            <div className="bg-neutral-900 border-t border-white/[0.06] px-6 pt-5 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-black text-[15px] leading-tight">How is it landing?</p>
                  <p className="text-white/35 text-xs mt-0.5">Tap to react — change it any time</p>
                </div>
                {currentLevelData && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0"
                    style={{ backgroundColor: currentLevelData.color + '22', borderColor: currentLevelData.color + '55' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentLevelData.color }} />
                    <span className="text-xs font-black text-white">{currentLevelData.label}</span>
                  </div>
                )}
              </div>

              {/* Level buttons */}
              <div className="flex gap-2 mb-5">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "flex-1 py-4 rounded-xl border-2 font-black text-[11px] sm:text-xs transition-all duration-150 select-none",
                      engagementLevel === l.value
                        ? "text-white"
                        : "border-white/10 bg-white/5 text-white/35 hover:bg-white/10 hover:text-white/60"
                    )}
                    style={engagementLevel === l.value ? {
                      backgroundColor: l.color + '28',
                      borderColor: l.color + '80',
                    } : undefined}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Reaction journey — color bar (left = start, right = now) */}
              {engagementCurve.length > 1 ? (
                <div className="mb-5">
                  <div className="flex gap-px overflow-hidden rounded-full" style={{ height: 5 }}>
                    {(() => {
                      const maxSlices = 100;
                      const step = Math.max(1, Math.floor(engagementCurve.length / maxSlices));
                      return engagementCurve
                        .filter((_, i) => i % step === 0)
                        .map((point, i) => (
                          <div
                            key={i}
                            className="flex-1 opacity-75"
                            style={{ backgroundColor: LEVELS.find((lv) => lv.value === point.level)?.color ?? '#9333ea' }}
                          />
                        ));
                    })()}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-white/20 font-medium">Start</span>
                    <span className="text-[10px] text-white/20 font-medium">Now</span>
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <div className="rounded-full bg-white/[0.06]" style={{ height: 5 }} />
                  {!currentLevelData && (
                    <p className="text-[10px] text-white/20 font-medium mt-1.5 text-center">Your reaction trail appears here as you tap</p>
                  )}
                </div>
              )}

              {/* Skip + listen timer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/8">
                {skipPoint === null ? (
                  <button
                    type="button"
                    onClick={() => setSkipPoint(playerSeconds)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white/25 hover:text-red-400 transition-colors"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    I&apos;d skip here — {formatTimestamp(playerSeconds)}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <SkipForward className="h-3.5 w-3.5" />
                      Would skip at {formatTimestamp(skipPoint)}
                    </span>
                    <button type="button" onClick={() => setSkipPoint(null)}
                      className="text-[11px] text-white/25 hover:text-white/50 underline">clear</button>
                  </div>
                )}
                <span className="text-xs font-mono text-white/25 shrink-0">
                  {formatTimestamp(Math.floor(listenTime))} listened
                </span>
              </div>
            </div>
          </Card>

          {/* Continue / progress card */}
          <Card variant="soft" elevated className="p-6">
            {!canSubmit ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-neutral-500">
                    Listen for at least 3 minutes to continue
                  </p>
                  <span className="text-sm font-black text-neutral-400 tabular-nums">
                    {formatTimestamp(Math.floor(listenTime))} / 3:00
                  </span>
                </div>
                <div className="h-2 bg-black/8 w-full rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${listenPct}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">{listenPct}% done</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-black">
                    {engagementCurve.length === 0 ? "Ready to continue" : "Nice — you've listened enough"}
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {engagementCurve.length > 0
                      ? "Reaction captured — head to step 2"
                      : "Head to step 2 to leave your written feedback"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPhase(2); setTimeout(() => window.scrollTo({ top: 0 }), 50); }}
                  className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </Card>

        </div>
        {Dialogs}
      </div>
    );
  }

  // =========================================================================
  // PHASE 2 — Written Feedback
  // =========================================================================

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">

        {TopBar}

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">✓</div>
            <span className="text-xs font-bold text-neutral-700">Listen &amp; React</span>
          </div>
          <div className="flex-1 h-px bg-black/8" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">2</div>
            <span className="text-xs font-bold text-neutral-700">Your Feedback</span>
          </div>
        </div>

        {/* Track + reaction curve summary */}
        <Card variant="soft" elevated>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-purple-200/50">
                {review.Track.artworkUrl
                  ? <img src={review.Track.artworkUrl} alt={review.Track.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center"><Music className="h-5 w-5 text-purple-600" /></div>
                }
              </div>
              <div>
                <p className="font-black text-sm">{review.Track.title}</p>
                <p className="text-xs text-neutral-500">{review.Track.Genre.map((g) => g.name).join(", ")}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Listened</p>
                <p className="text-sm font-black text-black">{formatTimestamp(Math.floor(listenTime))}</p>
              </div>
            </div>

            {engagementCurve.length >= 1 ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Your reaction curve</p>
                <EngagementChart curve={engagementCurve} duration={audioDuration} skipPoint={skipPoint} mini />
                {skipPoint !== null && (
                  <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1.5">
                    <SkipForward className="h-3 w-3" /> Would have skipped at {formatTimestamp(skipPoint)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-400">No reaction curve — you can still leave written feedback below.</p>
            )}
          </CardContent>
        </Card>

        {/* ── First Impression ───────────────────────────────────────── */}
        <div ref={firstImpressionRef}>
          <Card variant="soft" elevated className={cn(errors.firstImpression && "border-red-300 border")}>
            <CardContent className="pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">First Impression</p>
              <p className="text-xs text-neutral-500 mb-4">How did the opening 30 seconds land?</p>
              <FieldError message={errors.firstImpression} />
              <div className="grid grid-cols-5 gap-2 mt-3">
                {([
                  { score: 1, label: "Nah" }, { score: 2, label: "Meh" }, { score: 3, label: "Solid" },
                  { score: 4, label: "Into it" }, { score: 5, label: "Hooked" },
                ] as const).map(({ score, label }) => {
                  const selected = firstImpressionTouched && firstImpressionScore === score;
                  return (
                    <button key={score} type="button"
                      onClick={() => {
                        setFirstImpressionScore(score); setFirstImpressionTouched(true);
                        setFirstImpression(firstImpressionEnumFromScore(score));
                        setErrors((p) => { const n = { ...p }; delete n.firstImpression; return n; });
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-100",
                        selected ? firstImpressionColor(score) : "border-black/8 bg-white text-black/40 hover:border-black/20"
                      )}
                    >
                      <span className="text-lg font-black leading-none">{score}</span>
                      <span className="text-[10px] font-bold leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
              {firstImpressionTouched && (
                <p className={cn("mt-3 text-sm font-semibold px-3 py-2 rounded-lg border", firstImpressionColor(firstImpressionScore))}>
                  {firstImpressionLabel(firstImpressionScore)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Would Listen Again ─────────────────────────────────────── */}
        <div ref={wouldListenRef}>
          <Card variant="soft" elevated className={cn(errors.wouldListenAgain && "border-red-300 border")}>
            <CardContent className="pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Replay Test</p>
              <p className="text-xs text-neutral-500 mb-4">Would you come back and listen to this again?</p>
              <FieldError message={errors.wouldListenAgain} />
              <div className="flex gap-2 mt-3">
                {[{ val: true, label: "Yes, I'd replay it" }, { val: false, label: "No, once was enough" }].map(({ val, label }) => (
                  <button key={String(val)} type="button"
                    onClick={() => {
                      setWouldListenAgain(val);
                      setErrors((p) => { const n = { ...p }; delete n.wouldListenAgain; return n; });
                    }}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all duration-100",
                      wouldListenAgain === val
                        ? val ? "border-purple-400 bg-purple-50 text-purple-900" : "border-neutral-400 bg-neutral-100 text-neutral-800"
                        : "border-black/8 bg-white text-black hover:border-black/20"
                    )}
                  >{label}</button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Best Moment ────────────────────────────────────────────── */}
        <div ref={bestPartRef}>
          <Card variant="soft" elevated className={cn(errors.bestPart && "border-red-300 border")}>
            <CardContent className="pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                {formConfig.bestMomentLabel.replace(" *", "")}
              </p>
              <p className="text-xs text-neutral-500 mb-4">{formConfig.bestMomentPrompt}</p>
              <FieldError message={errors.bestPart} />
              <textarea value={bestPart} onChange={(e) => {
                setBestPart(e.target.value);
                if (errors.bestPart) setErrors((p) => { const n = { ...p }; delete n.bestPart; return n; });
              }} rows={4} placeholder={formConfig.bestMomentPrompt}
                className="w-full mt-3 px-4 py-3 border border-black/10 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-purple-400 placeholder:text-black/20 transition-colors bg-white" />
              <div className="flex items-center justify-between mt-2">
                <span className={cn("text-xs font-mono", bestPartWords >= formConfig.bestMomentMinWords ? "text-emerald-600" : "text-neutral-400")}>
                  {bestPartWords}/{formConfig.bestMomentMinWords} words
                </span>
                {bestPartWords >= formConfig.bestMomentMinWords && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Good</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Feedback ──────────────────────────────────────────── */}
        <div ref={mainFeedbackRef}>
          <Card variant="soft" elevated className={cn(errors.mainFeedback && "border-red-300 border")}>
            <CardContent className="pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                {formConfig.mainFeedbackLabel.replace(" *", "")}
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                What&apos;s holding it back? Mention a moment, a section, or something you&apos;d change if it were yours.
              </p>
              <FieldError message={errors.mainFeedback} />
              <textarea value={biggestWeaknessSpecific} onChange={(e) => {
                setBiggestWeaknessSpecific(e.target.value);
                if (errors.mainFeedback) setErrors((p) => { const n = { ...p }; delete n.mainFeedback; return n; });
              }} rows={5}
                placeholder="E.g. 'The energy drops pretty hard around the middle section and I found myself zoning out. The intro pulls you in well but then it kind of plateaus — maybe the bridge needs something new to bring it back.'"
                className="w-full mt-3 px-4 py-3 border border-black/10 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-purple-400 placeholder:text-black/20 transition-colors bg-white" />
              <div className="flex items-center justify-between mt-2">
                <span className={cn("text-xs font-mono", mainFeedbackWords >= formConfig.mainFeedbackMinWords ? "text-emerald-600" : "text-neutral-400")}>
                  {mainFeedbackWords}/{formConfig.mainFeedbackMinWords} words
                </span>
                {mainFeedbackWords >= formConfig.mainFeedbackMinWords && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Good</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Technical Issues ───────────────────────────────────────── */}
        {formConfig.showTechnicalIssues && (
          <Card variant="soft" elevated>
            <CardContent className="pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Technical Issues</p>
              <p className="text-xs text-neutral-500 mb-4">Flag any problems — or leave blank if it sounded clean.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setTechnicalIssues([]); setIsInstrumental(false); }}
                  className={cn("px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all",
                    technicalIssues.length === 0 && !isInstrumental ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-black/8 bg-white text-neutral-500 hover:border-black/20")}>
                  ✓ Sounds clean
                </button>
                <button type="button" onClick={() => { setIsInstrumental((p) => !p); setTechnicalIssues((p) => p.filter((i) => i !== "vocals-buried")); }}
                  className={cn("px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all",
                    isInstrumental ? "border-blue-400 bg-blue-50 text-blue-800" : "border-black/8 bg-white text-neutral-500 hover:border-black/20")}>
                  Instrumental (no vocals)
                </button>
                {formConfig.technicalIssueOptions.filter((issue) => !(isInstrumental && issue.id === "vocals-buried")).map((issue) => (
                  <button key={issue.id} type="button"
                    onClick={() => setTechnicalIssues((p) => p.includes(issue.id) ? p.filter((i) => i !== issue.id) : [...p, issue.id])}
                    className={cn("px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all",
                      technicalIssues.includes(issue.id) ? "border-amber-400 bg-amber-50 text-amber-800" : "border-black/8 bg-white text-neutral-500 hover:border-black/20")}>
                    {issue.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Quality Level ──────────────────────────────────────────── */}
        <div ref={qualityRef}>
          <Card variant="soft" elevated className={cn(errors.qualityLevel && "border-red-300 border")}>
            <CardContent className="pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Quality Level</p>
              <p className="text-xs text-neutral-500 mb-4">Where is this track at overall?</p>
              <FieldError message={errors.qualityLevel} />
              <div className="space-y-2 mt-3">
                {[
                  { id: "PROFESSIONAL",  label: "Professional",  desc: "Ready for commercial release today" },
                  { id: "RELEASE_READY", label: "Release ready", desc: "Good to go with minor tweaks" },
                  { id: "ALMOST_THERE",  label: "Almost there",  desc: "On the right track, needs some work" },
                  { id: "DEMO_STAGE",    label: "Demo stage",    desc: "Good ideas, not there yet" },
                  { id: "NOT_READY",     label: "Not ready",     desc: "Needs significant rethinking" },
                ].map((opt) => (
                  <OptionButton key={opt.id} selected={qualityLevel === opt.id}
                    onClick={() => {
                      setQualityLevel(opt.id);
                      setErrors((p) => { const n = { ...p }; delete n.qualityLevel; return n; });
                    }}
                    label={opt.label} desc={opt.desc} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Next Focus (optional) ──────────────────────────────────── */}
        <Card variant="soft" elevated>
          <CardContent className="pt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
              Next Focus <span className="normal-case tracking-normal font-medium text-neutral-300">optional</span>
            </p>
            <p className="text-xs text-neutral-500 mb-4">The one area that would move this track forward most.</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "MIXING", label: "Mixing" }, { id: "ARRANGEMENT", label: "Arrangement" },
                { id: "SOUND_DESIGN", label: "Sound design" }, { id: "SONGWRITING", label: "Songwriting" },
                { id: "PERFORMANCE", label: "Performance" }, { id: "READY_TO_RELEASE", label: "Ready to release" },
              ].map((opt) => (
                <button key={opt.id} type="button"
                  onClick={() => setNextFocus((p) => p === opt.id ? null : opt.id)}
                  className={cn("px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all",
                    nextFocus === opt.id ? "border-blue-400 bg-blue-50 text-blue-800" : "border-black/8 bg-white text-neutral-600 hover:border-black/20")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Honest Friend (optional) ───────────────────────────────── */}
        <Card variant="soft" elevated>
          <CardContent className="pt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
              The Honest Friend <span className="normal-case tracking-normal font-medium text-neutral-300">optional</span>
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              If this was your close friend — what&apos;s the one thing you&apos;d tell them?
            </p>
            <textarea value={honestFriend} onChange={(e) => setHonestFriend(e.target.value)}
              rows={3} placeholder="No structure — just say it."
              className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-purple-400 placeholder:text-black/20 transition-colors bg-white" />
          </CardContent>
        </Card>

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <Card variant="soft" elevated>
          <CardContent className="pt-5">
            <div className="flex items-center gap-6 mb-5 text-xs">
              <div className={cn("flex items-center gap-1.5 font-bold", canSubmit ? "text-emerald-600" : "text-neutral-300")}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]",
                  canSubmit ? "bg-emerald-500 text-white" : "bg-black/10 text-black/30")}>
                  {canSubmit ? "✓" : "○"}
                </span>
                Listened
              </div>
              <div className={cn("flex items-center gap-1.5 font-bold", meetsText ? "text-emerald-600" : "text-neutral-300")}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]",
                  meetsText ? "bg-emerald-500 text-white" : "bg-black/10 text-black/30")}>
                  {meetsText ? "✓" : "○"}
                </span>
                Feedback written
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-3xl font-black leading-none text-black">
                {review.ReviewerProfile ? formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier)) : "1 credit"}
              </span>
              <span className="text-sm text-neutral-400">you&apos;ll earn</span>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 font-medium">
                {Object.values(errors).filter(Boolean).join(" · ")}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 font-medium">{error}</div>
            )}

            <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!canSubmit || !meetsText || (!!review?.linkedReviewId && !abTestPreference)}
              className={cn(
                "w-full h-12 font-black text-base rounded-xl transition-all",
                canSubmit && meetsText
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                  : "bg-black/5 text-black/30 cursor-not-allowed"
              )}>
              {isSubmitting ? "Submitting…"
                : canSubmit && meetsText
                ? `Submit & earn ${review.ReviewerProfile ? formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier)) : "1 credit"}`
                : "Complete the fields above"}
            </Button>
          </CardContent>
        </Card>

      </div>
      {Dialogs}
    </div>
  );
}
