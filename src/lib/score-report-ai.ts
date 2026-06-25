import { prisma } from "@/lib/prisma";
import {
  acquireAudioFeatures,
  describeFeatures,
  type AudioFeatures,
  type AcousticFingerprint,
} from "@/lib/audio-analysis";
import { gradeTrack, type GradeResult } from "@/lib/score-engine";
import { fetchTrackMeta, oembedUrlFor } from "@/lib/track-metadata";
import { buildVerdictPayload } from "@/lib/score-verdict";

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
 * track and synthesises the room. The per-angle reads ("lenses") are written
 * as plain analysis — third person, about the track, no first-person voice —
 * so they read as one machine's read broken into angles, not as a chorus of
 * people (the real listeners are the paid human room).
 */

export type ReviewerReaction = {
  /** Which analytical angle this read takes (producer, mix, hook, …). */
  lens: string;
  genre: string;
  /** One-line finding from this angle — always shown (the gate teaser). */
  headline: string;
  /** The analytical read for this angle (third person) — gated until unlock. */
  quote: string;
  /** Short chips summarising what this angle flags (e.g. "lead buried"). */
  tags: string[];
  positive: boolean;
  /** @deprecated legacy fields kept so stored rows still parse; not rendered. */
  initial?: string;
  rating?: number;
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
  /** 1-2 sentences on WHY it scored this — the premium per-dimension read (gated). */
  note: string;
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
  /** Engine-v2 evidence trail (listen findings, priors, findings sheet) —
   * persisted in reviewerQuotes for debugging + the harness. No audio payloads. */
  evidence?: {
    listen: GradeResult["evidence"]["listen"];
    priors: GradeResult["evidence"]["priors"];
    normLines: string[];
    findingsText: string;
    gradeSamples: GradeResult["evidence"]["gradeSamples"];
  } | null;
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

/**
 * Generation depth.
 *  - "instant": the free read at submit (fast, cheaper model).
 *  - "deep": the premium read regenerated AFTER purchase — a longer, richer
 *    walk-through on a stronger model. The headline SCORE is locked (set at the
 *    instant read); deep only deepens the prose, so a paid unlock never re-grades
 *    the number out from under the artist.
 */
export type GenerateOpts = {
  depth?: "instant" | "deep";
  /** When deep: the already-assigned score + per-dimension scores, kept fixed. */
  locked?: {
    score: number;
    categories: { key: CategoryScore["key"]; score: number }[];
  };
  /** A prior read of this same track (re-upload), so the model stays consistent
   * (identical audio) or diffs against the last version (changed master). */
  prior?: {
    relation: "identical" | "changed";
    headline: string;
    summary: string;
    score: number;
  };
  /** Engine v2: the findings sheet (measured + heard evidence) the prose pass
   * must ground itself in. Present together with `locked` on instant v2 reads. */
  findingsText?: string;
};

const ROOM_SIZE = 20;

// The six analytical angles the read is broken into (fallback lens label when
// the model doesn't echo one). Mirrors LENSES in report-view.tsx.
const LENS_FALLBACK = [
  "producer's read",
  "casual first listen",
  "playlist curator",
  "hook check",
  "arrangement & energy",
  "mix lens",
];

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

function buildPrompt(input: ReportInput, opts: GenerateOpts = {}): string {
  const deep = opts.depth === "deep";
  const lockedBlock = opts.locked
    ? deep
      ? `\n\nDEEP READ (this track was already scored ${opts.locked.score}/100 at the instant read, and that number plus the per-dimension scores are LOCKED — the artist has paid to unlock the full report, NOT to be re-graded). Rules for this pass:\n- Do NOT change the score or argue it should be different; write a read that is fully consistent with ${opts.locked.score}/100.\n- Echo the same numbers back in the JSON (score: ${opts.locked.score}, and the category scores you're given) — we keep them locked regardless of what you return.\n- This is the PREMIUM deliverable: go deeper and longer than a quick read. Walk the whole track start to finish, name specific moments by timestamp, trace the energy arc and the emotional throughline, and give the artist the kind of detailed, expert breakdown that's worth paying for. Expand the synthesis to 9-12 sentences, the per-dimension notes to 3-4 sentences each, and make each priority fix a concrete, step-by-step instruction.\n- Locked category scores: ${opts.locked.categories.map((c) => `${c.key}=${c.score}`).join(", ")}.`
      : `\n\nSCORES ARE SET (the grading engine has already scored this track ${opts.locked.score}/100, dimensions: ${opts.locked.categories.map((c) => `${c.key}=${c.score}`).join(", ")} — these numbers are LOCKED). Your job is the WRITTEN read only:\n- Write prose fully consistent with those numbers — where a dimension graded low, your read says why plainly; where it graded high, the read owns that confidently. Never mention scores, grades, or an "engine" in the prose.\n- Echo the same numbers back in the JSON; they are kept regardless of what you return.`
    : "";
  // Engine v2: the findings sheet (measured + heard evidence). The prose must
  // ground itself here — especially the "heard" lines, which come from a model
  // that actually listened to the audio.
  const evidenceBlock = opts.findingsText
    ? `\n\nEVIDENCE SHEET (what the engine measured and HEARD — your prose must agree with this, and the [heard/...] lines outrank anything you'd otherwise infer):\n${opts.findingsText}`
    : "";
  // Re-upload memory: keep the read consistent with (or an explicit diff against)
  // a prior read of the same track, so the same song never gets contradictory feedback.
  const priorBlock = opts.prior
    ? opts.prior.relation === "identical"
      ? `\n\nCONSISTENCY (IMPORTANT): you have ALREADY read this exact track before. Your previous read was: "${opts.prior.headline}" — ${opts.prior.summary.slice(0, 600)}. This is the SAME audio, so STAY CONSISTENT with that read — do NOT reverse earlier claims (e.g. if you said the drums were buried, don't now say they're upfront). Refine and go deeper, but the story must match.`
      : `\n\nNEW VERSION: this is a newer version of a track you read before. Your previous read was: "${opts.prior.headline}" — ${opts.prior.summary.slice(0, 600)}. Treat this as a revision: keep the parts that still hold, and explicitly call out what has CHANGED since the last version (e.g. "the low end is fuller than before", "the breakdown still saps momentum"). Make at least one observation framed as progress-vs-last-version.`
    : "";
  const title = input.trackTitle?.trim() || "(untitled)";
  // The worker returns the track's whole arrangement (section map + energy dips
  // across the analysed span, not just the first few seconds). The instant read
  // stays conservative; the deep read is told to actually WALK that full map.
  const measured = input.features
    ? deep
      ? `\n\nMEASURED AUDIO (real DSP analysis of this track's arrangement — the section map and energy arc below are ground truth for what's actually there):\n${describeFeatures(input.features)}\n\nThis is the PREMIUM read, so USE the whole arrangement above: walk the track section by section in order, and tie every observation to the measured spans and the moments attention dips, by their timestamps (e.g. "the breakdown around 1:40 pulls the floor out", "it doesn't lift again until ~2:10", "the vocal sits back through the second verse"). Translate the numbers into how it FEELS — write like a person, not a report. Hard rules: do NOT quote raw measurements, percentages, BPM/LUFS values or "x/100" scores in your prose; the analysis covers up to the first few minutes, so do NOT claim a total runtime or describe an ending you can't see in the data; do NOT invent technical issues the data doesn't support. For things the data can't measure (melody, lyrics, taste), say it's a judgement call.`
      : `\n\nMEASURED AUDIO (real DSP analysis of the OPENING of this track — treat as ground truth for what's actually there):\n${describeFeatures(input.features)}\n\nUse this to ground WHERE things happen: point to the arrangement spans and the moments attention dips by their timestamps (e.g. "it sags around 1:12", "the hook doesn't land till ~0:25"). Translate everything else into how it FEELS to a listener — write like a person, not a report. Hard rules: do NOT quote raw measurements, percentages, BPM/LUFS values or "x/100" scores in your prose; do NOT state the track's total length or duration (you've only analysed the opening window, so you don't know how long the full track is); do NOT invent technical issues the data doesn't support. For things the data can't measure (melody, lyrics, taste), say it's a judgement call.`
    : `\n\n(No audio measurements were available for this track. Give a careful read from the title, genre and notes only — do NOT fabricate specific technical claims like exact timestamps, loudness values, or "the intro drags". Keep concrete acoustic claims general and clearly hedged.)`;
  const artist = input.artist?.trim();
  const recognition = artist
    ? `\n\nThe title and artist above are real metadata. If you recognise this as a commercially released or well-known track (a charting single, a classic, an established artist), factor that in — professionally finished, widely-heard music belongs in the upper score bands (it already passed the bar this tool measures). Don't pretend a known hit is a rough demo. If you DON'T recognise it, judge it on its merits as below — most submissions are unknown independent artists, and that's fine.`
    : "";
  return `You are a sharp, brutally honest A&R / producer giving an artist the real read on their track. You are NOT doing a technical mix audit — you read how it actually lands for a listener: attention, energy, what hooks, where it loses people, gut reaction.

WRITING STYLE (this matters as much as the substance): write like a real person who knows music and is talking straight to the artist — vivid, confident, easy to read. Flowing prose with varied sentence length, not a checklist or a lab report. Be specific and concrete (use the timestamps), but NEVER clinical: avoid phrasings like "sets a moderate energy level", "maintains a consistent pace", "with an energy score of X", "the vocal presence is low" — say what a listener actually feels in plain, punchy language. No raw numbers/percentages in the prose. No generic filler advice ("add a stronger hook to engage listeners") — be pointed about what and where. When you point to a moment, use a natural, rounded time ("around 0:20", "about twenty seconds in", "the back third") — NEVER decimal-second precision like "21.9 seconds"; no one writes an intro to the tenth of a second, so round and speak like a human.

Break your read into six analytical angles — a producer's read, a casual first listen, a playlist curator, a hook check, arrangement & energy, and the mix. Each angle weighs the SAME track by a different priority; they are lenses on your one analysis, NOT six different people reacting.

TRACK: "${title}"
ARTIST: ${artist || "(unknown)"}
GENRE: ${input.genre}
ARTIST'S NOTE: ${input.notes?.trim() || "(none)"}${recognition}${measured}${evidenceBlock}${lockedBlock}${priorBlock}

Produce a reaction report as STRICT JSON (no markdown, no commentary, no code fences). Shape:

{
  "score": <integer 0-100 — see the SCORING SCALE below; judge against real released music in this genre>,
  "categories": {
    "hook": { "score": <number 0-5, one decimal>, "note": "<2 sentences: what specifically works or holds back the HOOK — where it grabs or fails to, and what would lift it>" },
    "production": { "score": <number 0-5>, "note": "<2 sentences on the PRODUCTION/mix feel — what sounds finished vs amateur, the standout or the weak spot>" },
    "retention": { "score": <number 0-5>, "note": "<2 sentences on RETENTION — where attention holds and the exact moment(s) it drifts>" },
    "emotional": { "score": <number 0-5>, "note": "<2 sentences on EMOTIONAL impact — what it makes a listener feel, or why it stays flat>" },
    "commercial": { "score": <number 0-5>, "note": "<2 sentences on COMMERCIAL potential — playlist/sync/radio fit, who it's for, what caps its reach>" }
  },
  "summaryHeadline": "<one punchy sentence, max 12 words, the honest read>",
  "aiSummary": "<a substantive 5-7 sentence read — the premium deliverable, and it MUST read well: natural, vivid, confident, like a sharp producer who actually listened and is leveling with the artist. Walk the track: does the opening earn attention, how the energy moves, where it peaks and where it sags (name the moments by timestamp), the emotional throughline, and the ONE biggest thing between this and a release. Human and flowing — vary sentence length, no clinical phrasing, no raw numbers, no duration/length claims, no EQ/frequency jargon, no vague filler advice.>",
  "reactions": [ exactly 6 objects — the SAME read broken into 6 analytical angles (these are LENSES on your one analysis, NOT six people reacting):
    {
      "lens": "<the angle, lowercase, one of: 'producer's read', 'casual first listen', 'playlist curator', 'hook check', 'arrangement & energy', 'mix lens'>",
      "genre": "<a genre or two, e.g. 'Indie · Pop'>",
      "headline": "<one short line, max 9 words — the finding from this angle, stated plainly. NOT a spoken quote, no 'I'. e.g. 'hook lands fast, but the intro stalls it'>",
      "quote": "<2-3 sentences, THIRD PERSON and analytical: describe what this angle finds IN THE TRACK and what to do about it ('the lead sits too far back to carry the section…', 'the hook arrives late, so the first listen drifts before it lands…'). NEVER write as a person reacting ('I drifted off', 'this slaps', 'kept me hooked'). No first person, no 'I', no texting-a-friend voice, no typos, no quotation marks.>",
      "tags": ["<1–3 very short chips, max 3 words each, lowercase, e.g. 'lead buried', 'intro too long', 'playlist-ready'>"],
      "positive": <true if this angle is net positive, false if it's mainly a critique>
    }
  ],
  "priorityFixes": [ 3 objects, ranked by how many of the room flagged it:
    {
      "label": "<short actionable fix, max 8 words>",
      "detail": "<2-3 sentences: WHAT to change, WHERE (the moment/section), and HOW to actually do it — a concrete, specific step the artist can act on today, not vague advice. e.g. 'trim the 18s intro to ~8s so the hook hits by 0:10' rather than 'make the intro shorter'>",
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
- The angles can emphasise different things (one flags the hook, another the mix), but they describe the SAME track — don't invent contradictory facts between them.
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
    lens: "producer's read",
    genre: "Indie",
    headline: "Tight groove, but the lead sits back",
    quote:
      "The rhythm section is locked and the groove carries the first stretch. The lead element sits too far back to own the section, so the energy plateaus instead of building. Pushing it forward would give the back half something to climb toward.",
    tags: ["lead buried", "plateaus"],
    positive: true,
  },
  {
    lens: "casual first listen",
    genre: "Pop",
    headline: "Holds early, then drifts mid-track",
    quote:
      "The opening earns attention and the first idea reads clearly. Around the middle the track sits on one idea a beat too long, which is the most likely spot for a first-time listener to drift. A change-up there keeps them in.",
    tags: ["mid-track dip"],
    positive: false,
  },
  {
    lens: "playlist curator",
    genre: "Electronic",
    headline: "Clear lane, missing one quotable moment",
    quote:
      "It slots cleanly into its genre and the tone stays consistent enough to sequence. What caps its reach is the absence of a single standout moment to anchor a save or a share. One undeniable peak would lift it from fit to feature.",
    tags: ["playlist-ready", "no standout"],
    positive: true,
  },
  {
    lens: "hook check",
    genre: "Hip-Hop",
    headline: "Hook is there but arrives late",
    quote:
      "There's a real hook in the material, but it takes too long to land, so the first listen nearly passes before it hits. Bringing it forward, or teasing it sooner, would let it do its job. Right now the intro spends goodwill the hook hasn't earned yet.",
    tags: ["hook late", "trim intro"],
    positive: false,
  },
  {
    lens: "arrangement & energy",
    genre: "R&B / Soul",
    headline: "Solid structure, the peak stays flat",
    quote:
      "The sections are distinct and the track moves with intent. The energy holds steady rather than climbing to a clear high point, so the payoff lands softer than it could. Pulling elements before the final section would let it lift.",
    tags: ["flat peak"],
    positive: true,
  },
  {
    lens: "mix lens",
    genre: "Rock",
    headline: "Clean balance, low end a touch polite",
    quote:
      "Nothing reads as amateur — the elements sit together and the highs are controlled. The low end is a little reserved for the genre, so a touch more weight underneath would make it feel finished. The lead could also sit a hair more forward.",
    tags: ["clean mix", "more low-end"],
    positive: true,
  },
  {
    lens: "producer's read",
    genre: "Lo-Fi",
    headline: "Good idea, a few sections run long",
    quote:
      "The core idea is strong and the sound is cohesive. A couple of sections outstay their welcome, which softens the momentum the track keeps building. Trimming them would tighten the whole arc.",
    tags: ["runs long", "tighten"],
    positive: false,
  },
  {
    lens: "casual first listen",
    genre: "Singer-Songwriter",
    headline: "Genuine feel, could lean in harder",
    quote:
      "There's an honest warmth here that connects when it lands. The track holds back at the moment it could open up, so the emotional peak reads softer than the writing deserves. Leaning into that peak would deepen it.",
    tags: ["honest", "holds back"],
    positive: true,
  },
];

const FALLBACK_FIXES: PriorityFix[] = [
  {
    label: "Tighten the mid-section",
    detail:
      "Attention drifts in the middle where it sits on one idea too long. Cut 8-16 bars there, or drop an element out and bring it back, so something changes before people check out.",
    count: 9,
  },
  {
    label: "Build to a bigger payoff",
    detail:
      "The energy plateaus instead of climbing. Pull one or two elements out before the final section so it can lift — automate a riser or add a layer on the last chorus so the peak actually peaks.",
    count: 6,
  },
  {
    label: "Give the outro a moment",
    detail:
      "The ending arrives abruptly. Add a 4-8 bar tail — a final hook repeat or a stripped-back version of the main motif — so it resolves instead of just stopping.",
    count: 4,
  },
  {
    label: "Get to the hook sooner",
    detail:
      "People wait too long for the best part. Trim the intro so the hook lands by ~0:10-0:15 — most listeners decide in the first 15 seconds, so don't make them dig for it.",
    count: 7,
  },
  {
    label: "Add contrast in the arrangement",
    detail:
      "Sections blur together. Make each one distinct — strip the drums for a breakdown, or add a new element each section — so the listener can feel the structure moving.",
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

const FALLBACK_NOTES: Record<CategoryScore["key"], string> = {
  hook: "The core idea is there and the opening sets it up, but the hook doesn't fully grab on the first pass. Sharpening it or bringing it forward sooner would make it stick.",
  production: "It reads as mostly finished — the elements sit together cleanly. A little more polish on the balance would push it from solid to release-grade.",
  retention: "Attention holds early, then loosens through the mid-section where the track sits in one idea a beat too long. A change-up there keeps people in.",
  emotional: "There's a genuine feeling underneath it that connects when it lands. Leaning into the emotional peak rather than holding back would deepen it.",
  commercial: "It has a lane and an audience, but a clearer standout moment is what separates a playlist add from a skip. Find the one moment people quote.",
};

function fallbackReport(input: ReportInput): GeneratedReport {
  const seed = hashString(`${input.trackTitle ?? ""}|${input.genre}|${input.notes ?? ""}`);
  const base = 58 + (seed % 28); // 58-85
  const cat = (offset: number) =>
    clamp(Math.round((base / 20 + ((seed >> offset) % 12) / 10) * 10) / 10, 1.5, 4.8);

  const categories: CategoryScore[] = (
    ["hook", "production", "retention", "emotional", "commercial"] as const
  ).map((key, i) => {
    const score = cat(i * 3);
    return {
      key,
      label: CATEGORY_LABELS[key],
      score,
      pct: Math.round((score / 5) * 100),
      note: FALLBACK_NOTES[key],
    };
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
    // New shape: { score, note }. Tolerate the old bare-number shape too.
    const raw = c[key];
    const scoreVal = raw && typeof raw === "object" ? raw.score : raw;
    const score = clamp(Number(scoreVal), 0, 5);
    const note =
      raw && typeof raw === "object" && typeof raw.note === "string"
        ? raw.note.trim()
        : "";
    return { key, label: CATEGORY_LABELS[key], score, pct: Math.round((score / 5) * 100), note };
  };
  const categories = [
    mk("hook"),
    mk("production"),
    mk("retention"),
    mk("emotional"),
    mk("commercial"),
  ];

  const reactions: ReviewerReaction[] = Array.isArray(obj.reactions)
    ? obj.reactions.slice(0, 8).map((r: any, i: number) => ({
        lens: String(r.lens ?? "").trim() || LENS_FALLBACK[i % LENS_FALLBACK.length]!,
        genre: String(r.genre ?? input.genre),
        headline: String(r.headline ?? "").trim(),
        quote: String(r.quote ?? "").trim(),
        tags: Array.isArray(r.tags)
          ? r.tags.slice(0, 3).map((t: any) => String(t).trim()).filter(Boolean)
          : [],
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

/**
 * Generate a report. Engine v2 (default): the NUMBERS come from the two-pass
 * grading engine (findings sheet → anchored rubric, median-of-3, measured-prior
 * clamps, weighted overall) and the prose pass writes a read consistent with
 * them. `SCORE_ENGINE=v1` reverts to the legacy single-prompt path; any v2
 * failure also falls back to v1 — a report always comes back.
 *
 * Deep reads are untouched: numbers were locked at the instant read.
 */
export async function generateReport(
  input: ReportInput,
  opts: GenerateOpts = {}
): Promise<GeneratedReport> {
  const useV2 =
    opts.depth !== "deep" &&
    !opts.locked &&
    process.env.SCORE_ENGINE !== "v1" &&
    Boolean(process.env.OPENAI_API_KEY) &&
    // The engine grades EVIDENCE; with no measured audio there is none, and it
    // would grade the absence (observed: blanket 2.0s → score 40 for an innocent
    // track whose analysis shed). Ungrounded reads keep v1's cautious path.
    input.features != null;

  if (useV2) {
    try {
      const graded = await gradeTrack({
        trackTitle: input.trackTitle,
        artist: input.artist,
        genre: input.genre,
        notes: input.notes,
        features: input.features ?? null,
      });
      if (graded) {
        // Prose pass: same voice rules, numbers locked to the engine's grade,
        // grounded in the findings sheet (incl. what the listen pass heard).
        const prose = await generateViaPrompt(input, {
          ...opts,
          locked: {
            score: graded.score,
            categories: (
              ["hook", "production", "retention", "emotional", "commercial"] as const
            ).map((key) => ({ key, score: graded.dims[key] })),
          },
          findingsText: graded.findingsText,
        });
        const dims = graded.dims;
        return {
          ...prose,
          score: graded.score,
          percentile: clamp(100 - graded.score + 8, 3, 95),
          verdict: verdictForScore(graded.score),
          categories: prose.categories.map((c) => ({
            ...c,
            score: dims[c.key],
            pct: Math.round((dims[c.key] / 5) * 100),
          })),
          hookScore: dims.hook,
          productionScore: dims.production,
          retentionScore: dims.retention,
          emotionalScore: dims.emotional,
          commercialScore: dims.commercial,
          evidence: {
            listen: graded.evidence.listen,
            priors: graded.evidence.priors,
            normLines: graded.evidence.normLines,
            findingsText: graded.findingsText,
            gradeSamples: graded.evidence.gradeSamples,
          },
        };
      }
      console.warn("[score-report] engine v2 unavailable — falling back to v1");
    } catch (err) {
      console.warn("[score-report] engine v2 failed — falling back to v1:", err);
    }
  }

  return generateViaPrompt(input, opts);
}

async function generateViaPrompt(
  input: ReportInput,
  opts: GenerateOpts = {}
): Promise<GeneratedReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key at all = a non-prod environment by definition; the canned report
    // keeps local dev working without burning API credit.
    console.warn("[score-report] OPENAI_API_KEY not set, using fallback");
    return fallbackReport(input);
  }

  const deep = opts.depth === "deep";
  // Deep (post-purchase) read: stronger model + bigger budget for the longer,
  // richer breakdown the artist paid for. Instant read keeps the cheaper model.
  const model = deep
    ? process.env.SCORE_REPORT_DEEP_MODEL || "gpt-4.1"
    : process.env.SCORE_REPORT_MODEL || process.env.OPENAI_MODEL || "gpt-4o";

  // One in-call retry absorbs the common transient failures (a 429/5xx, a
  // malformed-JSON flake). Past that, THROW — for the deep pass so we never
  // clobber a paid report, and for the instant pass so a runtime API failure
  // never persists the canned fallback as a real score (an outage would have
  // silently shipped fiction to every submitter in it). An unscored report
  // stays pending and the pending page's self-heal retries the whole read.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), deep ? 180_000 : 120_000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: buildPrompt(input, opts) }],
          response_format: { type: "json_object" },
          max_tokens: deep ? 5000 : 3000,
          // Lower temperature → steadier scores run-to-run (was 0.8, which bounced
          // the same track ±6 points). Still enough variety in the reactions.
          temperature: 0.4,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(
          `OpenAI ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`
        );
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = (data.choices?.[0]?.message?.content ?? "").trim();
      const json = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(json);
      return coerceReport(parsed, input);
    } catch (err) {
      lastErr = err;
      console.error(
        `[score-report] generation attempt ${attempt} failed (deep=${deep}):`,
        err instanceof Error ? err.message : err
      );
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ── Re-upload / version detection (track identity) ──────────────────

function relDiff(a?: number | null, b?: number | null): number {
  if (a == null || b == null) return 1;
  const m = Math.max(Math.abs(a), Math.abs(b), 1e-6);
  return Math.abs(a - b) / m;
}

function spectralDist(
  a?: AcousticFingerprint["spectral"],
  b?: AcousticFingerprint["spectral"]
): number {
  if (!a || !b) return 1;
  return (["sub", "bass", "lowMid", "mid", "high"] as const).reduce(
    (s, k) => s + Math.abs((a[k] ?? 0) - (b[k] ?? 0)),
    0
  );
}

/** How two tracks relate: the same recording, a new version, or unrelated. */
function fpRelation(
  a: AcousticFingerprint,
  b: AcousticFingerprint
): "identical" | "changed" | "different" {
  const durRel = relDiff(a.durationSec, b.durationSec);
  const tempoRel = relDiff(a.tempo, b.tempo);
  const keyMatch = !a.key || !b.key || a.key === b.key;
  // Same song: near-identical length + tempo, compatible key.
  if (!(durRel < 0.06 && tempoRel < 0.05 && keyMatch)) return "different";
  // Same song AND same master ⇒ identical; otherwise a re-mix / new version.
  const identical =
    durRel < 0.012 &&
    spectralDist(a.spectral, b.spectral) < 0.06 &&
    relDiff(a.energy, b.energy) < 0.06;
  return identical ? "identical" : "changed";
}

/**
 * Find a prior read of the same track by the same artist (by acoustic
 * fingerprint, so it works across different links / re-encodes). Returns the
 * closest match plus whether the audio is identical or a changed version — used
 * to keep the read consistent (or diff it against the last version).
 */
async function findPriorVersion(
  email: string,
  fp: AcousticFingerprint,
  excludeReportId: string
): Promise<GenerateOpts["prior"] | undefined> {
  if (!email) return undefined;
  const candidates = await prisma.trackScoreReport.findMany({
    where: {
      email: { equals: email.trim().toLowerCase(), mode: "insensitive" },
      id: { not: excludeReportId },
      score: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { score: true, aiSummary: true, reviewerQuotes: true, fingerprint: true },
  });
  for (const c of candidates) {
    const cfp = c.fingerprint as AcousticFingerprint | null;
    if (!cfp) continue;
    const r = fpRelation(fp, cfp);
    if (r === "different") continue;
    return {
      relation: r,
      headline: (c.reviewerQuotes as Record<string, any> | null)?.headline ?? "",
      summary: c.aiSummary ?? "",
      score: c.score ?? 0,
    };
  }
  return undefined;
}

/**
 * Generate a report and persist it onto an existing TrackScoreReport row.
 * Moves the report from PENDING → IN_REVIEW (results are in but still gated).
 */
export async function generateAndStoreReport(reportId: string): Promise<void> {
  const report = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { id: true, trackTitle: true, trackUrl: true },
  });
  if (!report) throw new Error(`TrackScoreReport ${reportId} not found`);

  // Atomic in-flight claim (`reviewerQuotes.progress`): exactly one generation
  // runs per report. The pending page's self-heal fires /generate when the
  // marker looks stale, but a slow run (YouTube download + a cold start) can
  // legitimately outlive the staleness window — without this conditional
  // write, both runs race the whole pipeline (double DSP + double LLM spend,
  // racing final writes). ISO-8601 UTC strings compare lexicographically, so
  // the stale check is a plain string compare. The final write replaces
  // reviewerQuotes wholesale, clearing the marker on completion; the /generate
  // route reads it so a poll never double-kicks a live run; the pending page
  // reads it to advance its progress honestly.
  const startedAt = new Date().toISOString();
  const STALE_MS = 5 * 60 * 1000;
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString();
  const claimed = await prisma.$executeRaw`
    UPDATE "TrackScoreReport"
    SET "reviewerQuotes" = jsonb_set(
      COALESCE("reviewerQuotes", '{}'::jsonb),
      '{progress}',
      jsonb_build_object('startedAt', ${startedAt}::text)
    )
    WHERE id = ${reportId}
      AND score IS NULL
      AND (
        "reviewerQuotes"->'progress'->>'startedAt' IS NULL
        OR "reviewerQuotes"->'progress'->>'startedAt' < ${staleBefore}
      )
  `;
  if (claimed === 0) return; // already scored, or another run is live

  try {
    await runGeneration(reportId, report, startedAt);
  } catch (err) {
    // Failed run: release the claim so the self-heal can retry on its next
    // poll instead of waiting out the staleness window. Best-effort — if this
    // write also fails, the staleness window still unblocks the retry.
    await prisma
      .$executeRaw`UPDATE "TrackScoreReport" SET "reviewerQuotes" = COALESCE("reviewerQuotes", '{}'::jsonb) - 'progress' WHERE id = ${reportId} AND score IS NULL`
      .catch(() => {});
    throw err;
  }
}

async function runGeneration(
  reportId: string,
  report: { id: string; trackTitle: string | null; trackUrl: string },
  startedAt: string
): Promise<void> {
  // Wall-clock anchor for budget-aware decisions below (the whole invocation
  // dies at the platform's maxDuration, so late retries must be skipped).
  const t0 = Date.now();

  // In parallel: measure the audio (DSP grounding) and look up the track's
  // title/artist via oEmbed (so the model's knowledge of known music can inform
  // the score instead of reading a "(untitled)" blob blind). Both degrade to null.
  //
  // SHALLOW on purpose: the instant read gets the fast stemless pass — it still
  // includes everything the live report consumes (sections, energy arc,
  // waveform, fingerprint) at ~40-60s of worker time. Stems ride Replicate and
  // a cold start there held the worker's single analysis slot for ~5 minutes,
  // shedding concurrent uploads into ungrounded reads. Stems run on the deep
  // pass (paid unlock), where their data is actually consumed. When the
  // stem-grounded teaser markers ship, enrich ASYNC after the instant write —
  // never block the first read on Replicate.
  //
  // Staged write: title/artwork land on the row the moment oEmbed resolves, so
  // the (polling) pending report page shows the real track card while the much
  // slower DSP + LLM are still running.
  const metaPromise = fetchTrackMeta(report.trackUrl).catch(() => null);
  void metaPromise.then(async (m) => {
    if (!m) return;
    try {
      if (m.artworkUrl) {
        await prisma.trackScoreReport.update({
          where: { id: reportId },
          data: { artworkUrl: m.artworkUrl },
        });
      }
      if (m.title) {
        // Fill-if-empty: never clobber a title the artist typed at submit.
        await prisma.trackScoreReport.updateMany({
          where: { id: reportId, OR: [{ trackTitle: null }, { trackTitle: "" }] },
          data: { trackTitle: m.title },
        });
      }
    } catch {
      /* cosmetic — never blocks generation */
    }
  });

  const [acquired, metaFirst] = await Promise.all([
    // deep:false — dd07779 documented the shallow intent but flipped the flag
    // on regenerateDeepReport instead; this call kept stems-on-instant, putting
    // a 30-90s (cold start: minutes) Replicate wait inside EVERY live read.
    acquireAudioFeatures(report.trackUrl, { deep: false }).catch(() => null),
    metaPromise,
  ]);
  // Reassigned by the dead-link guard below if its oEmbed retry succeeds.
  let meta = metaFirst;

  // Analysis milestone for the pending page's progress steps.
  try {
    await prisma.trackScoreReport.update({
      where: { id: reportId },
      data: { reviewerQuotes: { progress: { startedAt, analyzed: true } } },
    });
  } catch {
    /* cosmetic */
  }

  // Re-read the row: with start-on-paste, generation kicks off before the form
  // is submitted, so genre/notes/title and the owner's email typically arrive
  // (via the finalize patch) while the DSP is running. Read them now so the
  // prompt and the prior-version lookup use what the artist actually submitted.
  const fresh = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { trackTitle: true, genre: true, notes: true, email: true },
  });
  const trackTitle = fresh?.trackTitle || report.trackTitle || meta?.title || null;
  const genre = fresh?.genre || "Other";
  const notes = fresh?.notes ?? null;
  const email = fresh?.email ?? "";

  // Guard 0: the source is longer than anything we score as one track (a DJ
  // set, podcast or full album — worker MAX_SOURCE_SECS refused it). Tell the
  // artist honestly instead of scoring a partial listen or metadata.
  if (acquired && "tooLong" in acquired) {
    const secs = Math.round(acquired.sourceDurationSec ?? 0);
    const mins = secs ? Math.round(secs / 60) : null;
    await prisma.trackScoreReport.update({
      where: { id: reportId },
      data: {
        ...(trackTitle ? { trackTitle } : {}),
        ...(meta?.artworkUrl ? { artworkUrl: meta.artworkUrl } : {}),
        status: "IN_REVIEW",
        score: 0,
        percentile: 0,
        verdict: "NOT_READY",
        aiSummary: `${mins ? `This runs about ${mins} minutes — ` : "This is "}longer than a single track, so we can't give it one honest score. Submit one song (under 13 minutes) for a real read.`,
        reviewerQuotes: {
          invalid: { reason: "too_long", ...(secs ? { durationSec: secs } : {}) },
          grounded: true,
          headline: "",
          reactions: [],
        },
        priorityFixes: [],
        completedAt: new Date(),
      },
    });
    return;
  }
  let features: AudioFeatures | null = acquired;

  // Guard: dead link. The worker couldn't pull any audio AND oEmbed couldn't
  // resolve the track — on oEmbed-capable hosts (SoundCloud/Bandcamp/YouTube)
  // that combination means the link is deleted, private, or wrong, not that a
  // service flaked. The ungrounded fallback exists for "track exists but the
  // download was blocked"; scoring a track NOBODY can fetch would fabricate a
  // confident read of audio nobody heard (observed: ctwav/meridian-v4, 404'd
  // on both paths, shipped a 63 with notes about buried vocals). oEmbed can
  // still flake transiently, so confirm with one retry before declaring it
  // dead; a successful retry rescues the meta and falls through to the normal
  // (ungrounded) read. Spotify/direct links have no oEmbed signal and keep
  // today's fallback.
  if (features == null && meta == null && oembedUrlFor(report.trackUrl)) {
    const retried = await fetchTrackMeta(report.trackUrl).catch(() => null);
    if (retried) {
      meta = retried;
    } else {
      await prisma.trackScoreReport.update({
        where: { id: reportId },
        data: {
          status: "IN_REVIEW",
          score: 0,
          percentile: 0,
          verdict: "NOT_READY",
          aiSummary:
            "We couldn't reach this track — the link looks deleted, private, or wrong, so there's nothing to listen to. Check it plays in a private browser window, then submit it again for a real read.",
          reviewerQuotes: {
            invalid: { reason: "unavailable" },
            grounded: false,
            headline: "",
            reactions: [],
          },
          priorityFixes: [],
          // Never enters the reviewer pool: the room can't listen to a dead
          // link either, even if a payment somehow lands on this report.
          humanRoomSkipped: true,
          completedAt: new Date(),
        },
      });
      return;
    }
  }

  // Burst shed rescue: no features, but the track demonstrably exists (oEmbed
  // resolved). Under concurrent submissions the worker's queue wait can blow
  // the budget and shed an innocent track into a metadata-only read — one
  // short retry rescues most of those into a grounded read. Budget-aware: if
  // the first attempt already burned deep into the 300s function window
  // (i.e. it died at its own abort ceiling, not quickly), skip — better an
  // ungrounded read than the platform killing the whole run mid-write.
  if (features == null && meta != null && Date.now() - t0 < 120_000) {
    console.warn(
      `[score-report] no features but track resolves — short retry for ${report.trackUrl}`
    );
    await new Promise((r) => setTimeout(r, 5000));
    const retried = await acquireAudioFeatures(report.trackUrl, {
      deep: false,
      timeoutMs: 60_000,
    }).catch(() => null);
    features = retried && !("tooLong" in retried) ? retried : null;
  }

  // Guard 1: the worker measured a clip too short to be a real track (e.g. a
  // 2-second sound effect). Don't fabricate a full musical read — say so plainly.
  const MIN_TRACK_SEC = 30;
  if (features?.durationSec != null && features.durationSec < MIN_TRACK_SEC) {
    const secs = Math.round(features.durationSec);
    await prisma.trackScoreReport.update({
      where: { id: reportId },
      data: {
        ...(trackTitle ? { trackTitle } : {}),
        ...(meta?.artworkUrl ? { artworkUrl: meta.artworkUrl } : {}),
        status: "IN_REVIEW",
        score: 0,
        percentile: 0,
        verdict: "NOT_READY",
        aiSummary: `This is only ${secs}s of audio — too short to score as a track. Submit the full song for a real read.`,
        reviewerQuotes: {
          invalid: { reason: "too_short", durationSec: secs },
          grounded: true,
          headline: "",
          reactions: [],
        },
        priorityFixes: [],
        completedAt: new Date(),
      },
    });
    return;
  }

  // Re-upload memory: if this artist has read this same track before, keep the
  // read consistent (or diff it against the prior version).
  const prior = features?.fingerprint
    ? await findPriorVersion(email, features.fingerprint, report.id)
    : undefined;

  const generated = await generateReport(
    {
      trackTitle,
      artist: meta?.artist ?? null,
      genre,
      notes,
      features,
    },
    { prior }
  );

  // Decision-report (verdict) payload: the release bar (measured craft vs the
  // genre's release envelope) + ranked blockers, plus a verdict that can't read
  // "ready" with a measured blocker. Null when nothing measured grounds it →
  // the report renders the legacy view (backward-compatible).
  const verdictPayload = buildVerdictPayload(generated, features, genre);

  await prisma.trackScoreReport.update({
    where: { id: reportId },
    data: {
      // Backfill the title from oEmbed when the submitter didn't give one.
      ...(trackTitle ? { trackTitle } : {}),
      ...(meta?.artworkUrl ? { artworkUrl: meta.artworkUrl } : {}),
      ...(features?.fingerprint ? { fingerprint: features.fingerprint as object } : {}),
      ...(verdictPayload
        ? {
            releaseBar: verdictPayload.releaseBar as object,
            blockers: verdictPayload.blockers as object,
          }
        : {}),
      // The 3-band waveform the worker measured — drawn on the unlocked report.
      // Stored with the analysed/source durations so the UI can label the span.
      ...(features?.waveform
        ? {
            waveform: {
              ...features.waveform,
              durationSec: features.durationSec ?? null,
              sourceDurationSec: features.sourceDurationSec ?? null,
            } as object,
          }
        : {}),
      status: "IN_REVIEW",
      score: generated.score,
      percentile: generated.percentile,
      // The release-bar-aware verdict (a measured blocker caps "release ready");
      // falls back to the engine's verdict when there's no measured bar.
      verdict: verdictPayload?.verdict ?? generated.verdict,
      hookScore: generated.hookScore,
      productionScore: generated.productionScore,
      retentionScore: generated.retentionScore,
      emotionalScore: generated.emotionalScore,
      commercialScore: generated.commercialScore,
      aiSummary: generated.aiSummary,
      reviewerQuotes: {
        headline: generated.summaryHeadline,
        reactions: generated.reactions,
        categoryNotes: Object.fromEntries(
          generated.categories.map((c) => [c.key, c.note])
        ),
        // Guard 2: was this read grounded in real measured audio, or did the
        // worker fail / not run (→ scored from title + metadata only)?
        grounded: features != null,
        // Engine-v2 evidence trail (listen findings, priors, findings sheet) —
        // debugging + harness inspection; absent on v1/fallback reads.
        ...(generated.evidence ? { evidence: generated.evidence } : {}),
      },
      priorityFixes: generated.priorityFixes,
      completedAt: new Date(),
    },
  });

  // Already unlocked when the instant read landed (subscriber, or a one-off
  // payer whose payment beat generation) → go straight to the premium deep read.
  // Idempotent, so the unlock paths can also trigger it without double work.
  // Re-read paidAt rather than trusting the value from entry: the unlock often
  // lands DURING generation (claim/finalize or the Stripe webhook firing while
  // the DSP runs), and the stale null would skip the deep read entirely.
  const paid = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: { paidAt: true },
  });
  if (paid?.paidAt) {
    await regenerateDeepReport(reportId).catch((err) =>
      console.error("[score-report] deep read after generation failed:", err)
    );
  }
}

