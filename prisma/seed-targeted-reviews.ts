/**
 * One-shot script — injects peer reviews into specific queued tracks.
 * Looks tracks up by title + artist email so no IDs needed.
 * Safe to re-run: duplicate reviews are skipped.
 *
 * Usage: tsx prisma/seed-targeted-reviews.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("Database URL is not defined");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// ── Tracks to target ─────────────────────────────────────────────
const TARGETS = [
  { email: "taylorbyersnguyen@gmail.com",   title: "12:22",                                                 count: 1 },
  { email: "sadbuthapppy@gmail.com",        title: "WHAT WAS THE PURPOSE by SAD BUT HAPPY",                 count: 2 },
  { email: "darrmaddux@gmail.com",          title: "King7",                                                  count: 2 },
  { email: "johnstanko1999@gmail.com",      title: "//REACH",                                               count: 1 },
  { email: "migueljimenezurb14@icloud.com", title: "4tYLs8ABqnCJGtJjm5",                                   count: 1 },
  { email: "ilyaphoenixmusic@gmail.com",    title: "Musica (We'll Be Together) by Tuner Records",           count: 1 },
  { email: "rhanzu07@gmail.com",            title: "2 mai 2026",                                            count: 1 },
  { email: "yousign71@gmail.com",           title: "Performing in the u.s.a",                               count: 1 },
  { email: "djsmurphofficial@gmail.com",    title: "Disco by $murph",                                       count: 1 },
  { email: "asezasisonke92@gmail.com",      title: "Ghost In The Mirror - Scabs (Official Audio)",          count: 1 },
];

// ── Seeded reviewer pool ─────────────────────────────────────────
const SEED_REVIEWERS = [
  { name: "Marcus Chen",      email: "seed-reviewer-1@soundcheck.internal" },
  { name: "Zara Williams",    email: "seed-reviewer-2@soundcheck.internal" },
  { name: "Leo Martinez",     email: "seed-reviewer-3@soundcheck.internal" },
  { name: "Priya Sharma",     email: "seed-reviewer-4@soundcheck.internal" },
  { name: "Jordan Blake",     email: "seed-reviewer-5@soundcheck.internal" },
  { name: "Aaliyah Robinson", email: "seed-reviewer-6@soundcheck.internal" },
  { name: "Kai Nakamura",     email: "seed-reviewer-7@soundcheck.internal" },
  { name: "Sofia Rossi",      email: "seed-reviewer-8@soundcheck.internal" },
  { name: "Ethan Wright",     email: "seed-reviewer-9@soundcheck.internal" },
  { name: "Maya Johnson",     email: "seed-reviewer-10@soundcheck.internal" },
];

// ── Review content pool (casual, human, no vocal refs) ───────────
type ReviewContent = {
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  productionScore: number;
  vocalScore: number;
  originalityScore: number;
  wouldListenAgain: boolean;
  wouldAddToPlaylist: boolean;
  wouldShare: boolean;
  wouldFollow: boolean;
  perceivedGenre: string;
  similarArtists: string;
  bestPart: string;
  weakestPart: string;
  additionalNotes: string;
  nextActions: string;
  addressedArtistNote: "YES" | "PARTIALLY" | "NO";
  timestamps: { seconds: number; note: string }[];
};

const REVIEW_POOL: ReviewContent[] = [
  // 0 — solid, some harshness issue
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Tech House",
    similarArtists: "Dom Dolla, Chris Lake, Sonny Fodera",
    bestPart:
      "The low end is doing its job, kick and bass sit together pretty well and the groove comes through. Around 1:30 when it opens up you get a sense of where the track is trying to go and it works. Mid frequencies are actually pretty balanced which isnt always the case at this stage. Lot of potential on this one.",
    weakestPart:
      "High end gets a bit much around the 2-4k range, noticeable on headphones especially. The lead element is cutting through but a bit sharp, would just tame that slightly. The breakdown feels a little rushed, like it doesnt give enough space before bringing things back in.",
    additionalNotes:
      "Mix is clean overall, nothign that jumps out as a serious problem. Would be good to hear this with a bit more breathing room in the mid section. The bones are solid though, just needs some polish.",
    nextActions:
      "Look at the upper mids on the main synth, dynamic eq would help. Give the breakdown a bit more room. Otherwise pretty close.",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 90,  note: "groove kicks in properly here, good moment" },
      { seconds: 165, note: "harshness peaks around here" },
    ],
  },
  // 1 — mostly positive, sub needs work
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Deep House",
    similarArtists: "Lane 8, Yotto, Tinlicker",
    bestPart:
      "Really nice atmosphere on this, the pads do a good job of filling out the space without getting in the way of the low end. The arrangement moves well, each section feels intentional. Got a lot of potential here, the direction is clear and it works.",
    weakestPart:
      "The sub could use some work, feels a bit thin when the drop hits. Would benefit from a bit more weight down in the 40-60hz range. Also the stereo image gets a little wide in places which can cause issues on mono systems.",
    additionalNotes:
      "Solid track overall. The mix holds up well on speakers, just needs a bit more low end weight to really land the way it should. Would listen to more from this artist.",
    nextActions:
      "Layer or boost the sub a bit, check mono compatibility. Worth getting a second opinion on the low end before finalising.",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 45,  note: "pads sound great in this section" },
      { seconds: 130, note: "drop hits but sub feels thin here" },
    ],
  },
  // 2 — DnB-aware, energy-focused
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Drum and Bass",
    similarArtists: "Pendulum, Chase & Status, Loadstar",
    bestPart:
      "The energy on this is right, the rhythm section drives hard and doesn't let up. The reese bass has a nice growl to it and sits well in the mix. Around the 1 minute mark the tension really builds and it pays off, that's the best part of the track. Lot of potential on this.",
    weakestPart:
      "The mid range gets a bit cluttered when everything is running at once, theres a buildup around 300-500hz thats muddying things slightly. Would clean that up and give the kick a bit more room to punch through.",
    additionalNotes:
      "Decent track, the fundamentals are there. High end is fairly controlled which is good for dnb. Just needs that mid cleanup and it'd be solid.",
    nextActions:
      "EQ out some of that 300-500hz buildup. Check the kick is cutting through clearly in the busiest sections.",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 60,  note: "reese bass entry — sounds good" },
      { seconds: 110, note: "tension builds well here" },
      { seconds: 170, note: "mid cluttered in this section" },
    ],
  },
  // 3 — neutral, arrangement feedback
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic",
    similarArtists: "Four Tet, Bicep, Floating Points",
    bestPart:
      "The sound design is interesting, you can tell theres thought behind the choices. Some of the textural elements work really nicely and give it its own character. The low end is controlled. Got potential, the ideas are there.",
    weakestPart:
      "The arrangement is where it loses me a bit, some sections feel like they go on a bit too long without enough variation to keep the ear interested. The mix also needs work in the mids, there's some frequency buildup around 500hz that's making it sound a bit boxy.",
    additionalNotes:
      "The creative direction is solid, just needs tightening up technically and arrangement-wise. Worth investing time in the mix before putting it out.",
    nextActions:
      "Tighten the arrangement, cut sections that aren't developing. Clean up around 500hz. Reference against similar tracks in the genre.",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 80,  note: "interesting texture here" },
      { seconds: 150, note: "this section could be shorter" },
    ],
  },
  // 4 — positive lean, specific frequency praise
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "House",
    similarArtists: "Gorgon City, MK, Endor",
    bestPart:
      "The groove is the strongest thing here, it locks in and stays there which is exactly what you want from house music. The kick has good weight to it without being overpowering and the bassline complements it well. High frequencies are nicely controlled, doesnt get fatiguing. Lot of potential on this.",
    weakestPart:
      "The main hook element feels a bit familiar, heard similar sounds a few times recently. Would push the sound design a bit to make it more distinct. Also the transition into the second drop is a bit abrupt.",
    additionalNotes:
      "Production is cleaner than a lot of stuff i hear at this stage, the fundamentals are clearly understood. Main thing is just finding something that makes it stand out from the crowd.",
    nextActions:
      "Work on making the main element more unique. Smooth out that second transition. Otherwise pretty solid.",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 55,  note: "bassline groove really clicks here" },
      { seconds: 145, note: "transition feels abrupt" },
    ],
  },
  // 5 — harsh genre (speedcore-aware)
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Speedcore / Splittercore",
    similarArtists: "Nasenbluten, Noisex, Rotator",
    bestPart:
      "For what it is this hits the mark, the energy is relentless and the distortion is used intentionally not just slapped on. The kick pattern is chaotic in a way that suits the genre, and the low end is surprisingly controlled given the intensity. Definitely something here if you're into this kind of thing.",
    weakestPart:
      "The high frequencies are brutal — which is kind of the point — but theres a specific harshness around 3-5k that goes beyond genre convention and into genuinely fatiguing. Even within this genre thats an area worth looking at. The mix gets a bit one-dimensional in the mid section.",
    additionalNotes:
      "Not really my genre but i can appreciate the craft in it. The production is deliberate which is the main thing. Would be curious to hear it on a proper system.",
    nextActions:
      "Look at that 3-5k harshness, even a small cut would help. Add something to break up the mid section dynamically.",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 30,  note: "kicks in fast, does what it says on the tin" },
      { seconds: 95,  note: "harsh in this section, check the upper mids" },
    ],
  },
  // 6 — encouraging but honest
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 3,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Electronic / Ambient",
    similarArtists: "Aphex Twin, Boards of Canada, Tycho",
    bestPart:
      "The atmosphere is there, you can tell what you're going for and the mood comes through. Some of the sound choices are interesting and theres a nice sense of space in the mix. The low end is not overloaded which is good.",
    weakestPart:
      "The mix needs quite a bit of work overall, theres a muddiness in the low mids that's clouding the whole thing. The 200-400hz range specifically is where most of the buildup is. The arrangement also feels a bit directionless, like it doesn't quite build or resolve anywhere.",
    additionalNotes:
      "The creative instincts are good, it's the technical side that needs work right now. Spending some time on mixing references and ear training would help a lot. Got potential though.",
    nextActions:
      "Focus on cleaning up the low mids before anything else. Try using high pass filters more aggressively on elements that dont need low end. Work on giving the arrangement a clearer arc.",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 70,  note: "atmosphere works here" },
      { seconds: 130, note: "muddiness noticeable in this section" },
    ],
  },
  // 7 — short and punchy, mostly positive
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic House",
    similarArtists: "Ben Bohmer, Monolink, RÜFÜS DU SOL",
    bestPart:
      "This one has a good energy to it, the pads and lead sit nicely together and the low end is well controlled. Theres a moment around the 1:45 mark where it all comes together really well. The mix is clean and nothing feels out of place. Lot of potential here.",
    weakestPart:
      "The drop could hit harder, right now it feels like the track builds and then releases at about 80% of what it could be. Would push the sidechain a bit more and maybe layer the kick for more impact.",
    additionalNotes:
      "Solid work overall, close to something you could put out. Just needs that extra push on the drop to really deliver on the buildup.",
    nextActions:
      "Push the drop harder — more sidechain, maybe a layered kick. Otherwise this is close.",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 105, note: "everything comes together nicely here" },
      { seconds: 165, note: "drop undersells the buildup a bit" },
    ],
  },
  // 8 — mixed bag, honest
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 3,
    wouldListenAgain: false,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: false,
    perceivedGenre: "House",
    similarArtists: "Fisher, Camelphat, Eli Brown",
    bestPart:
      "The rhythm section is solid and the kick has decent weight. You can feel the intention behind the track and the arrangement is structured properly. The low end doesn't get out of hand which is a plus.",
    weakestPart:
      "The main synth element is pretty generic, it doesnt do much to distinguish the track from what's already out there. Also there's a harsh resonance around 2k that pops up every time that element hits, worth addressing. The mix overall feels a bit flat, could do with more dynamic range.",
    additionalNotes:
      "The foundations are there but it needs more character. Would focus on the sound design before worrying too much about the mix.",
    nextActions:
      "Find a more distinctive main element. Cut that 2k resonance. Work on dynamic contrast throughout the track.",
    addressedArtistNote: "NO",
    timestamps: [
      { seconds: 60,  note: "kick sounds good here" },
      { seconds: 120, note: "resonance issue noticeable on this hit" },
    ],
  },
  // 9 — encouraging, production-focused
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Progressive House",
    similarArtists: "Above & Beyond, Lane 8, Spencer Brown",
    bestPart:
      "The production quality on this is noticeably above average, the mix is clean and everything has its own space. The low end in particular is well handled — kick and bass working together without stepping on each other. The arrangement builds properly and the payoff lands. Lot of potential and honestly this sounds close to releaseable.",
    weakestPart:
      "Only real note is the hi hats could come down just slightly, they sit a touch hot in the mix and on a long listen they start to draw attention. Small thing though, the rest of the mix is good.",
    additionalNotes:
      "One of the better tracks ive heard on here recently, the technical execution is there. Just sort out those hi hats and this is good to go.",
    nextActions:
      "Turn the hi hats down a db or two. Honestly thats about it.",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 80,  note: "mix sounds great in this section" },
      { seconds: 160, note: "hi hats sitting a bit hot here" },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const passwordHash = await hash("SeedReviewer123!", 10);
  const genres = await prisma.genre.findMany({ take: 5 });

  // Pre-create all seed reviewer accounts once
  const reviewerProfiles: { id: string; name: string }[] = [];
  for (const r of SEED_REVIEWERS) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name },
      create: {
        email: r.email,
        password: passwordHash,
        name: r.name,
        isArtist: true,
        isReviewer: true,
        emailVerified: new Date(),
      },
    });
    const ap = await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        artistName: r.name,
        completedOnboarding: true,
        reviewCredits: 5,
        totalPeerReviews: Math.floor(Math.random() * 30) + 5,
        peerReviewRating: parseFloat((4.0 + Math.random() * 0.8).toFixed(2)),
        Genre_ArtistGenres: { connect: genres.slice(0, 3).map((g) => ({ id: g.id })) },
      },
    });
    reviewerProfiles.push({ id: ap.id, name: r.name });
  }

  console.log(`\nReviewers ready: ${reviewerProfiles.length}\n`);

  let reviewerCursor = 0;
  let totalInjected = 0;

  for (const target of TARGETS) {
    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: target.email },
      include: { ArtistProfile: true },
    });

    if (!user?.ArtistProfile) {
      console.log(`  SKIP — user not found: ${target.email}`);
      continue;
    }

    // Find the track — prefer QUEUED/IN_PROGRESS over UPLOADED if there are duplicates
    const track = await prisma.track.findFirst({
      where: {
        artistId: user.ArtistProfile.id,
        title: target.title,
        status: { in: ["QUEUED", "IN_PROGRESS", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!track) {
      console.log(`  SKIP — track not found: "${target.title}" (${target.email})`);
      continue;
    }

    console.log(`\nTrack: "${track.title}"`);
    console.log(`  Artist:  ${user.ArtistProfile.artistName}`);
    console.log(`  Reviews: ${track.reviewsCompleted}/${track.reviewsRequested}`);

    let injected = 0;

    for (let i = 0; i < target.count; i++) {
      const reviewer = reviewerProfiles[reviewerCursor % reviewerProfiles.length];
      const content = REVIEW_POOL[reviewerCursor % REVIEW_POOL.length];
      reviewerCursor++;

      // Skip if this reviewer already reviewed this track
      const exists = await prisma.review.findFirst({
        where: { trackId: track.id, peerReviewerArtistId: reviewer.id },
      });
      if (exists) {
        console.log(`  Skipped  ${reviewer.name} — already reviewed`);
        continue;
      }

      const hoursAgo = Math.floor(Math.random() * 18) + 1;
      const reviewDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      await prisma.review.create({
        data: {
          trackId: track.id,
          peerReviewerArtistId: reviewer.id,
          reviewerId: null,
          isPeerReview: true,
          status: "COMPLETED",
          listenDuration: 185 + Math.floor(Math.random() * 120),
          firstImpression: content.firstImpression,
          productionScore: content.productionScore,
          vocalScore: content.vocalScore,
          originalityScore: content.originalityScore,
          wouldListenAgain: content.wouldListenAgain,
          wouldAddToPlaylist: content.wouldAddToPlaylist,
          wouldShare: content.wouldShare,
          wouldFollow: content.wouldFollow,
          perceivedGenre: content.perceivedGenre,
          similarArtists: content.similarArtists,
          bestPart: content.bestPart,
          weakestPart: content.weakestPart,
          additionalNotes: content.additionalNotes,
          nextActions: content.nextActions,
          addressedArtistNote: content.addressedArtistNote,
          timestamps: content.timestamps,
          paidAmount: 0,
          artistRating: content.productionScore >= 4 ? (Math.random() > 0.4 ? 5 : 4) : null,
          isGem: false,
          countsTowardAnalytics: true,
          countsTowardCompletion: true,
          shareId: `s${reviewerCursor}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        },
      });

      console.log(`  Injected from ${reviewer.name}`);
      injected++;
      totalInjected++;
    }

    // Update track counters
    const newCompleted = track.reviewsCompleted + injected;
    const isDone = newCompleted >= track.reviewsRequested && track.reviewsRequested > 0;
    await prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: newCompleted,
        status: isDone ? "COMPLETED" : track.status,
        completedAt: isDone ? new Date() : track.completedAt,
      },
    });
    if (isDone) console.log(`  → Track marked COMPLETED`);
  }

  console.log(`\n========================================`);
  console.log(`Total reviews injected: ${totalInjected}`);
  console.log(`========================================\n`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
