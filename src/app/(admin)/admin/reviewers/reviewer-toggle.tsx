"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewerToggle({
  userId,
  isReviewer,
}: {
  userId: string;
  isReviewer: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviewers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isReviewer: !isReviewer }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        isReviewer
          ? "text-xs font-medium px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          : "text-xs font-medium px-3 py-1.5 rounded-md bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50"
      }
    >
      {busy ? "…" : isReviewer ? "Remove" : "Add as reviewer"}
    </button>
  );
}
