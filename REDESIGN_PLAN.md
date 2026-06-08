# MixReflect Redesign Plan

> Status: **Proposal — not yet built.** Only the schema change (step 1) has been pushed so far.
> Everything below is for your review/adjustment before implementation.

---

## Core Concept

**"Paste your track link. Get 20 expert reviews + instant AI analysis."**

Free to submit. Pay once to unlock your full results.

This replaces the reciprocal "review-to-earn-credits" loop with a straight service:
you submit a track, it gets reviewed, you pay to see the results.

---

## New User Flow

### 1. Submit (free)
- Log in with Google or email (simplified — no reviewer onboarding, no role selection)
- Paste a SoundCloud / Bandcamp / YouTube link
- Enter title, genre, optional notes
- Hit submit — **no payment required**

### 2. Waiting state
- Track enters the queue immediately
- AI generates a structured analysis in the background (20 feedback points from genre + metadata)
- 20 hired human reviewers are assigned (no public reviewer signup — managed internally)
- User sees: *"Your track is being reviewed by 20 experts"*

### 3. Teaser (immediate, free) — headline gate
- **Every** feedback point is visible as a one-line headline / key analysis — both AI and human
- The **detail/expansion under each point is locked** (blurred), not the points themselves
- User sees the full breadth: how many insights, the categories, the one-line verdicts, human star ratings
- They do NOT see the "why" or the fix until they unlock
- Human reviews show "X of 20 in" and keep arriving; each new one lands gated the same way

Example:
```
✓ Your vocal sits ~3dB too low in the chorus     [🔒 unlock to read why + the fix]
✓ Energy dips around the 1:12 mark               [🔒 unlock for the full breakdown]
... 18 more AI insights (headline visible, detail locked)

HUMAN REVIEWS (8 of 20 in)
★★★★☆  "Strong hook, but the mix..."            [🔒 unlock full review]
... each gated the same way
```

### 4. Unlock ($9.99 one-time)
- One-time Stripe payment unlocks the full report for that track
- **Expands every AI point** (headline → full detail + fix)
- **Expands every human review**, including ones that arrive *after* payment
- Final summary report when all 20 humans finish

---

## What Changes

| What | Before | After |
|------|--------|-------|
| Submission cost | Credits (earn by reviewing) | **Free** |
| Payment timing | Before reviews start | **After results arrive (unlock gate)** |
| File upload | Supported | **Removed (URL only)** |
| Reviewer signup | Public (onboarding + quiz) | **Internal only (hired, admin-managed)** |
| Credit system | Full earn/spend loop | **Removed** |
| Review slots | 1 free / 3 Pro | **Removed (unlimited submissions)** |
| Review count | 1–10 (user picks) | **Fixed at 20 per submission** |
| A/B test mode | Supported | **Removed** |
| Subscription | $9.99/mo Pro tier | Optional (could revisit later) |
| Auth | Full onboarding flow | **Light (Google/email, no roles)** |

---

## What Stays

- Google + email auth (NextAuth)
- Stripe payments (now one-time unlock instead of upfront)
- Existing reviewer review screen `/review/[id]` for hired reviewers (internal use)
- Admin panel
- Track URL metadata fetching (SoundCloud / Bandcamp / YouTube oEmbed)
- Genre system
- Email notifications

---

## Data Model Changes

### `Track` (✅ already pushed)
- `aiFeedbackPoints` — JSON, the 20 generated AI feedback points
- `resultsUnlockedAt` — DateTime, set when the unlock payment succeeds
- `unlockStripeSessionId` — String, links the Stripe checkout session to the track

---

## Files to Build / Change

1. `prisma/schema.prisma` — ✅ **Done** (added the 3 Track fields above)
2. `src/lib/ai-feedback.ts` — **new**: calls Claude API, returns 20 structured feedback points from genre + metadata
3. `src/app/api/tracks/route.ts` — remove slot/credit/upload checks; free submission; auto-request 20 reviews; trigger AI async
4. `src/app/api/tracks/[id]/unlock/route.ts` — **new**: creates $9.99 Stripe checkout session
5. `src/app/api/webhooks/stripe/route.ts` — add `track_unlock` payment handler → sets `resultsUnlockedAt`
6. `src/app/(dashboard)/submit/page.tsx` — rewrite: 2-step form (URL → details), no credits/upload/A-B
7. `src/app/(dashboard)/tracks/[id]/page.tsx` — rewrite: feedback gate UI (teaser + unlock CTA + human reviews)
8. `src/app/(dashboard)/dashboard/page.tsx` — simplify: remove credits / reviewer-queue nudges

---

## Open Questions / Decisions Confirmed

