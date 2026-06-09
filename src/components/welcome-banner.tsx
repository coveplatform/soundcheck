"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

// Show a "welcome to the new MixReflect" strip on the new product surfaces,
// pointing at the explainer (/the-new-mixreflect). Dismissible per browser.
const SHOW_PREFIXES = [
  "/",
  "/dashboard",
  "/report",
  "/submit-score",
  "/score-review",
  "/reviewer",
];

const STORAGE_KEY = "mr-welcome-dismissed";

export function WelcomeBanner() {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* no-op */
    }
  }, []);

  if (!mounted || dismissed) return null;

  // Don't show on the explainer itself.
  if (pathname === "/the-new-mixreflect") return null;

  const onNewProduct = SHOW_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!onNewProduct) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* no-op */
    }
  };

  return (
    <div className="relative bg-[#6ee7ff] text-black">
      <Link
        href="/the-new-mixreflect"
        className="block hover:bg-white transition-colors"
      >
        <div className="max-w-6xl mx-auto px-4 py-2.5 pr-10 flex items-center justify-center gap-2.5 text-center text-[13px] flex-wrap">
          <span aria-hidden>👋</span>
          <span>
            <strong>Welcome to the new MixReflect.</strong> Instant AI scores and a room of real
            listeners — see how it works.
          </span>
          <span className="font-bold underline underline-offset-2">how it works →</span>
        </div>
      </Link>
      <button
        onClick={dismiss}
        aria-label="dismiss"
        className="absolute top-1/2 -translate-y-1/2 right-3 text-black/50 hover:text-black transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
