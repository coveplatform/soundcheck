"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-600 mb-2">Admin page error</h2>
        <p className="text-sm text-neutral-600 mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 font-mono mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
