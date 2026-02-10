import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Require admin access
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdminEmail(session.user.email) || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUserId = session.user.id;

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

    // Create or get test artist (separate from admin)
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
        Genre: { connect: [{ id: genre.id }] },
      },
    });

    // Enable reviewer mode on admin's account and create reviewer profile
    await prisma.user.update({
      where: { id: adminUserId },
      data: { isReviewer: true },
    });

    const reviewerProfile = await prisma.reviewerProfile.upsert({
      where: { userId: adminUserId },
      update: {},
      create: {
        userId: adminUserId,
        tier: "PRO",
        completedOnboarding: true,
        onboardingQuizPassed: true,
        Genre: { connect: [{ id: genre.id }] },
      },
    });

    // Check for existing assigned/in-progress review for admin
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
          Genre: { connect: [{ id: genre.id }] },
        },
      });

      // Create review assigned to admin
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
    });
  } catch (error) {
    console.error("Failed to create preview review:", error);
    return NextResponse.json(
      { error: "Failed to create preview" },
      { status: 500 }
    );
  }
}
