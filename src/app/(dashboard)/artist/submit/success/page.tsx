"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  // In a real app, you'd verify the session with Stripe
  // For now, we just show success if there's a session_id
  const isVerified = Boolean(sessionId);

  // Track checkout completion
  useEffect(() => {
    if (isVerified && sessionId) {
      // Note: Actual package/price info would come from API verification
      // For now we track that checkout was successful
      track("checkout_completed", {
        package: "unknown",
        price: 0,
        trackId: sessionId,
      });
    }
  }, [isVerified, sessionId]);

  if (!isVerified) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p>Verifying payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Track Submitted!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-neutral-500">
            Your track is now in the review queue. Reviewers matching your
            genres will be notified.
          </p>

          <div className="bg-neutral-50 rounded-lg p-4 text-left">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>What happens next?</span>
            </div>
            <ol className="text-sm text-neutral-500 space-y-2 ml-6">
              <li>1. Reviewers are matched to your track</li>
              <li>2. Each reviewer listens and provides feedback</li>
              <li>3. You&apos;ll be notified as reviews come in</li>
              <li>4. View all feedback on your dashboard</li>
            </ol>
          </div>

          <div className="pt-2">
            <Link href="/artist/dashboard">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
