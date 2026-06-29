"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Pencil } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

/**
 * Per-card controls. A PAID report can't be deleted (its unlock + room live on
 * the row) — it offers "change link" (PATCH) instead, the non-destructive way to
 * fix a wrong link. An unpaid report keeps the delete affordance.
 */
export function DeleteReportButton({
  reportId,
  paid = false,
}: {
  reportId: string;
  paid?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "confirmDelete" | "editLink">(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const del = async (e: React.MouseEvent) => {
    stop(e);
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/score/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body?.error || "Couldn't delete this report.");
    } catch {
      setError("Couldn't delete this report.");
    }
    setBusy(false);
  };

  const saveLink = async (e: React.MouseEvent) => {
    stop(e);
    if (busy) return;
    const trackUrl = url.trim();
    if (!trackUrl) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/score/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrl }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body?.error || "Couldn't update the link.");
    } catch {
      setError("Couldn't update the link.");
    }
    setBusy(false);
  };

  if (mode === "editLink") {
    return (
      <div
        className={`${mono.className} absolute top-2 right-2 z-10 flex flex-col gap-1.5 bg-[#0d1014] border border-[#6ee7ff]/40 p-2 w-[230px]`}
        onClick={stop}
      >
        <span className="text-[11px] text-white/70 normal-case">paste the corrected link</span>
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://soundcloud.com/…"
          className="bg-black/40 border border-white/15 px-2 py-1 text-[12px] text-white outline-none focus:border-[#6ee7ff]/60"
        />
        {error && <span className="text-[10px] text-red-400 normal-case leading-snug">{error}</span>}
        <div className="flex items-center gap-2">
          <button
            onClick={saveLink}
            disabled={busy || !url.trim()}
            className="text-[11px] font-bold text-[#6ee7ff] hover:text-white disabled:opacity-50 inline-flex items-center gap-1"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            re-analyze
          </button>
          <button
            onClick={(e) => { stop(e); setMode(null); setError(null); }}
            className="text-[11px] text-white/45 hover:text-white"
          >
            cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <div
        className={`${mono.className} absolute top-2 right-2 z-10 flex items-center gap-2 bg-[#140d0d] border border-red-500/40 px-2.5 py-1.5`}
        onClick={stop}
      >
        <span className="text-[11px] text-white/70 normal-case hidden sm:inline">
          {error || "delete + its reviews?"}
        </span>
        {!error && (
          <button
            onClick={del}
            disabled={busy}
            className="text-[11px] font-bold text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            yes
          </button>
        )}
        <button
          onClick={(e) => { stop(e); setMode(null); setError(null); }}
          className="text-[11px] text-white/45 hover:text-white"
        >
          {error ? "ok" : "no"}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
      <button
        onClick={(e) => { stop(e); setUrl(""); setError(null); setMode("editLink"); }}
        aria-label="change link"
        title="change the track link"
        className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-[#6ee7ff] hover:bg-white/5 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {!paid && (
        <button
          onClick={(e) => { stop(e); setError(null); setMode("confirmDelete"); }}
          aria-label="delete track"
          className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
