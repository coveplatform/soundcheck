// Analytics helper functions for processing review data

interface Review {
  bestPart?: string | null;
  weakestPart?: string | null;
  productionScore?: number | null;
  vocalScore?: number | null;
  originalityScore?: number | null;
  createdAt: Date;
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

// Generate earnings data by month
export function generateEarningsData(
  tracks: Array<{
    createdAt: Date;
    earnings: number;
  }>
): Array<{ month: string; earnings: number; trackCount: number }> {
  const monthMap = new Map<string, { earnings: number; trackCount: number }>();

  tracks.forEach((track) => {
    if (track.earnings > 0) {
      const date = new Date(track.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { earnings: 0, trackCount: 0 });
      }

      const month = monthMap.get(monthKey)!;
      month.earnings += track.earnings;
      month.trackCount += 1;
    }
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [year, monthNum] = month.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      return {
        month: monthLabel,
        earnings: data.earnings,
        trackCount: data.trackCount,
      };
    });
}
