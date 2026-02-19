import {
  DashboardTrack,
  DashboardStat,
  PendingPeerReview,
  WhatsNextGuidance,
} from "@/types/dashboard";
import { isPeerReviewerPro, PRO_TIER_MIN_REVIEWS, PRO_TIER_MIN_RATING, TIER_RATES } from "@/lib/queue";

/**
 * Calculate dashboard stats with priority ordering
 * Stats are ordered based on urgency and relevance to the user
 * MUSIC-FOCUSED: Shows artist's track performance, not reviewer metrics
 */
export function calculateDashboardStats(profile: {
  totalPeerReviews?: number;
  peerReviewRating?: number;
  peerGemCount?: number;
  tracks: DashboardTrack[];
  pendingPeerReviews?: PendingPeerReview[];
}): DashboardStat[] {
  const totalTracks = profile.tracks.length;

  // Calculate reviews received (feedback on artist's tracks)
  const totalReviewsReceived = profile.tracks.reduce((sum, track) => {
    return sum + track.Review.filter((r) => r.status === "COMPLETED").length;
  }, 0);

  // Calculate average track score across all completed reviews
  let avgTrackScore = 0;
  let totalScores = 0;
  let scoreCount = 0;

  profile.tracks.forEach((track) => {
    track.Review.filter((r) => r.status === "COMPLETED").forEach((review) => {
      // Assuming reviews have scores - we'll calculate average from production, vocal, originality
      // This is a simplified calculation - adjust based on your actual Review schema
      let reviewScore = 0;
      let reviewScoreCount = 0;

      if ((review as any).productionScore) {
        reviewScore += (review as any).productionScore;
        reviewScoreCount++;
      }
      if ((review as any).vocalScore) {
        reviewScore += (review as any).vocalScore;
        reviewScoreCount++;
      }
      if ((review as any).originalityScore) {
        reviewScore += (review as any).originalityScore;
        reviewScoreCount++;
      }

      if (reviewScoreCount > 0) {
        totalScores += reviewScore / reviewScoreCount;
        scoreCount++;
      }
    });
  });

  if (scoreCount > 0) {
    avgTrackScore = totalScores / scoreCount;
  }

  // Tracks with completed reviews
  const tracksWithFeedback = profile.tracks.filter(
    (t) => t.Review.some((r) => r.status === "COMPLETED")
  ).length;

  const stats: DashboardStat[] = [
    {
      id: "tracks-uploaded",
      iconName: "music",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-700",
      value: totalTracks,
      label: "Tracks Uploaded",
      href: "/tracks",
      ariaLabel: "View all your tracks",
      tooltip: totalTracks === 0
        ? "Upload your first track to get started"
        : `You have ${totalTracks} track${totalTracks === 1 ? "" : "s"} on MixReflect`,
      priority: 1,
    },
    {
      id: "reviews-received",
      iconName: "headphones",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      value: totalReviewsReceived,
      label: "Reviews Received",
      href: "/tracks",
      tooltip: totalReviewsReceived === 0
        ? "Submit a track to get feedback from peers"
        : `You've received ${totalReviewsReceived} review${totalReviewsReceived === 1 ? "" : "s"} on your music`,
      ariaLabel: `You have received ${totalReviewsReceived} reviews`,
      priority: 2,
    },
    {
      id: "avg-track-score",
      iconName: "star",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      value: avgTrackScore > 0 ? avgTrackScore.toFixed(1) : "—",
      label: "Avg Track Score",
      tooltip: avgTrackScore > 0
        ? `Your tracks score an average of ${avgTrackScore.toFixed(1)}/5 across all reviews`
        : "Submit tracks and get reviews to see your average score",
      ariaLabel: `Your average track score is ${
        avgTrackScore > 0 ? avgTrackScore.toFixed(1) : "not available"
      }`,
      priority: 3,
    },
    {
      id: "tracks-reviewed",
      iconName: "sparkles",
      iconBg: "bg-lime-100",
      iconColor: "text-lime-700",
      value: tracksWithFeedback,
      label: "Tracks Reviewed",
      tooltip: tracksWithFeedback === 0
        ? "Tracks that have received at least one review"
        : `${tracksWithFeedback} of your ${totalTracks} track${totalTracks === 1 ? " has" : "s have"} received feedback`,
      ariaLabel: `${tracksWithFeedback} of your tracks have received reviews`,
      priority: 4,
    },
  ];

  // Sort by priority (lower number = higher priority)
  return stats.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

/**
 * Determine personalized "What's Next" guidance based on user state
 * Returns the most relevant action for the user to take
 */
export function getWhatsNextGuidance(profile: {
  tracks: DashboardTrack[];
  reviewCredits?: number;
  subscriptionStatus?: string | null;
  pendingPeerReviews?: PendingPeerReview[];
  totalPeerReviews?: number;
}): WhatsNextGuidance | null {
  const credits = profile.reviewCredits ?? 0;
  const hasUploadedTracks = profile.tracks.some((t) => t.status === "UPLOADED");
  const hasPendingReviews = (profile.pendingPeerReviews?.length ?? 0) > 0;
  const hasNoTracks = profile.tracks.length === 0;
  const isSubscribed = profile.subscriptionStatus === "active";
  const needsCredits = credits === 0 && !isSubscribed;
  const totalReviews = profile.totalPeerReviews ?? 0;

  // Priority order: highest urgency first
  if (hasPendingReviews) {
    return {
      title: "You have tracks to review",
      description:
        "Complete your pending reviews to earn credits and help fellow artists.",
      action: { label: "Review tracks", href: "/review" },
      priority: "high",
    };
  }

  if (hasNoTracks) {
    return {
      title: "Submit your first track",
      description:
        "Get started by uploading a track and requesting feedback from peers.",
      action: { label: "Submit a track", href: "/submit" },
      priority: "high",
    };
  }

  if (hasUploadedTracks) {
    return {
      title: "Request reviews for your tracks",
      description: "You have uploaded tracks waiting to be reviewed.",
      action: { label: "Request reviews", href: "/tracks" },
      priority: "high",
    };
  }

  if (needsCredits && totalReviews === 0) {
    return {
      title: "Earn credits by reviewing",
      description:
        "Review other artists' tracks to earn credits for your own submissions.",
      action: { label: "Start reviewing", href: "/review" },
      priority: "medium",
    };
  }

  if (credits < 3) {
    return {
      title: "Running low on credits",
      description:
        "Review other artists' tracks to earn free credits.",
      action: { label: "Review to earn credits", href: "/review" },
      priority: "medium",
    };
  }

  // No urgent actions needed
  return null;
}
