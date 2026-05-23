"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Crown, Loader2 } from "lucide-react";
import { CREDIT_PACK_CREDITS } from "@/lib/pricing";

type Kind = "credits" | "pro";
type Status = "verifying" | "success" | "timeout";

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 12; // ~12s budget for Stripe webhook to land
const CLEANUP_DELAY_MS = 5000;

export function PurchaseSuccessBanner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [kind, setKind] = useState<Kind | null>(null);
  const [status, setStatus] = useState<Status>("verifying");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    const creditsAdded = searchParams.get("credits_added") === "1";
    const proSuccess = searchParams.get("success") === "true";
    if (!creditsAdded && !proSuccess) return;

    startedRef.current = true;
    const k: Kind = creditsAdded ? "credits" : "pro";
    setKind(k);
    setStatus("verifying");

    let cancelled = false;

    const clearFlags = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("credits_added");
      params.delete("credits_canceled");
      params.delete("success");
      params.delete("canceled");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const scheduleCleanup = () => {
      setTimeout(() => {
        if (cancelled) return;
        clearFlags();
        setKind(null);
        startedRef.current = false;
      }, CLEANUP_DELAY_MS);
    };

    const verify = async () => {
      // Snapshot the initial credit balance so we can detect the bump from
      // the webhook. If we already snapshot ≥ the expected new balance,
      // it means the webhook fired before we mounted — also a success.
      let initialCredits: number | null = null;
      let attempts = 0;

      while (!cancelled && attempts < MAX_POLL_ATTEMPTS) {
        try {
          const res = await fetch("/api/profile", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (k === "pro") {
              if (data.subscriptionStatus === "active") {
                if (cancelled) return;
                setStatus("success");
                router.refresh();
                scheduleCleanup();
                return;
              }
            } else {
              const credits = typeof data.reviewCredits === "number" ? data.reviewCredits : 0;
              if (initialCredits === null) {
                initialCredits = credits;
              } else if (credits > initialCredits) {
                if (cancelled) return;
                setStatus("success");
                router.refresh();
                scheduleCleanup();
                return;
              }
            }
          }
        } catch {
          // network blip — keep polling
        }
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      if (cancelled) return;
      // Timed out waiting for webhook — still acknowledge optimistically.
      setStatus("timeout");
      router.refresh();
      scheduleCleanup();
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [searchParams, pathname, router]);

  if (!kind) return null;

  const isCredits = kind === "credits";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] pointer-events-none">
      <div
        className="bg-black border-2 border-black rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 pointer-events-auto"
        role="status"
        aria-live="polite"
      >
        {status === "verifying" ? (
          <Loader2 className="h-5 w-5 text-white animate-spin flex-shrink-0" />
        ) : (
          <div className="bg-lime-400 rounded-full p-1 flex-shrink-0">
            <Check className="h-4 w-4 text-black" strokeWidth={3} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isCredits ? (
            status === "verifying" ? (
              <p className="text-sm font-black text-white">Adding credits to your wallet…</p>
            ) : status === "success" ? (
              <p className="text-sm font-black text-white">
                {CREDIT_PACK_CREDITS} credits added to your wallet
              </p>
            ) : (
              <p className="text-sm font-black text-white">
                Credits incoming — may take a moment to appear
              </p>
            )
          ) : status === "verifying" ? (
            <p className="text-sm font-black text-white">Activating your Pro subscription…</p>
          ) : status === "success" ? (
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <p className="text-sm font-black text-white">Welcome to Pro</p>
            </div>
          ) : (
            <p className="text-sm font-black text-white">
              Pro activating — may take a moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
