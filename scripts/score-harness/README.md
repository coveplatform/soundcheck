# Score harness

Regression-tests the scorer against a golden set of tracks with expected score
bands. **Run this before shipping any change to the scoring engine, prompts,
models, or genre norms** — it's the only way to know a change helped.

```bash
npx tsx scripts/score-harness/run.ts                    # v2 engine, full set
npx tsx scripts/score-harness/run.ts --engine v1        # legacy single-prompt engine
npx tsx scripts/score-harness/run.ts --only blinding-lights,strobe
npx tsx scripts/score-harness/run.ts --runs 3           # run-to-run stability
npx tsx scripts/score-harness/run.ts --no-listen        # v2 without the audio-LLM pass
npx tsx scripts/score-harness/run.ts --fresh            # refetch audio features
npx tsx scripts/score-harness/run.ts --save my-config   # write .results/my-config.json
```

## How it works

- Audio features (DSP + the listen excerpt) are fetched once per track via
  `AUDIO_WORKER_URL` and cached in `.cache/<id>.json`. Iterating on prompts
  re-runs only the LLM stages — fast and cheap.
- `--fresh` refetches. Mind which worker `.env.local` points at: the **local**
  worker (`python worker.py --port 8090` in the worker repo) is preferred —
  the prod Render worker serializes analyses, so a fresh full run would occupy
  its only slot for ~15 minutes.
- Excerpts (the listen pass input) require worker rev `excerpt-crest-1`+.
  Features cached from an older worker simply skip the listen pass.

## Reading the output

- `✓ / ✗ OUT` — score inside/outside the track's expected band.
- `[heard]` — the audio-LLM listen pass ran (excerpt present).
- `[UNGROUNDED]` — no DSP features; the engine fell back to v1's cautious path.
- Summary: mean / sd / range / histogram. What "good" looks like:
  - **hits land 85+**, demos land below 60 — the bands catch regressions;
  - **sd well above the v1-era ~4** (the 62–76 compression this engine replaced);
  - dimensions DIFFER within a track when the evidence differs;
  - `--runs 3` worst spread ≤ ~4 points.

## Maintaining the set

`golden-set.ts`: "hit" entries have real expectations; "indie"/"demo" entries
are live submissions with wide sanity bands (their value is spread + stability).
Add tracks you know the truth about — especially floor anchors (rough sketches)
and 70–90 finished-indie anchors; the commented stubs at the bottom show the
shape. Keep entries stable: changing a band rewrites what "regression" means.
