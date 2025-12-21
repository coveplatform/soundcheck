"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReviewerRestrictionToggle({
  reviewerId,
  isRestricted,
}: {
  reviewerId: string;
  isRestricted: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/reviewers/${reviewerId}/restrict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRestricted: !isRestricted }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed");
        return;
      }

      window.location.reload();
    } catch {
      setError("Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isRestricted ? "secondary" : "destructive"}
        onClick={toggle}
        isLoading={isLoading}
      >
        {isRestricted ? "Unrestrict" : "Restrict"}
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
