import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await request.json().catch(() => ({}));

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listenerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If already a reviewer with a profile, just ensure they're marked as reviewer
    if (user.listenerProfile) {
      await prisma.user.update({
        where: { id },
        data: { isReviewer: true },
      });
      return NextResponse.json({
        success: true,
        message: "User already has reviewer profile",
        reviewerProfileId: user.listenerProfile.id,
      });
    }

    // Create reviewer profile and mark user as reviewer
    const reviewerProfile = await prisma.listenerProfile.create({
      data: {
        userId: id,
        // New admin-enabled reviewers start with basic setup
        // They'll need to complete onboarding to start reviewing
      },
    });

    await prisma.user.update({
      where: { id },
      data: { isReviewer: true },
    });

    return NextResponse.json({
      success: true,
      message: "Reviewer profile created. User needs to complete onboarding.",
      reviewerProfileId: reviewerProfile.id,
    });
  } catch (error) {
    console.error("Admin enable reviewer error:", error);
    return NextResponse.json(
      { error: "Failed to enable reviewer" },
      { status: 500 }
    );
  }
}
