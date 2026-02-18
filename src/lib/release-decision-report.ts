// AI analysis removed for now - using static analysis

// Report structure
export interface ReleaseDecisionReport {
  trackId: string;
  generatedAt: Date;

  // Consensus Verdict
  verdict: {
    consensus: "RELEASE_NOW" | "FIX_FIRST" | "NEEDS_WORK";
    breakdown: {
      RELEASE_NOW: number;
      FIX_FIRST: number;
      NEEDS_WORK: number;
    };
    confidence: "HIGH" | "MEDIUM" | "LOW";
  };

  // Readiness Score
  readinessScore: {
    average: number;
    median: number;
    range: [number, number];
    distribution: number[];
  };

  // Quality Level
  qualityLevel: {
    consensus: "NOT_READY" | "DEMO_STAGE" | "ALMOST_THERE" | "RELEASE_READY" | "PROFESSIONAL";
    breakdown: Record<string, number>;
  };

  // Top Fixes (aggregated from all reviewers)
  topFixes: Array<{
    issue: string;
    mentionedBy: number;
    avgImpact: "HIGH" | "MEDIUM" | "LOW";
    avgTimeEstimate: number;
    variations: string[];
  }>;

  // Strengths & Risks
  strengths: string[];
  risks: string[];
  competitiveBenchmarks: string[];

  // AI Analysis
  aiAnalysis: {
    summary: string;
    technicalInsights: string;
    marketRecommendation: string;
    estimatedWorkRequired: string;
    prioritizedActionPlan: string[];
  };

  // Individual Reviews
  reviewCount: number;
  reviews: Array<{
    reviewerId: string;
    verdict: string;
    readinessScore: number;
    qualityLevel: string;
    topFix1: string;
    topFix2: string;
    topFix3: string;
    strongestElement: string;
    biggestRisk: string;
    competitiveBenchmark: string;
  }>;
}

interface ReleaseDecisionReviewData {
  id: string;
  releaseVerdict: "RELEASE_NOW" | "FIX_FIRST" | "NEEDS_WORK" | null;
  releaseReadinessScore: number | null;
  topFixRank1: string | null;
  topFixRank1Impact: "HIGH" | "MEDIUM" | "LOW" | null;
  topFixRank1TimeMin: number | null;
  topFixRank2: string | null;
  topFixRank2Impact: "HIGH" | "MEDIUM" | "LOW" | null;
  topFixRank2TimeMin: number | null;
  topFixRank3: string | null;
  topFixRank3Impact: "HIGH" | "MEDIUM" | "LOW" | null;
  topFixRank3TimeMin: number | null;
  strongestElement: string | null;
  biggestRisk: string | null;
  competitiveBenchmark: string | null;
  ReviewerProfile: {
    id: string;
  } | null;
}

