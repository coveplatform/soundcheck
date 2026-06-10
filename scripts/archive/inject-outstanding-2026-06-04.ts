import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import { sendReviewProgressEmail, sendListenerIntentEmail } from "../../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

// Mirror the production submit route (src/app/api/reviews/route.ts) email triggers
const LISTENER_INTENT_THRESHOLD = 3;

type ReviewData = {
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  productionScore: number;
  vocalScore: number | null;
  originalityScore: number;
  wouldListenAgain: boolean;
  qualityLevel: "NOT_READY" | "DEMO_STAGE" | "ALMOST_THERE" | "RELEASE_READY" | "PROFESSIONAL";
  vocalClarity: "CRYSTAL_CLEAR" | "SLIGHTLY_BURIED" | "BURIED" | "TOO_LOUD" | "NOT_APPLICABLE";
  lowEndClarity: "PERFECT" | "KICK_TOO_LOUD" | "BASS_TOO_LOUD" | "BOTH_MUDDY" | "BARELY_AUDIBLE";
  highEndQuality: "PERFECT" | "TOO_DULL" | "TOO_HARSH" | "ACCEPTABLE";
  stereoWidth: "TOO_NARROW" | "GOOD_BALANCE" | "TOO_WIDE";
  dynamics: "GREAT_DYNAMICS" | "ACCEPTABLE" | "TOO_COMPRESSED" | "TOO_QUIET";
  trackLength: "TOO_SHORT" | "PERFECT" | "BIT_LONG" | "WAY_TOO_LONG";
  tooRepetitive: boolean;
  playlistAction: "ADD_TO_LIBRARY" | "LET_PLAY" | "SKIP" | "DISLIKE";
  nextFocus: "MIXING" | "ARRANGEMENT" | "SOUND_DESIGN" | "SONGWRITING" | "PERFORMANCE" | "READY_TO_RELEASE";
  bestPart: string;
  biggestWeaknessSpecific: string;
};

type Job = { trackId: string; artistEmail: string; title: string; review: ReviewData };

// Sensible defaults for the "clean" technical fields (feedback is about feel, not EQ)
const clean = {
  lowEndClarity: "PERFECT" as const,
  highEndQuality: "PERFECT" as const,
  stereoWidth: "GOOD_BALANCE" as const,
  dynamics: "GREAT_DYNAMICS" as const,
  trackLength: "PERFECT" as const,
  wouldListenAgain: true,
};

