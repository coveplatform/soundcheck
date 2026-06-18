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
const instrument = pick([
  "an electric guitar",
  "an acoustic guitar",
  "a small synthesizer / keyboard",
  "an electric guitar, with a microphone on a stand nearby",
]);
const window = pick([
  "a large window letting in soft morning light",
  "an arched window showing a calm sky and distant rooftops",
  "a window with a leafy green view and warm afternoon light",
  "a tall window with a pale sunset beyond it",
]);
const accent = pick([
  "mustard yellow, dusty teal and coral pink",
  "warm orange, sky blue and soft pink",
  "ochre yellow, sage green and terracotta",
  "teal, blush pink and golden yellow",
]);
const poster = pick([
  "TRUST YOUR EARS",
  "FINISH THE SONG",
  "PLAY IT LOUD",
  "ONE MORE TAKE",
  "KEEP IT HONEST",
]);

const prompt = `A painterly editorial illustration in a calm mid-century modern style, part of a consistent series of music-blog cover art.
Subject: a single young musician with messy black hair, seated on a wooden stool, absorbed in playing ${instrument}.
Setting: a warm, sunlit home studio with cream and off-white textured walls, ${window}, a hanging pendant globe light, a few leafy potted plants, a small guitar amp/speaker, a crate of vinyl records, and a pedalboard with a cable curling across the floor. Geometric pastel rugs on the floor.
Wall decor: a few flat abstract geometric shapes (circles, squares, half-moons) and one small taped poster with the short hand-lettered phrase "${poster}".
Color palette: muted pastels — soft cream base with accents of ${accent} — and confident black silhouettes with ink line accents.
Style: gouache / acrylic painterly texture, flat shapes, generous negative space, gentle warm lighting, editorial illustration, slightly imperfect hand-painted feel. Wide landscape composition. No text other than the small poster phrase, no camera, no watermark, no logos.${
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
await sharp(pngBuf).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
console.log(`wrote ${out} (${fs.statSync(out).size} bytes)`);
