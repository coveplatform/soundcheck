import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
// Usage:
//   npx tsx scripts/ai-inject-review.ts --track <trackId> [--count <n>] [--complete]
//   npx tsx scripts/ai-inject-review.ts --artist <email> --title <substr> [--count <n>] [--complete]
//
// --count    Number of reviews to inject (default: 1)
// --complete Force-mark the track COMPLETED after injecting (default: auto when reviewsCompleted >= reviewsRequested)

function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

const TRACK_ID = getArg("--track");
const ARTIST_EMAIL = getArg("--artist");
const TITLE_SUBSTR = getArg("--title");
const COUNT = Math.max(1, parseInt(getArg("--count") ?? "1", 10));
const FORCE_COMPLETE = process.argv.includes("--complete");

if (!TRACK_ID && !(ARTIST_EMAIL && TITLE_SUBSTR)) {
  console.error(
    "Usage:\n" +
      "  npx tsx scripts/ai-inject-review.ts --track <trackId> [--count <n>] [--complete]\n" +
      "  npx tsx scripts/ai-inject-review.ts --artist <email> --title <substr> [--count <n>] [--complete]"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// DB + AI clients
// ---------------------------------------------------------------------------
const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No DATABASE_URL found in environment");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("No ANTHROPIC_API_KEY found in environment");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// Reviewer personas — cycled across injected reviews for variety
// ---------------------------------------------------------------------------
const PERSONAS = [
  "casual music listener, writes conversationally, uses lowercase, occasional 'ngl' or 'tbh', brief and direct",
  "thoughtful and measured, complete sentences, occasionally moved by emotion, no over-punctuation",
  "warm and enthusiastic, uses exclamation marks naturally, genuinely excited when something lands",
  "production-focused, references technical elements (kick, low end, stereo width, dynamics), analytical tone",
  "indie/alternative fan, compares to similar artists, storytelling style, notices arrangement details",
  "beat-head, short punchy sentences, very specific about rhythmic elements, uses 'hard' as a compliment",
];

// ---------------------------------------------------------------------------
// AI review generation via tool use (structured JSON output)
// ---------------------------------------------------------------------------
interface GeneratedReview {
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  productionScore: number;
  vocalScore: number | null;
  originalityScore: number;
  wouldListenAgain: boolean;
  wouldAddToPlaylist: boolean;
  wouldShare: boolean;
  wouldFollow: boolean;
  qualityLevel: "NOT_READY" | "DEMO_STAGE" | "ALMOST_THERE" | "RELEASE_READY" | "PROFESSIONAL";
  lowEndClarity: "PERFECT" | "KICK_TOO_LOUD" | "BASS_TOO_LOUD" | "BOTH_MUDDY" | "BARELY_AUDIBLE";
  vocalClarity: "CRYSTAL_CLEAR" | "SLIGHTLY_BURIED" | "BURIED" | "TOO_LOUD" | "NOT_APPLICABLE";
  highEndQuality: "PERFECT" | "TOO_DULL" | "TOO_HARSH" | "ACCEPTABLE";
  stereoWidth: "TOO_NARROW" | "GOOD_BALANCE" | "TOO_WIDE";
  dynamics: "GREAT_DYNAMICS" | "ACCEPTABLE" | "TOO_COMPRESSED" | "TOO_QUIET";
  energyCurve: "BUILDS_PERFECTLY" | "STAYS_FLAT" | "BUILDS_NO_PAYOFF" | "ALL_OVER_PLACE";
  trackLength: "TOO_SHORT" | "PERFECT" | "BIT_LONG" | "WAY_TOO_LONG";
  tooRepetitive: boolean;
  playlistAction: "ADD_TO_LIBRARY" | "LET_PLAY" | "SKIP" | "DISLIKE";
  nextFocus: "MIXING" | "ARRANGEMENT" | "SOUND_DESIGN" | "SONGWRITING" | "PERFORMANCE" | "READY_TO_RELEASE";
  expectedPlacement: "EDITORIAL" | "SOUNDCLOUD_TRENDING" | "CLUB" | "COFFEE_SHOP" | "VIDEO_GAME" | "AD" | "NOWHERE";
  bestPart: string;
  biggestWeaknessSpecific: string;
  additionalNotes?: string;
}

async function generateReview(context: {
  title: string;
  genres: string[];
  feedbackFocus: string | null | undefined;
  existingFeedbackSummary: string;
  persona: string;
  isInstrumental: boolean;
}): Promise<GeneratedReview> {
  const genreStr = context.genres.length ? context.genres.join(", ") : "unknown genre";
  const focusStr = context.feedbackFocus
    ? `The artist specifically asked for feedback on: "${context.feedbackFocus}".`
    : "";
  const existingStr = context.existingFeedbackSummary
    ? `Other reviewers have already noted: ${context.existingFeedbackSummary}. Make sure your feedback has a different angle or emphasis.`
    : "";
  const vocalNote = context.isInstrumental
    ? "This is an instrumental track — set vocalScore to null and vocalClarity to NOT_APPLICABLE."
    : "If the track has vocals, provide vocalScore (1-5) and appropriate vocalClarity.";

  const { content } = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [
      {
        name: "submit_review",
        description: "Submit a completed music review",
        input_schema: {
          type: "object" as const,
          required: [
            "firstImpression",
            "productionScore",
            "vocalScore",
            "originalityScore",
            "wouldListenAgain",
            "wouldAddToPlaylist",
            "wouldShare",
            "wouldFollow",
            "qualityLevel",
            "lowEndClarity",
            "vocalClarity",
            "highEndQuality",
            "stereoWidth",
            "dynamics",
            "energyCurve",
            "trackLength",
            "tooRepetitive",
            "playlistAction",
            "nextFocus",
            "expectedPlacement",
            "bestPart",
            "biggestWeaknessSpecific",
          ],
          properties: {
            firstImpression: { type: "string", enum: ["STRONG_HOOK", "DECENT", "LOST_INTEREST"] },
            productionScore: { type: "number", minimum: 1, maximum: 5 },
            vocalScore: { type: ["number", "null"], minimum: 1, maximum: 5 },
            originalityScore: { type: "number", minimum: 1, maximum: 5 },
            wouldListenAgain: { type: "boolean" },
            wouldAddToPlaylist: { type: "boolean" },
            wouldShare: { type: "boolean" },
            wouldFollow: { type: "boolean" },
            qualityLevel: {
              type: "string",
              enum: ["NOT_READY", "DEMO_STAGE", "ALMOST_THERE", "RELEASE_READY", "PROFESSIONAL"],
            },
            lowEndClarity: {
              type: "string",
              enum: ["PERFECT", "KICK_TOO_LOUD", "BASS_TOO_LOUD", "BOTH_MUDDY", "BARELY_AUDIBLE"],
            },
            vocalClarity: {
              type: "string",
              enum: ["CRYSTAL_CLEAR", "SLIGHTLY_BURIED", "BURIED", "TOO_LOUD", "NOT_APPLICABLE"],
            },
            highEndQuality: { type: "string", enum: ["PERFECT", "TOO_DULL", "TOO_HARSH", "ACCEPTABLE"] },
            stereoWidth: { type: "string", enum: ["TOO_NARROW", "GOOD_BALANCE", "TOO_WIDE"] },
            dynamics: {
              type: "string",
              enum: ["GREAT_DYNAMICS", "ACCEPTABLE", "TOO_COMPRESSED", "TOO_QUIET"],
            },
            energyCurve: {
              type: "string",
              enum: ["BUILDS_PERFECTLY", "STAYS_FLAT", "BUILDS_NO_PAYOFF", "ALL_OVER_PLACE"],
            },
            trackLength: { type: "string", enum: ["TOO_SHORT", "PERFECT", "BIT_LONG", "WAY_TOO_LONG"] },
            tooRepetitive: { type: "boolean" },
            playlistAction: {
              type: "string",
              enum: ["ADD_TO_LIBRARY", "LET_PLAY", "SKIP", "DISLIKE"],
            },
            nextFocus: {
              type: "string",
              enum: ["MIXING", "ARRANGEMENT", "SOUND_DESIGN", "SONGWRITING", "PERFORMANCE", "READY_TO_RELEASE"],
            },
            expectedPlacement: {
              type: "string",
              enum: ["EDITORIAL", "SOUNDCLOUD_TRENDING", "CLUB", "COFFEE_SHOP", "VIDEO_GAME", "AD", "NOWHERE"],
            },
            bestPart: {
              type: "string",
              description:
                "At least 20 words. Highlight a specific moment or element. Reference a timestamp (e.g. 'around 0:45') or a musical element (chorus, drop, bass, melody). Natural voice matching the persona — can include minor typos.",
            },
            biggestWeaknessSpecific: {
              type: "string",
              description:
                "At least 25 words. Constructive and specific — reference what could be improved and where. Same natural voice as bestPart.",
            },
            additionalNotes: {
              type: "string",
              description: "Optional short extra note. Leave empty string if nothing to add.",
            },
          },
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_review" },
    messages: [
      {
        role: "user",
        content: `You are writing a real music listener's review for a track called "${context.title}" (genre: ${genreStr}).

Your reviewer persona: ${context.persona}.

${focusStr}
${existingStr}
${vocalNote}

Write an authentic, specific review that sounds like a real person. Vary the scores and opinions — not everything needs to be positive. Keep the writing style consistent with the persona (casual language, natural imperfections where appropriate). Do not use markdown or bullet points in text fields.`,
      },
    ],
  });

  const toolUse = content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) throw new Error("No tool use block in Claude response");

  return toolUse.input as GeneratedReview;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // 1. Resolve track
  let track: {
    id: string;
    title: string;
    reviewsCompleted: number;
    reviewsRequested: number;
    status: string;
    feedbackFocus: string | null;
    Genre: { name: string }[];
  } | null = null;

  if (TRACK_ID) {
    track = await prisma.track.findUnique({
      where: { id: TRACK_ID },
      select: {
        id: true,
        title: true,
        reviewsCompleted: true,
        reviewsRequested: true,
        status: true,
        feedbackFocus: true,
        Genre: { select: { name: true } },
      },
    });
    if (!track) throw new Error(`Track not found: ${TRACK_ID}`);
  } else {
    const artistUser = await prisma.user.findUnique({
      where: { email: ARTIST_EMAIL! },
      select: { ArtistProfile: { select: { id: true } } },
    });
    if (!artistUser?.ArtistProfile) throw new Error(`Artist not found: ${ARTIST_EMAIL}`);

    track = await prisma.track.findFirst({
      where: {
        artistId: artistUser.ArtistProfile.id,
        title: { contains: TITLE_SUBSTR!, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        reviewsCompleted: true,
        reviewsRequested: true,
        status: true,
        feedbackFocus: true,
        Genre: { select: { name: true } },
      },
    });
    if (!track) throw new Error(`Track not found for artist ${ARTIST_EMAIL} with title containing "${TITLE_SUBSTR}"`);
  }

  console.log(
    `[INFO] Track: "${track.title}" (${track.id}) — ${track.reviewsCompleted}/${track.reviewsRequested} reviews, status: ${track.status}`
  );

  // 2. Find seeds that haven't reviewed this track yet
  const alreadyReviewed = await prisma.review.findMany({
    where: { trackId: track.id },
    select: { peerReviewerArtistId: true },
  });
  const usedIds = alreadyReviewed.map((r) => r.peerReviewerArtistId).filter(Boolean) as string[];

  const availableSeeds = await prisma.artistProfile.findMany({
    where: {
      User: { email: { endsWith: "@seed.mixreflect.com" } },
      ...(usedIds.length ? { id: { notIn: usedIds } } : {}),
    },
    select: { id: true, User: { select: { email: true, name: true } } },
    take: COUNT,
  });

  if (availableSeeds.length < COUNT) {
    throw new Error(
      `Not enough available seed reviewers — need ${COUNT}, found ${availableSeeds.length} (${usedIds.length} already used for this track)`
    );
  }

  // 3. Collect brief summaries of existing reviews to avoid repetition
  const existingReviews = await prisma.review.findMany({
    where: { trackId: track.id, status: "COMPLETED" },
    select: { bestPart: true },
    take: 5,
  });
  const existingFeedbackSummary = existingReviews
    .map((r) => r.bestPart)
    .filter(Boolean)
    .join(" | ");

  // 4. Generate and inject each review
  let currentCompleted = track.reviewsCompleted;

  for (let i = 0; i < COUNT; i++) {
    const seeder = availableSeeds[i];
    const persona = PERSONAS[i % PERSONAS.length];

    console.log(`\n[${i + 1}/${COUNT}] Generating review — seed: ${seeder.User?.email}`);

    const generated = await generateReview({
      title: track.title,
      genres: track.Genre.map((g) => g.name),
      feedbackFocus: track.feedbackFocus,
      existingFeedbackSummary,
      persona,
      isInstrumental: track.Genre.some((g) =>
        ["instrumental", "beats", "hip-hop-beats"].includes(g.name.toLowerCase())
      ),
    });

    const shareId = `ai${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const listenDuration = 180 + Math.floor(Math.random() * 180);

    currentCompleted += 1;
    const shouldComplete =
      FORCE_COMPLETE || currentCompleted >= (track.reviewsRequested ?? 3);

    await prisma.$transaction(async (tx) => {
      // Clear any stale queue entry for this seed + track
      await tx.reviewQueue.deleteMany({
        where: { trackId: track!.id, artistReviewerId: seeder.id },
      });

      await tx.review.create({
        data: {
          trackId: track!.id,
          peerReviewerArtistId: seeder.id,
          isPeerReview: true,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true,
          reviewSchemaVersion: 3,
          shareId,
          listenDuration,
          firstImpression: generated.firstImpression,
          productionScore: generated.productionScore,
          vocalScore: generated.vocalScore,
          originalityScore: generated.originalityScore,
          wouldListenAgain: generated.wouldListenAgain,
          wouldAddToPlaylist: generated.wouldAddToPlaylist,
          wouldShare: generated.wouldShare,
          wouldFollow: generated.wouldFollow,
          qualityLevel: generated.qualityLevel,
          lowEndClarity: generated.lowEndClarity,
          vocalClarity: generated.vocalClarity,
          highEndQuality: generated.highEndQuality,
          stereoWidth: generated.stereoWidth,
          dynamics: generated.dynamics,
          energyCurve: generated.energyCurve,
          trackLength: generated.trackLength,
          tooRepetitive: generated.tooRepetitive,
          playlistAction: generated.playlistAction,
          nextFocus: generated.nextFocus,
          expectedPlacement: generated.expectedPlacement,
          bestPart: generated.bestPart,
          biggestWeaknessSpecific: generated.biggestWeaknessSpecific,
          weakestPart: generated.biggestWeaknessSpecific,
          additionalNotes: generated.additionalNotes || null,
        },
      });

      await tx.track.update({
        where: { id: track!.id },
        data: {
          reviewsCompleted: currentCompleted,
          ...(shouldComplete
            ? { status: "COMPLETED", completedAt: new Date() }
            : { status: "IN_PROGRESS" }),
        },
      });
    });

    console.log(`  [OK] Review created (shareId: ${shareId})`);
    console.log(`       bestPart: ${generated.bestPart.slice(0, 80)}...`);
    if (shouldComplete) console.log(`  [OK] Track marked COMPLETED`);
  }

  console.log(`\nDone. ${COUNT} review(s) injected for "${track.title}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
