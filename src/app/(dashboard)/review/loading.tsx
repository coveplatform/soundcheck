export default function ReviewQueueLoading() {
  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden animate-pulse">
      {/* Hero */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="h-12 w-52 bg-black/8 rounded" />
              <div className="h-4 w-64 bg-black/5 rounded mt-2" />
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <div className="h-14 w-10 bg-black/8 rounded ml-auto" />
              <div className="h-3 w-20 bg-black/5 rounded mt-2 ml-auto" />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-6 pt-5 border-t-2 border-black/8">
            <div className="h-5 w-24 bg-black/5 rounded" />
            <div className="h-5 w-28 bg-black/5 rounded" />
            <div className="h-5 w-20 bg-black/5 rounded" />
          </div>
        </div>
      </div>

      {/* Available tracks */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-2.5 w-20 bg-black/5 rounded mb-1.5" />
        <div className="h-8 w-48 bg-black/8 rounded mb-5" />

        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-stretch rounded-2xl border-2 border-black/8 bg-white overflow-hidden">
              <div className="w-20 sm:w-24 flex-shrink-0 bg-black/5" style={{ minHeight: 80 }} />
              <div className="flex items-center justify-between gap-4 flex-1 px-4 py-3.5">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-black/6 rounded" />
                  <div className="h-3 w-28 bg-black/5 rounded" />
                  <div className="h-3 w-20 bg-black/5 rounded-full" />
                </div>
                <div className="h-9 w-20 bg-black/6 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
