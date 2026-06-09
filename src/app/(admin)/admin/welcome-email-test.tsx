"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const TEST_EMAIL = "kris.engelhardt4@gmail.com";

export function WelcomeEmailTestCard() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome", to: TEST_EMAIL }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5 flex flex-col gap-3">
      <div>
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Email</div>
        <div className="mt-1 text-base font-bold text-[#f4f4ef]">Welcome Email</div>
        <div className="text-xs text-white/40 mt-0.5">Send test to {TEST_EMAIL}</div>
      </div>
      <button
        onClick={send}
        disabled={status === "sending" || status === "sent"}
        className="flex items-center justify-center gap-2 h-8 px-4 rounded-lg bg-[#6ee7ff] text-black text-xs font-bold hover:bg-white disabled:opacity-60 transition-colors w-fit"
      >
        {status === "sending" ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Sending…</>
        ) : status === "sent" ? (
          <><CheckCircle2 className="h-3 w-3" /> Sent!</>
        ) : status === "error" ? (
          <><AlertTriangle className="h-3 w-3" /> Failed — retry</>
        ) : (
          <><Send className="h-3 w-3" /> Send test</>
        )}
      </button>
    </div>
  );
}
