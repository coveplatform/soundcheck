"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, PartyPopper } from "lucide-react";

interface PostReviewModalProps {
  trackTitle: string;
  onClose: () => void;
}

export function PostReviewModal({ trackTitle, onClose }: PostReviewModalProps) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralCode();
  }, []);

  async function fetchReferralCode() {
    try {
      const res = await fetch("/api/referral/stats");
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.code);
      }
    } catch (error) {
      console.error("Failed to fetch referral code:", error);
    }
  }

  function copyReferralLink() {
    if (!referralCode) return;

    const appUrl = window.location.origin;
    const link = `${appUrl}/?ref=${referralCode}`;

    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!referralCode) return null;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${appUrl}/?ref=${referralCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-4">
            <PartyPopper className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Love the feedback?
          </h2>
          <p className="text-neutral-600">
            Share MixReflect with your music friends and you'll both get <span className="font-bold text-purple-600">$5 off</span> your next purchase!
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-700 mb-1">Your referral link:</div>
              <div className="font-mono text-sm text-neutral-600 break-all">{referralLink}</div>
            </div>
          </div>

          <button
            onClick={copyReferralLink}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Referral Link
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
