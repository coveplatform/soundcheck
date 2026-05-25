/**
 * Seeds demo Track of the Day entries using real tracks from the DB.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-track-of-the-day.ts
 * Or: npx tsx prisma/seed-track-of-the-day.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const DEMO_NOTES = [
  {
    note: "There's a stillness here that doesn't feel forced. The guitar sits in a tuning that puts every chord slightly on edge — not dissonant, just honest — and the vocal rides that same line between resolved and searching. What reviewers kept returning to was the space in the arrangement, the moments where the track lets you sit with a phrase before moving on. It doesn't hurry. That patience is the whole thing.",
    byline: "MixReflect",
  },
  {
    note: "The low-end here is deliberate in a way that a lot of home productions skip over — it sits in the pocket without crowding the vocal, which is harder to get right than it sounds. Reviewers flagged the second section as where this stops being a sketch and becomes a statement. There's a looseness to the rhythm that shouldn't work but does, and the track knows it.",
    byline: "MixReflect",
  },
  {
    note: "It doesn't arrive anywhere, which is the point. This kind of track lives in the space between intention and accident — the texture choices feel found rather than placed, but the arrangement underneath is clearly thought through. The dynamic curve builds imperceptibly until you realize the room sounds different than when you pressed play. Reviewers described it as patient. That's the right word.",
    byline: "MixReflect",
  },
  {
    note: "There's a looseness in the production that gives the vocal room to move — it doesn't feel pinned down by the arrangement, which is rarer than it should be. The hook earns its repetition by shifting the emphasis each time around rather than just cycling. Peer reviewers picked up on how the track opens out at exactly the right moment. That structural instinct is what separates a good song from a forgettable one.",
    byline: "MixReflect",
  },
  {
    note: "The vocal control here is quiet confidence — no showboating, just intention in every phrase. What makes the production work is how the low end sits with the vocal rather than competing for the same space. The track takes its time, and when the second section arrives it feels earned rather than inevitable. Reviewers noted the arrangement reads as restrained. That restraint is the whole aesthetic.",
    byline: "MixReflect",
  },
  {
    note: "The sample sits underneath everything like a foundation you're not supposed to notice until it shifts. And it does shift — halfway through, just enough to reframe the whole track. Reviewers flagged the midpoint as where this stops being a beat and becomes a narrative. The low-end clarity is deliberate in a way that a lot of productions skip over. Hard to argue with the result.",
    byline: "MixReflect",
  },
  {
    note: "There's an abrasiveness to the opening that either earns your attention or loses it immediately — no middle ground. The production is deliberately dry, which puts the performance under a microscope. What it reveals is a rhythm section that knows exactly when to pull back. Reviewers circled the bridge as the moment the track reveals what it actually is. They're right.",
    byline: "MixReflect",
  },
];

async function main() {
  // Find tracks with their artist profiles
  const allTracks = await (prisma as any).track.findMany({
    where: {},
    include: {
      ArtistProfile: { select: { id: true, artistName: true } },
      Genre: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const tracks = allTracks.filter((t: any) => t.ArtistProfile && t.sourceUrl);

  if (tracks.length === 0) {
    console.log("No tracks found in DB. Upload some tracks first.");
    return;
  }

  console.log(`Found ${tracks.length} tracks. Creating demo Track of the Day entries...`);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let created = 0;
  const usedArtists = new Set<string>();

  for (let daysAgo = 0; daysAgo <= 6 && created < Math.min(7, tracks.length); daysAgo++) {
    const chartDate = new Date(today);
    chartDate.setUTCDate(chartDate.getUTCDate() - daysAgo);

    // Find a track we haven't used an artist for yet on this day
    const track = tracks.find((t: any) => !usedArtists.has(`${t.ArtistProfile.id}-${daysAgo}`));
    if (!track) continue;

    usedArtists.add(`${track.ArtistProfile.id}-${daysAgo}`);

    const noteData = DEMO_NOTES[created % DEMO_NOTES.length];

    try {
      const existing = await (prisma as any).chartSubmission.findFirst({
        where: { chartDate, isFeatured: true },
      });

      if (existing) {
        console.log(`  Skipping ${chartDate.toISOString().split("T")[0]} — already has a featured track`);
        created++;
        continue;
      }

      // Check unique constraints
      const conflictTrack = await (prisma as any).chartSubmission.findFirst({
        where: { trackId: track.id, chartDate },
      });
      const conflictArtist = await (prisma as any).chartSubmission.findFirst({
        where: { artistId: track.ArtistProfile.id, chartDate },
      });

      if (conflictTrack || conflictArtist) {
        console.log(`  Skipping ${track.title} on ${chartDate.toISOString().split("T")[0]} — constraint conflict`);
        continue;
      }

      await (prisma as any).chartSubmission.create({
        data: {
          trackId: track.id,
          artistId: track.ArtistProfile.id,
          chartDate,
          title: track.title,
          artworkUrl: track.artworkUrl ?? null,
          sourceUrl: track.sourceUrl,
          sourceType: track.sourceType ?? "SOUNDCLOUD",
          genre: track.Genre?.[0]?.name ?? null,
          isFeatured: true,
          rank: 1,
          voteCount: Math.floor(Math.random() * 8) + 2,
          editorNote: noteData.note,
          editorNoteByline: noteData.byline,
          editorNoteGeneratedAt: new Date(),
        },
      });

      console.log(`  ✓ ${chartDate.toISOString().split("T")[0]} — "${track.title}" by ${track.ArtistProfile.artistName}`);
      created++;
    } catch (err: any) {
      console.error(`  ✗ Failed for ${track.title}:`, err.message);
    }
  }

  console.log(`\nDone. Created ${created} demo entries.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
