/**
 * Blast the Pro 50% off sale email to all eligible users.
 * Dry run by default — pass --send to actually deliver.
 * Usage:
 *   npx tsx scripts/send-pro-sale-blast.ts          # preview who would get it
 *   npx tsx scripts/send-pro-sale-blast.ts --send   # send for real
 */
import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import { sendProSaleEmail } from "../../src/lib/email/announcements";

const DRY = !process.argv.includes("--send");
const DELAY_MS = 250; // stay well under Resend rate limits

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Mode: ${DRY ? "DRY RUN (pass --send to deliver)" : "SENDING"}\n`);

  const users = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          { email: { endsWith: "@seed.mixreflect.com" } },
          { email: { endsWith: "@soundcheck.internal" } },
          { email: { endsWith: "@mixreflect.com" } },
        ],
      },
      ArtistProfile: {
        is: { completedOnboarding: true },
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
          subscriptionStatus: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let eligible = 0;
  let skippedPro = 0;
  let skippedNoEmail = 0;
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    if (!user.email) { skippedNoEmail++; continue; }

    const profile = user.ArtistProfile;

    // Skip existing Pro subscribers — they're already paying full price
    if (profile?.subscriptionStatus === "active") {
      skippedPro++;
      continue;
    }

    eligible++;
    const displayName = profile?.artistName || user.name || undefined;

    if (DRY) {
      console.log(`  → ${user.email}${displayName ? ` (${displayName})` : ""}`);
      continue;
    }

    try {
      await sendProSaleEmail({ to: user.email, userName: displayName });
      console.log(`  ✓ ${user.email}`);
      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${user.email}: ${msg}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\n${DRY ? "Would send to" : "Sent to"}: ${eligible}` +
    ` | Skipped Pro: ${skippedPro}` +
    ` | No email: ${skippedNoEmail}` +
    (DRY ? "" : ` | Failed: ${failed}`)
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
