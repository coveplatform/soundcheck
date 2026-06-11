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

export type ListenFindings = {
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
  return `You are a brutally honest senior A&R / producer. LISTEN to this audio (${span} of "${input.trackTitle || "an untitled track"}", genre: ${input.genre || "unknown"}) and report exactly what you hear. You only hear the opening — never claim anything about the ending or total length.

Be specific and honest — this feeds a scoring system, so flattery corrupts it. If the vocal is pitchy, say so. If the melody is generic, say so. If it's genuinely excellent, say that with confidence.

Return STRICT JSON only:
{
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
