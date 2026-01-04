"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrackUpdateSourceForm({
  trackId,
  initialUrl,
}: {
  trackId: string;
  initialUrl: string;
}) {
  const [sourceUrl, setSourceUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setError(null);
    setSuccess(false);

    const ok = window.confirm("Update the track link? This will reassign reviewers.");
    if (!ok) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/tracks/${trackId}/update-source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to update track link");
        return;
      }

      setSuccess(true);
      window.location.reload();
    } catch {
      setError("Failed to update track link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor="track-source-url" className="text-sm font-bold">
          Update track link
        </Label>
        <Input
          id="track-source-url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://soundcloud.com/..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={submit} isLoading={isLoading}>
          Save link
        </Button>
        {success ? <span className="text-xs text-lime-700">Saved</span> : null}
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </div>
    </div>
  );
}
