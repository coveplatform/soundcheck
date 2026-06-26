"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { scoreConversions } from "@/lib/score-conversions";
import { useAuthModal } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

type TrackInfo = { url: string; title?: string; genre?: string; notes?: string };

/**
 * The hard free-tier wall. Once an artist has used their lifetime free report,
 * track 2+ stops here BEFORE anything is generated — they've already seen a full
 * report, so there's nothing left to tease. Pay to continue, or leave.
 *
 * Two modes:
 *  • `track` — no report row exists yet (the common path: submit/landing). The
 *    buttons hit /api/score/sealed-checkout, which creates the report and builds
 *    the read only after payment.
 *  • `slug` — a report row already exists (the rarer pre-auth path, where /start
 *    generated before we knew the email). The buttons hit the report's own
 *    unlock / subscribe endpoints.
 *
 * Rendered as a full-screen overlay so it works both as a submit-time modal and
 * as the report page's standalone pay-gate.
 */
export function SealedPaywall({
  slug,
  track,
  email,
  dismissHref = "/",
  trackTitle,
}: {
  slug?: string;
  track?: TrackInfo;
  email?: string;
  /** Where "not now" goes. Defaults home. */
  dismissHref?: string;
  /** Optional title to show in the heading. */
  trackTitle?: string;
}) {
  const [busy, setBusy] = useState<"unlock" | "unlimited" | null>(null);
  const { open: openAuth } = useAuthModal();

  const go = async (choice: "unlock" | "unlimited") => {
    if (busy) return;
    setBusy(choice);
    try {
      let json: { url?: string; slug?: string; alreadyUnlocked?: boolean; alreadySubscribed?: boolean } | null =
        null;

      if (track) {
        // No row yet — create + pay in one call.
        const res = await fetch("/api/score/sealed-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: choice === "unlimited" ? "monthly" : "unlock",
            trackUrl: track.url,
            trackTitle: track.title,
            genre: track.genre,
            notes: track.notes,
          }),
        });
        json = await res.json().catch(() => null);
      } else if (slug) {
        // Row exists — use its own endpoints.
        if (choice === "unlock") {
          const res = await fetch(`/api/score/${slug}/unlock`, { method: "POST" });
          json = await res.json().catch(() => null);
        } else {
          const res = await fetch("/api/score/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              returnTo: `/report/${slug}`,
              plan: "monthly",
              ...(email?.trim() ? { email: email.trim() } : {}),
            }),
          });
          json = await res.json().catch(() => null);
        }
      }

      // Already paid/subscribed (e.g. a second tab finished checkout) — just
      // reload onto the now-unlocked report.
      if (json?.alreadyUnlocked || json?.alreadySubscribed) {
        if (slug) {
          window.location.href = `/report/${slug}`;
          return;
        }
        window.location.reload();
        return;
      }

      if (json?.url) {
        if (choice === "unlimited") scoreConversions.startSubscribeCheckout("monthly");
        else scoreConversions.startUnlockCheckout(json.slug ?? slug ?? "");
        window.location.href = json.url;
        return;
      }

      // Not signed in / no email on file → pop the auth panel in place, back to
      // here once they're in (then they pick a plan again).
      setBusy(null);
      openAuth("signup", slug ? `/report/${slug}` : "/submit-score");
    } catch {
      setBusy(null);
    }
  };

  return (
    <div
      className={`${jakarta.className} fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/90 backdrop-blur-md lowercase`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md border-2 bg-[#0c0c0c] p-7 sm:p-8"
        style={{ borderColor: "rgba(110,231,255,0.5)" }}
      >
        <div
          className="inline-flex items-center justify-center w-11 h-11 mb-5"
          style={{ background: ACCENT }}
        >
          <Lock className="h-5 w-5 text-black" />
        </div>

        <p className={`${mono.className} text-[12px] text-white/55 mb-3`}>
          [ you&apos;ve used your free report ]
        </p>
        <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight mb-3">
          unlock to score{" "}
          <span style={{ color: ACCENT }}>
            {trackTitle?.trim() ? `"${trackTitle.trim()}"` : "this track"}
          </span>
          .
        </h2>
        <p className="text-white/70 text-[14.5px] normal-case leading-relaxed mb-6">
          Your first full report was on us. To get this one — the score, the written
          read and the room of 5 real people — unlock just this track, or go
          unlimited and never hit this again.
        </p>

        <ul className={`${mono.className} text-[13px] text-white/70 normal-case space-y-2.5 mb-7`}>
          <li className="flex gap-2.5">
            <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span>the full score + written read on this track</span>
          </li>
          <li className="flex gap-2.5">
            <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span><strong className="text-white">5 real people</strong> listen and write back</span>
          </li>
          <li className="flex gap-2.5">
            <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span>nothing&apos;s charged until you choose below</span>
          </li>
        </ul>

        <button
          onClick={() => go("unlimited")}
          disabled={busy !== null}
          className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] py-3.5 hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          {busy === "unlimited" ? (
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
          onClick={() => go("unlock")}
          disabled={busy !== null}
          className="group w-full inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-bold text-[14px] py-3 mt-3 transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          {busy === "unlock" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> opening checkout…
            </>
          ) : (
            <>unlock just this track — $6.95</>
          )}
        </button>

        <Link
          href={dismissHref}
          className={`${mono.className} block text-center text-[12px] text-white/40 hover:text-white/70 transition-colors mt-5`}
        >
          not now
        </Link>
        <p className={`${mono.className} text-[11px] text-white/30 text-center normal-case mt-3`}>
          cancel anytime · secured by stripe
        </p>
      </div>
    </div>
  );
}
