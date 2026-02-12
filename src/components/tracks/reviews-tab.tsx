import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import Link from "next/link";
import { ArrowRight, BarChart3, TrendingUp } from "lucide-react";

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

      {/* Analytics hints */}
      {!isFreeTier && totalReviews >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stats tab hint */}
          <div className="flex items-center gap-3 rounded-xl border border-black/8 bg-white/60 px-4 py-3">
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-black">Score breakdown</p>
              <p className="text-[11px] text-black/40">Switch to the Stats tab for detailed analytics</p>
            </div>
          </div>

          {/* Portfolio cross-link */}
          <Link
            href="/tracks"
            className="flex items-center gap-3 rounded-xl border border-black/8 bg-white/60 px-4 py-3 group hover:bg-white/80 hover:border-black/12 transition-colors duration-150 ease-out"
          >
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-black">All-track analytics</p>
              <p className="text-[11px] text-black/40">See trends across your music</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-black/20 group-hover:text-black/40 flex-shrink-0 transition-colors" />
          </Link>
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
