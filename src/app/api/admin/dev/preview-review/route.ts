import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Require admin access
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get a genre for the test data
    const genre = await prisma.genre.findFirst({ where: { slug: "house" } });
    if (!genre) {
      return NextResponse.json(
        { error: "Run 'npx prisma db seed' first to create genres" },
        { status: 400 }
      );
    }

    const passwordHash = await hash("test123456", 12);

    // Create or get test artist
    const artistUser = await prisma.user.upsert({
      where: { email: "test-artist@soundcheck.com" },
      update: {},
      create: {
        email: "test-artist@soundcheck.com",
        password: passwordHash,
        name: "Test Artist",
        isArtist: true,
        emailVerified: new Date(),
      },
    });

    const artistProfile = await prisma.artistProfile.upsert({
      where: { userId: artistUser.id },
      update: {},
      create: {
        userId: artistUser.id,
        artistName: "Test Artist",
        genres: { connect: [{ id: genre.id }] },
      },
    });

    // Create or get test reviewer
    const reviewerUser = await prisma.user.upsert({
      where: { email: "test-reviewer@soundcheck.com" },
      update: {},
      create: {
        email: "test-reviewer@soundcheck.com",
        password: passwordHash,
        name: "Test Reviewer",
        isReviewer: true,
        emailVerified: new Date(),
      },
    });

    const reviewerProfile = await prisma.reviewerProfile.upsert({
      where: { userId: reviewerUser.id },
      update: {},
      create: {
        userId: reviewerUser.id,
        tier: "PRO",
        completedOnboarding: true,
        onboardingQuizPassed: true,
        genres: { connect: [{ id: genre.id }] },
      },
    });

    // Check for existing assigned/in-progress review for this reviewer
    let review = await prisma.review.findFirst({
      where: {
        reviewerId: reviewerProfile.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
    });

    if (!review) {
      // Create a test track with audio
      const track = await prisma.track.create({
        data: {
          artistId: artistProfile.id,
          sourceUrl: "https://soundcloud.com/user-587506684/sick-track",
          sourceType: "SOUNDCLOUD",
          title: `UI Test Track ${new Date().toLocaleTimeString()}`,
          duration: 240,
          feedbackFocus: "Testing the reviewer UI - this is a preview track for development!",
          status: "IN_PROGRESS",
          packageType: "STANDARD",
          reviewsRequested: 3,
          reviewsCompleted: 0,
          genres: { connect: [{ id: genre.id }] },
        },
      });

      // Create assigned review
      review = await prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewerProfile.id,
          status: "IN_PROGRESS",
        },
      });
    }

    return NextResponse.json({
      reviewId: review.id,
      reviewerEmail: "test-reviewer@soundcheck.com",
      reviewerPassword: "test123456",
    });
  } catch (error) {
    console.error("Failed to create preview review:", error);
    return NextResponse.json(
      { error: "Failed to create preview" },
      { status: 500 }
    );
  }
}
