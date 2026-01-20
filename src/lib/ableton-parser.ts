import pako from "pako";

export interface AbletonTrack {
  name: string;
  type: "audio" | "midi" | "return" | "master";
  color: number;
  plugins: string[];
  isMuted: boolean;
  isSoloed: boolean;
}

export interface AbletonProjectInfo {
  tempo: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  tracks: AbletonTrack[];
  totalTracks: number;
  audioTracks: number;
  midiTracks: number;
  returnTracks: number;
  plugins: string[];
  samples: string[];
  projectLength: number; // in bars
  locators: { name: string; time: number }[];
  abletonVersion: string;
}

function getTextContent(element: Element | null, selector: string): string {
  if (!element) return "";
  const child = element.querySelector(selector);
  if (!child) return "";
  // Check for Value attribute first (common in Ableton XML)
  const valueAttr = child.getAttribute("Value");
  if (valueAttr !== null) return valueAttr;
  return child.textContent?.trim() || "";
}

function getAttr(element: Element | null, attr: string): string {
  return element?.getAttribute(attr) || "";
}

function parseTrack(trackElement: Element, type: AbletonTrack["type"]): AbletonTrack {
  const nameEl = trackElement.querySelector("Name > EffectiveName");
  const name = getAttr(nameEl, "Value") || `${type} Track`;

  const colorEl = trackElement.querySelector("Color");
  const color = parseInt(getAttr(colorEl, "Value") || "0", 10);

  const plugins: string[] = [];
  const deviceChain = trackElement.querySelector("DeviceChain");
  if (deviceChain) {
    // Look for plugin devices
    const devices = deviceChain.querySelectorAll(
      "PluginDevice, AuPluginDevice, Vst3PluginDevice, MxDeviceRef"
    );
    devices.forEach((device) => {
      const pluginName =
        getAttr(device.querySelector("PluginDesc > VstPluginInfo > PluginName"), "Value") ||
        getAttr(device.querySelector("PluginDesc > AuPluginInfo > Name"), "Value") ||
        getAttr(device.querySelector("Name"), "Value") ||
        "Unknown Plugin";
      if (pluginName && pluginName !== "Unknown Plugin") {
        plugins.push(pluginName);
      }
    });

    // Also look for Ableton native devices
    const abletonDevices = deviceChain.querySelectorAll(
      "Eq8, Compressor2, GlueCompressor, Limiter, Gate, AutoFilter, Chorus2, " +
      "Delay, PingPongDelay, FilterDelay, Reverb, Saturator, Overdrive, " +
      "Redux, Erosion, Vinyl, Amp, Cabinet, Pedal, DrumBuss, Echo, Phaser, " +
      "Flanger, FrequencyShifter, RingMod, Vocoder, Corpus, Resonators, " +
      "InstrumentGroupDevice, DrumGroupDevice, MidiArpeggiator, MidiChord, " +
      "MidiNoteLength, MidiPitcher, MidiRandom, MidiScale, MidiVelocity"
    );
    abletonDevices.forEach((device) => {
      plugins.push(device.tagName);
    });
  }

  const muteEl = trackElement.querySelector("DeviceChain > Mixer > Speaker > Manual");
  const isMuted = getAttr(muteEl, "Value") === "false";

  const soloEl = trackElement.querySelector("DeviceChain > Mixer > Solo");
  const isSoloed = getAttr(soloEl, "Value") === "true";

  return {
    name,
    type,
    color,
    plugins,
    isMuted,
    isSoloed,
  };
}

