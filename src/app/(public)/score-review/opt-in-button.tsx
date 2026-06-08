"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function OptInButton({ label = "start reviewing" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/score-review/opt-in", { method: "POST" });
      if (res.ok) {
        router.push("/score-review");
        router.refresh();
        return;
      }
    } catch {
      /* no-op */
    }
    setBusy(false);
  };

  return (
    <button
      onClick={join}
      disabled={busy}
      className="group inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors disabled:opacity-60"
    >
      {busy ? "setting you up…" : label}
      {!busy && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
    </button>
  );
}
