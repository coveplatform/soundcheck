"use client";

/**
 * DEMO wrapper for /report/demo-verdict.
 *
 * The verdict layout has been productionised into
 * `@/components/score/verdict-report-view`. This file now just feeds that
 * production component the same hardcoded DEMO data the sandbox always used, so
 * the reposition can still be reviewed live at /report/demo-verdict without a
 * real report. The shapes (AXES / LADDER / BLOCKERS) moved into the production
 * component + `verdict-types.ts`; here we only build the demo view-model.
 */

import { VerdictReportView as ProdVerdictReportView } from "@/components/score/verdict-report-view";
import type {
  VerdictReportData,
} from "@/components/score/verdict-report-view";
import type { ReleaseAxis, Blocker } from "@/components/score/verdict-types";
import { DEMO } from "../demo-free/free-teaser-view";

// the demo track lands on ALMOST_THERE — close, one real blocker, fixable.
const AXES: ReleaseAxis[] = [
  {
    label: "master loudness",
    measured: "−9.2 dB",
    band: "−11 to −7 dB",
    ends: ["quieter", "louder"],
    zone: [28, 70],
    pos: 52,
    status: "in",
    note: "loud enough to compete, not crushed.",
    estimated: true,
  },
  {
    label: "low-end balance",
    measured: "+2 dB",
    band: "−1 to +1 dB",
    ends: ["lighter", "heavier"],
    zone: [34, 66],
    pos: 71,
    status: "edge",
    note: "a touch hot — fine on phones, heavy on a club system. worth a check.",
    estimated: true,
  },
  {
    label: "time to hook",
    measured: "0:43",
    band: "0:10 to 0:25",
    ends: ["earlier", "later"],
    zone: [12, 42],
    pos: 79,
    status: "out",
    note: "released tracks land the hook by ~0:18 — yours waits 25s longer. this is the blocker.",
    estimated: true,
  },
  {
    label: "dynamic range",
    measured: "6.4 dB",
    band: "5 to 9 dB",
    ends: ["flatter", "punchier"],
    zone: [30, 78],
    pos: 49,
    status: "in",
    note: "it breathes — not a wall of limiter.",
    estimated: true,
  },
  {
    label: "arrangement movement",
    measured: "1 still spot",
    band: "0 to 1 still spots",
    ends: ["stiller", "busier"],
    zone: [42, 86],
    pos: 37,
    status: "edge",
    note: "one mid-section (1:38) holds a single idea a beat longer than the genre tends to.",
    estimated: true,
  },
];

const BLOCKERS: Blocker[] = [
  {
    rank: 1,
    weight: "the one that's holding the verdict",
    label: "get to the hook sooner",
    detail:
      "the strongest moment lands at 0:43; released tracks in this genre arrive ~25s earlier. trim the intro and the call flips to release-ready — this is the whole gap.",
  },
  {
    rank: 2,
    weight: "worth doing before you ship",
    label: "tame the low end ~2 dB",
    detail:
      "the bass sits hotter than the genre median. a gentle shelf keeps it from masking the kick on bigger systems.",
  },
  {
    rank: 3,
    weight: "polish, not a blocker",
    label: "give the mid-section one new element",
    detail:
      "1:38 holds a single idea a touch long. a filter sweep or a new layer re-grabs attention without a rewrite.",
  },
];

const DEMO_DATA: VerdictReportData = {
  trackTitle: DEMO.trackTitle,
  artworkUrl: DEMO.artworkUrl,
  genre: DEMO.genre,
  scoredAt: DEMO.scoredAt,
  isDemo: true,
  unlocked: true,
  verdict: "ALMOST_THERE",
  releaseBar: AXES,
  blockers: BLOCKERS,
  score: DEMO.score,
  summaryHeadline:
    "the craft is there and the master holds up against released electronic tracks. one thing — how long it makes a listener wait for the hook — is what stands between this and a confident yes.",
  aiSummary:
    "the opening grabs slow but the back half earns it. energy climbs into the first drop and holds, then the mid-section around 1:38 sits on one idea a beat too long before the arrangement opens back up. the master is competitive and it breathes — not crushed. the one thing between this and a confident yes is how long it makes a listener wait for the hook.",
  categories: DEMO.categories.map((c) => ({
    label: c.label,
    score: c.score,
    tag: c.tag,
  })),
  // The demo shows the real measured waveform via the existing AnnotatedWaveform
  // in the teaser file; the production component uses ReportWaveform, which needs
  // base64 columns we don't have for the placeholder — so the demo omits it.
  waveform: null,
  // The demo keeps the room as a co-pillar with a real partial state (3 of 5 in).
  humanReviewsIn: 3,
  humanReviewsTotal: 5,
  humanReviews: [
    {
      rating: 4,
      headline: "Hook stuck with me after one listen",
      quote:
        "Played it twice back to back. The drop has real bounce and the hook is sticky. Middle sagged a touch for me but honestly its close to done.",
      positive: true,
    },
    {
      rating: 5,
      headline: "Would put this on a playlist today",
      quote:
        "Clean and confident. Everthing sits right and it kept me the whole way through. Talented!",
      positive: true,
    },
    {
      rating: 3,
      headline: "Intro made me wait a bit",
      quote:
        "Took a while to get going for me. Once the hook hit I was in, just wanted to get there sooner.",
      positive: false,
    },
  ],
  compareHref: "/report/demo-full",
};

export function VerdictReportView() {
  return <ProdVerdictReportView data={DEMO_DATA} />;
}
