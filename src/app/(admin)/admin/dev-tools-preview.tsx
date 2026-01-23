"use client";

import { useState } from "react";
import Link from "next/link";

export function DevToolsPreview() {
  const [isLoadingReviewer, setIsLoadingReviewer] = useState(false);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [isLoadingSingleReview, setIsLoadingSingleReview] = useState(false);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [singleReviewTrackUrl, setSingleReviewTrackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateReviewerPreview = async () => {
    setIsLoadingReviewer(true);
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
      setIsLoadingReviewer(false);
    }
  };

  const handleCreateArtistPreview = async () => {
    setIsLoadingArtist(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/dev/preview-artist-track", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create preview");
        return;
      }

      setTrackUrl(`/artist/tracks/${data.trackId}`);
    } catch {
      setError("Failed to create preview");
    } finally {
      setIsLoadingArtist(false);
    }
  };

  const handleCreateSingleReviewPreview = async () => {
    setIsLoadingSingleReview(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/dev/preview-artist-track-single", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create preview");
        return;
      }

      setSingleReviewTrackUrl(`/artist/tracks/${data.trackId}`);
    } catch {
      setError("Failed to create preview");
    } finally {
      setIsLoadingSingleReview(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h2 className="font-semibold text-amber-900">Dev Tools</h2>
      <p className="text-sm text-amber-700 mt-1">Preview UI pages with your current account</p>

      <div className="mt-4 space-y-4">
        {/* Reviewer Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateReviewerPreview}
              disabled={isLoadingReviewer}
              className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoadingReviewer ? "Creating..." : "Preview Reviewer Page"}
            </button>

            {reviewUrl && (
              <Link
                href={reviewUrl}
                target="_blank"
                className="text-sm text-amber-800 underline hover:text-amber-900"
              >
                Open →
              </Link>
            )}
          </div>
          <p className="text-xs text-amber-600">
            Review submission form (what reviewers see when reviewing a track)
          </p>
        </div>

        {/* Artist Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateArtistPreview}
              disabled={isLoadingArtist}
              className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoadingArtist ? "Creating..." : "Preview Artist Track Results"}
            </button>

            {trackUrl && (
              <Link
                href={trackUrl}
                target="_blank"
                className="text-sm text-amber-800 underline hover:text-amber-900"
              >
                Open →
              </Link>
            )}
          </div>
          <p className="text-xs text-amber-600">
            Track results page with 5 completed reviews (what artists see after reviews complete)
          </p>
        </div>

        {/* Single Review Preview (Free Tier Upsell) */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateSingleReviewPreview}
              disabled={isLoadingSingleReview}
              className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoadingSingleReview ? "Creating..." : "Preview Free Tier (1 Review)"}
            </button>

            {singleReviewTrackUrl && (
              <Link
                href={singleReviewTrackUrl}
                target="_blank"
                className="text-sm text-amber-800 underline hover:text-amber-900"
              >
                Open →
              </Link>
            )}
          </div>
          <p className="text-xs text-amber-600">
            Track with 1 completed review — shows the upsell CTA for free tier users
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
