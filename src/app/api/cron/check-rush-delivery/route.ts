import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    // Find tracks with rush delivery where deadline passed with 0 completed reviews
    const missedTracks = await prisma.track.findMany({
      where: {
        rushDelivery: true,
        rushDeliveryDeadline: { lte: now },
        reviewsCompleted: 0,
        status: { in: ["QUEUED", "IN_PROGRESS"] },
      },
      include: {
        ArtistProfile: {
          include: { User: true },
        },
      },
    });

    console.log(`[Rush Delivery Check] Found ${missedTracks.length} tracks with missed SLA`);

    for (const track of missedTracks) {
      console.log(`[Rush Delivery Missed] Track: "${track.title}" (${track.id})`);

      // TODO: Send apology email
      // await sendRushDeliveryMissedEmail({
      //   to: track.ArtistProfile.User.email,
      //   trackTitle: track.title,
      //   trackId: track.id,
      // });

      // TODO: Notify admin via Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        try {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `🚨 Rush delivery missed for "${track.title}" (${track.id})\\nArtist: ${track.ArtistProfile.User.email}`,
              channel: "#rush-delivery-alerts",
            }),
          });
        } catch (slackError) {
          console.error("Failed to send Slack notification:", slackError);
        }
      }

      // Clear rush flag (but keep trying to assign reviews)
      await prisma.track.update({
        where: { id: track.id },
        data: {
          rushDelivery: false,
          rushDeliveryDeadline: null,
        },
      });
    }

    return NextResponse.json({
      checked: missedTracks.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking rush delivery:", error);
    return NextResponse.json(
      { error: "Failed to check rush delivery" },
      { status: 500 }
    );
  }
}
