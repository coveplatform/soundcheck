"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ManualFeatureButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!confirm("Feature this track as Track of the Day? It will replace the current winner.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/track-of-the-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action: "feature" }),
      });
      if (res.ok) {
        // Generate editor note for the newly featured track
        await fetch("/api/admin/track-of-the-day", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, action: "regenerate" }),
        });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-[10px] font-bold uppercase tracking-wider bg-white border-2 border-neutral-200 hover:border-black text-neutral-600 hover:text-black px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Feature"}
    </button>
  );
}
