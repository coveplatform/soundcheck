"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GrantFreeButton({ trackId }: { trackId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantFree = async () => {
    setError(null);

    const ok = window.confirm(
      "Grant this track a free submission? This will queue the track and assign reviewers."
    );
    if (!ok) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/grant-free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to grant free submission");
        return;
      }

      window.location.reload();
    } catch {
      setError("Failed to grant free submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-lime-500 text-black hover:bg-lime-400"
        onClick={grantFree}
        isLoading={isLoading}
      >
        Grant Free
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
