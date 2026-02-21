# Cleanup Plan

> Priority-ordered. Everything is on a live production system with real users — low-risk items first, schema changes last.

---

## The Core Problem

The system was unified (every user submits tracks AND reviews) but the codebase still has the old split-role structure:
- Ghost page directories (`/artist/*`) with no actual page content
- `/review/[id]` redirects to `/reviewer/review/[id]` instead of the form living at the clean path
- API routes still split as `/api/artist/profile` and `/api/reviewer/profile`
- DB has two profile tables (`ArtistProfile` + `ReviewerProfile`) per user

---

## Tier 1 — Safe Deletes (no code logic, no risk)

### Dead page directories
These directories exist under `src/app/(dashboard)/artist/` but have no `page.tsx` — they serve no routes:
- `src/app/(dashboard)/artist/reviewers/` (and `[id]/`)
- `src/app/(dashboard)/artist/submit/` (and `checkout/`, `success/`)
- `src/app/(dashboard)/artist/tracks/` (and `[id]/`, `[id]/request-reviews/`)

The `src/app/(dashboard)/artist/layout.tsx` can be deleted too once those dirs are gone.

**Important:** Confirm each has no `page.tsx` before deleting. The directory existing doesn't mean it's live.

### Dead deprecated component
- `src/components/analytics/analytics-dashboard-old.tsx` — replaced, not imported anywhere

### Stale root-level docs
These are old planning/audit artefacts that are now incorrect or irrelevant:
- `DEPLOYMENT_READY.md`
- `DEPLOYMENT-STATUS.md`
- `INTEGRATION_GUIDE.md`
- `REVIEW_V2_IMPLEMENTATION_STATUS.md`
- `REVIEW_QUALITY_ANALYSIS.md`
- `PAYMENT_AUDIT_REPORT.md`
- `PAYMENT_BUGS_SUMMARY.md`
- `CLEANUP_SYSTEM.md`

And in `docs/`:
- `docs/MARKETING_LAUNCH_PLAYBOOK.md`
- `docs/SUBSCRIPTION_FLOW.md` (subscription model removed)
- `docs/ROADMAP.md` (outdated)
- `docs/PAYMENTS_AND_PRICING.md` (stale — pricing changed)

### Scripts directory
50+ one-off inject and fix scripts that have already been run. None are part of the app (excluded from TypeScript compilation). Safe to delete entirely or archive externally.

Keep: `fix-short-soundcloud-urls.ts` (useful utility, not run-once).

---

## Tier 2 — Route Cleanup (low risk, big clarity win)

### Fix the review form redirect chain

Currently: `/review/[id]` → redirect → `/reviewer/review/[id]` (actual form)

The form should live at `/review/[id]` directly. Steps:
1. Move `src/app/(dashboard)/reviewer/review/[id]/` content to `src/app/(dashboard)/review/[id]/`
2. Delete `src/app/(dashboard)/reviewer/review/[id]/`
3. Delete the redirect page at `src/app/(dashboard)/review/[id]/page.tsx`

**Risk:** Low — the redirect already handles existing links to `/reviewer/review/[id]`. You can add a reverse redirect there temporarily if needed.

### Clean up `/reviewer/` directory

After moving the review form:
- `/reviewer/earnings/` — keep (still used, mobile nav links to it)
- `/reviewer/layout.tsx` — keep (wraps earnings page)
- `/reviewer/review/` — delete (moved)

Longer term: consider renaming `/reviewer/earnings` → `/earnings` for consistency, but that's cosmetic — low priority.

### Consolidate submit flow

There are two submit-related directories:
- `src/app/(dashboard)/artist/submit/` — dead (no page.tsx)
- `src/app/(dashboard)/submit/` — the live one

Tier 1 covers deleting the dead `/artist/submit/` dir. No other action needed here.

---

## Tier 3 — API Route Rationalisation (moderate effort)

