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

type CurvePoint = { seconds: number; level: number };

// 10 distinct human listening patterns — each one feels genuinely different
function generateCurve(durationSeconds: number, pattern: number): CurvePoint[] {
  const curve: CurvePoint[] = [];
  const firstClick = 5 + Math.floor(Math.random() * 12);

  // Each pattern is a list of [atSecond, level] change events
  const d = durationSeconds;
  const patterns: [number, number][][] = [
    // 0: hooked immediately, one brief mid dip, finishes strong
    [[firstClick, 4], [firstClick + 6, 5], [d * 0.44, 4], [d * 0.52, 3], [d * 0.61, 4], [d * 0.80, 5]],
    // 1: slow build — starts skeptical, warms up
    [[firstClick, 2], [d * 0.18, 3], [d * 0.32, 3], [d * 0.50, 4], [d * 0.72, 4], [d * 0.85, 5]],
    // 2: steady 4 the whole way, small wobble in the middle
    [[firstClick, 4], [d * 0.28, 3], [d * 0.38, 4], [d * 0.62, 4], [d * 0.78, 3], [d * 0.87, 4]],
    // 3: picks up in the second half — first half is "ok", second half they're into it
    [[firstClick, 3], [d * 0.22, 3], [d * 0.42, 2], [d * 0.55, 3], [d * 0.65, 4], [d * 0.80, 5]],
    // 4: bouncy — switches levels a lot, engaged but restless
    [[firstClick, 3], [d * 0.12, 4], [d * 0.22, 5], [d * 0.33, 4], [d * 0.44, 3], [d * 0.55, 4], [d * 0.66, 5], [d * 0.77, 4], [d * 0.88, 5]],
    // 5: strong opener, middle drags, recovers but not all the way
    [[firstClick, 5], [d * 0.15, 4], [d * 0.35, 3], [d * 0.55, 2], [d * 0.70, 3], [d * 0.85, 4]],
    // 6: critical but fair — hovers at 2-3, brief 4 at the best moment
    [[firstClick, 3], [d * 0.20, 2], [d * 0.38, 2], [d * 0.50, 3], [d * 0.60, 4], [d * 0.72, 3], [d * 0.85, 2]],
    // 7: pleasantly surprised — starts at 2 (not expecting much), climbs steadily
    [[firstClick, 2], [d * 0.15, 2], [d * 0.28, 3], [d * 0.45, 3], [d * 0.58, 4], [d * 0.75, 4]],
    // 8: consistent enjoyer — never lower than 3, mostly 4, peaks at 5 once
    [[firstClick, 3], [firstClick + 8, 4], [d * 0.30, 4], [d * 0.50, 5], [d * 0.65, 4], [d * 0.82, 4]],
    // 9: drops off toward the end — loved it at first, loses steam
    [[firstClick, 5], [d * 0.20, 4], [d * 0.45, 4], [d * 0.60, 3], [d * 0.75, 2], [d * 0.88, 2]],
  ];

  const changes = patterns[pattern % patterns.length];
  let currentLevel = 3;
  let changeIdx = 0;

  for (let s = firstClick; s <= durationSeconds; s = Math.round((s + 0.5) * 10) / 10) {
    while (changeIdx < changes.length && s >= changes[changeIdx][0]) {
      currentLevel = changes[changeIdx][1];
      changeIdx++;
    }
    curve.push({ seconds: Math.round(s * 10) / 10, level: currentLevel });
  }

  return curve;
}

// Updated score sets for Floyd Kelly with real variance
// Mostly positive but some measured, one critical
const FLOYD_KELLY_TRACK_ID = "cmou8kn4r000004l1y3ghnvg5";

