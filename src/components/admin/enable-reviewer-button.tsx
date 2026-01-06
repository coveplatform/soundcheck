"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function EnableReviewerButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const enableReviewer = async () => {
    setError(null);

    const ok = window.confirm(
      "Enable this user as a reviewer? This bypasses the waitlist and creates a reviewer profile. They will still need to complete onboarding."
    );
    if (!ok) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/enable-reviewer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to enable reviewer");
        return;
      }

      setSuccess(true);
      window.location.reload();
    } catch {
      setError("Failed to enable reviewer");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return <span className="text-sm text-green-600">Reviewer enabled!</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={enableReviewer}
        isLoading={isLoading}
        className="bg-lime-600 hover:bg-lime-500"
      >
        Enable as Reviewer
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
