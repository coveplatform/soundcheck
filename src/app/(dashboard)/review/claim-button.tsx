"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

export function ClaimButton({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/reviewer/review/${data.reviewId}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

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
