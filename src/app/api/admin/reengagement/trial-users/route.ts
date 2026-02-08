import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendTrialReminderEmail } from "@/lib/email";

// GET: List eligible free tier users who haven't submitted a track
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find users with:
    // - An artist profile
    // - No tracks submitted
    // - Haven't been reminded yet (trialReminderSentAt is null)
    const eligibleUsers = await prisma.user.findMany({
      where: {
        isArtist: true,
        trialReminderSentAt: null,
        artistProfile: {
          tracks: { none: {} },
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        artistProfile: {
          select: {
            artistName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also count how many have already been reminded
    const remindedCount = await prisma.user.count({
      where: {
        isArtist: true,
        trialReminderSentAt: { not: null },
        artistProfile: {
          tracks: { none: {} },
        },
      },
    });

    return NextResponse.json({
      eligible: eligibleUsers.map((u) => ({
        id: u.id,
        email: u.email,
        artistName: u.artistProfile?.artistName ?? "Artist",
        signedUpAt: u.createdAt,
      })),
      stats: {
        eligibleCount: eligibleUsers.length,
        alreadyRemindedCount: remindedCount,
      },
    });
  } catch (error) {
    console.error("Get free tier users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch free tier users" },
      { status: 500 }
    );
  }
}

const postSchema = z.object({
  userIds: z.array(z.string()).optional(), // If not provided, send to all eligible
});

// POST: Send reminder emails to free tier users
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userIds } = postSchema.parse(body);

    // Build the query
    const whereClause = {
      isArtist: true,
      trialReminderSentAt: null,
      artistProfile: {
        reviewCredits: { gte: 1 },
        tracks: { none: {} },
      },
      ...(userIds && userIds.length > 0 ? { id: { in: userIds } } : {}),
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        artistProfile: {
          select: { artistName: true },
        },
      },
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No eligible users to email",
      });
    }

    // Send emails and track results
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const emailSent = await sendTrialReminderEmail({
          to: user.email,
          artistName: user.artistProfile?.artistName ?? "there",
        });

        if (!emailSent) {
          throw new Error(`Email failed for ${user.email}`);
        }

        // Only mark as reminded if email actually sent
        await prisma.user.update({
          where: { id: user.id },
          data: { trialReminderSentAt: new Date() },
        });

        return user.email;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Send free tier reminder error:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