const FLOYD_SCORES = [
  // review 1: hooked, production is great
  { firstImpression: "STRONG_HOOK", productionScore: 5, vocalScore: 4, originalityScore: 5, qualityLevel: "PROFESSIONAL",   wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 0 },
  // review 2: into it, solid
  { firstImpression: "STRONG_HOOK", productionScore: 4, vocalScore: 4, originalityScore: 5, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 8 },
  // review 3: the critical one — decent score, generic angle
  { firstImpression: "DECENT",      productionScore: 4, vocalScore: 3, originalityScore: 3, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "LET_PLAY",       curvePattern: 6 },
  // review 4: excited, loves it
  { firstImpression: "STRONG_HOOK", productionScore: 4, vocalScore: 4, originalityScore: 5, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 4 },
  // review 5: positive but more measured
  { firstImpression: "STRONG_HOOK", productionScore: 4, vocalScore: 4, originalityScore: 5, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 2 },
  // review 6: slow build, wins them over
  { firstImpression: "STRONG_HOOK", productionScore: 4, vocalScore: 4, originalityScore: 5, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 1 },
  // review 7: casual enjoyer, consistent
  { firstImpression: "STRONG_HOOK", productionScore: 4, vocalScore: 4, originalityScore: 5, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 8 },
  // review 8: pleasantly surprised by the mix
  { firstImpression: "DECENT",      productionScore: 4, vocalScore: 4, originalityScore: 3, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 7 },
  // review 9: strong hook, slight mid drop
  { firstImpression: "STRONG_HOOK", productionScore: 4, vocalScore: 4, originalityScore: 5, qualityLevel: "RELEASE_READY",  wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 5 },
  // review 10: loved it overall
  { firstImpression: "STRONG_HOOK", productionScore: 5, vocalScore: 4, originalityScore: 5, qualityLevel: "PROFESSIONAL",   wouldListenAgain: true,  playlistAction: "ADD_TO_LIBRARY", curvePattern: 3 },
] as const;

const TRACK_DURATIONS: Record<string, number> = {
  "cmonieux5000304juqks9zw7o": 195,
  "cmp96lnq9000204kw29o6y6wv": 210,
  "cmpaevof2000004jmthmnxx00": 220,
  "cmpatwglb000004js5xoklnll": 200,
  "cmpbdimnw000104l11p4fyz6w": 215,
  "cmpbxoox8000004jl920shvoy": 195,
  "cmou8kn4r000004l1y3ghnvg5": 182,
};

async function main() {
  // ── 1. Update Floyd Kelly scores + curves ─────────────────────────────────
  const floydReviews = await prisma.review.findMany({
    where: { trackId: FLOYD_KELLY_TRACK_ID, shareId: { startsWith: "inj" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, shareId: true },
  });

  console.log(`Floyd Kelly: found ${floydReviews.length} injected reviews\n`);

  for (let i = 0; i < floydReviews.length; i++) {
    const review = floydReviews[i];
    const scores = FLOYD_SCORES[i % FLOYD_SCORES.length];
    const curve = generateCurve(182, scores.curvePattern);

    await prisma.review.update({
      where: { id: review.id },
      data: {
        firstImpression: scores.firstImpression,
        productionScore: scores.productionScore,
        vocalScore: scores.vocalScore,
        originalityScore: scores.originalityScore,
        qualityLevel: scores.qualityLevel,
        wouldListenAgain: scores.wouldListenAgain,
        playlistAction: scores.playlistAction,
        engagementCurve: curve,
      },
    });

    console.log(`[FK ${i + 1}] ${scores.firstImpression} / prod:${scores.productionScore} / orig:${scores.originalityScore} / pattern:${scores.curvePattern} — ${curve.length} pts`);
  }

  // ── 2. Regenerate curves for all other injected reviews ──────────────────
  const otherReviews = await prisma.review.findMany({
    where: {
      shareId: { startsWith: "inj" },
      trackId: { not: FLOYD_KELLY_TRACK_ID },
    },
    select: { id: true, shareId: true, trackId: true, firstImpression: true, Track: { select: { title: true } } },
  });

  console.log(`\nOther tracks: regenerating curves for ${otherReviews.length} reviews\n`);

  // Spread patterns across the reviews so no two consecutive ones match
  const patternSequence = [0, 3, 8, 1, 5, 2, 9, 4, 7, 6, 0, 3, 8, 2, 5, 1, 4, 7, 9, 6];

  for (let i = 0; i < otherReviews.length; i++) {
    const review = otherReviews[i];
    const duration = TRACK_DURATIONS[review.trackId] ?? 200;
    const pattern = patternSequence[i % patternSequence.length];
    const curve = generateCurve(duration, pattern);

    await prisma.review.update({
      where: { id: review.id },
      data: { engagementCurve: curve },
    });

    console.log(`[${i + 1}] ${review.Track?.title?.slice(0, 35).padEnd(35)} pattern:${pattern} — ${curve.length} pts`);
  }

  console.log("\nDone.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
