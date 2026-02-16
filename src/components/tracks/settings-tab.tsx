"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackUpdateSourceForm } from "@/components/artist/track-update-source-form";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import {
  Settings as SettingsIcon,
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
      const res = await fetch(`/api/tracks/${track.id}/delete`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete track");
      }

      // Success - redirect to tracks page
      router.push("/tracks?deleted=true");
      router.refresh();
    } catch (error: any) {
      setDeleteError(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Track Source */}
      <Card variant="soft" elevated>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Track Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-2">
                Source URL
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-neutral-100 px-3 py-2 rounded font-mono break-all">
                  {track.sourceUrl}
                </code>
                <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="airy">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-2">
                Source Type
              </p>
              <p className="text-sm font-medium capitalize">
                {track.sourceType.toLowerCase().replace("_", " ")}
              </p>
            </div>

            {canUpdateSource && (
              <div className="pt-4 border-t border-black/10">
                <TrackUpdateSourceForm
                  trackId={track.id}
                  initialUrl={track.sourceUrl}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Focus */}
      {track.feedbackFocus && (
        <Card variant="soft" elevated>
          <CardHeader>
            <CardTitle>Artist Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-black/80">{track.feedbackFocus}</p>
          </CardContent>
        </Card>
      )}

      {/* Link Issue Warning */}
      {track.linkIssueNotifiedAt && track.status !== "CANCELLED" && (
        <Card
          variant="soft"
          elevated
          className="border border-red-200 bg-red-50"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-red-900">Track link issue</p>
                <p className="text-sm text-red-700 mt-1">
                  Your link appears to be broken, private, or unavailable. Reviewers can't listen until this is fixed.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Update the link above to keep reviews flowing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card variant="soft" elevated className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {track.status === "QUEUED" && (
              <div>
                <p className="text-sm text-black/60 mb-3">
                  Cancel this track and stop reviews.
                  {payment?.status === "COMPLETED" && " Your payment will be refunded."}
                </p>
                <TrackCancelButton
                  trackId={track.id}
                  willRefund={payment?.status === "COMPLETED"}
                />
              </div>
            )}

            {track.status === "CANCELLED" && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-red-700">This track was cancelled</p>
                  <p className="text-sm text-red-600">
                    {payment?.status === "REFUNDED"
                      ? "Your payment has been refunded."
                      : payment?.status === "COMPLETED"
                      ? "Refund is processing or pending."
                      : "No payment was captured."}
                  </p>
                </div>
                <div className="text-sm text-neutral-500 font-mono">CANCELLED</div>
              </div>
            )}

            {track.status !== "QUEUED" && track.status !== "CANCELLED" && (
              <div>
                {!showDeleteConfirm ? (
                  <>
                    <p className="text-sm text-black/60 mb-2">
                      Delete this track permanently. This action cannot be undone.
                    </p>
                    {completedReviewCount > 0 && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-bold text-red-900 mb-1">⚠️ Warning</p>
                        <p className="text-sm text-red-700">
                          This track has <strong>{completedReviewCount} completed review{completedReviewCount !== 1 ? "s" : ""}</strong>.
                          Deleting will remove all review data and affect reviewer stats.
                        </p>
                      </div>
                    )}
                    <Button
                      variant="airy"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Track
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-100 border-2 border-red-300 rounded-lg">
                      <p className="font-bold text-red-900 mb-2">⚠️ Are you absolutely sure?</p>
                      <p className="text-sm text-red-800 mb-2">
                        This will permanently delete:
                      </p>
                      <ul className="text-sm text-red-800 list-disc list-inside space-y-1 mb-3">
                        <li>The track "{track.title}"</li>
                        <li>All {completedReviewCount} review{completedReviewCount !== 1 ? "s" : ""} and feedback</li>
                        <li>Payment records</li>
                        <li>Reviewer earnings history for this track</li>
                      </ul>
                      <p className="text-sm font-bold text-red-900">
                        This action cannot be undone.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Type <code className="bg-red-100 px-2 py-0.5 rounded font-mono text-red-900">DELETE</code> to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isDeleting}
                      />
                    </div>

                    {deleteError && (
                      <p className="text-sm text-red-600 font-semibold">{deleteError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="airy"
                        className="border-red-300 text-red-700 hover:bg-red-50 font-bold"
                        onClick={handleDelete}
                        disabled={isDeleting || deleteConfirmText !== "DELETE"}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permanently
                          </>
                        )}
                      </Button>
                      <Button
                        variant="airy"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                          setDeleteError(null);
                        }}
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
        </CardContent>
      </Card>
    </div>
  );
}
