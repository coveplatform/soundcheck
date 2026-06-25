/**
 * Shared shapes for the decision-report (verdict) layout.
 *
 * These are the JSON shapes persisted on `TrackScoreReport.releaseBar` and
 * `.blockers` (see prisma/schema.prisma) and consumed by the production
 * `VerdictReportView`. Kept in a server-safe module (no "use client") so both
 * the generator (`src/lib/score-report-ai.ts`) and the view can import them.
 */

export type Verdict =
  | "NOT_READY"
  | "NEEDS_WORK"
  | "ALMOST_THERE"
  | "RELEASE_READY";

/** One measured craft axis against the genre's release envelope.
 *  `zone` = where released tracks sit (the band), as a % span of the axis.
 *  `pos`  = where THIS track measured, 0-100. */
export type ReleaseAxis = {
  label: string;
  measured: string;
  band: string;
  ends: [string, string];
  zone: [number, number];
  pos: number;
  status: "in" | "edge" | "out";
  note: string;
  /** True while the band is an estimate (no real reference corpus yet). */
  estimated?: boolean;
};

/** A ranked thing standing between this track and release. */
export type Blocker = {
  rank: number;
  /** Weight label, e.g. "the one that's holding the verdict". */
  weight: string;
  label: string;
  detail: string;
};

/** The verdict payload stored on a report (all nullable until generated). */
export type VerdictPayload = {
  verdict: Verdict;
  releaseBar: ReleaseAxis[];
  blockers: Blocker[];
};
