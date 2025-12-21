"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TrackCancelButton({
  trackId,
  willRefund,
}: {
  trackId: string;
  willRefund: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setError(null);

    const ok = window.confirm(
      willRefund
        ? "Cancel this track and issue a refund?"
        : "Cancel this track?"
    );

    if (!ok) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/tracks/${trackId}/cancel`, {
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
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={cancel}
        isLoading={isLoading}
      >
        Cancel Track
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
