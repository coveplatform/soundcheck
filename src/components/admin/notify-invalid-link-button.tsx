"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function NotifyInvalidLinkButton({ trackId }: { trackId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const notifyArtist = async () => {
    setError(null);

    const ok = window.confirm(
      "Send email to artist about invalid/broken track link? This will notify them to update their link."
    );
    if (!ok) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/notify-invalid-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to send notification");
        return;
      }

      setSent(true);
      window.location.reload();
    } catch {
      setError("Failed to send notification");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <span className="text-xs text-green-600 font-medium">Notification sent!</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-orange-500 text-orange-600 hover:bg-orange-50"
        onClick={notifyArtist}
        isLoading={isLoading}
      >
        Notify: Invalid Link
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
