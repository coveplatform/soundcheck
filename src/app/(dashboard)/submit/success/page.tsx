import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Music, Star, Zap } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{ trackId?: string; reviews?: string; pro?: string }>;
}

export default async function SubmitSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const reviewCount = parseInt(params.reviews || "0", 10);
  const hasReviews = reviewCount > 0;
  const isPro = params.pro === "1";

  return (
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12 pb-12">
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
                </ol>
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  {isPro ? (
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">Priority queue</span>
                      <span className="text-xs text-neutral-500">&mdash; expect first reviews within ~{Math.max(8, reviewCount * 8)} hours</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-neutral-500">
                        First reviews typically arrive within 1&ndash;3 days.
                      </p>
                      <Link href="/account" className="flex items-center gap-1.5 group">
                        <Zap className="h-3 w-3 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600 group-hover:text-purple-800 transition-colors">
                          Go Pro for priority queue &amp; faster turnaround
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
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
