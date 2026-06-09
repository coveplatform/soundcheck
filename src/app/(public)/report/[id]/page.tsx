import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportHumanReviews, getScoreRoomQuota } from "@/lib/score-review";
import { ReportView, type ReportViewModel, type Verdict } from "./report-view";

export const dynamic = "force-dynamic";

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
      initial: "S",
      genre: "Electronic · Pop",
      rating: 4,
      headline: "Hook caught me straight away",
      quote:
        "Really liked this. The hook lands early and I caught myself humming it after. The drop has a nice bounce to it. For me the only thing was the middle felt a tiny bit long, but honestly its close.",
      positive: true,
    },
    {
      initial: "M",
      genre: "Hip-Hop · R&B",
      rating: 5,
      headline: "Felt release-ready to me",
      quote:
        "This one is clean. Everthing sits nicely and it kept my attention the whole way. Would happily hear this on a playlist. Talented!",
      positive: true,
    },
    {
      initial: "A",
      genre: "Electronic",
      rating: 3,
      headline: "Intro dragged a little for me",
      quote:
        "Solid track but the intro took a while to get going. I wanted to hit the hook sooner. Once it kicked in I was into it though.",
      positive: false,
    },
    {
      initial: "J",
      genre: "Indie",
      rating: 4,
      headline: "Warm and easy to sit with",
      quote:
        "Nice vibe. It felt warm and I liked where it went. The ending came up a bit quick on me, would love a little more of a wind down.",
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
    initial?: string;
    genre?: string;
    rating?: number;
    headline?: string;
    quote?: string;
    positive?: boolean;
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "demo") {
    return <ReportView data={DEMO} />;
  }

  const report = await prisma.trackScoreReport.findUnique({
    where: { slug: id },
  });

  if (!report) notFound();

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
        }}
      />
    );
  }

  const score = report.score ?? 0;
  const quotes = (report.reviewerQuotes as unknown as DbReactions | null) ?? {};
  const reactions = (quotes.reactions ?? []).map((r, i) => ({
    initial: (r.initial || "?").slice(0, 1).toUpperCase(),
    genre: r.genre || report.genre || "",
    rating: Math.max(1, Math.min(5, Math.round(r.rating ?? 3))),
    headline: r.headline || "",
    quote: r.quote || "",
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

  // Real human reactions ("room of 5"). Total = reviewers actually assigned to
  // THIS report (0 for reports created before the room existed → section hidden).
  const [humanRows, humanTotal] = await Promise.all([
    getReportHumanReviews(report.id),
    prisma.scoreReview.count({ where: { reportId: report.id } }),
  ]);
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

  const data: ReportViewModel = {
    slug: report.slug,
    isDemo: false,
    pending: false,
    unlocked: report.paidAt != null,
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
    priorityFixes: fixes,
    invalid: quotes.invalid?.reason
      ? { reason: quotes.invalid.reason, durationSec: quotes.invalid.durationSec }
      : null,
    // Absent (old reports) → treat as grounded; only an explicit false flags it.
    grounded: quotes.grounded !== false,
  };

  return <ReportView data={data} />;
}
