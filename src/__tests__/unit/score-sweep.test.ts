/**
 * Deep-read sweep selection — the starvation guarantee.
 *
 * Regression cover for the production incident: a poisoned head-of-queue report
 * was retried every run and starved everyone behind it. selectDeepSweepCandidates
 * must drop done/failed/cooling reports and never let a failing record pin the head.
 */
import { describe, it, expect } from "vitest";
import { selectDeepSweepCandidates } from "@/lib/score-sweep";

const NOW = 1_700_000_000_000; // fixed clock
const MIN = 60_000;

type R = { id: string; reviewerQuotes?: Record<string, unknown> };
const ids = (rs: R[]) => rs.map((r) => r.id);

describe("selectDeepSweepCandidates", () => {
  it("excludes already-done, invalid, and terminally-failed reports", () => {
    const got = selectDeepSweepCandidates<R>(
      [
        { id: "done", reviewerQuotes: { deep: true } },
        { id: "invalid", reviewerQuotes: { invalid: { reason: "dead" } } },
        { id: "failed", reviewerQuotes: { deepFailed: true } },
        { id: "fresh", reviewerQuotes: {} },
      ],
      NOW
    );
    expect(ids(got)).toEqual(["fresh"]);
  });

  it("skips a report still in its retry cooldown", () => {
    const got = selectDeepSweepCandidates<R>(
      [
        { id: "cooling", reviewerQuotes: { deepLastAttemptAt: new Date(NOW - 5 * MIN).toISOString() } },
        { id: "cooled", reviewerQuotes: { deepLastAttemptAt: new Date(NOW - 40 * MIN).toISOString() } },
      ],
      NOW,
      30 * MIN
    );
    expect(ids(got)).toEqual(["cooled"]);
  });

  it("orders never-attempted first, then least-recently-attempted (no head-of-line starvation)", () => {
    const got = selectDeepSweepCandidates<R>(
      [
        { id: "triedRecently", reviewerQuotes: { deepLastAttemptAt: new Date(NOW - 60 * MIN).toISOString() } },
        { id: "neverTried", reviewerQuotes: {} },
        { id: "triedLongAgo", reviewerQuotes: { deepLastAttemptAt: new Date(NOW - 120 * MIN).toISOString() } },
      ],
      NOW,
      30 * MIN
    );
    // never-attempted (0) sorts ahead of any attempted; oldest attempt before newer.
    expect(ids(got)).toEqual(["neverTried", "triedLongAgo", "triedRecently"]);
  });

  it("a perpetually-failing head cannot block a fresh report behind it", () => {
    // The poisoned report has been tried but isn't yet deepFailed; once it's in
    // cooldown it yields its slot, and a fresh report is picked instead.
    const got = selectDeepSweepCandidates<R>(
      [
        { id: "poison", reviewerQuotes: { deepLastAttemptAt: new Date(NOW - 1 * MIN).toISOString() } },
        { id: "victim", reviewerQuotes: {} },
      ],
      NOW,
      30 * MIN
    );
    expect(got[0]?.id).toBe("victim");
  });
});
