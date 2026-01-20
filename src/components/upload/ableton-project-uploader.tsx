"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Layers,
  Music2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadAbletonProjectZip,
  cleanupProjectBundle,
  loadSampleIntoMemory,
  type AbletonProjectBundle,
  type AbletonSample,
} from "@/lib/ableton-project-loader";
import { getTrackColor } from "@/lib/ableton-parser";

interface AbletonProjectUploaderProps {
  onProjectLoaded?: (bundle: AbletonProjectBundle) => void;
  onSamplesReady?: (samples: AbletonSample[]) => void;
}

export function AbletonProjectUploader({
  onProjectLoaded,
  onSamplesReady,
}: AbletonProjectUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<AbletonProjectBundle | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (project) {
        cleanupProjectBundle(project);
      }
      // Stop all audio
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, [project]);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a ZIP file containing your Ableton project");
      return;
    }

    setError(null);
    setIsLoading(true);
    setProject(null);

    try {
      const bundle = await loadAbletonProjectZip(file);
      setProject(bundle);
      onProjectLoaded?.(bundle);
      onSamplesReady?.(bundle.allSamples);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setIsLoading(false);
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

  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const togglePlay = async (sample: AbletonSample) => {
    // If sample isn't loaded yet, load it first
    if (!sample.loaded || !sample.url) {
      setLoadingSample(sample.path);
      try {
        await loadSampleIntoMemory(sample);
      } catch (err) {
        setError(`Failed to load sample: ${sample.name}`);
        setLoadingSample(null);
        return;
      }
      setLoadingSample(null);
    }

    const sampleUrl = sample.url!;
    const currentAudio = audioRefs.current.get(sampleUrl);

    if (playingSample === sampleUrl) {
      // Pause current
      currentAudio?.pause();
      setPlayingSample(null);
    } else {
      // Stop any playing audio
      audioRefs.current.forEach((audio) => audio.pause());

      // Play new sample
      let audio = currentAudio;
      if (!audio) {
        audio = new Audio(sampleUrl);
        audio.onended = () => setPlayingSample(null);
        audioRefs.current.set(sampleUrl, audio);
      }
      audio.currentTime = 0;
      void audio.play();
      setPlayingSample(sampleUrl);
    }
  };

  const toggleTrackMute = (trackName: string) => {
    setMutedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackName)) {
        next.delete(trackName);
      } else {
        next.add(trackName);
      }
      return next;
    });
  };

  const tracksWithAudio = project?.tracks.filter((t) => t.samples.length > 0) || [];
  const tracksWithoutAudio = project?.tracks.filter((t) => t.samples.length === 0) || [];

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
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors duration-150 ease-out",
              isDragging && "border-orange-400 bg-orange-50",
              !isDragging && "border-black/20 hover:border-black/40 hover:bg-white/50"
            )}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="font-medium text-black/60">Loading project...</p>
                <p className="text-sm text-black/40">Extracting audio files</p>
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
                    Use &quot;Collect All and Save&quot; then ZIP the folder
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
                  <li>ZIP the entire project folder</li>
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
                {project.projectName}
              </p>
              <p className="text-sm text-emerald-600">
                {project.tempo} BPM • {project.allSamples.length} audio files found
              </p>
            </div>
            <Button
              variant="airyOutline"
              size="sm"
              onClick={() => {
                if (project) cleanupProjectBundle(project);
                setProject(null);
                setError(null);
              }}
            >
              Load different
            </Button>
          </div>

          {/* Warnings */}
          {project.warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-mono uppercase text-amber-600 mb-2">
                {project.warnings.length} warnings
              </p>
              <div className="text-sm text-amber-700 space-y-1 max-h-24 overflow-y-auto">
                {project.warnings.slice(0, 5).map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
                {project.warnings.length > 5 && (
                  <p className="text-amber-500">
                    ...and {project.warnings.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tracks with Audio */}
          {tracksWithAudio.length > 0 && (
            <Card variant="soft" elevated className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                    Audio Tracks ({tracksWithAudio.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {tracksWithAudio.map((track) => {
                    const isExpanded = expandedTrack === track.name;
                    const isMuted = mutedTracks.has(track.name);

                    return (
                      <div key={track.name} className="border border-black/10 rounded-xl overflow-hidden">
                        {/* Track Header */}
                        <div
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                            isExpanded ? "bg-black/5" : "hover:bg-black/5"
                          )}
                          onClick={() => setExpandedTrack(isExpanded ? null : track.name)}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getTrackColor(track.color) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">
                              {track.name}
                            </p>
                            <p className="text-xs text-black/40">
                              {track.samples.length} sample{track.samples.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrackMute(track.name);
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              isMuted
                                ? "bg-red-100 text-red-600"
                                : "hover:bg-black/5 text-black/40"
                            )}
                          >
                            {isMuted ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              track.type === "audio" && "bg-blue-100 text-blue-700",
                              track.type === "midi" && "bg-purple-100 text-purple-700"
                            )}
                          >
                            {track.type}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-black/40" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-black/40" />
                          )}
                        </div>

                        {/* Expanded Samples */}
                        {isExpanded && (
                          <div className="border-t border-black/10 bg-black/[0.02] p-3 space-y-2">
                            {track.samples.map((sample) => {
                              const isPlaying = playingSample === sample.url;
                              const isLoading = loadingSample === sample.path;
                              const isNotLoaded = !sample.loaded;
                              return (
                                <div
                                  key={sample.path}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-white border border-black/5"
                                >
                                  <button
                                    onClick={() => void togglePlay(sample)}
                                    disabled={isMuted || isLoading}
                                    className={cn(
                                      "h-8 w-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                                      isMuted || isLoading
                                        ? "bg-black/10 text-black/30 cursor-not-allowed"
                                        : isPlaying
                                        ? "bg-emerald-500 text-white"
                                        : "bg-black/5 text-black/60 hover:bg-black/10"
                                    )}
                                  >
                                    {isLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4 ml-0.5" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-black truncate">
                                      {sample.name}
                                    </p>
                                    {isNotLoaded && sample.size > 0 && (
                                      <p className="text-xs text-black/40">
                                        {(sample.size / 1024 / 1024).toFixed(1)}MB • Click to load
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracks without Audio (MIDI/VST) */}
          {tracksWithoutAudio.length > 0 && (
            <Card variant="soft" className="bg-white/60">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">
                  Tracks without audio ({tracksWithoutAudio.length})
                </p>
                <p className="text-sm text-black/50 mb-3">
                  These tracks use MIDI or VST instruments - audio must be rendered in Ableton
                </p>
                <div className="flex flex-wrap gap-2">
                  {tracksWithoutAudio.map((track) => (
                    <span
                      key={track.name}
                      className="text-xs px-2 py-1 rounded-lg bg-black/5 text-black/50"
                    >
                      {track.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Samples Summary */}
          {project.allSamples.length > 0 && (
            <div className="p-4 rounded-xl bg-black/5">
              <div className="flex items-center gap-2 text-black/60">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {project.allSamples.filter(s => s.loaded).length}/{project.allSamples.length} samples loaded
                </span>
              </div>
              {project.allSamples.some(s => !s.loaded) && (
                <p className="text-xs text-black/40 mt-1 ml-6">
                  Click samples to load them on demand
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
