"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Post-cutover (2026-06-09): the new product lives at "/" and "/dashboard".
// Show the banner ONLY on the surviving MixReflect Classic surfaces, pointing
// users over to the new site. Everything not in this list (the new product, the
// blog, legal, discover, etc.) renders no banner.
const CLASSIC_PREFIXES = [
  "/classic",
  "/tracks",
  "/submit",
  "/review",
  "/reviewers",
  "/pro",
  "/account",
  "/onboarding",
  "/breakthrough",
];

export function ChangeoverBanner() {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evaluate client-side only — usePathname isn't reliable in the root layout
  // during SSR.
  if (!mounted) return null;
  const onClassic = CLASSIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!onClassic) return null;

  return (
    <Link
      href="/"
      className="block bg-[#0a0a0a] text-white hover:bg-[#141414] transition-colors border-b border-[#6ee7ff]/30"
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2.5 text-center text-[13px] flex-wrap">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee7ff] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6ee7ff]" />
        </span>
        <span>
          <strong className="text-[#6ee7ff]">You&apos;re on MixReflect Classic.</strong> The new
          MixReflect is live — instant scores and a room of real listeners. Classic is being phased
          out soon.
        </span>
        <span className="font-bold text-[#6ee7ff] underline underline-offset-2">
          switch to the new site →
        </span>
      </div>
    </Link>
  );
}
