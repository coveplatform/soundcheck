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
 */
export function calculateDashboardStats(profile: {
  totalPeerReviews?: number;
  peerReviewRating?: number;
  peerGemCount?: number;
  tracks: DashboardTrack[];
  pendingPeerReviews?: PendingPeerReview[];
}): DashboardStat[] {
  const totalPeerReviews = profile.totalPeerReviews ?? 0;
  const peerReviewRating = profile.peerReviewRating ?? 0;
  const peerGemCount = profile.peerGemCount ?? 0;
  const totalTracks = profile.tracks.length;
  const pendingCount = profile.pendingPeerReviews?.length ?? 0;

  const isProTier = isPeerReviewerPro(totalPeerReviews, peerReviewRating);
  const reviewsToGo = Math.max(0, PRO_TIER_MIN_REVIEWS - totalPeerReviews);
  const proRate = `$${(TIER_RATES.PRO / 100).toFixed(2)}`;

  const reviewsTooltip = isProTier
    ? `PRO Reviewer — you earn 1 credit + ${proRate} cash per review`
    : reviewsToGo > 0
      ? `${reviewsToGo} more review${reviewsToGo !== 1 ? "s" : ""} to unlock PRO (${proRate}/review)`
      : `Maintain a ${PRO_TIER_MIN_RATING}+ rating to unlock PRO (${proRate}/review)`;

  const ratingTooltip = isProTier
    ? `PRO Reviewer — keep your rating above ${PRO_TIER_MIN_RATING} to stay PRO`
    : peerReviewRating >= PRO_TIER_MIN_RATING
      ? `On track for PRO! Complete ${PRO_TIER_MIN_REVIEWS} reviews to unlock ${proRate}/review`
      : `Reach ${PRO_TIER_MIN_RATING}+ with ${PRO_TIER_MIN_REVIEWS} reviews to earn ${proRate}/review`;

  const stats: DashboardStat[] = [
    {
      id: "tracks",
      iconName: "music",
      iconBg: "bg-neutral-100",
      iconColor: "text-neutral-600",
      value: totalTracks,
      label: "Tracks",
      href: "/tracks",
      ariaLabel: "View all your tracks",
      priority: totalTracks === 0 ? 10 : 5,
    },
    {
      id: "reviews-given",
      iconName: "headphones",
      iconBg: isProTier ? "bg-purple-100" : "bg-emerald-100",
      iconColor: isProTier ? "text-purple-700" : "text-emerald-700",
      value: totalPeerReviews,
      label: isProTier ? "Reviews (PRO)" : "Reviews Given",
      href: "/review/history",
      tooltip: reviewsTooltip,
      ariaLabel: "View your review history",
      priority: pendingCount > 0 ? 1 : 3,
    },
    {
      id: "rating",
      iconName: "star",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      value: peerReviewRating > 0 ? peerReviewRating.toFixed(1) : "—",
      label: "Avg Rating",
      tooltip: ratingTooltip,
      ariaLabel: `Your average review rating is ${
        peerReviewRating > 0 ? peerReviewRating.toFixed(1) : "not available"
      }`,
      priority: 4,
    },
    {
      id: "gems",
      iconName: "sparkles",
      iconBg: "bg-lime-100",
      iconColor: "text-lime-700",
      value: peerGemCount,
      label: "Gems",
      tooltip: "Gems received for outstanding reviews",
      ariaLabel: `You have earned ${peerGemCount} gems`,
      priority: 6,
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

  if (!isSubscribed && credits < 3) {
    return {
      title: "Running low on credits",
      description:
        "Upgrade to Pro for 40 credits per month or review more tracks.",
      action: { label: "Upgrade to Pro", href: "/account" },
      priority: "medium",
    };
  }

  // No urgent actions needed
  return null;
}
