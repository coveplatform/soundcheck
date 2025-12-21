"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function PayoutActions({
  pendingBalance,
  stripeAccountId,
}: {
  pendingBalance: number;
  stripeAccountId: string | null;
}) {
  const [error, setError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  async function connect() {
    setError("");
    setIsConnecting(true);

    try {
      const res = await fetch("/api/reviewer/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to start Stripe onboarding");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Failed to start Stripe onboarding");
    } finally {
      setIsConnecting(false);
    }
  }

  async function reconnect() {
    setError("");
    setIsReconnecting(true);

    try {
      const res = await fetch("/api/reviewer/stripe/connect?reset=1", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to start Stripe onboarding");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Failed to start Stripe onboarding");
    } finally {
      setIsReconnecting(false);
    }
  }

  async function openDashboard() {
    setError("");
    setIsOpeningDashboard(true);

    try {
      const res = await fetch("/api/reviewer/stripe/dashboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to open Stripe dashboard");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Failed to open Stripe dashboard");
    } finally {
      setIsOpeningDashboard(false);
    }
  }

  async function requestPayout() {
    setError("");
    setIsRequestingPayout(true);

    try {
      const res = await fetch("/api/reviewer/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to request payout");
        return;
      }
      window.location.reload();
    } catch {
      setError("Failed to request payout");
    } finally {
      setIsRequestingPayout(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {!stripeAccountId ? (
          <Button onClick={connect} isLoading={isConnecting}>
            Connect Stripe for Payouts
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={openDashboard} isLoading={isOpeningDashboard}>
              Stripe Dashboard
            </Button>
            <Button variant="outline" onClick={reconnect} isLoading={isReconnecting}>
              Reconnect Stripe
            </Button>
            <Button
              onClick={requestPayout}
              isLoading={isRequestingPayout}
              disabled={pendingBalance < 1000}
            >
              Request Payout ({formatCurrency(pendingBalance)})
            </Button>
          </>
        )}
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
