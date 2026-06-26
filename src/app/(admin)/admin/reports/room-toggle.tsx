"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin row action: hide a report from the review room (or restore it). */
export function RoomToggle({ id, skipped }: { id: string; skipped: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    if (busy) return;
    if (
      !skipped &&
      !window.confirm(
        "Hide this track from the review room? It leaves the reviewer queue, outstanding reviewers are removed, and no one else can review it. The owner's report is unaffected."
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports/${id}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: !skipped }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      // Surface the failure instead of silently doing nothing.
      const data = await res.json().catch(() => null);
      setError(
        res.status === 401
          ? "not an admin account"
          : data?.error || `failed (${res.status})`
      );
    } catch {
      setError("network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-50 whitespace-nowrap ${
          skipped
            ? "border-white/15 text-white/55 hover:bg-white/10"
            : "border-[#fbbf24]/40 text-[#fbbf24] hover:bg-[#fbbf24]/10"
        }`}
      >
        {busy ? "…" : skipped ? "unhide" : "hide from room"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
