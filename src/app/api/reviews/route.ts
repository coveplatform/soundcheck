import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateReviewerTier, getTierRateCents, updateReviewerAverageRating } from "@/lib/queue";
import { sendReviewProgressEmail } from "@/lib/email";
import { randomBytes } from "crypto";

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
const MIN_WORDS_PER_SECTION = 30;

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

function validateReviewText(fieldLabel: string, text: string): string | null {
  const words = extractWords(text);

  if (words.length < MIN_WORDS_PER_SECTION) {
    return `${fieldLabel} must be at least ${MIN_WORDS_PER_SECTION} words`;
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
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support both legacy reviewer profiles AND peer reviewers (artist profiles)
    const reviewerProfile = await prisma.listenerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isRestricted: true, completedOnboarding: true, onboardingQuizPassed: true, tier: true },
    });

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, completedOnboarding: true },
    });

    // Determine if user is a peer reviewer:
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
        reviewer: true,
        peerReviewerArtist: { include: { user: true } },
        track: {
          include: {
            artist: { include: { user: true } },
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
      if (!review.peerReviewerArtist || review.peerReviewerArtist.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // Legacy review - check if user owns the reviewer profile
      if (!review.reviewer || review.reviewer.userId !== session.user.id) {
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

    if (review.listenDuration < MIN_LISTEN_SECONDS) {
      return NextResponse.json(
        { error: `Must listen for at least ${MIN_LISTEN_SECONDS} seconds` },
        { status: 400 }
      );
    }

    if (
      !review.lastHeartbeat ||
      Date.now() - review.lastHeartbeat.getTime() > 2 * 60 * 1000
    ) {
      return NextResponse.json(
        { error: "Listen session expired. Please keep listening and try again." },
        { status: 400 }
      );
    }

    const bestPartError = validateReviewText("Best part", data.bestPart);
    if (bestPartError) {
      return NextResponse.json({ error: bestPartError }, { status: 400 });
    }

    const weakestPartError = validateReviewText("Weakest part", data.weakestPart);
    if (weakestPartError) {
      return NextResponse.json({ error: weakestPartError }, { status: 400 });
    }

    // Calculate earnings: peer reviewers earn credits (0 cash), legacy reviewers earn cash
    const earnings = isPeerReview ? 0 : getTierRateCents(reviewerProfile!.tier);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const heartbeatCutoff = new Date(now.getTime() - 2 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const updated = await tx.review.updateMany({
            where: {
              id: data.reviewId,
              reviewerId: review.reviewerId,
              status: { in: ["ASSIGNED", "IN_PROGRESS"] },
              listenDuration: { gte: MIN_LISTEN_SECONDS },
              lastHeartbeat: { gte: heartbeatCutoff },
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

        if (!current.lastHeartbeat || current.lastHeartbeat.getTime() < heartbeatCutoff.getTime()) {
          return { updated: false as const, reason: "HEARTBEAT_EXPIRED" as const };
        }

        if (current.listenDuration < MIN_LISTEN_SECONDS) {
          return { updated: false as const, reason: "INSUFFICIENT_LISTEN" as const };
        }

        return { updated: false as const, reason: "UNKNOWN" as const };
      }

      // Update reviewer profile: legacy reviewers get cash, peer reviewers get credits
      if (isPeerReview && artistProfile) {
        await tx.artistProfile.update({
          where: { id: artistProfile.id },
          data: {
            reviewCredits: { increment: 1 },
            totalCreditsEarned: { increment: 1 },
            totalPeerReviews: { increment: 1 },
          },
        });
      } else {
        await tx.listenerProfile.update({
          where: { id: review.reviewerId },
          data: {
            totalReviews: { increment: 1 },
            pendingBalance: { increment: earnings },
            totalEarnings: { increment: earnings },
            lastReviewDate: now,
            reviewsToday:
              review.reviewer.lastReviewDate &&
              review.reviewer.lastReviewDate >= startOfToday
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
        countedCompletedReviews >= review.track.reviewsRequested
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
          artist: { select: { user: { select: { email: true } } } },
        },
      });

      await tx.reviewQueue.deleteMany({
        where: {
          trackId: review.trackId,
          reviewerId: review.reviewerId,
        },
      });

      const updatedReview = await tx.review.findUnique({
        where: { id: data.reviewId },
      });

      return {
        updated: true as const,
        updatedReview,
        completedReviews: countedCompletedReviews,
        track: {
          title: updatedTrack.title,
          reviewsRequested: updatedTrack.reviewsRequested,
          artistEmail: updatedTrack.artist.user?.email ?? null,
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

    const milestoneHalf = Math.ceil(result.track.reviewsRequested / 2);
    const milestoneFull = result.track.reviewsRequested;

    if (
      result.track.artistEmail &&
      (result.completedReviews === milestoneHalf ||
        result.completedReviews === milestoneFull)
    ) {
      await sendReviewProgressEmail(
        result.track.artistEmail,
        result.track.title,
        result.completedReviews,
        result.track.reviewsRequested
      );
    }

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
