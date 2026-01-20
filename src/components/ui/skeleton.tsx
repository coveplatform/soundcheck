import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 border border-black/10 rounded-2xl",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-black/10 bg-white/70 p-6 space-y-4", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTrackRow() {
  return (
    <div className="flex items-center justify-between p-4 rounded-3xl border border-black/10 bg-white/70">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonStatCard, SkeletonTrackRow };
