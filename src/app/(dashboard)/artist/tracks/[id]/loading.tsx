export default function TrackDetailLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated skeleton */}
        <div className="animate-pulse">
          {/* Back link skeleton */}
          <div className="h-4 w-32 bg-neutral-200 rounded mb-6"></div>

          {/* Compact header skeleton */}
          <div className="mb-8 pb-6 border-b border-black/10">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Album art skeleton */}
              <div className="w-20 h-20 rounded-xl bg-neutral-200"></div>

              {/* Track info skeleton */}
              <div className="flex-1 space-y-3">
                <div className="h-8 w-64 bg-neutral-200 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-neutral-200 rounded-full"></div>
                  <div className="h-6 w-20 bg-neutral-200 rounded-full"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                  <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
            {/* Main content - tabs skeleton */}
            <div className="min-w-0 overflow-hidden">
              {/* Tabs skeleton */}
              <div className="border-b-2 border-neutral-200 mb-8">
                <div className="flex gap-2 pb-3">
                  <div className="h-10 w-20 bg-neutral-200 rounded"></div>
                  <div className="h-10 w-24 bg-neutral-200 rounded"></div>
                  <div className="h-10 w-32 bg-neutral-200 rounded"></div>
                </div>
              </div>

              {/* Content cards skeleton */}
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                    <div className="space-y-3">
                      <div className="h-5 w-48 bg-neutral-200 rounded"></div>
                      <div className="h-4 w-full bg-neutral-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              {/* Player card skeleton */}
              <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-3 w-16 bg-neutral-200 rounded mb-4"></div>
                <div className="h-32 w-full bg-neutral-200 rounded"></div>
              </div>

              {/* Quick actions card skeleton */}
              <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-3 w-24 bg-neutral-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-10 w-full bg-neutral-200 rounded"></div>
                  <div className="h-10 w-full bg-neutral-200 rounded"></div>
                </div>
              </div>

              {/* Additional card skeleton */}
              <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-3 w-20 bg-neutral-200 rounded mb-4"></div>
                <div className="h-20 w-full bg-neutral-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
