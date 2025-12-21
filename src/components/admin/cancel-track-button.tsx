"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CancelTrackButton({ trackId }: { trackId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setError(null);

    const ok = window.confirm("Cancel this track? (No refund will be issued by this action.)");
    if (!ok) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to cancel track");
        return;
      }

      window.location.reload();
    } catch {
      setError("Failed to cancel track");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={cancel} isLoading={isLoading}>
        Cancel
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
