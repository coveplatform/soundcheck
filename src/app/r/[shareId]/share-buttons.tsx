"use client";

import { useState } from "react";
import { Link2, Check, Download, Loader2 } from "lucide-react";

interface ShareButtonsProps {
  shareId: string;
  trackTitle: string;
  score: number;
}

export function ShareButtons({ shareId, trackTitle, score }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = `https://mixreflect.com/r/${shareId}`;
  const tweetText = `My track "${trackTitle}" scored ${score}/5 on MixReflect! Check out the full review:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const handleDownloadStory = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/r/${shareId}/story-image`);
      if (!response.ok) throw new Error("Failed to generate image");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `mixreflect-review-${shareId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download story image:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 transition-all ${
          copied
            ? "bg-lime-500 border-black text-black"
            : "bg-white border-black text-black hover:bg-neutral-100"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Copy Link
          </>
        )}
      </button>

      {/* Twitter/X Share */}
      <button
        onClick={handleTwitterShare}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-black border-2 border-black text-white hover:bg-neutral-800 transition-all"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </button>

      {/* Download for Stories */}
      <button
        onClick={handleDownloadStory}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-purple-500 border-2 border-black text-white hover:bg-purple-400 transition-all disabled:opacity-50"
      >
        {downloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Stories
          </>
        )}
      </button>
    </div>
  );
}
