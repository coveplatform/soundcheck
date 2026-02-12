export default function TrackDetailLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          {/* Back link */}
          <div className="h-4 w-32 bg-black/5 rounded mb-6"></div>

          {/* Header */}
          <div className="mb-8 pb-6 border-b border-black/10">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-20 h-20 rounded-xl bg-black/5"></div>
              <div className="flex-1 space-y-3">
                <div className="h-8 w-64 bg-black/5 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-black/5 rounded-full"></div>
                  <div className="h-5 w-20 bg-black/5 rounded-full"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-3.5 w-24 bg-black/5 rounded"></div>
                  <div className="h-3.5 w-24 bg-black/5 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
            {/* Main */}
            <div className="min-w-0 overflow-hidden">
              <div className="border-b border-black/10 mb-8">
                <div className="flex gap-2 pb-3">
                  <div className="h-9 w-20 bg-black/5 rounded-lg"></div>
                  <div className="h-9 w-24 bg-black/5 rounded-lg"></div>
                  <div className="h-9 w-28 bg-black/5 rounded-lg"></div>
                </div>
              </div>
              <div className="border border-black/8 rounded-xl bg-white/60 p-6 space-y-5">
                <div className="h-3 w-24 bg-black/5 rounded mb-4"></div>
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="h-4 w-48 bg-black/5 rounded"></div>
                    <div className="h-3.5 w-full bg-black/5 rounded"></div>
                    <div className="h-3.5 w-3/4 bg-black/5 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="border border-black/8 rounded-xl bg-white/60 p-4">
                <div className="h-3 w-16 bg-black/5 rounded mb-3"></div>
                <div className="h-24 w-full bg-black/5 rounded-lg"></div>
              </div>
              <div className="border border-black/8 rounded-xl bg-white/60 p-4">
                <div className="h-3 w-24 bg-black/5 rounded mb-3"></div>
                <div className="space-y-2.5">
                  <div className="h-9 w-full bg-black/5 rounded-lg"></div>
                  <div className="h-9 w-full bg-black/5 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
