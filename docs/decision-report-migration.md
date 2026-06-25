# MixReflect → Decision-Report Migration — Master Plan

**Status:** planning · **Branch:** `claude/product-market-fit-gaax0f`
**Decisions locked:**
- **Keep the name** MixReflect. This is a *reposition*, not a rename. (Preserves SEO equity; "Soundcheck" is only the repo codename and is taken in this space anyway.)
- **Verdict is the hero.** The release verdict (`not ready → needs work → almost there → release ready`) leads; the /100 score is demoted to evidence.
- **Room of 5 stays a co-pillar.** The human room is kept and *advertised* alongside the verdict — which means reviewer supply must be **backed** (see §8). We do **not** strip "room/listeners" language; we subordinate it to the verdict.

---

## 0. Scope reality check — "is it just a reskin of landing + report?"

**Mostly yes for what users *see*** (landing + report carry the visible change), **but "no stone unturned" means it ripples into five non-obvious layers:**

| Layer | Reskin? | Real work beyond CSS |
|---|---|---|
| Landing page | ✅ visible | copy reposition + design system |
| Report (`/report/[id]`) | ✅ visible | **+ data model + generation logic** (verdict/releaseBar/blockers) |
| SEO / metadata / social | ⚠️ invisible | root metadata, 12 genre + 7 alt pages, blog CTAs, OG image, llms.txt, structured data, re-index |
| Emails | ⚠️ invisible | score/welcome/reviews templates (15+ hits in `score.ts` alone) |
| Reviewer supply | ❌ not a reskin | make the co-pillar promise true (§8) |

So: **the *look* is landing + report; the *work* is landing + report + a copy/SEO ripple + the report's data/generation + reviewer supply.** Don't let "just a reskin" hide §2 (data) and §8 (supply).

---

## 1. Positioning spine (single source of truth for all copy)

**One-liner:** *MixReflect tells you whether your track is ready to release — measured against tracks that actually got released — and puts it in front of a room of real listeners.*

**Two pillars (co-equal in marketing, sequential in delivery):**
1. **The verdict** — instant, measured, ships every time. *Hero.*
2. **The room** — 5 real genre-matched listeners. *Co-pillar; follows the instant verdict.*

