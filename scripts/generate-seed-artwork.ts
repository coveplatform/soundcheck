/**
 * generate-seed-artwork.ts
 *
 * Generates bold geometric SVG album artwork for all seed tracks,
 * uploads each to S3, and updates the artworkUrl in the DB.
 *
 * No image libraries required — pure SVG string generation.
 * Uses solid fills + gradients (no blur filters that all look the same).
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

function makeRng(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = (Math.imul(state, 16777619) >>> 0);
  }
  return function rand(min = 0, max = 1): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state = state >>> 0;
    return min + (state / 0xffffffff) * (max - min);
  };
}

// ── Color schemes per genre ───────────────────────────────────────────────────

const SCHEMES = {
  electronic: [
    { bg: "#07071a", a: "#00e5ff", b: "#7b2fff", c: "#ff2d78", text: "#00e5ff" },
    { bg: "#050514", a: "#2dffd9", b: "#9d4edd", c: "#ff6bff", text: "#2dffd9" },
    { bg: "#080018", a: "#00bfff", b: "#6600ff", c: "#ff00aa", text: "#00bfff" },
    { bg: "#020d1a", a: "#00ffcc", b: "#0066ff", c: "#ff2255", text: "#00ffcc" },
  ],
  hiphop: [
    { bg: "#0a0806", a: "#c9a227", b: "#8b2500", c: "#f4a300", text: "#c9a227" },
    { bg: "#0d0a04", a: "#d4af37", b: "#6b1010", c: "#ffb347", text: "#d4af37" },
    { bg: "#080408", a: "#e8c619", b: "#4a1070", c: "#ff6b35", text: "#e8c619" },
    { bg: "#060606", a: "#f0c040", b: "#880000", c: "#cc8800", text: "#f0c040" },
  ],
  rock: [
    { bg: "#0d0505", a: "#cc2200", b: "#ff4400", c: "#ff6622", text: "#ff4400" },
    { bg: "#080808", a: "#dd1111", b: "#ff5500", c: "#aa2200", text: "#dd1111" },
    { bg: "#050506", a: "#ff3300", b: "#cc0000", c: "#ff6600", text: "#ff3300" },
    { bg: "#060304", a: "#e63900", b: "#cc2200", c: "#ff8844", text: "#e63900" },
  ],
};

// ── Layout generators ─────────────────────────────────────────────────────────

type Scheme = { bg: string; a: string; b: string; c: string; text: string };

/** Style 0: Quarter-circle composition — big arc from corner + accent circle */
function styleQuarterCircle(rng: ReturnType<typeof makeRng>, s: Scheme, uid: string): string {
  const mainR = Math.round(rng(240, 310));
  const accentR = Math.round(rng(60, 110));
  const corner = Math.floor(rng(0, 4)); // which corner the arc comes from
  const corners = [
    [0, 0], [400, 0], [400, 400], [0, 400],
  ];
  const [cx, cy] = corners[corner];
  const [ax, ay] = corners[(corner + 2) % 4]; // accent in opposite corner region
  const accentX = ax === 0 ? Math.round(rng(50, 140)) : Math.round(rng(260, 350));
  const accentY = ay === 0 ? Math.round(rng(50, 140)) : Math.round(rng(260, 350));

  return `
  <defs>
    <linearGradient id="g1_${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${s.a}" />
      <stop offset="100%" stop-color="${s.b}" />
    </linearGradient>
    <linearGradient id="g2_${uid}" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${s.c}" />
      <stop offset="100%" stop-color="${s.a}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="${s.bg}" />
  <circle cx="${cx}" cy="${cy}" r="${mainR}" fill="url(#g1_${uid})" opacity="0.9" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(mainR * 0.55)}" fill="${s.bg}" />
  <circle cx="${accentX}" cy="${accentY}" r="${accentR}" fill="url(#g2_${uid})" opacity="0.85" />
  <circle cx="${accentX}" cy="${accentY}" r="${Math.round(accentR * 0.45)}" fill="${s.bg}" />`;
}

