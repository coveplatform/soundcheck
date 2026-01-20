"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Link2, Upload, Layers, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadMode } from "../types";

interface UploadModeToggleProps {
  uploadMode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
}

export function UploadModeToggle({ uploadMode, onModeChange }: UploadModeToggleProps) {
  const modes: { key: UploadMode; icon: React.ReactNode; label: string }[] = [
    { key: "link", icon: <Link2 className="h-5 w-5" />, label: "Link" },
    { key: "file", icon: <Upload className="h-5 w-5" />, label: "Upload" },
    { key: "stems", icon: <Layers className="h-5 w-5" />, label: "Stems" },
    { key: "ableton", icon: <FileCode className="h-5 w-5" />, label: "Ableton" },
  ];

  return (
    <Card variant="soft" className="mb-6">
      <CardContent className="pt-6">
        <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">upload method</p>
        <div className="grid grid-cols-4 gap-2">
          {modes.map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onModeChange(key)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors duration-150 ease-out",
                uploadMode === key
                  ? "bg-black text-white border-black"
                  : "bg-white/60 text-black border-black/10 hover:bg-white"
              )}
            >
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
