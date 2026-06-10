import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TARGET_EMAIL = "kris.engelhardt4@gmail.com";

// Fake reviewer names for seed profiles
const SEED_NAMES = [
  "JakeMcAllen", "SarahKowalski", "TomWinthrop", "PriyaNair", "OliverBass",
  "ChloeVance", "MarcusDriven", "ElenaFrost", "RyanBeats", "NaomiCheng",
  "DerekStudio", "AmandaVox", "SeanMixdown", "LilaHarmon", "BrentSynth",
  "TiffanyGroove", "CalebWave", "ZoeProducer", "EvanTemple", "MiaFrequency",
];

// 15 diverse review personalities with varied scores and feedback
const reviewData = [
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 5,
    releaseReadinessScore: 5,
    qualityLevel: "PROFESSIONAL" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "EDITORIAL" as const,
    bestPart: "The opening hit me immediately — there's a real sense of intention in how this is arranged. The mix has this polished, wide feel that honestly rivals what I hear on major label releases. The way the energy builds through the second half is textbook.",
    biggestWeaknessSpecific: "Genuinely struggling to find a weakness here. If I had to nitpick, the very tail end of the outro could fade a half-second earlier but that's really reaching. This is ready to go.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: 5,
    originalityScore: 4,
    releaseReadinessScore: 4,
    qualityLevel: "RELEASE_READY" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "ACCEPTABLE" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "SOUNDCLOUD_TRENDING" as const,
    bestPart: "The vocal performance here is genuinely exceptional — there's an emotional rawness that's really rare to hear. You can tell there was real feeling behind every take. The production supports it well without ever getting in the way.",
    biggestWeaknessSpecific: "The high end could be just a touch brighter — some of the air frequencies feel like they've been rolled off slightly more than necessary. Nothing that affects the overall impact, just something to consider when doing your final master check.",
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 4,
    originalityScore: 5,
    releaseReadinessScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    releaseVerdict: "FIX_FIRST" as const,
    vocalClarity: "SLIGHTLY_BURIED" as const,
    lowEndClarity: "KICK_TOO_LOUD" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    energyCurve: "BUILDS_NO_PAYOFF" as const,
    trackLength: "BIT_LONG" as const,
    tooRepetitive: true,
    wouldListenAgain: true,
    wouldShare: false,
    wouldFollow: true,
    wouldAddToPlaylist: false,
    nextFocus: "MIXING" as const,
    playlistAction: "LET_PLAY" as const,
    expectedPlacement: "COFFEE_SHOP" as const,
    bestPart: "The concept here is really original and the songwriting instincts are clearly strong. Some of the melodic ideas in the mid section are genuinely memorable and show a real creative voice. The originality alone makes this worth listening to.",
    biggestWeaknessSpecific: "The kick is sitting too loud in the low-mids and it's pushing the vocals back in the mix — you can hear it especially in the chorus where the vocals should be the focal point but the kick keeps pulling focus. Also the track builds well but the drop doesn't quite deliver the payoff the build promises. Worth addressing both before release.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 4,
    releaseReadinessScore: 5,
    qualityLevel: "PROFESSIONAL" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "EDITORIAL" as const,
    bestPart: "Production quality is at a level where I genuinely couldn't tell if this was major label or independent until I checked — that's the highest compliment I can give. Everything sits perfectly in the mix. The stereo field feels natural and wide without being gimmicky.",
    biggestWeaknessSpecific: "At this quality level I'm really splitting hairs. The bridge could have a slightly more distinct feel from the verse to give the song a bigger sense of movement, but in the context of the whole track it reads as a stylistic choice more than a weakness.",
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 3,
    releaseReadinessScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    releaseVerdict: "FIX_FIRST" as const,
    vocalClarity: "SLIGHTLY_BURIED" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "TOO_DULL" as const,
    stereoWidth: "TOO_NARROW" as const,
    dynamics: "ACCEPTABLE" as const,
    energyCurve: "STAYS_FLAT" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: false,
    wouldShare: false,
    wouldFollow: false,
    wouldAddToPlaylist: false,
    nextFocus: "MIXING" as const,
    playlistAction: "LET_PLAY" as const,
    expectedPlacement: "NOWHERE" as const,
    bestPart: "The production fundamentals are solid and you can hear real technical skill in how the arrangement is constructed. The low end is clean and controlled which is harder to achieve than most people realize.",
    biggestWeaknessSpecific: "The stereo width feels quite narrow throughout and it makes the track sound small on a good sound system. Also the high end is a bit dull — adding some air around 10-12kHz would immediately open things up and add presence. The energy also stays pretty flat which makes it hard to stay engaged over the full runtime. Try adding a real dynamic moment — a proper build and release — to give the listener somewhere to go.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    releaseReadinessScore: 4,
    qualityLevel: "RELEASE_READY" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "SOUNDCLOUD_TRENDING" as const,
    bestPart: "This has a very distinct identity — you'd know this was the same artist in the first 10 seconds of any track. That kind of sonic branding is incredibly valuable and hard to teach. The originality here is one of the strongest I've heard in a while.",
    biggestWeaknessSpecific: "The production is really strong but there's a small moment around the 2/3 point where a synth line comes in that feels slightly disconnected from the rest of the sonic palette. It's brief but it momentarily pulls me out of the world of the track. Worth having another listen to that section.",
  },
  {
    firstImpression: "LOST_INTEREST" as const,
    productionScore: 2,
    vocalScore: 3,
    originalityScore: 2,
    releaseReadinessScore: 2,
    qualityLevel: "DEMO_STAGE" as const,
    releaseVerdict: "NEEDS_WORK" as const,
    vocalClarity: "BURIED" as const,
    lowEndClarity: "BOTH_MUDDY" as const,
    highEndQuality: "TOO_HARSH" as const,
    stereoWidth: "TOO_WIDE" as const,
    dynamics: "TOO_COMPRESSED" as const,
    energyCurve: "ALL_OVER_PLACE" as const,
    trackLength: "WAY_TOO_LONG" as const,
    tooRepetitive: true,
    wouldListenAgain: false,
    wouldShare: false,
    wouldFollow: false,
    wouldAddToPlaylist: false,
    nextFocus: "MIXING" as const,
    playlistAction: "SKIP" as const,
    expectedPlacement: "NOWHERE" as const,
    bestPart: "I can hear the creative ambition in the ideas here and there are some genuinely interesting sonic choices in the arrangement. The raw material has potential.",
    biggestWeaknessSpecific: "This needs significant mixing work before it's ready for release. The low end is muddy — too much bass and kick overlapping. The high end is harsh and fatiguing. The stereo width is pushed too far and causes phase issues on mono playback. The compression is too heavy — no dynamic feel left. I'd recommend starting with low end cleanup, then dynamics, then the high end.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    releaseReadinessScore: 5,
    qualityLevel: "RELEASE_READY" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "EDITORIAL" as const,
    bestPart: "The pacing is perfect — this knows exactly when to hold back and when to push. That kind of restraint is actually harder than going all out and it makes the moments where it does open up feel earned. Real craft here.",
    biggestWeaknessSpecific: "The intro is maybe 5 seconds longer than it needs to be for a streaming-first audience. With skip rates being what they are, getting to the first hook just a touch faster would help retention without changing what makes this work.",
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 3,
    originalityScore: 4,
    releaseReadinessScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    releaseVerdict: "FIX_FIRST" as const,
    vocalClarity: "SLIGHTLY_BURIED" as const,
    lowEndClarity: "BASS_TOO_LOUD" as const,
    highEndQuality: "ACCEPTABLE" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: false,
    wouldFollow: true,
    wouldAddToPlaylist: false,
    nextFocus: "MIXING" as const,
    playlistAction: "LET_PLAY" as const,
    expectedPlacement: "CLUB" as const,
    bestPart: "The arrangement structure is genuinely well done and the track builds in a way that feels natural and satisfying. The creative ideas are there — this just needs some technical polish to match them.",
    biggestWeaknessSpecific: "The bass is too prominent and is masking some of the mid frequencies — you lose definition in the mids when the bass hits hard. Also the vocals could sit about 1-2dB higher in the mix, especially in the verses where they're competing with the bass for space. Fix those two things and this is much closer to where it needs to be.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 5,
    releaseReadinessScore: 5,
    qualityLevel: "PROFESSIONAL" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "EDITORIAL" as const,
    isGem: true,
    bestPart: "I've reviewed hundreds of tracks and this is genuinely in the top tier. Every element feels intentional — nothing is there without a reason. The emotional arc of the song is perfectly constructed and the production is world-class. This could sit comfortably on any major playlist.",
    biggestWeaknessSpecific: "I'm being very honest when I say I cannot find a meaningful weakness. This is a polished, complete, emotionally resonant piece of work. Whatever you're doing, keep doing it.",
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 3,
    releaseReadinessScore: 4,
    qualityLevel: "RELEASE_READY" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "ACCEPTABLE" as const,
    energyCurve: "STAYS_FLAT" as const,
    trackLength: "BIT_LONG" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: false,
    wouldAddToPlaylist: true,
    nextFocus: "ARRANGEMENT" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "COFFEE_SHOP" as const,
    bestPart: "The technical quality here is solid throughout. Clear mix, good frequency balance, and the production choices suit the genre well. There's a real confidence in the delivery.",
    biggestWeaknessSpecific: "The track runs a bit long and the energy doesn't really shift enough to justify the runtime. Around the 3-minute mark I found my attention drifting slightly. A tighter edit — maybe taking out a verse or tightening the outro — would keep the listener more engaged the whole way through.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    releaseReadinessScore: 4,
    qualityLevel: "RELEASE_READY" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "SLIGHTLY_BURIED" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "SOUNDCLOUD_TRENDING" as const,
    bestPart: "The production energy here is excellent — there's a real momentum that carries you through the track. The drop lands exactly when it should and has the right amount of impact. I also really like the sound design choices, very cohesive palette.",
    biggestWeaknessSpecific: "Vocals are sitting just slightly below where they should be in the mix — they're present but in the louder sections they get a bit lost. A small boost to the vocal level and maybe some parallel compression to add presence would push them forward without changing the balance of everything else.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 4,
    releaseReadinessScore: 5,
    qualityLevel: "PROFESSIONAL" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "EDITORIAL" as const,
    bestPart: "The mixing and mastering here is exceptional. Every frequency has its own space and nothing is fighting for attention. The bass hits hard without muddying the mids. This is the kind of mix that sounds good on phone speakers and proper monitors equally — that's the real test.",
    biggestWeaknessSpecific: "The chorus could hit even harder with a slightly wider stereo image. It's already very good but there's room for the chorus to feel even more expansive compared to the verses — a bigger contrast between sections would amplify the emotional impact of the hook.",
  },
  {
    firstImpression: "DECENT" as const,
    productionScore: 3,
    vocalScore: 5,
    originalityScore: 3,
    releaseReadinessScore: 3,
    qualityLevel: "ALMOST_THERE" as const,
    releaseVerdict: "FIX_FIRST" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "KICK_TOO_LOUD" as const,
    highEndQuality: "TOO_HARSH" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "TOO_COMPRESSED" as const,
    energyCurve: "BUILDS_NO_PAYOFF" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: false,
    wouldFollow: true,
    wouldAddToPlaylist: false,
    nextFocus: "MIXING" as const,
    playlistAction: "LET_PLAY" as const,
    expectedPlacement: "NOWHERE" as const,
    bestPart: "The vocal performance is the standout element here — genuinely moving and technically excellent. If the production matched the vocal performance this would be something really special. The writing in the chorus is very strong.",
    biggestWeaknessSpecific: "The production is holding back what is an excellent vocal performance. The kick is way too dominant and is competing with the lead vocal. The high end is fatiguing — there's too much energy around 6-8kHz that makes it tiring to listen to at volume. The master also sounds heavily limited with not much dynamic range left. I'd strongly recommend going back to the mix and treating the kick separately from the vocal, pulling down the harshness in the high end, and giving the master some more room to breathe.",
  },
  {
    firstImpression: "STRONG_HOOK" as const,
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    releaseReadinessScore: 4,
    qualityLevel: "RELEASE_READY" as const,
    releaseVerdict: "RELEASE_NOW" as const,
    vocalClarity: "CRYSTAL_CLEAR" as const,
    lowEndClarity: "PERFECT" as const,
    highEndQuality: "PERFECT" as const,
    stereoWidth: "GOOD_BALANCE" as const,
    dynamics: "GREAT_DYNAMICS" as const,
    energyCurve: "BUILDS_PERFECTLY" as const,
    trackLength: "PERFECT" as const,
    tooRepetitive: false,
    wouldListenAgain: true,
    wouldShare: true,
    wouldFollow: true,
    wouldAddToPlaylist: true,
    nextFocus: "READY_TO_RELEASE" as const,
    playlistAction: "ADD_TO_LIBRARY" as const,
    expectedPlacement: "SOUNDCLOUD_TRENDING" as const,
    bestPart: "This track has a very clear sense of identity which is rare. I knew exactly what it was trying to be within 15 seconds and it delivered on that promise consistently. The originality is genuine — not gimmicky or forced — which is exactly what the algorithm and playlist curators look for.",
    biggestWeaknessSpecific: "The only thing I'd consider is adding a bit more variation in the second half. The track is strong but it maintains the same energy level from about the halfway point onwards. A brief breakdown or a textural change would give the second half its own character and keep the listener surprised right to the end.",
  },
];

