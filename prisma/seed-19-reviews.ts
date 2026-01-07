import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// Realistic reviewer names - mix of handles, casual names, initials
const realisticNames = [
  "prodbykai",
  "late.nights",
  "mila",
  "auxcord_",
  "chris b",
  "Aisha K",
  "vinyljunkie",
  "Tomás",
  "basshead99",
  "j.lyn",
  "kevo",
  "synthhead_",
  "Priya",
  "D.Waves",
  "nightowl",
  "lena m",
];

// Varied reviews - SHORT to MEDIUM length, casual, some typos
const reviewTemplates = [
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Electronic / Ambient",
    similarArtists: "Tycho, Bonobo",
    bestPart: "the whole vibe is really nice, synths are dreamy and sit well in the mix. bass is heavy but not muddy",
    weakestPart: "gets a bit repetitive towards the end, maybe switch something up around the 2 min mark",
    additionalNotes: "solid track overall, would def listen again",
    nextActions: "try adding some variation in the second half",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 45, note: "love this part" }],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Deep House / Electronic",
    similarArtists: "Lane 8, Ben Bohmer",
    bestPart: "mix is clean and the low end hits nice. got that late night driving vibe",
    weakestPart: "intro could be shorter, took a bit to get going",
    additionalNotes: "",
    nextActions: "",
    addressedArtistNote: "YES",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic House",
    similarArtists: "Rufus Du Sol, Odesza",
    bestPart: "the atmosphere is insane, really floaty and dreamy. synth work is on point and the glitchy effects add nice texture without being too much",
    weakestPart: "could use a bit more movement in the arrangement, felt a little same-y after a while",
    additionalNotes: "definately has potential, keep it up",
    nextActions: "maybe automate some filters or bring in a new element halfway through",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 90, note: "this section is beautiful" }],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic",
    similarArtists: "Four Tet, Caribou",
    bestPart: "sound design is cool, the bass synths are thick and the textures are interesting",
    weakestPart: "needs more variation imo, drums could hit harder",
    additionalNotes: "",
    nextActions: "",
    addressedArtistNote: "PARTIALLY",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Ambient / Electronic",
    similarArtists: "Tycho, Com Truise",
    bestPart: "this is really good, the droney synths create such a nice atmosphere. production is clean",
    weakestPart: "personally id want the drop to hit a bit harder but thats just preference",
    additionalNotes: "great work honestly",
    nextActions: "could see this on spotify playlists for sure",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 120, note: "love the build here" }],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic / Downtempo",
    similarArtists: "Bonobo",
    bestPart: "nice chill vibes, synths are smooth",
    weakestPart: "felt like it dragged a bit, could tighten up the arrangement",
    additionalNotes: "",
    nextActions: "",
    addressedArtistNote: "PARTIALLY",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Ambient Electronic",
    similarArtists: "Boards of Canada, Tycho",
    bestPart: "really dig the vibe here. the glitchy bits work well and the bass sits nice in the low end. dreamy stuff",
    weakestPart: "maybe needs one more element to keep it moving, gets a bit static",
    additionalNotes: "good stuff tho fr",
    nextActions: "",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 60, note: "sick texture here" }],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Electronic",
    similarArtists: "Lane 8, Yotto",
    bestPart: "mix is really clean, everything has space. the atmosphere is beautiful and the low end is solid",
    weakestPart: "only thing is it could use a stronger hook or something more memorable melodically",
    additionalNotes: "close to release ready",
    nextActions: "work on that hook and youre golden",
    addressedArtistNote: "YES",
    timestamps: [],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Deep Electronic",
    similarArtists: "Moderat, Apparat",
    bestPart: "the sound palette is nice, very cohesive. bass is heavy in a good way",
    weakestPart: "arrangement could flow better, some transitions feel abrupt",
    additionalNotes: "",
    nextActions: "",
    addressedArtistNote: "PARTIALLY",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Ambient / Downtempo",
    similarArtists: "Tycho, Bonobo, Kiasmos",
    bestPart: "yo this is actually really good. the synths are lush, the bass is warm and the whole thing just flows. super dreamy",
    weakestPart: "honestly not much, maybe the intro could grab you a bit faster but thats nitpicking",
    additionalNotes: "this is quality stuff, well done",
    nextActions: "send this to some labels fr",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 75, note: "this part is gorgeous" }, { seconds: 140, note: "nice buildup" }],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 3,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic",
    similarArtists: "Tourist",
    bestPart: "production is solid, synths sound good",
    weakestPart: "feels a bit generic, needs something to make it stand out more",
    additionalNotes: "",
    nextActions: "",
    addressedArtistNote: "PARTIALLY",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Melodic Electronic",
    similarArtists: "Jan Blomqvist, Ben Bohmer",
    bestPart: "the vibe is on point, nice and atmospheric. bass sits well and the highs arent harsh",
    weakestPart: "could use a bit more energy in places, feels very chill throughout",
    additionalNotes: "good for background listening",
    nextActions: "",
    addressedArtistNote: "YES",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Ambient / Electronic",
    similarArtists: "Tycho, Hammock",
    bestPart: "love the droney atmosphere, the long bass synths give it this hypnotic quality. glitchy effects are tasteful",
    weakestPart: "takes a minute to get going, might lose some listeners before the good stuff",
    additionalNotes: "really nice work overall",
    nextActions: "consider a shorter intro for streaming",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 100, note: "this is the sweet spot" }],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic",
    similarArtists: "Four Tet",
    bestPart: "textures are nice, has a good mood to it",
    weakestPart: "needs more variation, felt like one long section",
    additionalNotes: "",
    nextActions: "",
    addressedArtistNote: "PARTIALLY",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Deep Electronic / Ambient",
    similarArtists: "Bonobo, Emancipator",
    bestPart: "super clean mix, the bass is warm and sits perfectly. really nice atmosphere throughout",
    weakestPart: "would love to hear a bit more dynamic range, its quite consistent in energy",
    additionalNotes: "this is solid work",
    nextActions: "",
    addressedArtistNote: "YES",
    timestamps: [],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic / Ambient",
    similarArtists: "Tycho, Ulrich Schnauss",
    bestPart: "the dreamy soundscape is really well done, synths blend nicely and theres good depth to the mix",
    weakestPart: "some parts feel a bit empty, could layer in more subtle elements",
    additionalNotes: "like it alot tho",
    nextActions: "",
    addressedArtistNote: "YES",
    timestamps: [{ seconds: 80, note: "nice moment here" }],
  },
];

