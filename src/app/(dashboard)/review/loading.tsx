export default function ReviewLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-10 pb-6 border-b border-neutral-200">
            <div className="h-3 w-16 bg-neutral-200 rounded mb-2"></div>
            <div className="h-10 w-64 bg-neutral-200 rounded mb-3"></div>
            <div className="h-4 w-48 bg-neutral-200 rounded"></div>
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-4 w-32 bg-neutral-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-neutral-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-48 bg-neutral-200 rounded"></div>
                          <div className="h-4 w-32 bg-neutral-200 rounded"></div>
                        </div>
                        <div className="h-10 w-24 bg-neutral-200 rounded-lg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-4">
              <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-4 w-24 bg-neutral-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-neutral-200"></div>
                        <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                      </div>
                      <div className="h-6 w-12 bg-neutral-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
