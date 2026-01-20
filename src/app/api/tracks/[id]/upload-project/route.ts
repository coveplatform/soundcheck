import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import pako from "pako";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Maximum project size: 500MB
const MAX_PROJECT_SIZE = 500 * 1024 * 1024;

async function parseAbletonProjectFromZip(zipData: ArrayBuffer) {
  const zip = await JSZip.loadAsync(zipData);

  // Find the .als file
  let alsPath = "";
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (relativePath.endsWith(".als") && !zipEntry.dir) {
      alsPath = relativePath;
      break;
    }
  }

  if (!alsPath) {
    throw new Error("No .als file found in ZIP");
  }

  const alsFile = zip.files[alsPath];
  const alsData = await alsFile.async("uint8array");

  // Decompress .als file (it's gzipped XML)
  let xmlString: string;
  try {
    const decompressed = pako.inflate(alsData);
    xmlString = new TextDecoder("utf-8").decode(decompressed);
  } catch {
    throw new Error("Failed to decompress .als file");
  }

  // Parse XML to extract metadata
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Failed to parse Ableton project XML");
  }

  // Extract key metadata
  const tempoEl = doc.querySelector("Tempo > Manual");
  const tempo = parseFloat(tempoEl?.getAttribute("Value") || "120");

  const timeSignatureEl = doc.querySelector("TimeSignature");
  const numerator = parseInt(
    timeSignatureEl?.querySelector("Numerator")?.getAttribute("Value") || "4",
    10
  );
  const denominator = parseInt(
    timeSignatureEl?.querySelector("Denominator")?.getAttribute("Value") || "4",
    10
  );

  // Count tracks
  const audioTracks = doc.querySelectorAll("Tracks > AudioTrack");
  const midiTracks = doc.querySelectorAll("Tracks > MidiTrack");

  // Extract track info
  const tracks = [];
  const getTrackName = (track: Element) => {
    const nameEl = track.querySelector("Name > EffectiveName");
    return nameEl?.getAttribute("Value") || "Untitled Track";
  };

  audioTracks.forEach((track) => {
    tracks.push({
      name: getTrackName(track),
      type: "audio",
    });
  });

  midiTracks.forEach((track) => {
    tracks.push({
      name: getTrackName(track),
      type: "midi",
    });
  });

  // Extract plugin info
  const plugins = new Set<string>();
  doc.querySelectorAll("PluginDevice, AuPluginDevice, Vst3PluginDevice").forEach((device) => {
    const pluginName =
      device.querySelector("PluginDesc > VstPluginInfo > PluginName")?.getAttribute("Value") ||
      device.querySelector("PluginDesc > AuPluginInfo > Name")?.getAttribute("Value") ||
      "Unknown Plugin";
    if (pluginName !== "Unknown Plugin") {
      plugins.add(pluginName);
    }
  });

  return {
    tempo,
    timeSignature: `${numerator}/${denominator}`,
    trackCount: tracks.length,
    audioTrackCount: audioTracks.length,
    midiTrackCount: midiTracks.length,
    tracks,
    plugins: Array.from(plugins),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trackId } = await params;

    // Verify track ownership
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: {
          select: { userId: true },
        },
      },
    });

    if (!track || track.artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Get the multipart form data
    const formData = await request.formData();
    const file = formData.get("project") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_PROJECT_SIZE) {
      return NextResponse.json(
        { error: `Project too large. Maximum size is ${MAX_PROJECT_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse project metadata
    let projectData;
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

      const key = `ableton-projects/${trackId}/${Date.now()}-${file.name}`;

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

      const uploadsDir = path.join(process.cwd(), "public", "ableton-projects", trackId);
      await fs.mkdir(uploadsDir, { recursive: true });

      const filePath = path.join(uploadsDir, `${Date.now()}-${file.name}`);
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));

      projectUrl = `/ableton-projects/${trackId}/${path.basename(filePath)}`;
    }

    // Update track with project data
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: {
        abletonProjectUrl: projectUrl,
        abletonProjectData: projectData as any,
        abletonRenderStatus: "PENDING",
        bpm: Math.round(projectData.tempo),
      },
    });

    // TODO: Queue background rendering job
    // For now, mark as PENDING - admin/worker will pick it up later

    return NextResponse.json({
      success: true,
      projectUrl,
      projectData,
      renderStatus: "PENDING",
    });
  } catch (error) {
    console.error("Error uploading Ableton project:", error);
    return NextResponse.json(
      { error: "Failed to upload project" },
      { status: 500 }
    );
  }
}
