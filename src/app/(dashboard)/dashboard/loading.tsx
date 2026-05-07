export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden animate-pulse">
      {/* Hero */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="h-10 w-16 bg-black/5 rounded mb-1" />
              <div className="h-12 w-56 bg-black/8 rounded" />
            </div>
            <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
              <div className="h-14 w-14 bg-black/8 rounded ml-auto" />
              <div className="h-3 w-20 bg-black/5 rounded mt-2 ml-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Queue section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="h-2.5 w-20 bg-black/5 rounded mb-1.5" />
            <div className="h-8 w-44 bg-black/8 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="aspect-square rounded-2xl bg-black/6 border-2 border-black/8" />
              <div className="h-3 w-3/4 bg-black/5 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Review & Earn dark section */}
      <div className="bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="h-2.5 w-24 bg-white/10 rounded mb-1.5" />
              <div className="h-8 w-52 bg-white/10 rounded" />
              <div className="h-4 w-48 bg-white/5 rounded mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/5 overflow-hidden">
                <div className="aspect-square bg-white/5" />
                <div className="p-2 space-y-1.5">
                  <div className="h-2.5 bg-white/8 rounded" />
                  <div className="h-2 w-2/3 bg-white/5 rounded" />
                  <div className="h-6 bg-white/8 rounded-md mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
