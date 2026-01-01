"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewRating({
  reviewId,
  initialRating,
}: {
  reviewId: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const displayRating = useMemo(() => hover ?? rating, [hover, rating]);

  async function submit(next: number) {
    setError("");
    setRating(next);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistRating: next }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save rating");
        setRating(initialRating);
      }
    } catch {
      setError("Failed to save rating");
      setRating(initialRating);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <span className="text-[10px] text-neutral-400 hidden sm:inline">Rate:</span>
      <div className="flex items-center flex-shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => submit(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            disabled={isSaving}
            title={`Rate ${n}/5`}
            className={cn(
              "p-0.5 transition-transform hover:scale-110 flex-shrink-0",
              isSaving && "opacity-60 cursor-not-allowed"
            )}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors flex-shrink-0",
                displayRating !== null && n <= displayRating
                  ? "text-amber-400 fill-amber-400"
                  : "text-neutral-200 hover:text-neutral-300"
              )}
            />
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-red-500">!</span>}
    </div>
  );
}
