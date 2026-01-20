import JSZip from "jszip";
import pako from "pako";

// Maximum total size of samples to load into memory (100MB)
const MAX_MEMORY_BYTES = 100 * 1024 * 1024;
// Maximum individual file size to auto-load (10MB)
const MAX_AUTO_LOAD_FILE_SIZE = 10 * 1024 * 1024;

export interface AbletonSample {
  name: string;
  path: string;
  blob?: Blob; // Only populated when loaded
  url?: string; // Object URL for playback, only when loaded
  duration?: number;
  trackName?: string; // Which track this sample belongs to
  size: number; // File size in bytes
  loaded: boolean; // Whether the sample has been loaded into memory
  _zipEntry?: JSZip.JSZipObject; // Internal reference for lazy loading
}

export interface AbletonTrackWithAudio {
  name: string;
  type: "audio" | "midi" | "return" | "master";
  color: number;
  samples: AbletonSample[];
  plugins: string[];
}

export interface AbletonProjectBundle {
  projectName: string;
  tempo: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  tracks: AbletonTrackWithAudio[];
  allSamples: AbletonSample[];
  abletonVersion: string;
  warnings: string[];
}

function getAttr(element: Element | null, attr: string): string {
  return element?.getAttribute(attr) || "";
}

interface TrackSampleRef {
  trackName: string;
  trackType: "audio" | "midi" | "return" | "master";
  trackColor: number;
  samplePaths: string[];
  plugins: string[];
}

function parseProjectXml(xmlString: string): {
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  trackSampleRefs: TrackSampleRef[];
  abletonVersion: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const ableton = doc.querySelector("Ableton");
  const abletonVersion = getAttr(ableton, "Creator") || "Unknown";

  // Get tempo
  const tempoEl = doc.querySelector("Tempo > Manual");
  const tempo = parseFloat(getAttr(tempoEl, "Value") || "120");

  // Get time signature
  const timeSignatureEl = doc.querySelector("TimeSignature");
  const numerator = parseInt(
    getAttr(timeSignatureEl?.querySelector("Numerator") ?? null, "Value") || "4",
    10
  );
  const denominator = parseInt(
    getAttr(timeSignatureEl?.querySelector("Denominator") ?? null, "Value") || "4",
    10
  );

  const trackSampleRefs: TrackSampleRef[] = [];

  // Parse audio tracks
  const audioTracks = doc.querySelectorAll("Tracks > AudioTrack");
  audioTracks.forEach((track) => {
    const nameEl = track.querySelector("Name > EffectiveName");
    const name = getAttr(nameEl, "Value") || "Audio Track";
    const colorEl = track.querySelector("Color");
    const color = parseInt(getAttr(colorEl, "Value") || "0", 10);

    // Find sample references in this track
    const samplePaths: string[] = [];
    const sampleRefs = track.querySelectorAll("SampleRef > FileRef");
    sampleRefs.forEach((ref) => {
      const relativePath = getAttr(ref.querySelector("RelativePath"), "Value");
      const name = getAttr(ref.querySelector("Name"), "Value");
      if (relativePath) {
        samplePaths.push(relativePath);
      } else if (name) {
        samplePaths.push(name);
      }
    });

    // Get plugins
    const plugins: string[] = [];
    const deviceChain = track.querySelector("DeviceChain");
    if (deviceChain) {
      const pluginDevices = deviceChain.querySelectorAll(
        "PluginDevice, AuPluginDevice, Vst3PluginDevice"
      );
      pluginDevices.forEach((device) => {
        const pluginName =
          getAttr(device.querySelector("PluginDesc > VstPluginInfo > PluginName"), "Value") ||
          getAttr(device.querySelector("PluginDesc > AuPluginInfo > Name"), "Value") ||
          "Unknown Plugin";
        if (pluginName !== "Unknown Plugin") {
          plugins.push(pluginName);
        }
      });
    }

    trackSampleRefs.push({
      trackName: name,
      trackType: "audio",
      trackColor: color,
      samplePaths,
      plugins,
    });
  });

  // Parse MIDI tracks (they might have sampler instruments with samples)
  const midiTracks = doc.querySelectorAll("Tracks > MidiTrack");
  midiTracks.forEach((track) => {
    const nameEl = track.querySelector("Name > EffectiveName");
    const name = getAttr(nameEl, "Value") || "MIDI Track";
    const colorEl = track.querySelector("Color");
    const color = parseInt(getAttr(colorEl, "Value") || "0", 10);

    const samplePaths: string[] = [];
    const sampleRefs = track.querySelectorAll("SampleRef > FileRef");
    sampleRefs.forEach((ref) => {
      const relativePath = getAttr(ref.querySelector("RelativePath"), "Value");
      const name = getAttr(ref.querySelector("Name"), "Value");
      if (relativePath) {
        samplePaths.push(relativePath);
      } else if (name) {
        samplePaths.push(name);
      }
    });

    const plugins: string[] = [];
    const deviceChain = track.querySelector("DeviceChain");
    if (deviceChain) {
      const pluginDevices = deviceChain.querySelectorAll(
        "PluginDevice, AuPluginDevice, Vst3PluginDevice"
      );
      pluginDevices.forEach((device) => {
        const pluginName =
          getAttr(device.querySelector("PluginDesc > VstPluginInfo > PluginName"), "Value") ||
          getAttr(device.querySelector("PluginDesc > AuPluginInfo > Name"), "Value") ||
          "Unknown Plugin";
        if (pluginName !== "Unknown Plugin") {
          plugins.push(pluginName);
        }
      });
    }

    trackSampleRefs.push({
      trackName: name,
      trackType: "midi",
      trackColor: color,
      samplePaths,
      plugins,
    });
  });

  return {
    tempo,
    timeSignature: { numerator, denominator },
    trackSampleRefs,
    abletonVersion,
  };
}

