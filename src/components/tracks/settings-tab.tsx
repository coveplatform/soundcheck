"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

function Section({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden ${className ?? ""}`}>
      <div className="bg-black px-5 py-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</p>
      </div>
      <div className="bg-white p-5">
        {children}
      </div>
    </div>
  );
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
    <div className="space-y-5">
      {/* Track Source */}
      <Section label="Track Source">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Source URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-black/5 border-2 border-black/10 px-3 py-2 font-mono break-all">
                {track.sourceUrl}
              </code>
              <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="border-2 border-black rounded-none font-black h-9 px-3 shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Source Type</p>
            <p className="text-sm font-bold capitalize">{track.sourceType.toLowerCase().replace("_", " ")}</p>
          </div>
          {canUpdateSource && (
            <div className="pt-4 border-t-2 border-black/10">
              <TrackUpdateSourceForm trackId={track.id} initialUrl={track.sourceUrl} />
            </div>
          )}
        </div>
      </Section>

      {/* Artist Note */}
      {track.feedbackFocus && (
        <Section label="Artist Note">
          <p className="text-sm text-black/80 leading-relaxed">{track.feedbackFocus}</p>
        </Section>
      )}

      {/* Link Issue Warning */}
      {track.linkIssueNotifiedAt && track.status !== "CANCELLED" && (
        <div className="border-2 border-red-500 shadow-[4px_4px_0_rgba(239,68,68,1)] overflow-hidden">
          <div className="bg-red-500 px-5 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Track Link Issue</p>
          </div>
          <div className="bg-red-50 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-900">Your link appears to be broken</p>
              <p className="text-sm text-red-700 mt-1">
                Reviewers can&apos;t listen until this is fixed. Update the link above to keep reviews flowing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border-2 border-red-400 shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-red-500 px-5 py-3 flex items-center gap-2">
          <Trash2 className="h-3.5 w-3.5 text-white" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Danger Zone</p>
        </div>
        <div className="bg-white p-5">
          {track.status === "QUEUED" && (
            <div>
              <p className="text-sm text-black/60 mb-3">
                Cancel this track and stop reviews.
                {payment?.status === "COMPLETED" && " Your payment will be refunded."}
              </p>
              <TrackCancelButton trackId={track.id} willRefund={payment?.status === "COMPLETED"} />
            </div>
          )}

          {track.status === "CANCELLED" && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-red-700">This track was cancelled</p>
                <p className="text-sm text-red-600">
                  {payment?.status === "REFUNDED"
                    ? "Your payment has been refunded."
                    : payment?.status === "COMPLETED"
                    ? "Refund is processing or pending."
                    : "No payment was captured."}
                </p>
              </div>
              <span className="text-sm text-black/40 font-black font-mono">CANCELLED</span>
            </div>
          )}

          {track.status !== "QUEUED" && track.status !== "CANCELLED" && (
            <div>
              {!showDeleteConfirm ? (
                <>
                  <p className="text-sm text-black/60 mb-3">
                    Delete this track permanently. This action cannot be undone.
                  </p>
                  {completedReviewCount > 0 && (
                    <div className="mb-4 p-3 border-2 border-red-300 bg-red-50">
                      <p className="text-sm font-black text-red-900 mb-1">⚠ Warning</p>
                      <p className="text-sm text-red-700">
                        This track has <strong>{completedReviewCount} completed review{completedReviewCount !== 1 ? "s" : ""}</strong>.
                        Deleting will remove all review data and affect reviewer stats.
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="border-2 border-red-400 text-red-700 hover:bg-red-50 font-black rounded-none"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Track
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border-2 border-red-400 bg-red-50">
                    <p className="font-black text-red-900 mb-2">⚠ Are you absolutely sure?</p>
                    <p className="text-sm text-red-800 mb-2">This will permanently delete:</p>
                    <ul className="text-sm text-red-800 list-disc list-inside space-y-1 mb-3">
                      <li>The track &ldquo;{track.title}&rdquo;</li>
                      <li>All {completedReviewCount} review{completedReviewCount !== 1 ? "s" : ""} and feedback</li>
                      <li>Payment records</li>
                      <li>Reviewer earnings history for this track</li>
                    </ul>
                    <p className="text-sm font-black text-red-900">This action cannot be undone.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                      Type <code className="bg-black text-white px-2 py-0.5 font-mono">DELETE</code> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono"
                      disabled={isDeleting}
                    />
                  </div>
                  {deleteError && (
                    <p className="text-sm text-red-600 font-black">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-2 border-red-400 text-red-700 hover:bg-red-50 font-black rounded-none"
                      onClick={handleDelete}
                      disabled={isDeleting || deleteConfirmText !== "DELETE"}
                    >
                      {isDeleting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                      ) : (
                        <><Trash2 className="h-4 w-4 mr-2" />Delete Permanently</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 border-black font-black rounded-none"
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
