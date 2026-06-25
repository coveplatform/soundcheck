import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportHumanReviews, getScoreRoomQuota } from "@/lib/score-review";
import { isFreeOpenRead } from "@/lib/score-free-cap";
import { SealedPaywall } from "@/components/score/sealed-paywall";
import { ReportView, type ReportViewModel, type Verdict } from "./report-view";
import {
  VerdictReportView,
  type VerdictReportData,
} from "@/components/score/verdict-report-view";
import type { ReleaseAxis, Blocker } from "@/components/score/verdict-types";
// Real measured waveform for the demo (worker `_report_waveform` output,
// borrowed from the demo-free prototype's sample track).
import demoWaveRaw from "../demo-free/cutandrun-wave.json";

export const dynamic = "force-dynamic";

// User reports are private to the artist and shouldn't be indexed.
export const metadata: Metadata = {
  title: "Your Track Report",
  description:
    "Your track's release verdict and the report behind it — measured craft versus the release bar, plus reactions from a room of real listeners.",
  robots: { index: false, follow: false },
};

const ROOM_SIZE = 20;

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function asVerdict(v: string | null | undefined, score: number): Verdict {
  if (
    v === "RELEASE_READY" ||
    v === "ALMOST_THERE" ||
    v === "NEEDS_WORK" ||
    v === "NOT_READY"
  ) {
    return v;
  }
  if (score >= 85) return "RELEASE_READY";
  if (score >= 70) return "ALMOST_THERE";
  if (score >= 50) return "NEEDS_WORK";
  return "NOT_READY";
}

// ── Demo sample (shown unlocked at /report/demo) ────────────────────

// The prototype's JSON stores float columns; the report renderer takes
// base64 uint8 — convert once at module load.
const waveB64 = (cols: number[]) =>
  Buffer.from(
    cols.map((v) => Math.max(0, Math.min(255, Math.round(v * 255))))
  ).toString("base64");

const DEMO_WAVE: ReportViewModel["waveform"] = {
  n: demoWaveRaw.lo.length,
  lo: waveB64(demoWaveRaw.lo),
  mid: waveB64(demoWaveRaw.mid),
  hi: waveB64(demoWaveRaw.hi),
  durationSec: 359, // the source track runs 5:59
};

