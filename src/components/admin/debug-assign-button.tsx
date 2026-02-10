"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ReviewerDebug {
  email: string;
  tier: string;
  isEligible: boolean;
  reasons: string[];
}

interface DebugResult {
  Track: {
    id: string;
    status: string;
    Genre: string[];
    reviewsRequested: number;
  };
  eligibleCount: number;
  reviewerDebug: ReviewerDebug[];
  afterAssignment: {
    queueEntries: string[];
    Review: { reviewerId: string; status: string }[];
  };
}

export function DebugAssignButton({ trackId }: { trackId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DebugResult | null>(null);

  const debugAssign = async () => {
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to debug assignment");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to debug assignment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={debugAssign}
          isLoading={isLoading}
        >
          Debug Assignment
        </Button>
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </div>

      {result ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4 space-y-4 text-sm">
          <div>
            <div className="font-bold mb-2">Track Info</div>
            <div className="text-neutral-600">
              Status: {result.track.status} | Genres: {result.track.Genre.join(", ")} | Reviews requested: {result.track.reviewsRequested}
            </div>
          </div>

          <div>
            <div className="font-bold mb-2">Eligible Reviewers: {result.eligibleCount}</div>
            <div className="space-y-2">
              {result.reviewerDebug.map((r) => (
                <div
                  key={r.email}
                  className={`p-2 rounded border ${r.isEligible ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}
                >
                  <div className="font-medium">{r.email} ({r.tier})</div>
                  <div className="text-xs text-neutral-600">
                    {r.reasons.join(" | ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-bold mb-2">After Assignment Attempt</div>
            <div className="text-neutral-600">
              Queue: {result.afterAssignment.queueEntries.length > 0 ? result.afterAssignment.queueEntries.join(", ") : "empty"}
            </div>
            <div className="text-neutral-600">
              Reviews: {result.afterAssignment.Review.length > 0
                ? result.afterAssignment.Review.map(r => r.status).join(", ")
                : "none"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
