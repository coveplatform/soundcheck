/**
 * The listen pass (score engine v2, Option C): an audio-capable model actually
 * HEARS an excerpt of the track and reports what it heard — vocal performance,
 * hook/melody quality, mix character — the dimensions DSP stats can't measure
 * and the text-only model could previously only guess at.
 *
 * Input is the worker's `excerpt` (base64 mp3 of the opening ~90s). Providers:
 *   - Gemini (GEMINI_API_KEY) — preferred when configured: cheap audio tokens.
 *   - OpenAI audio (OPENAI_API_KEY, model SCORE_LISTEN_MODEL,
 *     default gpt-4o-audio-preview).
 *
 * Degrades to null on ANY failure or when disabled (SCORE_LISTEN=0) — the
 * findings pass treats absence as "no listen evidence", never an error.
 */

import { SCORE_GENRES, isScoreGenre } from "@/lib/score-genres";

/** What KIND of track this is. The listen pass is the only stage that hears
 *  audio, so it classifies the track's *form* here — and that gates which
 *  dimensions and release-bar axes even apply downstream, so an instrumental is
 *  never judged on vocals and an ambient piece is never judged on a radio hook. */
export type TrackType =
  | "song" // vocal-led song — the default shape
  | "instrumental" // melodic instrumental: guitar piece, piano, lead/riff-driven, no vocals
  | "beat" // loop-based producer beat, made to be rapped/sung over
  | "ambient" // texture / drone / soundscape — mood over hook, by design
  | "interlude" // short sketch / skit / interlude, not a full song
  | "experimental"; // noise / avant-garde / sound-art

export const TRACK_TYPES: TrackType[] = [
  "song",
  "instrumental",
  "beat",
  "ambient",
  "interlude",
  "experimental",
];

export type ListenFindings = {
  /** Genre heard, constrained to the product's genre list (or null if unsure).
   *  The listen pass is the only stage that actually hears audio, so it's the
   *  best place to classify — used to pick genre norms when the artist didn't. */
  detectedGenre: string | null;
  /** How sure the model is of the genre — gates whether we override "Other". */
  genreConfidence: "low" | "medium" | "high";
  /** What kind of track this is — gates which dimensions/axes apply downstream. */
  trackType: TrackType;
  /** One line: what this track is trying to be (judgment + prose context). */
  intent: string | null;
  /** Is the track carried by vocals? false for instrumentals/ambient/most beats. */
  vocalCentric: boolean;
  /** Is it reaching for a hook at all? false for ambient/experimental/interludes. */
  hasHookAmbition: boolean;
  vocals: {
    present: boolean;
    sung: boolean;
    /** Performance read when sung vocals exist (pitch, delivery, conviction). */
    performance: string | null;
  };
  hookMelody: {
    strength: "weak" | "decent" | "strong" | "exceptional";
    note: string;
  };
  /** What the mix actually sounds like (clarity, balance, character). */
  mixCharacter: string;
  productionPolish: "demo" | "rough" | "solid" | "release" | "pro";
  standoutMoments: { at: string | null; note: string }[];
  weaknesses: string[];
  /** Honest gut answer: would a listener stay? */
  overallPull: "skip" | "background" | "engaging" | "replay";
  confidence: "low" | "medium" | "high";
};

export type ListenInput = {
  excerpt: { b64: string; format?: string; durationSec?: number };
  trackTitle?: string | null;
  genre?: string | null;
};

const LISTEN_TIMEOUT_MS = 75_000;

