"use client";

import { useState } from "react";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewGem({
  reviewId,
  initialIsGem,
  compact = false,
}: {
  reviewId: string;
  initialIsGem: boolean;
  compact?: boolean;
}) {
  const [isGem, setIsGem] = useState<boolean>(initialIsGem);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  async function toggle() {
    setError("");
    const next = !isGem;
    setIsGem(next);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/gem`, {
        method: next ? "POST" : "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to update gem");
        setIsGem(!next);
      }
    } catch {
      setError("Failed to update gem");
      setIsGem(!next);
    } finally {
      setIsSaving(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isSaving}
        title={isGem ? "Remove gem" : "Mark as gem"}
        className={cn(
          "p-1.5 transition-colors duration-150 ease-out motion-reduce:transition-none",
          isGem
            ? "text-amber-500"
            : "text-neutral-300 hover:text-amber-400",
          isSaving && "opacity-60 cursor-not-allowed"
        )}
      >
        <Gem className={cn("h-4 w-4", isGem && "fill-amber-500")} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={isSaving}
        title={isGem ? "Remove gem" : "Mark as gem"}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 border-2 border-black transition-colors",
          isGem
            ? "bg-amber-400 text-black"
            : "bg-white text-black hover:bg-neutral-100",
          isSaving && "opacity-60 cursor-not-allowed"
        )}
      >
        <Gem className={cn("h-3.5 w-3.5", isGem ? "text-black" : "text-neutral-600")} />
        <span>{isGem ? "Gem" : "Gem"}</span>
      </button>
      {error && <span className="text-xs text-red-500">!</span>}
    </div>
  );
}
