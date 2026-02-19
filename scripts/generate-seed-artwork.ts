/**
 * generate-seed-artwork.ts
 *
 * Generates abstract gradient SVG album artwork for all seed tracks,
 * uploads each to S3, and updates the artworkUrl in the DB.
 *
 * No image libraries required — pure SVG string generation.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-seed-artwork.ts
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";

// ── S3 setup ─────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.UPLOADS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.UPLOADS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.UPLOADS_S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.UPLOADS_S3_BUCKET!;
const BASE_URL = (() => {
  const raw = (process.env.UPLOADS_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return raw.startsWith("http") ? raw : `https://${raw}`;
})();

// ── Deterministic RNG seeded from a string ────────────────────────────────────

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 16777619) >>> 0);
  }
  return h;
}

function makeRng(seed: string) {
  let state = hashStr(seed);
  return function rand(min = 0, max = 1): number {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state = state >>> 0;
    return min + (state / 0xffffffff) * (max - min);
  };
}

// ── Genre palettes ────────────────────────────────────────────────────────────

type Palette = {
  bg: [string, string];         // gradient start → end
  blobs: string[];              // blob accent colours
  lineColor: string;            // decorative line colour
  mode: "electronic" | "hiphop" | "rock";
};

const PALETTES: Record<string, Palette[]> = {
  electronic: [
    {
      bg: ["#060616", "#0d0d2a"],
      blobs: ["#7b2fff", "#00e5ff", "#ff2d78", "#2dffd9"],
      lineColor: "#00e5ff",
      mode: "electronic",
    },
    {
      bg: ["#080612", "#180d30"],
      blobs: ["#9d4edd", "#ff6bff", "#00bfff", "#ff44aa"],
      lineColor: "#ff6bff",
      mode: "electronic",
    },
    {
      bg: ["#00090f", "#011220"],
      blobs: ["#00ffcc", "#0066ff", "#ff0066", "#33ffcc"],
      lineColor: "#00ffcc",
      mode: "electronic",
    },
  ],
  hiphop: [
    {
      bg: ["#0a0806", "#180e04"],
      blobs: ["#c9a227", "#8b2500", "#f4a300", "#3d1b00"],
      lineColor: "#c9a227",
      mode: "hiphop",
    },
    {
      bg: ["#080508", "#1a0824"],
      blobs: ["#d4af37", "#8b0000", "#9d4edd", "#c9a227"],
      lineColor: "#d4af37",
      mode: "hiphop",
    },
    {
      bg: ["#040404", "#1a1008"],
      blobs: ["#e8c619", "#a31515", "#ff6b35", "#2d1b00"],
      lineColor: "#e8c619",
      mode: "hiphop",
    },
  ],
  rock: [
    {
      bg: ["#0d0808", "#1a0505"],
      blobs: ["#cc2200", "#ff4400", "#880000", "#ff6622"],
      lineColor: "#ff4400",
      mode: "rock",
    },
    {
      bg: ["#080808", "#1a0a0a"],
      blobs: ["#dd1111", "#ff5500", "#aa0000", "#ff2200"],
      lineColor: "#dd1111",
      mode: "rock",
    },
    {
      bg: ["#040606", "#0a100a"],
      blobs: ["#cc3300", "#ff6600", "#994400", "#ff4400"],
      lineColor: "#ff6600",
      mode: "rock",
    },
  ],
};

// ── SVG generator ─────────────────────────────────────────────────────────────

function generateSvg(trackId: string, genreKey: string): string {
  const rng = makeRng(trackId);
  const paletteGroup = PALETTES[genreKey] ?? PALETTES["electronic"];
  const palette = paletteGroup[Math.floor(rng(0, paletteGroup.length))];

  // Pick 3 blobs with random positions
  const blobs = Array.from({ length: 3 }, (_, i) => ({
    color: palette.blobs[i % palette.blobs.length],
    cx: Math.round(rng(50, 350)),
    cy: Math.round(rng(50, 350)),
    r: Math.round(rng(100, 200)),
    opacity: rng(0.45, 0.75),
  }));

  // Electronic: horizontal scan lines + waveform path
  // Hip-hop: diagonal angular slash shapes
  // Rock: jagged zigzag lines

  let decorative = "";

  if (palette.mode === "electronic") {
    // Subtle grid lines
    const lineOpacity = 0.07;
    const lines = Array.from({ length: 8 }, (_, i) => {
      const y = Math.round(50 + i * 44);
      return `<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="${palette.lineColor}" stroke-width="0.5" opacity="${lineOpacity}" />`;
    }).join("\n    ");

    // Waveform-style path
    const waveY = Math.round(rng(150, 260));
    const wavePoints: string[] = [];
    for (let x = 0; x <= 400; x += 10) {
      const amp = rng(12, 40);
      const y = waveY + Math.sin((x / 400) * Math.PI * rng(4, 8)) * amp;
      wavePoints.push(`${x},${Math.round(y)}`);
    }
    const wavePath = `M ${wavePoints.join(" L ")}`;
    decorative = `
    ${lines}
    <path d="${wavePath}" stroke="${palette.lineColor}" stroke-width="${rng(1, 2).toFixed(1)}" fill="none" opacity="0.25" />`;

  } else if (palette.mode === "hiphop") {
    // Angular diagonal slashes
    const slashes = Array.from({ length: 5 }, (_, i) => {
      const x = Math.round(rng(-40, 380));
      const tilt = rng(0.6, 1.2);
      const w = Math.round(rng(6, 18));
      const h = 520;
      return `<rect x="${x}" y="-60" width="${w}" height="${h}" fill="${palette.lineColor}" opacity="${rng(0.04, 0.12)}" transform="rotate(${rng(-25, -15)}, ${x + w / 2}, 200)" />`;
    }).join("\n    ");
    decorative = `\n    ${slashes}`;

  } else if (palette.mode === "rock") {
    // Jagged lightning/crack lines
    const makeJag = (startX: number, startY: number): string => {
      let d = `M ${startX} ${startY}`;
      let x = startX;
      let y = startY;
      for (let i = 0; i < 8; i++) {
        x += rng(-30, 60);
        y += rng(30, 60);
        d += ` L ${Math.round(x)} ${Math.round(y)}`;
      }
      return d;
    };
    const cracks = Array.from({ length: 3 }, () => {
      const d = makeJag(Math.round(rng(60, 340)), 0);
      return `<path d="${d}" stroke="${palette.lineColor}" stroke-width="${rng(0.5, 1.5).toFixed(1)}" fill="none" opacity="${rng(0.1, 0.22).toFixed(2)}" />`;
    }).join("\n    ");
    decorative = `\n    ${cracks}`;
  }

  // Unique gradient IDs (avoid collisions if SVGs inline later)
  const uid = trackId.replace(/[^a-z0-9]/gi, "").slice(0, 8);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg_${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg[0]}" />
      <stop offset="100%" stop-color="${palette.bg[1]}" />
    </linearGradient>
    ${blobs.map((b, i) => `<radialGradient id="b${i}_${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${b.color}" stop-opacity="${b.opacity.toFixed(2)}" />
      <stop offset="100%" stop-color="${b.color}" stop-opacity="0" />
    </radialGradient>`).join("\n    ")}
    <filter id="blur_${uid}">
      <feGaussianBlur stdDeviation="40" />
    </filter>
    <filter id="noise_${uid}" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>
      <feComposite in="blended" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <!-- Base gradient -->
  <rect width="400" height="400" fill="url(#bg_${uid})" />

  <!-- Bokeh blobs -->
  ${blobs.map((b, i) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="url(#b${i}_${uid})" filter="url(#blur_${uid})" />`).join("\n  ")}

  <!-- Genre decorative elements -->${decorative}

  <!-- Grain overlay for texture -->
  <rect width="400" height="400" fill="white" opacity="0.03" filter="url(#noise_${uid})" />

  <!-- Subtle vignette -->
  <radialGradient id="vig_${uid}" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="transparent" />
    <stop offset="100%" stop-color="black" stop-opacity="0.5" />
  </radialGradient>
  <rect width="400" height="400" fill="url(#vig_${uid})" />
</svg>`;
}

// ── Upload to S3 ──────────────────────────────────────────────────────────────

async function uploadSvg(trackId: string, svgContent: string): Promise<string> {
  const key = `tracks/artwork-${trackId}.svg`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(svgContent, "utf-8"),
      ContentType: "image/svg+xml",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${BASE_URL}/${key}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const tracks = await prisma.track.findMany({
    where: {
      ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } },
      status: { in: ["QUEUED", "IN_PROGRESS", "COMPLETED"] },
    },
    select: {
      id: true,
      title: true,
      Genre: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Generating SVG artwork for ${tracks.length} seed tracks...\n`);

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    process.stdout.write(`  [${i + 1}/${tracks.length}] "${track.title}"... `);

    // Determine genre key
    const genreNames = track.Genre.map((g) => g.name.toLowerCase());
    let genreKey = "electronic";
    if (genreNames.some((g) => g.includes("hip") || g.includes("rap") || g.includes("trap"))) {
      genreKey = "hiphop";
    } else if (genreNames.some((g) => g.includes("rock") || g.includes("metal") || g.includes("punk"))) {
      genreKey = "rock";
    }

    const svg = generateSvg(track.id, genreKey);

    let artworkUrl: string;
    try {
      artworkUrl = await uploadSvg(track.id, svg);
    } catch (err) {
      console.log(`FAILED: ${err}`);
      continue;
    }

    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });

    console.log(`✓  (${genreKey})`);
  }

  await prisma.$disconnect();
  console.log(`\nDone. ${tracks.length} tracks updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