/** Style 1: Diagonal band across the canvas */
function styleDiagonalBand(rng: ReturnType<typeof makeRng>, s: Scheme, uid: string): string {
  const tilt = rng(-0.3, 0.3); // how much it tilts
  const bandW = Math.round(rng(120, 200));
  const offset = Math.round(rng(80, 200));
  // parallelogram points
  const t = tilt * 400;
  const p1 = `0,${offset + t}`;
  const p2 = `400,${offset}`;
  const p3 = `400,${offset + bandW}`;
  const p4 = `0,${offset + bandW + t}`;

  const numStripes = Math.floor(rng(3, 7));
  const stripes = Array.from({ length: numStripes }, (_, i) => {
    const y = Math.round(rng(20, 380));
    const x2 = Math.round(rng(200, 400));
    return `<line x1="0" y1="${y}" x2="${x2}" y2="${y + Math.round(t * 0.5)}" stroke="${s.a}" stroke-width="${rng(0.5, 2).toFixed(1)}" opacity="${rng(0.15, 0.4).toFixed(2)}" />`;
  }).join("\n  ");

  return `
  <defs>
    <linearGradient id="g1_${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${s.a}" />
      <stop offset="100%" stop-color="${s.b}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="${s.bg}" />
  ${stripes}
  <polygon points="${p1} ${p2} ${p3} ${p4}" fill="url(#g1_${uid})" opacity="0.92" />
  <polygon points="${p1} ${p2} ${p3} ${p4}" fill="none" stroke="${s.c}" stroke-width="${rng(1, 3).toFixed(1)}" opacity="0.5" />`;
}

/** Style 2: Equalizer bars (genre-appropriate) */
function styleEqBars(rng: ReturnType<typeof makeRng>, s: Scheme, uid: string): string {
  const numBars = Math.floor(rng(12, 22));
  const barWidth = Math.floor(400 / numBars);
  const gap = Math.max(1, Math.floor(barWidth * 0.15));
  const effectiveW = barWidth - gap;

  const bars = Array.from({ length: numBars }, (_, i) => {
    const h = Math.round(rng(40, 340));
    const x = i * barWidth + gap / 2;
    const y = 400 - h;
    const shade = rng(0.5, 1.0);
    return `<rect x="${x}" y="${y}" width="${effectiveW}" height="${h}" fill="${s.a}" opacity="${shade.toFixed(2)}" rx="2" />`;
  }).join("\n  ");

  const h2 = Math.round(rng(20, 280));

  return `
  <defs>
    <linearGradient id="g1_${uid}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${s.b}" />
      <stop offset="100%" stop-color="${s.a}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="${s.bg}" />
  <rect width="400" height="${h2}" y="${400 - h2}" fill="${s.b}" opacity="0.08" />
  ${bars.replace(new RegExp(`fill="${s.a}"`, 'g'), `fill="url(#g1_${uid})"`)  }
  <line x1="0" y1="400" x2="400" y2="400" stroke="${s.c}" stroke-width="2" opacity="0.6" />`;
}

/** Style 3: Concentric rings from an off-center point */
function styleConcentricRings(rng: ReturnType<typeof makeRng>, s: Scheme, uid: string): string {
  const cx = Math.round(rng(100, 300));
  const cy = Math.round(rng(100, 300));
  const numRings = Math.floor(rng(5, 9));
  const maxR = Math.round(rng(160, 260));
  const sw = rng(1.5, 4).toFixed(1);

  const rings = Array.from({ length: numRings }, (_, i) => {
    const r = Math.round((maxR / numRings) * (i + 1));
    const opacity = (1 - i / numRings) * 0.8 + 0.1;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i % 2 === 0 ? s.a : s.b}" stroke-width="${sw}" opacity="${opacity.toFixed(2)}" />`;
  }).join("\n  ");

  return `
  <rect width="400" height="400" fill="${s.bg}" />
  ${rings}
  <circle cx="${cx}" cy="${cy}" r="${Math.round(rng(12, 28))}" fill="${s.c}" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(rng(4, 10))}" fill="${s.bg}" />`;
}

