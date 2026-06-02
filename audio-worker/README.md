# MixReflect audio worker

Pulls audio from a track link and measures it, returning the `AudioFeatures`
shape the Next.js app expects. Lives **separately** from the app because it
needs `ffmpeg` + `yt-dlp` binaries (can't run in serverless).

## What it returns

`POST /analyze { "url": "..." }` →

```json
{
  "durationSec": 212, "tempo": 124, "key": "F# minor",
  "loudnessLufs": -9.2, "dynamicRange": 6.4, "energy": 0.71,
  "spectral": { "sub": 0.12, "bass": 0.26, "lowMid": 0.18, "mid": 0.31, "high": 0.13 },
  "introLiftSec": 41.0,
  "energyDips": [{ "startSec": 108, "endSec": 130, "dropDb": 6.1 }]
}
```

## Run locally

```bash
cd audio-worker
pip install -r requirements.txt          # needs ffmpeg installed on your machine
uvicorn main:app --reload --port 8080
curl -X POST localhost:8080/analyze -H 'content-type: application/json' \
  -d '{"url":"https://soundcloud.com/.../track"}'
```

## Deploy (Railway / Render / Fly / any container host)

It's a standard Dockerfile — point your host at this folder. Set an
`AUDIO_WORKER_SECRET` env on the service if you want auth.

## Wire it to the app

In the Next.js app's environment:

```
AUDIO_WORKER_URL=https://your-worker.example.com
AUDIO_WORKER_SECRET=<same secret, optional>
```

Once `AUDIO_WORKER_URL` is set, `acquireAudioFeatures()` in
`src/lib/audio-analysis.ts` calls this worker automatically and the AI report
becomes grounded in real measurements. Until then the app falls back to a
careful, non-grounded read (no fabricated technical claims).

## Notes / next steps

- Spotify links are handled in the app directly (Audio Features API) — this
  worker covers SoundCloud / YouTube / direct audio URLs.
- `key`/`tempo` are estimates; energy-dip detection is heuristic. Good enough
  to ground feedback; refine thresholds as you see real tracks.
- For "vocal buried" / true mix-balance claims you'd add source separation
  (Demucs) here later — heavier (GPU), so it's a P3.
- yt-dlp from YouTube/SoundCloud is a ToS gray area; prefer it for tracks the
  uploader owns, and consider an upload path for anything sensitive.
