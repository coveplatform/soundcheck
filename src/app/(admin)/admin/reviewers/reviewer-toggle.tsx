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
          ? "text-xs font-medium px-3 py-1.5 rounded-md border border-[#ff6b6b]/40 text-[#ff6b6b] hover:bg-[#ff6b6b]/10 disabled:opacity-50"
          : "text-xs font-bold px-3 py-1.5 rounded-md bg-[#6ee7ff] text-black hover:bg-white disabled:opacity-50"
      }
    >
      {busy ? "…" : isReviewer ? "Remove" : "Add as reviewer"}
    </button>
  );
}
