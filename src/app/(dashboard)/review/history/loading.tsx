export default function ReviewHistoryLoading() {
  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden animate-pulse">
      {/* Hero */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="h-3 w-28 bg-black/5 rounded mb-3" />
              <div className="h-12 w-52 bg-black/8 rounded" />
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <div className="h-14 w-10 bg-black/8 rounded ml-auto" />
              <div className="h-3 w-16 bg-black/5 rounded mt-2 ml-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-stretch rounded-2xl border-2 border-black/8 bg-white overflow-hidden">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-black/5" />
            <div className="flex items-center justify-between gap-4 flex-1 px-4 py-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-44 bg-black/6 rounded" />
                <div className="h-3 w-32 bg-black/5 rounded" />
              </div>
              <div className="hidden sm:flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-3.5 w-3.5 bg-black/5 rounded-sm" />
                ))}
              </div>
              <div className="h-3 w-16 bg-black/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
