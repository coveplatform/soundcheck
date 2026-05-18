import { TrackStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DiscoverScene, type DiscoverTrackData } from "./discover-scene";

export const dynamic = "force-dynamic";

const DEMO_TILES: DiscoverTrackData[] = Array.from({ length: 34 }).map(
  (_, idx) => {
    const i = idx + 1;
    const names = [
      "Neon Pulse", "Golden Hour", "Street Lights", "Echoes", "City Rain",
      "Drift Away", "Midnight Drive", "Soft Focus", "Afterglow", "Static Bloom",
      "Low Tide", "Glass Rooms", "Black Velvet", "Mercury", "Night Market",
      "Cold Warmth", "Pale Signals", "Slow Burn", "Skyline", "Velvet Noise",
      "Deep Signal", "Ghost Freq", "Plasma", "Orbit", "Flux",
      "Void Echo", "Phase Shift", "Lumina", "Sub Rosa", "Dark Matter",
      "Zenith", "Penumbra", "Quasar", "Nebula",
    ];
    const artists = [
      "Maya Kim", "James Cole", "DJ Nova", "Sarah Moon", "Tom West",
      "Luna Park", "Arden", "Noah Lane", "Rosa", "Kei",
      "Sable", "River", "Juno", "Haze", "Marlow",
      "Nico", "Ivy", "Atlas", "Skye", "Moss",
      "Onyx", "Prism", "Echo", "Zara", "Kai",
      "Vega", "Lyra", "Orion", "Celeste", "Drift",
      "Nova", "Astra", "Cosmo", "Stella",
    ];
    const genres = [
      "Electronic", "Indie Pop", "Hip-Hop", "R&B", "Lo-Fi",
      "Ambient", "Synthwave", "Dream Pop", "Alternative", "Electronica",
      "Chillwave", "Art Pop", "Soul", "Indie Rock", "Trip-Hop",
      "Downtempo", "Post-Punk", "Neo-Soul", "Future Bass", "Shoegaze",
      "Techno", "IDM", "Minimal", "Deep House", "Breakbeat",
      "Dark Ambient", "Progressive", "Cinematic", "Experimental", "Drum & Bass",
      "Trance", "Glitch", "Space Rock", "Psych",
    ];
    const featured = [0, 4, 11, 19, 27];
    const seed = Math.sin(i * 9301 + 49297) * 233280;
    const r = (seed - Math.floor(seed));
    return {
      id: `demo-${i}`,
      title: names[idx] ?? `Demo Track ${i}`,
      artistName: artists[idx] ?? `Artist ${i}`,
      artworkUrl: `/activity-artwork/${i}.jpg`,
      sourceUrl: "/signup",
      isDemo: true,
      genre: genres[idx] ?? "Other",
      playCount: Math.floor(r * 800) + 20,
      reviewCount: Math.floor(r * 12) + 1,
      rating: Math.round((3.5 + r * 1.5) * 10) / 10,
      isFeatured: featured.includes(idx),
    };
  },
);

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
    publicPlayCount: true,
    ArtistProfile: { select: { artistName: true } },
    Genre: { select: { name: true }, take: 1 },
    Review: {
      where: { status: "COMPLETED" as const },
      select: { productionScore: true, vocalScore: true, originalityScore: true },
    },
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

  // Map DB tracks → DiscoverTrackData shape
  const sceneData: DiscoverTrackData[] =
    tracks.length > 0
      ? tracks.map((t) => {
          // Compute average rating from completed review scores (1-5 scale)
          const scores = t.Review.flatMap((r) =>
            [r.productionScore, r.vocalScore, r.originalityScore].filter(
              (s): s is number => s != null
            )
          );
          const avgRating =
            scores.length > 0
              ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
              : undefined;

          return {
            id: t.id,
            title: t.title,
            artistName: t.ArtistProfile?.artistName ?? "Unknown",
            artworkUrl: t.artworkUrl ?? null,
            sourceUrl: t.sourceUrl ?? "/signup",
            isDemo: false,
            genre: t.Genre[0]?.name ?? undefined,
            playCount: t.publicPlayCount > 0 ? t.publicPlayCount : undefined,
            reviewCount: t.reviewsCompleted > 0 ? t.reviewsCompleted : undefined,
            rating: avgRating,
            isFeatured: (avgRating ?? 0) >= 4.0 && t.reviewsCompleted >= 3,
          };
        })
      : DEMO_TILES;

  return <DiscoverScene tracks={sceneData} />;
}
