"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface CompUnlimitedButtonProps {
  userId: string;
  isActive: boolean;
}

/**
 * Comp (or revoke) an Unlimited subscription for this user's email — replaces the
 * old "Activate Pro". Activating also back-unlocks all their gated reports.
 */
export function CompUnlimitedButton({ userId, isActive }: CompUnlimitedButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "activate" | "deactivate") => {
    setError(null);
    const ok = window.confirm(
      action === "activate"
        ? "Comp an Unlimited subscription for this user? This also unlocks all their existing reports."
        : "Revoke this user's Unlimited subscription? Already-unlocked reports stay readable."
    );
    if (!ok) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/comp-unlimited`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Request failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => run("deactivate")}
          isLoading={isLoading}
        >
          Revoke Unlimited
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => run("activate")}
          isLoading={isLoading}
          className="bg-[#6ee7ff] text-black hover:bg-white"
        >
          Comp Unlimited
        </Button>
      )}
      {error ? <span className="text-xs text-[#ff6b6b]">{error}</span> : null}
    </div>
  );
}
