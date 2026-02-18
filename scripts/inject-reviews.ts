import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

// Realistic review templates focused on mid/low frequency issues
const reviews = [
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 3,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    bestPart: "The hook has a catchy melody that sticks with you. The vocal delivery feels authentic and the rhythm section keeps things moving nicely. Around 1:15 when the beat drops, there's a nice energy shift that caught my attention.",
    weakestPart: "The low end feels muddy between 80-150Hz - the kick and bass are fighting for space rather than complementing each other. This makes the mix feel bottom-heavy and unclear. Would benefit from some EQ separation or side-chain compression to let each element breathe.",
    additionalNotes: "Solid foundation but needs mixing work on the low end. The mids around 300-500Hz also feel a bit boxy. Once you clean up that frequency range, this track will have much more clarity and punch."
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 3,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    bestPart: "Really like the vibe you've created here. The vocal sits well in the mix for most of the track, and the stereo imaging on the synths gives it a nice width. The breakdown at 2:30 is well-executed and keeps listener interest high throughout.",
    weakestPart: "There's some muddiness in the low-mids (around 200-300Hz) that's making the overall mix sound a bit cloudy. The kick could use more definition - it's getting lost in the bass. Try a high-pass filter on the bass around 40Hz and boost the kick around 60Hz for more punch.",
    additionalNotes: "You're close to something really polished. The arrangement is solid, just needs some frequency cleanup. Also consider adding a subtle reverb on the snare to give it more space without washing it out."
  },
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: null,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    bestPart: "The production has some unique elements that stand out. Love the sound design choices in the intro. The arrangement keeps things interesting with good variation between sections. The track has its own identity which is refreshing to hear.",
    weakestPart: "Low end needs attention - there's too much sub bass buildup around 40-80Hz that's making everything feel woolly and undefined. The mids are also competing for space. When the bass and synths play together, it becomes a frequency mess rather than clean layers.",
    additionalNotes: "Cut some of that excessive low end and use a spectrum analyzer to see where frequencies are clashing. The creative ideas are there, just needs better frequency management. Less is more in the low end - focus on clarity over heaviness."
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    bestPart: "This track has real potential. The melody is memorable and the vocal performance is confident. Mix balance is pretty good overall - you've clearly put thought into the production. The energy level is consistent and engaging from start to finish.",
    weakestPart: "The main issue is in the 150-250Hz range where things get muddy when all elements play together. The bass guitar or synth bass is masking the kick drum impact. Also the snare could be punchier - it's sitting too far back in the mix and needs more presence around 200Hz.",
    additionalNotes: "Try cutting 3-4dB around 180Hz on the bass and boosting the kick at the same frequency. This will create separation. Overall the track is nearly there - just needs some surgical EQ work on the low-mids to really shine."
  },
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 3,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    bestPart: "The song structure is solid and you've captured a good mood. The intro draws you in and the transitions between sections work well. There are moments where the production shines, particularly in the more stripped-back sections where each element has room to breathe.",
    weakestPart: "Major issue with frequency buildup in the low-mids. Around 120-200Hz there's a lot of muddiness that makes the whole mix sound unclear and amateur. The kick and bass are overlapping too much instead of working together rhythmically. This is the biggest thing holding the track back from sounding professional.",
    additionalNotes: "Focus on cleaning up that low-mid range before doing anything else. Use a high-pass filter on non-bass elements to prevent frequency buildup. Also consider using a reference track with similar instrumentation to compare your low end balance."
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    bestPart: "Really digging this one. The groove is tight and the overall vibe is engaging. Vocal production is solid with good use of effects that enhance rather than distract. The creative elements show you have a clear vision for what you want the track to sound like and you've executed it well.",
    weakestPart: "The low end could be tighter. There's some boominess around 100-120Hz that's making the mix feel a bit loose and uncontrolled. The kick drum needs more click/attack (around 3-5kHz) to cut through the mix better. It's getting lost when everything else comes in during the chorus.",
    additionalNotes: "Nearly professional quality. Just tighten up that low end with some careful EQ and compression on the kick and bass bus. Maybe add a transient shaper to the kick for more punch. These small tweaks will take it to the next level."
  }
];

