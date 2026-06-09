# Deep Report Quality Buildout — handoff (2026-06-09)

Resume doc for the score-report depth work: stem grounding + re-upload memory.
All code is **shipped to `main`** in both repos and deploying; the only open item
is **validating the prod Replicate stem path** and a couple of unknowns that need a
live run to confirm.

## Repos
- App: `C:\Users\simli\Desktop\review\soundcheck` (GitHub `coveplatform/soundcheck`)
- Worker: `C:\Users\simli\Desktop\mixreflect-audio-worker` (GitHub `coveplatform/mixreflect-audio-worker`, deploys on **Render**)

## What shipped today (all on `main`)
1. **Start-at-click** — logged-out report generates *during* the Google auth round-trip.
   `/api/score/start` (pre-auth, creates report + `claimToken`, bg generate) → `/api/score/claim`.
   Abandoned-report GC in the daily cron. Schema += `claimToken/claimedAt/createdByIp`.
2. **Deep read on purchase (Option A — score LOCKED)** — `regenerateDeepReport()` rewrites
   the prose on **gpt-4.1** (env `SCORE_REPORT_DEEP_MODEL`) on unlock; score/dimensions never change.
   Deep mode **throws on failure** so it never clobbers a paid report with the fallback.
   Triggers (idempotent via `reviewerQuotes.deep`): Stripe unlock webhook, end of
   `generateAndStoreReport` when already paid, `/api/score/claim` subscriber unlock.
3. **Full-track grounding** — deep prompt now walks the whole worker section map (not "opening only").
4. **Stems via Replicate** (worker) — `stems.separate()` offloads GPU separation to Replicate when
   `REPLICATE_API_TOKEN` is set (no torch on the box); local numpy `structure_from_stems` runs locally.
   `/analyze` takes a `deep` flag (instant skips stems, deep runs them).
5. **Re-upload memory (fingerprint)** — worker returns a link-independent acoustic fingerprint
   (duration/tempo/key/spectral/energy + arrangement shape). App stores it (`TrackScoreReport.fingerprint`),
   `findPriorVersion()` matches a re-upload across different links, and the prompt gets a prior-read block:
   **identical** audio → stay consistent; **changed** master → diff vs last version (progress-tracking feature).

Key commits: app `bdb6289` (stems+fingerprint), worker `40ab8a6` + `3e8348a` (docs).

## OPEN — pick up here tomorrow
**Goal:** confirm the prod Replicate stem path works, then regenerate the two test tracks so
the stem-grounded deep reads are visible.

The user has **added `REPLICATE_API_TOKEN` to the Render worker and redeployed.** Next:

1. **Get the prod worker URL** (the Render service URL — not in the repo; it's a Vercel/Render env).
   Confirm `GET <worker>/health` → `"stemBackend": "replicate"`.
2. **Two unknowns to confirm on the first live run** (couldn't verify without the token):
   - **Model version SHA** — `stems.py:REPLICATE_DEMUCS_MODEL` is `cjwbw/demucs:<sha>`; the `<sha>`
     is a placeholder. Verify the current version on the Replicate model page; override via
     `REPLICATE_DEMUCS_MODEL` env if different.
   - **Output shape** — `_separate_replicate()` parses demucs output as `{vocals,drums,bass,other}`
     URLs with fallbacks + logging. Check worker logs on the first run; ~2-line tweak if the shape differs.
3. **Regenerate the two test tracks** routed through the prod worker (so stems come from Replicate).

### Test tracks (prod DB, subscriber riku.korkiamaki@gmail.com = unlimited)
- Elysium (Metal): slug `cmq6gm196000104jsgmc39l4x` — score 76
- Piece for String Ensemble: slug `cmq6bydpr000104jmpwyoh28u` — score 74
- View: `https://www.mixreflect.com/report/<slug>` (both paid=Y, so unlocked)

### How to regenerate locally (the pattern used today)
- Env lives in **`.env.local`** (prod `DATABASE_URL`, `OPENAI_API_KEY`, `AUDIO_WORKER_SECRET`).
  `AUDIO_WORKER_URL` there is `127.0.0.1:8090` (local). To route through **prod Replicate**, override
  `AUDIO_WORKER_URL` to the Render worker URL when running the script.
- Script pattern (tsx): load dotenv `.env.local` FIRST, then **dynamic-import** `@/lib/prisma` and
  `@/lib/score-report-ai` (static imports eval prisma before env loads → "DATABASE_URL not defined").
  `@` alias resolves in tsx. Call `regenerateDeepReport(reportId)` (deep, stems) or
  `generateAndStoreReport(reportId)` (instant+chained deep if paid). Then print
  `https://www.mixreflect.com/report/<slug>`.
- **Local worker with stems** (alternative, no Replicate): this machine has torch+demucs, so
  `cd mixreflect-audio-worker && DJMIX_STEMS=1 python worker.py --port 8090` gives real local-demucs
  stems (downstream identical to Replicate). Deep analyze ≈ 110s/track on local CPU; Replicate GPU ≈ 10-30s.

## Verified working locally today
- Worker instant `/analyze` returns `fingerprint`; deep returns `stemMix`
  (e.g. Piece: `{drums:0.48, bass:0.41, vocals:0.18, vocalVsInstruments:0.4}` = vocal tucked under).
- `fpRelation`: Elysium vs Piece → "different"; same track vs itself → "identical". Logic is sound.

## Lower-priority follow-ups (decided, not yet built)
- **Instant→deep consistency tie-in for one-off payers** — feed the instant read into the deep prompt
  so a paid deep read never contradicts the free teaser. NOT needed for subscribers (they never see a
  teaser; they go straight to deep). Only matters for one-off $6.95 payers.
- **Cost model:** deep read ~$0.03-0.10 (gpt-4.1) + ~$0.02 stems = ~$0.05-0.13/paid track, ~1-2% of $6.95.

## Key files
- App: `src/lib/score-report-ai.ts` (generate/deep/fingerprint/findPriorVersion/prompt),
  `src/lib/audio-analysis.ts` (AudioFeatures, acquireAudioFeatures(url,{deep}), describeFeatures),
  `src/app/api/webhooks/stripe/route.ts` (unlock → deep), `src/app/api/score/{start,claim}/route.ts`.
- Worker: `stems.py` (Replicate `separate()`), `worker.py` (`/analyze` deep flag, fingerprint,
  `to_audio_features`), `WORKER.md` (Replicate setup), `Dockerfile`/`requirements-worker.txt`.
