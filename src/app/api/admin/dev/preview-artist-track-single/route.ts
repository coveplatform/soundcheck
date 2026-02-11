import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Single review data for free tier preview
const singleReview = {
  firstImpression: "STRONG_HOOK" as const,
  productionScore: 4,
  vocalScore: 4,
  originalityScore: 4,
  wouldListenAgain: true,
  wouldAddToPlaylist: true,
  wouldShare: false,
  wouldFollow: true,
  perceivedGenre: "Deep House",
  similarArtists: "Fred Again.., Rufus Du Sol",
  bestPart: "The hook at 0:45 is instantly memorable — I caught myself humming it after. Drums and bass feel really tight throughout, especially that kick pattern in the verses. The drop at 1:12 hits hard and the stereo width on the synths gives it a lot of energy. Vocal processing in the chorus sounds professional.",
  weakestPart: "Intro feels too long — I'd cut 8-12 seconds to get to the action faster. Around 1:30 the vocal sits on top of the lead synth and they're fighting for the same frequency space. Maybe automate the synth down a few dB there or add a sidechain. The outro also drags a bit after 2:45.",
  timestamps: [
    { seconds: 45, note: "Hook hits hard here" },
    { seconds: 90, note: "Vocal/synth conflict starts" },
  ],
};

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
    let artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: adminUserId },
    });

    if (!artistProfile) {
      artistProfile = await prisma.artistProfile.create({
        data: {
          userId: adminUserId,
          artistName: "Preview Artist",
        },
      });
    }

    // Check for existing single-review preview track
    let track = await prisma.track.findFirst({
      where: {
        artistId: artistProfile.id,
        title: { startsWith: "Free Tier Preview" },
        status: "COMPLETED",
        reviewsRequested: 1,
      },
    });

    if (!track) {
      // Create test reviewer
      const passwordHash = await hash("test123456", 12);

      let reviewerUser = await prisma.user.findUnique({
        where: { email: "preview-reviewer-single@soundcheck.com" },
      });

      if (!reviewerUser) {
        reviewerUser = await prisma.user.create({
          data: {
            email: "preview-reviewer-single@soundcheck.com",
            password: passwordHash,
            name: "Sarah",
            isReviewer: true,
            emailVerified: new Date(),
          },
        });
      }

      let reviewerProfile = await prisma.reviewerProfile.findUnique({
        where: { userId: reviewerUser.id },
      });

      if (!reviewerProfile) {
        reviewerProfile = await prisma.reviewerProfile.create({
          data: {
            userId: reviewerUser.id,
            tier: "NORMAL",
            completedOnboarding: true,
            onboardingQuizPassed: true,
            Genre: { connect: [{ id: genre.id }] },
          },
        });
      }

      // Create track with 1 review (simulating free tier)
      track = await prisma.track.create({
        data: {
          artistId: artistProfile.id,
          sourceUrl: "https://soundcloud.com/user-587506684/sick-track",
          sourceType: "SOUNDCLOUD",
          title: `Free Tier Preview - ${new Date().toLocaleDateString()}`,
          duration: 240,
          feedbackFocus: "First time trying this out - looking for honest feedback!",
          status: "COMPLETED",
          packageType: "STARTER",
          reviewsRequested: 1, // Free tier = 1 review
          reviewsCompleted: 1,
          paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          Genre: { connect: [{ id: genre.id }] },
        },
      });

      // Create single review
      await prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewerProfile.id,
          status: "COMPLETED",
          listenDuration: 220,
          firstImpression: singleReview.firstImpression,
          productionScore: singleReview.productionScore,
          vocalScore: singleReview.vocalScore,
          originalityScore: singleReview.originalityScore,
          wouldListenAgain: singleReview.wouldListenAgain,
          wouldAddToPlaylist: singleReview.wouldAddToPlaylist,
          wouldShare: singleReview.wouldShare,
          wouldFollow: singleReview.wouldFollow,
          perceivedGenre: singleReview.perceivedGenre,
          similarArtists: singleReview.similarArtists,
          bestPart: singleReview.bestPart,
          weakestPart: singleReview.weakestPart,
          timestamps: singleReview.timestamps,
          paidAmount: 0, // Free review
          shareId: `previewsingle${Date.now().toString(36)}`,
        },
      });
    }

    return NextResponse.json({
      trackId: track.id,
    });
  } catch (error) {
    console.error("Failed to create single-review preview:", error);
    return NextResponse.json(
      { error: "Failed to create preview" },
      { status: 500 }
    );
  }
}