**Confirmed via earlier questions:**
- Feedback source: **Hybrid (AI + human)**
- "20 reviews" = **20 human reviewers per submission**
- Auth: **keep light (Google/email)**
- Pricing: monthly sub OR per-unlock — currently planned as **free submit + $9.99 one-time unlock**
- Reviewers: **hired/paid only, no public signup**
- Gate: **free submit, pay to unlock results**

**Still to decide:**
- [ ] Final price point ($9.99 assumed)
- [ ] Monthly subscription on top of unlocks, or unlocks only?
- [ ] How are 20 hired reviewers assigned per track? (manual admin, or auto round-robin from a reviewer pool?)
- [ ] What happens to existing tracks/credits/users already in the system (migration path)?
- [ ] Should AI feedback use the actual audio, or only genre + title + notes metadata? (no audio analysis is built today)
- [ ] Teaser count — 3 of 20 confirmed?

---

## Suggested Build Order

1. Schema ✅
2. `ai-feedback.ts` service (so submit can trigger it)
3. Submit API + submit page (the new entry point)
4. Unlock API + Stripe webhook handler
5. Track detail page (teaser + gate)
6. Dashboard/nav cleanup

---

## ✅ BUILT — 2026-06-02

Discovered an existing half-built scaffold (`TrackScoreReport` model, `/score`
landing, `/submit-score`, `/report/[id]`, `/api/score/checkout`) and built the
new flow on **that model instead of `Track`** — cleaner, purpose-built, and it
keeps the whole new product isolated from the live peer-review app.

**Product framing landed on:** "Play your track for a room of 20 listeners."
Humans are the main event; the AI pass scores the track + synthesises the room.
Free to submit → headline-gated teaser → **$9 one-time unlock**.

Files created / changed:
- `src/lib/score-report-ai.ts` — **new.** Anthropic (claude-sonnet-4-6) with a
  deterministic fallback. Generates overall score, percentile, verdict, 5
  category sub-scores, 6 reaction snippets (MixReflect natural voice), a
  synthesis (headline + body), and 3 priority fixes. `generateAndStoreReport()`
  persists to `TrackScoreReport` and flips status PENDING → IN_REVIEW.
- `src/app/api/score/submit/route.ts` — **new.** Free submit; creates the
  report, generates the read inline, returns slug. No payment.
- `src/app/api/score/[id]/unlock/route.ts` — **new.** $9 Stripe checkout,
  `metadata.type=score_unlock`, success → `/report/[slug]?unlocked=1`.
- `src/app/api/webhooks/stripe/route.ts` — added `score_unlock` branch → sets
  `paidAt` + status COMPLETED.
- `src/app/(public)/report/[id]/page.tsx` — server component now; fetches the
  real report by slug, builds the view model, keeps `/report/demo`.
- `src/app/(public)/report/[id]/report-view.tsx` — **new.** The redesigned,
  headline-gated "Room's Verdict" experience (Fraunces + Caveat + doodles,
  `Sealed` tape-over-blur for gated detail, unlock CTA).
- `src/app/(public)/submit-score/page.tsx` — rewritten to free-submit, posts to
  `/api/score/submit`, redirects to the report. Redesigned to match.
- `src/app/(public)/score/page.tsx` — copy aligned: 20 listeners, free-to-submit
  + $9 unlock framing.

**Gate model:** unlocked = `paidAt != null`. Locked = headlines/scores/stars
visible, detail (synthesis body, full reactions, fix detail) blurred under a
"Sealed" tape strip.

**Verified:** `tsc --noEmit` clean on all new files; eslint clean. No DB in this
env, so not run end-to-end against Postgres/Stripe.

### Still open / not done
- No DB migration run here (schema already had `TrackScoreReport`; no new
  columns were needed).
- The reactions are AI-synthesised and the UI is framed honestly as such
  ("ai" badges, "different ai lenses") — real human reactions are not yet
  wired into `TrackScoreReport` (`reviewerQuotes` JSON is shaped to accept
  them later).

## ✅ AUDIT FIXES — 2026-06-08

Fixed the issues found auditing the shipped flow:
- **AI provider made consistent.** `score-report-ai.ts` called OpenAI `gpt-4o`
  while the doc/header claimed Anthropic and only `ANTHROPIC_API_KEY` was
  provisioned — so every report silently used the canned fallback. Resolved by
  picking OpenAI explicitly (per owner, 2026-06-08): code uses `gpt-4o` (override
  via `SCORE_REPORT_MODEL` / `OPENAI_MODEL`) and **`OPENAI_API_KEY` must be set**
  for real reports. (NB: the rest of the app still uses Anthropic for its other
  LLM features; only the score report runs on OpenAI.)
