"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";

export function OutageBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("outage-banner-mar13-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--banner-h", visible ? "40px" : "0px");
    return () => document.documentElement.style.setProperty("--banner-h", "0px");
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-white text-center flex-1">
        <span className="font-black">Important:</span> A database incident on March 13th resulted in the loss of all user accounts and data.{" "}
        <Link href="/incident" className="underline underline-offset-2 font-bold hover:text-red-100 transition-colors">
          Read the full incident report →
        </Link>
      </p>
      <button
        onClick={() => {
          localStorage.setItem("outage-banner-mar13-dismissed", "1");
          setVisible(false);
        }}
        className="flex-shrink-0 text-red-200 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
