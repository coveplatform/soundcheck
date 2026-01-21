import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// Sample track data
const trackData = [
  {
    title: "Midnight Dreams",
    sourceUrl: "https://soundcloud.com/example/midnight-dreams",
    sourceType: "SOUNDCLOUD" as const,
    artworkUrl: "/track-artwork/midnight-drive.jpg",
    duration: 245,
    bpm: 124,
    reviews: [
      { production: 5, vocals: 4, originality: 5, listenAgain: true, playlist: true, share: true, follow: true },
      { production: 4, vocals: 5, originality: 4, listenAgain: true, playlist: true, share: false, follow: true },
      { production: 5, vocals: 4, originality: 5, listenAgain: true, playlist: true, share: true, follow: true },
      { production: 4, vocals: 4, originality: 4, listenAgain: true, playlist: false, share: false, follow: false },
    ],
  },
  {
    title: "Echoes in the Rain",
    sourceUrl: "https://soundcloud.com/example/echoes",
    sourceType: "SOUNDCLOUD" as const,
    duration: 198,
    bpm: 118,
    reviews: [
      { production: 4, vocals: 4, originality: 4, listenAgain: true, playlist: true, share: true, follow: false },
      { production: 5, vocals: 3, originality: 4, listenAgain: true, playlist: true, share: false, follow: true },
      { production: 4, vocals: 4, originality: 3, listenAgain: false, playlist: false, share: false, follow: false },
    ],
  },
  {
    title: "Sunset Boulevard",
    sourceUrl: "https://soundcloud.com/example/sunset",
    sourceType: "SOUNDCLOUD" as const,
    duration: 210,
    bpm: 120,
    reviews: [
      { production: 3, vocals: 3, originality: 4, listenAgain: true, playlist: false, share: false, follow: false },
      { production: 4, vocals: 3, originality: 3, listenAgain: false, playlist: false, share: false, follow: false },
      { production: 3, vocals: 4, originality: 3, listenAgain: true, playlist: true, share: false, follow: false },
      { production: 4, vocals: 3, originality: 4, listenAgain: true, playlist: false, share: false, follow: false },
    ],
  },
  {
    title: "Electric Waves",
    sourceUrl: "https://soundcloud.com/example/electric-waves",
    sourceType: "SOUNDCLOUD" as const,
    duration: 187,
    bpm: 128,
    reviews: [
      { production: 5, vocals: 5, originality: 5, listenAgain: true, playlist: true, share: true, follow: true },
      { production: 5, vocals: 4, originality: 5, listenAgain: true, playlist: true, share: true, follow: true },
      { production: 4, vocals: 5, originality: 4, listenAgain: true, playlist: true, share: false, follow: true },
    ],
  },
  {
    title: "Lost in Motion",
    sourceUrl: "https://soundcloud.com/example/lost-in-motion",
    sourceType: "SOUNDCLOUD" as const,
    duration: 223,
    bpm: 122,
    reviews: [
      { production: 4, vocals: 4, originality: 4, listenAgain: true, playlist: true, share: false, follow: false },
      { production: 4, vocals: 3, originality: 4, listenAgain: true, playlist: false, share: false, follow: false },
      { production: 5, vocals: 4, originality: 4, listenAgain: true, playlist: true, share: true, follow: false },
      { production: 4, vocals: 4, originality: 5, listenAgain: true, playlist: true, share: false, follow: true },
    ],
  },
];

// Sample reviewer names
const reviewerNames = [
  "Marcus Chen",
  "Zara Williams",
  "Leo Martinez",
  "Priya Sharma",
  "Jordan Blake",
  "Aaliyah Robinson",
  "Kai Nakamura",
  "Sofia Rossi",
];

// First impressions pool
const firstImpressions = ["STRONG_HOOK", "DECENT", "LOST_INTEREST"] as const;

// Perceived genres pool
const genres = [
  "Deep House",
  "Melodic House",
  "Progressive House",
  "Tech House",
  "Nu Disco",
];

// Similar artists pool
const similarArtists = [
  "Fred Again.., Rufus Du Sol, Lane 8",
  "Ben Bohmer, Lane 8, Yotto",
  "Disclosure, Duke Dumont, Purple Disco Machine",
  "Artbat, Camelphat, Tale Of Us",
  "Eli & Fur, Kidnap, RÜFÜS DU SOL",
];

