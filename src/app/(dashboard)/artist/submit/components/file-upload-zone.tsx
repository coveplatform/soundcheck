"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Check, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  uploadedUrl: string;
  uploadedFileName: string;
  isUploading: boolean;
  allowPurchase: boolean;
  isSubscribed: boolean;
  onAllowPurchaseChange: (allow: boolean) => void;
  onFileSelect: (file: File) => void;
}

export function FileUploadZone({
  uploadedUrl,
  uploadedFileName,
  isUploading,
  allowPurchase,
  isSubscribed,
  onAllowPurchaseChange,
  onFileSelect,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "audio/mpeg" || file.name.endsWith(".mp3"))) {
      onFileSelect(file);
    }
  };

  return (
    <Card variant="soft" elevated className="flex-1">
      <CardContent className="pt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,.mp3"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors duration-150 ease-out",
            isDragging ? "border-black bg-black/5" : "border-black/20 hover:border-black/40"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-black/30" />
              <p className="font-medium text-black/60">Uploading...</p>
            </div>
          ) : uploadedFileName ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-black">{uploadedFileName}</p>
              <p className="text-sm text-black/40">Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
                <Upload className="h-6 w-6 text-black/40" />
              </div>
              <p className="font-medium text-black">Drop your MP3 here</p>
              <p className="text-sm text-black/40">or click to browse (max 25MB)</p>
            </div>
          )}
        </div>

        {uploadedUrl && (
          <div className="mt-4">
            <AudioPlayer sourceUrl={uploadedUrl} sourceType="UPLOAD" showListenTracker={false} showWaveform={true} />
          </div>
        )}

        {uploadedUrl && !isUploading && (
          <div
            onClick={() => {
              if (!isSubscribed && !allowPurchase) {
                // Trigger upgrade prompt when free user tries to enable
                window.alert("Upgrade to Pro to enable track sales and monetize your music!");
                // TODO: Replace with proper modal/upgrade flow
              } else if (isSubscribed) {
                onAllowPurchaseChange(!allowPurchase);
              }
            }}
            className={cn(
              "mt-4 flex items-start gap-3 p-4 rounded-2xl border border-black/10 bg-white/60 hover:bg-white cursor-pointer transition-colors duration-150 ease-out"
            )}
          >
            <input
              type="checkbox"
              checked={allowPurchase && isSubscribed}
              readOnly
              className="mt-0.5 h-5 w-5 rounded border-black/20 text-emerald-500 focus:ring-emerald-500 pointer-events-none"
            />
            <div>
              <span className="font-medium text-black">
                Allow listeners to purchase this track
                {!isSubscribed && (
                  <span className="ml-2 text-xs font-semibold text-lime-600 bg-lime-50 px-2 py-1 rounded">
                    PRO
                  </span>
                )}
              </span>
              <p className="text-sm text-black/50 mt-0.5">
                {isSubscribed
                  ? "Listeners can buy and download this track after reviewing. You keep 85% of sales."
                  : "Upgrade to Pro to enable track sales and monetize your music"
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
