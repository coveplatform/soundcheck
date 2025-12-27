"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DeleteTrackButton({ trackId }: { trackId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTrack = async () => {
    setError(null);

    const ok = window.confirm(
      "PERMANENTLY DELETE this track? This will remove the track and all associated reviews, queue entries, and payment records. This cannot be undone."
    );
    if (!ok) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to delete track");
        return;
      }

      window.location.href = "/admin/tracks";
    } catch {
      setError("Failed to delete track");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="destructive"
        onClick={deleteTrack}
        isLoading={isLoading}
      >
        Delete
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
