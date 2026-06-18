"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { scoreConversions } from "@/lib/score-conversions";
import { SealedPaywall } from "@/components/score/sealed-paywall";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

function FinishInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const trackUrl = params.get("u") || "";
  const trackTitle = params.get("t") || "";
  // New "start at click" flow: the report was already created (and is generating)
  // before login — we just claim it now that the user is authenticated.
  const slug = params.get("slug") || "";
  const claim = params.get("claim") || "";
  const started = useRef(false);
  const [error, setError] = useState("");
  // Free read already used → the hard pay-to-continue wall. `slug` = a row exists
  // (claim path, generated pre-auth); `track` = no row yet (legacy fresh submit).
  const [paywall, setPaywall] = useState<
    | { mode: "track"; url: string; title?: string }
    | { mode: "slug"; slug: string }
    | null
  >(null);

  useEffect(() => {
    if (status === "loading" || started.current) return;

    if (status === "unauthenticated") {
      const back = slug
        ? `/score/finish?slug=${encodeURIComponent(slug)}&claim=${encodeURIComponent(claim)}`
        : `/score/finish?u=${encodeURIComponent(trackUrl)}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(back)}`);
      return;
    }

    if (!slug && !trackUrl) {
      router.replace("/");
      return;
    }

    started.current = true;
    (async () => {
      try {
        // Preferred path: claim the pre-generated report (it built during auth).
        if (slug && claim) {
          const res = await fetch("/api/score/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, claim, claimToken: claim }),
          });
          const data = await res.json().catch(() => null);
          if (data?.slug) {
            scoreConversions.submitTrack(data.slug);
            if (data.freeReadUsed) {
              // Row exists (generated pre-auth) — wall by slug; unlock opens it.
              setPaywall({ mode: "slug", slug: data.slug });
              return;
            }
            router.replace(`/report/${data.slug}`);
            return;
          }
          setError(data?.error ?? "something broke. try again.");
          return;
        }

        // Legacy path: no pre-generated report, submit now.
        const res = await fetch("/api/score/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackUrl,
            trackTitle: trackTitle || undefined,
            email: session?.user?.email ?? undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        // Fresh-path wall: submit refused to generate (no row created).
        if (data?.sealed) {
          setPaywall({ mode: "track", url: trackUrl, title: trackTitle || undefined });
          return;
        }
        if (data?.slug) {
          scoreConversions.submitTrack(data.slug);
          if (data.freeReadUsed) {
            setPaywall({ mode: "slug", slug: data.slug });
            return;
          }
          router.replace(`/report/${data.slug}`);
          return;
        }
        setError(data?.error ?? "something broke. try again.");
      } catch {
        setError("something broke. try again.");
      }
    })();
  }, [status, trackUrl, trackTitle, slug, claim, session, router]);

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] flex items-center justify-center px-5 lowercase`}
    >
      {paywall && (
        <SealedPaywall
          {...(paywall.mode === "slug"
            ? { slug: paywall.slug }
            : { track: { url: paywall.url, title: paywall.title }, trackTitle: paywall.title })}
          email={session?.user?.email ?? undefined}
          dismissHref="/"
        />
      )}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 animate-pulse"
              style={{ background: ACCENT, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {error ? "hmm." : (
            <>
              pulling your <span style={{ color: ACCENT }}>verdict</span>…
            </>
          )}
        </h1>
        <p className={`${mono.className} text-[13px] text-white/45 mt-4 normal-case`}>
          {error || "your read is ready — opening your report"}
        </p>
        {error && (
          <button
            onClick={() => router.replace("/")}
            className="mt-6 inline-flex bg-[#6ee7ff] text-black font-extrabold text-sm px-6 py-3"
          >
            start over
          </button>
        )}
      </div>
    </div>
  );
}

export default function FinishPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#0a0a0a]" />}
    >
      <FinishInner />
    </Suspense>
  );
}
