/**
 * Decision-report verdict engine tests.
 *
 * These lock the behaviour behind two real reports that were mis-called before
 * the fix: a guitar-and-drums solo and Pink Floyd's "Comfortably Numb" both
 * scored 88–89/100 craft but were stamped "needs work" because the release bar
 * treated GOOD things (wide dynamics, a long deliberate intro on a 7-minute
 * track) and sparse instrumentation (light low end) as hard release blockers.
 *
 * The rules under test:
 *  - axes only hard-block on the direction that's actually a release problem
 *    (squashed dynamics block; MORE dynamic range does not — it reads "edge"),
 *  - time-to-hook scales with track length (a 1:43 intro on a ~7-min track is
 *    the form, not a blocker),
 *  - the blocker list leads with the measured out-of-band axes so the hero's
 *    "N blockers" count matches what's listed,
 *  - genre resolution prefers the artist's pick, then a confident listen.
 */

import { describe, it, expect } from "vitest";
import {
  buildReleaseBar,
  deriveVerdict,
  buildBlockers,
  buildVerdictPayload,
} from "@/lib/score-verdict";
import { resolveGenre } from "@/lib/score-engine";
import type { AudioFeatures } from "@/lib/audio-analysis";
import type { GeneratedReport } from "@/lib/score-report-ai";

// ── factories ────────────────────────────────────────────────────────

function features(over: Partial<AudioFeatures> = {}): AudioFeatures {
  return {
    source: "worker",
    durationSec: 200,
    sourceDurationSec: 200,
    loudnessLufs: -12,
    crestDb: 10,
    introLiftSec: 10,
    spectral: { sub: 0.18, bass: 0.22, lowMid: 0.2, mid: 0.22, high: 0.18 },
    ...over,
  };
}

function generated(over: Partial<GeneratedReport> = {}): GeneratedReport {
  return {
    score: 80,
    percentile: 28,
    verdict: "ALMOST_THERE",
    categories: [],
    hookScore: 4,
    productionScore: 4,
    retentionScore: 4,
    emotionalScore: 4,
    commercialScore: 4,
    summaryHeadline: "",
    aiSummary: "",
    reactions: [],
    priorityFixes: [
      { label: "tighten the mid-section", detail: "energy dips in the middle.", count: 9 },
      { label: "build a bigger payoff", detail: "the peak stays flat.", count: 6 },
      { label: "give the outro a moment", detail: "it ends abruptly.", count: 4 },
    ],
    ...over,
  };
}

const axis = (bar: ReturnType<typeof buildReleaseBar>, label: string) =>
  bar.find((a) => a.label === label)!;

// ── the two real tracks that were mis-called ─────────────────────────

describe("real tracks that were wrongly called 'needs work'", () => {
  it("guitar+drums solo: wide dynamics & light low end are 'edge', not blockers", () => {
    // 16.4 dB crest, 21% low-end share, hook at 0:04 on a ~2-min clip, genre "Other".
    const f = features({
      loudnessLufs: -16.6,
      crestDb: 16.4,
      introLiftSec: 4,
      durationSec: 117,
      sourceDurationSec: 117,
      spectral: { sub: 0.08, bass: 0.13, lowMid: 0.2, mid: 0.3, high: 0.29 },
    });
    const bar = buildReleaseBar(f, "Other");

    expect(axis(bar, "master loudness").status).toBe("in");
    expect(axis(bar, "dynamic range").status).toBe("edge"); // wider, not a fault
    expect(axis(bar, "time to hook").status).toBe("in");
    expect(axis(bar, "low-end balance").status).toBe("edge"); // sparse, not a fault
    expect(bar.filter((a) => a.status === "out")).toHaveLength(0);

    // 88/100 craft → release-ready, and nothing drags it down.
    expect(deriveVerdict({ verdict: "RELEASE_READY", score: 88 }, bar)).toBe(
      "RELEASE_READY"
    );
  });

  it("Comfortably Numb: a 1:43 intro on a ~7-min track is in-band", () => {
    const f = features({
      loudnessLufs: -14.6,
      crestDb: 14.6,
      introLiftSec: 103, // 1:43
      durationSec: 414,
      sourceDurationSec: 414, // 6:54
      spectral: { sub: 0.1, bass: 0.15, lowMid: 0.25, mid: 0.3, high: 0.2 },
    });
    const bar = buildReleaseBar(f, "Other");

    expect(axis(bar, "dynamic range").status).toBe("in");
    expect(axis(bar, "time to hook").status).toBe("in"); // length-aware window
    expect(axis(bar, "low-end balance").status).toBe("edge");
    expect(bar.filter((a) => a.status === "out")).toHaveLength(0);

    const payload = buildVerdictPayload(generated({ score: 89, verdict: "RELEASE_READY" }), f, "Other");
    expect(payload?.verdict).toBe("RELEASE_READY");
  });
});

