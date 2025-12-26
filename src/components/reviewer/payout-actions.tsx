"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export function PayoutActions({
  pendingBalance,
  stripeAccountId,
  country,
}: {
  pendingBalance: number;
  stripeAccountId: string | null;
  country: string | null;
}) {
  const [error, setError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSavingCountry, setIsSavingCountry] = useState(false);
  const [countryInput, setCountryInput] = useState<string>((country ?? "").toUpperCase());

  function maybeRedirectForAuth(status: number, message: unknown) {
    if (status === 401) {
      window.location.href = "/login";
      return true;
    }

    if (status === 403) {
      const msg = typeof message === "string" ? message.toLowerCase() : "";
      if (msg.includes("verify")) {
        window.location.href = "/verify-email";
        return true;
      }
      if (msg.includes("onboarding")) {
        window.location.href = "/reviewer/onboarding";
        return true;
      }
      if (msg.includes("restricted")) {
        window.location.href = "/reviewer/dashboard";
        return true;
      }
    }

    return false;
  }

  async function saveCountry() {
    setError("");
    setIsSavingCountry(true);

    const normalizedCountry = countryInput.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      setError("Please enter your country as a 2-letter code (e.g. AU, US)");
      setIsSavingCountry(false);
      return;
    }

    try {
      const res = await fetch("/api/reviewer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: normalizedCountry }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (maybeRedirectForAuth(res.status, data?.error)) {
          return;
        }
        setError(data?.error || "Failed to save country");
        return;
      }

      window.location.reload();
    } catch {
      setError("Failed to save country");
    } finally {
      setIsSavingCountry(false);
    }
  }

  async function connect() {
    setError("");
    setIsConnecting(true);

    try {
      if (!country) {
        const normalizedCountry = countryInput.trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
          setError("Please set your country before connecting Stripe");
          return;
        }

        const saveRes = await fetch("/api/reviewer/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: normalizedCountry }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          if (maybeRedirectForAuth(saveRes.status, saveData?.error)) {
            return;
          }
          setError(saveData?.error || "Failed to save country");
          return;
        }
      }

      const res = await fetch("/api/reviewer/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (maybeRedirectForAuth(res.status, data?.error)) {
          return;
        }
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
        if (maybeRedirectForAuth(res.status, data?.error)) {
          return;
        }
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
        if (maybeRedirectForAuth(res.status, data?.error)) {
          return;
        }
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
        if (maybeRedirectForAuth(res.status, data?.error)) {
          return;
        }
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
      {!stripeAccountId && !country ? (
        <div className="space-y-2">
          <div className="text-sm text-neutral-600 font-bold">Country (for payouts)</div>
          <Input
            value={countryInput}
            onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
            placeholder="US"
            maxLength={2}
            autoComplete="country"
          />
          <Button variant="outline" onClick={saveCountry} isLoading={isSavingCountry}>
            Save country
          </Button>
        </div>
      ) : null}
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
