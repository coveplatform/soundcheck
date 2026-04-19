"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrackSharingModalProps {
  trackId: string;
  trackTitle: string;
  sourceType: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PlatformStats {
  activeListeners: number;
  totalReviews: number;
}

export function TrackSharingModal({
  trackId,
  trackTitle,
  sourceType,
  isOpen,
  onClose,
  onSuccess,
}: TrackSharingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [canShare, setCanShare] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  const isUpload = sourceType === "UPLOAD";

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch(`/api/tracks/${trackId}/sharing`),
        fetch(`/api/platform-stats`).catch(() => null),
      ]).then(async ([sharingRes, statsRes]) => {
        if (sharingRes.ok) {
          const data = await sharingRes.json();
          setCanShare(data.eligibility.canShare);
          setEligibilityReason(data.eligibility.reason);

          if (data.sharingEnabled && data.publicUrl) {
            setPublicUrl(data.publicUrl);
          }
        }

        if (statsRes && statsRes.ok) {
          const stats = await statsRes.json();
          setPlatformStats(stats);
        }
      });
    }
  }, [isOpen, trackId]);

  const handleEnableSharing = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tracks/${trackId}/sharing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharingEnabled: true,
          showReviewsOnPublicPage: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to enable sharing");
      }

      setPublicUrl(data.publicUrl);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess?.();
    router.refresh();
    onClose();
    setStep(1);
    setPublicUrl(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share "{trackTitle}"</DialogTitle>
          <DialogDescription>
            Make your track publicly visible with listener feedback stats
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Enable sharing */}
        {step === 1 && (
          <div className="space-y-4">
            {!canShare && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  {eligibilityReason || "This track cannot be shared"}
                </p>
                <p className="text-sm text-yellow-800">
                  Only uploaded tracks (MP3/WAV) can be shared publicly. Linked tracks from SoundCloud,
                  YouTube, or Bandcamp are not eligible.
                </p>
              </div>
            )}

            {platformStats && canShare && (
              <div className="p-4 bg-lime-50 border border-lime-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-lime-700" />
                  <div>
                    <p className="text-base font-semibold text-lime-900">
                      {platformStats.activeListeners.toLocaleString()}+ Active Listeners
                    </p>
                    <p className="text-sm text-lime-800">
                      {platformStats.totalReviews.toLocaleString()}+ reviews on the platform
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canShare && (
              <div className="p-4 border border-neutral-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold">What gets shared</p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• Public page with listener intent stats</li>
                  <li>• Score breakdown and producer quotes</li>
                  <li>• No audio download — listeners view stats only</li>
                </ul>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-900">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              {canShare && (
                <Button
                  onClick={handleEnableSharing}
                  disabled={loading}
                  className="flex-1 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black"
                >
                  {loading ? "Enabling..." : "Enable Sharing"}
                </Button>
              )}
              {!canShare && (
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && publicUrl && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lime-100 mb-3">
                <Check className="h-6 w-6 text-lime-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Sharing Enabled!</h3>
              <p className="text-sm text-neutral-600">
                Your track is now publicly shareable. Copy the link below:
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <Label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 block">
                Public Link
              </Label>
              <div className="flex items-center gap-2">
                <Input value={publicUrl} readOnly className="text-sm" />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Preview Page
                </Button>
              </a>
              <Button
                onClick={handleFinish}
                className="flex-1 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
