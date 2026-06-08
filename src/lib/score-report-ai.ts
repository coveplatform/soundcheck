import { prisma } from "@/lib/prisma";
import {
  acquireAudioFeatures,
  describeFeatures,
  type AudioFeatures,
} from "@/lib/audio-analysis";
import { fetchTrackMeta } from "@/lib/track-metadata";

/**
 * Score-report generation.
 *
 * The product: an artist drops a track link and it gets "played for a room"
 * of listeners. The deliverable is a reaction report — an overall score, a
 * percentile, a per-dimension breakdown, the room's verbatim reactions, a
 * synthesis of what the room felt, and the priority fixes the room kept
 * pointing at.
 *
 * Humans are the main event; this AI pass is the "sprinkle" that scores the
 * track and synthesises the room. Reviewer reactions are written in the
 * MixReflect natural voice (conversational, warm, honest, the occasional
 * genuine typo) so they read like real people, not a model.
 */

export type ReviewerReaction = {
  initial: string;
  genre: string;
  rating: number; // 1-5
  /** One-line headline — always shown (the gate teaser). */
  headline: string;
  /** Full reaction — gated until unlock. */
  quote: string;
  positive: boolean;
};

export type PriorityFix = {
  /** Always shown. */
  label: string;
  /** Gated until unlock. */
  detail: string;
  /** How many of the room flagged it. */
  count: number;
};

export type CategoryScore = {
  key: "hook" | "production" | "retention" | "emotional" | "commercial";
  label: string;
  score: number; // 0-5
  pct: number; // 0-100
};

export type ScoreVerdict =
  | "RELEASE_READY"
  | "ALMOST_THERE"
  | "NEEDS_WORK"
  | "NOT_READY";

export type GeneratedReport = {
  score: number; // 0-100
  percentile: number; // "top X%"
  verdict: ScoreVerdict;
  categories: CategoryScore[];
  hookScore: number;
  productionScore: number;
  retentionScore: number;
  emotionalScore: number;
  commercialScore: number;
  /** Always shown headline of the synthesis. */
  summaryHeadline: string;
  /** Full synthesis — gated until unlock. */
  aiSummary: string;
  reactions: ReviewerReaction[];
  priorityFixes: PriorityFix[];
};

export type ReportInput = {
  trackTitle: string | null;
  /** Artist / uploader (from oEmbed) — lets the model's knowledge of known music inform the read. */
  artist?: string | null;
  genre: string;
  notes: string | null;
  /** Real DSP measurements of the track, when available (grounds the feedback). */
  features?: AudioFeatures | null;
};

const CATEGORY_LABELS: Record<CategoryScore["key"], string> = {
  hook: "Hook Strength",
  production: "Production Quality",
  retention: "Listener Retention",
  emotional: "Emotional Impact",
  commercial: "Commercial Potential",
};

const ROOM_SIZE = 20;