function listenPrompt(input: ListenInput): string {
  const span = input.excerpt.durationSec
    ? `the opening ~${Math.round(input.excerpt.durationSec)} seconds`
    : "the opening of the track";
  const stated = input.genre?.trim();
  const statedKnown = stated && stated.toLowerCase() !== "other" && stated.toLowerCase() !== "unknown";
  return `You are a brutally honest senior A&R / producer. LISTEN to this audio (${span} of "${input.trackTitle || "an untitled track"}"${statedKnown ? `, the artist tagged it "${stated}"` : ", the artist did not specify a genre"}) and report exactly what you hear. You only hear the opening — never claim anything about the ending or total length.

Be specific and honest — this feeds a scoring system, so flattery corrupts it. If the vocal is pitchy, say so. If the melody is generic, say so. If it's genuinely excellent, say that with confidence.

Classify the GENRE from what you actually hear — instrumentation, rhythm, production style — independently of any tag the artist gave (their tag may be missing or wrong). Pick the single best fit from this list: ${SCORE_GENRES.join(", ")}. Use "Other" only when nothing genuinely fits, and set genreConfidence honestly (a sparse acoustic guitar take is "Singer-Songwriter" with high confidence; an ambiguous beat may be "low").

Also classify what KIND of track this is and judge it on its OWN terms — never fault it for not being a thing it isn't reaching for:
- "song" = vocal-led; "instrumental" = melodic, lead/riff-driven, no vocals; "beat" = loop-based producer beat meant to be rapped/sung over; "ambient" = texture/mood with no hook by design; "interlude" = short sketch, not a full song; "experimental" = noise / sound-art.
- Set vocalCentric (is the track carried by vocals?) and hasHookAmbition (is it even reaching for a hook? — false for ambient, experimental, and most interludes) honestly. An instrumental having no vocals is the FORMAT, not a weakness — do not list "no vocals" as a weakness for an instrumental, and do not call a hookless ambient piece "forgettable" for lacking a hook it never wanted.

Return STRICT JSON only:
{
  "detectedGenre": <one of: ${SCORE_GENRES.join(", ")}>,
  "genreConfidence": "low"|"medium"|"high",
  "trackType": "song"|"instrumental"|"beat"|"ambient"|"interlude"|"experimental",
  "intent": "<one line: what this track is trying to be>",
  "vocalCentric": <bool>,
  "hasHookAmbition": <bool>,
  "vocals": { "present": <bool — any vocal at all>, "sung": <bool — actual sung/rapped human vocal, not a chop/sample texture>, "performance": <string or null — if sung: pitch accuracy, delivery, conviction, where it sits in the mix> },
  "hookMelody": { "strength": "weak"|"decent"|"strong"|"exceptional", "note": "<what the main hook/melody/lead actually is and whether it sticks>" },
  "mixCharacter": "<2-3 sentences: what the mix actually sounds like — clarity, balance, low end, top end, anything audibly off (mud, harshness, buried elements, clipping)>",
  "productionPolish": "demo"|"rough"|"solid"|"release"|"pro",
  "standoutMoments": [ { "at": "<m:ss or null>", "note": "<the moment and why it lands>" } ],
  "weaknesses": [ "<the most audible problems, concrete, max 4>" ],
  "overallPull": "skip"|"background"|"engaging"|"replay",
  "confidence": "low"|"medium"|"high"
}`;
}

function coerceFindings(raw: unknown): ListenFindings | null {
  const o = raw as Record<string, any>;
  if (!o || typeof o !== "object") return null;
  const oneOf = <T extends string>(v: unknown, allowed: T[], dflt: T): T =>
    allowed.includes(v as T) ? (v as T) : dflt;
  return {
    detectedGenre: isScoreGenre(o.detectedGenre) ? o.detectedGenre : null,
    genreConfidence: oneOf(o.genreConfidence, ["low", "medium", "high"], "low"),
    trackType: oneOf(o.trackType, TRACK_TYPES, "song"),
    intent: typeof o.intent === "string" && o.intent.trim() ? o.intent.trim() : null,
    // Fall back to the vocal read / "true" when the model omits the flags, so an
    // older response shape keeps today's behaviour (judged as a song).
    vocalCentric: o.vocalCentric != null ? Boolean(o.vocalCentric) : Boolean(o.vocals?.sung),
    hasHookAmbition: o.hasHookAmbition != null ? Boolean(o.hasHookAmbition) : true,
    vocals: {
      present: Boolean(o.vocals?.present),
      sung: Boolean(o.vocals?.sung),
      performance:
        typeof o.vocals?.performance === "string" && o.vocals.performance.trim()
          ? o.vocals.performance.trim()
          : null,
    },
    hookMelody: {
      strength: oneOf(o.hookMelody?.strength, ["weak", "decent", "strong", "exceptional"], "decent"),
      note: String(o.hookMelody?.note ?? "").trim(),
    },
    mixCharacter: String(o.mixCharacter ?? "").trim(),
    productionPolish: oneOf(o.productionPolish, ["demo", "rough", "solid", "release", "pro"], "solid"),
    standoutMoments: Array.isArray(o.standoutMoments)
      ? o.standoutMoments.slice(0, 4).map((m: any) => ({
          at: typeof m?.at === "string" ? m.at : null,
          note: String(m?.note ?? "").trim(),
        }))
      : [],
    weaknesses: Array.isArray(o.weaknesses)
      ? o.weaknesses.slice(0, 4).map((w: any) => String(w).trim()).filter(Boolean)
      : [],
    overallPull: oneOf(o.overallPull, ["skip", "background", "engaging", "replay"], "background"),
    confidence: oneOf(o.confidence, ["low", "medium", "high"], "low"),
  };
}

