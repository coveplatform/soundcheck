"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Lock } from "lucide-react";

interface ClaimButtonProps {
  trackId: string;
  reviewsRemaining: number | null;
  isPro: boolean;
}

export function ClaimButton({ trackId, reviewsRemaining, isPro }: ClaimButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReachedLimit = !isPro && reviewsRemaining !== null && reviewsRemaining <= 0;

  const handleClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to claim track");
        setLoading(false);
        return;
      }

      // Navigate to the review page
      router.push(`/review/${data.reviewId}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (hasReachedLimit) {
    return (
      <div className="flex-shrink-0 text-right">
        <Button
          size="sm"
          variant="outline"
          disabled
          className="opacity-50 cursor-not-allowed"
        >
          <Lock className="h-3 w-3 mr-1" />
          Limit Reached
        </Button>
        <Link
          href="/submit"
          className="block text-xs text-purple-600 hover:text-purple-700 font-semibold mt-1 hover:underline"
        >
          Get Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0">
      <Button
        size="sm"
        variant="primary"
        onClick={handleClaim}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Claiming...
          </>
        ) : (
          <>
            Review
            <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500 mt-1 max-w-[120px]">{error}</p>
      )}
    </div>
  );
}
