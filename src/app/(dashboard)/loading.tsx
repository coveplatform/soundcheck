import { Skeleton, SkeletonStatCard, SkeletonTrackRow } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
      <div className="border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="divide-y-2 divide-black">
          <SkeletonTrackRow />
          <SkeletonTrackRow />
          <SkeletonTrackRow />
        </div>
      </div>
    </div>
  );
}
