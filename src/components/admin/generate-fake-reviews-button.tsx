"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function GenerateFakeReviewsButton({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/generate-fake-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate reviews");
      }

      setSuccess(`Generated ${data.count || count} reviews successfully!`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reviews");
    } finally {
      setIsGenerating(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          Generate {count} demo reviews for this track?
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
          >
            {isGenerating ? "Generating..." : "Yes, generate"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="20"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          className="w-20 h-9 px-3 border border-neutral-200 rounded-md text-sm"
          disabled={isGenerating}
        />
        <Button
          size="sm"
          onClick={() => setShowConfirm(true)}
          disabled={isGenerating}
        >
          Generate Reviews
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
