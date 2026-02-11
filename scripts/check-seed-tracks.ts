import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Checking seeded tracks ===\n");

  const seedTracks = await prisma.track.findMany({
    where: {
      ArtistProfile: {
        User: {
          email: { endsWith: "@seed.mixreflect.com" },
        },
      },
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
    include: {
      ArtistProfile: {
        include: { User: { select: { email: true } } },
      },
    },
    orderBy: { title: "asc" },
  });

  console.log(`Found ${seedTracks.length} active seeded tracks\n`);

  // Check for duplicates (same title)
  const titleMap = new Map<string, typeof seedTracks>();
  for (const track of seedTracks) {
    const key = track.title.toLowerCase().trim();
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key)!.push(track);
  }

  console.log("--- DUPLICATES ---");
  let dupeCount = 0;
  for (const [title, tracks] of titleMap) {
    if (tracks.length > 1) {
      dupeCount += tracks.length - 1;
      console.log(`\n"${tracks[0].title}" (${tracks.length} copies):`);
      for (const t of tracks) {
        console.log(`  ID: ${t.id} | Status: ${t.status} | Artist: ${t.ArtistProfile?.User?.email} | Created: ${t.createdAt.toISOString().slice(0, 10)}`);
      }
    }
  }
  if (dupeCount === 0) console.log("  No duplicates found");

  // Check for broken images
  console.log("\n--- BROKEN IMAGES ---");
  let brokenCount = 0;
  for (const track of seedTracks) {
    if (!track.artworkUrl) {
      brokenCount++;
      console.log(`  NO ARTWORK: "${track.title}" (${track.id})`);
    } else {
      try {
        const res = await fetch(track.artworkUrl, { method: "HEAD" });
        if (!res.ok) {
          brokenCount++;
          console.log(`  HTTP ${res.status}: "${track.title}" → ${track.artworkUrl}`);
        }
      } catch (e) {
        brokenCount++;
        console.log(`  FETCH ERROR: "${track.title}" → ${track.artworkUrl} (${e instanceof Error ? e.message : e})`);
      }
    }
  }
  if (brokenCount === 0) console.log("  All images OK");

  console.log(`\n--- SUMMARY ---`);
  console.log(`Total active seed tracks: ${seedTracks.length}`);
  console.log(`Duplicates: ${dupeCount}`);
  console.log(`Broken images: ${brokenCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
