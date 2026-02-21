export default function RequestReviewsLoading() {
  return (
    <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="animate-pulse">
          <div className="mb-8">
            <div className="h-4 w-24 bg-neutral-200 rounded mb-4"></div>
            <div className="h-10 w-64 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-neutral-200 rounded"></div>
          </div>

          <div className="border-2 border-neutral-200 rounded-2xl bg-white p-6 space-y-6">
            <div className="h-5 w-40 bg-neutral-200 rounded"></div>
            <div className="h-12 w-full bg-neutral-100 rounded-lg"></div>
            <div className="h-24 w-full bg-neutral-100 rounded-lg"></div>
            <div className="h-12 w-48 bg-neutral-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
