import { prisma } from "../src/lib/prisma";

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      ArtistProfile: {
        User: { email: { endsWith: "@seed.mixreflect.com" } },
      },
    },
    select: { id: true, title: true, status: true, sourceUrl: true },
    orderBy: { title: "asc" },
  });

  console.log("All seed tracks (any status):\n");
  for (const t of tracks) {
    console.log(`${t.status.padEnd(12)} ${t.title.padEnd(30)} ${t.sourceUrl.slice(0, 70)}`);
  }

  console.log(`\nTotal: ${tracks.length}`);

  // Check for same sourceUrl (actual audio duplicates)
  const urlMap = new Map<string, typeof tracks>();
  for (const t of tracks) {
    if (!urlMap.has(t.sourceUrl)) urlMap.set(t.sourceUrl, []);
    urlMap.get(t.sourceUrl)!.push(t);
  }

  console.log("\n--- SAME SOURCE URL (true duplicates) ---");
  let dupes = 0;
  for (const [url, group] of urlMap) {
    if (group.length > 1) {
      dupes += group.length - 1;
      console.log(`\nSource: ${url.slice(0, 70)}`);
      for (const t of group) {
        console.log(`  ${t.status.padEnd(12)} "${t.title}" (${t.id})`);
      }
    }
  }
  if (dupes === 0) console.log("  None found");
  else console.log(`\n${dupes} duplicate(s) to remove`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