The API routes reflect the old split model. Over time these should be renamed for clarity, but they're all functional so this is low urgency.

### Routes to consider renaming (check all callers first)
- `/api/artist/profile` → `/api/profile/artist` or keep as-is
- `/api/artist/welcome-seen` → could fold into `/api/profile`
- `/api/reviewer/profile` → `/api/profile/reviewer` or keep as-is
- `/api/reviewer/payouts` → `/api/payouts`
- `/api/reviewer/stripe/connect` → `/api/stripe/connect`

**Process for each rename:**
1. Add the new route as an alias
2. Update all callers (search the entire `src/` tree)
3. Keep old route as a redirect for 1 release cycle
4. Delete old route

**Do not rush this** — a wrong rename breaks a live financial API.

---

## Tier 4 — Code Organisation (refactoring, no functional change)

### Split `src/lib/email.ts`
The file is ~35KB and handles every email type. Proposed split:
```
src/lib/email/
  index.ts          # re-exports everything (no breaking change for importers)
  auth.ts           # verification, password reset
  reviews.ts        # assignment, completion, invalid link
  payments.ts       # payment confirmation, payout
  support.ts        # ticket notifications
  announcements.ts  # admin broadcasts
  templates.ts      # shared HTML wrapper / base styles
```
No API behaviour changes — pure file organisation.

### Extract constants from `src/lib/queue.ts`
Queue logic is solid but mixes business rules with config values. Extract:
- Pay rates per tier → a constants block or separate file
- Test reviewer email list → `src/lib/config.ts` or similar
- Reviewer tier thresholds (100 reviews, 4.5 rating) → named constants

---

## Tier 5 — Schema Cleanup (do last — requires migration)

### Deprecated review fields

These fields are in the DB schema but not written or read by any active form:
- `wouldAddToPlaylist`, `wouldShare`, `wouldFollow`
- `energyCurve`, `expectedPlacement`
- `quickWin` (merged into `biggestWeaknessSpecific`)

**Before touching anything:**
1. Search all of `src/` for each field name — confirm zero reads
2. Check the admin review display pages — do they show these fields?
3. Only then plan a migration

**Migration approach (when ready):**
1. Add `// @deprecated` comments to the schema fields
2. Remove from Prisma schema
3. Run `prisma migrate dev` — this generates a DROP COLUMN migration
4. Review and run the migration — **data is lost for those columns**, which is fine since nothing reads them

**Do NOT drop:** `STARTER`, `STANDARD`, `PRO`, `DEEP_DIVE` from the packageType enum — live track rows use these values.

### DB profile consolidation (longer term)

Currently every user has both `ArtistProfile` and `ReviewerProfile`. Since users are unified, these could eventually merge into a single `UserProfile`. This is a significant migration and should only be done after:
- Route cleanup is complete
- API routes are unified
- A full DB backup is taken
- The app is tested thoroughly on a staging environment first

**Recommendation:** Don't merge the DB tables yet. Clean up the routes and API layer first. The two-table structure causes zero UX problems currently — it's a code-cleanliness concern only.

---

## Suggested Order of Work

| # | Task | Risk | Effort |
|---|---|---|---|
| 1 | Delete dead `/artist/*` page dirs | None | 5 min |
| 2 | Delete `analytics-dashboard-old.tsx` | None | 1 min |
| 3 | Delete stale root-level `.md` files | None | 5 min |
| 4 | Clean out `scripts/` directory | None | 5 min |
| 5 | Move review form from `/reviewer/review/[id]` to `/review/[id]` | Low | 30 min |
| 6 | Audit deprecated review fields for reads | None | 20 min |
| 7 | Split `email.ts` into modules | Low | 2 hrs |
| 8 | Extract queue constants | Low | 1 hr |
| 9 | Rename API routes (one at a time) | Moderate | Per route |
| 10 | Drop deprecated schema columns | Moderate | With migration |
| 11 | Consolidate DB profiles | High | Future |
