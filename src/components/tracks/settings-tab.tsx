"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackUpdateSourceForm } from "@/components/artist/track-update-source-form";
import { TrackCancelButton } from "@/components/artist/track-cancel-button";
import {
  Settings as SettingsIcon,
  ExternalLink,
  Trash2,
  AlertCircle
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
}

export function SettingsTab({ track, payment, canUpdateSource }: SettingsTabProps) {
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
                <p className="text-sm text-black/60 mb-2">
                  Delete this track permanently. This action cannot be undone.
                </p>
                <Button
                  variant="airy"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${track.title}"? This cannot be undone.`)) {
                      // TODO: Implement delete functionality
                      alert("Delete functionality coming soon");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Track
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
