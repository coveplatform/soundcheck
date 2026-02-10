import Link from "next/link";
import { TrackStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
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
    artist: [
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

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre: selectedGenreSlug } = await searchParams;

  const trackWhere = {
    isPublic: true,
    status: {
      in: ["UPLOADED", "QUEUED", "IN_PROGRESS", "COMPLETED"] as TrackStatus[],
    },
    ...(selectedGenreSlug
      ? {
          genres: {
            some: {
              slug: selectedGenreSlug,
            },
          },
        }
      : {}),
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
    genres: { select: { id: true, name: true } },
    artist: { select: { artistName: true } },
  };

  const genres = await prisma.genre.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

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

  const selectedGenreName = selectedGenreSlug
    ? genres.find((g) => g.slug === selectedGenreSlug)?.name ?? "Genre"
    : null;

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
          title={selectedGenreName ? `Discover: ${selectedGenreName}` : "Discover"}
          description="Browse tracks by genre. Find something new."
        />

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/discover"
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border border-black/10 bg-white/50 hover:bg-white/70 transition-colors duration-150 ease-out motion-reduce:transition-none",
              !selectedGenreSlug
                ? "bg-black text-white border-black hover:bg-black"
                : "text-black/70"
            )}
          >
            All
          </Link>
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/discover?genre=${encodeURIComponent(g.slug)}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border border-black/10 bg-white/50 hover:bg-white/70 transition-colors duration-150 ease-out motion-reduce:transition-none",
                selectedGenreSlug === g.slug
                  ? "bg-black text-white border-black hover:bg-black"
                  : "text-black/70"
              )}
            >
              {g.name}
            </Link>
          ))}
        </div>

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
            const artistName = isDemo ? t.artist : t.artist?.artistName;

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
