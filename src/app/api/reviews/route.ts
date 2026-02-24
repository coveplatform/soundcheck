import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateReviewerTier, getTierRateCents, updateReviewerAverageRating, isPeerReviewerPro, TIER_RATES } from "@/lib/queue";
import { sendReviewProgressEmail, sendListenerIntentEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { scoreReviewTextQuality, computeBehavioralAlignment } from "@/lib/feedback-intelligence";

const MIN_LISTEN_SECONDS = 180;

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  // Prisma: P2002 = Unique constraint failed
  return e["code"] === "P2002";
}

// Generate a short, URL-safe share ID (8 characters)
function generateShareId(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}
// Streamlined form word requirements
const MIN_WORDS_BEST_MOMENT = 15;
const MIN_WORDS_BIGGEST_ISSUE = 20;

function extractWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function hasSpecificSignals(text: string, words: string[]): boolean {
  // Timestamps like "1:30" or "at 2:15"
  if (/\b\d:\d{2}\b/.test(text)) return true;

  // Reasoning/explanation patterns (expanded)
  if (/(because|since|so that|for example|e\.g\.|which makes|that's why|due to|the reason|this is why)/i.test(text)) return true;

  // Suggestion/actionable patterns
  if (/(could|should|would|try|consider|maybe|perhaps|suggest|recommend|needs? to|have to)/i.test(text)) return true;

  // Comparative/evaluative language indicating specific feedback
  if (/(too (loud|quiet|much|little|long|short|fast|slow|busy|empty|muddy|harsh|bright|dark|repetitive))/i.test(text)) return true;
  if (/(more|less|enough|better|worse|stronger|weaker) (of|than)?/i.test(text)) return true;

  // Temporal/structural references
  if (/(at the (start|end|beginning|middle)|in the (intro|outro|verse|chorus|bridge|drop|breakdown|buildup)|during the|after the|before the|halfway|second half|first half)/i.test(text)) return true;

  const keywordSet = new Set([
    // Drums & percussion
    "kick", "snare", "hihat", "hat", "hats", "clap", "drums", "drum", "percussion", "cymbals", "toms", "rimshot", "shaker",
    // Bass & low end
    "bass", "sub", "808", "bassline", "lowend", "low-end",
    // Vocals & lyrics
    "vocal", "vocals", "voice", "singing", "singer", "rap", "rapping", "rapper", "lyrics", "lyric", "lyrical", "words", "flow", "delivery", "adlibs", "harmonies", "harmony",
    // Song structure
    "hook", "chorus", "verse", "drop", "bridge", "intro", "outro", "breakdown", "buildup", "build-up", "transition", "section", "part", "bar", "bars",
    // Production terms
    "mix", "mixing", "master", "mastering", "eq", "compress", "compression", "limiter", "reverb", "delay", "stereo", "mono", "pan", "panning", "automation", "arrangement", "structure", "tempo", "bpm",
    // Instruments & sounds
    "melody", "melodies", "beat", "instrumental", "guitar", "piano", "keys", "keyboard", "synth", "synths", "sample", "samples", "loop", "loops", "strings", "brass", "horns", "pad", "pads", "lead", "arp",
    // Sound qualities
    "loud", "quiet", "volume", "level", "levels", "tone", "sound", "sounds", "frequency", "muddy", "crisp", "clean", "distorted", "balanced", "heavy", "punchy", "tight", "full", "thin", "warm", "cold", "bright", "dark", "harsh", "smooth",
    // Feel & energy
    "energy", "vibe", "vibes", "mood", "feel", "feeling", "atmosphere", "catchy", "repetitive", "dynamic", "dynamics", "flat", "boring", "exciting", "groove", "bounce", "pocket", "swing",
    // Timing & rhythm
    "rhythm", "rhythmic", "timing", "offbeat", "onbeat", "quantized", "humanized",
    // General music terms
    "track", "song", "music", "production", "producer", "artist", "listener",
  ]);

  for (const w of words) {
    if (keywordSet.has(w)) return true;
  }

  return false;
}

function countActionLines(text: string): number {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length;
}

function validateReviewText(fieldLabel: string, text: string, minWords: number): string | null {
  const words = extractWords(text);

  if (words.length < minWords) {
    return `${fieldLabel} must be at least ${minWords} words`;
  }

  const unique = new Set(words);
  const uniqueRatio = unique.size / words.length;

  if (unique.size < 8 || uniqueRatio < 0.3) {
    return `${fieldLabel} seems too repetitive. Please be more specific.`;
  }

  if (!hasSpecificSignals(text, words)) {
    return `${fieldLabel} needs more specific, actionable details (e.g. mention an element like vocals/kick, a section like the drop, or a timestamp).`;
  }

  return null;
}

const submitReviewSchema = z.object({
  reviewId: z.string(),
  firstImpression: z.enum(["STRONG_HOOK", "DECENT", "LOST_INTEREST"]),
  productionScore: z.number().min(1).max(5),
  vocalScore: z.number().min(1).max(5).optional().nullable(),
  originalityScore: z.number().min(1).max(5),
  wouldListenAgain: z.boolean(),
  wouldAddToPlaylist: z.boolean().optional().nullable(),
  wouldShare: z.boolean().optional().nullable(),
  wouldFollow: z.boolean().optional().nullable(),
  perceivedGenre: z.string().optional(),
  similarArtists: z.string().optional(),
  bestPart: z.string().min(1, "Please describe the best part"),
  bestPartTimestamp: z.number().optional().nullable(),
  weakestPart: z.string().min(1, "Please describe the weakest part"),
  weakestTimestamp: z.number().optional().nullable(),
  additionalNotes: z.string().optional(),
  addressedArtistNote: z.enum(["YES", "PARTIALLY", "NO"]).optional().nullable(),
  nextActions: z.string().optional(), // Optional - no longer required
  timestamps: z
    .array(
      z.object({
        seconds: z.number().int().min(0),
        note: z.string().min(1).max(240),
      })
    )
    .max(30)
    .optional(),

  // V2 enhanced feedback fields
  lowEndClarity: z.enum(["PERFECT", "KICK_TOO_LOUD", "BASS_TOO_LOUD", "BOTH_MUDDY", "BARELY_AUDIBLE"]).optional().nullable(),
  vocalClarity: z.enum(["CRYSTAL_CLEAR", "SLIGHTLY_BURIED", "BURIED", "TOO_LOUD", "NOT_APPLICABLE"]).optional().nullable(),
  highEndQuality: z.enum(["PERFECT", "TOO_DULL", "TOO_HARSH", "ACCEPTABLE"]).optional().nullable(),
  stereoWidth: z.enum(["TOO_NARROW", "GOOD_BALANCE", "TOO_WIDE"]).optional().nullable(),
  dynamics: z.enum(["GREAT_DYNAMICS", "ACCEPTABLE", "TOO_COMPRESSED", "TOO_QUIET"]).optional().nullable(),
  energyCurve: z.enum(["BUILDS_PERFECTLY", "STAYS_FLAT", "BUILDS_NO_PAYOFF", "ALL_OVER_PLACE"]).optional().nullable(),
  tooRepetitive: z.boolean().optional().nullable(),
  repetitiveNote: z.string().optional().nullable(),
  lostInterestAt: z.number().optional().nullable(),
  lostInterestReason: z.string().optional().nullable(),
  trackLength: z.enum(["TOO_SHORT", "PERFECT", "BIT_LONG", "WAY_TOO_LONG"]).optional().nullable(),
  emotionalImpact: z.array(z.string()).optional().nullable(),
  memorableMoment: z.string().optional().nullable(),
  playlistAction: z.enum(["ADD_TO_LIBRARY", "LET_PLAY", "SKIP", "DISLIKE"]).optional().nullable(),
  biggestWeaknessSpecific: z.string().optional().nullable(),
  quickWin: z.string().optional().nullable(),
  targetAudience: z.array(z.string()).optional().nullable(),
  nextFocus: z.enum(["MIXING", "ARRANGEMENT", "SOUND_DESIGN", "SONGWRITING", "PERFORMANCE", "READY_TO_RELEASE"]).optional().nullable(),
  expectedPlacement: z.enum(["EDITORIAL", "SOUNDCLOUD_TRENDING", "CLUB", "COFFEE_SHOP", "VIDEO_GAME", "AD", "NOWHERE"]).optional().nullable(),
  qualityLevel: z.enum(["NOT_READY", "DEMO_STAGE", "ALMOST_THERE", "RELEASE_READY", "PROFESSIONAL"]).optional().nullable(),

  // Release Decision fields
  releaseVerdict: z.enum(["RELEASE_NOW", "FIX_FIRST", "NEEDS_WORK"]).optional().nullable(),
  releaseReadinessScore: z.number().min(0).max(100).optional().nullable(),
  topFixRank1: z.string().optional().nullable(),
  topFixRank1Impact: z.enum(["HIGH", "MEDIUM", "LOW"]).optional().nullable(),
  topFixRank1TimeMin: z.number().optional().nullable(),
  topFixRank2: z.string().optional().nullable(),
  topFixRank2Impact: z.enum(["HIGH", "MEDIUM", "LOW"]).optional().nullable(),
  topFixRank2TimeMin: z.number().optional().nullable(),
  topFixRank3: z.string().optional().nullable(),
  topFixRank3Impact: z.enum(["HIGH", "MEDIUM", "LOW"]).optional().nullable(),
  topFixRank3TimeMin: z.number().optional().nullable(),
  strongestElement: z.string().optional().nullable(),
  biggestRisk: z.string().optional().nullable(),
  competitiveBenchmark: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support both legacy reviewer profiles AND peer reviewers (artist profiles)
    const reviewerProfile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true, tier: true },
    });

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, completedOnboarding: true },
    });

    // Determine if user is a peer ReviewerProfile:
    // - Must have artist profile
    // - If they ALSO have reviewer profile, they can be either (check review type later)
    if (!reviewerProfile && !artistProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (reviewerProfile?.isRestricted) {
      return NextResponse.json(
        { error: "Reviewer account restricted" },
        { status: 403 }
      );
    }

    if (reviewerProfile && (!reviewerProfile.completedOnboarding || !reviewerProfile.onboardingQuizPassed)) {
      // Legacy reviewer hasn't completed old onboarding
      if (!artistProfile?.completedOnboarding) {
        return NextResponse.json(
          { error: "Please complete onboarding before submitting reviews" },
          { status: 403 }
        );
      }
    }

    // If user only has artist profile (peer reviewer), check they completed onboarding
    if (!reviewerProfile && artistProfile && !artistProfile.completedOnboarding) {
      return NextResponse.json(
        { error: "Please complete onboarding before submitting reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = submitReviewSchema.parse(body);

    // Get the review and verify ownership (handle both peer and legacy reviews)
    const review = await prisma.review.findUnique({
      where: { id: data.reviewId },
      include: {
        ReviewerProfile: true,
        ArtistProfile: { include: { User: true } },
        Track: {
          include: {
            ArtistProfile: { include: { User: true } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify ownership - check if this is a peer review or legacy review
    const isPeerReview = review.isPeerReview || !!review.peerReviewerArtistId;

    if (isPeerReview) {
      // Peer review - check if user owns the peer reviewer artist profile
      if (!review.ArtistProfile || review.ArtistProfile.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // Legacy review - check if user owns the reviewer profile
      if (!review.ReviewerProfile || review.ReviewerProfile.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (review.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Review already submitted" },
        { status: 400 }
      );
    }

    if (review.status !== "ASSIGNED" && review.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "This review is no longer active" },
        { status: 400 }
      );
    }

    // Per-user listen timer bypass
    const SKIP_LISTEN_TIMER_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
    const skipListenTimer = SKIP_LISTEN_TIMER_EMAILS.includes(
      (session.user.email ?? "").toLowerCase()
    );

    if (!skipListenTimer && review.listenDuration < MIN_LISTEN_SECONDS) {
      return NextResponse.json(
        { error: `Must listen for at least ${MIN_LISTEN_SECONDS} seconds` },
        { status: 400 }
      );
    }

    if (
      !skipListenTimer &&
      (!review.lastHeartbeat ||
        Date.now() - review.lastHeartbeat.getTime() > 10 * 60 * 1000)
    ) {
      return NextResponse.json(
        { error: "Listen session expired. Please keep listening and try again." },
        { status: 400 }
      );
    }

    const bestPartError = validateReviewText("Best moment", data.bestPart, MIN_WORDS_BEST_MOMENT);
    if (bestPartError) {
      return NextResponse.json({ error: bestPartError }, { status: 400 });
    }

    const weakestPartError = validateReviewText("Biggest issue", data.weakestPart, MIN_WORDS_BIGGEST_ISSUE);
    if (weakestPartError) {
      return NextResponse.json({ error: weakestPartError }, { status: 400 });
    }

    // Validate Main Feedback (biggestWeaknessSpecific) if present
    if (data.biggestWeaknessSpecific) {
      const mainFeedbackError = validateReviewText("Main feedback", data.biggestWeaknessSpecific, MIN_WORDS_BIGGEST_ISSUE);
      if (mainFeedbackError) {
        return NextResponse.json({ error: mainFeedbackError }, { status: 400 });
      }
    }

    // Fetch peer reviewer stats for tier check and daily cap
    const peerReviewerProfile = isPeerReview && review.peerReviewerArtistId
      ? await prisma.artistProfile.findUnique({
          where: { id: review.peerReviewerArtistId },
          select: { subscriptionStatus: true, totalPeerReviews: true, peerReviewRating: true },
        })
      : null;

    // Calculate earnings: PRO-tier peer reviewers earn $1.50 cash, legacy reviewers use their tier rate
    const peerIsProTier = peerReviewerProfile
      ? isPeerReviewerPro(peerReviewerProfile.totalPeerReviews, peerReviewerProfile.peerReviewRating)
      : false;
    const earnings = isPeerReview
      ? (peerIsProTier ? TIER_RATES.PRO : 0)
      : getTierRateCents(reviewerProfile!.tier);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const heartbeatCutoff = new Date(now.getTime() - 10 * 60 * 1000);

    // Daily review cap: 2/day for all users (bypass for admin emails only)
    const BYPASS_LIMIT_EMAILS = ["kris.engelhardt4@gmail.com", "synthqueen@mixreflect.com", "davo2@mixreflect.com"];
    const bypassLimit = BYPASS_LIMIT_EMAILS.includes((session.user.email ?? "").toLowerCase());

    if (!bypassLimit) {
      const MAX_REVIEWS_PER_DAY = 2;
      const reviewsTodayCount = await prisma.review.count({
        where: {
          status: "COMPLETED",
          updatedAt: { gte: startOfToday },
          ...(isPeerReview && review.peerReviewerArtistId
            ? { peerReviewerArtistId: review.peerReviewerArtistId }
            : { reviewerId: review.reviewerId }),
        },
      });

      if (reviewsTodayCount >= MAX_REVIEWS_PER_DAY) {
        return NextResponse.json(
          { error: "You've reached the daily limit of 2 reviews. Check back tomorrow!" },
          { status: 429 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const updated = await tx.review.updateMany({
            where: {
              id: data.reviewId,
              ...(isPeerReview
                ? { peerReviewerArtistId: review.peerReviewerArtistId }
                : { reviewerId: review.reviewerId }),
              status: { in: ["ASSIGNED", "IN_PROGRESS"] },
              ...(skipListenTimer ? {} : { listenDuration: { gte: MIN_LISTEN_SECONDS } }),
              ...(skipListenTimer ? {} : { lastHeartbeat: { gte: heartbeatCutoff } }),
            },
            data: {
              status: "COMPLETED",
              reviewSchemaVersion: 1,
              countsTowardCompletion: true,
              countsTowardAnalytics: true,
              firstImpression: data.firstImpression,
              productionScore: data.productionScore,
              vocalScore: data.vocalScore,
              originalityScore: data.originalityScore,
              wouldListenAgain: data.wouldListenAgain,
              wouldAddToPlaylist: data.wouldAddToPlaylist,
              wouldShare: data.wouldShare,
              wouldFollow: data.wouldFollow,
              perceivedGenre: data.perceivedGenre,
              similarArtists: data.similarArtists,
              bestPart: data.bestPart,
              bestPartTimestamp: data.bestPartTimestamp,
              weakestPart: data.weakestPart,
              weakestTimestamp: data.weakestTimestamp,
              additionalNotes: data.additionalNotes,
              addressedArtistNote: data.addressedArtistNote,
              nextActions: data.nextActions,
              timestamps: data.timestamps,
              paidAmount: earnings,
              shareId: generateShareId(),

              // V2 enhanced feedback fields
              lowEndClarity: data.lowEndClarity,
              vocalClarity: data.vocalClarity,
              highEndQuality: data.highEndQuality,
              stereoWidth: data.stereoWidth,
              dynamics: data.dynamics,
              energyCurve: data.energyCurve,
              tooRepetitive: data.tooRepetitive,
              repetitiveNote: data.repetitiveNote,
              lostInterestAt: data.lostInterestAt,
              lostInterestReason: data.lostInterestReason,
              trackLength: data.trackLength,
              emotionalImpact: data.emotionalImpact ? JSON.stringify(data.emotionalImpact) : undefined,
              memorableMoment: data.memorableMoment,
              playlistAction: data.playlistAction,
              biggestWeaknessSpecific: data.biggestWeaknessSpecific,
              targetAudience: data.targetAudience ? JSON.stringify(data.targetAudience) : undefined,
              nextFocus: data.nextFocus,
              expectedPlacement: data.expectedPlacement,
              qualityLevel: data.qualityLevel,

              // Release Decision fields
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
            },
          });
          updatedCount = updated.count;
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          if (!isUniqueConstraintError(e)) {
            throw e;
          }
        }
      }

      if (lastError) {
        throw lastError;
      }

      if (updatedCount === 0) {
        const current = await tx.review.findUnique({
          where: { id: data.reviewId },
          select: { status: true, listenDuration: true, lastHeartbeat: true },
        });

        if (!current) {
          return { updated: false as const, reason: "NOT_FOUND" as const };
        }

        if (current.status === "COMPLETED") {
          return { updated: false as const, reason: "ALREADY_SUBMITTED" as const };
        }

        if (current.status !== "ASSIGNED" && current.status !== "IN_PROGRESS") {
          return { updated: false as const, reason: "NOT_ACTIVE" as const };
        }

        if (!skipListenTimer && (!current.lastHeartbeat || current.lastHeartbeat.getTime() < heartbeatCutoff.getTime())) {
          return { updated: false as const, reason: "HEARTBEAT_EXPIRED" as const };
        }

        if (!skipListenTimer && current.listenDuration < MIN_LISTEN_SECONDS) {
          return { updated: false as const, reason: "INSUFFICIENT_LISTEN" as const };
        }

        return { updated: false as const, reason: "UNKNOWN" as const };
      }

      // Update reviewer profile: peer reviewers get credits (+ cash if PRO tier), legacy reviewers get cash
      if (isPeerReview && artistProfile) {
        await tx.artistProfile.update({
          where: { id: artistProfile.id },
          data: {
            reviewCredits: { increment: 1 },
            totalCreditsEarned: { increment: 1 },
            totalPeerReviews: { increment: 1 },
            ...(earnings > 0 ? {
              pendingBalance: { increment: earnings },
              totalEarnings: { increment: earnings },
            } : {}),
          },
        });
      } else if (review.reviewerId && review.ReviewerProfile) {
        await tx.reviewerProfile.update({
          where: { id: review.reviewerId },
          data: {
            totalReviews: { increment: 1 },
            pendingBalance: { increment: earnings },
            totalEarnings: { increment: earnings },
            lastReviewDate: now,
            reviewsToday:
              review.ReviewerProfile.lastReviewDate &&
              review.ReviewerProfile.lastReviewDate >= startOfToday
                ? { increment: 1 }
                : 1,
          },
        });
      }

      // Persist timestamp notes in normalized form (best-effort)
      if (data.timestamps && data.timestamps.length > 0) {
        await tx.reviewTimestamp.createMany({
          data: data.timestamps.map((t) => ({
            reviewId: data.reviewId,
            seconds: t.seconds,
            note: t.note,
          })),
          skipDuplicates: false,
        });
      }

      const countedCompletedReviews = await tx.review.count({
        where: {
          trackId: review.trackId,
          status: "COMPLETED",
          countsTowardCompletion: true,
        },
      });

      const nextTrackStatus =
        countedCompletedReviews >= review.Track.reviewsRequested
          ? ("COMPLETED" as const)
          : ("IN_PROGRESS" as const);

      const updatedTrack = await tx.track.update({
        where: { id: review.trackId },
        data: {
          status: nextTrackStatus,
          ...(nextTrackStatus === "COMPLETED" && {
            completedAt: new Date(),
          }),
        },
        select: {
          title: true,
          reviewsRequested: true,
          ArtistProfile: { select: { User: { select: { email: true } } } },
        },
      });

      await tx.reviewQueue.deleteMany({
        where: {
          trackId: review.trackId,
          ...(isPeerReview
            ? { artistReviewerId: review.peerReviewerArtistId }
            : { reviewerId: review.reviewerId }),
        },
      });

      const updatedReview = await tx.review.findUnique({
        where: { id: data.reviewId },
      });

      return {
        updated: true as const,
        updatedReview,
        completedReviews: countedCompletedReviews,
        trackId: review.trackId,
        Track: {
          title: updatedTrack.title,
          reviewsRequested: updatedTrack.reviewsRequested,
          artistEmail: updatedTrack.ArtistProfile.User?.email ?? null,
        },
      };
    });

    if (!result.updated) {
      if (result.reason === "NOT_FOUND") {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }
      if (result.reason === "NOT_ACTIVE") {
        return NextResponse.json(
          { error: "This review is no longer active" },
          { status: 400 }
        );
      }
      if (result.reason === "HEARTBEAT_EXPIRED") {
        return NextResponse.json(
          { error: "Listen session expired. Please keep listening and try again." },
          { status: 400 }
        );
      }
      if (result.reason === "INSUFFICIENT_LISTEN") {
        return NextResponse.json(
          { error: `Must listen for at least ${MIN_LISTEN_SECONDS} seconds` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Review already submitted" },
        { status: 400 }
      );
    }

    await updateReviewerTier(review.reviewerId);

    // ── Feedback Intelligence Engine: post-submission scoring ──
    try {
      const submittedReview = result.updatedReview;
      if (submittedReview) {
        // Text quality scoring
        const textResult = scoreReviewTextQuality({
          bestPart: submittedReview.bestPart ?? "",
          weakestPart: submittedReview.weakestPart ?? "",
          biggestWeaknessSpecific: submittedReview.biggestWeaknessSpecific ?? "",
        });

        // Behavioral alignment — fetch stored ListenBehavior
        let alignmentScore: number | null = null;
        const listenBehavior = await prisma.listenBehavior.findUnique({
          where: { reviewId: submittedReview.id },
        });
        if (listenBehavior) {
          const metrics = {
            completionRate: listenBehavior.completionRate,
            attentionScore: listenBehavior.attentionScore,
            firstSkipAt: listenBehavior.firstSkipAt,
            replayZones: (listenBehavior.replayZones ?? []) as any[],
            skipZones: (listenBehavior.skipZones ?? []) as any[],
            pausePoints: (listenBehavior.pausePoints ?? []) as any[],
            engagementCurve: (listenBehavior.engagementCurve ?? []) as number[],
            uniqueSecondsHeard: listenBehavior.uniqueSecondsHeard,
            totalEvents: listenBehavior.totalEvents,
          };
          const explicit = {
            firstImpression: submittedReview.firstImpression,
            wouldListenAgain: submittedReview.wouldListenAgain,
            bestPart: submittedReview.bestPart,
            qualityLevel: submittedReview.qualityLevel,
          };
          const alignment = computeBehavioralAlignment(metrics, explicit, listenBehavior.trackDuration ?? 0);
          alignmentScore = alignment.score;

          // Save alignment score back to ListenBehavior
          await prisma.listenBehavior.update({
            where: { reviewId: submittedReview.id },
            data: { behavioralAlignmentScore: alignmentScore },
          });
        }

        // Update Review with FIE scores
        await prisma.review.update({
          where: { id: submittedReview.id },
          data: {
            textQualityScore: textResult.compositeOverall,
            textSpecificity: textResult.compositeSpecificity,
            textActionability: textResult.compositeActionability,
            textTechnicalDepth: textResult.compositeTechnicalDepth,
            behavioralAlignment: alignmentScore,
          },
        });
      }
    } catch (fieError) {
      console.error("[FIE] Post-submission scoring failed (non-fatal):", fieError);
    }

    // Auto-trigger Release Decision report generation if all reviews are complete
    if (review.Track.packageType === "RELEASE_DECISION" && result.updatedReview) {
      // Count completed Release Decision reviews with verdict and score
      const completedReleaseDecisionReviews = await prisma.review.count({
        where: {
          trackId: review.trackId,
          status: "COMPLETED",
          releaseVerdict: { not: null },
          releaseReadinessScore: { not: null },
        },
      });

      // If we have 8+ reviews (threshold) and report hasn't been generated yet
      if (completedReleaseDecisionReviews >= 8 && !review.Track.releaseDecisionGeneratedAt) {
        console.log(`[Release Decision] ${completedReleaseDecisionReviews}/10 reviews complete for track ${review.trackId}. Triggering report generation...`);

        // Trigger report generation (fire-and-forget to avoid blocking review submission)
        const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracks/${review.trackId}/generate-release-decision-report`;
        fetch(reportUrl, { method: 'POST' })
          .then(() => console.log(`[Release Decision] Report generation triggered for track ${review.trackId}`))
          .catch(err => console.error(`[Release Decision] Failed to trigger report for track ${review.trackId}:`, err));
      }
    }

    const LISTENER_INTENT_THRESHOLD = 3;
    const milestoneHalf = Math.ceil(result.Track.reviewsRequested / 2);
    const milestoneFull = result.Track.reviewsRequested;
    const prevCompleted = result.completedReviews - 1;

    const crossedIntentThreshold = prevCompleted < LISTENER_INTENT_THRESHOLD && result.completedReviews >= LISTENER_INTENT_THRESHOLD;
    const crossedHalf = prevCompleted < milestoneHalf && result.completedReviews >= milestoneHalf;
    const crossedFull = prevCompleted < milestoneFull && result.completedReviews >= milestoneFull;

    // Listener intent email — fires exactly once when 3rd review comes in
    if (result.Track.artistEmail && crossedIntentThreshold) {
      try {
        const intentReviews = await prisma.review.findMany({
          where: { trackId: result.trackId, status: "COMPLETED", countsTowardAnalytics: true },
          select: { wouldAddToPlaylist: true, wouldShare: true, wouldFollow: true, wouldListenAgain: true },
        });
        const pct = (field: "wouldAddToPlaylist" | "wouldShare" | "wouldFollow" | "wouldListenAgain") => {
          const vals = intentReviews.filter((r) => r[field] !== null);
          if (vals.length === 0) return null;
          return Math.round((vals.filter((r) => r[field] === true).length / vals.length) * 100);
        };
        await sendListenerIntentEmail({
          artistEmail: result.Track.artistEmail,
          trackTitle: result.Track.title,
          trackId: result.trackId,
          reviewCount: result.completedReviews,
          playlistPct: pct("wouldAddToPlaylist"),
          sharePct: pct("wouldShare"),
          followPct: pct("wouldFollow"),
          listenAgainPct: pct("wouldListenAgain"),
        });
      } catch (err) {
        console.error("Failed to send listener intent email", err);
      }
    }

    if (
      result.Track.artistEmail &&
      (crossedHalf || crossedFull)
    ) {
      await sendReviewProgressEmail(
        result.Track.artistEmail,
        result.Track.title,
        result.completedReviews,
        result.Track.reviewsRequested
      );
    }

    revalidateTag("sidebar", { expire: 0 });
    return NextResponse.json({
      success: true,
      earnings,
      review: result.updatedReview,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
