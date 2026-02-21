"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function CreditGuide() {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await fetch("/api/welcome-seen", { method: "POST" });
      router.refresh();
    } catch {
      // Already hidden client-side, no need to handle
    }
  };

  return (
    <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
            Quick guide
          </p>
          <p className="text-lg font-bold text-black mt-2">
            How credits work
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-600 flex-shrink-0" />
              <span>Spend credits to get reviews on your tracks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-600 flex-shrink-0" />
              <span>
                Earn credits by reviewing other artists (1 review = 1 credit)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-600 flex-shrink-0" />
              <span>Your starter credits are ready to use now</span>
            </li>
          </ul>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full border-2 border-neutral-300 p-2 text-neutral-400 hover:text-black hover:border-neutral-400 transition-colors duration-150 ease-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          aria-label="Dismiss credit guide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
