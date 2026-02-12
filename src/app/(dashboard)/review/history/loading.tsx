export default function ReviewHistoryLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-black/5 rounded mb-3"></div>
            <div className="h-10 w-56 bg-black/5 rounded mb-2"></div>
            <div className="h-4 w-32 bg-black/5 rounded"></div>
          </div>

          <div className="border border-black/8 rounded-xl bg-white/60 p-6">
            <div className="h-3 w-24 bg-black/5 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-stretch rounded-xl border border-black/8 bg-white overflow-hidden">
                  <div className="w-16 sm:w-20 flex-shrink-0 bg-black/5"></div>
                  <div className="flex items-center gap-4 flex-1 px-4 py-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-40 bg-black/5 rounded"></div>
                      <div className="h-3 w-28 bg-black/5 rounded"></div>
                    </div>
                    <div className="h-4 w-14 bg-black/5 rounded hidden sm:block"></div>
                    <div className="h-3 w-12 bg-black/5 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
