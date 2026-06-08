"use client";

import { useState } from "react";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function PayoutButton({ canPayout }: { canPayout: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const request = async () => {
    if (!canPayout || state === "sending" || state === "done") return;
    setState("sending");
    try {
      const res = await fetch("/api/score-review/payout", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg(data?.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      setMsg("requested — we'll send it within a few days.");
      setState("done");
    } catch {
      setMsg("Failed to request. Try again.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className={`${mono.className} text-[12px]`} style={{ color: ACCENT }}>
        ✓ payout {msg}
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={request}
        disabled={!canPayout || state === "sending"}
        className="bg-[#6ee7ff] text-black font-extrabold text-[13px] px-5 py-2.5 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state === "sending"
          ? "requesting…"
          : canPayout
          ? "request payout"
          : "reach $10 to cash out"}
      </button>
      {state === "error" && (
        <p className={`${mono.className} text-[12px] text-red-400 mt-2`}>{msg}</p>
      )}
    </div>
  );
}