async function listenViaGemini(input: ListenInput, apiKey: string): Promise<ListenFindings | null> {
  const model = process.env.GEMINI_LISTEN_MODEL || "gemini-2.5-flash";
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), LISTEN_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: listenPrompt(input) },
                {
                  inline_data: {
                    mime_type: `audio/${input.excerpt.format || "mp3"}`,
                    data: input.excerpt.b64,
                  },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.3, response_mime_type: "application/json" },
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      console.warn(`[score-listen] gemini HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
      return null;
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return coerceFindings(JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()));
  } finally {
    clearTimeout(t);
  }
}

async function listenViaOpenAI(input: ListenInput, apiKey: string): Promise<ListenFindings | null> {
  const model = process.env.SCORE_LISTEN_MODEL || "gpt-audio-1.5";
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), LISTEN_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        modalities: ["text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: listenPrompt(input) },
              {
                type: "input_audio",
                input_audio: { data: input.excerpt.b64, format: input.excerpt.format || "mp3" },
              },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[score-listen] openai HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = (data.choices?.[0]?.message?.content ?? "").trim();
    return coerceFindings(JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()));
  } finally {
    clearTimeout(t);
  }
}

/** Listen to the excerpt. Null when disabled, unconfigured, or anything fails. */
export async function listenToTrack(input: ListenInput): Promise<ListenFindings | null> {
  if (process.env.SCORE_LISTEN === "0") return null;
  if (!input.excerpt?.b64) return null;
  try {
    const gemini = process.env.GEMINI_API_KEY;
    if (gemini) return await listenViaGemini(input, gemini);
    const openai = process.env.OPENAI_API_KEY;
    if (openai) return await listenViaOpenAI(input, openai);
    return null;
  } catch (err) {
    console.warn(
      "[score-listen] listen pass failed:",
      err instanceof Error ? `${err.name}: ${err.message}` : err
    );
    return null;
  }
}

/** Render listen findings as evidence lines for the findings/grading prompts. */
export function describeListenFindings(lf: ListenFindings): string {
  const lines: string[] = [
    `HEARD (an expert listener heard the opening excerpt — this is direct listening evidence, weight it above inference):`,
    ...(lf.detectedGenre
      ? [`- genre heard: ${lf.detectedGenre} (${lf.genreConfidence} confidence)`]
      : []),
    `- track type: ${lf.trackType}${lf.intent ? ` — ${lf.intent}` : ""}${!lf.vocalCentric ? " (not vocal-led — do NOT judge it on vocals)" : ""}${!lf.hasHookAmbition ? " (not reaching for a hook — do NOT penalise hook absence)" : ""}`,
    `- vocals: ${lf.vocals.sung ? `sung/rapped vocal present${lf.vocals.performance ? ` — ${lf.vocals.performance}` : ""}` : lf.vocals.present ? "vocal textures present but nothing clearly sung" : "instrumental (no vocals heard)"}`,
    `- hook/melody: ${lf.hookMelody.strength}${lf.hookMelody.note ? ` — ${lf.hookMelody.note}` : ""}`,
    `- mix: ${lf.mixCharacter}`,
    `- production polish (heard): ${lf.productionPolish}`,
    `- listener pull: ${lf.overallPull}`,
  ];
  for (const m of lf.standoutMoments) {
    if (m.note) lines.push(`- standout${m.at ? ` @ ${m.at}` : ""}: ${m.note}`);
  }
  for (const w of lf.weaknesses) lines.push(`- audible weakness: ${w}`);
  lines.push(`- listen confidence: ${lf.confidence} (opening excerpt only — the back half was not heard)`);
  return lines.join("\n");
}
