export default function DashboardLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated skeleton */}
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
            <div className="h-10 w-80 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded"></div>
          </div>

          {/* Stats grid skeleton */}
          <div className="mb-10">
            <div className="h-3 w-24 bg-neutral-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-neutral-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-8 w-16 bg-neutral-200 rounded"></div>
                      <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-10">
              {/* Tracks section skeleton */}
              <div>
                <div className="h-6 w-32 bg-neutral-200 rounded mb-5"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-neutral-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-48 bg-neutral-200 rounded"></div>
                          <div className="h-4 w-32 bg-neutral-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-32 w-full bg-neutral-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
