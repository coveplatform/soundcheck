"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Music2,
  FileCode,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectData {
  projectName: string;
  tempo: number;
  timeSignature: string;
  trackCount: number;
  audioTrackCount: number;
  midiTrackCount: number;
  tracks: Array<{ name: string; type: string }>;
  plugins: string[];
  sampleCount: number;
}

interface UploadedProject {
  projectUrl: string;
  projectData: ProjectData;
  fileSize: number;
}

interface AbletonProjectServerUploaderProps {
  onProjectUploaded?: (data: UploadedProject) => void;
}

export function AbletonProjectServerUploader({
  onProjectUploaded,
}: AbletonProjectServerUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<UploadedProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a ZIP file containing your Ableton project");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setProject(null);

    try {
      const formData = new FormData();
      formData.append("project", file);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      const uploadPromise = new Promise<UploadedProject>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || "Upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", "/api/uploads/ableton-project");
        xhr.send(formData);
      });

      const uploadedData = await uploadPromise;
      setProject(uploadedData);
      onProjectUploaded?.(uploadedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload project");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!project && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="hidden"
          />
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-150 ease-out",
              isUploading && "cursor-not-allowed opacity-60",
              !isUploading && "cursor-pointer",
              isDragging && !isUploading && "border-orange-400 bg-orange-50",
              !isDragging && !isUploading && "border-black/20 hover:border-black/40 hover:bg-white/50"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="font-medium text-black/60">Uploading project...</p>
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-black/40 mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-black">
                    Drop your Ableton project ZIP here
                  </p>
                  <p className="text-sm text-black/40 mt-1">
                    or click to browse (max 500MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">How to prepare your project:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>In Ableton: File → &quot;Collect All and Save&quot;</li>
                  <li>This copies all samples into the project folder</li>
                  <li>ZIP the entire project folder (right-click → Compress)</li>
                  <li>Upload the ZIP here</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Project Loaded */}
      {project && (
        <div className="space-y-4">
          {/* Success Header */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-800">
                {project.projectData.projectName}
              </p>
              <p className="text-sm text-emerald-600">
                {project.projectData.tempo} BPM • {project.projectData.sampleCount} audio files • {formatFileSize(project.fileSize)}
              </p>
            </div>
            <Button
              variant="airyOutline"
              size="sm"
              onClick={() => {
                setProject(null);
                setError(null);
              }}
            >
              Load different
            </Button>
          </div>

          {/* Project Details */}
          <Card variant="soft" className="bg-white/60">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">
                Project Details
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-black/40 mb-1">Tempo</p>
                  <p className="font-medium">{project.projectData.tempo} BPM</p>
                </div>
                <div>
                  <p className="text-xs text-black/40 mb-1">Time Signature</p>
                  <p className="font-medium">{project.projectData.timeSignature}</p>
                </div>
                <div>
                  <p className="text-xs text-black/40 mb-1">Total Tracks</p>
                  <p className="font-medium">{project.projectData.trackCount}</p>
                </div>
                <div>
                  <p className="text-xs text-black/40 mb-1">Audio Samples</p>
                  <p className="font-medium">{project.projectData.sampleCount}</p>
                </div>
              </div>

              {project.projectData.plugins.length > 0 && (
                <div>
                  <p className="text-xs text-black/40 mb-2">Plugins ({project.projectData.plugins.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {project.projectData.plugins.slice(0, 8).map((plugin, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-lg bg-black/5 text-black/60"
                      >
                        {plugin}
                      </span>
                    ))}
                    {project.projectData.plugins.length > 8 && (
                      <span className="text-xs px-2 py-1 text-black/40">
                        +{project.projectData.plugins.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex gap-3">
              <Music2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Your project will be rendered in the cloud</li>
                  <li>• Individual stems will be extracted from your tracks</li>
                  <li>• Reviewers will use the stem mixer to give detailed feedback</li>
                  <li>• Processing usually takes 5-10 minutes after submission</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
