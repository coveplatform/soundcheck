export default function ReviewHistoryLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
            <div className="h-10 w-56 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-neutral-200 rounded"></div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-neutral-200 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-neutral-200 rounded"></div>
                  <div className="h-3 w-32 bg-neutral-200 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-neutral-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
