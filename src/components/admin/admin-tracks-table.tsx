"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RefundButton } from "@/components/admin/refund-button";
import { DeleteTrackButton } from "@/components/admin/delete-track-button";

const PACKAGE_NAMES: Record<string, string> = {
  STARTER: "Listener Pulse",
  STANDARD: "Release Ready",
  PRO: "Maximum Signal",
  DEEP_DIVE: "Deep Dive",
};

export type AdminTrackRow = {
  id: string;
  title: string;
  status: string;
  packageType: string | null;
  promoCode: string | null;
  createdAt: Date;
  reviewsRequested: number;
  reviewsCompleted: number;
  creditsSpent: number;
  isPublic: boolean;
  ArtistProfile: {
    subscriptionStatus: string | null;
    reviewCredits: number;
    User: { id: string; email: string };
  };
  Payment: { status: string | null; stripePaymentId: string | null } | null;
};

export function AdminTracksTable({ tracks }: { tracks: AdminTrackRow[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedCount = selectedIds.size;
  const allSelected = tracks.length > 0 && selectedCount === tracks.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedCount > 0 && selectedCount < tracks.length;
    }
  }, [selectedCount, tracks.length]);

  const toggleSelection = (trackId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(tracks.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const ok = window.confirm(
      `PERMANENTLY DELETE ${ids.length} track${ids.length > 1 ? "s" : ""}? This will remove the track(s) and all associated reviews, queue entries, and payment records. This cannot be undone.`
    );
    if (!ok) return;

    setBulkError(null);
    setIsBulkDeleting(true);

    const errors: string[] = [];
    let deletedCount = 0;

    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/tracks/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          errors.push(
            data?.error
              ? `${id}: ${data.error}`
              : `${id}: Failed to delete track`
          );
        } else {
          deletedCount += 1;
        }
      } catch {
        errors.push(`${id}: Failed to delete track`);
      }
    }

    setIsBulkDeleting(false);

    if (deletedCount > 0) {
      window.location.reload();
      return;
    }

    setBulkError(errors[0] ?? "Failed to delete selected tracks");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/55">
          {selectedCount
            ? `${selectedCount} track${selectedCount > 1 ? "s" : ""} selected`
            : "Select tracks to enable bulk delete"}
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={deleteSelected}
          disabled={!selectedCount || isBulkDeleting}
          isLoading={isBulkDeleting}
        >
          Delete Selected
        </Button>
      </div>
      {bulkError ? (
        <div className="border-b border-white/10 px-4 py-2 text-sm text-[#ff6b6b]">
          {bulkError}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-white/40">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                  checked={allSelected}
                  onChange={(event) => toggleAll(event.target.checked)}
                  aria-label="Select all tracks"
                />
              </th>
              <th className="text-left font-medium px-4 py-3">Title</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Reviews</th>
              <th className="text-left font-medium px-4 py-3">Package</th>
              <th className="text-left font-medium px-4 py-3">Credits</th>
              <th className="text-left font-medium px-4 py-3">Artist</th>
              <th className="text-left font-medium px-4 py-3">Created</th>
              <th className="text-left font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {tracks.map((track) => {
              const packageName = track.packageType
                ? PACKAGE_NAMES[track.packageType] || track.packageType
                : null;

              return (
                <tr key={track.id} className="text-white/75 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-transparent"
                      checked={selectedIds.has(track.id)}
                      onChange={() => toggleSelection(track.id)}
                      aria-label={`Select ${track.title}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link className="underline decoration-white/20 hover:text-[#6ee7ff]" href={`/admin/tracks/${track.id}`}>
                      {track.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-white/60">{track.status}</span>
                      {track.isPublic ? (
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-[#7cffc4]/10 text-[#7cffc4] rounded w-fit">
                          PUBLIC
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-white/5 text-white/40 rounded w-fit">
                          PRIVATE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {track.reviewsRequested > 0 ? (
                      (() => {
                        const remaining = track.reviewsRequested - track.reviewsCompleted;
                        return (
                          <span className={`font-medium text-sm ${remaining === 1 ? "text-[#fbbf24]" : remaining === 0 ? "text-[#7cffc4]" : "text-white/70"}`}>
                            {track.reviewsCompleted}/{track.reviewsRequested}
                            {remaining === 1 && <span className="ml-1 text-xs text-[#fbbf24]/70">(1 left)</span>}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {track.promoCode ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-[#6ee7ff]/10 text-[#6ee7ff] rounded">
                          PROMO
                        </span>
                        <span className="text-white/40 text-xs">
                          {track.promoCode}
                        </span>
                      </span>
                    ) : packageName ? (
                      <span className="inline-flex flex-col">
                        <span className="text-white/65">{packageName}</span>
                        <span className="text-xs text-white/40">{track.packageType}</span>
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white/65">
                        {track.creditsSpent} spent
                      </span>
                      <span className="text-xs text-white/40">
                        {track.ArtistProfile.reviewCredits} remaining
                      </span>
                      {track.Payment?.status === "COMPLETED" && (
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-[#7cffc4]/10 text-[#7cffc4] rounded w-fit">
                          PAID
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="underline decoration-white/20 hover:text-[#6ee7ff]"
                      href={`/admin/users/${track.ArtistProfile.User.id}`}
                    >
                      {track.ArtistProfile.User.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/45">
                    {new Date(track.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {track.Payment?.status === "COMPLETED" &&
                      track.status !== "CANCELLED" &&
                      track.Payment.stripePaymentId ? (
                        <RefundButton trackId={track.id} />
                      ) : null}
                      <DeleteTrackButton trackId={track.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