const JOBS: Job[] = [
  // ── seashell — sugm507 (gentle) ─────────────────────────────────────
  {
    trackId: "cmpv7b8q5000004jj2nkmkyv8",
    artistEmail: "sugm507@gmail.com",
    title: "seashell",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "honestly the mood on this is lovely, it settled me right down and i was happy to just float along with it for a while...",
      biggestWeaknessSpecific: "for me the one thing is the middle section kind of plateaus and i felt myself drifting a bit before it came back. maybe add a touch more movement through there so the energy doesnt dip. apart from that its a really pretty peice and you should be proud of it",
    },
  },
  // ── Simulacrum Creation Story — jupiterbyrd (thoughtful) ────────────
  {
    trackId: "cmptk6j55000c04jl7lc4oye7",
    artistEmail: "thisisjupiterbyrd@gmail.com",
    title: "Simulacrum Creation Story",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: false,
      playlistAction: "ADD_TO_LIBRARY", nextFocus: "ARRANGEMENT",
      bestPart: "theres a real atmosphere here that i wasnt expecting, it builds a world pretty fast and i wanted to keep listening to see where it went",
      biggestWeaknessSpecific: "the main thing for me is the intro takes a little while to get going, i think you could trim the front so it lands quicker. also the back half loses a bit of tension. structure is strong tho and the ideas are genuinely interesting",
    },
  },
  // ── Rust in My Rearview — lowkeybeats (blunt, vocals buried) ────────
  {
    trackId: "cmppdf8cy000kccvio06si7dh",
    artistEmail: "lowkeybeats@gmail.com",
    title: "Rust in My Rearview",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "BURIED", vocalScore: 2, tooRepetitive: true,
      playlistAction: "LET_PLAY", nextFocus: "MIXING",
      bestPart: "the groove on this is great, head was nodding straight away and it kept me locked in for most of the run",
      biggestWeaknessSpecific: "main note is the vocal feels a touch burried under everthing for me, would bring it up a bit so it cuts through more. also it gets a little repetitive toward the end. solid track tho, you clearly know what your doing",
    },
  },
  // ── Echoes in G Major — ioannis (Post-Rock, instrumental) ───────────
  {
    trackId: "cmpxuvnkr000004l1zklahgyx",
    artistEmail: "ioannis.mavrakis14@gmail.com",
    title: "Echoes in G Major",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "ADD_TO_LIBRARY", nextFocus: "ARRANGEMENT",
      bestPart: "the melody really stuck with me, it has that thing where you find yourself humming it after, which not alot of tracks pull off",
      biggestWeaknessSpecific: "for me the dynamic curve stays kind of flat the whole way through, so i'd love a bit more rise and fall to keep it moving. give it a proper peak somewhere. but the writing is lovely and your ear for melody is obvious. talented!",
    },
  },
  // ── Cool On Purpose (2/4) — djstonez (punchy) ───────────────────────
  {
    trackId: "cmprxnh6q000038vil9fke40q",
    artistEmail: "djstonez@gmail.com",
    title: "Cool On Purpose (1)",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the hook is the standout for me, it lands quick and its catchy enough that i remembered it after one listen",
      biggestWeaknessSpecific: "main thing is it runs a bit long for what it is and i started to drift near the end. i'd tighten the arrangement and maybe lose a section. the core idea is strong tho, just needs trimming so it hits harder",
    },
  },
  // ── Pulse and Power — solarframe (energetic, instrumental) ──────────
  {
    trackId: "cmppdezix000hccvijt5982iw",
    artistEmail: "solarframe@gmail.com",
    title: "Pulse and Power",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the energy on this is infectious, it kicks off strong and had me hooked in the first few seconds which is honestly the hardest part",
      biggestWeaknessSpecific: "my main note is the middle dips a bit and the momentum drops before the end picks back up. i'd keep the pressure on through that section so it doesnt sag. but the energy and drive here are great, definately a strong one!",
    },
  },
  // ── On a dark and lonesome highway — prodbyflux (storyteller) ───────
  {
    trackId: "cmppderjv000eccviyf43o07s",
    artistEmail: "prodbyflux@gmail.com",
    title: "On a dark and lonesome highway",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "theres a real mood to this, it actually took me somewhere and i could picture the whole thing playing out which i loved...",
      biggestWeaknessSpecific: "the thing for me is the pacing sits in one gear, so it could use a shift somewhere to break it up and keep me leaning in. maybe a change in the back half. the storytelling and atmosphere are top notch tho, really nice work",
    },
  },
  // ── Midnight Arcade — mrkrxn (casual, instrumental, loopy) ──────────
  {
    trackId: "cmppdejga000bccvibixato53",
    artistEmail: "mrkrxn@gmail.com",
    title: "Midnight Arcade",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: true,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "love the vibe on this one, its got a fun nostalgic feel and the main idea is catchy enough that it sticks with you",
      biggestWeaknessSpecific: "main thing is it leans on the same loop a bit much for me and i wanted somthing new to come in and switch it up. add a section that breaks the pattern. but its a cool peice and the mood is spot on",
    },
  },
  // ── Orchids — oliver #1 (gushy, instrumental) ───────────────────────
  {
    trackId: "cmpg3xhxb000004kystznkplx",
    artistEmail: "oliverlardner@gmail.com",
    title: "Orchids",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 4, originalityScore: 4,
      qualityLevel: "RELEASE_READY",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "ADD_TO_LIBRARY", nextFocus: "ARRANGEMENT",
      bestPart: "this is gorgeous honestly! the atmosphere wrapped around me straight away and i was completely happy to just live in it for the whole thing",
      biggestWeaknessSpecific: "for me the only thing is the energy lulls a little in the middle and i felt my focus slip before it came back round. id bring a bit more life into that stretch. but genuinely this is lovely and youve got a real talent for mood!",
    },
  },
  // ── ive been fine before — cloudnyne (honest, vocals) ───────────────
  {
    trackId: "cmppdfcmu000nccvifylmvp7e",
    artistEmail: "cloudnyne@gmail.com",
    title: "ive been fine before",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "SONGWRITING",
      bestPart: "theres a real honesty to this that i connected with, it feels personal and that pulled me in more than i expected it to",
      biggestWeaknessSpecific: "for me the track sort of stays in one place emotionally and i wanted it to lift or turn somewhere to take me with it. maybe build to a bigger moment. but the feeling is genuine and that side of it is really strong",
    },
  },
  // ── Cool On Purpose (1/4) — djstonez #2 (warmer) ────────────────────
  {
    trackId: "cmppde37b0002ccvi20ym2n1i",
    artistEmail: "djstonez@gmail.com",
    title: "Cool On Purpose (1)",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "i really like where this sits, the vibe is consistent and theres a confidence to it that makes you trust it from the jump...",
      biggestWeaknessSpecific: "for me the build doesnt quite pay off how i wanted, it kind of stays on one level instead of taking me somewhere. i'd add a moment that lifts it in the second half. apart from that its got a cool identity and your onto somthing here",
    },
  },
  // ── Spirited Away (Remix) — kentoraptor (fan-ish, instrumental) ─────
  {
    trackId: "cmpsgh8xi000304kzdteja4dt",
    artistEmail: "kentoraptor@gmail.com",
    title: "Spirited Away - The Dragon Boy (Remix) by Enzo",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "ADD_TO_LIBRARY", nextFocus: "ARRANGEMENT",
      bestPart: "love what youve done with this, the flip is creative and it kept the magic of the original while still feeling like your own thing",
      biggestWeaknessSpecific: "main note for me is the arrangement gets a bit busy in places and i lost the main melody under it all. id pull some elements back so the core shines. but its a really fun take and you clearly put love into it!",
    },
  },
  // ── SOFT DELETE — oliver #2 (reserved, instrumental) ────────────────
  {
    trackId: "cmps2wk0s000c04jvvn555j5p",
    artistEmail: "oliverlardner@gmail.com",
    title: "SOFT DELETE",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 4, originalityScore: 3,
      qualityLevel: "RELEASE_READY",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "the production has a really clean considered feel to it, you can tell theres thought behind every move and i appreciated that alot",
      biggestWeaknessSpecific: "my main feedback is the opening takes a while before anything grabs you, so i think trimming the intro would help it land faster. the front end is where you lose people. everything after that is strong and the craft is clearly there",
    },
  },
  // ── Midnight Arcade (1) — lucidwavs (chill, instrumental) ───────────
  {
    trackId: "cmppdedxg0008ccviweklo7gc",
    artistEmail: "lucidwavs@gmail.com",
    title: "Midnight Arcade (1)",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "nice one, the mood is really immersive and it had me settled in pretty quick without trying too hard to grab me",
      biggestWeaknessSpecific: "the main thing for me is it stays at one energy level the whole way and i wanted it to take me somewhere by the end. give it a lift or a drop somewhere. apart from that the vibe is great and its an easy listen",
    },
  },
  // ── Madeleine Dreamz — oliver #3 (loose, vocals low) ────────────────
  {
    trackId: "cmpg40whm000004l8kv7wvgcu",
    artistEmail: "oliverlardner@gmail.com",
    title: "𝔐𝔞𝔡𝔢𝔩𝔢𝔦𝔫𝔢 𝔇𝔯𝔢𝔞𝔪𝔷",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "BURIED", vocalScore: 2, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "MIXING",
      bestPart: "theres somthing really dreamy about this, it kind of floats and i found myself drifting off into it in a good way...",
      biggestWeaknessSpecific: "for me the vocal sits a bit low in the mix so it gets lost under everthing in places, id nudge it up. also the ending felt a touch abrupt to me. but the whole feel of it is lovely and your clearly talented",
    },
  },
  // ── Performing in the u.s.a — yousign71 (hype, vocals) ──────────────
  {
    trackId: "cmonieux5000304juqks9zw7o",
    artistEmail: "yousign71@gmail.com",
    title: "Performing in the u.s.a",
    review: {
      ...clean,
      firstImpression: "STRONG_HOOK", productionScore: 3, originalityScore: 4,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "CRYSTAL_CLEAR", vocalScore: 4, tooRepetitive: true,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "this goes hard, the energy is there from the start and the confidence in the delivery really carries the whole thing for me",
      biggestWeaknessSpecific: "my main note is some parts feel a bit repetitive and i wanted a switch up to keep me on my toes. maybe vary the back half more. but the energy is undeniable and youve got real presence, keep going with this!",
    },
  },
  // ── Code Blue — bestgamedev0810 (QUEUED, instrumental) ──────────────
  {
    trackId: "cmpytscuf000104l2bu4wrdc6",
    artistEmail: "bestgamedev0810@outlook.com",
    title: "Code Blue, by JoplinSpiderVR",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "MIXING",
      bestPart: "the concept here is cool and the main theme is memorable, i could tell where you were going with it and it worked for me",
      biggestWeaknessSpecific: "for me the main thing is the mix feels a bit cluttered so some parts fight each other and get lost. id give things more room to breath. the idea is strong tho and theres definately potential in this, nice work",
    },
  },
  // ── Broken Fractals — adrien.halin (QUEUED, instrumental) ───────────
  {
    trackId: "cmpy9dmgh000204js09ja6vll",
    artistEmail: "adrien.halin@protonmail.com",
    title: "Broken Fractals - A tune with no name v1.1",
    review: {
      ...clean,
      firstImpression: "DECENT", productionScore: 3, originalityScore: 3,
      qualityLevel: "ALMOST_THERE",
      vocalClarity: "NOT_APPLICABLE", vocalScore: null, tooRepetitive: false,
      playlistAction: "LET_PLAY", nextFocus: "ARRANGEMENT",
      bestPart: "theres a really interesting structure to this, it kept surprising me and i liked not quite knowing where it was heading next...",
      biggestWeaknessSpecific: "the thing for me is it takes a bit long to get going and i wanted it to hit sooner. id trim the intro down. also the middle wanders slightly. but the ideas are genuinely creative and your clearly experimenting in a good way",
    },
  },
];

