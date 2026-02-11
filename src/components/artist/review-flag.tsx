"use client";

import { useState } from "react";
import { Flag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

export function ReviewFlag({
  reviewId,
  wasFlagged,
  flagReason,
}: {
  reviewId: string;
  wasFlagged: boolean;
  flagReason: string | null;
}) {
  const [reason, setReason] = useState<string>(flagReason ?? "low_effort");
  const [flagged, setFlagged] = useState<boolean>(wasFlagged);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const reasonLabels: Record<string, string> = {
    low_effort: "Low effort",
    spam: "Spam",
    offensive: "Offensive",
    irrelevant: "Irrelevant",
  };

  async function submit() {
    setError("");
    setIsSaving(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to flag review");
        return;
      }

      track("artist_review_flagged", { reviewId, reason });
      setFlagged(true);
      setIsOpen(false);
    } catch {
      setError("Failed to flag review");
    } finally {
      setIsSaving(false);
    }
  }

  if (flagged) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600">
        <Flag className="h-3.5 w-3.5" />
        <span>Flagged as {reasonLabels[reason] || reason}</span>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Report issue</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
      <Flag className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
      <div className="relative">
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSaving}
          className="text-xs font-medium border border-neutral-200 rounded-lg pl-2 pr-6 py-1.5 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
        >
          <option value="low_effort">Low effort</option>
          <option value="spam">Spam</option>
          <option value="offensive">Offensive</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
        <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={isSaving}
        className={cn(
          "text-xs px-3 py-1.5 font-semibold rounded-lg transition-colors duration-150 ease-out",
          "bg-red-500 text-white hover:bg-red-600",
          isSaving && "opacity-60 cursor-not-allowed"
        )}
      >
        {isSaving ? "..." : "Report"}
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
