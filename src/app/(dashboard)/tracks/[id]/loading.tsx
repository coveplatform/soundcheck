export default function TrackDetailLoading() {
  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden animate-pulse">
      {/* Hero */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="h-3 w-24 bg-black/5 rounded mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-black/8 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-56 bg-black/8 rounded" />
              <div className="h-4 w-32 bg-black/5 rounded" />
              <div className="flex gap-1.5 mt-2">
                <div className="h-5 w-16 bg-black/5 rounded-full" />
                <div className="h-5 w-16 bg-black/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-black/8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 py-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 w-20 bg-black/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border-2 border-black/8 bg-white p-5 space-y-3">
            <div className="h-4 w-32 bg-black/6 rounded" />
            <div className="h-3.5 w-full bg-black/5 rounded" />
            <div className="h-3.5 w-4/5 bg-black/5 rounded" />
            <div className="h-3.5 w-3/5 bg-black/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