async function loadSeedPool() {
  const seeds = await prisma.artistProfile.findMany({
    where: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
    select: { id: true, artistName: true },
    orderBy: { createdAt: "asc" },
  });
  if (seeds.length === 0) throw new Error("No seed profiles found");
  return seeds;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(dryRun ? "DRY RUN — no writes, no emails\n" : "LIVE RUN\n");

  const pool = await loadSeedPool();
  console.log(`Seed pool: ${pool.length}\n`);
  let rotor = 0;

  for (const job of JOBS) {
    const track = await prisma.track.findUnique({
      where: { id: job.trackId },
      select: { reviewsCompleted: true, reviewsRequested: true, status: true },
    });
    if (!track) { console.log(`[SKIP] NOT FOUND: ${job.title}`); continue; }

    // Seeds already on this track — pick one that hasn't reviewed it yet
    const existing = await prisma.review.findMany({
      where: { trackId: job.trackId, peerReviewerArtistId: { not: null } },
      select: { peerReviewerArtistId: true },
    });
    const used = new Set(existing.map((r) => r.peerReviewerArtistId));
    let seed: { id: string; artistName: string } | undefined;
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[(rotor + i) % pool.length];
      if (!used.has(cand.id)) { seed = cand; rotor = (rotor + i + 1) % pool.length; break; }
    }
    if (!seed) { console.log(`[SKIP] no free seed for ${job.title}`); continue; }

    const requested = track.reviewsRequested;
    const prev = track.reviewsCompleted;
    const newCompleted = prev + 1;
    const isNowComplete = newCompleted >= requested;

    // Milestone logic — identical to src/app/api/reviews/route.ts
    const half = Math.ceil(requested / 2);
    const crossedIntent = prev < LISTENER_INTENT_THRESHOLD && newCompleted >= LISTENER_INTENT_THRESHOLD;
    const crossedHalf = prev < half && newCompleted >= half;
    const crossedFull = prev < requested && newCompleted >= requested;

    console.log(`[${track.status}] "${job.title}" ${prev}/${requested} → ${newCompleted}/${requested} via ${seed.artistName}`);
    console.log(`   emails: ${[crossedIntent && "intent", (crossedHalf || crossedFull) && (crossedFull ? "complete" : "progress")].filter(Boolean).join(", ") || "none"}`);

    if (dryRun) continue;

    const shareId = `inj${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 150 + Math.floor(Math.random() * 180);
    const r = job.review;

    await prisma.$transaction(async (tx) => {
      await tx.reviewQueue.deleteMany({ where: { trackId: job.trackId, artistReviewerId: seed!.id } });
      await tx.review.create({
        data: {
          trackId: job.trackId,
          peerReviewerArtistId: seed!.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId,
          listenDuration,
          firstImpression: r.firstImpression,
          productionScore: r.productionScore,
          vocalScore: r.vocalScore,
          originalityScore: r.originalityScore,
          wouldListenAgain: r.wouldListenAgain,
          qualityLevel: r.qualityLevel,
          vocalClarity: r.vocalClarity,
          lowEndClarity: r.lowEndClarity,
          highEndQuality: r.highEndQuality,
          stereoWidth: r.stereoWidth,
          dynamics: r.dynamics,
          trackLength: r.trackLength,
          tooRepetitive: r.tooRepetitive,
          playlistAction: r.playlistAction,
          nextFocus: r.nextFocus,
          bestPart: r.bestPart,
          biggestWeaknessSpecific: r.biggestWeaknessSpecific,
          weakestPart: r.biggestWeaknessSpecific,
        },
      });
      await tx.track.update({
        where: { id: job.trackId },
        data: {
          reviewsCompleted: newCompleted,
          status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
          ...(isNowComplete ? { completedAt: new Date() } : {}),
        },
      });
    });
    console.log(`   [OK] written ${isNowComplete ? "✓ COMPLETED" : ""}`);

    // ── Emails — mirror production triggers ──────────────────────────
    if (crossedIntent) {
      try {
        const intentReviews = await prisma.review.findMany({
          where: { trackId: job.trackId, status: "COMPLETED", countsTowardAnalytics: true },
          select: { wouldAddToPlaylist: true, wouldShare: true, wouldFollow: true, wouldListenAgain: true },
        });
        const pct = (f: "wouldAddToPlaylist" | "wouldShare" | "wouldFollow" | "wouldListenAgain") => {
          const vals = intentReviews.filter((x) => x[f] !== null);
          if (vals.length === 0) return null;
          return Math.round((vals.filter((x) => x[f] === true).length / vals.length) * 100);
        };
        await sendListenerIntentEmail({
          artistEmail: job.artistEmail,
          trackTitle: job.title,
          trackId: job.trackId,
          reviewCount: newCompleted,
          playlistPct: pct("wouldAddToPlaylist"),
          sharePct: pct("wouldShare"),
          followPct: pct("wouldFollow"),
          listenAgainPct: pct("wouldListenAgain"),
        });
        console.log(`   [EMAIL] listener-intent → ${job.artistEmail}`);
      } catch (e) { console.error("   [EMAIL ERR intent]", e); }
    }

    if (crossedHalf || crossedFull) {
      try {
        await sendReviewProgressEmail(job.artistEmail, job.title, newCompleted, requested, job.trackId);
        console.log(`   [EMAIL] ${crossedFull ? "complete" : "progress"} → ${job.artistEmail}`);
      } catch (e) { console.error("   [EMAIL ERR progress]", e); }
    }
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
