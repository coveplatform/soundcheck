"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-6">
      {/* Credit Balance Card */}
      <Card variant="soft" elevated>
        <CardHeader className="border-b border-purple-200 bg-purple-50">
          <CardTitle className="text-lg text-purple-900">Credit Balance</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Review credits</p>
              <p className="text-xs text-black/50 mt-0.5">Use credits to get reviews on your tracks</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-purple-600 tabular-nums">{reviewCredits}</p>
              <p className="text-xs text-black/40 font-medium">available</p>
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
          <div className="border-t border-purple-100 pt-4">
            <p className="text-sm font-bold text-black mb-3">Top up credits</p>

            {buyCreditsError ? (
              <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium mb-3 rounded-lg">
                {buyCreditsError}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => buyCredits(3)}
                disabled={isBuyingCredits}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-purple-200 bg-purple-50 px-3 py-4 hover:border-purple-400 hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <span className="text-lg font-black text-purple-700">3</span>
                <span className="text-xs font-medium text-purple-500">credits</span>
                <span className="text-sm font-bold text-black mt-1">$2.95</span>
              </button>
              <button
                onClick={() => buyCredits(10)}
                disabled={isBuyingCredits}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-purple-300 bg-purple-100 px-3 py-4 hover:border-purple-400 hover:bg-purple-150 transition-colors disabled:opacity-50 ring-2 ring-purple-300 ring-offset-1"
              >
                <span className="text-lg font-black text-purple-700">10</span>
                <span className="text-xs font-medium text-purple-500">credits</span>
                <span className="text-sm font-bold text-black mt-1">$7.95</span>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Best value</span>
              </button>
              <button
                onClick={() => buyCredits(25)}
                disabled={isBuyingCredits}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-purple-200 bg-purple-50 px-3 py-4 hover:border-purple-400 hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <span className="text-lg font-black text-purple-700">25</span>
                <span className="text-xs font-medium text-purple-500">credits</span>
                <span className="text-sm font-bold text-black mt-1">$14.95</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-lg">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {/* Verifying subscription after checkout */}
          {isVerifyingSubscription ? (
            <div className="bg-purple-50 border-2 border-purple-300 text-purple-800 text-sm p-4 font-medium rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                <span>Activating your subscription...</span>
              </div>
            </div>
          ) : null}

          {/* Subscription just activated success message */}
          {subscriptionJustActivated && !isVerifyingSubscription ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-sm p-4 font-medium rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">&#10003;</span>
                <span>Your Pro subscription is now active! You have {reviewCredits} review credits.</span>
              </div>
            </div>
          ) : null}

          {checkoutError ? (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {checkoutError}
            </div>
          ) : null}

          {isSubscribed ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-black">SoundCheck Pro</p>
                  <p className="text-xs text-black/50">$9.95/month</p>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  Active
                </div>
              </div>
              <div className="text-sm text-black/60">
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

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800 space-y-1">
                <p className="font-bold">Your Pro benefits:</p>
                <p>10 credits/month + sell your music + priority queue + PRO-tier reviews</p>
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
                  <p className="text-sm font-bold text-black">Current plan</p>
                  <p className="text-xs text-black/50">Free</p>
                </div>
                <div className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-full">
                  Not subscribed
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-base font-black text-black mb-2">Upgrade to SoundCheck Pro</p>
                  <p className="text-sm text-black/70">
                    <span className="font-bold text-black">$9.95/month</span> · Cancel anytime
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-black">10 credits every month</p>
                      <p className="text-xs text-black/60">Automatically added to your balance each billing cycle</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-black">Sell your music</p>
                      <p className="text-xs text-black/60">Custom links and affiliate tracking for your tracks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-black">Priority queue</p>
                      <p className="text-xs text-black/60">Your tracks get reviewed faster</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black shrink-0">&#10003;</span>
                    <div>
                      <p className="text-sm font-bold text-black">PRO-tier reviews</p>
                      <p className="text-xs text-black/60">Detailed, high-quality feedback from experienced reviewers</p>
                    </div>
                  </div>
                </div>

                <Button variant="primary" onClick={startCheckout} isLoading={isStartingCheckout} className="w-full">
                  Upgrade to Pro — $9.95/month
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {profileError ? (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {profileError}
            </div>
          ) : null}
          {profileSaved ? (
            <div className="bg-purple-50 border-2 border-purple-500 text-purple-800 text-sm p-3 font-medium">
              Saved
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-sm text-neutral-600 font-bold">Display name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <div className="text-xs text-neutral-600 font-mono">How you appear when reviewing tracks</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-600 font-bold">Artist name</div>
            <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} />
            <div className="text-xs text-neutral-600 font-mono">How you appear when sharing your music</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-neutral-600 font-bold">Email</div>
            <div className="text-sm font-mono text-black">{email}</div>
          </div>

          <div>
            <Button variant="primary" onClick={saveProfile} isLoading={isSavingProfile}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-lg">Security</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {resetError ? (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {resetError}
            </div>
          ) : null}
          {resetSent ? (
            <div className="bg-purple-50 border-2 border-purple-500 text-purple-800 text-sm p-3 font-medium">
              If an account exists for this email, we sent a reset link.
            </div>
          ) : null}

          <div className="text-sm text-neutral-600">
            {hasPassword
              ? "Change your password via email reset."
              : "Set a password (use email reset)."}
          </div>

          <Button variant="outline" onClick={sendPasswordReset} isLoading={isSendingReset}>
            Email me a reset link
          </Button>

          <Link
            href="/support"
            className="text-sm text-neutral-600 hover:text-black font-medium"
          >
            Need help? Contact support
          </Link>
        </CardContent>
      </Card>

      <Card variant="soft" elevated>
        <CardHeader className="border-b border-black/10">
          <CardTitle className="text-lg">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {deleteError ? (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {deleteError}
            </div>
          ) : null}

          <div className="text-sm text-neutral-600">
            Deleting your account is permanent.
          </div>

          <div className="space-y-2">
            <div className="text-sm font-bold text-neutral-600">Type DELETE to confirm</div>
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
        </CardContent>
      </Card>
    </div>
  );
}
