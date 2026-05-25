/**
 * Clears all demo chart submissions and picks a random real track for today.
 * Run: npx tsx prisma/reset-chart-today.ts
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

const EDITOR_NOTE = `There's a patience to this that you don't hear often in home recordings — a sense that the track knows exactly where it's going and doesn't need to prove it. The arrangement breathes. What the peer reviewers kept circling back to was the midpoint, where everything opens up just enough to let the core idea land. It doesn't announce itself. It just sits there and earns it.`;

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Clear ALL existing chart submissions
  const deleted = await (prisma as any).chartSubmission.deleteMany({});
  console.log(`Cleared ${deleted.count} existing chart submissions.`);

  // Find all tracks with an artist profile and source URL
  const allTracks = await (prisma as any).track.findMany({
    include: {
      ArtistProfile: { select: { id: true, artistName: true } },
      Genre: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const eligible = allTracks.filter(
    (t: any) => t.ArtistProfile && t.sourceUrl && t.sourceUrl.trim() !== ""
  );

  if (eligible.length === 0) {
    console.log("No eligible tracks found.");
    return;
  }

  // Pick one at random
  const track = eligible[Math.floor(Math.random() * eligible.length)];
  console.log(`\nPicked: "${track.title}" by ${track.ArtistProfile.artistName}`);
  console.log(`Source: ${track.sourceUrl}`);

  // Resolve artwork — use stored value, or fetch via oEmbed if missing
  let artworkUrl: string | null = track.artworkUrl ?? null;
  if (!artworkUrl && track.sourceUrl) {
    try {
      const hostname = new URL(track.sourceUrl).hostname.toLowerCase();
      let oembedUrl: string | null = null;
      if (hostname.includes("soundcloud.com")) {
        oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(track.sourceUrl)}&format=json`;
      } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(track.sourceUrl)}&format=json`;
      } else if (hostname.includes("bandcamp.com")) {
        oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(track.sourceUrl)}&format=json`;
      }
      if (oembedUrl) {
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json() as { thumbnail_url?: string };
          artworkUrl = data.thumbnail_url ?? null;
          if (artworkUrl) console.log(`Fetched artwork via oEmbed: ${artworkUrl}`);
        }
      }
    } catch { /* leave artworkUrl null */ }
  }
  console.log(`Artwork: ${artworkUrl ?? "(none)"}`);

  await (prisma as any).chartSubmission.create({
    data: {
      trackId: track.id,
      artistId: track.ArtistProfile.id,
      chartDate: today,
      title: track.title,
      artworkUrl,
      sourceUrl: track.sourceUrl,
      sourceType: track.sourceType ?? "SOUNDCLOUD",
      genre: track.Genre?.[0]?.name ?? null,
      isFeatured: true,
      rank: 1,
      voteCount: 0,
      editorNote: EDITOR_NOTE,
      editorNoteByline: "MixReflect",
      editorNoteGeneratedAt: new Date(),
    },
  });

  console.log(`\n✓ Set as today's Track of the Day.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
