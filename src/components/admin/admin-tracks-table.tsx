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
  desiredReviews: number | null;
  artist: {
    subscriptionStatus: string | null;
    freeReviewCredits: number;
    user: { id: string; email: string };
  };
  payment: { status: string | null; stripePaymentId: string | null } | null;
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
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-neutral-600">
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
        <div className="border-b border-neutral-200 px-4 py-2 text-sm text-red-600">
          {bulkError}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300"
                  checked={allSelected}
                  onChange={(event) => toggleAll(event.target.checked)}
                  aria-label="Select all tracks"
                />
              </th>
              <th className="text-left font-medium px-4 py-3">Title</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Package</th>
              <th className="text-left font-medium px-4 py-3">Payment</th>
              <th className="text-left font-medium px-4 py-3">Artist</th>
              <th className="text-left font-medium px-4 py-3">Created</th>
              <th className="text-left font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tracks.map((track) => {
              const isPro = track.artist.subscriptionStatus === "active";
              const packageName = track.packageType
                ? PACKAGE_NAMES[track.packageType] || track.packageType
                : null;

              return (
                <tr key={track.id} className="text-neutral-700">
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300"
                      checked={selectedIds.has(track.id)}
                      onChange={() => toggleSelection(track.id)}
                      aria-label={`Select ${track.title}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/admin/tracks/${track.id}`}>
                      {track.title}
                    </Link>
                    {track.desiredReviews && (
                      <span className="ml-2 text-xs text-neutral-400">
                        ({track.desiredReviews} reviews)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{track.status}</td>
                  <td className="px-4 py-3">
                    {track.promoCode ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded">
                          PROMO
                        </span>
                        <span className="text-neutral-400 text-xs">
                          {track.promoCode}
                        </span>
                      </span>
                    ) : packageName ? (
                      <span className="inline-flex flex-col">
                        <span>{packageName}</span>
                        <span className="text-xs text-neutral-400">{track.packageType}</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!track.payment && track.status !== "PENDING_PAYMENT" ? (
                      <span className="px-1.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded">
                        REVIEW CREDITS
                      </span>
                    ) : (
                      track.payment?.status ?? ""
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <Link
                        className="underline"
                        href={`/admin/users/${track.artist.user.id}`}
                      >
                        {track.artist.user.email}
                      </Link>
                      <span className="inline-flex items-center gap-1 mt-0.5">
                        {isPro ? (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded">
                            PRO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-neutral-100 text-neutral-500 rounded">
                            FREE
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">
                          {track.artist.freeReviewCredits} credits
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(track.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {track.payment?.status === "COMPLETED" &&
                      track.status !== "CANCELLED" &&
                      track.payment.stripePaymentId ? (
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
