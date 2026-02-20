import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignReviewersToTrack } from "@/lib/queue";
import { detectSource, resolveShortUrl } from "@/lib/metadata";

const requestSchema = z.object({
  sourceUrl: z.string().min(1, "Track URL is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = requestSchema.parse(body);

    // Resolve short SoundCloud links (on.soundcloud.com) to their full URL
    data.sourceUrl = await resolveShortUrl(data.sourceUrl);

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        ArtistProfile: { select: { userId: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.ArtistProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (track.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cancelled tracks cannot be updated" },
        { status: 400 }
      );
    }

    const completedCount = await prisma.review.count({
      where: {
        trackId: track.id,
        status: "COMPLETED",
      },
    });

    if (completedCount > 0) {
      return NextResponse.json(
        { error: "Track cannot be updated once reviews have been completed" },
        { status: 400 }
      );
    }

    let sourceType = detectSource(data.sourceUrl);

    if (!sourceType) {
      const isLocalUpload = data.sourceUrl.startsWith("/uploads/");
      let isRemoteUpload = false;

      if (!isLocalUpload) {
        try {
          const parsed = new URL(data.sourceUrl);
          isRemoteUpload = parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
          isRemoteUpload = false;
        }
      }

      if (!isLocalUpload && !isRemoteUpload) {
        return NextResponse.json(
          { error: "Invalid track URL. Use SoundCloud, Bandcamp, or YouTube" },
          { status: 400 }
        );
      }

      sourceType = "UPLOAD";
    }

    await prisma.$transaction([
      prisma.track.update({
        where: { id: track.id },
        data: {
          sourceUrl: data.sourceUrl,
          sourceType,
          linkIssueNotifiedAt: null, // Clear the link issue flag when URL is updated
        },
        select: { id: true },
      }),
      prisma.reviewQueue.deleteMany({
        where: { trackId: track.id },
      }),
      prisma.review.updateMany({
        where: {
          trackId: track.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        data: { status: "EXPIRED" },
      }),
    ]);

    if (track.status === "QUEUED" || track.status === "IN_PROGRESS") {
      await assignReviewersToTrack(track.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    console.error("Error updating track source:", error);
    return NextResponse.json(
      { error: "Failed to update track source" },
      { status: 500 }
    );
  }
}