// Generate report from reviews
export async function generateReleaseDecisionReport(
  trackId: string,
  reviews: ReleaseDecisionReviewData[]
): Promise<ReleaseDecisionReport> {
  // Filter out incomplete reviews
  const completeReviews = reviews.filter(
    (r) => r.releaseVerdict && r.releaseReadinessScore !== null
  );

  if (completeReviews.length === 0) {
    throw new Error("No complete reviews to generate report from");
  }

  // 1. Calculate Verdict Consensus
  const verdictBreakdown = {
    RELEASE_NOW: 0,
    FIX_FIRST: 0,
    NEEDS_WORK: 0,
  };

  completeReviews.forEach((r) => {
    if (r.releaseVerdict) {
      verdictBreakdown[r.releaseVerdict]++;
    }
  });

  const totalReviews = completeReviews.length;
  const maxVotes = Math.max(...Object.values(verdictBreakdown));
  const consensus = (Object.keys(verdictBreakdown) as Array<keyof typeof verdictBreakdown>).find(
    (key) => verdictBreakdown[key] === maxVotes
  )!;

  const consensusPercentage = (maxVotes / totalReviews) * 100;
  const confidence: "HIGH" | "MEDIUM" | "LOW" =
    consensusPercentage >= 70 ? "HIGH" : consensusPercentage >= 50 ? "MEDIUM" : "LOW";

  // 2. Calculate Readiness Score
  const scores = completeReviews
    .map((r) => r.releaseReadinessScore!)
    .filter((s) => s !== null);
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)];

  const range: [number, number] = [Math.min(...scores), Math.max(...scores)];

  // Create distribution (0-20, 21-40, 41-60, 61-80, 81-100)
  const distribution = [0, 0, 0, 0, 0];
  scores.forEach((score) => {
    const bucket = Math.min(Math.floor(score / 20), 4);
    distribution[bucket]++;
  });

  // 3. Aggregate Top Fixes
  const fixMentions = new Map<string, { count: number; impacts: string[]; times: number[] }>();

  completeReviews.forEach((r) => {
    [
      { text: r.topFixRank1, impact: r.topFixRank1Impact, time: r.topFixRank1TimeMin },
      { text: r.topFixRank2, impact: r.topFixRank2Impact, time: r.topFixRank2TimeMin },
      { text: r.topFixRank3, impact: r.topFixRank3Impact, time: r.topFixRank3TimeMin },
    ].forEach((fix) => {
      if (fix.text && fix.text.length > 10) {
        // Normalize the fix text (lowercase, trim)
        const normalized = fix.text.toLowerCase().trim();

        if (!fixMentions.has(normalized)) {
          fixMentions.set(normalized, { count: 0, impacts: [], times: [] });
        }

        const entry = fixMentions.get(normalized)!;
        entry.count++;
        if (fix.impact) entry.impacts.push(fix.impact);
        if (fix.time) entry.times.push(fix.time);
      }
    });
  });

  // Sort by mention count and get top 3
  const sortedFixes = Array.from(fixMentions.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  const topFixes = sortedFixes.map(([issue, data]) => {
    const avgImpact =
      data.impacts.length > 0
        ? (data.impacts.filter((i) => i === "HIGH").length > data.impacts.length / 2
            ? "HIGH"
            : data.impacts.filter((i) => i === "MEDIUM").length > data.impacts.length / 3
              ? "MEDIUM"
              : "LOW") as "HIGH" | "MEDIUM" | "LOW"
        : ("MEDIUM" as const);

    const avgTime =
      data.times.length > 0
        ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
        : 30;

    return {
      issue,
      mentionedBy: data.count,
      avgImpact,
      avgTimeEstimate: avgTime,
      variations: [], // Could store original wordings
    };
  });

  // 4. Collect Strengths and Risks
  const strengths = completeReviews
    .map((r) => r.strongestElement)
    .filter((s): s is string => !!s && s.length > 10);

  const risks = completeReviews
    .map((r) => r.biggestRisk)
    .filter((r): r is string => !!r && r.length > 10);

  const competitiveBenchmarks = completeReviews
    .map((r) => r.competitiveBenchmark)
    .filter((b): b is string => !!b && b.length > 10);

  // 5. Static Analysis (AI removed for now)
  const aiAnalysis = {
    summary: `${completeReviews.length} expert reviewers reached a ${consensus.replace("_", " ").toLowerCase()} consensus with a ${average}/100 readiness score.`,
    technicalInsights: topFixes.length > 0 ? `The most critical issue, mentioned by ${topFixes[0].mentionedBy} reviewers, is: ${topFixes[0].issue}` : "No specific technical patterns identified.",
    marketRecommendation: "Consider the competitive benchmarks and risks identified by reviewers when planning your release strategy.",
    estimatedWorkRequired: topFixes.length > 0 ? `Approximately ${topFixes.reduce((sum, f) => sum + f.avgTimeEstimate, 0)} minutes based on identified fixes` : "Minimal work required",
    prioritizedActionPlan: topFixes.slice(0, 3).map((f) => f.issue),
  };

  // 6. Compile individual reviews
  const compiledReviews = completeReviews.map((r) => ({
    reviewerId: r.ReviewerProfile?.id || "unknown",
    verdict: r.releaseVerdict || "N/A",
    readinessScore: r.releaseReadinessScore || 0,
    qualityLevel: "N/A", // Would need to add this field to schema
    topFix1: r.topFixRank1 || "",
    topFix2: r.topFixRank2 || "",
    topFix3: r.topFixRank3 || "",
    strongestElement: r.strongestElement || "",
    biggestRisk: r.biggestRisk || "",
    competitiveBenchmark: r.competitiveBenchmark || "",
  }));

  return {
    trackId,
    generatedAt: new Date(),
    verdict: {
      consensus,
      breakdown: verdictBreakdown,
      confidence,
    },
    readinessScore: {
      average,
      median: Math.round(median),
      range,
      distribution,
    },
    qualityLevel: {
      consensus: "ALMOST_THERE", // Would calculate from actual quality field
      breakdown: {},
    },
    topFixes,
    strengths,
    risks,
    competitiveBenchmarks,
    aiAnalysis,
    reviewCount: completeReviews.length,
    reviews: compiledReviews,
  };
}
