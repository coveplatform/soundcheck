import Link from "next/link";
import { TrackStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { PageHeader } from "@/components/ui/page-header";
import { TrackTile } from "./track-tile";

export const dynamic = "force-dynamic";

const DEMO_TILES = Array.from({ length: 20 }).map((_, idx) => {
  const i = idx + 1;
  return {
    id: `demo-${i}`,
    title: [
      "Neon Pulse",
      "Golden Hour",
      "Street Lights",
      "Echoes",
      "City Rain",
      "Drift Away",
      "Midnight Drive",
      "Soft Focus",
      "Afterglow",
      "Static Bloom",
      "Low Tide",
      "Glass Rooms",
      "Black Velvet",
      "Mercury",
      "Night Market",
      "Cold Warmth",
      "Pale Signals",
      "Slow Burn",
      "Skyline",
      "Velvet Noise",
    ][idx] ?? `Demo Track ${i}`,
    ArtistProfile: [
      "Maya Kim",
      "James Cole",
      "DJ Nova",
      "Sarah Moon",
      "Tom West",
      "Luna Park",
      "Arden",
      "Noah Lane",
      "Rosa",
      "Kei",
      "Sable",
      "River",
      "Juno",
      "Haze",
      "Marlow",
      "Nico",
      "Ivy",
      "Atlas",
      "Skye",
      "Moss",
    ][idx] ?? `Artist ${i}`,
    artworkUrl: `/activity-artwork/${i}.jpg`,
  };
});

export default async function DiscoverPage() {
  const trackWhere = {
    isPublic: true,
    artworkUrl: { not: null },
    status: {
      in: ["UPLOADED", "QUEUED", "IN_PROGRESS", "COMPLETED"] as TrackStatus[],
    },
  };

  const trackSelect = {
    id: true,
    title: true,
    artworkUrl: true,
    sourceUrl: true,
    sourceType: true,
    createdAt: true,
    reviewsRequested: true,
    reviewsCompleted: true,
    ArtistProfile: { select: { artistName: true } },
  };

  type DiscoverTrack = Awaited<ReturnType<typeof prisma.track.findMany<{ where: typeof trackWhere; select: typeof trackSelect }>>>[number];
  let tracks: DiscoverTrack[] = [];
  let requiresMigration = false;

  try {
    tracks = await prisma.track.findMany({
      where: trackWhere,
      select: trackSelect,
      orderBy: { createdAt: "desc" },
      take: 60,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("Unknown argument `isPublic`")) {
      requiresMigration = true;
      tracks = [];
    } else {
      throw e;
    }
  }

  // Backfill missing artwork from oEmbed (best-effort, fire-and-forget persist)
  await Promise.all(
    tracks
      .filter((t) => !t.artworkUrl && t.sourceType !== "UPLOAD" && t.sourceUrl)
      .map(async (t) => {
        try {
          const hostname = new URL(t.sourceUrl!).hostname.toLowerCase();
          let oembedUrl: string | null = null;
          if (hostname.includes("soundcloud.com")) {
            oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(t.sourceUrl!)}&format=json`;
          } else if (hostname.includes("bandcamp.com")) {
            oembedUrl = `https://bandcamp.com/oembed?url=${encodeURIComponent(t.sourceUrl!)}&format=json`;
          } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
            oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(t.sourceUrl!)}&format=json`;
          }
          if (!oembedUrl) return;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(oembedUrl, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url) {
              t.artworkUrl = data.thumbnail_url;
              prisma.track.update({ where: { id: t.id }, data: { artworkUrl: data.thumbnail_url } }).catch(() => {});
            }
          }
        } catch { /* best-effort */ }
      })
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950 pt-14">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <AuthButtons theme="light" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <PageHeader
          eyebrow="Discover"
          title="Discover"
          description="Browse tracks submitted by artists on Soundcheck."
        />

        {requiresMigration ? (
          <div className="mt-10 text-sm text-black/50">
            Discover needs a quick update. Run Prisma migrate + generate to enable public/private discover visibility.
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {(tracks.length > 0 ? tracks : DEMO_TILES).map((t: any) => {
            const isDemo = tracks.length === 0;
            const trackId = isDemo ? null : t.id;
            const sourceUrl = isDemo ? "/signup" : t.sourceUrl;
            const artworkUrl = isDemo ? t.artworkUrl : t.artworkUrl;
            const title = isDemo ? t.title : t.title;
            const artistName = isDemo ? t.ArtistProfile : t.ArtistProfile?.artistName;

            return (
              <TrackTile
                key={t.id}
                trackId={trackId}
                title={title}
                artistName={artistName}
                artworkUrl={artworkUrl}
                sourceUrl={sourceUrl}
                isDemo={isDemo}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
