"use client";

import { CircleDoodle, DotsDoodle, SparklesDoodle, SquiggleDoodle } from "@/components/dashboard/doodles";
import { cn } from "@/lib/utils";

export function DashboardBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute -top-56 -left-40 h-[420px] w-[420px] rounded-full bg-orange-400/10 blur-3xl" />
      <div className="absolute -bottom-56 -right-40 h-[520px] w-[520px] rounded-full bg-purple-400/10 blur-3xl" />

      <SparklesDoodle className="absolute top-10 right-10 h-10 w-10 text-black/10" />
      <SquiggleDoodle className="absolute top-24 left-8 h-12 w-12 text-black/10 rotate-6" />
      <DotsDoodle className="absolute bottom-10 left-10 h-10 w-10 text-black/10" />
      <CircleDoodle className="absolute bottom-16 right-12 h-12 w-12 text-black/10 -rotate-12" />

      <div className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_10%,rgba(0,0,0,0.06),transparent_60%)] opacity-40" />
    </div>
  );
}