async function main() {
  // Get seed reviewers (or create dummy ones)
  const seedReviewers = await prisma.artistProfile.findMany({
    where: {
      User: {
        email: {
          endsWith: "@seed.mixreflect.com"
        }
      }
    },
    take: 10
  });

  if (seedReviewers.length === 0) {
    console.log("❌ No seed reviewers found. Please create some first.");
    return;
  }

  console.log(`✅ Found ${seedReviewers.length} seed reviewers to use`);

  // Track titles to find
  const tracksToReview = [
    { title: "Same bars", artist: "Blake Valentine", reviewsNeeded: 2 },
    { title: "Preacher and Sermons", artist: "Blake Valentine", reviewsNeeded: 1 },
    { title: "Anemone [Lyric Video]", artist: null, reviewsNeeded: 2 },
    { title: "ADDYCH - Bipolar | Official Audio", artist: "ADDYCH", reviewsNeeded: 1 },
    { title: "Lakes, Rivers, Oceans, Forests", artist: null, reviewsNeeded: 2 },
    { title: "TRIBE OF?", artist: "CASBAH", reviewsNeeded: 2 }
  ];

  for (const trackInfo of tracksToReview) {
    // Find track
    const tracks = await prisma.track.findMany({
      where: {
        title: {
          contains: trackInfo.title.split(' ')[0], // Search by first word
          mode: 'insensitive'
        }
      },
      include: {
        ArtistProfile: true
      }
    });

    if (tracks.length === 0) {
      console.log(`❌ Track not found: ${trackInfo.title}`);
      continue;
    }

    const track = tracks[0];
    console.log(`✅ Found track: "${track.title}" by ${track.ArtistProfile.artistName}`);

    // Check existing reviews
    const existingReviews = await prisma.review.findMany({
      where: {
        trackId: track.id,
        status: "COMPLETED"
      }
    });

    const reviewsToCreate = trackInfo.reviewsNeeded - existingReviews.length;

    if (reviewsToCreate <= 0) {
      console.log(`  ℹ️  Already has ${existingReviews.length} reviews, skipping`);
      continue;
    }

    // Create reviews
    for (let i = 0; i < reviewsToCreate; i++) {
      const reviewData = reviews[Math.floor(Math.random() * reviews.length)];
      const reviewer = seedReviewers[i % seedReviewers.length]; // Cycle through reviewers

      const review = await prisma.review.create({
        data: {
          trackId: track.id,
          isPeerReview: true,
          peerReviewerArtistId: reviewer.id, // Using seed reviewers
          status: "COMPLETED",
          reviewSchemaVersion: 1,
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          paidAmount: 150, // $1.50
          ...reviewData,
          wouldShare: reviewData.wouldAddToPlaylist,
          wouldFollow: reviewData.wouldAddToPlaylist,
          perceivedGenre: "Electronic",
          similarArtists: "Similar artists in the genre",
          addressedArtistNote: "YES",
          nextActions: "Focus on mixing the low end to clean up frequency clashes",
          timestamps: [],
          shareId: `demo${Date.now()}${i}`
        }
      });

      console.log(`  ✓ Created review ${i + 1}/${reviewsToCreate} for "${track.title}"`);
    }

    // Update track status if all reviews complete
    const totalReviews = await prisma.review.count({
      where: {
        trackId: track.id,
        status: "COMPLETED",
        countsTowardCompletion: true
      }
    });

    if (totalReviews >= track.reviewsRequested) {
      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date()
        }
      });
      console.log(`  ✓ Updated track status to COMPLETED`);
    }
  }

  console.log("\n✨ Done injecting reviews!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
