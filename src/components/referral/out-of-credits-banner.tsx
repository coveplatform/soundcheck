"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check } from "lucide-react";

export function OutOfCreditsBanner() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  if (dismissed || !referralCode) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
          <Gift className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Know another producer?</h3>
          <p className="text-sm text-white/90 mb-3">
            Invite them and you&apos;ll both get <strong>10 free credits</strong> instantly.
          </p>
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 font-medium text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Referral Link
              </>
            )}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
