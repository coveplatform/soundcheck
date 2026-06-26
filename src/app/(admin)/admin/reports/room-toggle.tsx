"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin row action: hide a report from the review room (or restore it). */
export function RoomToggle({ id, skipped }: { id: string; skipped: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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
    try {
      const res = await fetch(`/api/admin/reports/${id}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: !skipped }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
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
  );
}