**Vocabulary:**
- KEEP: room, listeners, real ears, reactions, reviewers, get paid to listen (reviewer side stays).
- LEAD WITH: verdict, release-ready, what's between this and release, the release bar, blockers.
- DROP/FIX: anything that frames the product as *only* a peer-review marketplace (that's the cached-in-Google problem), and any fabricated claim (see honesty rules below).

**Honesty rules (carry into every surface):**
- No fabricated percentile ("top X%" ≠ `100 − score`).
- Reference corpus is described as in-progress until it exists.
- The room is "5 real listeners, when matched" with an honest partial state — never fake personas.

---

## 2. The Report (product core)

### 2a. Data model — `prisma/schema.prisma` → `TrackScoreReport`
Add (keep all existing review/room fields):
- `verdict` enum: `NOT_READY | NEEDS_WORK | ALMOST_THERE | RELEASE_READY`
- `releaseBar` JSON: per-axis `{ label, measured, band, ends, zone, pos, status }` (shape already designed in `demo-verdict/verdict-report-view.tsx` `AXES`)
- `blockers` JSON: ranked `{ rank, weight, label, detail }[]`
- Migration must be backward-compatible: existing reports with null `verdict` keep rendering the legacy `ReportView`.

### 2b. Generation — `src/lib/score-report-ai.ts` (+ `audio-analysis.ts`, `genre-norms.ts`)
- Compute `verdict` from measured craft vs the genre release envelope (not from the score alone).
- Populate `releaseBar` axes from real DSP where available; flag estimated bands honestly until the corpus exists.
- Reframe prose generation from "the read" → release-readiness language.
- **Honesty debt to clear here:** replace the `100 − score` percentile; mark corpus-derived numbers as illustrative.

### 2c. Rendering wiring — `src/app/(public)/report/[id]/page.tsx`
- Promote `verdict-report-view.tsx` from demo into a production component (e.g. `src/components/score/verdict-report-view.tsx`) that accepts the live `ReportViewModel` (not the hardcoded `DEMO`).
- Branch: `report.verdict != null ? <VerdictReportView/> : <ReportView/>` (legacy fallback).
- **Co-pillar:** the verdict view must render the **real human room section** (from `getReportHumanReviews(reportId)`), with the honest partial state ("3 of 5 in, more landing") — re-introducing the room we cut from the *demo*, now backed by real reviews.
- Preserve the 3 states: **sealed teaser**, **open-read** (FREE_FULL_READ first report), **unlocked**.

### 2d. Paywall / unlock / upgrade copy — `report-view.tsx` / new verdict view / `sealed-paywall.tsx`
Reframe to verdict + room (keep room; lead verdict):
- `report-view.tsx:618-619` "unlock the score, the read & the room" → "unlock the verdict, the read & the room"
- `:697-703` "unlock & send it to the room" → "unlock the release decision + send it to the room"
- `:223-224 / :250-252` pricing cards: keep the "5 real people" line (room stays) but lead with the verdict deliverable.
- Checkout routes unchanged: `$6.95` one-time (`/api/score/[id]/unlock`), `$19.95/mo` (`/api/score/subscribe`), sealed (`/api/score/sealed-checkout`).

### 2e. Demo pages
- `/report/demo-verdict` → **canonical demo** (already built; reskin done this session).
- `/report/demo-free` (sealed teaser) and `/report/demo-full` (unlocked) → rebuild on the verdict layout *with the room shown*, or retire once the live verdict report covers both states.

---

## 3. Landing page — `src/app/page.tsx`, section by section

| Section | File:line | Action |
|---|---|---|
| Header nav | `:838-883` / `components/landing/site-nav.tsx` | keep; verify anchors still resolve after section reorder |
| Hero | `:890-1077` | **rewrite** → verdict-first: "know if your track is ready to release" + measured verdict + room as the second pillar; CTA "score my track — free" stays |
| Recently read by the room | `:1111-1142` | keep (social proof); relabel toward verdict if desired |
| Room showcase | `room-showcase.tsx` | **keep, reposition** below the verdict explanation — it's the co-pillar, not the headline |
| How it works | `:1148-1203` | reframe steps: paste → measured verdict → the room → release decision |
| Reviewer side | `:1293-1374` | keep (co-pillar supply funnel) |
| Real reviews | `real-reviews.tsx` | keep |
| Pricing | `:1380-1473` | align to §6 wording |
| FAQ | `:365-394` | rewrite Q's that frame it as marketplace-only; keep the room Q |
| Footer | `:1563-1613` | verify link map (§4); "become a listener" label stays (reviewer side stays) |

Apply the design system (§9) throughout.

---

## 4. Flows & callbacks — verify every link/CTA after the reskin

**Full internal link map to re-verify (none should 404 or point to a retired old-model surface):**

- Header (`page.tsx:847-877`): `#sample`, `#how`, `#pricing`, `/blog`, `/reviewer`, `/dashboard`, auth.
- Mobile sticky (`:809-835`): `/dashboard` / auth.
- Footer product (`:1571-1574`): `#pricing`, `/report/demo`, `/blog`, `/reviewer`.
- Footer genre (`:1577-1589`): `/feedback/{12 slugs}`.
- Footer alternatives (`:1591-1602`): `/alternatives/{7 slugs}`.
- Footer legal (`:1607-1608`): `/terms`, `/privacy`.
- `site-nav.tsx:33-36`: `/today`, `/#how`, `/#pricing`, `/blog`, `/reviewer`.

**Flows to walk end-to-end after changes (copy + CTA at each step):**
1. **Artist:** landing CTA → `/submit-score` → `POST /api/score/start` (on paste) → auth (`/login?callbackUrl=/score/finish`) → `/score/finish` (`/api/score/claim`) → `POST /api/score/submit` → pending `/report/[slug]` (polls `/api/score/[slug]/status`) → report.
2. **Paywall:** sealed → `/api/score/sealed-checkout` / `/unlock` / `/subscribe` → success redirect `/report/[id]?unlocked=1|subscribed=1`.
3. **Reviewer:** `/reviewer` → `/api/score-review/opt-in` → `/score-review` queue → `/score-review/[id]` (45s listen gate) → `/api/score-review/[id]/submit` → earnings/payout.
4. **Re-check:** `/dashboard` → `/api/tracks/[id]/update-source` / `request-reviews` → new report, version compare.

Each step's copy that's hardcoded old-model is catalogued in §6/§7 — update in place; **don't change routes or auth** (zero breaking changes there).

---

## 5. SEO / metadata / search appearance / social

**Why it matters:** Google currently caches MixReflect as a "peer-to-peer feedback marketplace." Re-anchoring the metadata + requesting re-index is how the SERP snippet updates (no rename needed).

- **Root metadata** `src/app/layout.tsx` (7 old-model hits: `:44,68,74,82,115,147,159`): rewrite title/description/OG/twitter/JSON-LD to verdict + room. Tab title e.g. `MixReflect — Know If Your Track Is Ready to Release`. Template `%s | MixReflect` stays.
- **OG image** `:71`: **`/og-image.png` is missing** → create 1200×630 (verdict aesthetic). All social shares are blank until this exists.
- **Structured data** `:106-167`: update `SoftwareApplication` / `Organization` / `WebSite` descriptions; verify offers = $6.95 / $19.95; keep `SearchAction`.
- **Per-route metadata** (currently falling back to default): add to `/discover`, `/report/[id]`, `/reviewer`, `/dashboard`, `/score-review`, `/submit-score`, `/privacy`, `/terms`.
- **Indexing:** add `/report/` to robots disallow (user reports = noindex) unless public-shareable is intended; keep demo/admin noindex.
- **Blog titles** `blog/[slug]/page.tsx:28`: append `| MixReflect`.
- **Programmatic pages:** `/feedback/[genre]` (×12) and `/alternatives/[competitor]` (×7) — update meta + on-page copy (§7); standardize genre title format (existing SEO TODO).
- **`public/llms.txt`:** rewrite product description (still "marketplace") + verify the 23 URLs.
- **After deploy:** resubmit sitemap + request re-index in Search Console; re-check OG via a debugger.

---

## 6. Email templates (high-frequency touchpoint — don't skip)

Reframe verdict-first while **keeping the room** (co-pillar):
- `src/lib/email/score.ts` (15+ hits: `:56,97-99,105,108-119,137,143,172-186,223,264`) — lead with the verdict, keep "room/listener" reaction notifications.
- `src/lib/email/welcome.ts` (`:16,46-47,57`) — onboarding: verdict + room.
- `src/lib/email/reviews.ts` / `announcements.ts` — **reconcile with the "Release Decision" expert-panel product** (see §11); these reference "10–12 expert reviewers" which may be a *separate* product line.

---

## 7. Programmatic / content surfaces (SEO body copy)

- `src/lib/blog-posts.ts` — 12 in-article CTAs ("room of five real listeners…") → reposition to verdict + room.
- `src/lib/genre-pages.ts` (×12) and `src/app/feedback/[genre]/page.tsx` (`:83,125,381`) — intros/CTAs.
- `src/lib/alternatives.ts` (×7, 15+ hits) — comparison copy; these are high-intent SEO pages, lead with the verdict differentiator (vs TrackScore.AI etc.).

---

## 8. Reviewer supply — backing the co-pillar (critical path, NOT optional)

Because the room is *advertised*, the promise must be true. Today seed accounts are placeholders that never respond.
- **Reliable fill:** recruiting + incentives for genre-matched real reviewers; a response SLA.
- **Honest fallback** when the room can't fully fill: queue time shown, partial room ("3 of 5 in"), and/or credit. Never fabricate.
- **Decoupling:** the verdict ships instantly; the room "follows shortly" — so the instant product is never blocked on humans.
- This gates how hard §3 (hero) leans on the room: until supply is proven, hero is verdict-first with room "follows"; once backed, full co-pillar.

---

## 9. Design system / reskin tokens (apply across landing + report + key pages)

From the verdict report built this session:
- Palette: icy-cyan `#6ee7ff` (ACCENT), green `#7cffc4` (release-ready), violet `#b8a4ff`, pink `#ff7a90` (blocker); black `#0a0a0a`/`#0c0c0c`.
- Type: Plus Jakarta Sans display, JetBrains Mono labels; BRAT all-lowercase; mono kickers in `[ brackets ]`.
- Patterns: numbered `SectionHead` wayfinding (`01–05` chips), ≥11px labels, body `white/70` @ 14–15px, the four-state verdict ladder, the release-bar component.
- Goal: landing + report + demo + key marketing pages read as one system.

---

## 10. Decommission the old model

- Retire `MixReflect Classic` surfaces, `components/changeover-banner.tsx`, and `/the-new-mixreflect` once the new homepage *is* the explanation.
- Sweep residual marketplace-only framing in nav/footer/FAQ.

---

## 11. Naming reconciliation (do early — avoids rework)

The codebase already has a **"Release Decision"** concept (expert panel of 10–12 reviewers) in `email/reviews.ts` + `announcements.ts`, separate from the **"Score / room of 5"** product. Decide the canonical taxonomy:
- Is the new "decision report (verdict)" the same as "Release Decision," a merge, or distinct?
- Pick ONE name per concept before rewriting copy, or §6/§7 will thrash.

---

## 12. Sequencing (dependency order)

- **Phase A — Report core:** §2 data model + generation + wiring (verdict live on `/report/[id]`, room included). *Anchor; do first.*
- **Phase B — Reviewer supply:** §8. *Parallel with A; gates how hard B leans on the room.*
- **Phase C — Landing:** §3 + §9 design system.
- **Phase D — SEO/metadata/social:** §5 (OG image, root metadata, bare-route metadata, robots, blog titles), then request re-index.
- **Phase E — Copy ripple:** §6 emails + §7 programmatic/content.
- **Phase F — Decommission + naming:** §10 + §11.
- **Phase G — QA + verify:** §13.

Critical path: **A → C → D**. B backs the co-pillar. E/F/G trail.

---

## 13. QA / "no stone unturned" checklist

**Report:** [ ] verdict renders on real `/report/[id]` · [ ] legacy reports still render · [ ] 3 states correct · [ ] real room shows + partial state honest · [ ] no fabricated percentile · [ ] paywall copy verdict+room · [ ] checkout redirects land right.
**Landing:** [ ] hero verdict-first · [ ] room repositioned as co-pillar · [ ] all anchors resolve · [ ] design system applied.
**Links:** [ ] every header/footer/in-page link in §4 verified live.
**Flows:** [ ] artist, paywall, reviewer, re-check walked end-to-end.
**SEO:** [ ] OG image exists + previews render · [ ] root metadata verdict+room · [ ] bare routes have metadata · [ ] `/report/` noindex · [ ] blog titles branded · [ ] genre/alt pages updated · [ ] llms.txt rewritten · [ ] structured-data pricing correct · [ ] sitemap resubmitted + re-index requested.
**Emails:** [ ] score/welcome reframed · [ ] Release Decision reconciled.
**Decommission:** [ ] Classic/banner/explainer retired · [ ] naming unified.

---

## 14. Risks

1. **Re-creating the broken promise** — advertising the room before §8 supply is fixed. Mitigation: verdict-first hero until supply proven.
2. **Honesty debt riding along** — fabricated percentile / unbuilt corpus must be fixed in §2b, not carried into production.
3. **SEO whiplash** — keep URLs stable (reposition, not rename); the room language continuity actually *helps* the re-crawl.
4. **Copy thrash** — resolve naming (§11) before the §6/§7 rewrite.
5. **"Just a reskin" underestimation** — §2 (data/generation) and §8 (supply) are the real cost; budget for them.
