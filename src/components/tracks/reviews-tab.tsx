import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ReviewsTabProps {
  Review: any[];
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

      {/* Free tier upgrade prompt */}
      {isFreeTier && totalReviews > 1 && (
        <Card variant="soft" elevated className="border-2 border-purple-400">
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
