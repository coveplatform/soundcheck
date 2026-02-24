import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/charts/winner-card?submissionId=xxx
 * Returns data for a shareable winner card.
 * Pro-only: generates share data for social media.
 * Public (no auth): returns basic card data for OG embeds.
 */
export async function GET(request: NextRequest) {
  const submissionId = request.nextUrl.searchParams.get("submissionId");

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 }
    );
  }

  try {
    const submission = await (prisma as any).chartSubmission.findFirst({
      where: { id: submissionId, isFeatured: true },
      select: {
        id: true,
        title: true,
        artworkUrl: true,
        sourceUrl: true,
        voteCount: true,
        playCount: true,
        chartDate: true,
        rank: true,
        ArtistProfile: {
          select: {
            id: true,
            artistName: true,
            subscriptionStatus: true,
            User: { select: { image: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Winner not found" },
        { status: 404 }
      );
    }

    // Check if the requester is the winner and is Pro (for share CTA gating)
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.artistProfileId === submission.ArtistProfile.id;
    const isPro = submission.ArtistProfile.subscriptionStatus === "active";
    const canShare = isOwner && isPro;

    const chartDate = new Date(submission.chartDate);
    const formattedDate = chartDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return NextResponse.json({
      card: {
        submissionId: submission.id,
        title: submission.title,
        artistName: submission.ArtistProfile.artistName,
        artistImage: submission.ArtistProfile.User?.image || null,
        artworkUrl: submission.artworkUrl,
        sourceUrl: submission.sourceUrl,
        voteCount: submission.voteCount,
        playCount: submission.playCount,
        date: formattedDate,
        dateRaw: submission.chartDate,
        canShare,
        isOwner,
        isPro,
        shareText: `My track "${submission.title}" was Track of the Day on MixReflect! 🏆 ${submission.voteCount} votes on ${formattedDate}.`,
      },
    });
  } catch (err: any) {
    console.error("Winner card error:", err);
    return NextResponse.json(
      { error: "Failed to generate winner card" },
      { status: 500 }
    );
  }
}
