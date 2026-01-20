"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ReviewLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="rounded-3xl border border-black/10 bg-white/70 p-6 space-y-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="rounded-3xl border border-black/10 bg-white/70 p-6 space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
