"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Music2, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectTrack {
  name: string;
  type: "audio" | "midi" | "return" | "master";
  sampleCount?: number;
  plugins?: string[];
  color?: number;
}

interface ProjectData {
  projectName?: string;
  tempo: number;
  timeSignature?: string;
  trackCount: number;
  sampleCount?: number;
  tracks: ProjectTrack[];
  plugins?: string[];
}

interface ProjectStructureProps {
  projectData: ProjectData;
  className?: string;
}

export function ProjectStructure({ projectData, className }: ProjectStructureProps) {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());

  const toggleTrack = (trackName: string) => {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackName)) {
        next.delete(trackName);
      } else {
        next.add(trackName);
      }
      return next;
    });
  };

  // Separate tracks by type
  const audioTracks = projectData.tracks.filter((t) => t.type === "audio");
  const midiTracks = projectData.tracks.filter((t) => t.type === "midi");
  const returnTracks = projectData.tracks.filter((t) => t.type === "return");
  const masterTrack = projectData.tracks.find((t) => t.type === "master");

  return (
    <Card variant="soft" className={cn("bg-white/60", className)}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">
            Project Structure
          </p>

          {/* Project Info */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white border border-black/5">
              <p className="text-xs text-black/40 mb-1">Tempo</p>
              <p className="font-medium">{projectData.tempo} BPM</p>
            </div>
            {projectData.timeSignature && (
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <p className="text-xs text-black/40 mb-1">Time Sig</p>
                <p className="font-medium">{projectData.timeSignature}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-white border border-black/5">
              <p className="text-xs text-black/40 mb-1">Tracks</p>
              <p className="font-medium">{projectData.trackCount}</p>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          {/* Audio Tracks */}
          {audioTracks.length > 0 && (
            <div>
              <p className="text-xs font-mono text-black/30 uppercase tracking-wider px-2 py-1">
                Audio Tracks ({audioTracks.length})
              </p>
              {audioTracks.map((track, index) => (
                <TrackRow
                  key={`audio-${index}`}
                  track={track}
                  isExpanded={expandedTracks.has(track.name)}
                  onToggle={() => toggleTrack(track.name)}
                />
              ))}
            </div>
          )}

          {/* MIDI Tracks */}
          {midiTracks.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-mono text-black/30 uppercase tracking-wider px-2 py-1">
                MIDI Tracks ({midiTracks.length})
              </p>
              {midiTracks.map((track, index) => (
                <TrackRow
                  key={`midi-${index}`}
                  track={track}
                  isExpanded={expandedTracks.has(track.name)}
                  onToggle={() => toggleTrack(track.name)}
                />
              ))}
            </div>
          )}

          {/* Return Tracks */}
          {returnTracks.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-mono text-black/30 uppercase tracking-wider px-2 py-1">
                Return Tracks ({returnTracks.length})
              </p>
              {returnTracks.map((track, index) => (
                <TrackRow
                  key={`return-${index}`}
                  track={track}
                  isExpanded={expandedTracks.has(track.name)}
                  onToggle={() => toggleTrack(track.name)}
                />
              ))}
            </div>
          )}

          {/* Master Track */}
          {masterTrack && (
            <div className="mt-3">
              <p className="text-xs font-mono text-black/30 uppercase tracking-wider px-2 py-1">
                Master
              </p>
              <TrackRow
                track={masterTrack}
                isExpanded={expandedTracks.has(masterTrack.name)}
                onToggle={() => toggleTrack(masterTrack.name)}
              />
            </div>
          )}
        </div>

        {/* All Plugins Summary */}
        {projectData.plugins && projectData.plugins.length > 0 && (
          <div className="mt-4 pt-4 border-t border-black/5">
            <p className="text-xs font-mono text-black/40 uppercase mb-2">
              All Plugins ({projectData.plugins.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {projectData.plugins.slice(0, 12).map((plugin, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 text-xs text-black/50"
                >
                  <Zap className="h-3 w-3" />
                  {plugin}
                </span>
              ))}
              {projectData.plugins.length > 12 && (
                <span className="px-2 py-0.5 text-xs text-black/30">
                  +{projectData.plugins.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrackRow({
  track,
  isExpanded,
  onToggle,
}: {
  track: ProjectTrack;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const plugins = track.plugins ?? [];
  const hasPlugins = plugins.length > 0;

  return (
    <div className="rounded-lg border border-black/5 overflow-hidden mb-1">
      {/* Track Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 transition-colors text-left",
          isExpanded ? "bg-black/5" : "hover:bg-black/5"
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {track.type === "audio" ? (
            <Music2 className="h-4 w-4 text-blue-600" />
          ) : track.type === "midi" ? (
            <Layers className="h-4 w-4 text-purple-600" />
          ) : track.type === "return" ? (
            <Zap className="h-4 w-4 text-emerald-600" />
          ) : (
            <Music2 className="h-4 w-4 text-orange-600" />
          )}
        </div>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-black truncate">{track.name}</span>

        {/* Badges */}
        {hasPlugins && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/10 text-black/50">
            {plugins.length} plugin{plugins.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Expand Icon */}
        {hasPlugins &&
          (isExpanded ? (
            <ChevronDown className="h-4 w-4 text-black/40" />
          ) : (
            <ChevronRight className="h-4 w-4 text-black/40" />
          ))}
      </button>

      {/* Expanded Content */}
      {isExpanded && hasPlugins && (
        <div className="px-3 py-2 bg-black/[0.02] border-t border-black/5">
          <p className="text-xs text-black/40 mb-1.5">Plugin Chain:</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {plugins.map((plugin, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-black/5 text-xs text-black/70">
                  <Zap className="h-3 w-3 text-black/40" />
                  {plugin}
                </span>
                {i < plugins.length - 1 && (
                  <span className="text-black/20">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
