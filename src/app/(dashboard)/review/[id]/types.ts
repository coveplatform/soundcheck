export interface Review {
  id: string;
  status: string;
  createdAt?: string;
  paidAmount?: number;
  listenDuration?: number;
  firstImpression?: FirstImpression | null;
  productionScore?: number | null;
  vocalScore?: number | null;
  originalityScore?: number | null;
  wouldListenAgain?: boolean | null;
  perceivedGenre?: string | null;
  similarArtists?: string | null;
  bestPart?: string | null;
  weakestPart?: string | null;
  additionalNotes?: string | null;
  addressedArtistNote?: "YES" | "PARTIALLY" | "NO" | null;
  nextActions?: string | null;
  timestamps?: Array<{ seconds: number; note: string }> | null;
  Track: {
    id: string;
    title: string;
    sourceUrl: string;
    sourceType: string;
    packageType: string;
    feedbackFocus: string | null;
    feedbackAreas: string[];
    artworkUrl?: string | null;
    Genre: { id: string; name: string }[];
    allowPurchase: boolean;
    isAbTest?: boolean;
    // Present when this review is for the primary track (Track A) of an AB pair
    other_Track?: {
      id: string;
      title: string;
      sourceUrl: string;
      sourceType: string;
      artworkUrl?: string | null;
    } | null;
    ArtistProfile?: {
      artistName: string;
      experienceLevel?: string | null;
    };
  };
  // ID of this reviewer's linked review for Track B (populated by GET /api/reviews/[id])
  linkedReviewId?: string | null;
  ReviewerProfile: {
    tier: string;
  } | null;
  isPeerReview?: boolean;
  peerReviewerArtistId?: string | null;
  skipListenTimer?: boolean;
  ArtistProfile?: {
    totalPeerReviews?: number;
    peerReviewRating?: number | null;
  } | null;
}

export type FirstImpression = "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";

export interface TimestampNote {
  id: string;
  seconds: number;
  note: string;
}

export interface ValidationIssue {
  id: string;
  message: string;
  section: string;
}

export interface ReviewFormState {
  listenTime: number;
  canSubmit: boolean;
  firstImpression: FirstImpression | null;
  firstImpressionScore: number;
  firstImpressionTouched: boolean;
  productionScore: number;
  vocalScore: number;
  originalityScore: number;
  wouldListenAgain: boolean | null;
  wouldAddToPlaylist: boolean | null;
  wouldShare: boolean | null;
  wouldFollow: boolean | null;
  perceivedGenre: string;
  similarArtists: string;
  bestPart: string;
  weakestPart: string;
  additionalNotes: string;
  nextActions: string;
  timestampNotes: TimestampNote[];
  playerSeconds: number;
}

export const MIN_LISTEN_SECONDS = 180;
