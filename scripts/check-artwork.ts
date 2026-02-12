import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      ArtistProfile: {
        User: { email: { endsWith: "@seed.mixreflect.com" } },
      },
    },
    select: { id: true, title: true, artworkUrl: true },
    orderBy: { title: "asc" },
  });

  console.log(`Checking ${tracks.length} seed tracks...\n`);

  const broken: { title: string; id: string; url: string; status: number | string }[] = [];

  for (const t of tracks) {
    if (!t.artworkUrl) {
      broken.push({ title: t.title, id: t.id, url: "", status: "NO_URL" });
      console.log(`  ❌ NO ART: "${t.title}"`);
      continue;
    }
    try {
      const r = await fetch(t.artworkUrl, { method: "HEAD" });
      if (!r.ok) {
        broken.push({ title: t.title, id: t.id, url: t.artworkUrl, status: r.status });
        console.log(`  ❌ HTTP ${r.status}: "${t.title}" → ${t.artworkUrl.slice(0, 80)}...`);
      } else {
        console.log(`  ✅ "${t.title}"`);
      }
    } catch (e) {
      broken.push({ title: t.title, id: t.id, url: t.artworkUrl, status: "FETCH_ERR" });
      console.log(`  ❌ ERROR: "${t.title}" → ${t.artworkUrl.slice(0, 80)}...`);
    }
  }

  console.log(`\n--- ${broken.length} broken out of ${tracks.length} ---`);
  for (const b of broken) {
    console.log(`  "${b.title}" (${b.id}) status=${b.status}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
