"use client";

import { useState, useEffect } from "react";
import { UserPlus, Copy, Check } from "lucide-react";

export function PostReviewBanner() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const wasDismissed = sessionStorage.getItem("post-review-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

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

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("post-review-banner-dismissed", "true");
  }

  if (dismissed || !referralCode) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <UserPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900 mb-1">Nice review!</h3>
          <p className="text-sm text-neutral-700 mb-3">
            Know another producer? Invite them and you&apos;ll both get <strong>2 free reviews</strong>.
          </p>
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Share Referral Link
              </>
            )}
          </button>
        </div>
        <button
          onClick={dismiss}
          className="text-neutral-400 hover:text-neutral-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}
