"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface EligibleReviewer {
  id: string;
  email: string;
  tier: string;
}

export function ReassignReviewerButton({
  trackId,
  currentReviewerId,
  currentReviewerEmail,
}: {
  trackId: string;
  currentReviewerId: string;
  currentReviewerEmail: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingReviewers, setIsFetchingReviewers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibleReviewers, setEligibleReviewers] = useState<EligibleReviewer[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");

  const fetchEligibleReviewers = async () => {
    setIsFetchingReviewers(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/eligible-reviewers`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to fetch reviewers");
        return;
      }

      // Filter out the current reviewer
      setEligibleReviewers(
        data.reviewers.filter((r: EligibleReviewer) => r.id !== currentReviewerId)
      );
    } catch {
      setError("Failed to fetch reviewers");
    } finally {
      setIsFetchingReviewers(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setSelectedReviewerId("");
    await fetchEligibleReviewers();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedReviewerId("");
    setError(null);
  };

  const handleReassign = async () => {
    if (!selectedReviewerId) {
      setError("Please select a reviewer");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentReviewerId,
          newReviewerId: selectedReviewerId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to reassign reviewer");
        return;
      }

      window.location.reload();
    } catch {
      setError("Failed to reassign reviewer");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={handleOpen}>
        Reassign
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 border border-neutral-200 rounded bg-neutral-50">
      <div className="text-xs text-neutral-500">
        Reassign from: {currentReviewerEmail}
      </div>

      {isFetchingReviewers ? (
        <div className="text-xs text-neutral-500">Loading reviewers...</div>
      ) : (
        <select
          className="text-sm border border-neutral-300 rounded px-2 py-1 bg-white"
          value={selectedReviewerId}
          onChange={(e) => setSelectedReviewerId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a reviewer...</option>
          {eligibleReviewers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.email} ({r.tier})
            </option>
          ))}
        </select>
      )}

      {error ? <div className="text-xs text-red-500">{error}</div> : null}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleReassign}
          isLoading={isLoading}
          disabled={!selectedReviewerId || isFetchingReviewers}
        >
          Confirm
        </Button>
        <Button size="sm" variant="outline" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
