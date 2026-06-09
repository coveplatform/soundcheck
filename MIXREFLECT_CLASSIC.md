# MixReflect Classic — current app hierarchy (pre-cutover reference)

> Snapshot taken **2026-06-09**, at the moment we promoted the **Score** product to
> be `mixreflect.com`. This documents the app *as it was* so "MixReflect Classic"
> (the peer-to-peer, review-to-earn-credits product) can be wound down cleanly.
>
> **The cutover (2026-06-09):**
> - `/score` (Score landing) → moved to **`/`** (the homepage).
> - `/reports` (Score report list) → moved to **`/dashboard`** (logged-in home).
> - The old Classic landing → **`/classic`**.
> - The old Classic dashboard → **`/classic/dashboard`**.
> - Permanent (308) redirects: `/score → /`, `/reports → /dashboard`,
>   `/reports/settings → /dashboard/settings`.
> - Everyone lands on the new `/dashboard` after login. Classic-internal
>   navigation was repointed to `/classic/*` so in-progress Classic work still
>   works during the ~1-week wind-down.

---

## Two products, one codebase

| | **MixReflect Classic** (sunsetting) | **Score** (the new product, now the site) |
|---|---|---|
| Model | Peer-to-peer: review others → earn credits → spend credits to get reviewed | Paste a link → instant AI read + a "room of 5" paid human listeners |
| Pricing | Free + $9.95 credit packs + $24.95/mo Pro | Free submit → $6.95 one-time unlock → $19.95/mo unlimited |
| Reviewers | Every user is a reviewer (onboarding + quiz) | Hired/paid pool (`isScoreReviewer`), opt-in at `/reviewer` |
| Design | Light, purple, brutalist doodles (`#faf8f5` / purple-600) | Icy cyan on black (`#6ee7ff` / `#0a0a0a`), lowercase, mono accents |
| Data | `Track`, `Review`, `ArtistProfile`, credits, slots, charts | `TrackScoreReport`, `ScoreReview`, `ScoreSubscriber` |
| Auth | Full onboarding (roles, genres) | Light, email-first (Google/email) |

---

## Route map (pre-cutover)

### New product — Score (route group `(public)`, + a few root routes)
- `/score` — landing / paste-a-link hero · `score/page.tsx` *(→ moves to `/`)*
- `/score/finish` — post-login submit handoff *(stays)*
- `/submit-score` — free submit form
- `/report/[slug]` — the gated "room's verdict" report (`report-view.tsx`)
- `/reports` — logged-in report list / home *(→ moves to `/dashboard`)*
- `/reports/settings` — account settings *(→ `/dashboard/settings`)*
- `/reviewer` — paid-reviewer signup / opt-in
- `/score-review` — reviewer queue · `/score-review/[id]` — listen + react
- `/the-new-mixreflect` — changeover announcement page
- API: `/api/score/*` (submit, [id]/generate, [id]/unlock, subscribe, portal),
  `/api/score-review/*` (opt-in, payout, [id]/submit)

### MixReflect Classic (route group `(dashboard)`)
- `/dashboard` — Classic home (credits, queue, review & earn) *(→ `/classic/dashboard`)*
- `/dashboard-v2` — WIP, untracked (unrelated to cutover)
- `/tracks`, `/tracks/[id]`, `/tracks/[id]/request-reviews` — your tracks + feedback
- `/submit`, `/submit/checkout`, `/submit/success` — submit a track (credits)
- `/review`, `/review/[id]`, `/review/[id]/v2`, `/review/history` — the review screen
- `/reviewers`, `/reviewers/[id]` — browse reviewers
- `/reviewer/review/[id]` — legacy reviewer review (redirects to `/review/[id]`)
- `/pro` — Pro upsell · `/account` — account · `/onboarding` — role/genre setup
- `/breakthrough` — daily top-scored pick · `/support/tickets`, `/support/tickets/[id]`
- `/admin/seo` — SEO admin tool (Classic-group admin)
- API: `/api/tracks/*`, `/api/reviews/*`, `/api/credits/*`, `/api/queue`,
  `/api/slots`, `/api/charts/*`, `/api/subscriptions/*`

### Shared / neutral (stay at their paths)
- `/` — **was** the Classic landing *(→ becomes the Score landing; old one → `/classic`)*
- `/blog`, `/blog/[slug]` — The Drop
- `/discover` — 3D discover space · `/feedback/[genre]` · `/alternatives/[competitor]` — SEO pages
- `/t`, `/r/[reviewId]` — short links · `/today` — track of the day
- `/login`, `/signup`, `/forgot-password`, `/reset-password` — auth
- `/privacy`, `/terms`, `/support`, `/incident` — legal/info
- `/admin/*` — full admin panel · `/sandbox/*` — internal demos

---

## What the cutover touched

- **Moves:** `app/page.tsx` → `app/classic/page.tsx`; `(public)/score/page.tsx` →
  `app/page.tsx`; `(public)/reports/` → `(public)/dashboard/`;
  `(dashboard)/dashboard/` → `(dashboard)/classic/dashboard/`.
- **Redirects** (`next.config.ts`, permanent 308): `/score`, `/reports`,
  `/reports/settings`.
- **Root SEO** (`app/layout.tsx` metadata + JSON-LD) swapped from the Classic
  credits marketplace to the Score product. Classic landing carries `noindex`.
- **Changeover banner** inverted: shows on `/classic/*` (+ Classic app routes),
  hidden on the new product. Points users from Classic → the new site.
- **Internal links:** Score links `/score → /`, `/reports → /dashboard`,
  `/score#pricing → /#pricing`. Classic-internal `/dashboard → /classic/dashboard`
  (sidebar, onboarding, review screens, submit success, credit checkout, emails).
- **`middleware.ts`:** removed the `SCORE_HOST` subdomain rewrite (would loop now
  that `/score` 308s to `/`).
- **`robots.txt`:** disallow `/classic/`.

## Still wired to Classic (left intact for the wind-down)
- All `(dashboard)` app routes remain at their URLs (only `/dashboard` itself moved).
- Classic notification emails (digest, reviews, track-of-the-day) now deep-link to
  `/classic/dashboard`.
- Credits / Pro / Stripe `subscriptions` flow is untouched.
