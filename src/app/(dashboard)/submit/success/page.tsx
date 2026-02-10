import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Music, Star } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{ trackId?: string; reviews?: string }>;
}

export default async function SubmitSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const reviewCount = parseInt(params.Review || "0", 10);
  const hasReviews = reviewCount > 0;

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 pb-12">
      <div className="max-w-lg mx-auto">
        <Card variant="soft" elevated>
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900">
                Track Submitted!
              </h1>
              {hasReviews ? (
                <div className="mt-3 space-y-2">
                  <p className="text-neutral-600">
                    <span className="font-semibold text-purple-600">
                      {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                    </span>{" "}
                    requested &mdash; we&apos;re matching you with artists now.
                  </p>
                  <p className="text-sm text-neutral-500">
                    You can request more reviews anytime from your track page when you have credits.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-neutral-600">
                  Your track has been uploaded. You can request reviews any time
                  from your tracks page.
                </p>
              )}
            </div>

            {/* Timeline info */}
            {hasReviews && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                  <Star className="h-4 w-4 text-purple-600" />
                  What happens next
                </div>
                <ol className="space-y-2 text-sm text-neutral-600 ml-6 list-decimal">
                  <li>Reviewers are matched to your genres</li>
                  <li>Each reviewer listens and submits structured feedback</li>
                  <li>You&apos;ll be notified as reviews come in</li>
                  <li className="font-medium text-purple-700">Want more? You can request additional reviews anytime</li>
                </ol>
                <p className="mt-3 text-xs text-neutral-500">
                  Initial reviews typically arrive within 24&ndash;72 hours.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Link href="/tracks" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  <Music className="h-4 w-4 mr-2" />
                  View Tracks
                </Button>
              </Link>

              <Link href="/submit" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  Submit Another
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <Link href="/review" className="block">
                <Button variant="ghost" size="lg" className="w-full">
                  Earn More Credits
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
