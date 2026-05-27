import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sendReviewProgressEmail } from "../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TRACKS = [
  { trackId: "cmonieux5000304juqks9zw7o", artistEmail: "yousign71@gmail.com",          title: "Performing in the u.s.a" },
  { trackId: "cmphpero4000004jucji4huks", artistEmail: "kris.engelhardt4@gmail.com",   title: "Lover, You Should've Come Over" },
  { trackId: "cmpjj3hlk000404l4zrnw8j4k", artistEmail: "djjcar@gmail.com",             title: "Johann Caruana - In Modum Unisoni (Official Music Video)" },
  { trackId: "cmpk72fg9000004lg2xk3bu0q", artistEmail: "arielvizzinimusic@gmail.com",  title: "YouTube Video (pUqEDTkPHsw)" },
  { trackId: "cmpl7pl8n000304l1tfdn7pw4", artistEmail: "bozkurtfevzi55@gmail.com",     title: "Make tha princess slut" },
  { trackId: "cmpm1ykl3000004ieqmo8spxl", artistEmail: "covetflux@gmail.com",          title: "Dear God, by Etienne Carstens" },
  { trackId: "cmpm5m1nh000304lcpcrsiz79", artistEmail: "alexfairbourn098@gmail.com",   title: "Heartless by Miillo Woah" },
];

async function main() {
  for (const t of TRACKS) {
    const track = await prisma.track.findUnique({
      where: { id: t.trackId },
      select: { reviewsCompleted: true, reviewsRequested: true },
    });
    if (!track) { console.warn(`[SKIP] ${t.title} — not found`); continue; }

    try {
      await sendReviewProgressEmail(t.artistEmail, t.title, track.reviewsCompleted, track.reviewsRequested, t.trackId);
      console.log(`[OK] ${t.artistEmail} — "${t.title}"`);
    } catch (e) {
      console.error(`[ERR] ${t.artistEmail}:`, e);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
