export default function EarningsLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
            <div className="h-10 w-48 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-6">
                <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
                <div className="h-8 w-24 bg-neutral-200 rounded"></div>
              </div>
            ))}
          </div>

          <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6 space-y-4">
            <div className="h-5 w-40 bg-neutral-200 rounded"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-neutral-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
