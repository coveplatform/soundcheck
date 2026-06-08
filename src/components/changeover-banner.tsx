"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Hide the banner on the new product + the news page itself.
const HIDE_PREFIXES = [
  "/score",
  "/submit-score",
  "/report",
  "/reports",
  "/score-review",
  "/reviewer",
  "/the-new-mixreflect",
  "/admin",
];

export function ChangeoverBanner() {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evaluate client-side only — usePathname isn't reliable in the root layout
  // during SSR, so we'd otherwise render the banner on the new product too.
  if (!mounted) return null;
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <Link
      href="/the-new-mixreflect"
      className="block bg-[#0a0a0a] text-white hover:bg-[#141414] transition-colors border-b border-[#6ee7ff]/30"
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2.5 text-center text-[13px] flex-wrap">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee7ff] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6ee7ff]" />
        </span>
        <span>
          <strong className="text-[#6ee7ff]">MixReflect is changing.</strong> A new way to get
          feedback is here — Classic is being phased out soon.
        </span>
        <span className="font-bold text-[#6ee7ff] underline underline-offset-2">
          see what&apos;s new →
        </span>
      </div>
    </Link>
  );
}
