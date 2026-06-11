import type { AudioFeatures } from "@/lib/audio-analysis";
import { describeFeatures } from "@/lib/audio-analysis";
import {
  computePriors,
  normDeltaLines,
  waveformStats,
  type MeasuredPriors,
} from "@/lib/genre-norms";
import {
  describeListenFindings,
  listenToTrack,
  type ListenFindings,
} from "@/lib/score-listen";

/**
 * Score engine v2 — the NUMBER side of the read (the prose stays in
 * score-report-ai.ts).
 *
 * Why two passes: a single "here's everything, give me 0-100" prompt regresses
 * to the genre-blind middle (observed live: every real submission landed 62–76).
 * v2 separates EVIDENCE from JUDGMENT:
 *
 *   pass 1 (findings): assemble what is actually known — measured DSP, genre
 *     deltas, and what the listen pass HEARD — into a findings sheet of claims
 *     tagged by evidence strength. No scores.
 *   pass 2 (grading): score the findings sheet against an anchored per-dimension
 *     rubric, 3 samples in parallel, median per dimension. Production/retention
 *     are clamped to the measured priors (a squashed, quiet master cannot grade
 *     like a release-grade one no matter what the model feels).
 *   overall = a fixed weighted blend of dimensions — arithmetic, not vibes, so
 *     the 0-100 inherits the dimensions' spread.
 */

export type GradedDimensions = {
  hook: number;
  production: number;
  retention: number;
  emotional: number;
  commercial: number;
};

export type GradeResult = {
  score: number;
  dims: GradedDimensions;
  /** The findings sheet (pass-1 output) — fed to the prose pass as evidence. */
  findingsText: string;
  /** What the engine knew, for debugging/persistence (no audio payloads). */
  evidence: {
    listen: ListenFindings | null;
    priors: MeasuredPriors;
    normLines: string[];
    gradeSamples: GradedDimensions[];
  };
};

export type GradeInput = {
  trackTitle: string | null;
  artist?: string | null;
  genre: string;
  notes: string | null;
  features: AudioFeatures | null;
};

const DIM_KEYS = ["hook", "production", "retention", "emotional", "commercial"] as const;

