/**
 * Ableton Project Rendering Service
 *
 * This service handles rendering Ableton projects into individual stems.
 * For now, this creates placeholder stems for testing.
 * In production, this would integrate with cloud Ableton instances.
 */

import { prisma } from "@/lib/prisma";
import type { StemType } from "@prisma/client";

export interface RenderProgress {
  trackId: string;
  status: "PENDING" | "RENDERING" | "COMPLETED" | "FAILED";
  progress: number; // 0-100
  currentStep?: string;
  error?: string;
  stems?: Array<{
    stemUrl: string;
    stemType: string;
    label: string;
    order: number;
  }>;
}

/**
 * Start rendering an Ableton project
 * This is a placeholder that will be replaced with actual cloud rendering
 */
export async function startAbletonRender(trackId: string): Promise<void> {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      title: true,
      abletonProjectUrl: true,
      abletonProjectData: true,
      abletonRenderStatus: true,
    },
  });

  if (!track) {
    throw new Error("Track not found");
  }

  if (!track.abletonProjectUrl) {
    throw new Error("No Ableton project uploaded for this track");
  }

  if (track.abletonRenderStatus === "RENDERING") {
    throw new Error("Rendering already in progress");
  }

  if (track.abletonRenderStatus === "COMPLETED") {
    throw new Error("Project already rendered");
  }

  // Update status to RENDERING
  await prisma.track.update({
    where: { id: trackId },
    data: { abletonRenderStatus: "RENDERING" },
  });

  // In a real implementation, this would:
  // 1. Download project ZIP from S3
  // 2. Extract to temp directory
  // 3. Spin up cloud Ableton instance
  // 4. Run Python automation to render stems
  // 5. Upload stems to S3
  // 6. Create TrackStem records
  // 7. Update status to COMPLETED

  // For now, we'll just mark it as completed after a delay
  // This allows the UI to work while you build the actual rendering
  console.log(`[Ableton Render] Starting render for track ${trackId}`);
}

/**
 * Get rendering status for a track
 */
