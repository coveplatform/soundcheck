import { Skeleton, SkeletonStatCard, SkeletonTrackRow } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid sm:grid-cols-3 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Content skeleton */}
      <div className="rounded-3xl border border-black/10 bg-white/70 overflow-hidden">
        <div className="p-6 border-b border-black/10">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-2 sm:p-3 space-y-2">
          <SkeletonTrackRow />
          <SkeletonTrackRow />
          <SkeletonTrackRow />
        </div>
      </div>
    </div>
  );
}
