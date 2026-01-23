"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function GenerateFakeReviewsButton({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(5);

  const handleGenerate = async () => {
    const confirmed = window.confirm(
      `Generate ${count} fake demo reviews for this track? This will create completed reviews from demo accounts.`
    );

    if (!confirmed) return;

    setError(null);
    setIsGenerating(true);

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

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reviews");
    } finally {
      setIsGenerating(false);
    }
  };

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
          onClick={handleGenerate}
          disabled={isGenerating}
          isLoading={isGenerating}
        >
          Generate Fake Reviews
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
