import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import JSZip from "jszip";
import pako from "pako";
import { XMLParser } from "fast-xml-parser";

// Maximum project size: 500MB
const MAX_PROJECT_SIZE = 500 * 1024 * 1024;

interface ProjectMetadata {
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

async function parseAbletonProjectFromZip(zipData: ArrayBuffer): Promise<ProjectMetadata> {
  const zip = await JSZip.loadAsync(zipData);

  // Find the .als file
  let alsPath = "";
  let projectName = "Untitled Project";

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (relativePath.endsWith(".als") && !zipEntry.dir) {
      alsPath = relativePath;
      // Extract project name from path
      const pathParts = relativePath.split("/");
      projectName = pathParts[pathParts.length - 1].replace(".als", "");
      break;
    }
  }

  if (!alsPath) {
    throw new Error("No .als file found in ZIP. Make sure you uploaded a complete Ableton project.");
  }

  const alsFile = zip.files[alsPath];
  const alsData = await alsFile.async("uint8array");

  // Decompress .als file (it's gzipped XML)
  let xmlString: string;
  try {
    const decompressed = pako.inflate(alsData);
    xmlString = new TextDecoder("utf-8").decode(decompressed);
  } catch {
    throw new Error("Failed to decompress .als file. Make sure it's a valid Ableton project.");
  }

  // Parse XML to extract metadata
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
  });

  let parsed: any;
  try {
    parsed = parser.parse(xmlString);
  } catch {
    throw new Error("Failed to parse Ableton project XML");
  }

  // Navigate to LiveSet root
  const liveSet = parsed.Ableton || parsed.LiveSet || parsed;

  // Extract tempo (usually in LiveSet > Tempo > Manual)
  let tempo = 120;
  try {
    const tempoValue = liveSet?.LiveSet?.Tempo?.Manual?.["@_Value"];
    if (tempoValue) {
      tempo = parseFloat(tempoValue);
    }
  } catch {
    // Use default
  }

  // Extract time signature
  let numerator = 4;
  let denominator = 4;
  try {
    const timeSig = liveSet?.LiveSet?.TimeSignature;
    if (timeSig?.Numerator?.["@_Value"]) {
      numerator = parseInt(timeSig.Numerator["@_Value"], 10);
    }
    if (timeSig?.Denominator?.["@_Value"]) {
      denominator = parseInt(timeSig.Denominator["@_Value"], 10);
    }
  } catch {
    // Use defaults
  }

  // Extract tracks
  const tracks: Array<{ name: string; type: string }> = [];
  const tracksData = liveSet?.LiveSet?.Tracks;

  if (tracksData) {
    // Handle audio tracks
    let audioTracks = tracksData.AudioTrack;
    if (audioTracks) {
      if (!Array.isArray(audioTracks)) {
        audioTracks = [audioTracks];
      }
      audioTracks.forEach((track: any) => {
        const trackName = track?.Name?.EffectiveName?.["@_Value"] || "Audio Track";
        tracks.push({ name: trackName, type: "audio" });
      });
    }

    // Handle MIDI tracks
    let midiTracks = tracksData.MidiTrack;
    if (midiTracks) {
      if (!Array.isArray(midiTracks)) {
        midiTracks = [midiTracks];
      }
      midiTracks.forEach((track: any) => {
        const trackName = track?.Name?.EffectiveName?.["@_Value"] || "MIDI Track";
        tracks.push({ name: trackName, type: "midi" });
      });
    }
  }

  // Extract plugin info (simplified for now - Ableton XML structure is complex)
  const plugins = new Set<string>();

  // Helper function to recursively find plugins in the object
  const findPlugins = (obj: any) => {
    if (!obj || typeof obj !== "object") return;

    // Check if this is a plugin device
    if (obj.PluginDesc) {
      const pluginName =
        obj.PluginDesc?.VstPluginInfo?.PluginName?.["@_Value"] ||
        obj.PluginDesc?.AuPluginInfo?.Name?.["@_Value"] ||
        null;
      if (pluginName && pluginName !== "Unknown Plugin") {
        plugins.add(pluginName);
      }
    }

    // Recursively search nested objects
    Object.values(obj).forEach((value) => {
      if (typeof value === "object") {
        findPlugins(value);
      }
    });
  };

  findPlugins(liveSet);

  // Count audio files in ZIP
  const audioExtensions = [".wav", ".mp3", ".aif", ".aiff", ".flac", ".ogg", ".m4a"];
  let sampleCount = 0;
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      const lowerPath = relativePath.toLowerCase();
      if (audioExtensions.some((ext) => lowerPath.endsWith(ext))) {
        sampleCount++;
      }
    }
  });

  const audioTrackCount = tracks.filter((t) => t.type === "audio").length;
  const midiTrackCount = tracks.filter((t) => t.type === "midi").length;

  return {
    projectName,
    tempo,
    timeSignature: `${numerator}/${denominator}`,
    trackCount: tracks.length,
    audioTrackCount,
    midiTrackCount,
    tracks,
    plugins: Array.from(plugins),
    sampleCount,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the multipart form data
    const formData = await request.formData();
    const file = formData.get("project") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Please upload a ZIP file" },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROJECT_SIZE) {
      return NextResponse.json(
        { error: `Project too large. Maximum size is ${MAX_PROJECT_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse project metadata first
    let projectData: ProjectMetadata;
    try {
      projectData = await parseAbletonProjectFromZip(arrayBuffer);
    } catch (error) {
      console.error("Failed to parse Ableton project:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to parse project" },
        { status: 400 }
      );
    }

    // Upload to S3 or local storage
    let projectUrl: string;
    const timestamp = Date.now();
    const userId = session.user.id;

    if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_REGION) {
      // Upload to S3
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `ableton-projects/${userId}/${timestamp}-${sanitizedFileName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: Buffer.from(arrayBuffer),
          ContentType: "application/zip",
        })
      );

      projectUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } else {
      // Fallback to local storage (for development)
      const fs = await import("fs/promises");
      const path = await import("path");

      const uploadsDir = path.join(process.cwd(), "public", "ableton-projects", userId);
      await fs.mkdir(uploadsDir, { recursive: true });

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = path.join(uploadsDir, `${timestamp}-${sanitizedFileName}`);
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));

      projectUrl = `/ableton-projects/${userId}/${timestamp}-${sanitizedFileName}`;
    }

    return NextResponse.json({
      success: true,
      projectUrl,
      projectData,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Error uploading Ableton project:", error);
    return NextResponse.json(
      { error: "Failed to upload project" },
      { status: 500 }
    );
  }
}
