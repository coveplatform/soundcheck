import { NextResponse } from "next/server";

function createSilentWavBuffer(options?: { seconds?: number; sampleRate?: number }): Buffer {
  const seconds = Math.max(0.1, Math.min(10, options?.seconds ?? 2));
  const sampleRate = Math.max(8000, Math.min(48000, options?.sampleRate ?? 44100));

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

  return buffer;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const secondsRaw = url.searchParams.get("seconds");
  const sampleRateRaw = url.searchParams.get("sampleRate");

  const seconds = secondsRaw ? Number(secondsRaw) : undefined;
  const sampleRate = sampleRateRaw ? Number(sampleRateRaw) : undefined;

  const wav = createSilentWavBuffer({ seconds, sampleRate });
  const body = new Uint8Array(wav);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(wav.byteLength),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
