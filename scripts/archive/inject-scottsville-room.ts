import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const REPORT_ID = "cmq64wc7x000704js2n6sbjxu"; // Scottsville Road score report

// seed score-reviewer accounts
const JAKE = "cmot9rqz100000svikdzklp43";
const SARAH = "cmot9rs3i00020svid6wylgz9";
const PRIYA = "cmot9rtxc00060svixuef0qpn";
const TOM = "cmot9rt0e00040svilzbrrroa";
const TEST_FREE = "cmptfq75p0000ocvijnabdjnr"; // stray test account to remove

type R = { reviewerId: string; rating: number; positive: boolean; headline: string; quote: string };

const REVIEWS: R[] = [
  {
    reviewerId: JAKE,
    rating: 4,
    positive: true,
    headline: "goes down easy but plays it safe",
    quote:
      "This one just goes down easy for me... nothing about it feels like work to listen too. The lyrics are the best part, they feel honest and you can tell theres a story in there. Production is clean. Only thing is it kinda plays it safe the whole way thru, I was waiting for a moment where it suprises me and it never really came. Still a solid country tune tho, id put it on.",
  },
  {
    reviewerId: SARAH,
    rating: 4,
    positive: true,
    headline: "nice writing, wanted one bigger moment",
    quote:
      "Okay I really enjoyed this! The writing is lovely and it feels like your singing about something you actually lived, that comes thru. Its the kind of song you can throw on in the car and just sit with, very easy on the ears. My one honest bit of feedback would be it stays at about the same level emotionaly the whole time. I kept hoping for a chorus that lifts off or a moment that grabs me and it didnt quite get there. But the bones are great and your voice really suits the genre. Keep going!",
  },
  {
    reviewerId: PRIYA,
    rating: 3,
    positive: false,
    headline: "pleasant but pretty familiar",
    quote:
      "Theres alot to like here, the melody is pleasant and the vocal is comfortable to listen to. Where it loses me a little is that it feels pretty familiar. The chord movement and the structure are things ive heard plenty of times in country and it doesnt really put its own stamp on it. A few of the lines are genuinely nice but then others feel a bit generic and could be in any song. Im not saying its bad at all, its clean and competent, i just think it could take a few more risks to stand out from the pack.",
  },
  {
    reviewerId: TOM,
    rating: 4,
    positive: true,
    headline: "warm easy listen, doesnt push much",
    quote:
      "This took me right back, its got that warm classic country feel that i grew up on. Easy to listen to start to finish and the lyrics have heart, you can tell its comin from a real place. Thats half the battle right there. If im honest it doesnt push the boundaries much, it kinda stays in the one lane the whole song and theres room to suprise the listener a bit more, maybe a bridge that goes somewhere unexpected. But thats me being picky. Good song, nice voice, id happily hear more from ya.",
  },
];

async function main() {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 1. Remove the stray test-account assignment.
    await tx.scoreReview.deleteMany({
      where: { reportId: REPORT_ID, reviewerId: TEST_FREE },
    });

    // 2. Upsert each seed reviewer's reaction as COMPLETED.
    for (const r of REVIEWS) {
      const existing = await tx.scoreReview.findUnique({
        where: { reportId_reviewerId: { reportId: REPORT_ID, reviewerId: r.reviewerId } },
      });
      const data = {
        status: "COMPLETED" as const,
        rating: r.rating,
        headline: r.headline.slice(0, 140),
        quote: r.quote.slice(0, 1200),
        positive: r.positive,
        completedAt: now,
      };
      if (existing) {
        await tx.scoreReview.update({ where: { id: existing.id }, data });
      } else {
        await tx.scoreReview.create({
          data: {
            reportId: REPORT_ID,
            reviewerId: r.reviewerId,
            expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            ...data,
          },
        });
      }
    }

    // 3. Room is full (Kris + 4 seeds = 5) -> mark report COMPLETED.
    await tx.trackScoreReport.update({
      where: { id: REPORT_ID },
      data: { status: "COMPLETED" },
    });
  });

  // Verify
  const rows = await prisma.scoreReview.findMany({
    where: { reportId: REPORT_ID },
    select: { reviewerId: true, status: true, rating: true, headline: true },
    orderBy: { status: "asc" },
  });
  const report = await prisma.trackScoreReport.findUnique({
    where: { id: REPORT_ID },
    select: { status: true, humanReviewsRequested: true },
  });
  console.log("Report status:", report?.status, "| requested:", report?.humanReviewsRequested);
  console.log("ScoreReview rows now:");
  console.log(JSON.stringify(rows, null, 2));
  const completed = rows.filter((r) => r.status === "COMPLETED").length;
  const assigned = rows.filter((r) => r.status !== "COMPLETED").length;
  console.log(`\nCOMPLETED: ${completed} | NOT-COMPLETED (assigned/etc): ${assigned}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