- **Fallback de-duplicated.** Now samples 6 varied reactions / 3 fixes / 3
  summaries deterministically by seed instead of one fixed 3-reaction block.
- **Pricing reconciled to reality.** The fake "$19.95/mo Pro — 5 reports/mo"
  plan (no checkout, gated on the unrelated MixReflect sub) is replaced
  everywhere with the actual model: free submit + teaser, **$9 one-time unlock
  per track**. `/reports` no longer shows a phantom monthly quota.
- **Honesty pass.** Dropped the unbacked "audio-grounded / scored on the real
  waveform" claims and the invented "top X% of tracks" percentile (it was just
  `100 − score`); report now shows an honest `score / 100` standing. Analysis
  modal steps no longer claim DSP (waveform/key/bpm) that usually isn't run.
- **Stuck-PENDING recovery.** New idempotent `POST /api/score/[id]/generate`;
  the pending screen self-heals + polls it and reloads when the read lands,
  with a manual refresh fallback if it stalls. (Background job still the right
  long-term move if hosting caps function duration.)
- **Abuse guard.** `/api/score/submit` now rate-limits to 8 submits/email/hour
  (each submit triggers a paid LLM call).
- **Entry points aligned.** `/score` now forwards the fetched track title (and
  through the login bounce) so those reports aren't all "untitled / Other".
- **Dead code removed.** Deleted the unused pay-first `/api/score/checkout`
  route (it still advertised "5 real listeners").

Still worth doing later: move generation to a true background job; add IP-based
rate limiting; consider real human reactions before leaning harder on the
"room" framing.

## ✅ AUDIO GROUNDING — 2026-06-08

The "audio-grounded" claim now has a real engine behind it. The djmix project
(`claudehelper/packages/agent`) already had a dependency-light DSP core
(`analyze.py` — numpy/soundfile/mutagen: BPM, key, energy, spectral balance, and
a full **structure** read: intro/build/drop/breakdown/outro sections, energy
envelope, vocal-salience proxy). That's exactly the grounding `audio-analysis.ts`
was missing (Spotify's audio-features is restricted + being deprecated).

- **New worker** `packages/agent/worker.py` (+ `requirements-worker.txt`,
  `WORKER.md`): `POST /analyze {url}` → downloads (yt-dlp for streaming links,
  direct fetch for raw files) → ffmpeg → `analyze.py` → maps the record onto our
  `AudioFeatures` shape → returns `{ features, took }` (features `null` =
  couldn't ground → we fall back cleanly). Runs as its own service (numpy/ffmpeg
  can't run in serverless — which is why `AUDIO_WORKER_URL` exists).
- **mixreflect side** (`src/lib/audio-analysis.ts`): `AudioFeatures` gained
  `sections` / `vocalPresence` / `gridConfidence`; `describeFeatures` now prints
  the **arrangement** and where the **energy dips** fall, so the model can point
  to real timestamps. `workerFeatures` reads the `{ features }` envelope. The
  report prompt was nudged to cite those section/dip timestamps.
- **Copy restored.** With real DSP behind it, the `/score` "audio-aware /
  grounded in the actual audio" framing is back (capability framing — it
  degrades gracefully per-track, so no absolute "every track" promises).

To turn it on: deploy `worker.py` and set `AUDIO_WORKER_URL` +
`AUDIO_WORKER_SECRET` on mixreflect. No further app code change needed.

## ✅ SCORE CALIBRATION — 2026-06-08

Symptom: known hits scored ~60-74 ("needs work"). Debugging showed it was NOT
random and NOT the prompt alone — two real causes:
1. **The model was scoring blind.** Reports were "(untitled)" — title/artist
   never reached the model, so its knowledge of released music couldn't apply.
   Fix: `src/lib/track-metadata.ts` (oEmbed title/artist lookup); generation now
   fetches it in parallel with the audio and passes `artist` + a "recognise
   released music → upper bands" clause to the prompt. Dua Lipa "Levitating"
   went 62 → **92** once it knew the title. The title is also backfilled onto
   the report row.
2. **Coarse structure on loud masters.** The loudness-based section detector
   collapses modern loud mixes into one flat block, so the model saw "no
   dynamics." Enabled **demucs stem separation** in the worker (`DJMIX_STEMS=1`,
   `quick=False`) — real verse/chorus/drop sections. NB: it improved the
   *feedback* but barely moved the *score* (the title fix was the real lever).
   CPU separation is ~2 min/track — run it on a GPU box or as an async job in
   prod.

Also: added a 0-100 **scoring scale + few-shot anchors** to the prompt, and
dropped temperature 0.8 → 0.4 for steadier scores.

Known tradeoff: the recognition clause trusts the oEmbed title/artist, so a demo
uploaded under a famous song's name could inflate its score. Acceptable for now;
revisit if it's abused.