export async function parseAbletonFile(file: File): Promise<AbletonProjectInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Decompress gzip
  let xmlString: string;
  try {
    const decompressed = pako.inflate(uint8Array);
    xmlString = new TextDecoder("utf-8").decode(decompressed);
  } catch {
    throw new Error("Failed to decompress .als file. Make sure it's a valid Ableton Live Set.");
  }

  // Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Failed to parse Ableton project XML.");
  }

  const ableton = doc.querySelector("Ableton");
  if (!ableton) {
    throw new Error("Invalid Ableton file: missing Ableton root element.");
  }

  // Get Ableton version
  const abletonVersion =
    getAttr(ableton, "Creator") || getAttr(ableton, "MajorVersion") || "Unknown";

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

  // Parse tracks
  const tracks: AbletonTrack[] = [];
  const allPlugins = new Set<string>();
  const allSamples = new Set<string>();

  // Audio tracks
  const audioTracks = doc.querySelectorAll("Tracks > AudioTrack");
  audioTracks.forEach((track) => {
    const parsed = parseTrack(track, "audio");
    tracks.push(parsed);
    parsed.plugins.forEach((p) => allPlugins.add(p));
  });

  // MIDI tracks
  const midiTracks = doc.querySelectorAll("Tracks > MidiTrack");
  midiTracks.forEach((track) => {
    const parsed = parseTrack(track, "midi");
    tracks.push(parsed);
    parsed.plugins.forEach((p) => allPlugins.add(p));
  });

  // Return tracks
  const returnTracks = doc.querySelectorAll("Tracks > ReturnTrack");
  returnTracks.forEach((track) => {
    const parsed = parseTrack(track, "return");
    tracks.push(parsed);
    parsed.plugins.forEach((p) => allPlugins.add(p));
  });

  // Master track
  const masterTrack = doc.querySelector("MasterTrack");
  if (masterTrack) {
    const parsed = parseTrack(masterTrack, "master");
    tracks.push(parsed);
    parsed.plugins.forEach((p) => allPlugins.add(p));
  }

  // Find samples
  const sampleRefs = doc.querySelectorAll("SampleRef > FileRef > Name");
  sampleRefs.forEach((ref) => {
    const name = getAttr(ref, "Value");
    if (name) allSamples.add(name);
  });

  // Find locators/markers
  const locators: { name: string; time: number }[] = [];
  const locatorElements = doc.querySelectorAll("Locators > Locators > Locator");
  locatorElements.forEach((loc) => {
    const name = getAttr(loc.querySelector("Name"), "Value") || "Marker";
    const time = parseFloat(getAttr(loc.querySelector("Time"), "Value") || "0");
    locators.push({ name, time });
  });

  // Get project length (from arrangement end or last clip)
  const currentEndEl = doc.querySelector("ArrangementCurrentEnd");
  const projectLength = parseFloat(getAttr(currentEndEl, "Value") || "0");

  return {
    tempo,
    timeSignatureNumerator: numerator,
    timeSignatureDenominator: denominator,
    tracks,
    totalTracks: tracks.length,
    audioTracks: audioTracks.length,
    midiTracks: midiTracks.length,
    returnTracks: returnTracks.length,
    plugins: Array.from(allPlugins),
    samples: Array.from(allSamples),
    projectLength,
    locators,
    abletonVersion,
  };
}

// Color mapping for Ableton track colors (index to hex)
export const ABLETON_COLORS: Record<number, string> = {
  0: "#FF94A6",  // Rose
  1: "#FFA529",  // Orange
  2: "#CC9927",  // Gold
  3: "#F7F47C",  // Yellow
  4: "#BFFB00",  // Lime
  5: "#1AFF2F",  // Green
  6: "#25FFA8",  // Mint
  7: "#5CFFE8",  // Cyan
  8: "#8BC5FF",  // Sky
  9: "#5480E4",  // Blue
  10: "#92A7FF", // Lavender
  11: "#D86CE4", // Purple
  12: "#E553A0", // Magenta
  13: "#FFFFFF", // White
  14: "#FF3636", // Red
  15: "#F66C03", // Deep Orange
  16: "#99724B", // Brown
  17: "#FFF034", // Bright Yellow
  18: "#87FF67", // Light Green
  19: "#3DC300", // Forest
  20: "#00BFAF", // Teal
  21: "#19E9FF", // Light Blue
  22: "#10A4EE", // Ocean
  23: "#007DC0", // Navy
  24: "#886CE4", // Violet
  25: "#B677C6", // Mauve
  26: "#FF39D4", // Pink
  27: "#D0D0D0", // Light Gray
  28: "#B3B3B3", // Gray
  29: "#3C3C3C", // Dark Gray
};

export function getTrackColor(colorIndex: number): string {
  return ABLETON_COLORS[colorIndex] || "#808080";
}
