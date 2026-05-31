"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, Check, Music, SkipForward, VolumeX,
  AlertTriangle, DollarSign, Loader2, Clock,
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

// ── Engagement levels ─────────────────────────────────────────────────────

const LEVELS = [
  { value: 1, label: "Lost it",  color: "#525252", activeBg: "bg-neutral-700", activeBorder: "border-neutral-700", activeText: "text-white" },
  { value: 2, label: "Meh",      color: "#3b82f6", activeBg: "bg-blue-500",    activeBorder: "border-blue-500",    activeText: "text-white" },
  { value: 3, label: "Okay",     color: "#f59e0b", activeBg: "bg-amber-400",   activeBorder: "border-amber-400",   activeText: "text-black" },
  { value: 4, label: "Good",     color: "#10b981", activeBg: "bg-emerald-500", activeBorder: "border-emerald-500", activeText: "text-white" },
  { value: 5, label: "Hooked",   color: "#9333ea", activeBg: "bg-purple-600",  activeBorder: "border-purple-600",  activeText: "text-white" },
] as const;

// ── Engagement chart ──────────────────────────────────────────────────────

function EngagementChart({ curve, duration, skipPoint, mini = false }: {
  curve: Array<{ seconds: number; level: number }>;
  duration: number; skipPoint: number | null; mini?: boolean;
}) {
  const W = 600; const H = mini ? 40 : 72; const PAD = 4;
  const maxDur = Math.max(duration, curve[curve.length - 1]?.seconds ?? 1, 1);
  const toX = (s: number) => PAD + (s / maxDur) * (W - PAD * 2);
  const toY = (l: number) => H - PAD - ((l - 1) / 4) * (H - PAD * 2);
  const pts = curve.map(p => [toX(p.seconds), toY(p.level)] as [number, number]);
  const getColor = (level: number) => LEVELS.find(l => l.value === level)?.color ?? "#9333ea";
  const segments = pts.length >= 2 ? pts.slice(0, -1).map((p0, i) => {
    const p1 = pts[i + 1]; const cpx = (p0[0] + p1[0]) / 2;
    const color = getColor(curve[i].level);
    return {
      color,
      line: `M ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]}`,
      fill: `M ${p0[0]},${H - PAD} L ${p0[0]},${p0[1]} C ${cpx},${p0[1]} ${cpx},${p1[1]} ${p1[0]},${p1[1]} L ${p1[0]},${H - PAD} Z`,
    };
  }) : [];
  const last = pts[pts.length - 1];
  const currentColor = getColor(curve[curve.length - 1]?.level ?? 3);

  return (
    <div className="relative" style={{ height: mini ? 40 : 72 }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        {[1,2,3,4,5].map(i => (
          <line key={i} x1={0} y1={toY(i)} x2={W} y2={toY(i)} stroke="black" strokeOpacity="0.05" strokeWidth="1" />
        ))}
        {skipPoint !== null && (
          <line x1={toX(skipPoint)} y1={0} x2={toX(skipPoint)} y2={H} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" strokeOpacity="0.6" />
        )}
        {segments.map((seg, i) => <path key={`f${i}`} d={seg.fill} fill={seg.color} fillOpacity="0.12" />)}
        {segments.map((seg, i) => <path key={`l${i}`} d={seg.line} fill="none" stroke={seg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
        {pts.length === 1 && last && <circle cx={last[0]} cy={last[1]} r="3" fill={currentColor} />}
        {!mini && last && segments.length >= 1 && (
          <>
            <circle cx={last[0]} cy={last[1]} r="4" fill={currentColor} />
            <circle cx={last[0]} cy={last[1]} r="4" fill={currentColor} fillOpacity="0.3">
              <animate attributeName="r" values="4;8;4" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}

// ── Field error ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs font-bold text-red-600 mt-1.5">
      <AlertTriangle className="h-3 w-3 shrink-0" />{message}
    </p>
  );
}

// ── Word counter ──────────────────────────────────────────────────────────

function WordCount({ current, min }: { current: number; min: number }) {
  const done = current >= min;
  const remaining = min - current;
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-bold mt-2", done ? "text-emerald-600" : "text-black/30")}>
      {done ? (
        <><Check className="h-3 w-3" /> Good</>
      ) : current > 0 ? (
        <span>Keep going — {remaining} more {remaining === 1 ? "word" : "words"}</span>
      ) : (
        <span className="font-medium text-black/25">{min} words minimum</span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

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
  const [showSuccessActions, setShowSuccessActions] = useState(false);

  // listen state
  const [listenTime, setListenTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [playerSeconds, setPlayerSeconds] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // engagement
  const [engagementLevel, setEngagementLevel] = useState<number | null>(null);
  const engagementLevelRef = useRef<number | null>(null);
  const [engagementCurve, setEngagementCurve] = useState<Array<{ seconds: number; level: number }>>([]);
  const lastSampledSecond = useRef(-2);

  // skip point
  const [skipPoint, setSkipPoint] = useState<number | null>(null);

  // phase 2 form fields — reordered: quality first
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);
  const [firstImpressionScore, setFirstImpressionScore] = useState(3);
  const [firstImpressionTouched, setFirstImpressionTouched] = useState(false);
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(null);
  const [wouldListenAgain, setWouldListenAgain] = useState<boolean | null>(null);
  const [bestPart, setBestPart] = useState("");
  const [biggestWeaknessSpecific, setBiggestWeaknessSpecific] = useState("");
  const [technicalIssues, setTechnicalIssues] = useState<string[]>([]);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [nextFocus, setNextFocus] = useState<string | null>(null);
  const [honestFriend, setHonestFriend] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A/B
  const [abTestPreference, setAbTestPreference] = useState<"VERSION_A" | "VERSION_B" | "NO_PREFERENCE" | null>(null);

  // scroll refs — in new order
  const qualityRef = useRef<HTMLDivElement>(null);
  const quickTakeRef = useRef<HTMLDivElement>(null);
  const bestPartRef = useRef<HTMLDivElement>(null);
  const mainFeedbackRef = useRef<HTMLDivElement>(null);

  // fetch
  useEffect(() => {
    fetch(`/api/reviews/${id}`)
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }
          if (res.status === 403) {
            const msg = (data?.error ?? "").toLowerCase();
            if (msg.includes("onboarding")) { router.push("/onboarding"); return; }
            if (msg.includes("restricted")) { router.push("/dashboard"); return; }
          }
          setError(data?.error ?? "Review not found"); setIsLoading(false); return;
        }
        const r: Review = data;
        if (r.status === "SKIPPED" || r.status === "EXPIRED") {
          router.push(`/review?notice=${r.status === "SKIPPED" ? "skipped" : "expired"}`); return;
        }
        if (r.skipListenTimer) setCanSubmit(true);
        const lt = r.listenDuration ?? 0;
        setListenTime(lt);
        if (lt >= MIN_LISTEN_SECONDS) setCanSubmit(true);
        setReview(r); setIsLoading(false);
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
    heartbeatInFlight.current = true; lastHeartbeatAt.current = now;
    try {
      const res = await fetch(`/api/reviews/${review.id}/heartbeat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientListenTime: Math.floor(listenTime) }),
      });
      if (res.ok) {
        const d = await res.json();
        if (typeof d.listenDuration === "number") setListenTime(p => Math.max(p, d.listenDuration));
        if (d.minimumReached) setCanSubmit(true);
      }
    } catch {}
    finally { heartbeatInFlight.current = false; }
  }, [review, listenTime]);

  const setLevel = useCallback((l: number) => {
    engagementLevelRef.current = l; setEngagementLevel(l);
  }, []);

  const handleTimeUpdate = useCallback((seconds: number) => {
    setPlayerSeconds(seconds);
    setAudioDuration(prev => Math.max(prev, seconds));
    if (engagementLevelRef.current === null) return;
    if (seconds - lastSampledSecond.current >= 0.5) {
      lastSampledSecond.current = seconds;
      setEngagementCurve(prev => [...prev, { seconds: Math.round(seconds * 10) / 10, level: engagementLevelRef.current! }]);
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
    if (!qualityLevel) nextErrors.qualityLevel = "Required";
    if (!firstImpressionTouched) nextErrors.firstImpression = "Select your first impression";
    if (wouldListenAgain === null) nextErrors.wouldListenAgain = "Required";
    if (countWords(bestPart) < formConfig.bestMomentMinWords)
      nextErrors.bestPart = `${formConfig.bestMomentMinWords - countWords(bestPart)} more words needed`;
    if (countWords(biggestWeaknessSpecific) < formConfig.mainFeedbackMinWords)
      nextErrors.mainFeedback = `${formConfig.mainFeedbackMinWords - countWords(biggestWeaknessSpecific)} more words needed`;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
        qualityLevel: qualityRef, firstImpression: quickTakeRef, wouldListenAgain: quickTakeRef,
        bestPart: bestPartRef, mainFeedback: mainFeedbackRef,
      };
      const first = ["qualityLevel", "firstImpression", "wouldListenAgain", "bestPart", "mainFeedback"]
        .find(k => nextErrors[k]);
      if (first) refMap[first]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({}); setIsSubmitting(true);
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
          qualityLevel,
          ...(nextFocus ? { nextFocus } : {}),
          additionalNotes: honestFriend.trim() || undefined,
          ...(review.linkedReviewId && abTestPreference ? { abTestPreference, linkedReviewId: review.linkedReviewId } : {}),
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        const msg = body?.error ?? "Failed to submit";
        if (res.status === 401) { router.push("/login"); return; }
        setError(msg); setIsSubmitting(false); return;
      }
      setSuccess(true);
      setTimeout(() => setShowSuccessActions(true), 900);
    } catch {
      setError("Something went wrong"); setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!review) return;
    setShowSkipDialog(false); setIsSkipping(true);
    try {
      await fetch(`/api/reviews/${review.id}/skip`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      router.push("/review?notice=skipped"); router.refresh();
    } catch { setError("Failed to skip"); setIsSkipping(false); }
  };

  const handleUnplayable = async () => {
    if (!review) return;
    setShowUnplayableDialog(false); setIsMarkingUnplayable(true);
    try {
      await fetch(`/api/reviews/${review.id}/unplayable`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      router.push("/review?notice=unplayable"); router.refresh();
    } catch { setError("Failed to report"); setIsMarkingUnplayable(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
    </div>
  );

  if (error && !review) return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
      <div className="max-w-sm mx-auto px-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Music className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="font-black text-xl mb-2 tracking-tight">Something went wrong</h2>
        <p className="text-sm text-black/50 mb-6">{error}</p>
        <Link href="/review"><Button variant="outline">Back to Queue</Button></Link>
      </div>
    </div>
  );

  if (!review) return null;

  // ── Success ───────────────────────────────────────────────────────────────

  if (success) {
    const isPeer = review.isPeerReview || !!review.peerReviewerArtistId;
    const totalReviews = review.ArtistProfile?.totalPeerReviews ?? 0;
    const avgRating = review.ArtistProfile?.peerReviewRating ?? 0;
    const isProReviewer = totalReviews >= 25 && avgRating >= 4.5;
    const reviewsUntilPro = Math.max(0, 25 - totalReviews);
    const earnedLabel = isPeer ? "+1 credit" : `+${formatCurrency(getTierEarningsCents(review.ReviewerProfile?.tier ?? "NORMAL"))}`;

    return (
      <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-start pt-20 pb-24 px-4">
        {/* Reward moment — hero */}
        <div className={cn("text-center transition-all duration-700", showSuccessActions ? "mb-10" : "mb-0")}>
          <div className="w-16 h-16 bg-[#0d0d0d] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Check className="h-8 w-8 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 mb-2">Review submitted</p>
          <p className="text-5xl font-black tracking-tighter text-black mb-2">{earnedLabel}</p>
          <p className="text-sm text-black/40 font-medium">Your feedback is on its way to the artist.</p>
        </div>

        {/* Actions — fade in after brief delay */}
        <div className={cn("w-full max-w-sm space-y-3 transition-all duration-500", showSuccessActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
          <Link href="/review" className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-[#0d0d0d] text-white font-black text-sm hover:bg-black transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
            Review another track
            <ArrowRight className="h-4 w-4" />
          </Link>
          {isPeer && (
            <Link href="/submit" className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl border-2 border-black/10 bg-white text-sm font-bold text-black/55 hover:border-black/25 hover:text-black transition-all">
              Got a track? Submit it →
            </Link>
          )}

          {/* Pro upsell — only if not already on the path */}
          {isPeer && !isProReviewer && (
            <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-black text-black">Earn $1.50 cash per review</p>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  { done: totalReviews >= 25, text: "Complete 25 reviews", sub: reviewsUntilPro > 0 ? `${reviewsUntilPro} to go` : "Done!" },
                  { done: avgRating >= 4.5, text: "Maintain 4.5+ average rating", sub: avgRating > 0 ? `currently ${avgRating.toFixed(1)}` : "no ratings yet" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={cn("mt-0.5 inline-flex h-4 w-4 rounded-full items-center justify-center text-[9px] font-black shrink-0", item.done ? "bg-purple-600 text-white" : "bg-black/8 text-black/35")}>
                      {item.done ? "✓" : i + 1}
                    </span>
                    <span className="text-xs text-black/60">
                      <span className="font-bold">{item.text}</span>
                      <span className="text-black/35"> — {item.sub}</span>
                    </span>
                  </div>
                ))}
              </div>
              {totalReviews > 0 && (
                <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalReviews / 25) * 100)}%` }} />
                </div>
              )}
            </div>
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
  const currentLevelData = LEVELS.find(l => l.value === engagementLevel) ?? null;
  const bestPartWords = countWords(bestPart);
  const mainFeedbackWords = countWords(biggestWeaknessSpecific);
  const meetsText = bestPartWords >= formConfig.bestMomentMinWords && mainFeedbackWords >= formConfig.mainFeedbackMinWords;

  // ── Shared dialogs ────────────────────────────────────────────────────────

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

  // ── Sticky top bar ────────────────────────────────────────────────────────

  const StickyBar = (
    <div className="sticky top-0 z-20 bg-white border-b border-black/8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => phase === 2 ? setPhase(1) : router.push("/review")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-black/40 hover:text-black transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {phase === 2 ? "Back" : "Queue"}
        </button>

        {/* Step indicators */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black", phase === 1 ? "bg-black text-white" : "bg-emerald-500 text-white")}>
              {phase === 2 ? "✓" : "1"}
            </div>
            <span className={cn("text-xs font-bold hidden sm:inline", phase === 1 ? "text-black" : "text-black/30")}>Listen</span>
          </div>
          <div className="w-8 h-px bg-black/10" />
          <div className="flex items-center gap-1.5">
            <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black", phase === 2 ? "bg-black text-white" : "bg-black/8 text-black/25")}>
              2
            </div>
            <span className={cn("text-xs font-bold hidden sm:inline", phase === 2 ? "text-black" : "text-black/25")}>Feedback</span>
          </div>
        </div>

        {/* Skip + audio issue */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setShowUnplayableDialog(true)} className="text-[10px] font-bold text-black/30 hover:text-black/60 transition-colors px-2 py-1 rounded-lg hover:bg-black/4">
            Audio issue
          </button>
          <button onClick={() => setShowSkipDialog(true)} className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            Skip
          </button>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // PHASE 1 — Listen & React
  // =========================================================================

  if (phase === 1) {
    return (
      <div className="min-h-screen bg-[#faf7f2] pb-24">
        {StickyBar}

        {/* Track hero — dark */}
        <div className="bg-[#0d0d0d]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden border border-white/10">
                {review.Track.artworkUrl
                  ? <img src={review.Track.artworkUrl} alt={review.Track.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Music className="h-6 w-6 text-white/30" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-white tracking-tight leading-tight truncate">{review.Track.title}</h1>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {review.Track.Genre.map(g => (
                    <span key={g.id} className="text-[10px] font-semibold px-2 py-0.5 bg-white/8 rounded text-white/40">{g.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {review.Track.feedbackFocus && (
              <div className="mt-4 px-4 py-3 bg-white/6 rounded-xl border border-white/10">
                <p className="text-xs text-white/50"><span className="font-bold text-white/70">Artist says: </span>&ldquo;{review.Track.feedbackFocus}&rdquo;</p>
              </div>
            )}

            {/* Audio player */}
            <div className="mt-5">
              {review.Track.isAbTest && review.Track.other_Track && (
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 mb-3">Version A</p>
              )}
              <AudioPlayer
                sourceUrl={review.Track.sourceUrl}
                sourceType={review.Track.sourceType}
                showWaveform={review.Track.sourceType === "UPLOAD"}
                minListenTime={review.skipListenTimer ? 0 : MIN_LISTEN_SECONDS}
                initialListenTime={listenTime}
                onTimeUpdate={s => { void handleTimeUpdate(s); }}
                onListenProgress={s => { setListenTime(p => Math.max(p, s)); void sendHeartbeat(); }}
                onMinimumReached={() => setCanSubmit(true)}
                showListenTracker
              />
            </div>

            {/* A/B: Version B */}
            {review.Track.isAbTest && review.Track.other_Track && (
              <div className="mt-6 space-y-4">
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
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-black text-white">Which version is stronger?</p>
                  <p className="text-xs text-white/35">Listen to both before choosing.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["VERSION_A", "VERSION_B", "NO_PREFERENCE"] as const).map(val => {
                      const labels = { VERSION_A: "Version A", VERSION_B: "Version B", NO_PREFERENCE: "No preference" };
                      return (
                        <button key={val} type="button" onClick={() => setAbTestPreference(val)}
                          className={cn("px-2 py-3 rounded-xl border text-xs font-black transition-all",
                            abTestPreference === val
                              ? "bg-white border-white text-black"
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/25 hover:text-white/70"
                          )}>
                          {labels[val]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reaction section — cream */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4 mt-4">

          {/* Engagement buttons */}
          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-black text-black tracking-tight">How is it landing?</p>
                <p className="text-xs text-black/40 mt-0.5">Tap to react — change it any time</p>
              </div>
              {currentLevelData && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0"
                  style={{ backgroundColor: currentLevelData.color + '18', borderColor: currentLevelData.color + '50' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentLevelData.color }} />
                  <span className="text-xs font-black" style={{ color: currentLevelData.color }}>{currentLevelData.label}</span>
                </div>
              )}
            </div>

            {/* Hint — shown until first tap */}
            {engagementLevel === null && (
              <div className="flex items-center gap-2 mb-3 px-0.5">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-purple-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s`, animationDuration: "0.8s" }} />
                  ))}
                </div>
                <p className="text-[11px] font-bold text-purple-600">Tap a level below while listening — your curve draws as you react</p>
              </div>
            )}

            {/* Level buttons */}
            <div className="grid grid-cols-5 gap-2">
              {LEVELS.map(l => {
                const selected = engagementLevel === l.value;
                return (
                  <button key={l.value} type="button" onClick={() => setLevel(l.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 font-black text-xs transition-all duration-100 select-none",
                      selected
                        ? cn(l.activeBg, l.activeBorder, l.activeText)
                        : "border-black/8 bg-black/[0.02] text-black/35 hover:border-black/20 hover:bg-black/5 hover:text-black/60"
                    )}>
                    <span className="text-base leading-none">{l.value}</span>
                    <span className="text-[10px] leading-none font-bold">{l.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Reaction trail */}
            <div className="mt-4">
              {engagementCurve.length > 1 ? (
                <>
                  <div className="flex gap-px overflow-hidden rounded-full" style={{ height: 4 }}>
                    {(() => {
                      const step = Math.max(1, Math.floor(engagementCurve.length / 100));
                      return engagementCurve.filter((_, i) => i % step === 0).map((point, i) => (
                        <div key={i} className="flex-1 opacity-75"
                          style={{ backgroundColor: LEVELS.find(lv => lv.value === point.level)?.color ?? '#9333ea' }} />
                      ));
                    })()}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-black/25 font-medium">Start</span>
                    <span className="text-[10px] text-black/25 font-medium">Now</span>
                  </div>
                </>
              ) : (
                <div className="rounded-full bg-black/6" style={{ height: 4 }} />
              )}
            </div>

            {/* Skip point + listen timer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/6">
              {skipPoint === null ? (
                <button type="button" onClick={() => setSkipPoint(playerSeconds)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-black/25 hover:text-red-500 transition-colors">
                  <SkipForward className="h-3.5 w-3.5" />
                  I&apos;d skip here — {formatTimestamp(playerSeconds)}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <SkipForward className="h-3.5 w-3.5" />
                    Would skip at {formatTimestamp(skipPoint)}
                  </span>
                  <button type="button" onClick={() => setSkipPoint(null)}
                    className="text-[11px] text-black/25 hover:text-black/50 underline">clear</button>
                </div>
              )}
              <span className="text-xs font-mono text-black/30 shrink-0">{formatTimestamp(Math.floor(listenTime))} listened</span>
            </div>
          </div>

          {/* Progress / continue */}
          <div className="bg-white rounded-2xl border border-black/8 p-5">
            {!canSubmit ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-black/30" />
                    <p className="text-sm font-bold text-black/50">Listen for at least 3 minutes to continue</p>
                  </div>
                  <span className="text-sm font-black text-black/40 tabular-nums">{formatTimestamp(Math.floor(listenTime))} / 3:00</span>
                </div>
                <div className="h-2 bg-black/6 w-full rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${listenPct}%` }} />
                </div>
                <p className="text-xs text-black/30 mt-2 font-medium">{listenPct}% — keep listening</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-black tracking-tight">
                    {engagementCurve.length > 0 ? "Reaction captured" : "Ready to continue"}
                  </p>
                  <p className="text-sm text-black/40 mt-0.5">Head to step 2 — about 2 minutes</p>
                </div>
                <button type="button"
                  onClick={() => { setPhase(2); setTimeout(() => window.scrollTo({ top: 0 }), 50); }}
                  className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#0d0d0d] text-white font-black rounded-xl hover:bg-black transition-colors text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {Dialogs}
      </div>
    );
  }

  // =========================================================================
  // PHASE 2 — Your Feedback (reordered)
  // =========================================================================

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24">
      {StickyBar}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-3">

        {/* Track recap + curve */}
        <div className="bg-white rounded-2xl border border-black/8 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-black/8">
              {review.Track.artworkUrl
                ? <img src={review.Track.artworkUrl} alt={review.Track.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-black/5 flex items-center justify-center"><Music className="h-4 w-4 text-black/20" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-black truncate tracking-tight">{review.Track.title}</p>
              <p className="text-[11px] text-black/35">{review.Track.Genre.map(g => g.name).join(", ")}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/30">Listened</p>
              <p className="text-sm font-black text-black">{formatTimestamp(Math.floor(listenTime))}</p>
            </div>
          </div>

          {engagementCurve.length >= 2 && (
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-2">Your reaction curve</p>
              <EngagementChart curve={engagementCurve} duration={audioDuration} skipPoint={skipPoint} mini />
              {skipPoint !== null && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1.5">
                  <SkipForward className="h-3 w-3" /> Would have skipped at {formatTimestamp(skipPoint)}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/25 px-1 pt-2">About 2 minutes to finish</p>

        {/* ── 1. Quality verdict — FIRST ─────────────────────────────────── */}
        <div ref={qualityRef}>
          <div className={cn("bg-white rounded-2xl border overflow-hidden", errors.qualityLevel ? "border-red-300" : "border-black/8")}>
            <div className="px-5 pt-5 pb-4 border-b border-black/6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">Quality Verdict</p>
              <p className="text-sm font-bold text-black mt-1">Where is this track overall?</p>
              <FieldError message={errors.qualityLevel} />
            </div>
            <div className="divide-y divide-black/5">
              {[
                { id: "PROFESSIONAL",  label: "Professional",   desc: "Ready for commercial release today", dot: "bg-purple-500" },
                { id: "RELEASE_READY", label: "Release ready",  desc: "Good to go with minor tweaks",       dot: "bg-emerald-500" },
                { id: "ALMOST_THERE",  label: "Almost there",   desc: "On the right track, needs some work",dot: "bg-amber-400" },
                { id: "DEMO_STAGE",    label: "Demo stage",     desc: "Good ideas, not quite there yet",    dot: "bg-orange-400" },
                { id: "NOT_READY",     label: "Needs work",     desc: "Needs significant rethinking",       dot: "bg-red-400" },
              ].map(opt => (
                <button key={opt.id} type="button" onClick={() => {
                  setQualityLevel(opt.id);
                  setErrors(p => { const n = { ...p }; delete n.qualityLevel; return n; });
                }}
                  className={cn(
                    "w-full text-left px-5 py-4 flex items-center gap-4 transition-colors",
                    qualityLevel === opt.id ? "bg-black/[0.03]" : "hover:bg-black/[0.02]"
                  )}>
                  <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 transition-all", opt.dot, qualityLevel === opt.id ? "scale-125" : "opacity-40")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-black tracking-tight", qualityLevel === opt.id ? "text-black" : "text-black/60")}>{opt.label}</p>
                    <p className="text-xs text-black/35 mt-0.5">{opt.desc}</p>
                  </div>
                  {qualityLevel === opt.id && <Check className="h-4 w-4 text-black/50 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. Quick Take — First impression + Replay merged ───────────── */}
        <div ref={quickTakeRef}>
          <div className={cn("bg-white rounded-2xl border overflow-hidden", (errors.firstImpression || errors.wouldListenAgain) ? "border-red-300" : "border-black/8")}>
            <div className="px-5 pt-5 pb-4 border-b border-black/6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">Quick Take</p>
              <p className="text-sm font-bold text-black mt-1">How did it land?</p>
            </div>

            {/* First impression */}
            <div className="px-5 pt-4 pb-5 border-b border-black/6">
              <p className="text-xs font-bold text-black/50 mb-3">Opening 30 seconds</p>
              <FieldError message={errors.firstImpression} />
              <div className="grid grid-cols-5 gap-2 mt-2">
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
                        setErrors(p => { const n = { ...p }; delete n.firstImpression; return n; });
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-100",
                        selected ? firstImpressionColor(score) : "border-black/8 bg-white text-black/35 hover:border-black/20 hover:text-black/60"
                      )}>
                      <span className="text-base font-black leading-none">{score}</span>
                      <span className="text-[10px] font-bold leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
              {firstImpressionTouched && (
                <p className={cn("mt-3 text-xs font-semibold px-3 py-2 rounded-lg border", firstImpressionColor(firstImpressionScore))}>
                  {firstImpressionLabel(firstImpressionScore)}
                </p>
              )}
            </div>

            {/* Would listen again */}
            <div className="px-5 pt-4 pb-5">
              <p className="text-xs font-bold text-black/50 mb-3">Would you come back and listen again?</p>
              <FieldError message={errors.wouldListenAgain} />
              <div className="flex gap-2 mt-2">
                {[{ val: true, label: "Yes, I'd replay it" }, { val: false, label: "Once was enough" }].map(({ val, label }) => (
                  <button key={String(val)} type="button"
                    onClick={() => { setWouldListenAgain(val); setErrors(p => { const n = { ...p }; delete n.wouldListenAgain; return n; }); }}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all duration-100",
                      wouldListenAgain === val
                        ? val ? "border-purple-400 bg-purple-50 text-purple-900" : "border-black/20 bg-black/5 text-black/70"
                        : "border-black/8 bg-white text-black/50 hover:border-black/20"
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. What worked? (Best moment) ──────────────────────────────── */}
        <div ref={bestPartRef}>
          <div className={cn("bg-white rounded-2xl border overflow-hidden", errors.bestPart ? "border-red-300" : "border-black/8")}>
            <div className="px-5 pt-5 pb-4 border-b border-black/6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">What worked?</p>
              <p className="text-sm font-bold text-black mt-1">{formConfig.bestMomentPrompt}</p>
              <FieldError message={errors.bestPart} />
            </div>
            <div className="px-5 pt-4 pb-5">
              <textarea
                value={bestPart}
                onChange={e => { setBestPart(e.target.value); if (errors.bestPart) setErrors(p => { const n = { ...p }; delete n.bestPart; return n; }); }}
                rows={4}
                placeholder="E.g. 'The hook in the chorus hits really well — that melody is genuinely catchy and sits perfectly in the mix.'"
                className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-purple-400 placeholder:text-black/20 transition-colors bg-white"
              />
              <WordCount current={bestPartWords} min={formConfig.bestMomentMinWords} />
            </div>
          </div>
        </div>

        {/* ── 4. What's holding it back? (Main feedback) ─────────────────── */}
        <div ref={mainFeedbackRef}>
          <div className={cn("bg-white rounded-2xl border overflow-hidden", errors.mainFeedback ? "border-red-300" : "border-black/8")}>
            <div className="px-5 pt-5 pb-4 border-b border-black/6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">What&apos;s holding it back?</p>
              <p className="text-sm font-bold text-black mt-1">Mention a moment, a section, or something you&apos;d change.</p>
              <FieldError message={errors.mainFeedback} />
            </div>
            <div className="px-5 pt-4 pb-5">
              <textarea
                value={biggestWeaknessSpecific}
                onChange={e => { setBiggestWeaknessSpecific(e.target.value); if (errors.mainFeedback) setErrors(p => { const n = { ...p }; delete n.mainFeedback; return n; }); }}
                rows={5}
                placeholder="E.g. 'The energy drops hard around the middle section and I found myself zoning out. The intro pulls you in well but then it kind of plateaus — maybe the bridge needs something new to bring it back.'"
                className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-purple-400 placeholder:text-black/20 transition-colors bg-white"
              />
              <WordCount current={mainFeedbackWords} min={formConfig.mainFeedbackMinWords} />
            </div>
          </div>
        </div>

        {/* ── 5. Technical issues (conditional) ─────────────────────────── */}
        {formConfig.showTechnicalIssues && (
          <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-black/6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">Technical Issues</p>
              <p className="text-sm font-bold text-black mt-1">Flag anything — or leave blank if it sounded clean.</p>
            </div>
            <div className="px-5 pt-4 pb-5">
              <div className="flex flex-wrap gap-2">
                <button type="button"
                  onClick={() => { setTechnicalIssues([]); setIsInstrumental(false); }}
                  className={cn("px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all",
                    technicalIssues.length === 0 && !isInstrumental
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : "border-black/8 bg-white text-black/50 hover:border-black/20")}>
                  ✓ All good
                </button>
                <button type="button"
                  onClick={() => { setIsInstrumental(p => !p); setTechnicalIssues(p => p.filter(i => i !== "vocals-buried")); }}
                  className={cn("px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all",
                    isInstrumental ? "border-blue-400 bg-blue-50 text-blue-800" : "border-black/8 bg-white text-black/50 hover:border-black/20")}>
                  Instrumental
                </button>
                {formConfig.technicalIssueOptions
                  .filter(issue => !(isInstrumental && issue.id === "vocals-buried"))
                  .map(issue => (
                    <button key={issue.id} type="button"
                      onClick={() => setTechnicalIssues(p => p.includes(issue.id) ? p.filter(i => i !== issue.id) : [...p, issue.id])}
                      className={cn("px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all",
                        technicalIssues.includes(issue.id)
                          ? "border-amber-400 bg-amber-50 text-amber-800"
                          : "border-black/8 bg-white text-black/50 hover:border-black/20")}>
                      {issue.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Next focus (optional) ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-black/6">
            <div className="flex items-baseline gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">Next Focus</p>
              <span className="text-[10px] font-medium text-black/25">optional</span>
            </div>
            <p className="text-sm font-bold text-black mt-1">The one area that would move this track forward most.</p>
          </div>
          <div className="px-5 pt-4 pb-5">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "MIXING", label: "Mixing" }, { id: "ARRANGEMENT", label: "Arrangement" },
                { id: "SOUND_DESIGN", label: "Sound design" }, { id: "SONGWRITING", label: "Songwriting" },
                { id: "PERFORMANCE", label: "Performance" }, { id: "READY_TO_RELEASE", label: "Ready to release" },
              ].map(opt => (
                <button key={opt.id} type="button"
                  onClick={() => setNextFocus(p => p === opt.id ? null : opt.id)}
                  className={cn("px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all",
                    nextFocus === opt.id
                      ? "border-black bg-black text-white"
                      : "border-black/8 bg-white text-black/55 hover:border-black/20")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 7. Honest friend (optional) ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-black/6">
            <div className="flex items-baseline gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/35">The Honest Friend</p>
              <span className="text-[10px] font-medium text-black/25">optional</span>
            </div>
            <p className="text-sm font-bold text-black mt-1">If this was your close friend — what&apos;s the one thing you&apos;d tell them?</p>
          </div>
          <div className="px-5 pt-4 pb-5">
            <textarea
              value={honestFriend}
              onChange={e => setHonestFriend(e.target.value)}
              rows={3}
              placeholder="No structure — just say it."
              className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-purple-400 placeholder:text-black/20 transition-colors bg-white"
            />
          </div>
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 pt-5 pb-5">
            {/* Checklist */}
            <div className="flex items-center gap-5 mb-5 text-xs">
              <div className={cn("flex items-center gap-1.5 font-bold", canSubmit ? "text-emerald-600" : "text-black/25")}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]",
                  canSubmit ? "bg-emerald-500 text-white" : "bg-black/8 text-black/30")}>
                  {canSubmit ? "✓" : "○"}
                </span>
                Listened 3 min
              </div>
              <div className={cn("flex items-center gap-1.5 font-bold", qualityLevel ? "text-emerald-600" : "text-black/25")}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]",
                  qualityLevel ? "bg-emerald-500 text-white" : "bg-black/8 text-black/30")}>
                  {qualityLevel ? "✓" : "○"}
                </span>
                Verdict given
              </div>
              <div className={cn("flex items-center gap-1.5 font-bold", meetsText ? "text-emerald-600" : "text-black/25")}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]",
                  meetsText ? "bg-emerald-500 text-white" : "bg-black/8 text-black/30")}>
                  {meetsText ? "✓" : "○"}
                </span>
                Feedback written
              </div>
            </div>

            {/* Earnings */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-4xl font-black leading-none text-black tracking-tighter">
                {review.ReviewerProfile ? formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier)) : "1 credit"}
              </span>
              <span className="text-sm text-black/35 font-medium">you&apos;ll earn</span>
            </div>

            {/* Errors summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 font-medium">
                {Object.values(errors).filter(Boolean).join(" · ")}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 font-medium">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit || !meetsText || (!!review?.linkedReviewId && !abTestPreference)}
              className={cn(
                "w-full h-13 py-3.5 font-black text-sm rounded-xl transition-all border-2",
                canSubmit && meetsText && !isSubmitting
                  ? "bg-[#0d0d0d] text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  : "bg-black/5 text-black/25 border-black/8 cursor-not-allowed"
              )}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</span>
              ) : canSubmit && meetsText ? (
                `Submit & earn ${review.ReviewerProfile ? formatCurrency(getTierEarningsCents(review.ReviewerProfile.tier)) : "1 credit"}`
              ) : (
                "Complete the fields above"
              )}
            </button>
          </div>
        </div>

      </div>
      {Dialogs}
    </div>
  );
}
