import { Prisma } from "@prisma/client";

// Artist Profile with all peer review fields
export type DashboardArtistProfile = Prisma.ArtistProfileGetPayload<{
  select: {
    id: true;
    artistName: true;
    reviewCredits: true;
    totalPeerReviews: true;
    peerReviewRating: true;
    peerGemCount: true;
    hasSeenCreditGuide: true;
    subscriptionStatus: true;
    Genre_ArtistReviewGenres: true;
    Track: {
      select: {
        id: true;
        title: true;
        artworkUrl: true;
        sourceUrl: true;
        status: true;
        reviewsRequested: true;
        reviewsCompleted: true;
        feedbackViewedAt: true;
        Genre: true;
        Review: {
          select: { status: true; createdAt: true };
        };
      };
    };
  };
}>;

// Minimal profile (fallback for older accounts without peer review fields)
export type MinimalArtistProfile = Prisma.ArtistProfileGetPayload<{
  select: {
    id: true;
    artistName: true;
    subscriptionStatus: true;
    Track: {
      select: {
        id: true;
        title: true;
        artworkUrl: true;
        sourceUrl: true;
        status: true;
        reviewsRequested: true;
        reviewsCompleted: true;
        feedbackViewedAt: true;
        Genre: true;
        Review: {
          select: { status: true; createdAt: true };
        };
      };
    };
  };
}>;

// Track with review info and genres
export type DashboardTrack = DashboardArtistProfile["Track"][number];

// Pending peer review with timestamp
export type PendingPeerReview = Prisma.ReviewGetPayload<{
  select: {
    id: true;
    createdAt: true;
    Track: {
      select: {
        title: true;
        artworkUrl: true;
        Genre: true;
        ArtistProfile: {
          select: { artistName: true };
        };
      };
    };
  };
}>;

// Status badge configuration
export interface StatusBadge {
  label: string;
  className: string;
}

// Track action configuration
export interface TrackAction {
  label: string;
  href: string;
}

// Stat card configuration (serializable for Server -> Client Component passing)
export interface DashboardStat {
  id: string;
  iconName: "music" | "headphones" | "star" | "sparkles";
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  href?: string;
  ariaLabel?: string;
  tooltip?: string;
  priority?: number;
}

// What's Next guidance
export interface WhatsNextGuidance {
  title: string;
  description: string;
  action: { label: string; href: string };
  priority: "high" | "medium" | "low";
}
