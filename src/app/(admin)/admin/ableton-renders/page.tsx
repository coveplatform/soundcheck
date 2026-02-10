"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Music2,
  Layers,
  FileCode,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProjectTrack {
  name: string;
  type: string;
  sampleCount?: number;
  plugins?: string[];
}

interface ProjectData {
  projectName: string;
  tempo: number;
  timeSignature: string;
  trackCount: number;
  sampleCount: number;
  tracks: ProjectTrack[];
  plugins?: string[];
}

interface Stem {
  id: string;
  stemUrl: string;
  stemType: string;
  label: string;
  order: number;
}

interface Render {
  id: string;
  title: string;
  abletonProjectUrl: string;
  abletonProjectData: ProjectData;
  abletonRenderStatus: "PENDING" | "RENDERING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  ArtistProfile: {
    artistName: string;
  };
  stems: Stem[];
}

export default function AbletonRendersPage() {
  const [renders, setRenders] = useState<Render[]>([]);
  const [completedRenders, setCompletedRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"pending" | "completed">("pending");

  const fetchRenders = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, completedRes] = await Promise.all([
        fetch("/api/admin/ableton-renders"),
        fetch("/api/admin/ableton-renders?status=completed"),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setRenders(data);
      }

      if (completedRes.ok) {
        const data = await completedRes.json();
        setCompletedRenders(data);
      }
    } catch (error) {
      console.error("Failed to fetch renders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRenders();
    // Refresh every 10 seconds
    const interval = setInterval(fetchRenders, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerRender = async (trackId: string) => {
    setIsRendering((prev) => new Set(prev).add(trackId));

    try {
      const response = await fetch(`/api/admin/ableton-renders/${trackId}/render`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger render");
      }

      // Refresh list
      await fetchRenders();
    } catch (error) {
      console.error("Failed to trigger render:", error);
      alert(error instanceof Error ? error.message : "Failed to trigger render");
    } finally {
      setIsRendering((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }
  };

  const currentRenders = view === "pending" ? renders : completedRenders;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-tight mb-2">Ableton Renders</h1>
          <p className="text-black/40">Manage Ableton project rendering</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView("pending")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              view === "pending"
                ? "bg-black text-white"
                : "bg-black/5 text-black/60 hover:bg-black/10"
            )}
          >
            Pending ({renders.length})
          </button>
          <button
            onClick={() => setView("completed")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              view === "completed"
                ? "bg-black text-white"
                : "bg-black/5 text-black/60 hover:bg-black/10"
            )}
          >
            Completed ({completedRenders.length})
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-black/20" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && currentRenders.length === 0 && (
          <Card variant="soft" className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/5 mb-4">
                <FileCode className="h-8 w-8 text-black/30" />
              </div>
              <h3 className="text-lg font-medium text-black/60 mb-1">
                {view === "pending" ? "No pending renders" : "No completed renders"}
              </h3>
              <p className="text-sm text-black/40">
                {view === "pending"
                  ? "Projects will appear here when artists upload Ableton projects"
                  : "Rendered projects will appear here"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Renders List */}
        {!isLoading && currentRenders.length > 0 && (
          <div className="space-y-4">
            {currentRenders.map((render) => (
              <Card key={render.id} variant="soft" elevated>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {render.abletonRenderStatus === "PENDING" && (
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                      )}
                      {render.abletonRenderStatus === "RENDERING" && (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        </div>
                      )}
                      {render.abletonRenderStatus === "COMPLETED" && (
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                      )}
                      {render.abletonRenderStatus === "FAILED" && (
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Artist */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-lg truncate">{render.title}</h3>
                          <p className="text-sm text-black/40">by {render.ArtistProfile.artistName}</p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {render.abletonRenderStatus === "PENDING" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                          {render.abletonRenderStatus === "RENDERING" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Rendering
                            </span>
                          )}
                          {render.abletonRenderStatus === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          )}
                          {render.abletonRenderStatus === "FAILED" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-black/40 mb-1">Tempo</p>
                          <p className="text-sm font-medium">
                            {render.abletonProjectData.tempo} BPM
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-black/40 mb-1">Tracks</p>
                          <p className="text-sm font-medium">
                            {render.abletonProjectData.trackCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-black/40 mb-1">Samples</p>
                          <p className="text-sm font-medium">
                            {render.abletonProjectData.sampleCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-black/40 mb-1">Stems Created</p>
                          <p className="text-sm font-medium">{render.stems.length}</p>
                        </div>
                      </div>

                      {/* Track List Preview */}
                      {render.abletonProjectData.tracks.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-black/40 mb-2">Project Tracks</p>
                          <div className="flex flex-wrap gap-2">
                            {render.abletonProjectData.tracks.slice(0, 6).map((track, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/5 text-xs text-black/60"
                              >
                                {track.type === "audio" ? (
                                  <Music2 className="h-3 w-3" />
                                ) : (
                                  <Layers className="h-3 w-3" />
                                )}
                                {track.name}
                              </span>
                            ))}
                            {render.abletonProjectData.tracks.length > 6 && (
                              <span className="px-2 py-1 text-xs text-black/40">
                                +{render.abletonProjectData.tracks.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {render.abletonRenderStatus === "PENDING" && (
                          <Button
                            onClick={() => triggerRender(render.id)}
                            disabled={isRendering.has(render.id)}
                            isLoading={isRendering.has(render.id)}
                            variant="airyPrimary"
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-1.5" />
                            Start Render
                          </Button>
                        )}

                        {render.abletonRenderStatus === "FAILED" && (
                          <Button
                            onClick={() => triggerRender(render.id)}
                            disabled={isRendering.has(render.id)}
                            isLoading={isRendering.has(render.id)}
                            variant="airyPrimary"
                            size="sm"
                          >
                            Retry
                          </Button>
                        )}

                        <Link href={`/admin/tracks/${render.id}`}>
                          <Button variant="airyOutline" size="sm">
                            View Track
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card variant="soft" className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">How rendering works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Artists upload Ableton projects with "Collect All and Save"</li>
                  <li>Projects appear here with PENDING status</li>
                  <li>Click "Start Render" to create stems</li>
                  <li>Currently creates placeholder stems for testing</li>
                  <li>In production, this will use cloud Ableton instances</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
