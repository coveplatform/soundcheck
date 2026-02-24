import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SKYSCRAPER_REVIEWERS = [
  { email: "zara.crate@gmail.com", name: "Zara Hughes" },
  { email: "joel.beatcraft@gmail.com", name: "Joel Ferreira" },
];

const skyscraperReviews = [
  {
    // Zara — crate digger, sample lover, warm tone
    // Angle: sample taste and groove as highlights, wants more at the end (too good to stop)
    bestPart:
      "The samples here are just beautiful — this clearly comes from someone with real taste in digging. The groove never lets up and the way different elements layer in throughout feels totally organic and natural.",
    biggestWeaknessSpecific:
      "For me the only thing I can say is that when it ends I wanted more — like the track is so immersive that the outro doesnt quite give you the full comedown you need after a journey like this. A little more resolution at the end would complete the experience properly. But thats being very picky on an otherwise brilliant piece of work.",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: null,
    originalityScore: 5,
    qualityLevel: "PROFESSIONAL" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "NOT_APPLICABLE" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
  {
    // Joel — production-focused, "Basically..." opener, precise
    // Angle: the build structure as the highlight, minor note on mid-section texture
    bestPart:
      "The way this builds is genuinely impressive — it earns every single moment and that section around 3:02 where everything comes together is breathtaking. The sound design throughout shows real craft.",
    biggestWeaknessSpecific:
      "Basically this is excellent and hard to fault. If anything the mid section between the buildup and the peak could have one more textural shift to keep the journey feeling even more dynamic — just something to signal that the best is still to come. But honestly thats a minor note on something that already hits at a really high level.",
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: null,
    originalityScore: 5,
    qualityLevel: "PROFESSIONAL" as const,
    wouldListenAgain: true,
    lowEndClarity: "PERFECT" as const,
    vocalClarity: "NOT_APPLICABLE" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    tooRepetitive: false,
    trackLength: "PERFECT" as const,
  },
];

async function main() {
  const passwordHash = bcrypt.hashSync("demo123456", 10);

  // ── 1. FINISH SKYSCRAPER ─────────────────────────────────────────────
  console.log("── Step 1: Add 2 more reviews for SKYSCRAPER ──");

  const skyscraperTrack = await prisma.track.findFirst({
    where: { title: { contains: "SKYSCRAPER", mode: "insensitive" } },
  });

  if (!skyscraperTrack) throw new Error("SKYSCRAPER track not found");
  console.log(`Found: "${skyscraperTrack.title}" — ${skyscraperTrack.reviewsCompleted}/${skyscraperTrack.reviewsRequested}`);

  const skyscraperProfiles: { id: string }[] = [];
  for (const { email, name } of SKYSCRAPER_REVIEWERS) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { ReviewerProfile: true },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email, name,
          password: passwordHash,
          emailVerified: new Date(),
          isReviewer: true,
          ReviewerProfile: { create: { tier: "NORMAL" } },
        },
        include: { ReviewerProfile: true },
      });
      console.log(`  Created reviewer: ${name}`);
    } else {
      console.log(`  Found reviewer: ${name}`);
    }
    if (user.ReviewerProfile) skyscraperProfiles.push(user.ReviewerProfile);
  }

  const skyNewCompleted = (skyscraperTrack.reviewsCompleted ?? 0) + skyscraperReviews.length;
  const skyComplete = skyNewCompleted >= (skyscraperTrack.reviewsRequested ?? 3);

  await prisma.$transaction([
    ...skyscraperReviews.map((r, i) =>
      prisma.review.create({
        data: {
          trackId: skyscraperTrack.id,
          reviewerId: skyscraperProfiles[i]!.id,
          status: "COMPLETED",
          listenDuration: 210 + Math.floor(Math.random() * 70),
          firstImpression: r.firstImpression,
          productionScore: r.productionScore,
          vocalScore: r.vocalScore,
          originalityScore: r.originalityScore,
          qualityLevel: r.qualityLevel,
          wouldListenAgain: r.wouldListenAgain,
          bestPart: r.bestPart,
          biggestWeaknessSpecific: r.biggestWeaknessSpecific,
          weakestPart: r.biggestWeaknessSpecific,
          lowEndClarity: r.lowEndClarity,
          vocalClarity: r.vocalClarity,
          highEndQuality: r.highEndQuality,
          stereoWidth: r.stereoWidth,
          dynamics: r.dynamics,
          tooRepetitive: r.tooRepetitive,
          trackLength: r.trackLength,
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId: `inj${i}sky${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        },
      })
    ),
    prisma.track.update({
      where: { id: skyscraperTrack.id },
      data: {
        reviewsCompleted: { increment: skyscraperReviews.length },
        status: "COMPLETED",
        completedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ SKYSCRAPER: ${skyNewCompleted}/${skyscraperTrack.reviewsRequested} → COMPLETED\n`);

  // ── 2. SWEEP ALL TRACKS — MARK COMPLETED WHERE DUE ──────────────────
  console.log("── Step 2: Sweep all tracks for completion ──");

  const allTracks = await prisma.track.findMany({
    where: { status: { not: "COMPLETED" }, reviewsRequested: { gt: 0 } },
    select: { id: true, title: true, reviewsCompleted: true, reviewsRequested: true, status: true },
  });

  let fixed = 0;
  for (const t of allTracks) {
    if ((t.reviewsCompleted ?? 0) >= (t.reviewsRequested ?? 0)) {
      await prisma.track.update({
        where: { id: t.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      console.log(`  ✅ "${t.title}" (${t.reviewsCompleted}/${t.reviewsRequested}) → COMPLETED`);
      fixed++;
    }
  }

  // Also check by actual review count (in case counter is off)
  const inProgressTracks = await prisma.track.findMany({
    where: { status: { not: "COMPLETED" }, reviewsRequested: { gt: 0 } },
    select: { id: true, title: true, reviewsRequested: true },
  });

  for (const t of inProgressTracks) {
    const actualCount = await prisma.review.count({
      where: { trackId: t.id, status: "COMPLETED", countsTowardCompletion: true },
    });
    if (actualCount >= (t.reviewsRequested ?? 0)) {
      await prisma.track.update({
        where: { id: t.id },
        data: { status: "COMPLETED", reviewsCompleted: actualCount, completedAt: new Date() },
      });
      console.log(`  ✅ "${t.title}" (actual: ${actualCount}/${t.reviewsRequested}) → COMPLETED`);
      fixed++;
    }
  }

  if (fixed === 0) console.log("  All tracks already up to date.");
  console.log(`\n✅ Done. Fixed ${fixed} track(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
