/**
 * Send the credits nudge email batch directly from local against production DB.
 * Dry run by default — pass --send to actually deliver.
 * Usage:
 *   npx tsx scripts/_send-credits-nudge.ts          # preview counts
 *   npx tsx scripts/_send-credits-nudge.ts --send   # send for real
 */
import { prisma } from "../../src/lib/prisma";
import { sendCreditsNudgeEmail } from "../../src/lib/email/nudge";

const DRY = !process.argv.includes("--send");

async function main() {
  console.log(`Mode: ${DRY ? "DRY RUN (pass --send to deliver)" : "SENDING"}\n`);

  const idleThreshold = new Date();
  idleThreshold.setUTCDate(idleThreshold.getUTCDate() - 1);
  const nudgeCooldown = new Date();
  nudgeCooldown.setUTCDate(nudgeCooldown.getUTCDate() - 28);

  const users = await prisma.user.findMany({
    where: {
      NOT: { email: { endsWith: "@seed.mixreflect.com" } },
      OR: [
        { lastActiveAt: { lte: idleThreshold } },
        { lastActiveAt: null },
      ],
      ArtistProfile: {
        is: {
          completedOnboarding: true,
          OR: [
            { subscriptionStatus: null },
            { subscriptionStatus: { not: "active" } },
          ],
          reviewCredits: { gte: 1 },
          AND: [{
            OR: [
              { lastCreditNudgeAt: null },
              { lastCreditNudgeAt: { lte: nudgeCooldown } },
            ],
          }],
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      ArtistProfile: {
        select: {
          id: true,
          artistName: true,
          reviewCredits: true,
          Track: {
            where: { status: { not: "COMPLETED" } },
            select: { id: true, title: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  let eligible = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const profile = user.ArtistProfile;
    if (!profile || !user.email) { skipped++; continue; }

    const activeSubmission = await prisma.track.findFirst({
      where: { artistId: profile.id, status: { in: ["QUEUED", "IN_PROGRESS"] } },
    });
    if (activeSubmission) { skipped++; continue; }

    eligible++;
    const name = profile.artistName || user.name || "there";
    const latestTrack = profile.Track?.[0];

    if (DRY) {
      console.log(`  → ${user.email} (${profile.reviewCredits} credits${latestTrack ? `, track: "${latestTrack.title}"` : ""})`);
      continue;
    }

    try {
      await sendCreditsNudgeEmail({
        to: user.email,
        name,
        credits: profile.reviewCredits,
        trackTitle: latestTrack?.title,
        trackId: latestTrack?.id,
      });
      await prisma.artistProfile.update({
        where: { id: profile.id },
        data: { lastCreditNudgeAt: new Date() },
      });
      console.log(`  ✓ ${user.email}`);
      sent++;
    } catch (err: any) {
      console.error(`  ✗ ${user.email}: ${err?.message}`);
      failed++;
    }
  }

  console.log(`\n${DRY ? "Would send" : "Sent"}: ${eligible} | Skipped: ${skipped}${!DRY ? ` | Failed: ${failed}` : ""}`);
  await prisma.$disconnect();
}

main().catch(console.error);
