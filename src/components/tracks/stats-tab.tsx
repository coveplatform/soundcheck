import { AggregateAnalytics } from "@/components/feedback/aggregate-analytics";

interface Review {
  productionScore: number | null;
  originalityScore: number | null;
  vocalScore: number | null;
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST" | null;
  similarArtists: string | null;
  countsTowardAnalytics: boolean;
  lowEndClarity: string | null;
  vocalClarity: string | null;
  highEndQuality: string | null;
  stereoWidth: string | null;
  dynamics: string | null;
  tooRepetitive: boolean | null;
  trackLength: string | null;
}

interface StatsTabProps {
  reviews: Review[];
  platformAverages: {
    production: number;
    originality: number;
    vocals: number;
  };
}

export function StatsTab({ reviews, platformAverages }: StatsTabProps) {
  const analyticsReviews = reviews.filter(r => r.countsTowardAnalytics !== false);

  return (
    <AggregateAnalytics
      reviews={analyticsReviews}
      platformAverages={platformAverages}
    />
  );
}
