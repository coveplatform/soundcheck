export default function TracksLoading() {
  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden animate-pulse">
      {/* Hero */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="h-12 w-40 bg-black/8 rounded" />
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <div className="h-14 w-14 bg-black/8 rounded ml-auto" />
              <div className="h-3 w-20 bg-black/5 rounded mt-2 ml-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Slot indicator bar */}
      <div className="bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
      </div>

      {/* Track grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="h-3 w-20 bg-black/5 rounded" />
          <div className="h-3 w-16 bg-black/5 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-black/8 bg-white overflow-hidden">
              <div className="aspect-square bg-black/5" />
              <div className="p-3 space-y-1.5">
                <div className="h-3 w-3/4 bg-black/5 rounded" />
                <div className="h-2.5 w-1/2 bg-black/5 rounded" />
                <div className="h-1.5 bg-black/4 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
