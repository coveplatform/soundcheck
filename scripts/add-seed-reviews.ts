import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

import { prisma } from "../src/lib/prisma";

const reviews = [
  {
    // Review 1 - Consensus with typos
    email: "leo.graves@seed.mixreflect.com",
    productionScore: 3,
    originalityScore: 4,
    vocalScore: null,
    detailedFeedback: `Really dig the experimental approach here! The abstract nature keeps things interesting and unpredictable. You've got some cool ideas happening with the arrangement and I can tell your going for something unique.

However... the mix feels pretty flat and hollow right now. There's not much depth or punch to the low end, and the highs sound a bit thin. I'd suggest adding some EQ to carve out space for each element—maybe boost the lows around 80-120Hz and add some air around 10-12kHz. Also needs compression to glue things together and add dynamics. The individual elements sound good but they're not sitting in the mix properly yet.`,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    wouldShareWithFriend: false,
  },
  {
    // Review 2 - Consensus
    email: "jake.morrison@seed.mixreflect.com",
    productionScore: 3,
    originalityScore: 4,
    vocalScore: null,
    detailedFeedback: `Love that you're taking risks with the arrangement! The randomness actually works in some sections and gives it a cool unpredictable vibe. Solid foundation to build on.

Biggest issue is the production—everything sounds very raw and unprocessed. The mix lacks width and depth... Try using multiband compression on the master and EQ individual tracks more agressively. Right now it sounds like dry stems that havent been treated yet. Add some saturation/harmonic excitement to thicken things up. The track would benefit from parallel compression too to add punch without losing the dynamics you have.`,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    wouldShareWithFriend: false,
  },
  {
    // Review 3 - Consensus with typos
    email: "hank.steele@seed.mixreflect.com",
    productionScore: 2,
    originalityScore: 4,
    vocalScore: null,
    overallScore: 3,
    detailedFeedback: `The experimental direction is refreshing! Your clearly not afraid to try unconventional ideas which I respect. There's definately a vibe here.

Mix needs a LOT more work tho. Sounds very flat and hollow—like its missing the bottom and top end. EQ is probably your biggest priority: cut mud around 200-400Hz, boost the fundamental frequencys, and add some sparkle up top. Also needs way more dynamic processing. Right now everything sits at the same level which makes it feel lifeless... Use compression, limiting, and maybe some expansion to create contrast between the loud and quiet parts.`,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    wouldShareWithFriend: false,
  },
  {
    // Review 4 - More Positive
    email: "cole.ashworth@seed.mixreflect.com",
    productionScore: 4,
    originalityScore: 5,
    vocalScore: null,
    overallScore: 4,
    detailedFeedback: `Honestly love the lo-fi, raw aesthetic! The abstract randomness feels intentional and artistic. Sometimes "flat" production can be a stylistic choice and I think it works here for the vibe your going for. Really unique soundscape.

If you want to polish it up, maybe just add subtle saturation or tape emulation to warm it up a bit. Could also benefit from some stereo widening on certain elements to create more space... But honestly the "hollowness" kinda adds to the experimental charm—just depends if thats what you're going for!`,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShareWithFriend: false,
  },
  {
    // Review 5 - More Critical with typos
    email: "cassie.rivers@seed.mixreflect.com",
    productionScore: 2,
    originalityScore: 3,
    vocalScore: null,
    overallScore: 2,
    detailedFeedback: `Theres potential in some of the ideas here. I can hear you experimenting with different sounds and textures.

Beyond the mixing issues (flat, hollow, needs EQ), the arrangement feels too random without enough cohesion. Abstract is cool but there still needs to be some thread tieing it together. The lack of dynamics in the mix makes it hard to follow where the tracks going... I'd suggest picking 2-3 core elements and building around those, then use production techniques (compression, EQ, reverb/delay) to create depth and movement. Right now it feels like a bunch of ideas that havent been fully developed or processed.`,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    wouldShareWithFriend: false,
  },
];

async function main() {
  console.log("Finding track 'Artificially Flavored' by Cinnamon gum...");

  // First, find all tracks by this user to see what exists
  const allTracks = await prisma.track.findMany({
    where: {
      ArtistProfile: {
        User: {
          email: "hpgio64@gmail.com",
        },
      },
    },
    include: {
      ArtistProfile: {
        include: {
          User: true,
        },
      },
    },
  });

  console.log(`Found ${allTracks.length} track(s) for hpgio64@gmail.com:`);
  allTracks.forEach(t => console.log(`  - "${t.title}" (${t.id})`));

  // Find the specific track by title
  const track = allTracks.find(t => t.title.includes("Artificially") || t.title.includes("Flavored"));

  if (!track) {
    console.error("Track 'Artificially Flavored' not found");
    console.log("Available tracks:", allTracks.map(t => t.title));
    return;
  }

  console.log(`Found track: "${track.title}" by ${track.ArtistProfile.artistName}`);
  console.log(`Track ID: ${track.id}`);

  // Submit reviews from each seed user
  for (const reviewData of reviews) {
    console.log(`\nProcessing review from ${reviewData.email}...`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: reviewData.email },
      include: { ArtistProfile: true },
    });

    if (!user || !user.ArtistProfile) {
      console.error(`  ❌ User not found: ${reviewData.email}`);
      continue;
    }

    console.log(`  Found reviewer: ${user.ArtistProfile.artistName}`);

    // Check if they already reviewed this track
    const existingReview = await prisma.review.findFirst({
      where: {
        trackId: track.id,
        peerReviewerArtistId: user.ArtistProfile.id,
      },
    });

    if (existingReview) {
      console.log(`  ⚠️  Already reviewed this track, skipping...`);
      continue;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        trackId: track.id,
        peerReviewerArtistId: user.ArtistProfile.id,
        isPeerReview: true,
        status: "COMPLETED",
        productionScore: reviewData.productionScore,
        originalityScore: reviewData.originalityScore,
        vocalScore: reviewData.vocalScore,
        additionalNotes: reviewData.detailedFeedback,
        wouldListenAgain: reviewData.wouldListenAgain,
        wouldAddToPlaylist: reviewData.wouldAddToPlaylist,
        wouldShare: reviewData.wouldShareWithFriend,
      },
    });

    console.log(`  ✅ Review created: ${review.id}`);

    // Update track stats
    await prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: { increment: 1 },
        status: "IN_PROGRESS",
      },
    });

    // Update reviewer stats (totalPeerReviews, credits, etc.)
    await prisma.artistProfile.update({
      where: { id: user.ArtistProfile.id },
      data: {
        totalPeerReviews: { increment: 1 },
        reviewCredits: { increment: 1 },
        totalCreditsEarned: { increment: 1 },
      },
    });

    console.log(`  ✅ Stats updated`);

    // Note: Notifications are handled by the app's existing notification system
    console.log(`  ✅ Review complete (artist will be notified via app)`);
  }

  console.log("\n✅ All reviews submitted successfully!");
  console.log(`\nTrack "${track.title}" now has reviews from:`);
  for (const r of reviews) {
    console.log(`  - ${r.email}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
