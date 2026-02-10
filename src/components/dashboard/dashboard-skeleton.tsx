import { SkeletonStatCard, SkeletonTrackRow } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="pt-8 px-6 sm:px-8 lg:px-12 pb-24">
      <div className="max-w-7xl">
        {/* Hero Skeleton */}
        <div className="mb-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-6 border-b border-black/10">
            <div className="flex-1">
              <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse mb-3" />
              <div className="h-10 w-64 bg-neutral-200 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="h-24 w-32 bg-neutral-200 rounded-2xl animate-pulse" />
              <div className="h-11 w-40 bg-neutral-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mb-10">
          <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        </div>

        {/* Tracks Skeleton */}
        <div className="space-y-10">
          <div>
            <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-32 bg-neutral-200 rounded-lg animate-pulse mb-5" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonTrackRow key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
