"use client";

import { useState } from "react";
import { Share2, Download, Link2, X, Check, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ShareTriggerVariant = "inline" | "button" | "onDark";

interface ShareReviewButtonProps {
  reviewId: string;
  trackTitle: string;
  /** Visual style of the trigger button. Default "inline" (subtle text link). */
  variant?: ShareTriggerVariant;
  /** Override the trigger label. */
  label?: string;
}

const triggerStyles: Record<ShareTriggerVariant, string> = {
  inline:
    "inline-flex items-center gap-1.5 text-xs font-semibold text-black/35 hover:text-purple-600 transition-colors",
  button:
    "inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 transition-colors shadow-sm",
  onDark:
    "inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/90 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
};

export function ShareReviewButton({
  reviewId,
  trackTitle,
  variant = "inline",
  label = "Share",
}: ShareReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const cardUrl = `/api/og/review-card?reviewId=${reviewId}`;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://www.mixreflect.com"}/r/${reviewId}`;

  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${trackTitle}" — real feedback from real artists 🎧\n\n`)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={triggerStyles[variant]}>
        <Share2 className={variant === "inline" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-sm border border-black/8 shadow-xl">
          <DialogTitle className="sr-only">Share feedback card</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
            <div>
              <p className="text-sm font-black text-black leading-tight">Share this feedback</p>
              <p className="text-xs text-black/40 mt-0.5">Save the card or copy the link</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Card preview */}
          <div className="bg-[#08050f] relative">
            {/* Loading skeleton */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={cardUrl}
              alt="Feedback card preview"
              className={cn(
                "w-full block transition-opacity duration-300",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
              style={{ aspectRatio: "1/1" }}
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 space-y-2.5 bg-[#faf7f2]">
            {/* Download for Instagram */}
            <a
              href={cardUrl}
              download={`${trackTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-feedback.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full bg-black text-white rounded-xl px-4 py-3 hover:bg-neutral-800 transition-colors"
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-black leading-tight">Save image</p>
                <p className="text-[10px] text-white/50 mt-0.5">For Instagram, TikTok, stories</p>
              </div>
            </a>

            {/* Share to X */}
            {xIntent && (
              <a
                href={xIntent}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full bg-white border border-black/10 rounded-xl px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                {/* X / Twitter logo */}
                <svg className="h-4 w-4 flex-shrink-0 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-black leading-tight">Post to X</p>
                  <p className="text-[10px] text-black/40 mt-0.5">Opens with a draft tweet</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-black/25 flex-shrink-0" />
              </a>
            )}

            {/* Copy link */}
            {shareUrl && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-3 w-full bg-white border border-black/10 rounded-xl px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 flex-shrink-0 text-purple-500" />
                ) : (
                  <Link2 className="h-4 w-4 flex-shrink-0 text-black/50" />
                )}
                <div className="flex-1 text-left">
                  <p className={cn("text-sm font-black leading-tight", copied ? "text-purple-600" : "text-black")}>
                    {copied ? "Copied!" : "Copy link"}
                  </p>
                  <p className="text-[10px] text-black/40 mt-0.5 font-mono truncate">{shareUrl}</p>
                </div>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
