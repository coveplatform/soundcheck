"use client";

import { useState } from "react";
import Link from "next/link";

export function DevToolsPreview() {
  const [isLoading, setIsLoading] = useState(false);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/dev/preview-review", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create preview");
        return;
      }

      setReviewUrl(`/reviewer/review/${data.reviewId}`);
    } catch {
      setError("Failed to create preview");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h2 className="font-semibold text-amber-900">Dev Tools</h2>
      <p className="text-sm text-amber-700 mt-1">Preview UI pages without creating real data</p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreatePreview}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Preview Reviewer Page"}
          </button>

          {reviewUrl && (
            <Link
              href={reviewUrl}
              target="_blank"
              className="text-sm text-amber-800 underline hover:text-amber-900"
            >
              Open preview →
            </Link>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {reviewUrl && (
          <p className="text-xs text-amber-600">
            Tip: Log in as test-reviewer@soundcheck.com (password: test123456) first
          </p>
        )}
      </div>
    </div>
  );
}
