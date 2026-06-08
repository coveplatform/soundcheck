"use client";

import { useState } from "react";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function ManageSubButton() {
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/score/portal", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* no-op */
    }
    setBusy(false);
  };

  return (
    <button
      onClick={open}
      disabled={busy}
      className={`${mono.className} border px-4 py-3 hover:bg-white/5 transition-colors disabled:opacity-50`}
      style={{ borderColor: ACCENT }}
    >
      <span style={{ color: ACCENT }}>unlimited</span>
      <span className="text-white/45"> · active</span>
      <span className="text-white/30"> · manage →</span>
    </button>
  );
}
