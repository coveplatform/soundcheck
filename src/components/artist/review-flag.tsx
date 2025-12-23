"use client";

import { useState } from "react";
import { Flag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Flag className="h-3.5 w-3.5 text-neutral-500" />
        <div className="relative">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSaving}
            className="text-xs border-2 border-black pl-2 pr-6 py-1 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
          >
            <option value="low_effort">Low effort</option>
            <option value="spam">Spam</option>
            <option value="offensive">Offensive</option>
            <option value="irrelevant">Irrelevant</option>
          </select>
          <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
        </div>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={isSaving}
        className={cn(
          "text-xs px-2.5 py-1 font-bold border-2 border-black transition-colors",
          "bg-red-500 text-white hover:bg-red-600",
          isSaving && "opacity-60 cursor-not-allowed"
        )}
      >
        {isSaving ? "..." : "Flag"}
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="text-xs text-neutral-500 hover:text-neutral-700"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
