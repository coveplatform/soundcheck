"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export function ReleaseDecisionBanner() {
  return (
    <Link
      href="/submit?package=release-decision"
      className="group flex items-center justify-between gap-4 rounded-xl bg-neutral-900 px-4 py-3 transition-colors duration-150 hover:bg-neutral-800"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">
            Not sure if it&apos;s ready?{" "}
            <span className="text-neutral-400 font-normal">
              Get a Go/No-Go verdict + PDF report from 10+ experts.
            </span>
          </p>
        </div>
      </div>
      <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 group-hover:bg-purple-500 transition-colors px-3 py-1.5 rounded-lg">
        $9.95
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