/**
 * Premium "deep read", regenerated AFTER purchase.
 *
 * Option A by design: the headline SCORE and per-dimension numbers are LOCKED
 * (set at the instant read) — paying unlocks DEPTH, never a re-grade. This pass
 * only rewrites the prose (synthesis, per-dimension notes, reactions, fixes) on
 * a stronger model with a bigger budget, so the unlocked report reads markedly
 * richer than the free teaser without the number moving.
 *
 * Idempotent: flags `reviewerQuotes.deep = true` and no-ops on re-entry. Safe to
 * fire-and-forget from the unlock paths (webhook / subscriber auto-unlock).
 */
export async function regenerateDeepReport(reportId: string): Promise<void> {
  const report = await prisma.trackScoreReport.findUnique({
    where: { id: reportId },
    select: {
      id: true, email: true, trackTitle: true, genre: true, notes: true, trackUrl: true,
      score: true, hookScore: true, productionScore: true, retentionScore: true,
      emotionalScore: true, commercialScore: true, reviewerQuotes: true,
    },
  });
  if (!report) return;

  const quotes = (report.reviewerQuotes as Record<string, any> | null) ?? {};
  // Need an instant read first; never deepen a too-short / invalid report; and
  // don't redo it if we already have.
  if (report.score == null) return;
  if (quotes.invalid) return;
  if (quotes.deep) return;

  // Deep read runs the stem-separation pass (drums/bass/vocals/other balance) —
  // nobody is waiting on this path, and the premium prose is what consumes the
  // stem data. (Restored: dd07779 accidentally made this the shallow one.)
  const [acquiredDeep, meta] = await Promise.all([
    acquireAudioFeatures(report.trackUrl, { deep: true }).catch(() => null),
    fetchTrackMeta(report.trackUrl).catch(() => null),
  ]);
  // The instant read already passed the length cap, so tooLong here means the
  // cap was tightened since — degrade to an ungrounded deep read, never fail
  // a paid unlock over it.
  const features =
    acquiredDeep && !("tooLong" in acquiredDeep) ? acquiredDeep : null;

  const prior = features?.fingerprint
    ? await findPriorVersion(report.email, features.fingerprint, report.id)
    : undefined;

  const generated = await generateReport(
    {
      trackTitle: report.trackTitle || meta?.title || null,
      artist: meta?.artist ?? null,
      genre: report.genre ?? "Other",
      notes: report.notes,
      features,
    },
    {
      depth: "deep",
      prior,
      locked: {
        score: report.score,
        categories: [
          { key: "hook", score: report.hookScore ?? 0 },
          { key: "production", score: report.productionScore ?? 0 },
          { key: "retention", score: report.retentionScore ?? 0 },
          { key: "emotional", score: report.emotionalScore ?? 0 },
          { key: "commercial", score: report.commercialScore ?? 0 },
        ],
      },
    }
  );

  // Prose-only update: score / percentile / verdict / category numbers are NOT
  // touched — they stay exactly as the instant read set them. The waveform IS
  // refreshed (the deep pass may have measured it when the instant one missed).
  await prisma.trackScoreReport.update({
    where: { id: reportId },
    data: {
      ...(features?.waveform
        ? {
            waveform: {
              ...features.waveform,
              durationSec: features.durationSec ?? null,
              sourceDurationSec: features.sourceDurationSec ?? null,
            } as object,
          }
        : {}),
      aiSummary: generated.aiSummary,
      reviewerQuotes: {
        ...quotes,
        headline: generated.summaryHeadline,
        reactions: generated.reactions,
        categoryNotes: Object.fromEntries(
          generated.categories.map((c) => [c.key, c.note])
        ),
        grounded: features != null,
        deep: true,
      },
      priorityFixes: generated.priorityFixes,
    },
  });
}
