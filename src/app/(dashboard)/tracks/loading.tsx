export default function TracksLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-black/5 rounded mb-3"></div>
            <div className="h-10 w-64 bg-black/5 rounded mb-2"></div>
            <div className="h-4 w-32 bg-black/5 rounded"></div>
          </div>

          {/* View toggle skeleton */}
          <div className="h-10 w-48 bg-black/5 rounded-lg mb-8"></div>

          {/* Tracks grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="border border-black/8 rounded-xl bg-white overflow-hidden">
                <div className="aspect-[4/3] bg-black/5"></div>
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-black/5 rounded"></div>
                  <div className="h-3 w-1/2 bg-black/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
