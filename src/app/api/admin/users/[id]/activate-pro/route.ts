import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Find the user and their artist profile
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        ArtistProfile: {
          select: {
            id: true,
            subscriptionStatus: true,
            subscriptionTier: true,
            reviewCredits: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.ArtistProfile) {
      return NextResponse.json(
        { error: "User does not have an artist profile" },
        { status: 400 }
      );
    }

    // Activate pro subscription
    const updatedProfile = await prisma.artistProfile.update({
      where: { id: user.ArtistProfile.id },
      data: {
        subscriptionStatus: "active",
        subscriptionTier: "pro",
        // Grant 10 Pro credits
        reviewCredits: { increment: 10 },
      },
    });

    console.log(`Admin activated pro for user ${user.email} (profile: ${updatedProfile.id})`);

    return NextResponse.json({
      success: true,
      message: `Pro activated for ${user.email}`,
      profile: {
        subscriptionStatus: updatedProfile.subscriptionStatus,
        subscriptionTier: updatedProfile.subscriptionTier,
        reviewCredits: updatedProfile.reviewCredits,
      },
    });
  } catch (error) {
    console.error("Activate pro error:", error);
    return NextResponse.json(
      { error: "Failed to activate pro" },
      { status: 500 }
    );
  }
}
