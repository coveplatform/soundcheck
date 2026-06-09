"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const del = async (e: React.MouseEvent) => {
    stop(e);
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/score/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
    } catch {
      /* no-op */
    }
    setDeleting(false);
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div
        className={`${mono.className} absolute top-2 right-2 z-10 flex items-center gap-2 bg-[#140d0d] border border-red-500/40 px-2.5 py-1.5`}
        onClick={stop}
      >
        <span className="text-[11px] text-white/70 normal-case hidden sm:inline">
          delete + its reviews?
        </span>
        <button
          onClick={del}
          disabled={deleting}
          className="text-[11px] font-bold text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          yes
        </button>
        <button
          onClick={(e) => { stop(e); setConfirming(false); }}
          className="text-[11px] text-white/45 hover:text-white"
        >
          no
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { stop(e); setConfirming(true); }}
      aria-label="delete track"
      className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
