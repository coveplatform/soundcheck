"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle, Loader2, AlertCircle, Music, Bell, Star, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackTikTokEvent, redditEvents } from "@/components/providers";

type CheckoutStatusResponse = {
  status: "PENDING" | "COMPLETED" | "FAILED";
  trackId: string;
  trackTitle?: string | null;
  trackStatus?: string | null;
  paymentStatus?: string | null;
  amount?: number | null;
  packageType?: string | null;
};

const NEXT_STEPS = [
  {
    icon: <Music className="h-4 w-4 text-purple-600" />,
    title: "Reviewers are being matched",
    desc: "We match your track to reviewers in your genre right away.",
  },
  {
    icon: <Star className="h-4 w-4 text-purple-600" />,
    title: "Each reviewer listens & gives structured notes",
    desc: "Ratings, free-text feedback, and timestamp annotations.",
  },
  {
    icon: <Bell className="h-4 w-4 text-purple-600" />,
    title: "You get notified as reviews come in",
    desc: "We'll email you at 50% and 100% completion.",
  },
  {
    icon: <BarChart2 className="h-4 w-4 text-purple-600" />,
    title: "Read everything on your dashboard",
    desc: "Scores, listener intent data, and your release readiness verdict.",
  },
];

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const trackIdParam = searchParams.get("trackId");
  const isCreditBased = !sessionId && !!trackIdParam;
  const [status, setStatus] = useState<"loading" | "pending" | "completed" | "failed" | "error">(
    sessionId ? "loading" : isCreditBased ? "completed" : "error"
  );
  const [data, setData] = useState<CheckoutStatusResponse | null>(null);
  const [error, setError] = useState<string>(sessionId || isCreditBased ? "" : "Missing checkout session.");

  const pollAttempts = useRef(0);
  const trackedCompletion = useRef(false);
  const isBypass = useMemo(() => Boolean(sessionId?.startsWith("bypass_")), [sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      if (!sessionId) return;

      try {
        const res = await fetch(
          `/api/payments/checkout-status?session_id=${encodeURIComponent(sessionId)}`
        );

        const body = (await res.json().catch(() => null)) as CheckoutStatusResponse | { error?: string } | null;
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setError((body as any)?.error || "Failed to verify payment.");
          return;
        }

        const payload = body as CheckoutStatusResponse;
        setData(payload);

        if (payload.status === "COMPLETED") {
          setStatus("completed");

          if (!trackedCompletion.current) {
            trackedCompletion.current = true;
            if (payload.amount && payload.amount > 0) {
              trackTikTokEvent("CompletePayment", {
                content_type: "product",
                content_id: payload.packageType || "unknown",
                currency: "USD",
                value: payload.amount / 100,
              });
              redditEvents.purchase(
                payload.packageType || "unknown",
                payload.amount,
                payload.trackId
              );
            }
          }
          return;
        }

        if (payload.status === "FAILED") {
          setStatus("failed");
          setError("Payment was not completed.");
          return;
        }

        setStatus("pending");
        pollAttempts.current += 1;

        if (pollAttempts.current < 20) {
          setTimeout(fetchStatus, 2500);
        } else {
          setStatus("error");
          setError("We couldn't confirm your payment yet. Please refresh or contact support.");
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("Failed to verify payment.");
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [isBypass, sessionId]);

  // ── Error: no session ──────────────────────────────────────────────
  if (!sessionId && !isCreditBased) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border-2 border-black/8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)] p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-black">Something went wrong</h1>
          <p className="text-sm text-black/50">Missing checkout session.</p>
          <Link href="/submit">
            <Button variant="outline" className="border-2 border-black font-bold w-full">
              Back to submission
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading / Polling ──────────────────────────────────────────────
  if (status === "loading" || status === "pending") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-white rounded-2xl border-2 border-black/8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)] p-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-black/30 animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-black">Confirming payment…</h1>
            <p className="text-sm text-black/50">Just a moment — don't close this tab.</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-black/8 p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">What happens next</p>
            {NEXT_STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-black text-purple-600">{i + 1}</span>
                <p className="text-sm text-black/60">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Failed / Error ─────────────────────────────────────────────────
  if (status === "failed" || status === "error") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-200 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.08)] p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-black">Payment not confirmed</h1>
            <p className="text-sm text-black/50 mt-2">{error || "We couldn't confirm your payment."}</p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white hover:bg-neutral-800 border-2 border-black font-black h-11"
            >
              Try again
            </Button>
            <Link href="/submit" className="w-full">
              <Button variant="outline" className="w-full border-2 border-black font-bold h-11">
                Back to submission
              </Button>
            </Link>
            <Link href="mailto:support@mixreflect.com" className="text-xs text-black/40 hover:text-black/70 transition-colors mt-1">
              Need help? support@mixreflect.com
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Hero success card */}
        <div className="bg-lime-400 rounded-2xl border-2 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mx-auto h-16 w-16 rounded-full bg-black flex items-center justify-center mb-5">
            <CheckCircle className="h-8 w-8 text-lime-400" />
          </div>
          <h1 className="text-3xl font-black text-black mb-2">Track submitted!</h1>
          {data?.trackTitle && (
            <p className="text-sm font-bold text-black/60 mb-1">&ldquo;{data.trackTitle}&rdquo;</p>
          )}
          <p className="text-sm font-medium text-black/60 leading-relaxed">
            You're in the queue. Genre-matched reviewers are being assigned now.
          </p>
        </div>

        {/* What's next */}
        <div className="bg-white rounded-2xl border-2 border-black/8 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.04)] p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-5">What happens next</p>
          <ol className="space-y-4">
            {NEXT_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[11px] font-black text-purple-700">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-black leading-snug">{step.title}</p>
                  <p className="text-xs text-black/45 mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/classic/dashboard" className="flex-1">
            <Button className="w-full bg-black text-white hover:bg-neutral-800 border-2 border-black font-black h-12 text-sm">
              Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/review" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-2 border-black font-black h-12 text-sm hover:bg-black hover:text-white transition-colors"
            >
              Review a track → earn credits
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