// ── the directional rules still catch REAL problems ──────────────────

describe("genuine problems still block release", () => {
  it("a squashed master (low crest) is out-of-band and caps the verdict", () => {
    const f = features({ crestDb: 3 }); // hyper-compressed, below the floor
    const bar = buildReleaseBar(f, "Other");
    expect(axis(bar, "dynamic range").status).toBe("out");
    // A release-ready score can't stay release-ready with a measured blocker.
    expect(deriveVerdict({ verdict: "RELEASE_READY", score: 90 }, bar)).toBe(
      "ALMOST_THERE"
    );
  });

  it("a late hook on a SHORT track still blocks", () => {
    const f = features({ introLiftSec: 60, durationSec: 150, sourceDurationSec: 150 });
    const bar = buildReleaseBar(f, "Pop"); // pop = least patient
    expect(axis(bar, "time to hook").status).toBe("out");
  });

  it("a muddy (heavy) low end still blocks; a light one does not", () => {
    const heavy = buildReleaseBar(
      features({ spectral: { sub: 0.4, bass: 0.4, lowMid: 0.1, mid: 0.05, high: 0.05 } }),
      "Other"
    );
    expect(axis(heavy, "low-end balance").status).toBe("out");
  });

  it("two real blockers drop the verdict two rungs", () => {
    const f = features({ crestDb: 3, loudnessLufs: -28 }); // squashed AND far too quiet
    const bar = buildReleaseBar(f, "Other");
    expect(bar.filter((a) => a.status === "out").length).toBeGreaterThanOrEqual(2);
    expect(deriveVerdict({ verdict: "RELEASE_READY", score: 90 }, bar)).toBe(
      "NEEDS_WORK"
    );
  });
});

// ── blocker list is one coherent, grounded list ──────────────────────

describe("blockers lead with the measured out-of-band axes", () => {
  it("the measured blocker is rank 1 and 'holding the verdict'", () => {
    const f = features({ crestDb: 3 });
    const bar = buildReleaseBar(f, "Other");
    const blockers = buildBlockers(generated(), bar);

    expect(blockers[0].label).toBe("ease the compression back");
    expect(blockers[0].weight).toBe("the one that's holding the verdict");
    expect(blockers[0].detail).toContain("dynamic range measured");
    // hero "N blockers" (out-of-band count) === leading measured entries.
    const outOfBand = bar.filter((a) => a.status === "out").length;
    expect(blockers.slice(0, outOfBand).every((b) => b.weight.includes("verdict") || b.weight.includes("blocking"))).toBe(true);
  });

  it("an AI fix that restates a measured blocker is de-duplicated", () => {
    const f = features({ introLiftSec: 60, durationSec: 150, sourceDurationSec: 150 });
    const bar = buildReleaseBar(f, "Pop");
    const g = generated({
      priorityFixes: [
        { label: "shorten the intro", detail: "trim it so the hook lands sooner.", count: 12 },
        { label: "widen the stereo image", detail: "the sides feel narrow.", count: 5 },
      ],
    });
    const blockers = buildBlockers(g, bar);
    expect(blockers[0].label).toBe("get to the hook sooner"); // measured one
    // the "shorten the intro" AI fix shouldn't appear as its own second blocker.
    expect(blockers.filter((b) => /intro|hook/i.test(b.label))).toHaveLength(1);
  });

  it("with nothing out of band, the top fix is framed as pre-ship polish", () => {
    const bar = buildReleaseBar(features(), "Other"); // all in/edge
    expect(bar.filter((a) => a.status === "out")).toHaveLength(0);
    const blockers = buildBlockers(generated(), bar);
    expect(blockers[0].weight).toBe("worth doing before you ship");
    expect(blockers.some((b) => b.weight === "the one that's holding the verdict")).toBe(false);
  });
});

// ── genre resolution ─────────────────────────────────────────────────

describe("resolveGenre", () => {
  it("the artist's explicit pick always wins", () => {
    expect(resolveGenre("Rock", "Pop", "high")).toEqual({ genre: "Rock", fromListen: false });
  });
  it("adopts a confident listen genre when the artist left it 'Other'", () => {
    expect(resolveGenre("Other", "Rock", "high")).toEqual({ genre: "Rock", fromListen: true });
    expect(resolveGenre("", "Jazz", "medium")).toEqual({ genre: "Jazz", fromListen: true });
  });
  it("ignores a low-confidence or 'Other' detection", () => {
    expect(resolveGenre("Other", "Rock", "low")).toEqual({ genre: "Other", fromListen: false });
    expect(resolveGenre("Other", "Other", "high")).toEqual({ genre: "Other", fromListen: false });
    expect(resolveGenre(null, null, undefined)).toEqual({ genre: "Other", fromListen: false });
  });
});
