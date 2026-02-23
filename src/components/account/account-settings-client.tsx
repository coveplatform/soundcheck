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

  // Suppress unused warning — credits shown in page hero, prop kept for API compat
  void initialReviewCredits;

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
      const res = await fetch("/api/account/delete", { method: "DELETE" });
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
    <div className="space-y-4">

      {/* ── PROFILE ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Profile</p>
          <h2 className="text-xl font-black text-black tracking-tight mt-0.5">Your details</h2>
        </div>

        <div className="px-6 pb-6 space-y-5 border-t border-black/6 pt-5">
          {profileError && (
            <div className="bg-red-500 rounded-xl px-4 py-3">
              <p className="text-sm font-black text-white">{profileError}</p>
            </div>
          )}
          {profileSaved && (
            <div className="bg-lime-400 border-2 border-black rounded-xl px-4 py-3">
              <p className="text-sm font-black text-black">Saved.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/40">
              Display name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <p className="text-xs text-black/30 font-medium">
              How you appear when reviewing tracks
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/40">
              Artist name
            </label>
            <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} />
            <p className="text-xs text-black/30 font-medium">
              How you appear when sharing your music
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/40">
              Email
            </label>
            <p className="text-sm font-bold text-black">{email}</p>
          </div>

          <Button
            variant="primary"
            onClick={saveProfile}
            isLoading={isSavingProfile}
            className="font-black"
          >
            Save changes
          </Button>
        </div>
      </div>

      {/* ── SECURITY ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Security</p>
          <h2 className="text-xl font-black text-black tracking-tight mt-0.5">Password</h2>
        </div>

        <div className="px-6 pb-6 space-y-4 border-t border-black/6 pt-5">
          {resetError && (
            <div className="bg-red-500 rounded-xl px-4 py-3">
              <p className="text-sm font-black text-white">{resetError}</p>
            </div>
          )}
          {resetSent && (
            <div className="bg-lime-400 border-2 border-black rounded-xl px-4 py-3">
              <p className="text-sm font-black text-black">Reset link sent — check your email.</p>
            </div>
          )}

          <p className="text-sm font-medium text-black/50">
            {hasPassword
              ? "Change your password via email reset."
              : "Set a password via email reset."}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              onClick={sendPasswordReset}
              isLoading={isSendingReset}
              className="font-black"
            >
              Email me a reset link
            </Button>
            <Link
              href="/support"
              className="text-sm font-bold text-black/35 hover:text-black transition-colors"
            >
              Need help?
            </Link>
          </div>
        </div>
      </div>

      {/* ── DANGER ZONE ─────────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-red-300 overflow-hidden">
        <div className="bg-red-500 px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-0.5">
            Irreversible
          </p>
          <h2 className="text-xl font-black text-white tracking-tight leading-tight">
            Delete account
          </h2>
        </div>

        <div className="bg-white px-6 py-6 space-y-4">
          {deleteError && (
            <div className="bg-red-500 rounded-xl px-4 py-3">
              <p className="text-sm font-black text-white">{deleteError}</p>
            </div>
          )}

          <p className="text-sm font-medium text-black/60">
            Permanent. No undo. All your data will be deleted.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-red-500">
              Type DELETE to confirm
            </label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="border-red-200 focus:border-red-400"
            />
          </div>

          <Button
            variant="destructive"
            onClick={deleteAccount}
            isLoading={isDeleting}
            disabled={deleteConfirm !== "DELETE"}
            className="font-black"
          >
            Delete account
          </Button>
        </div>
      </div>

    </div>
  );
}
