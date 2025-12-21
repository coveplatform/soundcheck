"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RefundButton({ trackId }: { trackId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refund = async () => {
    setError(null);

    const ok = window.confirm("Refund this track payment and cancel the track?");
    if (!ok) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Refund failed");
        return;
      }

      window.location.reload();
    } catch {
      setError("Refund failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="destructive" onClick={refund} isLoading={isLoading}>
        Refund
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