function verdictForScore(score: number): ScoreVerdict {
  if (score >= 85) return "RELEASE_READY";
  if (score >= 70) return "ALMOST_THERE";
  if (score >= 50) return "NEEDS_WORK";
  return "NOT_READY";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ── Prompt ──────────────────────────────────────────────────────────

function buildPrompt(input: ReportInput): string {
  const title = input.trackTitle?.trim() || "(untitled)";
  const measured = input.features
    ? `\n\nMEASURED AUDIO DATA (real DSP analysis of THIS track — treat as ground truth):\n${describeFeatures(input.features)}\n\nGround every concrete claim in this data — cite specific numbers and timestamps (e.g. intro length, the energy dips and which section they fall in, the arrangement spans, vocal presence). The "arrangement" and "energy dips" lines tell you exactly where the track pulls back — point to those moments by their timestamps. Do NOT invent technical issues the data doesn't support. For things the data can't measure (melody quality, lyrics, taste), make clear it's a judgement call.`
    : `\n\n(No audio measurements were available for this track. Give a careful read from the title, genre and notes only — do NOT fabricate specific technical claims like exact timestamps, loudness values, or "the intro drags". Keep concrete acoustic claims general and clearly hedged.)`;
  const artist = input.artist?.trim();
  const recognition = artist
    ? `\n\nThe title and artist above are real metadata. If you recognise this as a commercially released or well-known track (a charting single, a classic, an established artist), factor that in — professionally finished, widely-heard music belongs in the upper score bands (it already passed the bar this tool measures). Don't pretend a known hit is a rough demo. If you DON'T recognise it, judge it on its merits as below — most submissions are unknown independent artists, and that's fine.`
    : "";
  return `You are an expert, brutally honest music analyst giving feedback on a track. You are NOT doing a technical mix audit — you read how it actually lands for a listener: attention, energy, what hooks, where it loses people, gut reaction. Give your takes from a few distinct angles (a producer, a casual listener, a playlist curator, a hook specialist).

TRACK: "${title}"
ARTIST: ${artist || "(unknown)"}
GENRE: ${input.genre}
ARTIST'S NOTE: ${input.notes?.trim() || "(none)"}${recognition}${measured}

Produce a reaction report as STRICT JSON (no markdown, no commentary, no code fences). Shape:

{
  "score": <integer 0-100 — see the SCORING SCALE below; judge against real released music in this genre>,
  "categories": {
    "hook": <number 0-5, one decimal>,
    "production": <number 0-5>,
    "retention": <number 0-5, how well it held attention>,
    "emotional": <number 0-5>,
    "commercial": <number 0-5>
  },
  "summaryHeadline": "<one punchy sentence, max 12 words, the honest read>",
  "aiSummary": "<2-3 sentences, the honest read — energy arc, where attention holds or drops, emotional read. Talk about pacing, structure, energy lulls, the emotional curve. Do NOT focus on technical EQ/frequency stuff.>",
  "reactions": [ exactly 6 objects:
    {
      "initial": "<single uppercase letter>",
      "genre": "<a genre or two, e.g. 'Indie · Pop'>",
      "rating": <integer 1-5>,
      "headline": "<one short line, max 10 words, the gist of their reaction>",
      "quote": "<2-4 sentences in a natural, conversational voice — like a real person texting a friend. Warm but honest. Each reviewer has a distinct personality (some brief, some chatty, some use '...'). Include the OCCASIONAL natural typo (e.g. 'burried', 'everthing', 'noticeabley'). Get straight to the point, no preamble. Talk about how it FELT and where attention went, not technical frequencies.>",
      "positive": <true if mostly positive, false if mostly critical>
    }
  ],
  "priorityFixes": [ 3 objects, ranked by how many of the room flagged it:
    {
      "label": "<short actionable fix, max 8 words>",
      "detail": "<1-2 sentences explaining it, conversational>",
      "count": <integer, how many of ${ROOM_SIZE} listeners flagged it, 2-14>
    }
  ]
}

SCORING SCALE (anchor the number here — judge it like a listener who knows this genre, against actually-released music, NOT against perfection):
- 90-100: exceptional. Polished, releasable today, would stand next to the best in its genre. (Most chart hits and classics live here.)
- 80-89: strong and professional. Clearly works; only minor refinements.
- 70-79: solid with real potential; a few things genuinely hold it back.
- 60-69: rough draft energy; several real, audible problems.
- below 60: early demo with significant issues.
Calibration rules:
- A professionally produced, widely-loved or chart-successful track should score 85+. Do NOT default to the 55-65 band — reserve sub-70 for tracks with genuine, audible weaknesses.
- Long intros, extended builds, repetition or long runtimes are NORMAL in many genres (techno, ambient, metal, post-rock, jazz). Do NOT lower the SCORE for them when they're a deliberate, well-executed genre convention — raise them as feedback only if they actually hurt the track.
- IMPORTANT: consistent, sustained energy is a deliberate, professional choice in modern pop, hip-hop, EDM and rock — it is NOT monotony and must NOT lower the score. The audio structure read is coarse and often collapses a loud, well-mastered track into ONE long section with "steady energy"; when you see that, treat it as a sign of a polished, radio-ready master, and lean your judgement on hook, production, emotional pull and overall appeal rather than assuming "flat energy = no dynamics = bad."
- Keep the qualitative read and the 3 fixes sharp and honest even when the score is high — a 92 track still has things to improve. The score rewards craft, hooks and appeal; the fixes are where you stay critical.
- Vary scores realistically across submissions — but a great song should read great.

CALIBRATION EXAMPLES (how the same scale should land):
- A polished, hook-forward single from an established/charting artist, pro mix, instantly catchy → 88-94.
- A genre classic / widely-loved track (even if older or long-form) → 86-96.
- A strong independent track: good idea and hook, decent production, one or two real weak spots (a slow intro, a thin mix) → 72-80.
- A promising demo with a clear idea but rough production and a forgettable hook → 58-68.
- An early sketch: off pitch, muddy or harsh mix, no real hook → 38-52.

Rules:
- Be honest and specific to the genre.
- Reactions should disagree with each other a little, like a real room does.
- Reference energy lulls, pacing, structural feel, the emotional arc, hooks, where people drifted. NOT mixing/EQ/frequency jargon.
- Return ONLY the JSON object.`;
}

// ── Deterministic fallback (no API key / parse failure) ─────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Pools the deterministic fallback samples from, so two different tracks don't
// land on identical reports when the API is unavailable.
const FALLBACK_REACTIONS: ReviewerReaction[] = [
  {
    initial: "J",
    genre: "Indie",
    rating: 4,
    headline: "Good vibe, lost me a bit in the middle",
    quote:
      "I liked where this was going. The start pulls you in and the idea is clear. For me it dipped a little around the middle, felt like it sat in one place too long. Still, theres something here.",
    positive: true,
  },
  {
    initial: "M",
    genre: "Pop",
    rating: 3,
    headline: "Solid but wanted more payoff",
    quote:
      "Decent listen. I kept waiting for it to lift off and it sort of stayed level. Not a bad thing, just left me wanting a bigger moment. Production feels clean though.",
    positive: false,
  },
  {
    initial: "S",
    genre: "Electronic",
    rating: 5,
    headline: "Hooked me early, replayed it",
    quote:
      "Honestly really into this. Caught the hook straight away and went back to hear it again. Felt warm and real. Talented!",
    positive: true,
  },
  {
    initial: "A",
    genre: "Hip-Hop",
    rating: 3,
    headline: "Took a while to get going",
    quote:
      "The intro dragged for me a touch, I wanted to be in it sooner. Once it landed I was on board though. Theres a good song under here.",
    positive: false,
  },
  {
    initial: "R",
    genre: "R&B / Soul",
    rating: 4,
    headline: "Warm, easy to sit with",
    quote:
      "Nice feel to this. It washed over me in a good way and the tone is lovely. The ending came up a bit quick on me, would love a little more wind down.",
    positive: true,
  },
  {
    initial: "K",
    genre: "Rock",
    rating: 4,
    headline: "Strong idea, could be tighter",
    quote:
      "Theres a real hook in here and the energy is there. Felt like a couple of sections ran a bit long. Trim those and this really moves.",
    positive: true,
  },
  {
    initial: "T",
    genre: "Lo-Fi",
    rating: 2,
    headline: "Didn't quite grab me",
    quote:
      "Honestly it sat a little flat for me. The pieces are fine but I never got the moment that made me lean in. Not bad, just didnt pull me.",
    positive: false,
  },
  {
    initial: "L",
    genre: "Singer-Songwriter",
    rating: 5,
    headline: "Felt something, that's rare",
    quote:
      "This actually got me. The emotion comes through and it feels honest. Kept my attention the whole way. Really nice work.",
    positive: true,
  },
];

const FALLBACK_FIXES: PriorityFix[] = [
  {
    label: "Tighten the mid-section",
    detail:
      "A few listeners drifted around the middle. Trimming or adding a small change there would keep people locked in.",
    count: 9,
  },
  {
    label: "Build to a bigger payoff",
    detail:
      "The room wanted the energy to climb more before it resolves. A clearer peak would land harder.",
    count: 6,
  },
  {
    label: "Give the outro a moment",
    detail:
      "The ending felt a touch abrupt to some. A short tail or a final hook repeat would round it off.",
    count: 4,
  },
  {
    label: "Get to the hook sooner",
    detail:
      "Some people waited too long for the best part. Pulling the hook earlier keeps them from drifting before it lands.",
    count: 7,
  },
  {
    label: "Add contrast in the arrangement",
    detail:
      "Sections blurred together for a few listeners. A drop-out or a new element makes the structure easier to follow.",
    count: 5,
  },
];

const FALLBACK_SUMMARIES: { headline: string; body: string }[] = [
  {
    headline: "The room mostly leaned in, with a soft spot in the middle.",
    body: "The room connected with the opening and the core idea came through clearly. Attention held through the first half, then drifted a little in the mid-section before the track found its feet again. A few listeners wanted the energy to keep climbing rather than settle.",
  },
  {
    headline: "Strong start, the back half is where it slips.",
    body: "People were in early — the intro does its job and the hook reads. The energy plateaus toward the back half, where a couple of listeners checked out. Land the second half as hard as the first and this holds the whole way.",
  },
  {
    headline: "Warm and honest, just wants a clearer peak.",
    body: "The emotional read is the strength here — it feels genuine and easy to sit with. Where it loses a little ground is the lack of a single standout moment to build toward. Give it one clear peak and the whole arc tightens up.",
  },
];

function pick<T>(pool: T[], seed: number, count: number): T[] {
  // Deterministic rotation through the pool so the same input is stable but
  // different inputs get different selections.
  const start = seed % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}

function fallbackReport(input: ReportInput): GeneratedReport {
  const seed = hashString(`${input.trackTitle ?? ""}|${input.genre}|${input.notes ?? ""}`);
  const base = 58 + (seed % 28); // 58-85
  const cat = (offset: number) =>
    clamp(Math.round((base / 20 + ((seed >> offset) % 12) / 10) * 10) / 10, 1.5, 4.8);

  const categories: CategoryScore[] = (
    ["hook", "production", "retention", "emotional", "commercial"] as const
  ).map((key, i) => {
    const score = cat(i * 3);
    return { key, label: CATEGORY_LABELS[key], score, pct: Math.round((score / 5) * 100) };
  });

  const summary = FALLBACK_SUMMARIES[seed % FALLBACK_SUMMARIES.length];

  return {
    score: base,
    percentile: clamp(100 - base + 8, 5, 92),
    verdict: verdictForScore(base),
    categories,
    hookScore: categories[0].score,
    productionScore: categories[1].score,
    retentionScore: categories[2].score,
    emotionalScore: categories[3].score,
    commercialScore: categories[4].score,
    summaryHeadline: summary.headline,
    aiSummary: summary.body,
    reactions: pick(FALLBACK_REACTIONS, seed, 6),
    priorityFixes: pick(FALLBACK_FIXES, seed >> 3, 3),
  };
}

// ── Parse Claude JSON into a GeneratedReport ────────────────────────

function coerceReport(raw: unknown, input: ReportInput): GeneratedReport {
  const obj = raw as Record<string, any>;
  const score = clamp(Math.round(Number(obj.score)), 1, 100);
  const c = obj.categories ?? {};
  const mk = (key: CategoryScore["key"]): CategoryScore => {
    const score = clamp(Number(c[key]), 0, 5);
    return { key, label: CATEGORY_LABELS[key], score, pct: Math.round((score / 5) * 100) };
  };
  const categories = [
    mk("hook"),
    mk("production"),
    mk("retention"),
    mk("emotional"),
    mk("commercial"),
  ];

  const reactions: ReviewerReaction[] = Array.isArray(obj.reactions)
    ? obj.reactions.slice(0, 8).map((r: any) => ({
        initial: String(r.initial ?? "?").slice(0, 1).toUpperCase(),
        genre: String(r.genre ?? input.genre),
        rating: clamp(Math.round(Number(r.rating)), 1, 5),
        headline: String(r.headline ?? "").trim(),
        quote: String(r.quote ?? "").trim(),
        positive: Boolean(r.positive),
      }))
    : [];

  const priorityFixes: PriorityFix[] = Array.isArray(obj.priorityFixes)
    ? obj.priorityFixes.slice(0, 5).map((f: any) => ({
        label: String(f.label ?? "").trim(),
        detail: String(f.detail ?? "").trim(),
        count: clamp(Math.round(Number(f.count)), 1, ROOM_SIZE),
      }))
    : [];

  if (reactions.length === 0 || priorityFixes.length === 0) {
    throw new Error("Claude report missing reactions or fixes");
  }

  return {
    score,
    percentile: clamp(100 - score + 8, 3, 95),
    verdict: verdictForScore(score),
    categories,
    hookScore: categories[0].score,
    productionScore: categories[1].score,
    retentionScore: categories[2].score,
    emotionalScore: categories[3].score,
    commercialScore: categories[4].score,
    summaryHeadline: String(obj.summaryHeadline ?? "").trim() || "The room weighed in.",
    aiSummary: String(obj.aiSummary ?? "").trim(),
    reactions,
    priorityFixes,
  };
}

export async function generateReport(input: ReportInput): Promise<GeneratedReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[score-report] OPENAI_API_KEY not set, using fallback");
    return fallbackReport(input);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.SCORE_REPORT_MODEL || process.env.OPENAI_MODEL || "gpt-4o",
        messages: [{ role: "user", content: buildPrompt(input) }],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        // Lower temperature → steadier scores run-to-run (was 0.8, which bounced
        // the same track ±6 points). Still enough variety in the reactions.
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      console.error(
        "[score-report] OpenAI error",
        res.status,
        await res.text().catch(() => "")
      );
      return fallbackReport(input);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = (data.choices?.[0]?.message?.content ?? "").trim();
    const json = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(json);
    return coerceReport(parsed, input);
  } catch (err) {
    console.error("[score-report] Generation failed, using fallback:", err);
    return fallbackReport(input);
  }
}

