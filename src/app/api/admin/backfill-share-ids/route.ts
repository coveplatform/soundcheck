import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Generate a short, URL-safe share ID (8 characters)
function generateShareId(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all completed reviews without a shareId
    const reviewsWithoutShareId = await prisma.review.findMany({
      where: {
        status: "COMPLETED",
        shareId: null,
      },
      select: {
        id: true,
        Track: {
          select: {
            title: true,
          },
        },
      },
    });

    if (reviewsWithoutShareId.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reviews need updating",
        updated: 0,
      });
    }

    // Update each review with a new shareId
    const updates = [];
    for (const review of reviewsWithoutShareId) {
      updates.push(
        prisma.review.update({
          where: { id: review.id },
          data: { shareId: generateShareId() },
        })
      );
    }

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: `Updated ${reviewsWithoutShareId.length} reviews with share IDs`,
      updated: reviewsWithoutShareId.length,
      Review: reviewsWithoutShareId.map((r) => ({
        id: r.id,
        trackTitle: r.track.title,
      })),
    });
  } catch (error) {
    console.error("Backfill share IDs error:", error);
    return NextResponse.json(
      { error: "Failed to backfill share IDs" },
      { status: 500 }
    );
  }
}
