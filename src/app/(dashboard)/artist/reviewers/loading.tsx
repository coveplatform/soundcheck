export default function ReviewersLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-10 pb-6 border-b border-black/10">
            <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
            <div className="h-10 w-48 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-2 border-neutral-200 rounded-2xl bg-white p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-neutral-200 rounded"></div>
                    <div className="h-3 w-20 bg-neutral-200 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-neutral-100 rounded-full"></div>
                  <div className="h-6 w-16 bg-neutral-100 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
