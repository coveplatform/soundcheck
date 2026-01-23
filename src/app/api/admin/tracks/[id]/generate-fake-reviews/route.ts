import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const generateReviewSchema = z.object({
  count: z.number().int().min(1).max(20),
});

// Template data for generating realistic fake reviews
const FAKE_REVIEWERS = [
  "demo.reviewer1@soundcheck.com",
  "demo.reviewer2@soundcheck.com",
  "demo.reviewer3@soundcheck.com",
  "demo.reviewer4@soundcheck.com",
  "demo.reviewer5@soundcheck.com",
];

const FIRST_IMPRESSIONS = ["CAPTIVATING", "PROMISING", "INTERESTING", "SOLID", "UNIQUE"] as const;
const GENRES = ["Electronic", "Hip Hop", "Rock", "Pop", "R&B", "Indie", "House", "Techno"];
const SIMILAR_ARTISTS = [
  "Flume, ODESZA",
  "Tame Impala, Mac DeMarco",
  "Travis Scott, Drake",
  "The Weeknd, Frank Ocean",
  "Disclosure, Kaytranada",
];

const BEST_PARTS = [
  "The drop is incredibly well-produced",
  "Love the vocal processing here",
  "The melody is super catchy",
  "Great energy and progression",
  "The atmosphere you created is amazing",
];

const WEAKEST_PARTS = [
  "The intro could be a bit shorter",
  "Mix feels slightly muddy in the low end",
  "Vocal sits a bit low in the mix",
  "Could use more variation in the arrangement",
  "The outro feels a bit abrupt",
];

const ADDITIONAL_NOTES = [
  "Overall really enjoyed this track! Keep up the great work.",
  "Can't wait to hear more from you. This is solid.",
  "Really vibing with your style. Looking forward to your next release.",
  "This has serious potential. Keep refining your sound.",
  "Great work! Would love to hear this on a bigger sound system.",
];

const NEXT_ACTIONS = [
  "Consider refining the mix",
  "Keep developing this sound",
  "Focus on the arrangement flow",
  "Polish the production details",
  "Get feedback from other producers",
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFakeReview(trackDuration: number) {
  return {
    firstImpression: getRandomElement(FIRST_IMPRESSIONS),
    productionScore: getRandomInt(3, 5),
    vocalScore: getRandomInt(3, 5),
    originalityScore: getRandomInt(3, 5),
    wouldListenAgain: Math.random() > 0.3,
    wouldAddToPlaylist: Math.random() > 0.4,
    wouldShare: Math.random() > 0.5,
    wouldFollow: Math.random() > 0.4,
    perceivedGenre: getRandomElement(GENRES),
    similarArtists: getRandomElement(SIMILAR_ARTISTS),
    bestPart: getRandomElement(BEST_PARTS),
    bestPartTimestamp: getRandomInt(20, Math.max(30, trackDuration - 30)),
    weakestPart: getRandomElement(WEAKEST_PARTS),
    weakestTimestamp: getRandomInt(10, Math.max(20, trackDuration - 20)),
    additionalNotes: getRandomElement(ADDITIONAL_NOTES),
    nextActions: getRandomElement(NEXT_ACTIONS),
    listenDuration: Math.max(60, trackDuration - getRandomInt(0, 30)),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Admin check
    if (!session?.user?.email || !session.user.email.includes("@")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { count } = generateReviewSchema.parse(body);

    // Get track info
    const track = await prisma.track.findUnique({
      where: { id },
      select: {
        id: true,
        duration: true,
        reviewsRequested: true,
        reviewsCompleted: true,
        status: true,
        reviews: { select: { id: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const trackDuration = track.duration || 180; // Default 3 minutes if no duration

    // Get or create demo reviewers
    const reviewerEmails = FAKE_REVIEWERS.slice(0, count);
    const reviewers = [];

    for (const email of reviewerEmails) {
      let user = await prisma.user.findUnique({
        where: { email },
        include: { listenerProfile: true },
      });

      // Create demo user and listener profile if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            emailVerified: new Date(),
            isReviewer: true,
            listenerProfile: {
              create: {
                tier: "NORMAL",
              },
            },
          },
          include: { listenerProfile: true },
        });
      }

      if (user.listenerProfile) {
        reviewers.push(user.listenerProfile);
      }
    }

    if (reviewers.length === 0) {
      return NextResponse.json(
        { error: "Failed to create demo reviewers" },
        { status: 500 }
      );
    }

    // Generate fake reviews
    const createdReviews = [];
    for (let i = 0; i < count && i < reviewers.length; i++) {
      const reviewer = reviewers[i]!;
      const fakeData = generateFakeReview(trackDuration);

      const review = await prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewer.id,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: false, // Mark as fake for analytics
          ...fakeData,
        },
      });

      createdReviews.push(review);
    }

    // Update track completion count
    await prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: {
          increment: count,
        },
        // If all reviews are now completed, mark track as completed
        ...(track.reviewsCompleted + count >= track.reviewsRequested
          ? { status: "COMPLETED", completedAt: new Date() }
          : track.status === "PENDING_PAYMENT" || track.status === "UPLOADED"
          ? { status: "IN_PROGRESS" }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      count: createdReviews.length,
      message: `Generated ${createdReviews.length} fake reviews`,
    });
  } catch (error) {
    console.error("Generate fake reviews error:", error);
    return NextResponse.json(
      { error: "Failed to generate fake reviews" },
      { status: 500 }
    );
  }
}
