"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

function FinishInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const trackUrl = params.get("u") || "";
  const trackTitle = params.get("t") || "";
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading" || started.current) return;

    if (status === "unauthenticated") {
      const back = `/score/finish?u=${encodeURIComponent(trackUrl)}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(back)}`);
      return;
    }

    if (!trackUrl) {
      router.replace("/score");
      return;
    }

    started.current = true;
    (async () => {
      try {
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
        if (data?.slug) {
          router.replace(`/report/${data.slug}`);
          return;
        }
        setError(data?.error ?? "something broke. try again.");
      } catch {
        setError("something broke. try again.");
      }
    })();
  }, [status, trackUrl, trackTitle, session, router]);

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] flex items-center justify-center px-5 lowercase`}
    >
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
            onClick={() => router.replace("/score")}
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
