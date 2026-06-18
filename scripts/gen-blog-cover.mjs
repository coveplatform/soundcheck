// Generate a cover image for a "The Drop" blog post in the established
// painterly mid-century illustration style, and write it to
// public/blog/blog<N>.jpg (optimized JPEG, matching the rest of the series).
//
// Usage:
//   node scripts/gen-blog-cover.mjs <N> ["post title or topic"]
// Example:
//   node scripts/gen-blog-cover.mjs 18 "How to master music at home"
//
// Requires OPENAI_API_KEY in the environment (falls back to .env.local for
// local runs). Uses the gpt-image-1 model and sharp (already a project dep).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const N = parseInt(process.argv[2], 10);
const topic = (process.argv[3] || "").trim();
if (!Number.isInteger(N) || N <= 0) {
  console.error('Usage: node scripts/gen-blog-cover.mjs <N> ["post title or topic"]');
  process.exit(2);
}

// --- API key: prefer the environment (cloud), fall back to .env.local ---
function resolveKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  try {
    const txt = fs.readFileSync(path.resolve(".env.local"), "utf8");
    const m = txt.match(/^\s*OPENAI_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return null;
}
const key = resolveKey();
if (!key) {
  console.error(
    "ERROR: OPENAI_API_KEY not found in environment or .env.local. " +
      "In the cloud routine environment, add OPENAI_API_KEY as a secret."
  );
  process.exit(1);
}

// --- Deterministic variety: pick scene elements from N so covers differ ---
const pick = (arr) => arr[N % arr.length];
const scene = pick([
  "two or three young musicians jamming together — one on guitar, one at a keyboard, one with headphones",
  "a small group of people dancing loosely at a house party, a mirrored disco ball spinning overhead",
  "a lone figure sitting cross-legged on a rug with big headphones, beside a record player and a stack of vinyl",
  "a band rehearsing in a warm lamp-lit room crammed with gear, cables snaking across the floor",
]);
const backdrop = pick([
  "a night scene through an arched window with a crescent moon and tiny stars",
  "warm dusk light through a tall window with city rooftops beyond",
  "an interior glowing with lamps and a bubbling lava lamp",
  "a sunset-orange glow spilling across the floorboards",
]);
const palette = pick([
  "violet, lavender and hot pink dominant, with coral-orange pops",
  "cobalt blue and purple dominant, with teal-green and pink pops",
  "magenta and indigo dominant, with warm orange and lime accents",
  "purple and periwinkle dominant, with coral and turquoise accents",
]);

const prompt = `A hand-drawn editorial illustration in OIL PASTEL and COLORED PENCIL, risograph print style — part of a consistent series of music-blog cover art with a loose, energetic, slightly weird hand-made feel.
Scene: ${scene}, inside a warm, cluttered, cozy room. ${backdrop}.
Scattered details around the room: leafy potted plants, a chunky speaker or amp, vinyl records and a turntable, a striped woven rug, and a few abstract squiggles and shapes taped on the walls.
Texture and technique (most important): heavy VISIBLE crayon and colored-pencil strokes, dense directional hatching and scribble filling the background, grainy cream / off-white paper showing through the marks. Loose, wobbly, imperfect hand-drawn linework. Naive folk-art / indie zine feel — a little weird and edgy. NOT clean, NOT flat vector, NOT smooth, NOT glossy digital art.
Palette: limited vibrant risograph colours — ${palette} — over a cream paper base.
Wide landscape composition, flat playful perspective, lots of small hand-drawn details. No text, no lettering, no watermark, no logos.${
  topic ? `\nMood should loosely suit a blog post about: ${topic}.` : ""
}`;

async function generate() {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      quality: "high",
      n: 1,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI images API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return Buffer.from(data.data[0].b64_json, "base64");
}

// Retry a few times — the images endpoint occasionally returns transient 5xx/520.
let pngBuf;
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    pngBuf = await generate();
    break;
  } catch (err) {
    console.error(`attempt ${attempt} failed: ${err.message}`);
    if (attempt === 4) process.exit(1);
    await new Promise((r) => setTimeout(r, attempt * 4000));
  }
}

const out = path.resolve(`public/blog/blog${N}.jpg`);
await sharp(pngBuf).jpeg({ quality: 74, mozjpeg: true }).toFile(out);
console.log(`wrote ${out} (${fs.statSync(out).size} bytes)`);