const DEMO: ReportViewModel = {
  slug: "demo",
  isDemo: true,
  pending: false,
  unlocked: true,
  trackTitle: "Midnight Drive",
  artworkUrl: "/activity-artwork/5.jpg",
  genre: "Electronic",
  scoredAt: "May 20, 2025",
  roomSize: ROOM_SIZE,
  score: 82,
  percentile: 27,
  verdict: "ALMOST_THERE",
  categories: [
    { label: "Hook Strength", score: 4.2, pct: 84, note: "The hook lands fast — the first vocal phrase is the strongest moment and most of the room caught it on one listen. It could hit even harder if it arrived a few seconds sooner." },
    { label: "Production Quality", score: 3.8, pct: 76, note: "The mix is clean and confident; nothing sounds amateur. The low end is a touch polite for the genre — a bit more weight under the drop would make it feel finished." },
    { label: "Listener Retention", score: 3.4, pct: 68, note: "Attention is locked through the first drop, then dips around the 1:10 mark where the track sits on one idea too long before the back half pulls it back." },
    { label: "Emotional Impact", score: 4.0, pct: 80, note: "There's a genuine warmth that reads as honest rather than manufactured. The emotional peak is real — leaning into it harder rather than pulling back would deepen it." },
    { label: "Commercial Potential", score: 3.6, pct: 72, note: "Strong playlist fit for late-night electronic — it has a clear audience. What caps its reach is the absence of one undeniable, quotable moment to anchor a share." },
  ],
  summaryHeadline: "The room leaned in early, drifted a touch mid-way.",
  aiSummary:
    "The opening grabbed people fast — most of the room was locked in by the first hook. Energy held strong through the first drop, then a few listeners drifted in the mid-section where the track sits in one idea a beat too long. The back half pulls it back and the emotional read stays warm throughout. Get people to the hook a little sooner and this holds the whole room.",
  reactions: [
    {
      lens: "producer's read",
      genre: "Electronic · Pop",
      headline: "Hook lands fast, the intro slightly delays it",
      quote:
        "The first vocal phrase is the strongest moment and it arrives early enough to catch the room. Trimming a few seconds off the intro would let it hit sooner and carry the energy straight into the drop.",
      tags: ["strong hook", "trim intro"],
      positive: true,
    },
    {
      lens: "mix lens",
      genre: "Electronic",
      headline: "Clean and confident, low end a touch polite",
      quote:
        "Nothing reads as amateur — the balance is controlled and the highs are crisp. The sub sits politely for the genre, so a little more weight under the drop would make it feel fully finished.",
      tags: ["clean mix", "more low-end"],
      positive: true,
    },
    {
      lens: "casual first listen",
      genre: "Pop",
      headline: "Locked in early, a dip around the middle",
      quote:
        "The opening pulls you in and the first drop keeps it moving. Around the 1:10 mark the track sits on one idea a beat too long, which is where a first-time listener is most likely to drift before the back half pulls it back.",
      tags: ["mid-track dip"],
      positive: false,
    },
    {
      lens: "playlist curator",
      genre: "Indie",
      headline: "Strong late-night fit, needs one quotable moment",
      quote:
        "It slots naturally into a late-night electronic playlist and the warmth reads as honest rather than manufactured. What caps its reach is the absence of one undeniable moment to anchor a share or a save.",
      tags: ["playlist-ready", "no standout"],
      positive: true,
    },
  ],
  priorityFixes: [
    {
      label: "Get to the hook 8–12 seconds sooner",
      detail:
        "Most of the room wanted the hook earlier. Trimming the intro keeps people from drifting before the best part.",
      count: 13,
    },
    {
      label: "Add a small change in the mid-section",
      detail:
        "A few people drifted around the middle. A new element or a filter sweep would re-grab attention.",
      count: 7,
    },
    {
      label: "Give the outro a softer landing",
      detail:
        "The ending felt abrupt to some. A short tail or fade rounds the whole thing off.",
      count: 4,
    },
  ],
  humanReviewsIn: 3,
  humanReviewsTotal: 5,
  waveform: DEMO_WAVE,
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
};

