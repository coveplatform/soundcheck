/**
 * Decision-report (verdict) payload builder.
 *
 * Turns a generated report + the real measured audio into the verdict layout's
 * persisted shapes:
 *   - `releaseBar`: per-axis measured value vs the genre's release envelope.
 *   - `blockers`:   the priority fixes, ranked, framed as release blockers.
 *
 * Honesty (decision-report-migration §1/§2b):
 *  - The bands come from genre NORMS (genre-norms.ts), not a measured released-
 *    track corpus — every axis is flagged `estimated: true` until that corpus
 *    exists. The view labels them as estimated.
 *  - No fabricated percentile is produced here; the verdict is driven by the
 *    engine's verdict (measured craft), with the score only as a tiebreaker.
 *  - Axes are only emitted for dimensions we actually measured — an absent
 *    measurement produces no axis (no invented data).
 */

import type { AudioFeatures } from "@/lib/audio-analysis";
import { genreNorms } from "@/lib/genre-norms";
import type { GeneratedReport, ScoreVerdict } from "@/lib/score-report-ai";
import type { ReleaseAxis, Blocker } from "@/components/score/verdict-types";

/** Toggle (defaults on): gate verdict-payload generation. Mirrors the
 *  FREE_FULL_READ const pattern — flip to false to stop writing releaseBar
 *  (existing + new reports then render the legacy ReportView). */
export const VERDICT_REPORT =
  process.env.VERDICT_REPORT !== "0" && process.env.VERDICT_REPORT !== "false";

