"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Music2, 
  Layers, 
  Clock, 
  Gauge, 
  Plug, 
  FileAudio,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseAbletonFile, getTrackColor, type AbletonProjectInfo, type AbletonTrack } from "@/lib/ableton-parser";

interface AbletonAnalyzerProps {
  onProjectParsed?: (info: AbletonProjectInfo) => void;
  onBpmDetected?: (bpm: number) => void;
  onTracksDetected?: (tracks: AbletonTrack[]) => void;
}

export function AbletonAnalyzer({ onProjectParsed, onBpmDetected, onTracksDetected }: AbletonAnalyzerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<AbletonProjectInfo | null>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllPlugins, setShowAllPlugins] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".als")) {
      setError("Please upload an Ableton Live Set (.als) file");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setProjectInfo(null);

    try {
      const info = await parseAbletonFile(file);
      setProjectInfo(info);
      onProjectParsed?.(info);
      onBpmDetected?.(info.tempo);
      onTracksDetected?.(info.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze project");
    } finally {
      setIsAnalyzing(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const formatBars = (beats: number, tempo: number) => {
    const bars = Math.floor(beats / 4);
    const minutes = (beats / tempo).toFixed(1);
    return `${bars} bars (~${minutes} min)`;
  };

  const displayedTracks = showAllTracks ? projectInfo?.tracks : projectInfo?.tracks.slice(0, 6);
  const displayedPlugins = showAllPlugins ? projectInfo?.plugins : projectInfo?.plugins.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!projectInfo && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".als"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors duration-150 ease-out",
              isDragging && "border-orange-400 bg-orange-50",
              !isDragging && "border-black/20 hover:border-black/40 hover:bg-white/50"
            )}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="font-medium text-black/60">Analyzing project...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-black">Drop your Ableton project here</p>
                  <p className="text-sm text-black/40 mt-1">.als files only</p>
                </div>
              </div>
            )}
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

      {/* Project Info Display */}
      {projectInfo && (
        <div className="space-y-4">
          {/* Success Header */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-800">Project analyzed successfully</p>
              <p className="text-sm text-emerald-600">{projectInfo.abletonVersion}</p>
            </div>
            <Button
              variant="airyOutline"
              size="sm"
              onClick={() => {
                setProjectInfo(null);
                setError(null);
              }}
            >
              Analyze another
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-black/50 mb-1">
                  <Gauge className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase">BPM</span>
                </div>
                <p className="text-2xl font-light tracking-tight">{projectInfo.tempo}</p>
              </CardContent>
            </Card>

            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-black/50 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase">Time Sig</span>
                </div>
                <p className="text-2xl font-light tracking-tight">
                  {projectInfo.timeSignatureNumerator}/{projectInfo.timeSignatureDenominator}
                </p>
              </CardContent>
            </Card>

            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-black/50 mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase">Tracks</span>
                </div>
                <p className="text-2xl font-light tracking-tight">{projectInfo.totalTracks}</p>
              </CardContent>
            </Card>

            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-black/50 mb-1">
                  <Plug className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase">Plugins</span>
                </div>
                <p className="text-2xl font-light tracking-tight">{projectInfo.plugins.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Track Breakdown */}
          <Card variant="soft" elevated className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                  Tracks ({projectInfo.audioTracks} audio, {projectInfo.midiTracks} midi)
                </p>
              </div>
              <div className="space-y-2">
                {displayedTracks?.map((track, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTrackColor(track.color) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{track.name}</p>
                      {track.plugins.length > 0 && (
                        <p className="text-xs text-black/40 truncate">
                          {track.plugins.slice(0, 3).join(", ")}
                          {track.plugins.length > 3 && ` +${track.plugins.length - 3}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        track.type === "audio" && "bg-blue-100 text-blue-700",
                        track.type === "midi" && "bg-purple-100 text-purple-700",
                        track.type === "return" && "bg-orange-100 text-orange-700",
                        track.type === "master" && "bg-black text-white"
                      )}>
                        {track.type}
                      </span>
                      {track.isMuted && (
                        <span className="text-xs text-black/30">M</span>
                      )}
                      {track.isSoloed && (
                        <span className="text-xs text-yellow-600 font-bold">S</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {projectInfo.tracks.length > 6 && (
                <button
                  onClick={() => setShowAllTracks(!showAllTracks)}
                  className="mt-3 flex items-center gap-1 text-sm text-black/50 hover:text-black transition-colors"
                >
                  {showAllTracks ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show all {projectInfo.tracks.length} tracks
                    </>
                  )}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Plugins */}
          {projectInfo.plugins.length > 0 && (
            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">
                  Plugins & Effects
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayedPlugins?.map((plugin, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-lg bg-black/5 text-black/70"
                    >
                      {plugin}
                    </span>
                  ))}
                </div>
                {projectInfo.plugins.length > 8 && (
                  <button
                    onClick={() => setShowAllPlugins(!showAllPlugins)}
                    className="mt-3 flex items-center gap-1 text-sm text-black/50 hover:text-black transition-colors"
                  >
                    {showAllPlugins ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show all {projectInfo.plugins.length} plugins
                      </>
                    )}
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Samples */}
          {projectInfo.samples.length > 0 && (
            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileAudio className="h-4 w-4 text-black/40" />
                  <p className="text-xs font-mono tracking-widest text-black/40 uppercase">
                    {projectInfo.samples.length} Samples Referenced
                  </p>
                </div>
                <p className="text-sm text-black/50">
                  {projectInfo.samples.slice(0, 5).join(", ")}
                  {projectInfo.samples.length > 5 && ` and ${projectInfo.samples.length - 5} more...`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Locators */}
          {projectInfo.locators.length > 0 && (
            <Card variant="soft" className="bg-white/80">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">
                  Markers
                </p>
                <div className="flex flex-wrap gap-2">
                  {projectInfo.locators.map((loc, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-lg bg-lime-100 text-lime-700"
                    >
                      {loc.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
