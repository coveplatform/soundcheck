"use client";

import { useRef, useState, useCallback } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  accept?: string;
  maxSizeMB?: number;
  isUploading?: boolean;
  uploadedFileName?: string;
  onFileSelect: (file: File) => void;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  successTitle?: string;
  successSubtitle?: string;
  className?: string;
}

export function FileDropZone({
  accept = "audio/mpeg,audio/mp3,.mp3",
  maxSizeMB = 25,
  isUploading = false,
  uploadedFileName,
  onFileSelect,
  icon,
  title = "Drop your file here",
  subtitle,
  successTitle,
  successSubtitle = "Click to change",
  className,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const defaultSubtitle = subtitle ?? `or click to browse (max ${maxSizeMB}MB)`;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors duration-150 ease-out",
          isDragging ? "border-black bg-black/5" : "border-black/20 hover:border-black/40",
          className
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
            <p className="font-medium text-black">{successTitle ?? uploadedFileName}</p>
            <p className="text-sm text-black/40">{successSubtitle}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
              {icon ?? <Upload className="h-6 w-6 text-black/40" />}
            </div>
            <p className="font-medium text-black">{title}</p>
            <p className="text-sm text-black/40">{defaultSubtitle}</p>
          </div>
        )}
      </div>
    </>
  );
}
