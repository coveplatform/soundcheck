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
          <div className="space-y-6">
            {/* Eligibility Check */}
            {!canShare && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
                <p className="text-sm font-bold text-yellow-900">
                  {eligibilityReason || "This track cannot be shared"}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Only uploaded tracks (MP3/WAV) can be shared publicly. Linked tracks from SoundCloud,
                  YouTube, or Bandcamp are not eligible.
                </p>
              </div>
            )}

            {/* Platform Stats Banner */}
            {platformStats && canShare && (
              <div className="p-4 bg-lime-100 border-2 border-lime-400 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-lime-700" />
                  <div>
                    <p className="text-lg font-bold text-lime-900">
                      {platformStats.activeListeners.toLocaleString()}+ Active Listeners
                    </p>
                    <p className="text-sm text-lime-700">
                      {platformStats.totalReviews.toLocaleString()}+ reviews completed on the platform
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sharing Mode Selection */}
            {canShare && (
              <>
                <div>
                  <Label className="text-base font-bold mb-3 block">Choose Sharing Mode</Label>
                  <div className="space-y-3">
                    {/* Exposure Mode */}
                    <button
                      onClick={() => setSharingMode("EXPOSURE")}
                      className={cn(
                        "w-full p-4 border-2 rounded-xl text-left transition-all",
                        sharingMode === "EXPOSURE"
                          ? "border-lime-500 bg-lime-50"
                          : "border-black/10 bg-white hover:border-black/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-lime-600" />
                            <h4 className="font-bold text-black">Exposure Only (Free)</h4>
                          </div>
                          <ul className="mt-2 space-y-1 text-sm text-black/70">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-lime-600" />
                              Public can stream your track
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-lime-600" />
                              Track clicks and plays
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-lime-600" />
                              Drive traffic to your platforms
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-lime-600" />
                              Show off your reviews
                            </li>
                          </ul>
                        </div>
                        {sharingMode === "EXPOSURE" && (
                          <div className="ml-4">
                            <div className="h-6 w-6 rounded-full bg-lime-500 border-2 border-lime-600 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Sales Mode */}
                    <button
                      onClick={() => canSell && setSharingMode("SALES")}
                      disabled={!canSell}
                      className={cn(
                        "w-full p-4 border-2 rounded-xl text-left transition-all",
                        sharingMode === "SALES"
                          ? "border-purple-500 bg-purple-50"
                          : !canSell
                          ? "border-black/10 bg-neutral-50 opacity-50 cursor-not-allowed"
                          : "border-black/10 bg-white hover:border-black/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-purple-600" />
                            <h4 className="font-bold text-black">Paid Downloads (Pro)</h4>
                            {!canSell && <Lock className="h-4 w-4 text-black/40" />}
                          </div>
                          <ul className="mt-2 space-y-1 text-sm text-black/70">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-purple-600" />
                              Everything in Exposure mode
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-purple-600" />
                              Sell downloads via Stripe
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-purple-600" />
                              You keep 70% of sales
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-purple-600" />
                              Affiliates earn 10% commission
                            </li>
                          </ul>
                        </div>
                        {sharingMode === "SALES" && canSell && (
                          <div className="ml-4">
                            <div className="h-6 w-6 rounded-full bg-purple-500 border-2 border-purple-600 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {!canSell && (
                      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <p className="text-sm text-black/70">
                          {eligibilityReason || "Upgrade to Pro to enable sales mode"}
                        </p>
                        <Button
                          onClick={handleUpgrade}
                          size="sm"
                          className="mt-2 bg-purple-500 hover:bg-purple-600 text-white font-bold"
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Input (Sales Mode) */}
                {sharingMode === "SALES" && canSell && (
                  <div>
                    <Label htmlFor="salePrice" className="text-base font-bold">
                      Sale Price
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold">$</span>
                      <Input
                        id="salePrice"
                        type="number"
                        min="1"
                        max="100"
                        step="0.50"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="text-lg font-bold w-32"
                      />
                      <span className="text-sm text-black/60">(min $1.00, max $100.00)</span>
                    </div>
                    <p className="text-sm text-black/60 mt-2">
                      You'll earn 70% (${(parseFloat(salePrice) * 0.7).toFixed(2)}) per sale
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="airy" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEnableSharing}
                    disabled={loading || !canShare}
                    className="flex-1 bg-lime-400 hover:bg-lime-300 text-black font-bold"
                  >
                    {loading ? "Enabling..." : "Continue"}
                  </Button>
                </div>
              </>
            )}

            {!canShare && (
              <Button variant="airy" onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Create First Link */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">Create Your First Campaign Link</h3>
              <p className="text-sm text-black/60">
                Give this link a name to help you track where clicks come from
              </p>
            </div>

            <div>
              <Label htmlFor="campaignName" className="text-base font-bold">
                Campaign Name (Optional)
              </Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Twitter January, Instagram Bio"
                className="mt-2"
              />
              <p className="text-xs text-black/50 mt-1">
                Leave blank to use "Main Link"
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="airy" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAffiliateLink}
                disabled={loading}
                className="flex-1 bg-lime-400 hover:bg-lime-300 text-black font-bold"
              >
                {loading ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && generatedUrl && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-100 mb-4">
                <Check className="h-8 w-8 text-lime-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sharing Enabled!</h3>
              <p className="text-sm text-black/60">
                Your track is now publicly shareable. Copy your link below:
              </p>
            </div>

            <div className="p-4 bg-neutral-50 border-2 border-black/10 rounded-xl">
              <Label className="text-xs font-bold uppercase tracking-wide text-black/60 mb-2 block">
                Your Campaign Link
              </Label>
              <div className="flex items-center gap-2">
                <Input value={generatedUrl} readOnly className="font-mono text-sm" />
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

            <div className="p-4 bg-lime-50 border-2 border-lime-200 rounded-xl">
              <p className="text-sm font-bold text-lime-900 mb-2">What's next?</p>
              <ul className="text-sm text-lime-800 space-y-1">
                <li>• Share your link on social media</li>
                <li>• Track clicks, plays, and sales in your Sales Hub</li>
                <li>• Create more campaign links for different channels</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleFinish}
                className="flex-1 bg-lime-400 hover:bg-lime-300 text-black font-bold"
              >
                Done
              </Button>
              <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="airy">
                  Preview Page
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
