import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Finding all tracks with seed reviews...");

  // Find both tracks we added reviews to
  const tracks = await prisma.track.findMany({
    where: {
      OR: [
        {
          ArtistProfile: {
            User: {
              email: "hpgio64@gmail.com",
            },
          },
        },
        {
          title: {
            contains: "Papa Roach",
          },
        },
      ],
    },
    include: {
      Review: {
        where: { status: "COMPLETED" },
      },
      ArtistProfile: {
        include: {
          User: true,
        },
      },
    },
  });

  console.log(`Found ${tracks.length} track(s) to check\n`);

  for (const track of tracks) {

    console.log(`Track: "${track.title}" by ${track.ArtistProfile.artistName}`);
    console.log(`  Current status: ${track.status}`);
    console.log(`  Reviews requested: ${track.reviewsRequested}`);
    console.log(`  Reviews completed: ${track.reviewsCompleted}`);
    console.log(`  Completed reviews in DB: ${track.Review.length}`);

    // Update reviewsCompleted count to match actual completed reviews
    const actualCompletedCount = track.Review.length;

    // Determine correct status
    const newStatus =
      actualCompletedCount >= track.reviewsRequested ? "COMPLETED" : "IN_PROGRESS";

    if (track.status === newStatus && track.reviewsCompleted === actualCompletedCount) {
      console.log(`  ✅ Already correct!\n`);
      continue;
    }

    console.log(
      `  → Updating to: ${actualCompletedCount} completed reviews, status: ${newStatus}`
    );

    await prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: actualCompletedCount,
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date() : null,
      },
    });

    console.log("  ✅ Updated!\n");
  }

  console.log("✅ All tracks updated successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
