export default function TracksLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated skeleton */}
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
            <div className="h-10 w-64 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-neutral-200 rounded"></div>
          </div>

          {/* View toggle skeleton */}
          <div className="h-10 w-48 bg-neutral-200 rounded mb-8"></div>

          {/* Tracks grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white overflow-hidden">
                {/* Album art skeleton */}
                <div className="aspect-square bg-neutral-200"></div>
                {/* Track info skeleton */}
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
