import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export type EditorNoteInput = {
  trackTitle: string;
  artistName: string;
  genre: string | null;
  artistNote?: string | null;
  reviews: Array<{
    productionScore: number | null;
    vocalScore: number | null;
    originalityScore: number | null;
    firstImpression: string | null;
    strongestElement: string | null;
    biggestRisk: string | null;
    competitiveBenchmark: string | null;
  }>;
};

const FALLBACK_NOTE = (artistName: string, genre: string | null) =>
  `Today we're spinning new work from ${artistName}${genre ? ` — a ${genre} cut` : ""} that earned its way to the top of the daily chart through peer producer votes. Press play and judge for yourself.`;

function buildPrompt(input: EditorNoteInput): string {
  const { trackTitle, artistName, genre, artistNote, reviews } = input;

  const reviewSummary = reviews.length === 0
    ? "(No peer reviews yet — write from the track metadata alone.)"
    : reviews.slice(0, 6).map((r, i) => {
        const parts: string[] = [];
        if (r.firstImpression) parts.push(`first impression: "${r.firstImpression}"`);
        if (r.strongestElement) parts.push(`strongest: "${r.strongestElement}"`);
        if (r.biggestRisk) parts.push(`weakness: "${r.biggestRisk}"`);
        if (r.competitiveBenchmark) parts.push(`compared to: ${r.competitiveBenchmark}`);
        return `Reviewer ${i + 1}: ${parts.join(" · ") || "(no qualitative notes)"}`;
      }).join("\n");

  return `You are writing the daily editor's note for "Track of the Day" on MixReflect — an artsy, observational, critic-voice blurb in the style of Bandcamp Daily. NOT a marketing pitch. NOT sales copy. Just a thoughtful introduction to the track.

TRACK: "${trackTitle}"
ARTIST: ${artistName}
GENRE: ${genre || "unspecified"}
ARTIST'S OWN NOTE: ${artistNote || "(none)"}

PEER REVIEWS:
${reviewSummary}

WRITE A 90-130 WORD EDITOR'S NOTE that:
- Opens with a vivid observation or framing of the sound (not "Today's pick is...")
- Quotes or paraphrases what peer reviewers picked up on, if any
- Names a specific compelling element (a sound, a moment, a choice)
- Ends with a low-key "press play" energy — not a CTA, more like a suggestion
- Tone: warm, observational, curious. Like a music critic writing about a track they'd actually share with a friend
- DO NOT use hype words: "incredible", "amazing", "must-listen", "absolute banger", "fire"
- DO NOT mention MixReflect, scores, vote counts, or the chart
- DO use specific musical language: "low-end", "arrangement", "vocal sit", "transients", etc. — but only where it fits

Return ONLY the note text. No preamble, no quotes around it, no byline.`;
}

export async function generateEditorNote(input: EditorNoteInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[editor-note] ANTHROPIC_API_KEY not set, using fallback");
    return FALLBACK_NOTE(input.artistName, input.genre);
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) {
      console.warn("[editor-note] Empty response from Claude, using fallback");
      return FALLBACK_NOTE(input.artistName, input.genre);
    }
    return text;
  } catch (err) {
    console.error("[editor-note] Generation failed:", err);
    return FALLBACK_NOTE(input.artistName, input.genre);
  }
}

export async function generateEditorNoteForSubmission(submissionId: string): Promise<string> {
  const submission = await (prisma as any).chartSubmission.findUnique({
    where: { id: submissionId },
    include: {
      Track: {
        select: {
          feedbackFocus: true,
          Review: {
            where: { status: "COMPLETED" },
            select: {
              productionScore: true,
              vocalScore: true,
              originalityScore: true,
              firstImpression: true,
              strongestElement: true,
              biggestRisk: true,
              competitiveBenchmark: true,
            },
            take: 8,
          },
        },
      },
      ArtistProfile: { select: { artistName: true } },
    },
  });

  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  return generateEditorNote({
    trackTitle: submission.title,
    artistName: submission.ArtistProfile?.artistName || "Unknown Artist",
    genre: submission.genre,
    artistNote: submission.Track?.feedbackFocus,
    reviews: submission.Track?.Review || [],
  });
}
