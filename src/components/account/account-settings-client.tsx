"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountSettingsClient({
  initialName,
  artistName: initialArtistName,
  email,
  hasPassword,
  reviewCredits: initialReviewCredits,
}: {
  initialName: string;
  artistName: string | null;
  email: string;
  hasPassword: boolean;
  reviewCredits: number;
}) {
  const router = useRouter();

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
              <p className="text-3xl font-bold text-purple-600 tabular-nums">{initialReviewCredits}</p>
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
