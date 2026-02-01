"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ActivateProButtonProps {
  userId: string;
  currentStatus: string | null;
}

export function ActivateProButton({ userId, currentStatus }: ActivateProButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAlreadyPro = currentStatus === "active";

  const handleActivate = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/admin/users/${userId}/activate-pro`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to activate pro");
      }

      setSuccess("Pro activated successfully!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate pro");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAlreadyPro) {
    return (
      <div className="text-sm text-green-600 font-medium">
        Pro is active
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          Activate Pro subscription for this user? This will also grant 20 review credits.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isLoading ? "Activating..." : "Yes, activate"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
      >
        Activate Pro
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
