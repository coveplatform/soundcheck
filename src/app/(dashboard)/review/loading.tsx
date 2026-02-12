export default function ReviewLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-16 bg-black/5 rounded mb-2"></div>
            <div className="h-10 w-64 bg-black/5 rounded mb-3"></div>
            <div className="h-4 w-48 bg-black/5 rounded"></div>
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              <div className="border border-black/8 rounded-xl bg-white/60 p-5">
                <div className="h-3 w-32 bg-black/5 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-stretch rounded-xl border border-black/8 bg-white overflow-hidden">
                      <div className="w-[100px] flex-shrink-0 bg-black/5"></div>
                      <div className="flex items-center gap-4 flex-1 px-4 py-3.5">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-40 bg-black/5 rounded"></div>
                          <div className="h-3 w-28 bg-black/5 rounded"></div>
                          <div className="h-3 w-20 bg-black/5 rounded-full"></div>
                        </div>
                        <div className="h-9 w-20 bg-black/5 rounded-lg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-4">
              <div className="border border-black/8 rounded-xl bg-white/60 p-5">
                <div className="h-3 w-24 bg-black/5 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-black/5"></div>
                        <div className="h-3.5 w-20 bg-black/5 rounded"></div>
                      </div>
                      <div className="h-5 w-10 bg-black/5 rounded"></div>
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
