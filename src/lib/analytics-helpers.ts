// Analytics helper functions for processing review data

interface Review {
  bestPart?: string | null;
  weakestPart?: string | null;
  productionScore?: number | null;
  vocalScore?: number | null;
  originalityScore?: number | null;
  createdAt: Date;
  // V2 fields
  qualityLevel?: string | null;
  nextFocus?: string | null;
  lowEndClarity?: string | null;
  vocalClarity?: string | null;
  highEndQuality?: string | null;
  dynamics?: string | null;
  trackLength?: string | null;
  playlistAction?: string | null;
  quickWin?: string | null;
  biggestWeaknessSpecific?: string | null;
}

// Stop words to filter out
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "up", "about", "into", "through", "is",
  "are", "was", "were", "been", "be", "have", "has", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "can",
  "very", "really", "just", "some", "more", "much", "this", "that",
  "it", "its", "your", "you", "i", "me", "my", "we", "they", "them",
]);

// Extract word frequencies from text
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

// Get top N words from an array of texts
export function getTopWords(
  texts: string[],
  limit: number = 10
): Array<{ word: string; count: number }> {
  const wordCounts = new Map<string, number>();

  texts.forEach((text) => {
    const words = extractWords(text);
    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

// Analyze feedback patterns
export function analyzeFeedbackPatterns(reviews: Review[]) {
  const praises = reviews
    .map((r) => r.bestPart)
    .filter((text): text is string => Boolean(text));

  const critiques = reviews
    .map((r) => r.weakestPart)
    .filter((text): text is string => Boolean(text));

  const commonPraise = getTopWords(praises, 10);
  const commonCritiques = getTopWords(critiques, 10);

  // Identify improving areas (scores trending up)
  const improvingAreas: string[] = [];
  if (reviews.length >= 6) {
    const recent = reviews.slice(0, Math.floor(reviews.length / 2));
    const older = reviews.slice(Math.floor(reviews.length / 2));

    const recentProd =
      recent.reduce((sum, r) => sum + (r.productionScore || 0), 0) / recent.length;
    const olderProd =
      older.reduce((sum, r) => sum + (r.productionScore || 0), 0) / older.length;

    const recentVocals =
      recent.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / recent.length;
    const olderVocals =
      older.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / older.length;

    const recentOrig =
      recent.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / recent.length;
    const olderOrig =
      older.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / older.length;

    if (recentProd - olderProd > 0.3) improvingAreas.push("Production quality");
    if (recentVocals - olderVocals > 0.3) improvingAreas.push("Vocal performance");
    if (recentOrig - olderOrig > 0.3) improvingAreas.push("Originality");
  }

  // Identify consistent strengths (always high scores)
  const consistentStrengths: string[] = [];
  if (reviews.length >= 3) {
    const avgProd =
      reviews.reduce((sum, r) => sum + (r.productionScore || 0), 0) / reviews.length;
    const avgVocals =
      reviews.reduce((sum, r) => sum + (r.vocalScore || 0), 0) / reviews.length;
    const avgOrig =
      reviews.reduce((sum, r) => sum + (r.originalityScore || 0), 0) / reviews.length;

    if (avgProd >= 4.0) consistentStrengths.push("Production");
    if (avgVocals >= 4.0) consistentStrengths.push("Vocals");
    if (avgOrig >= 4.0) consistentStrengths.push("Originality");
  }

  return {
    commonPraise,
    commonCritiques,
    improvingAreas,
    consistentStrengths,
  };
}

// Calculate review velocity metrics
export function calculateReviewVelocity(
  tracks: Array<{
    createdAt: Date;
    completedAt: Date | null;
    reviewsCompleted: number;
    title: string;
  }>
) {
  const completedTracks = tracks.filter((t) => t.completedAt);

  if (completedTracks.length === 0) {
    return {
      avgTimeToComplete: 0,
      fastestTrack: null,
      slowestTrack: null,
      reviewsPerWeek: 0,
    };
  }

  // Calculate time to complete for each track
  const completionTimes = completedTracks.map((t) => {
    const days =
      (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    return { title: t.title, days };
  });

  const avgTimeToComplete =
    completionTimes.reduce((sum, t) => sum + t.days, 0) / completionTimes.length;

  const fastest = completionTimes.reduce((min, t) => (t.days < min.days ? t : min));
  const slowest = completionTimes.reduce((max, t) => (t.days > max.days ? t : max));

  // Calculate reviews per week
  const oldestTrack = tracks.reduce((oldest, t) =>
    new Date(t.createdAt) < new Date(oldest.createdAt) ? t : oldest
  );
  const weeksSinceStart =
    (Date.now() - new Date(oldestTrack.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 7);
  const totalReviews = tracks.reduce((sum, t) => sum + t.reviewsCompleted, 0);
  const reviewsPerWeek = weeksSinceStart > 0 ? totalReviews / weeksSinceStart : 0;

  return {
    avgTimeToComplete,
    fastestTrack: fastest,
    slowestTrack: slowest,
    reviewsPerWeek,
  };
}

// V2 Analytics: Analyze quality level distribution
export function analyzeQualityLevels(reviews: Review[]) {
  const reviewsWithQuality = reviews.filter((r) => r.qualityLevel);

  if (reviewsWithQuality.length === 0) {
    return null;
  }

  const counts: Record<string, number> = {};
  reviewsWithQuality.forEach((r) => {
    const level = r.qualityLevel!;
    counts[level] = (counts[level] || 0) + 1;
  });

  const total = reviewsWithQuality.length;
  const distribution = Object.entries(counts).map(([level, count]) => ({
    level,
    count,
    percentage: Math.round((count / total) * 100),
  }));

  // Order by quality (best to worst)
  const order = ["PROFESSIONAL", "RELEASE_READY", "ALMOST_THERE", "DEMO_STAGE", "NOT_READY"];
  distribution.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));

  return {
    distribution,
    mostCommon: distribution.reduce((max, item) => item.count > max.count ? item : max),
    releaseReady: counts["PROFESSIONAL"] || 0 + counts["RELEASE_READY"] || 0,
  };
}

// V2 Analytics: Analyze common technical issues
export function analyzeTechnicalIssues(reviews: Review[]) {
  const issues: Record<string, number> = {};

  reviews.forEach((r) => {
    if (r.lowEndClarity && r.lowEndClarity !== "PERFECT") {
      issues["Low End"] = (issues["Low End"] || 0) + 1;
    }
    if (r.vocalClarity && !["CRYSTAL_CLEAR", "NOT_APPLICABLE"].includes(r.vocalClarity)) {
      issues["Vocals"] = (issues["Vocals"] || 0) + 1;
    }
    if (r.highEndQuality && r.highEndQuality !== "PERFECT") {
      issues["High End"] = (issues["High End"] || 0) + 1;
    }
    if (r.dynamics && r.dynamics === "TOO_COMPRESSED") {
      issues["Dynamics/Compression"] = (issues["Dynamics/Compression"] || 0) + 1;
    }
    if (r.trackLength && ["TOO_SHORT", "WAY_TOO_LONG"].includes(r.trackLength)) {
      issues["Track Length"] = (issues["Track Length"] || 0) + 1;
    }
  });

  return Object.entries(issues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({
      issue,
      count,
      percentage: Math.round((count / reviews.length) * 100),
    }));
}

// V2 Analytics: Analyze next focus recommendations
export function analyzeNextFocus(reviews: Review[]) {
  const reviewsWithFocus = reviews.filter((r) => r.nextFocus);

  if (reviewsWithFocus.length === 0) {
    return null;
  }

  const counts: Record<string, number> = {};
  reviewsWithFocus.forEach((r) => {
    const focus = r.nextFocus!;
    counts[focus] = (counts[focus] || 0) + 1;
  });

  const recommendations = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([focus, count]) => ({
      focus,
      count,
      percentage: Math.round((count / reviewsWithFocus.length) * 100),
    }));

  return {
    recommendations,
    topRecommendation: recommendations[0],
    readyToRelease: counts["READY_TO_RELEASE"] || 0,
  };
}

// V2 Analytics: Analyze playlist actions
export function analyzePlaylistActions(reviews: Review[]) {
  const reviewsWithAction = reviews.filter((r) => r.playlistAction);

  if (reviewsWithAction.length === 0) {
    return null;
  }

  const counts: Record<string, number> = {};
  reviewsWithAction.forEach((r) => {
    const action = r.playlistAction!;
    counts[action] = (counts[action] || 0) + 1;
  });

  const total = reviewsWithAction.length;

  return {
    addToLibrary: Math.round(((counts["ADD_TO_LIBRARY"] || 0) / total) * 100),
    letPlay: Math.round(((counts["LET_PLAY"] || 0) / total) * 100),
    skip: Math.round(((counts["SKIP"] || 0) / total) * 100),
    dislike: Math.round(((counts["DISLIKE"] || 0) / total) * 100),
    positiveRate: Math.round((((counts["ADD_TO_LIBRARY"] || 0) + (counts["LET_PLAY"] || 0)) / total) * 100),
  };
}

// V2 Analytics: Get most valuable feedback (quickWin for legacy reviews, biggestWeaknessSpecific for new)
export function getTopQuickWins(reviews: Review[], limit: number = 3) {
  const quickWins = reviews
    .map((r) => r.quickWin?.trim() || r.biggestWeaknessSpecific?.trim() || "")
    .filter((text) => text.length > 0);

  if (quickWins.length === 0) {
    return [];
  }

  // Get common words/phrases from quick wins to identify patterns
  const patterns = getTopWords(quickWins, limit * 2);

  // Return a subset of actual quick wins that contain these common patterns
  const topQuickWins: string[] = [];
  const usedPatterns = new Set<string>();

  patterns.forEach(({ word }) => {
    if (topQuickWins.length >= limit) return;

    const matchingWin = quickWins.find(
      (win) => win.toLowerCase().includes(word) && !usedPatterns.has(win)
    );

    if (matchingWin) {
      topQuickWins.push(matchingWin);
      usedPatterns.add(matchingWin);
    }
  });

  return topQuickWins;
}
