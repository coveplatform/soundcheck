export default function DashboardLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          {/* Compact header skeleton */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5 border-b border-black/10">
            <div className="h-8 w-48 bg-black/5 rounded"></div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-20 bg-black/5 rounded-lg"></div>
              <div className="h-9 w-28 bg-black/5 rounded-lg"></div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-black/8 rounded-xl bg-white/60 px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-black/5"></div>
                      <div className="space-y-1.5">
                        <div className="h-5 w-10 bg-black/5 rounded"></div>
                        <div className="h-3 w-16 bg-black/5 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tracks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-24 bg-black/5 rounded"></div>
                  <div className="h-3 w-16 bg-black/5 rounded"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-stretch rounded-xl border border-black/8 bg-white overflow-hidden">
                      <div className="w-16 sm:w-[72px] flex-shrink-0 bg-black/5"></div>
                      <div className="flex items-center gap-3 flex-1 px-3 sm:px-4 py-3">
                        <div className="flex-1 space-y-1.5">
                          <div className="h-4 w-36 bg-black/5 rounded"></div>
                          <div className="h-3 w-24 bg-black/5 rounded"></div>
                        </div>
                        <div className="h-8 w-20 bg-black/5 rounded-lg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-4">
              <div className="border border-black/8 rounded-xl bg-white/60 p-5">
                <div className="h-20 w-full bg-black/5 rounded-lg"></div>
              </div>
              <div className="border border-black/8 rounded-xl bg-white/60 p-5">
                <div className="h-32 w-full bg-black/5 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
