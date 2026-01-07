import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Sample review data for realistic previews
const sampleReviews = [
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Deep House",
    similarArtists: "Fred Again.., Rufus Du Sol, Lane 8",
    bestPart: "The drop at 1:30 hits with surgical precision - you've nailed that delicate balance between power and restraint. The layered synths create this cascading waterfall effect that's genuinely hypnotic. The sidechain compression is textbook perfect.",
    weakestPart: "The intro could potentially be trimmed by about 8-10 seconds for streaming optimization. Spotify's skip data shows most listeners make decisions in the first 30 seconds.",
    timestamps: [{ seconds: 90, note: "The drop here is perfect" }],
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic House",
    similarArtists: "Ben Bohmer, Lane 8, Yotto",
    bestPart: "The emotional architecture of this track is remarkable. You've created a genuine journey here - not just a loop with a drop, but a narrative arc that takes the listener somewhere.",
    weakestPart: "The sub-bass could use a touch more presence in the 40-60Hz range. When I switched to monitors with extended low end, I noticed the low frequencies felt slightly thin.",
    timestamps: [{ seconds: 145, note: "This breakdown is emotional" }],
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "House / Tech House",
    similarArtists: "Chris Lake, Fisher, Dom Dolla",
    bestPart: "The low-end is really well handled here. The kick has that modern punch that cuts through without being harsh, and the bassline complements it beautifully.",
    weakestPart: "The vocal sample feels a bit stock/generic compared to the quality of the production around it. Consider either finding a more distinctive vocal hook or processing it more creatively.",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Progressive House",
    similarArtists: "Above & Beyond, Arty, Spencer Brown",
    bestPart: "The arrangement on this is masterclass level. Every single element knows exactly when to enter and exit. The way you build tension through the verse sections, the perfectly-timed breakdown, the anthemic drop.",
    weakestPart: "If I'm being extremely critical, the hi-hats could have slightly more high-end sparkle (shelf boost above 10kHz).",
    timestamps: [{ seconds: 180, note: "The rebuild is perfectly paced" }],
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Deep House",
    similarArtists: "Eli & Fur, CamelPhat, Cristoph",
    bestPart: "The mood and vibe you're going for is clear and the musical ideas are there. The chord progression has that emotional quality that connects with listeners.",
    weakestPart: "The mix needs work. There's muddiness in the low-mids (200-500Hz) that's clouding the overall clarity. The bass and kick are fighting for space rather than complementing each other.",
    timestamps: [{ seconds: 60, note: "Mud building up here - check 200-500Hz" }],
  },
];

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email) || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUserId = session.user.id;

  try {
    const genre = await prisma.genre.findFirst({ where: { slug: "house" } });
    if (!genre) {
      return NextResponse.json(
        { error: "Run 'npx prisma db seed' first to create genres" },
        { status: 400 }
      );
    }

    // Enable artist mode on admin's account
    await prisma.user.update({
      where: { id: adminUserId },
      data: { isArtist: true },
    });

    // Create artist profile for admin
    const artistProfile = await prisma.artistProfile.upsert({
      where: { userId: adminUserId },
      update: {},
      create: {
        userId: adminUserId,
        artistName: "Preview Artist",
        genres: { connect: [{ id: genre.id }] },
      },
    });

    // Check for existing completed preview track
    let track = await prisma.track.findFirst({
      where: {
        artistId: artistProfile.id,
        title: { startsWith: "Preview Track" },
        status: "COMPLETED",
      },
    });

    if (!track) {
      // Create test reviewers
      const passwordHash = await hash("test123456", 12);
      const reviewerProfiles = [];

      for (let i = 0; i < 5; i++) {
        const reviewerUser = await prisma.user.upsert({
          where: { email: `preview-reviewer-${i}@soundcheck.com` },
          update: {},
          create: {
            email: `preview-reviewer-${i}@soundcheck.com`,
            password: passwordHash,
            name: `Preview Reviewer ${i + 1}`,
            isReviewer: true,
            emailVerified: new Date(),
          },
        });

        const reviewerProfile = await prisma.reviewerProfile.upsert({
          where: { userId: reviewerUser.id },
          update: {},
          create: {
            userId: reviewerUser.id,
            tier: i < 2 ? "PRO" : "NORMAL",
            completedOnboarding: true,
            onboardingQuizPassed: true,
            genres: { connect: [{ id: genre.id }] },
          },
        });

        reviewerProfiles.push(reviewerProfile);
      }

      // Create track with completed reviews
      track = await prisma.track.create({
        data: {
          artistId: artistProfile.id,
          sourceUrl: "https://soundcloud.com/user-587506684/sick-track",
          sourceType: "SOUNDCLOUD",
          title: `Preview Track - ${new Date().toLocaleDateString()}`,
          duration: 240,
          feedbackFocus: "Looking for honest feedback on the mix and overall vibe!",
          status: "COMPLETED",
          packageType: "STARTER",
          reviewsRequested: 5,
          reviewsCompleted: 5,
          paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          genres: { connect: [{ id: genre.id }] },
        },
      });

      // Create reviews
      for (let i = 0; i < 5; i++) {
        const data = sampleReviews[i];
        await prisma.review.create({
          data: {
            trackId: track.id,
            reviewerId: reviewerProfiles[i].id,
            status: "COMPLETED",
            listenDuration: 200 + Math.floor(Math.random() * 85),
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
            weakestPart: data.weakestPart,
            timestamps: data.timestamps,
            paidAmount: 100,
            artistRating: data.productionScore >= 4 ? 5 : null,
            isGem: i === 0,
            shareId: `preview${i}${Date.now().toString(36)}`,
          },
        });
      }
    }

    return NextResponse.json({
      trackId: track.id,
    });
  } catch (error) {
    console.error("Failed to create artist track preview:", error);
    return NextResponse.json(
      { error: "Failed to create preview" },
      { status: 500 }
    );
  }
}