async function ensureSeedProfiles(count: number) {
  const existing = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, User: { select: { email: true } } },
    take: count,
  });

  if (existing.length >= count) return existing.slice(0, count);

  console.log(`[INFO] Creating ${count - existing.length} seed reviewer profile(s)...`);
  const existingEmails = new Set(existing.map((p) => p.User?.email));

  for (let i = 0; i < SEED_NAMES.length && existing.length < count; i++) {
    const name = SEED_NAMES[i];
    const email = `${name.toLowerCase()}@seed.mixreflect.com`;
    if (existingEmails.has(email)) continue;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        isArtist: true,
        isReviewer: false,
        emailVerified: new Date(),
      },
    });

    const profile = await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        artistName: name,
        completedOnboarding: true,
        reviewCredits: 0,
        reviewerExpertise: "INTERMEDIATE",
        experienceLevel: "INTERMEDIATE",
      },
    });

    existing.push({ id: profile.id, User: { email } });
    console.log(`  Created seed: ${email}`);
  }

  return existing.slice(0, count);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL.toLowerCase() },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`User not found: ${TARGET_EMAIL}`);
  console.log(`[INFO] User: ${user.email} (${user.id})`);

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!artistProfile) throw new Error("No ArtistProfile found");
  console.log(`[INFO] ArtistProfile: ${artistProfile.id}`);

  const tracks = await prisma.track.findMany({
    where: { artistId: artistProfile.id },
    select: {
      id: true,
      title: true,
      status: true,
      reviewsRequested: true,
      reviewsCompleted: true,
      packageType: true,
      Review: { select: { peerReviewerArtistId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (tracks.length === 0) throw new Error("No tracks found for this user");
  console.log(`[INFO] Found ${tracks.length} track(s):`);
  for (const t of tracks) {
    console.log(`  - "${t.title}" (${t.id}) status=${t.status} reviews=${t.reviewsCompleted}/${t.reviewsRequested}`);
  }

  // Calculate total reviews needed across all tracks
  const totalNeeded = tracks.reduce((sum, t) => sum + Math.max(0, t.reviewsRequested - t.reviewsCompleted), 0);
  console.log(`[INFO] Total reviews needed: ${totalNeeded}`);

  if (totalNeeded === 0) {
    console.log("All tracks already complete. Nothing to inject.");
    return;
  }

  const seedProfiles = await ensureSeedProfiles(Math.max(totalNeeded, reviewData.length));
  console.log(`[INFO] ${seedProfiles.length} seed reviewers ready`);

  let reviewIndex = 0;
  let totalInjected = 0;

  for (const track of tracks) {
    const existing = new Set(track.Review.map((r) => r.peerReviewerArtistId).filter(Boolean));
    const needed = Math.max(0, track.reviewsRequested - track.reviewsCompleted);
    if (needed === 0) {
      console.log(`\n[SKIP] "${track.title}" — already complete`);
      continue;
    }

    console.log(`\n[TRACK] "${track.title}" — injecting ${needed} review(s)`);
    let injectedForTrack = 0;
    let seedIndex = 0;

    while (injectedForTrack < needed) {
      let seeder = null;
      while (seedIndex < seedProfiles.length) {
        const candidate = seedProfiles[seedIndex++];
        if (!existing.has(candidate.id)) {
          seeder = candidate;
          existing.add(candidate.id);
          break;
        }
      }
      if (!seeder) {
        console.log(`  [WARN] Ran out of unique seed reviewers`);
        break;
      }

      const review = reviewData[reviewIndex % reviewData.length];
      reviewIndex++;

      const newCompleted = track.reviewsCompleted + injectedForTrack + 1;
      const isNowDone = newCompleted >= track.reviewsRequested;

      await prisma.$transaction(async (tx) => {
        await tx.reviewQueue.deleteMany({
          where: { trackId: track.id, artistReviewerId: seeder!.id },
        });

        await tx.review.create({
          data: {
            trackId: track.id,
            peerReviewerArtistId: seeder!.id,
            isPeerReview: true,
            status: "COMPLETED",
            countsTowardCompletion: true,
            countsTowardAnalytics: true,
            reviewSchemaVersion: 3,
            isGem: (review as any).isGem ?? false,
            firstImpression: review.firstImpression,
            productionScore: review.productionScore,
            vocalScore: review.vocalScore,
            originalityScore: review.originalityScore,
            releaseReadinessScore: review.releaseReadinessScore,
            qualityLevel: review.qualityLevel,
            releaseVerdict: review.releaseVerdict,
            vocalClarity: review.vocalClarity,
            lowEndClarity: review.lowEndClarity,
            highEndQuality: review.highEndQuality,
            stereoWidth: review.stereoWidth,
            dynamics: review.dynamics,
            energyCurve: review.energyCurve,
            trackLength: review.trackLength,
            tooRepetitive: review.tooRepetitive,
            wouldListenAgain: review.wouldListenAgain,
            wouldShare: review.wouldShare,
            wouldFollow: review.wouldFollow,
            wouldAddToPlaylist: review.wouldAddToPlaylist,
            nextFocus: review.nextFocus,
            playlistAction: review.playlistAction,
            expectedPlacement: review.expectedPlacement,
            bestPart: review.bestPart,
            biggestWeaknessSpecific: review.biggestWeaknessSpecific,
            weakestPart: review.biggestWeaknessSpecific,
          },
        });

        await tx.track.update({
          where: { id: track.id },
          data: {
            reviewsCompleted: newCompleted,
            ...(isNowDone && {
              status: "COMPLETED",
              completedAt: new Date(),
            }),
          },
        });
      });

      injectedForTrack++;
      totalInjected++;
      console.log(`  [OK] ${injectedForTrack}/${needed} — seed: ${seeder.User?.email}`);
    }
  }

  console.log(`\nDone. ${totalInjected} review(s) injected.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
