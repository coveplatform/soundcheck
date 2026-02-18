import Anthropic from "@anthropic-ai/sdk";

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

  // 5. AI Analysis
  const aiAnalysis = await generateAIAnalysis({
    verdictBreakdown,
    consensus,
    averageScore: average,
    topFixes,
    strengths,
    risks,
    competitiveBenchmarks,
    reviewCount: completeReviews.length,
  });

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

// Generate AI analysis using Claude
async function generateAIAnalysis(data: {
  verdictBreakdown: { RELEASE_NOW: number; FIX_FIRST: number; NEEDS_WORK: number };
  consensus: "RELEASE_NOW" | "FIX_FIRST" | "NEEDS_WORK";
  averageScore: number;
  topFixes: Array<{ issue: string; mentionedBy: number; avgImpact: string }>;
  strengths: string[];
  risks: string[];
  competitiveBenchmarks: string[];
  reviewCount: number;
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set, skipping AI analysis");
    return {
      summary: "AI analysis unavailable - API key not configured.",
      technicalInsights: "",
      marketRecommendation: "",
      estimatedWorkRequired: "Unable to estimate",
      prioritizedActionPlan: [],
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are analyzing feedback from ${data.reviewCount} expert music reviewers for a Release Decision report.

VERDICT BREAKDOWN:
- Release Now: ${data.verdictBreakdown.RELEASE_NOW} reviewers
- Fix First: ${data.verdictBreakdown.FIX_FIRST} reviewers
- Needs Work: ${data.verdictBreakdown.NEEDS_WORK} reviewers
- Consensus: ${data.consensus}
- Average Readiness Score: ${data.averageScore}/100

TOP FIXES IDENTIFIED:
${data.topFixes.map((f, i) => `${i + 1}. ${f.issue} (mentioned by ${f.mentionedBy}/${data.reviewCount} reviewers, impact: ${f.avgImpact})`).join("\n")}

STRENGTHS MENTIONED:
${data.strengths.slice(0, 5).join("\n- ")}

RISKS IDENTIFIED:
${data.risks.slice(0, 5).join("\n- ")}

COMPETITIVE BENCHMARKS:
${data.competitiveBenchmarks.slice(0, 3).join("\n- ")}

Please provide a concise, actionable analysis in JSON format:

{
  "summary": "2-3 sentence executive summary of the consensus and key takeaway",
  "technicalInsights": "Detailed analysis of the technical issues mentioned. What patterns emerge? What's the root cause?",
  "marketRecommendation": "Based on the benchmarks and risks, what's your market positioning advice?",
  "estimatedWorkRequired": "Realistic time estimate to address the top fixes (e.g., '4-8 hours of mixing work')",
  "prioritizedActionPlan": ["Action 1 (highest priority)", "Action 2", "Action 3"]
}

Be direct, specific, and actionable. Focus on what the artist should DO next.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (it might be wrapped in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    throw new Error("No valid JSON in AI response");
  } catch (error) {
    console.error("AI analysis error:", error);
    return {
      summary: `${data.reviewCount} expert reviewers reached a ${data.consensus.replace("_", " ").toLowerCase()} consensus with a ${data.averageScore}/100 readiness score.`,
      technicalInsights: data.topFixes.length > 0 ? `The most critical issue, mentioned by ${data.topFixes[0].mentionedBy} reviewers, is: ${data.topFixes[0].issue}` : "No specific technical patterns identified.",
      marketRecommendation: "Consider the competitive benchmarks and risks identified by reviewers when planning your release strategy.",
      estimatedWorkRequired: data.topFixes.length > 0 ? "Approximately 2-6 hours based on identified fixes" : "Minimal work required",
      prioritizedActionPlan: data.topFixes.slice(0, 3).map((f) => f.issue),
    };
  }
}