type DbReactions = {
  headline?: string;
  reactions?: Array<{
    lens?: string;
    genre?: string;
    headline?: string;
    quote?: string;
    tags?: string[];
    positive?: boolean;
    // Legacy fields on older stored rows — tolerated, not rendered.
    initial?: string;
    rating?: number;
  }>;
  categoryNotes?: Partial<
    Record<"hook" | "production" | "retention" | "emotional" | "commercial", string>
  >;
  // Set by generateAndStoreReport: the clip was too short to score, and whether
  // the read was grounded in real measured audio (vs. title/metadata only).
  invalid?: { reason?: string; durationSec?: number };
  grounded?: boolean;
};

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  if (id === "demo") {
    return <ReportView data={DEMO} />;
  }

  // The open-read (free-tier) model: the full AI read rendered free — score,
  // prose, every dimension note, fixes and waveform all open — with the human
  // room + deep read as the paid upgrade. The prototype for FREE_FULL_READ.
  if (id === "demo-open") {
    return (
      <ReportView
        data={{
          ...DEMO,
          slug: "demo-open",
          unlocked: false,
          openRead: true,
          humanReviews: [],
          humanReviewsIn: 0,
          humanReviewsTotal: 0,
        }}
      />
    );
  }

  // The same sample track in its pre-purchase state: sealed prose, the
  // room-is-waiting pitch (with sample reaction), and the unlock gate.
  if (id === "demo-locked") {
    return (
      <ReportView
        data={{
          ...DEMO,
          slug: "demo-locked",
          unlocked: false,
          humanReviews: [],
          humanReviewsIn: 0,
          humanReviewsTotal: 0,
        }}
      />
    );
  }

  const report = await prisma.trackScoreReport.findUnique({
    where: { slug: id },
  });

  if (!report) notFound();

  // Hard free-tier wall: a SEALED report (created by the pay-to-continue
  // checkout) has no read until payment lands. Show the pay-gate instead of the
  // pending/self-heal screen so it never generates for free. Exception: if they
  // just came back from Stripe (?unlocked / ?subscribed), fall through to the
  // pending screen — paidAt may lag the redirect, and generation is already
  // firing from the webhook.
  const sp = await searchParams;
  const justPaid = sp.unlocked != null || sp.subscribed != null;
  const sealedAwaiting =
    (report.reviewerQuotes as { sealed?: boolean } | null)?.sealed === true &&
    report.score == null &&
    report.paidAt == null;
  if (sealedAwaiting && !justPaid) {
    return (
      <SealedPaywall
        slug={report.slug}
        email={report.email || undefined}
        trackTitle={report.trackTitle || undefined}
        dismissHref="/"
      />
    );
  }

  const pending = report.status === "PENDING" || report.score == null;

  if (pending) {
    return (
      <ReportView
        data={{
          ...DEMO,
          slug: report.slug,
          isDemo: false,
          pending: true,
          unlocked: false,
          trackTitle: report.trackTitle || "Your track",
          // Real artwork if the oEmbed staged write already landed (never the
          // demo's) — the pending view fills it in live otherwise.
          artworkUrl: report.artworkUrl ?? null,
          // Real genre (or none): drives the pending screen's genre picker —
          // the DEMO spread's "Electronic" would wrongly hide it.
          genre: report.genre ?? "",
          // An existing prediction hides the pending screen's predictor.
          scoreGuess: report.scoreGuess ?? null,
        }}
      />
    );
  }

  const score = report.score ?? 0;
  const quotes = (report.reviewerQuotes as unknown as DbReactions | null) ?? {};
  const reactions = (quotes.reactions ?? []).map((r) => ({
    lens: r.lens || "",
    genre: r.genre || report.genre || "",
    headline: r.headline || "",
    quote: r.quote || "",
    tags: Array.isArray(r.tags) ? r.tags.slice(0, 3).map(String) : [],
    positive: Boolean(r.positive),
  }));

  const fixes = (
    (report.priorityFixes as unknown as Array<{
      label?: string;
      detail?: string;
      count?: number;
    }> | null) ?? []
  ).map((f) => ({
    label: f.label || "",
    detail: f.detail || "",
    count: Math.max(1, Math.round(f.count ?? 1)),
  }));

  const notes = quotes.categoryNotes ?? {};
  const cat = (
    label: string,
    v: number | null,
    key: "hook" | "production" | "retention" | "emotional" | "commercial"
  ) => ({
    label,
    score: v ?? 0,
    pct: Math.round(((v ?? 0) / 5) * 100),
    note: notes[key] ?? "",
  });

  // Real human reactions ("room of 5"). Any ScoreReview row means the room is
  // active for this report (0 rows = created before the room existed → section
  // hidden), but the shown total is the promised room size — the raw row count
  // also includes released/expired seats and climbs as reviewers churn.
  const [humanRows, seatRows] = await Promise.all([
    getReportHumanReviews(report.id),
    prisma.scoreReview.count({ where: { reportId: report.id } }),
  ]);
  const humanTotal = seatRows > 0 ? report.humanReviewsRequested : 0;
  const humanReviews = humanRows.map((h) => ({
    rating: Math.max(1, Math.min(5, Math.round(h.rating ?? 3))),
    headline: h.headline || "",
    quote: h.quote || "",
    positive: Boolean(h.positive),
  }));

  // Subscriber submitted past their monthly room allowance: AI read only.
  const roomSkipped = report.humanRoomSkipped && humanTotal === 0;
  const roomResetsAt = roomSkipped
    ? fmtDate((await getScoreRoomQuota(report.email)).resetsAt)
    : null;

  // The free-tier ladder: an unpaid report renders open only if it's this
  // email's lifetime free read (their earliest valid report) — every later
  // track renders sealed and opens via the existing $6.95 unlock. Paid skips
  // the lookup. No-op while FREE_FULL_READ is off.
  const openRead =
    report.paidAt == null &&
    (await isFreeOpenRead({ id: report.id, email: report.email }));

  const data: ReportViewModel = {
    slug: report.slug,
    isDemo: false,
    pending: false,
    unlocked: report.paidAt != null,
    openRead,
    trackTitle: report.trackTitle || "Your track",
    genre: report.genre || "—",
    scoredAt: fmtDate(report.completedAt ?? report.createdAt),
    roomSize: ROOM_SIZE,
    score,
    percentile: Math.round(report.percentile ?? 100 - score),
    verdict: asVerdict(report.verdict, score),
    artworkUrl: report.artworkUrl ?? null,
    categories: [
      cat("Hook Strength", report.hookScore, "hook"),
      cat("Production Quality", report.productionScore, "production"),
      cat("Listener Retention", report.retentionScore, "retention"),
      cat("Emotional Impact", report.emotionalScore, "emotional"),
      cat("Commercial Potential", report.commercialScore, "commercial"),
    ],
    summaryHeadline: quotes.headline || "The room weighed in.",
    aiSummary: report.aiSummary || "",
    reactions,
    humanReviews,
    humanReviewsIn: humanReviews.length,
    humanReviewsTotal: humanTotal,
    roomSkipped,
    roomResetsAt,
    scoreGuess: report.scoreGuess ?? null,
    priorityFixes: fixes,
    invalid: quotes.invalid?.reason
      ? { reason: quotes.invalid.reason, durationSec: quotes.invalid.durationSec }
      : null,
    // Absent (old reports) → treat as grounded; only an explicit false flags it.
    grounded: quotes.grounded !== false,
    // The measured 3-band waveform (worker `_report_waveform`) — unlocked only.
    waveform: (report.waveform as ReportViewModel["waveform"]) ?? null,
  };

  // ── Decision-report (verdict) layout ──
  // Render the verdict view ONLY when the report carries a generated release bar
  // (set by score-report-ai for newly-measured tracks). Existing reports — and
  // any report whose generation couldn't ground a bar (e.g. metadata-only reads)
  // — have null releaseBar and render the legacy ReportView unchanged. The
  // sealed / open-read / unlocked states + the real human room carry through.
  const releaseBar = (report.releaseBar as ReleaseAxis[] | null) ?? null;
  if (releaseBar && releaseBar.length > 0 && !data.invalid) {
    const blockers = (report.blockers as Blocker[] | null) ?? [];
    // Surface the strongest dimension on the craft check (cosmetic tag).
    const strongest = data.categories.reduce(
      (best, c) => (c.score > best.score ? c : best),
      data.categories[0]
    );
    const verdictData: VerdictReportData = {
      slug: data.slug,
      trackTitle: data.trackTitle,
      artworkUrl: data.artworkUrl,
      genre: data.genre,
      scoredAt: data.scoredAt,
      isDemo: false,
      unlocked: data.unlocked,
      openRead: data.openRead,
      verdict: data.verdict,
      releaseBar,
      blockers,
      score: data.score,
      aiSummary: data.aiSummary,
      summaryHeadline: data.summaryHeadline,
      categories: data.categories.map((c) => ({
        label: c.label,
        score: c.score,
        tag: c === strongest ? "strongest" : null,
      })),
      waveform: data.waveform,
      humanReviews: data.humanReviews,
      humanReviewsIn: data.humanReviewsIn,
      humanReviewsTotal: data.humanReviewsTotal,
      roomSkipped: data.roomSkipped,
      roomResetsAt: data.roomResetsAt,
    };
    return <VerdictReportView data={verdictData} />;
  }

  return <ReportView data={data} />;
}