/** Fixed dimension weights — sum 1.0. Overall 0-100 = weighted avg / 5 × 100. */
const WEIGHTS: GradedDimensions = {
  hook: 0.26,
  production: 0.22,
  retention: 0.2,
  emotional: 0.16,
  commercial: 0.16,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// ── pass 1: findings ─────────────────────────────────────────────────

function findingsPrompt(input: GradeInput, normLines: string[], listenText: string | null): string {
  const artist = input.artist?.trim();
  return `You are the evidence-assembly stage of a music scoring engine. Compile a findings sheet for this track — CLAIMS with EVIDENCE, no scores, no encouragement, no hedging filler.

TRACK: "${input.trackTitle?.trim() || "(untitled)"}"
ARTIST: ${artist || "(unknown)"}
GENRE: ${input.genre}
ARTIST'S NOTE: ${input.notes?.trim() || "(none)"}

${input.features ? `MEASURED (DSP analysis — ground truth):\n${describeFeatures(input.features)}` : "MEASURED: nothing — no audio analysis available for this track."}

GENRE CONTEXT (measured vs genre norms):
${normLines.join("\n")}

${listenText ?? "HEARD: nothing — no listening pass ran; do not invent audio impressions."}

${artist ? `RECOGNITION: if you know this title/artist as commercially released or charting music, say so under "recognition" with what you know about its reception. If you don't recognise it, set recognition to null — most submissions are unknown independent artists.` : ""}

Rules:
- Every claim gets an evidence tag: "measured" (DSP), "heard" (the listen pass), or "inferred" (your judgment from context). Never present an inference as a measurement.
- Where measured and heard agree, say so — corroborated claims are the strongest evidence.
- Where evidence is missing for a dimension (e.g. nothing heard, instrumental, no vocal data), record that under "gaps" instead of guessing.
- Be concrete and brutal where the evidence is bad; be confident where it's good.

Return STRICT JSON:
{
  "observations": [
    { "dimension": "hook"|"production"|"retention"|"emotional"|"commercial", "claim": "<one concrete claim>", "evidence": "measured"|"heard"|"inferred", "weight": "strong"|"moderate"|"weak" }
  ],
  "recognition": <null, or "<what this track/artist is and how it was received>">,
  "gaps": [ "<dimension or question the evidence can't answer>" ]
}`;
}

type FindingsSheet = {
  observations: { dimension: string; claim: string; evidence: string; weight: string }[];
  recognition: string | null;
  gaps: string[];
};

function renderFindings(f: FindingsSheet): string {
  const lines: string[] = [];
  if (f.recognition) lines.push(`RECOGNITION: ${f.recognition}`);
  for (const k of DIM_KEYS) {
    const obs = f.observations.filter((o) => o.dimension === k);
    if (!obs.length) continue;
    lines.push(`${k.toUpperCase()}:`);
    for (const o of obs) lines.push(`  - [${o.evidence}/${o.weight}] ${o.claim}`);
  }
  if (f.gaps.length) lines.push(`EVIDENCE GAPS: ${f.gaps.join("; ")}`);
  return lines.join("\n");
}

// ── pass 2: grading ──────────────────────────────────────────────────

function gradingPrompt(
  input: GradeInput,
  findingsText: string,
  priors: MeasuredPriors,
  spanNote: string | null
): string {
  const priorLines: string[] = [];
  if (priors.production != null)
    priorLines.push(
      `- production: measured prior ${priors.production}. Stay within ±0.7 of it unless a strong "heard" finding contradicts the measurement.`
    );
  if (priors.structure != null)
    priorLines.push(
      `- retention: measured prior ${priors.structure}. Same rule.`
    );
  if (priors.basis.length) priorLines.push(`- prior basis: ${priors.basis.join("; ")}.`);

  return `You are the grading stage of a music scoring engine. Grade this track's findings sheet against the anchored rubric. You never heard the track yourself — the findings sheet is your only evidence. Grade the EVIDENCE.

GENRE: ${input.genre}
TRACK: "${input.trackTitle?.trim() || "(untitled)"}"
${spanNote ? `\n${spanNote}\n` : ""}
FINDINGS SHEET:
${findingsText}

${priorLines.length ? `MEASURED PRIORS (deterministic, computed from the audio):\n${priorLines.join("\n")}` : ""}

RUBRIC — every dimension is scored 1.0–5.0 in 0.1 steps against RELEASED music in this genre:
- 4.6–5.0  top-tier: would stand beside the best released tracks in the genre.
- 4.0–4.5  release-grade: competitive, professional; minor refinements at most.
- 3.4–3.9  strong independent work: real quality with one or two genuine gaps.
- 2.8–3.3  competent but clearly not there: multiple audible/structural gaps.
- 2.2–2.7  demo-stage: fundamental problems in this dimension.
- 1.0–2.1  early sketch: this dimension barely functions yet.

Calibration laws:
- USE THE WHOLE SCALE. Across many submissions these scores span 1.5–5.0; the evidence determines where THIS one sits. Do NOT park dimensions at 3.2–3.6 out of caution — that is the failure mode this engine exists to kill.
- Strong corroborated evidence (measured + heard agreeing) moves scores decisively in BOTH directions. "heard: weak hook, generic melody" is a 2.x hook, not a 3.4.
- RECOGNISED RELEASES: when the findings sheet confirms this is a known, commercially released or canonical track, the market already graded it — no dimension goes below 4.0 unless a "heard" finding CONCRETELY contradicts it, and a genuine hit/classic lands 85+ overall. A weak-looking opening excerpt of a famous song is a sampling artifact, not a finding.
- LONG-FORM OPENINGS: when only the opening of a much longer track was analysed/heard AND the genre tolerates long builds (electronic, ambient, post-rock, progressive), a slow opening is the FORM, not a flaw. Grade hook/retention on the quality OF the build (sound design, tension, pull) — never as if the opening were the whole song. Do not infer "no hook" from a span that plainly hasn't reached the payoff yet.
- Evidence gaps cap confidence, not the score: grade what the evidence shows and lean on the priors where they exist.
- Dimensions must DIFFER from each other when the evidence differs — a great-sounding track with no hook is a 4.4 production / 2.6 hook, not two 3.5s.

Return STRICT JSON:
{ "hook": <n>, "production": <n>, "retention": <n>, "emotional": <n>, "commercial": <n>, "why": "<one sentence naming the decisive evidence>" }`;
}

// ── OpenAI plumbing ──────────────────────────────────────────────────

async function jsonCall(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature,
      }),
    });
    if (!res.ok) {
      console.warn(`[score-engine] OpenAI ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = (data.choices?.[0]?.message?.content ?? "").trim();
    return JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
  } catch (err) {
    console.warn("[score-engine] call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function coerceDims(raw: Record<string, unknown> | null): GradedDimensions | null {
  if (!raw) return null;
  const out: Partial<GradedDimensions> = {};
  for (const k of DIM_KEYS) {
    const v = Number(raw[k]);
    if (!Number.isFinite(v)) return null;
    out[k] = clamp(v, 1, 5);
  }
  return out as GradedDimensions;
}

// ── the engine ───────────────────────────────────────────────────────

/**
 * Grade a track: listen (when an excerpt exists) → findings sheet → 3× rubric
 * grading → prior-clamped median dims → weighted overall. Returns null when the
 * engine can't run (no key, passes failed) — the caller falls back to v1.
 */
export async function gradeTrack(input: GradeInput): Promise<GradeResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.SCORE_REPORT_MODEL || process.env.OPENAI_MODEL || "gpt-4o";

  // Evidence assembly (cheap, deterministic).
  const stats = waveformStats(input.features?.waveform ?? null);
  const normLines = input.features ? normDeltaLines(input.features, input.genre, stats) : [];
  const priors = computePriors(input.features, input.genre, stats);

  // The listen pass — the only stage that actually hears audio.
  const excerpt = (input.features as { excerpt?: { b64: string; format?: string; durationSec?: number } } | null)
    ?.excerpt;
  const listen = excerpt
    ? await listenToTrack({
        excerpt,
        trackTitle: input.trackTitle,
        genre: input.genre,
      })
    : null;
  const listenText = listen ? describeListenFindings(listen) : null;

  // Pass 1 — findings.
  const findingsRaw = await jsonCall(
    apiKey,
    model,
    findingsPrompt(input, normLines, listenText),
    0.2,
    1600
  );
  if (!findingsRaw || !Array.isArray(findingsRaw.observations)) return null;
  const sheet: FindingsSheet = {
    observations: (findingsRaw.observations as FindingsSheet["observations"])
      .filter((o) => o && typeof o.claim === "string")
      .slice(0, 30),
    recognition:
      typeof findingsRaw.recognition === "string" && findingsRaw.recognition.trim()
        ? findingsRaw.recognition.trim()
        : null,
    gaps: Array.isArray(findingsRaw.gaps) ? (findingsRaw.gaps as string[]).slice(0, 8) : [],
  };
  const findingsText = renderFindings(sheet);

  // Pass 2 — grade 3× in parallel, median per dimension.
  const f = input.features;
  const spanNote =
    f?.sourceDurationSec && f.durationSec && f.sourceDurationSec > f.durationSec + 5
      ? `SPAN: only the opening ${Math.round(f.durationSec)}s of a ${Math.round(f.sourceDurationSec)}s track was analysed and heard — the payoff may live beyond the evidence.`
      : null;
  const prompt = gradingPrompt(input, findingsText, priors, spanNote);
  const samples = (
    await Promise.all([
      jsonCall(apiKey, model, prompt, 0.7, 400),
      jsonCall(apiKey, model, prompt, 0.7, 400),
      jsonCall(apiKey, model, prompt, 0.7, 400),
    ])
  )
    .map(coerceDims)
    .filter((d): d is GradedDimensions => d != null);
  if (!samples.length) return null;

  const dims = Object.fromEntries(
    DIM_KEYS.map((k) => [k, r1(median(samples.map((s) => s[k])))])
  ) as GradedDimensions;

  // Deterministic prior clamps — measurement outranks model mood.
  if (priors.production != null)
    dims.production = r1(clamp(dims.production, priors.production - 1.0, priors.production + 1.0));
  if (priors.structure != null)
    dims.retention = r1(clamp(dims.retention, priors.structure - 1.0, priors.structure + 1.0));

  // Overall: fixed weighted blend — arithmetic, never re-judged.
  const weighted = DIM_KEYS.reduce((s, k) => s + dims[k] * WEIGHTS[k], 0);
  const score = Math.round(clamp((weighted / 5) * 100, 5, 98));

  return {
    score,
    dims,
    findingsText,
    evidence: { listen, priors, normLines, gradeSamples: samples },
  };
}