## ✅ HUMAN REVIEWERS — "room of 5" — 2026-06-08

Wired real humans into the score report (hybrid: AI gives the instant read, 5
humans trickle in). Net new:
- **Schema** (`ScoreReview` table, `ScoreReviewStatus` enum,
  `TrackScoreReport.humanReviewsRequested` default 5, `User.isScoreReviewer`).
  Applied to the live DB via surgical idempotent SQL (NOT `prisma db push` —
  that wanted to add an unrelated pre-existing `User.referralCode` unique index;
  left it alone).
- **`src/lib/score-review.ts`** — `assignScoreReviewers(reportId, 5)` (pulls
  from the `isScoreReviewer` pool, least-recently-active first, 3-day expiry),
  `getScoreReviewQueue`, `getReportHumanReviews`, `submitScoreReview` (flips the
  report to COMPLETED when the whole room is in). Assignment is called from
  `/api/score/submit`.
- **Reviewer UX**: `/score-review` (their queue), `/score-review/[id]` (embedded
  player + reaction form), `POST /api/score-review/[id]/submit`.
- **Report**: a new "the room — X of 5 real listeners in" section; reactions
  show rating + headline free, full quote gated behind unlock (same as AI);
  empty seats render "still listening…". Section hides on old reports (0
  assigned).

**Designating reviewers:** `npx tsx scripts/_flag-reviewers.ts [email]` flags an
account `isScoreReviewer` (no admin UI yet). For testing, 5 `@seed.mixreflect.com`
accounts are flagged — **replace these with real people** or reports sit at
"0 of 5" forever (seed accounts never log in to review).

Verified end-to-end: submit auto-assigns 5, simulated reactions appear with
pending seats, submit API auth-gated. The live in-browser reviewer flow (login →
queue → submit) still needs a real reviewer login to exercise.

## ✅ PRICING: unlimited subscription — 2026-06-08

Added a 3rd pricing tier alongside the one-time unlock. **Prices (updated
2026-06-08 — repriced so the tiers ladder instead of cannibalising):**
free teaser · **$6.95 one-time** (`UNLOCK_PRICE_CENTS=695`) · **$19.95/mo or
$143.40/yr unlimited** (`scoreSubPrice` = 1995 / 14340; charm pricing, 2026-06-08). Every submitted track is
auto-unlocked while subscribed.
- **Mechanism:** while subscribed, a submission's `paidAt` is set on creation, so
  the existing gate + shared-link behaviour is unchanged; unlocks persist after
  cancellation, new ones re-gate. Email-keyed (the product is email-first).
- **Schema:** `ScoreSubscriber` (email unique, status, stripe ids, period end) —
  applied via surgical SQL.
- **`src/lib/score-subscription.ts`** — `isScoreSubscribed`, `activateSubscriber`
  (+ retro-unlocks all the email's gated reports), `updateSubscriberStatus`,
  `unlockAllForEmail`.
- **`/api/score/subscribe`** — Stripe subscription checkout ($9.95/mo,
  `metadata.type=score_subscription`).
- **Webhook:** `checkout.session.completed` (type score_subscription → activate +
  retro-unlock) and `customer.subscription.updated/deleted` (status), branched
  ahead of the old ArtistProfile/credits logic so they don't collide.
- **Submit:** auto-unlocks the new report if the email is an active subscriber.
- **UI:** `/score` pricing now free / per-track / unlimited; the report unlock CTA
  has an "or go unlimited" option; `/reports` shows an "unlimited · active" badge
  or a "go unlimited" prompt.

Verified: an active subscriber's submission auto-unlocks (paidAt set), non-subs
stay gated; pricing renders 3 tiers; subscribe route live.

**Billing portal (2026-06-08):** `/api/score/portal` opens the Stripe billing
portal (auto-creates a portal configuration on first use — no dashboard setup);
the `/reports` "unlimited · active" badge is now a "manage →" button. Subscribers
can update payment / view invoices / cancel (at period end).

**Stripe keys / programmatic checkout:** all links are created programmatically
via `stripe.checkout.sessions.create()` (inline `price_data`, no pre-made
products) — verified by a real `cs_live_…` checkout URL. NOTE: `.env.local`
holds the **LIVE** secret key (`sk_live`), overriding the `sk_test` in `.env`, so
local checkout runs against live Stripe — completing one is a real charge
(owner chose to keep it live, be careful). Also: a completed payment only flips
the DB (paidAt / subscriber active) when the **webhook reaches the server** —
locally Stripe can't POST to localhost, so use
`stripe listen --forward-to localhost:3001/api/webhooks/stripe` to test the full
loop; in prod the configured webhook endpoint handles it.
