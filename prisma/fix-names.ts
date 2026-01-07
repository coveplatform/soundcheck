import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // Fix the duplicate lena m names
  const fixes = [
    { email: "gen-reviewer-10@mixreflect.com", name: "wavey_" },
    { email: "gen-reviewer-11@mixreflect.com", name: "audio.phil" },
    { email: "gen-reviewer-12@mixreflect.com", name: "niteshift" },
    { email: "gen-reviewer-13@mixreflect.com", name: "K.sound" },
    { email: "gen-reviewer-14@mixreflect.com", name: "dreamer_x" },
    { email: "gen-reviewer-15@mixreflect.com", name: "lofi.dan" },
  ];

  for (const fix of fixes) {
    try {
      await prisma.user.update({
        where: { email: fix.email },
        data: { name: fix.name },
      });
      console.log("Fixed: " + fix.email + " -> " + fix.name);
    } catch (e) {
      console.log("Skipped: " + fix.email);
    }
  }

  // Verify the track status
  const track = await prisma.track.findUnique({
    where: { id: "cmk1i49g9000004i8kv07q16r" },
    include: {
      reviews: {
        where: { status: "COMPLETED" },
        include: { reviewer: { include: { user: true } } },
      },
    },
  });

  console.log("");
  console.log("Track: " + track!.title);
  console.log("reviewsCompleted field: " + track!.reviewsCompleted);
  console.log("Actual completed reviews: " + track!.reviews.length);
  console.log("");
  console.log("Reviewers who completed reviews:");
  for (const r of track!.reviews) {
    console.log("  - " + r.reviewer.user.name);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
