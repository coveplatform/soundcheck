import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp, Sparkles } from "lucide-react";

interface ReviewsTabProps {
  reviews: any[];
  isFreeTier?: boolean;
  trackId: string;
}

export function ReviewsTab({ reviews, isFreeTier = false, trackId }: ReviewsTabProps) {
  const displayedReviews = isFreeTier ? reviews.slice(0, 1) : reviews;
  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      {/* Reviews Carousel */}
      <Card variant="soft" elevated className="overflow-hidden rounded-3xl">
        <CardHeader className="sr-only">
          <CardTitle>Reviews ({totalReviews})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ReviewCarousel reviews={displayedReviews} showControls={!isFreeTier} />
        </CardContent>
      </Card>

      {/* Pro upsell — detailed analytics */}
      {totalReviews >= 2 && (
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-white p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-black mb-1">
                Unlock detailed analytics
              </h4>
              <p className="text-xs text-black/60 leading-relaxed mb-3">
                See score trends over time, compare across tracks, and get actionable insights from your feedback.
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] text-black/40 mb-4">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Score breakdowns
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Trend analysis
                </span>
              </div>
              <Link href="/tracks">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.6)] hover:shadow-[3px_3px_0_rgba(0,0,0,0.6)] active:shadow-[1px_1px_0_rgba(0,0,0,0.6)] active:translate-x-[1px] active:translate-y-[1px] transition-all">
                  View Insights
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Free tier upgrade prompt */}
      {isFreeTier && totalReviews > 1 && (
        <Card variant="soft" elevated className="border border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-black mb-2">
                {totalReviews - 1} more {totalReviews - 1 === 1 ? 'review' : 'reviews'} waiting
              </h3>
              <p className="text-sm text-black/60 mb-4">
                You have {totalReviews} total reviews. Upgrade to see all feedback and unlock full analytics.
              </p>
              <Link href="/artist/submit">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                  Upgrade Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
