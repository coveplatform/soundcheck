"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get("trackId");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trackId) {
      setError("Missing track ID");
      return;
    }

    // Create checkout session and redirect
    fetch(`/api/tracks/${trackId}/checkout`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else {
          setError("Invalid response from server");
        }
      })
      .catch((err) => {
        setError("Failed to create checkout session");
        console.error(err);
      });
  }, [trackId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white border-2 border-black p-8 text-center">
            <div className="mb-4">
              <svg
                className="w-12 h-12 text-red-600 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Checkout Error</h1>
            <p className="text-neutral-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/submit")}
              className="w-full bg-black text-white font-semibold py-3 px-6 border-2 border-black hover:bg-white hover:text-black transition-colors"
            >
              Back to Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-black" />
        <h2 className="text-xl font-semibold mb-2">Setting up checkout...</h2>
        <p className="text-neutral-600">You'll be redirected to Stripe in a moment</p>
      </div>
    </div>
  );
}
