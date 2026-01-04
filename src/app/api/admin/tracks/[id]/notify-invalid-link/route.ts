import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendInvalidTrackLinkEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const artistEmail = track.artist.user.email;

    // Update track to mark that we notified about link issue
    await prisma.track.update({
      where: { id: trackId },
      data: {
        linkIssueNotifiedAt: new Date(),
      },
    });

    // Send the email
    await sendInvalidTrackLinkEmail({
      to: artistEmail,
      trackTitle: track.title,
      trackId: track.id,
      sourceUrl: track.sourceUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify invalid link error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
