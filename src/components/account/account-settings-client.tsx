"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountSettingsClient({
  initialName,
  email,
  isArtist,
  isReviewer,
  hasPassword,
  subscription,
}: {
  initialName: string;
  email: string;
  isArtist: boolean;
  isReviewer: boolean;
  hasPassword: boolean;
  subscription: {
    status: string | null;
    tier: string | null;
    currentPeriodEnd: Date | null;
    canceledAt: Date | null;
    totalTracks: number;
  } | null;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function saveProfile() {
    setProfileError("");
    setProfileSaved(false);
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() ? name.trim() : null }),
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

  const isSubscribed = subscription?.status === "active";
  const hasFreeTrial = !isSubscribed && (subscription?.totalTracks || 0) < 1;

  return (
    <div className="space-y-6">
      {/* Subscription Card */}
      {isArtist && subscription && (
        <Card variant="soft" elevated>
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-lg">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {isSubscribed ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-black">MixReflect Pro</p>
                    <p className="text-xs text-black/50">$9.95/month</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    Active
                  </div>
                </div>
                <div className="text-sm text-black/60">
                  {subscription.canceledAt ? (
                    <p>
                      Your subscription will end on{" "}
                      {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
                    </p>
                  ) : (
                    <p>
                      Next billing date:{" "}
                      {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
                    </p>
                  )}
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
                <div className="text-sm text-black/60">
                  {hasFreeTrial ? (
                    <p>
                      You're on the free trial. You can upload 1 track for free.
                    </p>
                  ) : (
                    <p>
                      Subscribe to upload unlimited tracks and request reviews.
                    </p>
                  )}
                </div>
                <Link href="/artist/submit">
                  <Button variant="primary">
                    {hasFreeTrial ? "Upload Your Free Track" : "Subscribe Now"}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
            <div className="bg-lime-50 border-2 border-lime-500 text-lime-800 text-sm p-3 font-medium">
              Saved
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-sm text-neutral-600 font-bold">Display name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <div className="text-xs text-neutral-600 font-mono">Visible in your dashboard</div>
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
          <CardTitle className="text-lg">Roles</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-600 font-medium">Artist</span>
            <span className="font-bold text-black">{isArtist ? "Enabled" : "Not enabled"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-600 font-medium">Reviewer</span>
            <span className="font-bold text-black">{isReviewer ? "Enabled" : "Not enabled"}</span>
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
            <div className="bg-lime-50 border-2 border-lime-500 text-lime-800 text-sm p-3 font-medium">
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
