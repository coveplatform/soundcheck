"use client";

import { useState } from "react";
import { JetBrains_Mono } from "next/font/google";
import { ChevronDown, Star } from "lucide-react";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export type ReviewHistoryItem = {
  id: string;
  rating: number | null;
  headline: string | null;
  quote: string | null;
  positive: boolean | null;
  completedAt: Date | string | null;
  TrackScoreReport: { trackTitle: string | null; genre: string | null } | null;
};

function fmtDate(d: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ReviewHistory({ items }: { items: ReviewHistoryItem[] }) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="mt-10 border border-white/12 bg-[#0a0a0a]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-[#101010] transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-baseline gap-2.5">
          <span className="font-extrabold text-[15px]">past reviews</span>
          <span className={`${mono.className} text-[12px] text-white/40`}>
            {items.length} completed
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 text-white/50 transition-transform shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <ul className="border-t border-white/10 divide-y divide-white/[0.06]">
          {items.map((it) => (
            <li key={it.id} className="px-5 sm:px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-[15px] truncate normal-case">
                    {it.TrackScoreReport?.trackTitle || "untitled track"}
                  </p>
                  <p className={`${mono.className} text-[11px] text-white/40 mt-0.5`}>
                    {it.TrackScoreReport?.genre || "—"}
                    {it.completedAt ? ` · ${fmtDate(it.completedAt)}` : ""}
                  </p>
                </div>
                {it.rating != null && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5" style={{ color: ACCENT, fill: ACCENT }} />
                    <span className={`${mono.className} text-[12px] font-bold`}>{it.rating}</span>
                  </span>
                )}
              </div>
              {it.headline && (
                <p className="text-[13.5px] text-white/80 mt-2 normal-case leading-relaxed">
                  {it.headline}
                </p>
              )}
              {it.quote && (
                <p className="text-[13px] text-white/45 mt-1 normal-case leading-relaxed">
                  {it.quote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