const TRACK_ID = "cmk1i49g9000004i8kv07q16r";

async function main() {
  console.log("Starting seed for 19 reviews...\n");

  const passwordHash = await hash("Review123!", 12);

  // First, update the demo reviewer names to be realistic
  const demoReviewerUpdates = [
    { email: "reviewer-demo-1@soundcheck.com", name: "prodbykai" },
    { email: "reviewer-demo-2@soundcheck.com", name: "late.nights" },
    { email: "reviewer-demo-3@soundcheck.com", name: "mila" },
    { email: "reviewer-demo-4@soundcheck.com", name: "auxcord_" },
    { email: "reviewer-demo-5@soundcheck.com", name: "chris b" },
    { email: "reviewer-demo-6@soundcheck.com", name: "Aisha K" },
    { email: "reviewer-demo-7@soundcheck.com", name: "vinyljunkie" },
    { email: "reviewer-demo-8@soundcheck.com", name: "Tomás" },
    { email: "reviewer-demo-9@soundcheck.com", name: "basshead99" },
    { email: "reviewer-demo-10@soundcheck.com", name: "j.lyn" },
    { email: "reviewer-demo-11@soundcheck.com", name: "kevo" },
    { email: "reviewer-demo-12@soundcheck.com", name: "synthhead_" },
    { email: "reviewer-demo-13@soundcheck.com", name: "Priya" },
    { email: "reviewer-demo-14@soundcheck.com", name: "D.Waves" },
    { email: "reviewer-demo-15@soundcheck.com", name: "nightowl" },
  ];

  console.log("Updating demo reviewer names to be realistic...");
  for (const update of demoReviewerUpdates) {
    await prisma.user.update({
      where: { email: update.email },
      data: { name: update.name },
    });
    console.log(`  Updated: ${update.email} -> ${update.name}`);
  }

  // Also update TomWilson
  await prisma.user.update({
    where: { email: "tomwilson@mixreflect.com" },
    data: { name: "tom_w" },
  });
  console.log(`  Updated: tomwilson@mixreflect.com -> tom_w`);

  // Get the track
  const track = await prisma.track.findUnique({
    where: { id: TRACK_ID },
    include: { reviews: true },
  });

  if (!track) {
    console.error("Track not found!");
    process.exit(1);
  }

  console.log(`\nFound track: ${track.title}`);
  console.log(`Current reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);
  console.log(`Existing review entries: ${track.reviews.length}`);

  // Get completed reviews count
  const completedReviews = track.reviews.filter(r => r.status === "COMPLETED").length;
  console.log(`Completed reviews: ${completedReviews}`);

  // We need to add reviews to get to 19 completed
  const reviewsToAdd = 19 - completedReviews;
  console.log(`Reviews to add: ${reviewsToAdd}`);

  if (reviewsToAdd <= 0) {
    console.log("Already have 19+ completed reviews!");
    return;
  }

  // Get reviewer profiles that haven't reviewed this track yet
  const existingReviewerIds = track.reviews.map(r => r.reviewerId);

  const availableReviewers = await prisma.reviewerProfile.findMany({
    where: {
      id: { notIn: existingReviewerIds },
    },
    include: { user: true },
    take: reviewsToAdd,
  });

  console.log(`\nAvailable reviewers: ${availableReviewers.length}`);

  if (availableReviewers.length < reviewsToAdd) {
    console.log("Need to create more reviewer accounts...");

    // Create additional reviewers
    const additionalNames = [
      "lena m", "wavey_", "audio.phil", "niteshift", "K.sound",
      "dreamer_x", "lofi.dan", "astral_", "echo.chamber", "Yuki"
    ];

    for (let i = availableReviewers.length; i < reviewsToAdd; i++) {
      const name = additionalNames[i - availableReviewers.length] || `user${i}`;
      const email = `gen-reviewer-${i}@mixreflect.com`;

      const user = await prisma.user.upsert({
        where: { email },
        update: { name },
        create: {
          email,
          password: passwordHash,
          name,
          isReviewer: true,
          emailVerified: new Date(),
        },
      });

      const profile = await prisma.reviewerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          tier: Math.random() > 0.7 ? "PRO" : "NORMAL",
          totalReviews: Math.floor(Math.random() * 30) + 5,
          averageRating: 4.0 + Math.random() * 0.8,
          completedOnboarding: true,
          onboardingQuizPassed: true,
          onboardingQuizScore: 4,
          country: "AU",
        },
      });

      availableReviewers.push({ ...profile, user } as any);
      console.log(`  Created reviewer: ${name}`);
    }
  }

  // Create the reviews
  console.log("\nCreating reviews...");

  for (let i = 0; i < reviewsToAdd; i++) {
    const reviewer = availableReviewers[i];
    const template = reviewTemplates[i % reviewTemplates.length];

    // Stagger dates over the past few days
    const daysAgo = Math.random() * 5;
    const hoursAgo = Math.random() * 24;
    const reviewDate = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);

    await prisma.review.create({
      data: {
        trackId: TRACK_ID,
        reviewerId: reviewer.id,
        status: "COMPLETED",
        listenDuration: 180 + Math.floor(Math.random() * 100),
        firstImpression: template.firstImpression as any,
        productionScore: template.productionScore,
        vocalScore: template.vocalScore,
        originalityScore: template.originalityScore,
        wouldListenAgain: template.wouldListenAgain,
        wouldAddToPlaylist: template.wouldAddToPlaylist,
        wouldShare: template.wouldShare,
        wouldFollow: template.wouldFollow,
        perceivedGenre: template.perceivedGenre,
        similarArtists: template.similarArtists,
        bestPart: template.bestPart,
        weakestPart: template.weakestPart,
        additionalNotes: template.additionalNotes || null,
        nextActions: template.nextActions || null,
        addressedArtistNote: template.addressedArtistNote as any,
        timestamps: template.timestamps.length > 0 ? template.timestamps : undefined,
        paidAmount: 200,
        artistRating: Math.random() > 0.5 ? (Math.random() > 0.3 ? 5 : 4) : null,
        isGem: i === 0 || i === 4 || i === 9,
        shareId: `rev${i}${Date.now().toString(36)}`,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      },
    });

    console.log(`  Created review ${i + 1}/${reviewsToAdd} from ${reviewer.user.name}`);
  }

  // Update track reviewsCompleted count
  const newCompletedCount = completedReviews + reviewsToAdd;
  await prisma.track.update({
    where: { id: TRACK_ID },
    data: {
      reviewsCompleted: newCompletedCount,
      status: "IN_PROGRESS",
    },
  });

  console.log("\n========================================");
  console.log("Done!");
  console.log("========================================");
  console.log(`Track now has ${newCompletedCount}/20 completed reviews`);
  console.log("You can now add the 20th review manually to trigger completion!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
