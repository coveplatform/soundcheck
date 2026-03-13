"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function OutageBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("outage-banner-mar13-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-400 border-b-2 border-amber-600 px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm font-bold text-amber-950 text-center flex-1">
        <span className="font-black">Heads up:</span> We had a database issue on March 13th that wiped all accounts. If you had an account before, you&apos;ll need to sign up again — really sorry about that.
      </p>
      <button
        onClick={() => {
          localStorage.setItem("outage-banner-mar13-dismissed", "1");
          setVisible(false);
        }}
        className="flex-shrink-0 text-amber-800 hover:text-amber-950 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
