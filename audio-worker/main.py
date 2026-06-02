"""
MixReflect audio analysis worker.

POST /analyze  { "url": "<soundcloud|youtube|direct audio url>" }
  -> downloads the audio (yt-dlp + ffmpeg), measures it (librosa + pyloudnorm),
     and returns the AudioFeatures shape the Next.js app expects.

Deploy this separately (Railway / Render / Fly / a container) — it needs the
ffmpeg + yt-dlp binaries, so it can't live in serverless. Point the app at it
with AUDIO_WORKER_URL (and optionally AUDIO_WORKER_SECRET).
"""

import os
import tempfile
import subprocess

import numpy as np
import librosa
import soundfile as sf
import pyloudnorm as pyln
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

app = FastAPI(title="mixreflect-audio-worker")
SECRET = os.environ.get("AUDIO_WORKER_SECRET")
KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


class AnalyzeReq(BaseModel):
    url: str


@app.get("/health")
def health():
    return {"ok": True}


def download_audio(url: str, out_dir: str) -> str:
    out = os.path.join(out_dir, "audio.%(ext)s")
    subprocess.run(
        ["yt-dlp", "-x", "--audio-format", "wav", "--audio-quality", "0",
         "--no-playlist", "--quiet", "-o", out, url],
        check=True,
        timeout=120,
    )
    for f in os.listdir(out_dir):
        if f.startswith("audio"):
            return os.path.join(out_dir, f)
    raise RuntimeError("download produced no file")


def estimate_key(y, sr) -> str:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr).mean(axis=1)
    root = int(np.argmax(chroma))
    mode = "major" if chroma[(root + 4) % 12] >= chroma[(root + 3) % 12] else "minor"
    return f"{KEYS[root]} {mode}"


def analyze(path: str) -> dict:
    data, sr = sf.read(path)
    mono = data.mean(axis=1) if data.ndim > 1 else data
    mono = mono.astype(np.float32)
    duration = len(mono) / sr

    # Integrated loudness (LUFS)
    try:
        lufs = round(float(pyln.Meter(sr).integrated_loudness(data)), 1)
    except Exception:
        lufs = None

    # RMS energy curve
    hop = 2048
    rms = librosa.feature.rms(y=mono, hop_length=hop)[0]
    times = librosa.times_like(rms, sr=sr, hop_length=hop)
    peak = float(np.max(rms)) or 1e-9
    rms_db = 20 * np.log10(np.maximum(rms, 1e-6))

    energy = round(float(np.mean(rms) / peak), 3)
    dynamic_range = round(float(np.percentile(rms_db, 95) - np.percentile(rms_db, 5)), 1)

    # Intro lift: first sustained moment above 60% of peak energy
    intro = None
    for t, v in zip(times, rms):
        if v >= 0.6 * peak:
            intro = round(float(t), 1)
            break

    # Energy dips: stretches >3s that sit >5 dB below the median
    dips = []
    med = float(np.median(rms_db))
    in_dip, start, mind = False, 0.0, 0.0
    for t, v in zip(times, rms_db):
        if v < med - 5 and (intro is None or t > intro):
            if not in_dip:
                in_dip, start, mind = True, float(t), float(v)
            else:
                mind = min(mind, float(v))
        elif in_dip:
            in_dip = False
            if t - start > 3:
                dips.append({"startSec": round(start), "endSec": round(float(t)),
                             "dropDb": round(med - mind, 1)})
    dips = dips[:3]

    # Spectral balance by band
    S = np.abs(librosa.stft(mono, n_fft=2048)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    total = float(S.sum()) + 1e-9
    bands = {"sub": (0, 60), "bass": (60, 250), "lowMid": (250, 500),
             "mid": (500, 2000), "high": (2000, sr / 2)}
    spectral = {
        name: round(float(S[(freqs >= lo) & (freqs < hi), :].sum()) / total, 3)
        for name, (lo, hi) in bands.items()
    }

    tempo = round(float(librosa.beat.tempo(y=mono, sr=sr)[0]))

    return {
        "durationSec": round(duration),
        "tempo": tempo,
        "key": estimate_key(mono, sr),
        "loudnessLufs": lufs,
        "dynamicRange": dynamic_range,
        "energy": energy,
        "spectral": spectral,
        "introLiftSec": intro,
        "energyDips": dips,
    }


@app.post("/analyze")
def analyze_url(req: AnalyzeReq, authorization: str = Header(default="")):
    if SECRET and authorization != f"Bearer {SECRET}":
        raise HTTPException(status_code=401, detail="unauthorized")
    try:
        with tempfile.TemporaryDirectory() as tmp:
            path = download_audio(req.url, tmp)
            return analyze(path)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="download timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"analysis failed: {e}")
