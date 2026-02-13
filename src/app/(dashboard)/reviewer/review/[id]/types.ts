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
    feedbackFocus: string | null;
    Genre: { id: string; name: string }[];
    allowPurchase: boolean;
    ArtistProfile?: {
      artistName: string;
    };
  };
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
export const MIN_WORDS_PER_SECTION = 30;