export type VerdictPayloadResult = {
  verdict: ScoreVerdict;
  releaseBar: ReleaseAxis[];
  blockers: Blocker[];
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Place a measured value on a 0-100 axis given the band's [lo,hi] real range,
 *  with `pad` of headroom either side so an in-band value sits inside the shaded
 *  zone and an out-of-band value reads visibly outside it. */
function placeOnAxis(
  value: number,
  bandLo: number,
  bandHi: number,
  axisLo: number,
  axisHi: number
): { pos: number; status: ReleaseAxis["status"] } {
  const span = axisHi - axisLo || 1;
  const pos = clamp(((value - axisLo) / span) * 100, 2, 98);
  const margin = (bandHi - bandLo) * 0.15;
  let status: ReleaseAxis["status"];
  if (value < bandLo - margin || value > bandHi + margin) status = "out";
  else if (value < bandLo || value > bandHi) status = "edge";
  else status = "in";
  return { pos: Math.round(pos), status };
}

function bandToZone(
  bandLo: number,
  bandHi: number,
  axisLo: number,
  axisHi: number
): [number, number] {
  const span = axisHi - axisLo || 1;
  return [
    Math.round(clamp(((bandLo - axisLo) / span) * 100, 0, 100)),
    Math.round(clamp(((bandHi - axisLo) / span) * 100, 0, 100)),
  ];
}

/**
 * Build the release-bar axes from real measured features. Each axis is only
 * emitted when its underlying measurement exists. Bands are genre norms →
 * `estimated: true`.
 */
export function buildReleaseBar(
  features: AudioFeatures | null,
  genre: string | null | undefined
): ReleaseAxis[] {
  if (!features) return [];
  const nm = genreNorms(genre);
  const axes: ReleaseAxis[] = [];

  // ── master loudness (RMS dBFS) ──
  if (features.loudnessLufs != null) {
    const [lo, hi] = nm.rmsDb;
    const axisLo = lo - 6;
    const axisHi = hi + 6;
    const { pos, status } = placeOnAxis(features.loudnessLufs, lo, hi, axisLo, axisHi);
    axes.push({
      label: "master loudness",
      measured: `${r1(features.loudnessLufs)} dB`,
      band: `${lo} to ${hi} dB`,
      ends: ["quieter", "louder"],
      zone: bandToZone(lo, hi, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? "loud enough to compete without crushing the master."
          : status === "edge"
            ? "close to the genre's release window — a small move lands it."
            : features.loudnessLufs < lo
              ? "quieter than released tracks here — reads as an unmastered bounce."
              : "pushed past the genre's ceiling — likely paying for it in squash.",
    });
  }

  // ── dynamic range / crest ──
  const crest = (features as { crestDb?: number }).crestDb ?? features.dynamicRange;
  if (crest != null) {
    const [lo, hi] = nm.crestDb;
    const axisLo = Math.max(0, lo - 5);
    const axisHi = hi + 5;
    const { pos, status } = placeOnAxis(crest, lo, hi, axisLo, axisHi);
    axes.push({
      label: "dynamic range",
      measured: `${r1(crest)} dB`,
      band: `${lo} to ${hi} dB`,
      ends: ["flatter", "punchier"],
      zone: bandToZone(lo, hi, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? "it breathes — not a wall of limiter."
          : crest < lo
            ? "squashed flatter than released tracks in the genre."
            : "very wide — dynamic, but may read unfinished at genre loudness.",
    });
  }

  // ── time to hook (intro lift) ──
  if (features.introLiftSec != null) {
    const [median, long] = nm.introLiftSec;
    const axisLo = 0;
    const axisHi = long + 30;
    // The "release band" for time-to-hook is from 0 up to the genre's long-side.
    const { pos, status } = placeOnAxis(features.introLiftSec, 0, long, axisLo, axisHi);
    axes.push({
      label: "time to hook",
      measured: mmss(features.introLiftSec),
      band: `0:00 to ${mmss(long)}`,
      ends: ["earlier", "later"],
      zone: bandToZone(0, long, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? `gets moving inside the genre's patience window (median ~${mmss(median)}).`
          : `released tracks land it by ~${mmss(long)} — yours waits longer, so the first listen risks drifting first.`,
    });
  }

  // ── low-end balance (share of spectrum) ──
  if (features.spectral) {
    const lowEnd = features.spectral.sub + features.spectral.bass;
    // Healthy low-end share sits roughly 0.30–0.55 of the spectrum across genres.
    const lo = 0.3;
    const hi = 0.55;
    const axisLo = 0;
    const axisHi = 0.85;
    const { pos, status } = placeOnAxis(lowEnd, lo, hi, axisLo, axisHi);
    axes.push({
      label: "low-end balance",
      measured: `${Math.round(lowEnd * 100)}% of spectrum`,
      band: `${Math.round(lo * 100)}–${Math.round(hi * 100)}%`,
      ends: ["lighter", "heavier"],
      zone: bandToZone(lo, hi, axisLo, axisHi),
      pos,
      status,
      estimated: true,
      note:
        status === "in"
          ? "low end sits where released tracks tend to."
          : lowEnd > hi
            ? "heavier low end than the genre median — worth a check on bigger systems."
            : "lighter low end than released tracks — may want more weight underneath.",
    });
  }

  return axes;
}

/**
 * Decide the verdict. Leads with the engine's measured verdict; nudges DOWN a
 * rung if the release bar found a hard out-of-band blocker (so an "ALMOST_THERE"
 * with a real blocker doesn't read as ready). Never nudges up — measured craft
 * caps it.
 */
export function deriveVerdict(
  generated: Pick<GeneratedReport, "verdict" | "score">,
  releaseBar: ReleaseAxis[]
): ScoreVerdict {
  const order: ScoreVerdict[] = ["NOT_READY", "NEEDS_WORK", "ALMOST_THERE", "RELEASE_READY"];
  let idx = order.indexOf(generated.verdict);
  if (idx < 0) idx = 1;
  const outOfBand = releaseBar.filter((a) => a.status === "out").length;
  // A release-ready call with a measured blocker is at most "almost there".
  if (outOfBand > 0 && idx >= 3) idx = 2;
  // Two+ hard blockers can't be "almost there" either.
  if (outOfBand >= 2 && idx >= 2) idx = 1;
  return order[clamp(idx, 0, 3)];
}

/**
 * Rank the priority fixes into release blockers. The fix flagged by the most of
 * the room becomes rank 1; an out-of-band release-bar axis (a real measured
 * blocker) is surfaced as the weight on rank 1 when one exists.
 */
export function buildBlockers(
  generated: Pick<GeneratedReport, "priorityFixes">,
  releaseBar: ReleaseAxis[]
): Blocker[] {
  const outOfBand = releaseBar.filter((a) => a.status === "out").length;
  const fixes = [...generated.priorityFixes].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return fixes.slice(0, 3).map((f, i) => ({
    rank: i + 1,
    weight:
      i === 0
        ? outOfBand > 0
          ? "the one that's holding the verdict"
          : "worth doing before you ship"
        : i === 1
          ? "worth doing before you ship"
          : "polish, not a blocker",
    label: f.label,
    detail: f.detail,
  }));
}

/** Build the full verdict payload, or null when there's nothing to ground it. */
export function buildVerdictPayload(
  generated: GeneratedReport,
  features: AudioFeatures | null,
  genre: string | null | undefined
): VerdictPayloadResult | null {
  if (!VERDICT_REPORT) return null;
  const releaseBar = buildReleaseBar(features, genre);
  // No measured axes → nothing honest to show on the bar; skip the verdict layout
  // and let the report fall back to the legacy view.
  if (releaseBar.length === 0) return null;
  return {
    verdict: deriveVerdict(generated, releaseBar),
    releaseBar,
    blockers: buildBlockers(generated, releaseBar),
  };
}