export async function getRenderStatus(trackId: string): Promise<RenderProgress | null> {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      abletonRenderStatus: true,
      TrackStem: {
        select: {
          stemUrl: true,
          stemType: true,
          label: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!track) {
    return null;
  }

  if (!track.abletonRenderStatus) {
    return null;
  }

  // Calculate progress based on status
  let progress = 0;
  let currentStep = "";

  switch (track.abletonRenderStatus) {
    case "PENDING":
      progress = 0;
      currentStep = "Waiting to start...";
      break;
    case "RENDERING":
      progress = 50;
      currentStep = "Rendering stems...";
      break;
    case "COMPLETED":
      progress = 100;
      currentStep = "Complete";
      break;
    case "FAILED":
      progress = 0;
      currentStep = "Failed";
      break;
  }

  return {
    trackId: track.id,
    status: track.abletonRenderStatus as any,
    progress,
    currentStep,
    stems: track.TrackStem.map((s) => ({
      stemUrl: s.stemUrl,
      stemType: s.stemType,
      label: s.label,
      order: s.order,
    })),
  };
}

/**
 * Manual render function (for admin use)
 * This simulates rendering by creating placeholder stems from the master track
 */
export async function manualRenderProject(trackId: string): Promise<void> {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      TrackStem: true,
    },
  });

  if (!track) {
    throw new Error("Track not found");
  }

  if (!track.abletonProjectUrl || !track.abletonProjectData) {
    throw new Error("No Ableton project data found");
  }

  const isZipSource =
    typeof track.sourceUrl === "string" && track.sourceUrl.toLowerCase().endsWith(".zip");

  const createToneWavBuffer = (options: {
    seconds: number;
    sampleRate?: number;
    frequencies: number[];
  }): Buffer => {
    const seconds = Math.max(0.25, Math.min(60, options.seconds));
    const sampleRate = Math.max(8000, Math.min(48000, options.sampleRate ?? 44100));
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = Math.floor(seconds * sampleRate);
    const dataSize = numSamples * blockAlign;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);

    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * blockAlign, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    const freqs = options.frequencies.length > 0 ? options.frequencies : [440];
    const amplitude = 0.15;

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      for (const f of freqs) {
        sample += Math.sin(2 * Math.PI * f * t);
      }
      sample /= freqs.length;
      const intSample = Math.max(-1, Math.min(1, sample * amplitude));
      buffer.writeInt16LE(Math.round(intSample * 32767), offset);
      offset += 2;
    }

    return buffer;
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);

  const frequenciesForStemType = (stemType: StemType): number[] => {
    switch (stemType) {
      case "MASTER":
        return [110, 220, 440];
      case "DRUMS":
        return [60, 120];
      case "BASS":
        return [110];
      case "SYNTHS":
        return [440];
      case "VOCALS":
        return [330];
      case "MELODY":
        return [550];
      case "FX":
        return [800];
      case "OTHER":
      default:
        return [250];
    }
  };

  // Update to RENDERING
  await prisma.track.update({
    where: { id: trackId },
    data: { abletonRenderStatus: "RENDERING" },
  });

  try {
    const projectData = track.abletonProjectData as any;

    // Delete existing stems
    await prisma.trackStem.deleteMany({
      where: { trackId },
    });

    // Create stems based on project tracks
    const tracks = projectData.tracks || [];

    const fs = await import("fs/promises");
    const path = await import("path");
    const outputDir = path.join(process.cwd(), "public", "generated-stems", trackId);
    await fs.mkdir(outputDir, { recursive: true });

    const durationSeconds = Math.max(2, Math.min(30, Math.floor((track.duration ?? 12) || 12)));

    const masterStemType: StemType = "MASTER";
    const masterFilename = `00-master.wav`;
    const masterFilePath = path.join(outputDir, masterFilename);
    const masterBuffer = createToneWavBuffer({
      seconds: durationSeconds,
      frequencies: frequenciesForStemType(masterStemType),
    });
    await fs.writeFile(masterFilePath, masterBuffer);
    const masterUrl = `/generated-stems/${trackId}/${masterFilename}`;

    // Create a master stem (using the track's sourceUrl)
    await prisma.trackStem.create({
      data: {
        trackId,
        stemUrl: masterUrl,
        stemType: "MASTER",
        label: "Master",
        order: 0,
      },
    });

    // For demo purposes, create placeholder stems for each project track
    // In production, these would be actual rendered audio files
    let order = 1;
    for (const projectTrack of tracks.slice(0, 7)) {
      // Max 7 stems
      const stemType: StemType = detectStemType(projectTrack.name);

      const safeName = slugify(String(projectTrack.name ?? "stem")) || "stem";
      const filename = `${String(order).padStart(2, "0")}-${safeName}.wav`;
      const filePath = path.join(outputDir, filename);

      const buffer = createToneWavBuffer({
        seconds: durationSeconds,
        frequencies: frequenciesForStemType(stemType),
      });
      await fs.writeFile(filePath, buffer);
      const fileUrl = `/generated-stems/${trackId}/${filename}`;

      await prisma.trackStem.create({
        data: {
          trackId,
          stemUrl: fileUrl,
          stemType,
          label: projectTrack.name,
          order,
        },
      });

      order++;
    }

    // Update to COMPLETED
    await prisma.track.update({
      where: { id: trackId },
      data: {
        abletonRenderStatus: "COMPLETED",
        hasStems: true,
        ...(isZipSource ? { sourceUrl: masterUrl } : {}),
      },
    });

    console.log(`[Ableton Render] Completed render for track ${trackId}`);
  } catch (error) {
    console.error(`[Ableton Render] Failed to render track ${trackId}:`, error);

    await prisma.track.update({
      where: { id: trackId },
      data: { abletonRenderStatus: "FAILED" },
    });

    throw error;
  }
}

/**
 * Detect stem type from track name
 */
function detectStemType(trackName: string): StemType {
  const lower = trackName.toLowerCase();

  if (lower.includes("kick") || lower.includes("drum") || lower.includes("perc")) {
    return "DRUMS";
  }
  if (lower.includes("bass")) {
    return "BASS";
  }
  if (lower.includes("vocal") || lower.includes("vox")) {
    return "VOCALS";
  }
  if (lower.includes("synth") || lower.includes("pad") || lower.includes("key")) {
    return "SYNTHS";
  }
  if (lower.includes("lead") || lower.includes("melody") || lower.includes("guitar") || lower.includes("piano")) {
    return "MELODY";
  }
  if (lower.includes("fx") || lower.includes("effect") || lower.includes("atmosphere")) {
    return "FX";
  }

  return "OTHER";
}

/**
 * Get all pending renders (for admin view)
 */
export async function getPendingRenders() {
  return await prisma.track.findMany({
    where: {
      abletonRenderStatus: {
        in: ["PENDING", "RENDERING"],
      },
    },
    include: {
      ArtistProfile: {
        select: {
          artistName: true,
        },
      },
      TrackStem: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Get all completed/failed renders (for admin view)
 */
export async function getCompletedRenders(limit = 20) {
  return await prisma.track.findMany({
    where: {
      abletonRenderStatus: {
        in: ["COMPLETED", "FAILED"],
      },
    },
    include: {
      ArtistProfile: {
        select: {
          artistName: true,
        },
      },
      TrackStem: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
