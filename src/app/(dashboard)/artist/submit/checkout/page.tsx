"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Gift } from "lucide-react";
import { funnels, track } from "@/lib/analytics";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get("trackId");
  const promoCode = searchParams.get("promo");
  const useFreeCredit = searchParams.get("useFreeCredit") === "true";
  const [error, setError] = useState("");

  const hasPromo = useMemo(() => Boolean(promoCode?.trim()), [promoCode]);
  const hasFreeCredit = useFreeCredit;

  useEffect(() => {
    async function createCheckout() {
      if (!trackId) {
        setError("No track specified");
        return;
      }

      try {
        const response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId,
            promoCode: promoCode || undefined,
            useFreeCredit: useFreeCredit || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (
            response.status === 403 &&
            typeof data?.error === "string" &&
            data.error.toLowerCase().includes("verify")
          ) {
            router.push("/verify-email");
            router.refresh();
            return;
          }
          const errorMsg = data.error || "Failed to create checkout session";
          setError(errorMsg);
          track("payment_error", { type: "checkout_creation", message: errorMsg });
          return;
        }

        // Track checkout started
        if (data.package && data.amount) {
          funnels.checkout.start(data.package, data.amount, trackId);
        }

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError("No checkout URL returned");
          track("payment_error", { type: "no_checkout_url", message: "No checkout URL returned" });
        }
      } catch {
        setError("Something went wrong");
        track("payment_error", { type: "network_error", message: "Something went wrong" });
      }
    }

    createCheckout();
  }, [trackId]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => router.push("/artist/submit")}
              className="mt-4 text-sm text-neutral-500 hover:text-neutral-900"
            >
              Back to submission
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasFreeCredit) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="h-8 w-8 mx-auto text-lime-600" />
            <p className="mt-4 text-neutral-600">Using your free review credit…</p>
            <p className="mt-2 text-sm text-neutral-500">
              Your track is being submitted for 1 free review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasPromo) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="h-8 w-8 mx-auto text-lime-600" />
            <p className="mt-4 text-neutral-600">Applying your promo code…</p>
            <p className="mt-2 text-sm text-neutral-500">
              You&apos;ll receive 1 free review for your track.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
          <p className="mt-4 text-neutral-600">Redirecting to secure checkout…</p>
          <p className="mt-2 text-sm text-neutral-500">Payments are processed by Stripe.</p>
        </CardContent>
      </Card>
    </div>
  );
}