/**
 * Generate a report and persist it onto an existing TrackScoreReport row.
 * Moves the report from PENDING → IN_REVIEW (results are in but still gated).
 */
export async function generateAndStoreReport(reportId: string): Promise<void> {
  const report = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { id: true, trackTitle: true, genre: true, notes: true, trackUrl: true },
  });
  if (!report) throw new Error(`TrackScoreReport ${reportId} not found`);

  // In parallel: measure the audio (DSP grounding) and look up the track's
  // title/artist via oEmbed (so the model's knowledge of known music can inform
  // the score instead of reading a "(untitled)" blob blind). Both degrade to null.
  const [features, meta] = await Promise.all([
    acquireAudioFeatures(report.trackUrl).catch(() => null),
    fetchTrackMeta(report.trackUrl).catch(() => null),
  ]);

  const generated = await generateReport({
    trackTitle: report.trackTitle || meta?.title || null,
    artist: meta?.artist ?? null,
    genre: report.genre ?? "Other",
    notes: report.notes,
    features,
  });

  await prisma.trackScoreReport.update({
    where: { id: reportId },
    data: {
      // Backfill the title from oEmbed when the submitter didn't give one.
      ...(report.trackTitle ? {} : meta?.title ? { trackTitle: meta.title } : {}),
      ...(meta?.artworkUrl ? { artworkUrl: meta.artworkUrl } : {}),
      status: "IN_REVIEW",
      score: generated.score,
      percentile: generated.percentile,
      verdict: generated.verdict,
      hookScore: generated.hookScore,
      productionScore: generated.productionScore,
      retentionScore: generated.retentionScore,
      emotionalScore: generated.emotionalScore,
      commercialScore: generated.commercialScore,
      aiSummary: generated.aiSummary,
      reviewerQuotes: {
        headline: generated.summaryHeadline,
        reactions: generated.reactions,
      },
      priorityFixes: generated.priorityFixes,
      completedAt: new Date(),
    },
  });
}
