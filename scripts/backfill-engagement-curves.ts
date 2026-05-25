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

// Generates a realistic engagement curve.
// Real reviewers click a level when they feel it, hold for a while, drift, change.
// Even positive listeners dip, zone back in, plateau — it's never perfectly high.
function generateCurve(durationSeconds: number, sentiment: "high" | "positive" | "critical"): CurvePoint[] {
  const curve: CurvePoint[] = [];

  // User starts clicking after 6-15 seconds (settling in, finding the button)
  const firstClick = 6 + Math.floor(Math.random() * 10);

  // Build a sequence of [atSecond, level] events — realistic human clicking
  const changes: [number, number][] = [];

  if (sentiment === "high") {
    // Positive but not perfect — starts at 3 while figuring out the form,
    // climbs to 4 quickly, hits 5 at the hook, dips to 3 in the mid section,
    // recovers to 4, ends strong
    changes.push([firstClick,                                       3]);
    changes.push([firstClick + 5 + Math.random() * 8,              4]);
    changes.push([durationSeconds * 0.18 + Math.random() * 10,     5]);
    changes.push([durationSeconds * 0.38 + Math.random() * 8,      4]);
    changes.push([durationSeconds * 0.52,                          3]);   // mid drift
    changes.push([durationSeconds * 0.63 + Math.random() * 8,      4]);
    changes.push([durationSeconds * 0.82,                          5]);   // strong finish
  } else if (sentiment === "positive") {
    // Likes it but measured — 3 to start, settles at 4, mid section drags a bit,
    // bumps back to 4 near the end, occasionally 3
    changes.push([firstClick,                                       3]);
    changes.push([firstClick + 10 + Math.random() * 12,            4]);
    changes.push([durationSeconds * 0.30,                          4]);
    changes.push([durationSeconds * 0.46,                          3]);   // middle plateau
    changes.push([durationSeconds * 0.58,                          3]);   // stays there a bit
    changes.push([durationSeconds * 0.70 + Math.random() * 8,      4]);
    changes.push([durationSeconds * 0.88,                          4]);
  } else {
    // Critical — starts optimistic at 3, drops to 2 when it goes generic,
    // brief bump to 3 at the end but doesn't recover fully
    changes.push([firstClick,                                       3]);
    changes.push([firstClick + 15 + Math.random() * 10,            3]);
    changes.push([durationSeconds * 0.28,                          2]);   // losing it
    changes.push([durationSeconds * 0.50,                          2]);   // stays low
    changes.push([durationSeconds * 0.72,                          3]);   // slight recovery
    changes.push([durationSeconds * 0.88,                          2]);   // drops again
  }

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

async function main() {
  // All reviews injected by our scripts have shareIds starting with "inj"
  const reviews = await prisma.review.findMany({
    where: { shareId: { startsWith: "inj" } },
    select: {
      id: true,
      shareId: true,
      trackId: true,
      firstImpression: true,
      engagementCurve: true,
      Track: { select: { title: true } },
    },
  });

  const missing = reviews.filter(r => r.engagementCurve === null);
  console.log(`Found ${reviews.length} injected reviews, ${missing.length} missing curves\n`);

  // Approximate durations per track (seconds)
  const TRACK_DURATIONS: Record<string, number> = {
    "cmonieux5000304juqks9zw7o": 195,  // Performing in the u.s.a
    "cmp96lnq9000204kw29o6y6wv": 210,  // Forgiveness
    "cmpaevof2000004jmthmnxx00": 220,  // Te Aroha
    "cmpatwglb000004js5xoklnll": 200,  // MNGA Music - In God We Trust
    "cmpbdimnw000104l11p4fyz6w": 215,  // Kryrella's Dream
    "cmpbxoox8000004jl920shvoy": 195,  // Performative - ariel vizzini
    "cmou8kn4r000004l1y3ghnvg5": 182,  // Floyd Kelly - Happy Birthday USA
  };

  for (const review of missing) {
    const duration = TRACK_DURATIONS[review.trackId] ?? 200;
    const sentiment =
      review.firstImpression === "STRONG_HOOK"
        ? (Math.random() > 0.5 ? "high" : "positive")
        : review.firstImpression === "LOST_INTEREST"
        ? "critical"
        : "critical"; // DECENT → critical pattern (the skeptical reviewer)

    const curve = generateCurve(duration, sentiment);

    await prisma.review.update({
      where: { id: review.id },
      data: { engagementCurve: curve },
    });

    console.log(`[OK] ${review.Track?.title} — ${review.shareId} — ${curve.length} points (${sentiment})`);
  }

  if (missing.length === 0) {
    console.log("All injected reviews already have curves.");
  } else {
    console.log(`\nDone. Backfilled ${missing.length} review(s).`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
