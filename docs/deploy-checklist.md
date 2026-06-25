# Deploy checklist — decision-report reposition

Branch: `claude/product-market-fit-gaax0f`. This ships the verdict-first reposition,
removes the old Release Decision feature, and decommissions Classic surfaces.
The brand name (MixReflect) and all URLs are unchanged — this is a reposition, not
a rename, so SEO equity carries over.

## 0. Before deploy
- [ ] Review the branch diff / PR #19.
- [ ] Known pre-existing test state: 8 vitest failures (`queue.test.ts` / `metadata.test.ts` stale expectations) exist on the baseline too — not introduced here.
- [ ] The additive DB columns (`releaseBar`, `blockers`) are **already applied to prod** (nullable, safe). No action needed.

## 1. Deploy the code
- [ ] Merge/deploy `claude/product-market-fit-gaax0f`.

## 2. Run the destructive migration — AFTER the code is live
Only after the new code is deployed (the old code referenced these columns).
Run the local script:
```
npx tsx scripts/_remove-release-decision-cols.ts
```
…or run the SQL directly (Neon console / psql). Idempotent:
```sql
-- remap any legacy Release Decision tracks first
UPDATE "Track" SET "packageType" = 'PEER' WHERE "packageType" = 'RELEASE_DECISION';
-- drop the Release Decision columns
ALTER TABLE "Track"  DROP COLUMN IF EXISTS "releaseDecisionReport";
ALTER TABLE "Track"  DROP COLUMN IF EXISTS "releaseDecisionGeneratedAt";
ALTER TABLE "Review" DROP COLUMN IF EXISTS "releaseVerdict";
ALTER TABLE "Review" DROP COLUMN IF EXISTS "releaseReadinessScore";
```
(The `RELEASE_DECISION` value is intentionally left in the `PackageType` enum type — Postgres can't cleanly drop an in-use enum value, and it's harmless once no rows use it.)

## 3. Smoke test prod
- [ ] Homepage loads, hero is verdict-first.
- [ ] A real `/report/[id]` renders (new verdict layout when `releaseBar` present; legacy otherwise).
- [ ] `/opengraph-image` returns a PNG; share preview renders (paste a link in a Slack/X composer).
- [ ] Removed routes 404: `/the-new-mixreflect`, `/classic`, `/admin/recapture`.
- [ ] Stripe webhook still processes a normal unlock/subscribe (the Release Decision branch was removed).
- [ ] A transactional email (e.g. score-ready) sends with the new copy.

## 4. SEO — update the cached snippet
- [ ] In Google Search Console: request re-index for `/` and resubmit the sitemap.
- [ ] Confirm the new tab title shows: `MixReflect — Know If Your Track Is Ready to Release`.
- [ ] Watch impressions/CTR over ~1–2 weeks; the genre `{genre} feedback` keyword is preserved in titles, so the growing traffic should hold while the verdict framing rolls in.

## 5. Create the OG asset (optional polish)
- The OG image is generated dynamically (`src/app/opengraph-image.tsx`), so shares work immediately. If you later want a hand-designed static image, drop a 1200×630 `public/og-image.png` and re-point the metadata.

## Rollback
- Code: redeploy the previous release. The dropped columns are gone, but nothing in the old code path is needed for the verdict feature; if you must fully revert, restore the columns from a Neon point-in-time backup taken before step 2.
