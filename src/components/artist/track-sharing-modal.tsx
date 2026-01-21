"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, Zap, Lock, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

  const [sharingMode, setSharingMode] = useState<"EXPOSURE" | "SALES">("EXPOSURE");
  const [salePrice, setSalePrice] = useState("5.00");
  const [campaignName, setCampaignName] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const [canShare, setCanShare] = useState(false);
  const [canSell, setCanSell] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);

  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  const isUpload = sourceType === "UPLOAD";

  // Fetch eligibility and platform stats
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch(`/api/tracks/${trackId}/sharing`),
        fetch(`/api/platform-stats`).catch(() => null),
      ]).then(async ([sharingRes, statsRes]) => {
        if (sharingRes.ok) {
          const data = await sharingRes.json();
          setCanShare(data.eligibility.canShare);
          setCanSell(data.eligibility.canSell);
          setEligibilityReason(data.eligibility.reason);

          // If already configured, prefill
          if (data.sharingEnabled) {
            setSharingMode(data.sharingMode || "EXPOSURE");
            if (data.salePrice) {
              setSalePrice((data.salePrice / 100).toFixed(2));
            }
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
          sharingMode,
          salePrice: sharingMode === "SALES" ? Math.round(parseFloat(salePrice) * 100) : undefined,
          showReviewsOnPublicPage: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresUpgrade) {
          setError(data.error);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to enable sharing");
      }

      // Proceed to step 2 (create first affiliate link)
      setStep(2);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreateAffiliateLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tracks/${trackId}/affiliate-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName || "Main Link",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      setGeneratedUrl(data.url);
      setStep(3);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess?.();
    router.refresh();
    onClose();
    // Reset state
    setStep(1);
    setGeneratedUrl(null);
    setCampaignName("");
  };

  const handleUpgrade = () => {
    router.push("/artist/submit");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enable Sharing for "{trackTitle}"</DialogTitle>
          <DialogDescription>
            Share your track and track engagement with affiliate links
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Choose Mode */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Eligibility Check */}
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

            {/* Platform Stats Banner */}
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

            {/* Sharing Mode Selection */}
            {canShare && (
              <>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Choose Sharing Mode</Label>
                  <div className="space-y-2">
                    {/* Exposure Mode */}
                    <button
                      onClick={() => setSharingMode("EXPOSURE")}
                      className={cn(
                        "w-full p-4 border rounded-lg text-left transition-colors",
                        sharingMode === "EXPOSURE"
                          ? "border-lime-500 bg-lime-50"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-neutral-600" />
                            <h4 className="font-semibold text-sm">Exposure Only</h4>
                          </div>
                          <ul className="space-y-1 text-xs text-neutral-600">
                            <li>• Public streaming</li>
                            <li>• Track clicks and plays</li>
                            <li>• Drive traffic to your platforms</li>
                          </ul>
                        </div>
                        {sharingMode === "EXPOSURE" && (
                          <div className="h-5 w-5 rounded-full bg-lime-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Sales Mode */}
                    <div
                      className={cn(
                        "w-full p-4 border rounded-lg transition-colors",
                        !canSell && "bg-neutral-50",
                        sharingMode === "SALES" && canSell && "border-lime-500 bg-lime-50",
                        canSell && sharingMode !== "SALES" && "border-neutral-200 bg-white"
                      )}
                    >
                      <button
                        onClick={() => canSell && setSharingMode("SALES")}
                        disabled={!canSell}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-neutral-600" />
                              <h4 className="font-semibold text-sm">Paid Downloads</h4>
                              {!canSell && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-black text-white rounded">
                                  PRO
                                </span>
                              )}
                            </div>
                            <ul className="space-y-1 text-xs text-neutral-600">
                              <li>• Everything in Exposure mode</li>
                              <li>• Sell downloads via Stripe</li>
                              <li>• You keep 70% of sales</li>
                            </ul>
                          </div>
                          {sharingMode === "SALES" && canSell && (
                            <div className="h-5 w-5 rounded-full bg-lime-500 flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Upgrade CTA inside the box */}
                      {!canSell && (
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <p className="text-xs text-neutral-600 mb-2">
                            {eligibilityReason || "Upgrade to Pro to sell downloads and earn from your tracks"}
                          </p>
                          <Button
                            onClick={handleUpgrade}
                            size="sm"
                            className="w-full bg-black text-white hover:bg-neutral-800"
                          >
                            Upgrade to Pro - $9.95/mo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Input (Sales Mode) */}
                {sharingMode === "SALES" && canSell && (
                  <div>
                    <Label htmlFor="salePrice" className="text-sm font-semibold mb-2 block">
                      Sale Price
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">$</span>
                      <Input
                        id="salePrice"
                        type="number"
                        min="1"
                        max="100"
                        step="0.50"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="w-24"
                      />
                      <span className="text-xs text-neutral-500">min $1, max $100</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      You'll earn ${(parseFloat(salePrice) * 0.7).toFixed(2)} per sale (70%)
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-900">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={onClose} disabled={loading} size="default">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEnableSharing}
                    disabled={loading || !canShare}
                    className="flex-1 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black"
                  >
                    {loading ? "Enabling..." : "Continue"}
                  </Button>
                </div>
              </>
            )}

            {!canShare && (
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Create First Link */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Create Your First Campaign Link</h3>
              <p className="text-sm text-neutral-600">
                Give this link a name to help you track where clicks come from
              </p>
            </div>

            <div>
              <Label htmlFor="campaignName" className="text-sm font-semibold mb-2 block">
                Campaign Name (Optional)
              </Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Twitter January, Instagram Bio"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Leave blank to use "Main Link"
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-900">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAffiliateLink}
                disabled={loading}
                className="flex-1 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black"
              >
                {loading ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && generatedUrl && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lime-100 mb-3">
                <Check className="h-6 w-6 text-lime-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Sharing Enabled!</h3>
              <p className="text-sm text-neutral-600">
                Your track is now publicly shareable. Copy your link below:
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <Label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 block">
                Your Campaign Link
              </Label>
              <div className="flex items-center gap-2">
                <Input value={generatedUrl} readOnly className="text-sm" />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUrl);
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
              <p className="text-sm font-semibold text-lime-900 mb-2">What's next?</p>
              <ul className="text-xs text-lime-800 space-y-1">
                <li>• Share your link on social media</li>
                <li>• Track clicks, plays, and sales in your Sales Hub</li>
                <li>• Create more campaign links for different channels</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleFinish}
                className="flex-1 bg-lime-400 hover:bg-lime-300 text-black border-2 border-black"
              >
                Done
              </Button>
              <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  Preview
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
