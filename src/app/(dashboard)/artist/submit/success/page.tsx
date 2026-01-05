"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, ArrowRight, Gift } from "lucide-react";
import { track } from "@/lib/analytics";
import { trackTikTokEvent } from "@/components/providers";

type CheckoutStatusResponse = {
  status: "PENDING" | "COMPLETED" | "FAILED";
  trackId: string;
  trackTitle?: string | null;
  trackStatus?: string | null;
  paymentStatus?: string | null;
  amount?: number | null;
  packageType?: string | null;
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "pending" | "completed" | "failed" | "error">(
    sessionId ? "loading" : "error"
  );
  const [data, setData] = useState<CheckoutStatusResponse | null>(null);
  const [error, setError] = useState<string>(sessionId ? "" : "Missing checkout session.");

  const pollAttempts = useRef(0);
  const trackedCompletion = useRef(false);

  const isBypass = useMemo(() => Boolean(sessionId?.startsWith("bypass_")), [sessionId]);
  const isFreeCredit = useMemo(() => Boolean(sessionId?.startsWith("free_credit_")), [sessionId]);
  const isFreeFirstReview = useMemo(() => Boolean(sessionId?.startsWith("free_first_review_")), [sessionId]);
  const isFreeReview = isFreeCredit || isFreeFirstReview;

  // Track checkout completion
  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      if (!sessionId) return;

      try {
        const res = await fetch(
          `/api/payments/checkout-status?session_id=${encodeURIComponent(sessionId)}`
        );

        const body = (await res.json().catch(() => null)) as CheckoutStatusResponse | { error?: string } | null;

        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setError((body as any)?.error || "Failed to verify payment.");
          return;
        }

        const payload = body as CheckoutStatusResponse;
        setData(payload);

        if (payload.status === "COMPLETED") {
          setStatus("completed");

          if (!trackedCompletion.current) {
            trackedCompletion.current = true;
            track("checkout_completed", {
              package: payload.packageType || "unknown",
              price: payload.amount || 0,
              trackId: payload.trackId,
              bypassed: isBypass,
            });
            // TikTok conversion tracking (only for paid purchases, not free credits)
            if (payload.amount && payload.amount > 0) {
              trackTikTokEvent("CompletePayment", {
                content_type: "product",
                content_id: payload.packageType || "unknown",
                currency: "AUD",
                value: payload.amount / 100, // Convert cents to dollars
              });
            }
          }

          return;
        }

        if (payload.status === "FAILED") {
          setStatus("failed");
          setError("Payment was not completed.");
          return;
        }

        setStatus("pending");
        pollAttempts.current += 1;

        if (pollAttempts.current < 20) {
          setTimeout(fetchStatus, 2500);
        } else {
          setStatus("error");
          setError("We couldn't confirm your payment yet. Please refresh or contact support.");
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("Failed to verify payment.");
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [isBypass, sessionId]);

  if (!sessionId) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-neutral-600">Missing checkout session.</p>
        <div className="mt-4">
          <Link href="/artist/submit">
            <Button variant="outline">Back to submission</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading" || status === "pending") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader className="text-center pb-2">
            {isFreeReview ? (
              <>
                <div className="mx-auto w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6 text-lime-600" />
                </div>
                <CardTitle className="text-xl">
                  {isFreeFirstReview ? "Submitting your free review…" : "Using your free credit…"}
                </CardTitle>
              </>
            ) : (
              <CardTitle className="text-xl">Verifying payment…</CardTitle>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-neutral-500">
              This can take a few seconds. Don&apos;t close this tab.
            </p>
            <div className="bg-neutral-50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <Clock className="h-4 w-4" />
                <span>What happens next?</span>
              </div>
              <ol className="text-sm text-neutral-500 space-y-2 ml-6">
                {isFreeReview ? (
                  <>
                    <li>1. Your free review is being set up</li>
                    <li>2. Your track is queued for review</li>
                    <li>3. A genre-matched reviewer will listen and provide feedback</li>
                  </>
                ) : (
                  <>
                    <li>1. We confirm your payment with Stripe</li>
                    <li>2. Your track is queued to a genre-matched listener panel</li>
                    <li>3. Reviews start rolling in with structured notes + scores</li>
                  </>
                )}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "failed" || status === "error") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {isFreeReview ? "Something went wrong" : "Payment not confirmed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-neutral-500">
              {isFreeReview
                ? error || "We couldn't submit your free review. Please try again."
                : error || "We couldn't confirm your payment."}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Retry
              </Button>
              <Link href="/artist/submit" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to submission
                </Button>
              </Link>
              <Link href="/support" className="w-full">
                <Button variant="outline" className="w-full">
                  Contact support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardHeader className="text-center pb-2">
          {isFreeReview ? (
            <div className="mx-auto w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mb-4">
              <Gift className="h-6 w-6 text-lime-600" />
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          )}
          <CardTitle className="text-xl">
            {isFreeFirstReview ? "Your Free Review is Queued!" : isFreeCredit ? "Free Credit Applied!" : "Track Submitted!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isFreeReview ? (
            <p className="text-neutral-500">
              {isFreeFirstReview
                ? "Congrats! Your track is now queued for your free review from a genre-matched listener."
                : "Your free credit was applied successfully. Your track is now queued for 1 free review from a genre-matched listener."
              }
            </p>
          ) : (
            <p className="text-neutral-500">
              Your track is queued for a curated, genre-matched listener panel.
              You&apos;ll be notified as structured reviews come in.
            </p>
          )}

          <div className="bg-neutral-50 rounded-lg p-4 text-left">
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>What happens next?</span>
            </div>
            <ol className="text-sm text-neutral-500 space-y-2 ml-6">
              {isFreeReview ? (
                <>
                  <li>1. A reviewer is matched to your track based on genre</li>
                  <li>2. They&apos;ll listen and submit structured notes + scores</li>
                  <li>3. You&apos;ll be notified when the review is ready (usually &lt;12h)</li>
                  <li>4. View feedback on your dashboard</li>
                </>
              ) : (
                <>
                  <li>1. Reviewers are matched to your track</li>
                  <li>2. Each reviewer listens and submits structured notes + scores</li>
                  <li>3. You&apos;ll be notified as reviews come in</li>
                  <li>4. View all feedback on your dashboard</li>
                </>
              )}
            </ol>
          </div>

          {isFreeFirstReview && (
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 text-left">
              <p className="text-sm text-lime-800">
                <strong>Love your free review?</strong> Get more reviews on your next track to see patterns emerge and know exactly what to fix.
              </p>
            </div>
          )}

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
