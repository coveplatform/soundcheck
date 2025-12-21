"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ForceVerifyEmailButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setError(null);

    const ok = window.confirm("Mark this user as email-verified?");
    if (!ok) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to verify user");
        return;
      }

      window.location.reload();
    } catch {
      setError("Failed to verify user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={verify} isLoading={isLoading}>
        Force Verify Email
      </Button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
