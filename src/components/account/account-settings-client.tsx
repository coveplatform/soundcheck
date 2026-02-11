"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountSettingsClient({
  initialName,
  artistName: initialArtistName,
  email,
  hasPassword,
  reviewCredits: initialReviewCredits,
  subscription,
}: {
  initialName: string;
  artistName: string | null;
  email: string;
  hasPassword: boolean;
  reviewCredits: number;
  subscription: {
    status: string | null;
    tier: string | null;
    currentPeriodEnd: Date | null;
    canceledAt: Date | null;
    totalTracks: number;
  } | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(initialName);
  const [artistName, setArtistName] = useState(initialArtistName ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [buyCreditsError, setBuyCreditsError] = useState("");
  const [selectedCreditPack, setSelectedCreditPack] = useState<3 | 10 | 25 | null>(null);

  // Subscription verification state (for handling redirect from Stripe checkout)
  const [isVerifyingSubscription, setIsVerifyingSubscription] = useState(false);
  const [subscriptionJustActivated, setSubscriptionJustActivated] = useState(false);
  const [verifiedSubscription, setVerifiedSubscription] = useState<{
    status: string;
    tier: string | null;
    currentPeriodEnd: Date | null;
    credits: number;
  } | null>(null);

  // Verify subscription status when redirected from checkout
  const verifySubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions/verify", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.status === "active") {
        setVerifiedSubscription({
          status: data.status,
          tier: data.tier,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
          credits: data.credits ?? 0,
        });
        setSubscriptionJustActivated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Poll for subscription activation when coming from checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("subscription") === "success";
    const creditsSuccess = searchParams.get("credits") === "success";

    // Show credits success message
    if (creditsSuccess) {
      // Refresh the page data to show updated credits
      router.refresh();
    }

    // Handle subscription checkout success - poll until activated
    if (checkoutSuccess && subscription?.status !== "active") {
      setIsVerifyingSubscription(true);

      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 2000; // 2 seconds

      const poll = async () => {
        attempts++;
        const activated = await verifySubscription();

        if (activated) {
          setIsVerifyingSubscription(false);
          // Clean up URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("subscription");
          window.history.replaceState({}, "", newUrl.toString());
          // Refresh to update server-side data
          router.refresh();
        } else if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          // Max attempts reached - subscription might still activate via webhook
          setIsVerifyingSubscription(false);
        }
      };

      poll();
    }
  }, [searchParams, subscription?.status, verifySubscription, router]);

  async function saveProfile() {
    setProfileError("");
    setProfileSaved(false);
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() ? name.trim() : null,
          artistName: artistName.trim() ? artistName.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setProfileError(data?.error || "Failed to update profile");
        return;
      }

      setProfileSaved(true);
      router.refresh();
    } catch {
      setProfileError("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function buyCredits(pack: 3 | 10 | 25) {
    setBuyCreditsError("");
    setIsBuyingCredits(true);

    try {
      const res = await fetch("/api/review-credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pack", pack }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        setBuyCreditsError(data?.error || "Failed to start checkout");
        return;
      }

      window.location.href = data.url;
    } catch {
      setBuyCreditsError("Failed to start checkout");
    } finally {
      setIsBuyingCredits(false);
    }
  }

  async function sendPasswordReset() {
    setResetError("");
    setResetSent(false);
    setIsSendingReset(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResetError(data?.error || "Failed to send reset email");
        return;
      }

      setResetSent(true);
    } catch {
      setResetError("Failed to send reset email");
    } finally {
      setIsSendingReset(false);
    }
  }

  async function deleteAccount() {
    setDeleteError("");
    setIsDeleting(true);

    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setDeleteError(data?.error || "Failed to delete account");
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }

  // Use verified subscription state if available (for immediate UI update after checkout)
  const effectiveSubscription = verifiedSubscription || subscription;
  const isSubscribed = effectiveSubscription?.status === "active";
  const reviewCredits = verifiedSubscription?.credits ?? initialReviewCredits;

  async function startCheckout() {
    setCheckoutError("");
    setIsStartingCheckout(true);

    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCheckoutError(data?.error || "Failed to start checkout");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setCheckoutError("Failed to start checkout");
    } catch {
      setCheckoutError("Failed to start checkout");
    } finally {
      setIsStartingCheckout(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Credit Balance Card */}
      <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white px-6 py-4">
          <h3 className="text-lg font-bold text-neutral-950">Credit Balance</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Review credits</p>
              <p className="text-xs text-neutral-600 mt-0.5">Use credits to get reviews on your tracks</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600 tabular-nums">{reviewCredits}</p>
              <p className="text-xs text-neutral-500 font-medium">available</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/review"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              Earn more credits by reviewing
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {/* Credit Top-Up */}
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-sm font-bold text-neutral-950 mb-3">Top up credits</p>

            {buyCreditsError ? (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 font-medium mb-3 rounded-lg">
                {buyCreditsError}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedCreditPack(3)}
                disabled={isBuyingCredits}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-all disabled:opacity-50 shadow-sm hover:shadow ${
                  selectedCreditPack === 3
                    ? "border-purple-500 bg-purple-100 ring-2 ring-purple-300"
                    : "border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <span className="text-lg font-bold text-purple-700">3</span>
                <span className="text-xs font-medium text-neutral-600">credits</span>
                <span className="text-sm font-bold text-neutral-950 mt-1">$2.95</span>
              </button>
              <button
                onClick={() => setSelectedCreditPack(10)}
                disabled={isBuyingCredits}
                className={`relative flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-all disabled:opacity-50 shadow-sm hover:shadow ${
                  selectedCreditPack === 10
                    ? "border-purple-500 bg-purple-100 ring-2 ring-purple-300"
                    : "border-purple-300 bg-purple-50 hover:border-purple-400 hover:bg-purple-100"
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  BEST
                </div>
                <span className="text-lg font-bold text-purple-700">10</span>
                <span className="text-xs font-medium text-neutral-600">credits</span>
                <span className="text-sm font-bold text-neutral-950 mt-1">$7.95</span>
              </button>
              <button
                onClick={() => setSelectedCreditPack(25)}
                disabled={isBuyingCredits}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-all disabled:opacity-50 shadow-sm hover:shadow ${
                  selectedCreditPack === 25
                    ? "border-purple-500 bg-purple-100 ring-2 ring-purple-300"
                    : "border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <span className="text-lg font-bold text-purple-700">25</span>
                <span className="text-xs font-medium text-neutral-600">credits</span>
                <span className="text-sm font-bold text-neutral-950 mt-1">$14.95</span>
              </button>
            </div>

            {/* Continue to checkout button */}
            {selectedCreditPack && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => buyCredits(selectedCreditPack)}
                  isLoading={isBuyingCredits}
                  className="w-full"
                >
                  Continue to checkout — ${selectedCreditPack === 3 ? "2.95" : selectedCreditPack === 10 ? "7.95" : "14.95"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold text-neutral-950">Subscription</h3>
        </div>
        <div className="p-6 space-y-3">
          {/* Verifying subscription after checkout */}
          {isVerifyingSubscription ? (
            <div className="bg-purple-50 border-2 border-purple-200 text-purple-800 text-sm p-4 font-medium rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                <span>Activating your subscription...</span>
              </div>
            </div>
          ) : null}

          {/* Subscription just activated success message */}
          {subscriptionJustActivated && !isVerifyingSubscription ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm p-4 font-medium rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">&#10003;</span>
                <span>Your Pro subscription is now active! You have {reviewCredits} review credits.</span>
              </div>
            </div>
          ) : null}

          {checkoutError ? (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 font-medium rounded-lg">
              {checkoutError}
            </div>
          ) : null}

          {isSubscribed ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-950">SoundCheck Pro</p>
                  <p className="text-xs text-neutral-600">$9.95/month</p>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  Active
                </div>
              </div>
              <div className="text-sm text-neutral-600">
                {subscription?.canceledAt ? (
                  <p>
                    Your subscription will end on{" "}
                    {new Date(effectiveSubscription?.currentPeriodEnd ?? subscription?.currentPeriodEnd!).toLocaleDateString()}
                  </p>
                ) : effectiveSubscription?.currentPeriodEnd ? (
                  <p>
                    Next billing date:{" "}
                    {new Date(effectiveSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                ) : null}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900 space-y-1">
                <p className="font-bold">Your Pro benefits:</p>
                <p>40 credits/month + sell your music + priority queue + PRO-tier reviews</p>
              </div>

              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/subscriptions/portal", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (error) {
                    console.error("Portal error:", error);
                  }
                }}
              >
                Manage Subscription
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-950">Current plan</p>
                  <p className="text-xs text-neutral-600">Free</p>
                </div>
                <div className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-full">
                  Not subscribed
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-base font-bold text-neutral-950 mb-2">Upgrade to SoundCheck Pro</p>
                  <p className="text-sm text-neutral-700">
                    <span className="font-bold text-neutral-950">$9.95/month</span> · Cancel anytime
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-950">40 credits every month</p>
                      <p className="text-xs text-neutral-600">Automatically added to your balance each billing cycle</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-950">Sell your music</p>
                      <p className="text-xs text-neutral-600">Custom links and affiliate tracking for your tracks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-950">Priority queue</p>
                      <p className="text-xs text-neutral-600">Your tracks get reviewed faster</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-950">PRO-tier reviews</p>
                      <p className="text-xs text-neutral-600">Detailed, high-quality feedback from experienced reviewers</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={startCheckout}
                  isLoading={isStartingCheckout}
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
                >
                  Upgrade to Pro — $9.95/month
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold text-neutral-950">Profile</h3>
        </div>
        <div className="p-6 space-y-4">
          {profileError ? (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 font-medium rounded-lg">
              {profileError}
            </div>
          ) : null}
          {profileSaved ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm p-3 font-medium rounded-lg">
              Saved
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm text-neutral-700 font-medium">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <p className="text-xs text-neutral-500">How you appear when reviewing tracks</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-700 font-medium">Artist name</label>
            <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} />
            <p className="text-xs text-neutral-500">How you appear when sharing your music</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-700 font-medium">Email</label>
            <div className="text-sm text-neutral-950">{email}</div>
          </div>

          <div>
            <Button variant="primary" onClick={saveProfile} isLoading={isSavingProfile}>
              Save changes
            </Button>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold text-neutral-950">Security</h3>
        </div>
        <div className="p-6 space-y-4">
          {resetError ? (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 font-medium rounded-lg">
              {resetError}
            </div>
          ) : null}
          {resetSent ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm p-3 font-medium rounded-lg">
              If an account exists for this email, we sent a reset link.
            </div>
          ) : null}

          <div className="text-sm text-neutral-700">
            {hasPassword
              ? "Change your password via email reset."
              : "Set a password (use email reset)."}
          </div>

          <Button variant="outline" onClick={sendPasswordReset} isLoading={isSendingReset}>
            Email me a reset link
          </Button>

          <Link
            href="/support"
            className="text-sm text-neutral-600 hover:text-neutral-950 font-medium"
          >
            Need help? Contact support
          </Link>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-white border-2 border-red-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-red-200 bg-red-50 px-6 py-4">
          <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
        </div>
        <div className="p-6 space-y-4">
          {deleteError ? (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 font-medium rounded-lg">
              {deleteError}
            </div>
          ) : null}

          <div className="text-sm text-neutral-700">
            Deleting your account is permanent.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Type DELETE to confirm</label>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          </div>

          <Button
            variant="destructive"
            onClick={deleteAccount}
            isLoading={isDeleting}
            disabled={deleteConfirm !== "DELETE"}
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}
