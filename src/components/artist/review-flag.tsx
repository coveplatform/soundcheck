"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

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
    } catch {
      setError("Failed to flag review");
    } finally {
      setIsSaving(false);
    }
  }

  if (flagged) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Flag className="h-4 w-4 text-red-500" />
        <span>
          Flagged{reason ? `: ${reason}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-neutral-400" />
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSaving}
          className="text-xs border border-neutral-200 rounded-md px-2 py-1 bg-white"
        >
          <option value="low_effort">Low effort</option>
          <option value="spam">Spam</option>
          <option value="offensive">Offensive</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={isSaving}
        className="text-xs px-2 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-60"
      >
        {isSaving ? "Flagging..." : "Flag"}
      </button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