export async function loadAbletonProjectZip(file: File): Promise<AbletonProjectBundle> {
  const warnings: string[] = [];
  
  // Load the ZIP
  const zip = await JSZip.loadAsync(file);
  
  // Find the .als file
  let alsPath = "";
  let projectFolder = "";
  
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (relativePath.endsWith(".als") && !zipEntry.dir) {
      alsPath = relativePath;
      // Get the project folder (parent of .als file)
      const parts = relativePath.split("/");
      if (parts.length > 1) {
        projectFolder = parts.slice(0, -1).join("/") + "/";
      }
      break;
    }
  }

  if (!alsPath) {
    throw new Error("No .als file found in the ZIP. Make sure you zipped the Ableton project folder.");
  }

  const alsFile = zip.files[alsPath];
  
  // Extract and decompress the .als file
  const alsData = await alsFile.async("uint8array");
  let xmlString: string;
  try {
    const decompressed = pako.inflate(alsData);
    xmlString = new TextDecoder("utf-8").decode(decompressed);
  } catch {
    throw new Error("Failed to decompress .als file. It may be corrupted.");
  }

  // Parse the project XML
  const projectInfo = parseProjectXml(xmlString);
  
  // Find all audio files in the ZIP
  const audioFiles = new Map<string, JSZip.JSZipObject>();
  const audioExtensions = [".wav", ".mp3", ".aif", ".aiff", ".flac", ".ogg", ".m4a"];
  
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      const lowerPath = relativePath.toLowerCase();
      if (audioExtensions.some(ext => lowerPath.endsWith(ext))) {
        // Store by filename for matching
        const fileName = relativePath.split("/").pop() || "";
        audioFiles.set(fileName.toLowerCase(), zipEntry);
        // Also store by relative path
        audioFiles.set(relativePath.toLowerCase(), zipEntry);
      }
    }
  });

  // Match samples to tracks - use LAZY LOADING to avoid memory exhaustion
  const allSamples: AbletonSample[] = [];
  const tracks: AbletonTrackWithAudio[] = [];
  let totalLoadedBytes = 0;

  for (const trackRef of projectInfo.trackSampleRefs) {
    const trackSamples: AbletonSample[] = [];

    for (const samplePath of trackRef.samplePaths) {
      // Try to find the sample in the ZIP
      const fileName = samplePath.split("/").pop() || samplePath;
      const normalizedPath = samplePath.toLowerCase().replace(/\\/g, "/");
      
      let zipEntry = audioFiles.get(fileName.toLowerCase());
      if (!zipEntry) {
        zipEntry = audioFiles.get(normalizedPath);
      }
      if (!zipEntry) {
        // Try with project folder prefix
        zipEntry = audioFiles.get((projectFolder + samplePath).toLowerCase());
      }

      if (zipEntry) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fileSize = (zipEntry as any)._data?.uncompressedSize || 0;
        
        // Create sample reference WITHOUT loading the audio data yet
        const sample: AbletonSample = {
          name: fileName,
          path: samplePath,
          trackName: trackRef.trackName,
          size: fileSize,
          loaded: false,
          _zipEntry: zipEntry,
        };
        
        trackSamples.push(sample);
        allSamples.push(sample);
      } else {
        warnings.push(`Sample not found in ZIP: ${fileName}`);
      }
    }

    tracks.push({
      name: trackRef.trackName,
      type: trackRef.trackType,
      color: trackRef.trackColor,
      samples: trackSamples,
      plugins: trackRef.plugins,
    });
  }

  // Also find any audio files not explicitly referenced (might be in Samples folder)
  const loadedPaths = new Set(allSamples.map(s => s.path.toLowerCase()));
  
  for (const [path, zipEntry] of audioFiles) {
    if (!loadedPaths.has(path)) {
      const fileName = path.split("/").pop() || path;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileSize = (zipEntry as any)._data?.uncompressedSize || 0;
      
      allSamples.push({
        name: fileName,
        path,
        size: fileSize,
        loaded: false,
        _zipEntry: zipEntry,
      });
    }
  }

  // Auto-load only small samples up to memory limit
  for (const sample of allSamples) {
    if (sample.size <= MAX_AUTO_LOAD_FILE_SIZE && totalLoadedBytes + sample.size <= MAX_MEMORY_BYTES) {
      try {
        await loadSampleIntoMemory(sample);
        totalLoadedBytes += sample.size;
      } catch {
        // Skip samples that fail to load
      }
    }
  }

  if (totalLoadedBytes >= MAX_MEMORY_BYTES) {
    warnings.push(`Large project: only ${Math.round(totalLoadedBytes / 1024 / 1024)}MB of samples auto-loaded. Click samples to load more.`);
  }

  const projectName = alsPath.replace(/\.als$/i, "").split("/").pop() || "Untitled";

  return {
    projectName,
    tempo: projectInfo.tempo,
    timeSignatureNumerator: projectInfo.timeSignature.numerator,
    timeSignatureDenominator: projectInfo.timeSignature.denominator,
    tracks,
    allSamples,
    abletonVersion: projectInfo.abletonVersion,
    warnings,
  };
}

// Helper to get MIME type from filename
function getMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".aif") || lower.endsWith(".aiff")) return "audio/aiff";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  return "audio/mpeg";
}

// Load a single sample into memory (for lazy loading)
export async function loadSampleIntoMemory(sample: AbletonSample): Promise<void> {
  if (sample.loaded || !sample._zipEntry) return;
  
  const audioData = await sample._zipEntry.async("blob");
  const mimeType = getMimeType(sample.name);
  const blob = new Blob([audioData], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  sample.blob = blob;
  sample.url = url;
  sample.loaded = true;
  
  // Clear the zip entry reference to allow GC
  delete sample._zipEntry;
}

// Cleanup function to revoke object URLs when done
export function cleanupProjectBundle(bundle: AbletonProjectBundle) {
  for (const sample of bundle.allSamples) {
    if (sample.url) {
      URL.revokeObjectURL(sample.url);
    }
  }
}
