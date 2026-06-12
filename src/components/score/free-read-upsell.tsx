"use client";

import { useState } from "react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ArrowRight, Check, Loader2, Lock, X } from "lucide-react";
import { scoreConversions } from "@/lib/score-conversions";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

/**
 * Shown right after a submit by an email that has already used its lifetime
 * free read: the track IS generating, but its report will land sealed —
 * the $6.95 unlock (on the report itself) or unlimited opens it. This sets
 * that expectation at the moment of submission and offers the subscription
 * as the skip-the-seal path. Every exit continues to the report.
 */
export function FreeReadUpsell({
  continueHref,
  onContinue,
  email,
}: {
  /** The just-submitted report (pending/sealed) the user proceeds to. */
  continueHref: string;
  /** Called for X / backdrop / "continue" — navigate to continueHref. */
  onContinue: () => void;
  /** The submit form's email, for surfaces where the user isn't signed in —
      lets checkout open directly instead of bouncing through login. */
  email?: string;
}) {
  const [busy, setBusy] = useState(false);

  const goUnlimited = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/score/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Land back on the fresh report after checkout — the webhook will have
        // auto-unlocked it for the new subscriber by then (and the report
        // page's ?subscribed=1 poll covers the race).
        body: JSON.stringify({
          returnTo: continueHref,
          plan: "monthly",
          ...(email?.trim() ? { email: email.trim() } : {}),
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.alreadySubscribed) return onContinue();
      if (json?.url) {
        scoreConversions.startSubscribeCheckout("monthly");
        window.location.href = json.url;
        return;
      }
      // not signed in / no email on file → sign in, then back to the report
      window.location.href = `/login?callbackUrl=${encodeURIComponent(continueHref)}`;
    } catch {
      setBusy(false);
    }
  };

  return (
    <div
      className={`${jakarta.className} fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/85 backdrop-blur-md lowercase`}
      onClick={onContinue}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md border-2 bg-[#0c0c0c] p-7 sm:p-8"
        style={{ borderColor: "rgba(110,231,255,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onContinue}
          aria-label="continue to my report"
          className="absolute top-4 right-4 text-white/45 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <p className={`${mono.className} text-[12px] text-white/55 mb-3`}>
          [ we&apos;re on it — your track is being read ]
        </p>
        <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight mb-3">
          heads up: this one lands <span style={{ color: ACCENT }}>sealed</span>.
        </h2>
        <p className="text-white/70 text-[14.5px] normal-case leading-relaxed mb-6">
          Your first full report was free — this one arrives with the score and read
          sealed. Open just this track for <strong className="text-white">$6.95</strong>{" "}
          (includes the room of 5 real people), or go unlimited and never see a seal
          again.
        </p>

        <ul className={`${mono.className} text-[13px] text-white/70 normal-case space-y-2.5 mb-7`}>
          <li className="flex gap-2.5">
            <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span>unlimited: full reports on <strong className="text-white">every track</strong>, instantly</span>
          </li>
          <li className="flex gap-2.5">
            <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span>the room — <strong className="text-white">5 real people</strong> on 3 tracks a month</span>
          </li>
          <li className="flex gap-2.5">
            <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span>cancel anytime</span>
          </li>
        </ul>

        <button
          onClick={goUnlimited}
          disabled={busy}
          className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> opening checkout…
            </>
          ) : (
            <>
              go unlimited — $19.95/mo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <button
          onClick={onContinue}
          className={`${mono.className} group w-full inline-flex items-center justify-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors mt-4`}
        >
          <Lock className="h-3.5 w-3.5" />
          continue to my sealed report — unlock there for $6.95
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className={`${mono.className} text-[11px] text-white/35 text-center normal-case mt-4`}>
          cancel anytime · secured by stripe
        </p>
      </div>
    </div>
  );
}
