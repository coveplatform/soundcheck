"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface DequeueButtonProps {
  trackId: string;
  trackTitle: string;
}

export function DequeueButton({ trackId, trackTitle }: DequeueButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDequeue = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tracks/${trackId}/dequeue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove from queue");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div
        className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm rounded-[inherit] flex flex-col items-center justify-center gap-2 p-3"
        onClick={(e) => e.preventDefault()}
      >
        <p className="text-xs font-bold text-white text-center leading-snug">
          Remove &ldquo;{trackTitle}&rdquo; from queue?
        </p>
        <p className="text-[10px] text-white/60 text-center">Credits for undelivered reviews will be refunded.</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleDequeue}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Removing…" : "Remove"}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleDequeue}
      className="absolute top-2 right-2 z-10 p-1 rounded-md bg-black/40 hover:bg-red-500 text-white/70 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
      title="Remove from queue"
    >
      <X className="h-3 w-3" />
    </button>
  );
}
