# MixReflect SEO — Living Checklist (single source of truth)

> Merges the original content plan (memory `project_seo_plan.md`) with the
> June 2026 strategy (`SEO-STRATEGY-2026.md`). This is the one file to keep
> updated. Status keys: ✅ done · ⏳ pending · 🔁 recurring · 🤖 automatable

Last updated: 2026-06-09

---

## A. Technical foundation (Phase 1) — ✅ DONE & shipped to main
- ✅ Single source of truth for canonical host (`src/lib/site.ts` → `SITE_URL`)
- ✅ All canonical signals → `www` (sitemap, robots, layout JSON-LD, genre/alternatives/blog)
- ✅ Self-referencing canonical tags on homepage + blog
- ✅ `robots.ts` disallows app/auth/api/`/classic`
- ✅ All 30 genre meta titles → "Get Honest Feedback on Your [Genre] Track | MixReflect"
- ✅ Homepage subhead carries keywords ("honest music feedback", "track score")
- ✅ IndexNow script submits www URLs
- ✅ Blog emits Article + FAQPage schema (verified)

## B. Deploy & Search Console (one-time) — mostly done
- ✅ Merge + deploy to production (on main)
- ✅ Vercel: `NEXT_PUBLIC_SITE_URL=https://www.mixreflect.com`
- ✅ Vercel: apex → www redirect (try.mixreflect.com also redirects to www)
- ✅ GSC: **Domain property** already exists (verified via DNS TXT, Apr 23)
- ⏳ GSC: submit `https://www.mixreflect.com/sitemap.xml` (nudge a re-read with www URLs)
- ⏳ Run `npm run indexnow` after deploy
- ⏳ ~1 week out: GSC → Indexing → Pages → **Validate Fix** on "Duplicate without user-selected canonical"

## C. Content engine — 🔁 recurring · 🤖 automatable (NOT currently running)

### Blog posts (weekly cadence) — next in queue
| Status | Title | Target keyword |
|---|---|---|
| ⏳ | Music Release Checklist: Everything to Do Before You Drop | music release checklist |
| ⏳ | Is Your Mix Good? 7 Ways to Tell Before You Release | how to know if your mix is good |
| ⏳ | How to Get on Spotify's Discover Weekly | how to get on discover weekly |
| ⏳ | How to Promote Your Music on Spotify Without a Label | how to promote music on spotify |
| ⏳ | How to Master Music at Home (and When to Hire Out) | how to master music at home |
| ⏳ | Is My Mix Too Loud? Loudness, LUFS and the Streaming Norm | is my mix too loud |
| ⏳ | How to Build a Fanbase as an Independent Artist | how to build a fanbase |
| ⏳ | How to Copyright Your Music | how to copyright music |

*(Format rules live in memory `project_seo_plan.md`: answer-first opener, H2s as
questions, ≥1 FAQ block, quote + list blocks, CTA, natural tie-in.)*

### Alternatives pages (monthly cadence) — next in queue
| Status | Slug | Competitor |
|---|---|---|
| ⏳ | /alternatives/splice | Splice |
| ⏳ | /alternatives/distrokid | DistroKid |
| ⏳ | /alternatives/soundcloud | SoundCloud |

## D. Site architecture & schema (Phase 2) — ⏳ pending
- ⏳ Add `/feedback` hub page (index of all 30 genres)
- ⏳ Add `/alternatives` hub page (index of all comparison pages)
- ⏳ Footer link block (genres / compare / guides) so every child page ≤2 clicks from home
- ⏳ Internal-linking rules: blog→home + siblings; genre→hub + related; alternatives→home + roundup
- ⏳ Emit FAQPage schema on alternatives pages; verify BreadcrumbList on blog

## E. GEO / AI-search (Phase 2–3) — ⏳ pending · 🤖 partly automatable
- ⏳ Add `/llms.txt` (what MixReflect is, offer, pricing, top 10 links)
- ⏳ Ensure every guide's opening paragraph is a standalone quotable answer
- ⏳ Keep AI crawlers allowed on marketing content (GPTBot, PerplexityBot, ClaudeBot, Google-Extended)
- 🔁🤖 Monthly AI-citation check: prompt ChatGPT/Perplexity/AI Overviews with target queries, log if MixReflect is cited

## F. Off-page / authority — 🔁 ongoing
- 🔁 Reddit: r/WeAreTheMusicMakers, r/makinghiphop, r/edmproduction, r/indieheads, r/songwriting (help first, link only when useful)
- ⏳ Directory listings: AlternativeTo, music-tool roundups, indie-maker dirs
- 🔁 Founder content (IndieHackers / X) to build branded "mixreflect" search

## G. Measurement — 🔁 weekly · 🤖 automatable (needs GSC API)
- GSC impressions/clicks per page-type (`/feedback`, `/blog`, `/alternatives`)
- Queries in position 8–15 (one title tweak = first-page win)
- Pages with CTR < 2% (rewrite title/description)
- New referring domains
- North-star: free submits + $6.95/$19.95 conversions from organic

---

## Automation status (what's designed vs. what's actually running)

**Nothing is currently scheduled** (`CronList` = no jobs). The automation below was
*designed* in memory but never turned on. To enable, use the `/schedule` skill.

| Task | Designed? | Running? | Cadence | How to enable |
|---|---|---|---|---|
| 🤖 Weekly blog post (write + commit + push, mark DONE) | ✅ yes | ❌ no | weekly (e.g. Fri) | `/schedule` with the prompt in memory `project_automation_seo.md` |
| 🤖 Monthly alternatives page | ✅ yes | ❌ no | monthly | `/schedule` |
| 🤖 Monthly GEO citation check | proposed | ❌ no | monthly | `/schedule` |
| 🤖 IndexNow ping after content ships | partial | ❌ no | on publish | add to the blog agent's steps, or a deploy hook |
| 🤖 Weekly GSC report digest | proposed | ❌ no | weekly | needs GSC API creds + `/seo google`, then `/schedule` |
| Genre meta-title bulk edit | ✅ yes | ✅ DONE | one-time | completed 2026-06-09 |

**Caveats before automating publishing:**
- The blog agent commits & **pushes to main** (auto-deploys). Fine for content, but
  it's unsupervised writing going live — review cadence or a PR step is safer.
- Cover images are uploaded by you separately; the agent only sets the `/blog/blogN.jpg` path.
- Keep the agent reading THIS file (or memory) for the next queue item so the two don't drift.
