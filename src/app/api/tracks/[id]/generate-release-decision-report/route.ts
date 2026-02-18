import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReleaseDecisionReport } from "@/lib/release-decision-report";
import { sendReleaseDecisionReport } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackId } = await params;

    // Fetch track with all Release Decision reviews
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        ArtistProfile: {
          include: {
            User: true,
          },
        },
        Review: {
          where: {
            status: "COMPLETED",
          },
          include: {
            ReviewerProfile: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Verify this is a Release Decision track
    if (track.packageType !== "RELEASE_DECISION") {
      return NextResponse.json(
        { error: "Track is not a Release Decision package" },
        { status: 400 }
      );
    }

    // Check if we have enough reviews
    const releaseDecisionReviews = track.Review.filter(
      (r) => r.releaseVerdict !== null && r.releaseReadinessScore !== null
    );

    if (releaseDecisionReviews.length < 5) {
      return NextResponse.json(
        {
          error: `Insufficient reviews (${releaseDecisionReviews.length}/10). Need at least 5 completed reviews.`,
        },
        { status: 400 }
      );
    }

    // Generate the report
    console.log(`Generating Release Decision report for track ${trackId}...`);
    const report = await generateReleaseDecisionReport(trackId, releaseDecisionReviews);

    // Save report to database
    await prisma.track.update({
      where: { id: trackId },
      data: {
        releaseDecisionReport: report as any,
        releaseDecisionGeneratedAt: new Date(),
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`Report generated successfully. Sending email to ${track.ArtistProfile.User.email}...`);

    // Send email to artist
    await sendReleaseDecisionReport({
      artistEmail: track.ArtistProfile.User.email,
      artistName: track.ArtistProfile.artistName,
      trackTitle: track.title,
      trackId: track.id,
      report,
    });

    console.log(`Release Decision report sent successfully!`);

    return NextResponse.json({
      success: true,
      report,
      message: `Report generated and sent to ${track.ArtistProfile.User.email}`,
    });
  } catch (error) {
    console.error("Error generating Release Decision report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