/** Style 4: Angular fragments / shatter (rock-style) */
function styleFragments(rng: ReturnType<typeof makeRng>, s: Scheme, uid: string): string {
  const numFrag = Math.floor(rng(5, 10));

  const frags = Array.from({ length: numFrag }, (_, i) => {
    // Random triangle
    const points = Array.from({ length: 3 }, () => `${Math.round(rng(-20, 420))},${Math.round(rng(-20, 420))}`).join(" ");
    const color = i % 3 === 0 ? s.a : i % 3 === 1 ? s.b : s.c;
    const opacity = rng(0.35, 0.9).toFixed(2);
    return `<polygon points="${points}" fill="${color}" opacity="${opacity}" />`;
  }).join("\n  ");

  return `
  <defs>
    <linearGradient id="g1_${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${s.bg}" />
      <stop offset="100%" stop-color="${s.b}44" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="${s.bg}" />
  <rect width="400" height="400" fill="url(#g1_${uid})" />
  ${frags}
  <rect width="400" height="400" fill="${s.bg}" opacity="0.35" />`;
}

/** Style 5: Bold stripe blocks (hip-hop Mondrian-ish) */
function styleStripeBlocks(rng: ReturnType<typeof makeRng>, s: Scheme, uid: string): string {
  const horizontal = rng() > 0.5;
  const numBlocks = Math.floor(rng(3, 7));
  const sizes = Array.from({ length: numBlocks }, () => rng(0.5, 2));
  const total = sizes.reduce((a, b) => a + b, 0);
  const colors = [s.a, s.b, s.c, s.bg, s.bg, s.bg];

  let pos = 0;
  const blocks = sizes.map((size, i) => {
    const ratio = size / total;
    const block = horizontal
      ? `<rect x="${Math.round(pos * 400)}" y="0" width="${Math.round(ratio * 400)}" height="400" fill="${colors[i % colors.length]}" />`
      : `<rect x="0" y="${Math.round(pos * 400)}" width="400" height="${Math.round(ratio * 400)}" fill="${colors[i % colors.length]}" />`;
    pos += ratio;
    return block;
  }).join("\n  ");

  // Accent circle
  const acR = Math.round(rng(40, 90));
  const acX = Math.round(rng(60, 340));
  const acY = Math.round(rng(60, 340));

  return `
  <rect width="400" height="400" fill="${s.bg}" />
  ${blocks}
  <circle cx="${acX}" cy="${acY}" r="${acR}" fill="${horizontal ? s.b : s.a}" />
  <circle cx="${acX}" cy="${acY}" r="${Math.round(acR * 0.5)}" fill="${s.bg}" />
  <line x1="0" y1="0" x2="400" y2="400" stroke="${s.c}" stroke-width="${rng(0.5, 1.5).toFixed(1)}" opacity="0.3" />`;
}

// ── Pick layout based on genre + rng ──────────────────────────────────────────

function generateSvg(trackId: string, genreKey: string): string {
  const rng = makeRng(trackId);
  const schemes = SCHEMES[genreKey as keyof typeof SCHEMES] ?? SCHEMES.electronic;
  const schemeIdx = Math.floor(rng(0, schemes.length));
  const s = schemes[schemeIdx];
  const uid = trackId.replace(/[^a-z0-9]/gi, "").slice(0, 10);

  // Genre → preferred styles
  // Electronic: rings, eq bars, diagonal
  // Hip-hop: stripe blocks, quarter circle, diagonal
  // Rock: fragments, diagonal, quarter circle
  let styleIndex: number;
  if (genreKey === "electronic") {
    const pool = [2, 3, 1, 0]; // eq bars, rings, diagonal, quarter
    styleIndex = pool[Math.floor(rng(0, pool.length))];
  } else if (genreKey === "hiphop") {
    const pool = [5, 0, 1, 2]; // stripes, quarter, diagonal, eq
    styleIndex = pool[Math.floor(rng(0, pool.length))];
  } else {
    const pool = [4, 1, 0, 3]; // fragments, diagonal, quarter, rings
    styleIndex = pool[Math.floor(rng(0, pool.length))];
  }

  let body: string;
  switch (styleIndex) {
    case 0: body = styleQuarterCircle(rng, s, uid); break;
    case 1: body = styleDiagonalBand(rng, s, uid); break;
    case 2: body = styleEqBars(rng, s, uid); break;
    case 3: body = styleConcentricRings(rng, s, uid); break;
    case 4: body = styleFragments(rng, s, uid); break;
    case 5: body = styleStripeBlocks(rng, s, uid); break;
    default: body = styleQuarterCircle(rng, s, uid);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${body}
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