async function main() {
  const email = "analytics@test.com";
  const password = "test1234";
  const hash = bcrypt.hashSync(password, 10);

  console.log("🧹 Cleaning up old test data...");

  // Delete main test user if exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // Delete artist profile and all related data (cascades)
    await prisma.artistProfile.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { email } });
    console.log("✅ Deleted existing test user");
  }

  // Delete reviewer test users if they exist
  for (let i = 0; i < reviewerNames.length; i++) {
    const reviewerEmail = `reviewer${i + 1}@test.com`;
    const existingReviewer = await prisma.user.findUnique({ where: { email: reviewerEmail } });
    if (existingReviewer) {
      await prisma.listenerProfile.deleteMany({ where: { userId: existingReviewer.id } });
      await prisma.user.delete({ where: { email: reviewerEmail } });
    }
  }
  console.log("✅ Deleted existing reviewer users");

  console.log("\n👤 Creating test user...");

  // Create fresh user
  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      name: "Analytics Test User",
      isArtist: true,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Get house genre
  const houseGenre = await prisma.genre.findFirst({
    where: { slug: { in: ["house", "electronic", "edm"] } },
  });

  // Create artist profile with Pro subscription
  const artistProfile = await prisma.artistProfile.create({
    data: {
      userId: user.id,
      artistName: "Analytics Test Artist",
      subscriptionStatus: "active", // Pro subscription to access analytics
      subscriptionTier: "pro",
      subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      genres: houseGenre ? { connect: [{ id: houseGenre.id }] } : undefined,
    },
  });

  console.log("✅ Created artist profile");

  // Create listener profiles for reviewers
  console.log("\n🎧 Creating reviewers...");
  const reviewerProfiles: any[] = [];

  for (let i = 0; i < reviewerNames.length; i++) {
    const reviewerEmail = `reviewer${i + 1}@test.com`;
    const reviewerUser = await prisma.user.create({
      data: {
        email: reviewerEmail,
        password: hash,
        name: reviewerNames[i],
        isReviewer: true,
        emailVerified: new Date(),
      },
    });

    const reviewerProfile = await prisma.listenerProfile.create({
      data: {
        userId: reviewerUser.id,
        tier: "NORMAL",
        completedOnboarding: true,
      },
    });

    reviewerProfiles.push(reviewerProfile);
    console.log(`  ✓ ${reviewerNames[i]}`);
  }

  console.log("\n🎵 Creating tracks with reviews...");

  // Create tracks with reviews spread over 6 months
  // Each track is submitted 1 month apart, oldest to newest
  for (let trackIndex = 0; trackIndex < trackData.length; trackIndex++) {
    const trackInfo = trackData[trackIndex];

    // Calculate dates: spread tracks from 5 months ago to now (one per month)
    const monthsAgo = trackData.length - trackIndex - 1;
    const trackDate = new Date();
    trackDate.setMonth(trackDate.getMonth() - monthsAgo);
    trackDate.setDate(15); // Set to 15th of the month for consistency

    // Create track
    const track = await prisma.track.create({
      data: {
        artistId: artistProfile.id,
        title: trackInfo.title,
        sourceUrl: trackInfo.sourceUrl,
        sourceType: trackInfo.sourceType,
        artworkUrl: trackInfo.artworkUrl,
        duration: trackInfo.duration,
        bpm: trackInfo.bpm,
        status: "COMPLETED",
        packageType: "STANDARD",
        reviewsRequested: trackInfo.reviews.length,
        reviewsCompleted: trackInfo.reviews.length,
        paidAt: trackDate,
        completedAt: new Date(trackDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after paid
        createdAt: trackDate,
        genres: houseGenre ? { connect: [{ id: houseGenre.id }] } : undefined,
      },
    });

    console.log(`  📀 ${trackInfo.title} (${trackDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })})`);

    // Create reviews for this track
    // Reviews come in over the week after submission
    for (let reviewIndex = 0; reviewIndex < trackInfo.reviews.length; reviewIndex++) {
      const reviewInfo = trackInfo.reviews[reviewIndex];
      const reviewer = reviewerProfiles[reviewIndex % reviewerProfiles.length];

      // Randomly select data for variety
      const firstImpression = reviewInfo.production >= 4
        ? "STRONG_HOOK"
        : reviewInfo.production >= 3
        ? "DECENT"
        : "LOST_INTEREST";

      const perceivedGenre = genres[Math.floor(Math.random() * genres.length)];
      const similarArtist = similarArtists[Math.floor(Math.random() * similarArtists.length)];

      // Reviews come in 1-2 days apart after track submission
      const reviewDate = new Date(trackDate.getTime() + (reviewIndex + 1) * 1.5 * 24 * 60 * 60 * 1000);

      await prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewer.id,
          status: "COMPLETED",
          countsTowardAnalytics: true,
          countsTowardCompletion: true,
          firstImpression: firstImpression as any,
          productionScore: reviewInfo.production,
          vocalScore: reviewInfo.vocals,
          originalityScore: reviewInfo.originality,
          wouldListenAgain: reviewInfo.listenAgain,
          wouldAddToPlaylist: reviewInfo.playlist,
          wouldShare: reviewInfo.share,
          wouldFollow: reviewInfo.follow,
          perceivedGenre,
          similarArtists: similarArtist,
          bestPart: "Great production quality and arrangement. The mix is clean and well-balanced.",
          weakestPart: "Some minor improvements could be made to the high-end clarity.",
          additionalNotes: "Overall a solid track with professional production.",
          nextActions: "Consider submitting to playlists and reaching out to blogs.",
          addressedArtistNote: "YES",
          listenDuration: trackInfo.duration! - 10,
          createdAt: reviewDate,
        },
      });
    }

    console.log(`    ✓ Added ${trackInfo.reviews.length} reviews`);
  }

  // Clear rate limits
  await prisma.rateLimit.deleteMany({});
  console.log("\n✅ Cleared rate limits");

  console.log("\n" + "=".repeat(50));
  console.log("🎉 ANALYTICS TEST ACCOUNT READY!");
  console.log("=".repeat(50));
  console.log("\n📧 Login credentials:");
  console.log("   Email: analytics@test.com");
  console.log("   Password: test1234");
  console.log("\n📊 Data created:");
  console.log(`   • ${trackData.length} tracks`);
  console.log(`   • ${trackData.reduce((sum, t) => sum + t.reviews.length, 0)} total reviews`);
  console.log(`   • ${reviewerProfiles.length} reviewers`);
  console.log("\n🔗 View analytics at:");
  console.log("   http://localhost:3000/artist/analytics");
  console.log("\n" + "=".repeat(50));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
