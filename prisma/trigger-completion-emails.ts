/**
 * Sends completion emails for all tracks we seeded reviews into.
 * Usage: tsx prisma/trigger-completion-emails.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sendReviewProgressEmail } from "../src/lib/email/reviews";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("Database URL is not defined");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const TARGETS = [
  { email: "kornking05@gmail.com",          title: "Tried My Best - Shiftyy - Sad Rap" },
  { email: "levonlyochao@gmail.com",        title: "Little Prince v4" },
  { email: "yanosocial74@gmail.com",        title: "Sour Shot DEMO by YANO" },
  { email: "ppepon788@gmail.com",           title: "eVOL" },
  { email: "andresbertuccio@gmail.com",     title: "Amigo, by Refugio Viejo" },
  { email: "myunghyun2025@gmail.com",       title: "Rotation And Revolution" },
  { email: "myunghyun2025@gmail.com",       title: "Cicada" },
  { email: "qtek20203@gmail.com",           title: "Thessalonique by GA" },
  { email: "myunghyun2025@gmail.com",       title: "Arirang Hill" },
  { email: "shadowvonnyx@gmail.com",        title: "Genocidal Parasite - Guitar Playthrough. #speedmetal #gothicmetal #thrashmetal" },
  { email: "boh123321@gmail.com",           title: "NAND by Yuki Extremity" },
  { email: "young_escalade@hotmail.com",    title: "FREE Beat 2026 – \"Bounce With Me\" | Young Escalade Type Beat | hiphop Instrumental" },
  { email: "angelic.lustt@gmail.com",       title: "Football" },
  { email: "jackson.holt24@gmail.com",      title: "Lost in October" },
  { email: "linkjeremy@gmail.com",          title: "Smolder at the Seams" },
  { email: "fonsislelijk@gmail.com",        title: "Rising stars feedback mp3 by BeatsByMighty" },
  { email: "vittearossi@gmail.com",         title: "Юность (Remsatered 2025)" },
  { email: "jimmysrighteye@gmail.com",      title: "Cardholder Not Present" },
  { email: "gutierrezcrist7@icloud.com",    title: "DqaC4H5zGG1rLutU41" },
  { email: "interrobangrecord@gmail.com",   title: "Gotye - Somebody That I Used To Know (Feat. Kimbra) (Interrobang Remix) by Interrobang" },
  { email: "turnerc036@gmail.com",          title: "Message to the opps" },
  { email: "cbhutch94@yahoo.com",           title: "DdKjKAW20AuUcc57c7" },
  { email: "amalgamrecordings@gmail.com",   title: "\"Universe\" by Michael Thomas Brown" },
  { email: "surfer1396@gmail.com",          title: "Simple Song" },
  { email: "aviremusic.co@gmail.com",       title: "Me Against Me | A.Vire (Official Lyric Video)" },
  { email: "streetdogaudio@gmail.com",      title: "Ricky Tan" },
];

async function main() {
  let sent = 0;
  let skipped = 0;

  for (const target of TARGETS) {
    const user = await prisma.user.findUnique({
      where: { email: target.email },
      include: { ArtistProfile: true },
    });

    if (!user?.ArtistProfile) {
      console.log(`SKIP — user not found: ${target.email}`);
      skipped++;
      continue;
    }

    const track = await prisma.track.findFirst({
      where: {
        artistId: user.ArtistProfile.id,
        title: target.title,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!track) {
      console.log(`SKIP — track not found: "${target.title}"`);
      skipped++;
      continue;
    }

    await sendReviewProgressEmail(
      target.email,
      track.title,
      track.reviewsCompleted,
      track.reviewsRequested
    );

    console.log(`Sent  "${track.title}" → ${target.email} (${track.reviewsCompleted}/${track.reviewsRequested})`);
    sent++;

    // Small delay to avoid hitting Resend rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone — ${sent} sent, ${skipped} skipped`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
