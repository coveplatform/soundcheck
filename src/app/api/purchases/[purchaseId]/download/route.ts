import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/s3";

/**
 * GET /api/purchases/[purchaseId]/download
 * Generate fresh download link for completed purchase
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { purchaseId } = await context.params;

    // Fetch purchase
    const purchase = await prisma.externalPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        Track: {
          select: {
            id: true,
            title: true,
            sourceUrl: true,
            sourceType: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Verify purchase is completed
    if (purchase.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Purchase not completed yet" },
        { status: 400 }
      );
    }

    // Verify track is an upload
    if (purchase.Track.sourceType !== "UPLOAD") {
      return NextResponse.json(
        { error: "Only uploaded tracks can be downloaded" },
        { status: 400 }
      );
    }

    // Generate fresh download URL (7 day expiry)
    const downloadUrl = await generateDownloadUrl(
      purchase.Track.sourceUrl,
      7 * 24 * 60 * 60
    );

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "Failed to generate download link. Please contact support." },
        { status: 500 }
      );
    }

    // Update download count and timestamp
    await prisma.externalPurchase.update({
      where: { id: purchaseId },
      data: {
        downloadCount: { increment: 1 },
        downloadedAt: new Date(),
        downloadUrl, // Store fresh URL
      },
    });

    // Return the download URL
    return NextResponse.json({
      success: true,
      downloadUrl,
      trackTitle: purchase.Track.title,
      expiresIn: "7 days",
    });
  } catch (error) {
    console.error("Error generating download:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
