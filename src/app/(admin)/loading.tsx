import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-2 border-black bg-white p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="divide-y divide-neutral-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
