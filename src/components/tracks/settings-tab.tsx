"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrackUpdateSourceForm } from "@/components/artist/track-update-source-form";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import {
  ExternalLink,
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";

interface SettingsTabProps {
  track: {
    id: string;
    title: string;
    sourceUrl: string;
    sourceType: string;
    status: string;
    linkIssueNotifiedAt: Date | null;
    feedbackFocus: string | null;
  };
  payment: {
    status: string;
  } | null;
  canUpdateSource: boolean;
  completedReviewCount?: number;
}

export function SettingsTab({ track, payment, canUpdateSource, completedReviewCount = 0 }: SettingsTabProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("You must type DELETE to confirm");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/tracks/${track.id}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete track");
      router.push("/tracks?deleted=true");
      router.refresh();
    } catch (error: any) {
      setDeleteError(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Link Issue Warning */}
      {track.linkIssueNotifiedAt && track.status !== "CANCELLED" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Your link appears to be broken</p>
            <p className="text-sm text-red-600 mt-1 leading-relaxed">
              Reviewers can&apos;t listen until this is fixed. Update the link below to keep reviews flowing.
            </p>
          </div>
        </div>
      )}

      {/* Track Source */}
      <div className="rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/6">
          <p className="text-xs font-semibold text-black/40">Track Source</p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-black/40 mb-2">Source URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-black/[0.03] border border-black/8 rounded-lg px-3 py-2 font-mono break-all text-black/60">
                {track.sourceUrl}
              </code>
              <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="border border-black/15 rounded-xl h-9 px-3 hover:bg-black/5 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5 text-black/50" />
                </Button>
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-black/40 mb-1">Source Type</p>
            <p className="text-sm font-medium text-black/60 capitalize">{track.sourceType.toLowerCase().replace("_", " ")}</p>
          </div>
          {canUpdateSource && (
            <div className="pt-4 border-t border-black/6">
              <TrackUpdateSourceForm trackId={track.id} initialUrl={track.sourceUrl} />
            </div>
          )}
        </div>
      </div>

      {/* Artist Note */}
      {track.feedbackFocus && (
        <div className="rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/6">
            <p className="text-xs font-semibold text-black/40">Artist Note</p>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm text-black/60 leading-relaxed">{track.feedbackFocus}</p>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100">
          <p className="text-xs font-semibold text-red-400">Danger Zone</p>
        </div>
        <div className="px-5 py-5">
          {track.status === "QUEUED" && (
            <div>
              <p className="text-sm text-black/50 mb-4 leading-relaxed">
                Cancel this track and stop reviews.
                {payment?.status === "COMPLETED" && " Your payment will be refunded."}
              </p>
              <TrackCancelButton trackId={track.id} willRefund={payment?.status === "COMPLETED"} />
            </div>
          )}

          {track.status === "CANCELLED" && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-600">This track was cancelled</p>
                <p className="text-sm text-black/40 mt-1">
                  {payment?.status === "REFUNDED"
                    ? "Your payment has been refunded."
                    : payment?.status === "COMPLETED"
                    ? "Refund is processing or pending."
                    : "No payment was captured."}
                </p>
              </div>
              <span className="text-xs font-medium text-black/25 bg-black/6 px-2 py-1 rounded-full">Cancelled</span>
            </div>
          )}

          {track.status !== "QUEUED" && track.status !== "CANCELLED" && (
            <div>
              {!showDeleteConfirm ? (
                <div>
                  <p className="text-sm text-black/50 mb-4 leading-relaxed">
                    Delete this track permanently. This action cannot be undone.
                  </p>
                  {completedReviewCount > 0 && (
                    <p className="text-xs text-black/40 mb-4 leading-relaxed">
                      This track has <strong className="text-black/60 font-semibold">{completedReviewCount} completed review{completedReviewCount !== 1 ? "s" : ""}</strong>.
                      {" "}Deleting will remove all review data and affect reviewer stats.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-xl text-xs h-9"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete Track
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">Are you absolutely sure?</p>
                    <p className="text-xs text-red-700 mb-2">This will permanently delete:</p>
                    <ul className="text-xs text-red-700 space-y-1 mb-3">
                      <li>— The track &ldquo;{track.title}&rdquo;</li>
                      <li>— All {completedReviewCount} review{completedReviewCount !== 1 ? "s" : ""} and feedback</li>
                      <li>— Payment records</li>
                      <li>— Reviewer earnings history for this track</li>
                    </ul>
                    <p className="text-xs font-semibold text-red-700">This action cannot be undone.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black/40 mb-2">
                      Type <code className="bg-black/6 rounded px-1.5 py-0.5 font-mono text-black/60 text-[11px]">DELETE</code> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 border border-black/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 font-mono text-sm"
                      disabled={isDeleting}
                    />
                  </div>
                  {deleteError && (
                    <p className="text-xs text-red-500 font-medium">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-xl text-xs h-9"
                      onClick={handleDelete}
                      disabled={isDeleting || deleteConfirmText !== "DELETE"}
                    >
                      {isDeleting ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Deleting...</>
                      ) : (
                        <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete Permanently</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border border-black/15 text-black/50 hover:text-black font-medium rounded-xl text-xs h-9"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setDeleteError(null); }}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
