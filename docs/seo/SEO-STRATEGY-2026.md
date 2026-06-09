# MixReflect — SEO Strategy & Roadmap (June 2026)

> Built with the `claude-seo` plugin, grounded in the live site (`https://www.mixreflect.com`)
> and the actual codebase (sitemap.ts, layout.tsx, blog-posts.ts, genre-pages.ts, alternatives.ts).
> Supersedes the older notes in memory `project_seo_plan.md`.

---

## 0. The product, as it actually is today

The site has pivoted since the last plan was written. The plan below targets the **current** product, not the old one.

- **Headline:** "your track, heard for real."
- **Offer:** paste/upload a track → instant **AI score out of 100** across 5 dimensions (hook, production, retention, emotional impact, commercial pull) + **3 fixes** + reactions from a **room of 5 real listeners**.
- **Pricing (live):** Free (score + verdict + 3 fixes + reaction headlines) · **$6.95/track** one-time full unlock · **$19.95/mo** ($143.40/yr) unlimited auto-unlock.
- **Audience:** independent / bedroom musicians, producers, singer-songwriters wanting honest pre-release feedback.
- **Core competitors:** SubmitHub, Groover (playlist pitching, adjacent), plus generic "song feedback / rate my track" tools.

**Search positioning:** MixReflect should own the intersection of two intents that competitors serve poorly:
1. **"Is my song/mix good / ready?"** (validation intent — pre-release anxiety)
2. **"Rate my track / score my song / get feedback on my music"** (action intent)

SubmitHub and Groover rank for *promotion/playlist* intent. MixReflect's wedge is **honest feedback + a score**, not promotion. Lean into that — it's a less contested, higher-intent lane.

---

## 1. Current state — what already exists (and it's a solid base)

| Asset | Count | Status |
|---|---|---|
| Blog posts (`/blog`) | **14** | Good cadence, AEO-formatted |
| Genre pages (`/feedback/[genre]`) | **32** | Live; rich schema |
| Alternatives pages (`/alternatives/[slug]`) | **9** | SubmitHub, Groover, Playlist Push, LANDR, SoundBetter, Musosoup, ReverbNation, +2 |
| `sitemap.ts` | auto | Working, but wrong host (see P0) |
| `robots.ts` | live | **Too permissive** (see P0) |
| Root schema | `SoftwareApplication` + `Organization` + `WebSite` | Good; offers match live pricing |
| OG / Twitter cards | full | Good |
| Vercel Analytics + Speed Insights | on | Good |

**Verdict:** the content foundation is genuinely strong for a solo product. The gap is **not** content volume — it's (a) a handful of technical canonical/crawl bugs bleeding authority, (b) schema that under-uses MixReflect's unfair advantage (it's a *review* platform), and (c) no AI-search (GEO) layer. Fix those three and the existing 55 pages will perform meaningfully better without writing a single new post.

---

## 2. P0 — Critical technical fixes (do this week, ~half a day total)

These are bugs, not nice-to-haves. Each one is currently costing rankings.

### P0.1 — Canonical host conflict (www vs non-www) 🔴 highest impact
- **Live behavior:** `mixreflect.com` → **307** → `www.mixreflect.com` (200). The server treats **www** as canonical.
- **But the code emits non-www everywhere:** `sitemap.ts` `BASE_URL`, `robots.ts` sitemap URL, all three JSON-LD blocks (`url`, `logo`, `contactPoint`, `SearchAction` target), and `metadataBase` default all use `https://mixreflect.com`.
- **Net effect:** every canonical signal you send Google points at a host that immediately redirects. Authority is split; the sitemap is full of redirecting URLs (Google penalizes this).

**Fix — standardize on `www` (it's what the server already serves):**
1. `src/app/sitemap.ts` → `BASE_URL = "https://www.mixreflect.com"`
2. `src/app/robots.ts` → `sitemap: "https://www.mixreflect.com/sitemap.xml"`
3. `src/app/layout.tsx` → `siteUrl` default + **every** JSON-LD `url`/`logo`/`target` → `https://www.mixreflect.com`
4. `.env` / Vercel: `NEXT_PUBLIC_SITE_URL=https://www.mixreflect.com`
5. Make the apex→www redirect a **301 permanent**, not 307 (Vercel: set the redirect in `next.config.ts` or the domain config so it's a permanent redirect).

### P0.2 — Add self-referencing canonical tags
The homepage and most marketing routes don't emit an explicit `<link rel="canonical">`. With `metadataBase` set, add `alternates: { canonical: "/" }` (and the matching path on genre/blog/alternatives pages). This kills duplicate-URL ambiguity (trailing slash, query params, utm).

### P0.3 — Lock crawlers out of the app, not just "Allow: /"
`robots.ts` currently returns `{ allow: "/" }` with **no disallows** — so `/dashboard`, `/admin`, `/api`, `/login`, `/submit/checkout`, `/account`, score/report permalinks, etc. are all crawlable. This wastes crawl budget and risks indexing thin/auth pages.
```ts
rules: {
  userAgent: "*",
  allow: "/",
  disallow: ["/dashboard", "/admin", "/api", "/login", "/signup",
             "/account", "/onboarding", "/submit/checkout", "/submit/success",
             "/review/", "/reviewer/", "/support/tickets", "/r/", "/score-review/"],
},
```
(Keep public marketing routes — `/`, `/blog`, `/feedback`, `/alternatives`, `/discover`, `/reviewer`, `/support` — allowed.)

### P0.4 — Verify blog posts emit `BlogPosting` + breadcrumb schema
Confirm `/blog/[slug]` outputs `BlogPosting` (headline, datePublished, author, image) and `BreadcrumbList`. If missing, this is the cheapest rich-result win you have.

**P0 acceptance check:** after deploy, `curl -sI https://mixreflect.com` returns **301**, the live sitemap and all JSON-LD show **www**, and `robots.txt` disallows app routes.

---

## 3. Keyword strategy

Three intent tiers. Map each to a page that already exists or needs creating.

### Tier 1 — Action / transactional (own these; highest conversion)
| Keyword | Intent | Target page |
|---|---|---|
| rate my track / rate my song | action | **Homepage** (add an H2 + copy using this exact phrase) |
| score my track / song score | action | Homepage |
| get feedback on my music | action | Homepage + `/blog/how-to-get-feedback-on-your-music` |
| honest music feedback | action | Homepage |
| ai music feedback / ai song analysis | action | Homepage (the AI score is the differentiator — name it) |
| song feedback before release | action | "How to know if your song is ready" post |

### Tier 2 — Validation / question (AEO gold — this is the wedge)
| Keyword | Target |
|---|---|
| is my song good / how to know if my mix is good | dedicated post + FAQ schema |
| why does my music sound amateur | ✅ exists — keep optimized |
| why are my vocals buried in the mix | ✅ exists |
| how to tell if a song is ready to release | ✅ exists |
| is my mix too loud / too quiet | **new post** |

### Tier 3 — Top-of-funnel / educational (traffic + internal-link fuel)
Music release checklist, how to promote music on Spotify, how to master at home, how to build a fanbase, how to copyright music — these feed links down to Tier 1/2. (See content calendar §6.)

### Tier 4 — Genre long-tail (32 pages already live)
"[genre] feedback", "get feedback on [genre] track". **Action item:** finally ship the genre meta-title upgrade (see §6.3) — it's been pending and it's a 1-file change for 32 pages.

### Tier 5 — Competitor capture (9 pages live, 3 pending)
SubmitHub/Groover alternative searches convert well. Ship Splice, DistroKid, SoundCloud alternative pages.

---

## 4. Site architecture & internal linking

Current public structure is good. Tighten the **internal link graph** so authority flows to money pages:

```
Home  (rate my track / score my track — Tier 1 hub)
 ├─ /feedback            ← ADD a genre index/hub page (currently only /feedback/[genre] exist, no hub)
 │   └─ /feedback/[genre] × 32
 ├─ /alternatives        ← ADD an alternatives index/hub page
 │   └─ /alternatives/[competitor] × 9
 ├─ /blog (hub)
 │   └─ /blog/[slug] × 14
 ├─ /discover  /reviewer  /support
 └─ (app: /submit, /dashboard, … — noindex)
```

**Internal linking rules:**
1. Every **blog post** links to (a) the homepage with anchor "get your track scored / rate my track" and (b) 1–2 sibling posts in the same cluster.
2. Every **genre page** links up to a new `/feedback` hub and across to 2–3 related genres.
3. Every **alternatives page** links to the homepage CTA + the "Best Music Feedback Platforms in 2026" post (your roundup — make it the alternatives cluster hub).
4. Add **`/feedback` and `/alternatives` index hubs** — right now those parent paths likely 404 or are thin; hubs consolidate the children's authority and are linkable from the footer.
5. Put a **footer link block** ("Feedback by genre", "Compare", "Guides") on marketing pages so every child page is ≤2 clicks from home.

---

## 5. Schema plan — use the unfair advantage

MixReflect is *literally a review platform*. That unlocks schema competitors can't credibly use.

| Page | Current | Add |
|---|---|---|
| Home | SoftwareApplication + Org + WebSite ✅ | Keep. Ensure `aggregateRating` only if you have real, on-page, verifiable ratings (Google penalizes fake/self-serving). |
| Genre `/feedback/[genre]` | FAQPage, Breadcrumb, HowTo, SoftwareApplication ✅ | Add **`Review`/`CreativeWork`** examples only if real reviews render on-page. |
| Blog `/blog/[slug]` | verify (P0.4) | `BlogPosting` + `BreadcrumbList` + `FAQPage` (you already write FAQ blocks — emit them as schema). |
| Alternatives | verify | `FAQPage` + `BreadcrumbList`; comparison table in clean HTML `<table>` (AI-extractable). |
| `/discover`, `/today` | — | `ItemList` of tracks (if public) — feeds "discover new music" surfaces. |

**Rule:** never emit `Review`/`AggregateRating` for content not visibly on the page. It's the #1 schema manual-action trigger. Only mark up what a user can see.

---

## 6. Content strategy & calendar

You don't need *more* posts urgently — you need the existing 14 interlinked and 2–3 strategic gaps filled. Weekly cadence, alternate clusters.

### 6.1 Next 8 posts (priority order)
| # | Title | Target keyword | Cluster |
|---|---|---|---|
| 1 | Music Release Checklist: Everything to Do Before You Drop | music release checklist | AEO/release |
| 2 | Is Your Mix Good? 7 Ways to Tell Before You Release | how to know if your mix is good | Validation (wedge) |
| 3 | How to Get on Spotify's Discover Weekly | how to get on discover weekly | Promotion |
| 4 | How to Promote Your Music on Spotify Without a Label | how to promote music on spotify | Promotion |
| 5 | How to Master Music at Home (and When to Hire Out) | how to master music at home | Production |
| 6 | Is My Mix Too Loud? Loudness, LUFS and the Streaming Norm | is my mix too loud | Validation |
| 7 | How to Build a Fanbase as an Independent Artist | how to build a fanbase | Top-of-funnel |
| 8 | How to Copyright Your Music (What Artists Actually Need) | how to copyright music | Top-of-funnel |

(Keep the existing house-style rules from memory: lead paragraph answers the title in 2–3 sentences, H2s as questions, ≥1 FAQ block emitted as `FAQPage`, CTA block, natural MixReflect tie-in.)

### 6.2 Alternatives pages — ship the remaining 3
`/alternatives/splice`, `/alternatives/distrokid`, `/alternatives/soundcloud`. High volume; "[brand] alternative" is bottom-funnel and converts at SaaS comparison rates (4–7%). Be factually accurate about each competitor.

### 6.3 Genre meta-title upgrade (pending — do it now)
One file (`src/lib/genre-pages.ts`), 32 entries:
- From: `"[Genre] Music Feedback | MixReflect"`
- To: `"Get Honest Feedback on Your [Genre] Track | MixReflect"`

More action-oriented, matches "get feedback on [genre]" intent, improves CTR. Pure upside.

---

## 7. GEO / AI-search plan (the missing layer)

You have **zero** AI-search optimization right now, and your audience increasingly asks ChatGPT/Perplexity "how do I get feedback on my song before release?" This is where MixReflect should be cited.

1. **`/llms.txt`** — add a root `llms.txt` summarizing what MixReflect is, the offer, pricing, and links to the best 10 pages. (Cheap, emerging standard, AI crawlers read it.)
2. **Passage citability** — every guide's opening paragraph must be a self-contained, quotable answer (you mostly do this — enforce it). AI engines cite the paragraph that answers the question standalone.
3. **FAQPage schema everywhere** — AI Overviews pull heavily from FAQ markup. You write FAQs but may not emit schema; emit it.
4. **Comparison tables as real HTML** — alternatives pages must use semantic `<table>`, not divs, so AI can extract feature/pricing rows.
5. **Brand entity consistency** — same `Organization` name, logo, `sameAs` (Twitter, and add any Crunchbase/LinkedIn/Wikidata) across all schema so AI builds a confident entity.
6. **Don't block AI crawlers** — keep GPTBot, PerplexityBot, ClaudeBot, Google-Extended *allowed* on marketing content (your `allow: /` does this; just keep the §2 app disallows).
7. **Measure it:** monthly, manually prompt ChatGPT/Perplexity/Google AI Overviews with "best way to get honest feedback on my song", "submithub alternatives", "how to know if my mix is ready" and log whether MixReflect is cited. That's your GEO baseline.

---

## 8. Off-page / authority

You're a solo product; do the high-ROI, low-spam moves only:
- **Reddit** (from memory, still right): r/WeAreTheMusicMakers, r/makinghiphop, r/edmproduction, r/indieheads, r/songwriting. Be genuinely helpful; link a blog post only when it directly answers. DA-80+ contextual links + real traffic.
- **Product directories:** list on relevant "music tools" roundups, AlternativeTo, indie-maker directories (these also feed AI entity signals).
- **Founder content:** a few "I built an honest music-feedback tool" posts on IndieHackers / X build branded search ("mixreflect") which is the strongest ranking signal of all.
- **Avoid:** paid link schemes, mass guest posting. Not worth the risk at this stage.

---

## 9. Measurement & KPIs

**Set up first (P0-adjacent):** Google Search Console (verify the **www** property + submit the www sitemap) and GA4. Optionally wire the plugin's `/seo google` skill with GSC API creds for automated field data.

Weekly: GSC impressions/clicks per page-type (`/feedback/*`, `/blog/*`, `/alternatives/*`); queries in **position 8–15** (one meta-title tweak = first-page win); CTR <2% pages (rewrite title); new referring domains.

| Metric | Baseline (now) | 3 mo | 6 mo | 12 mo |
|---|---|---|---|---|
| Indexed marketing pages | ~55 | 65 | 80 | 100+ |
| Organic clicks / mo | *set from GSC* | +50% | 3× | 6× |
| Keywords in top 10 | *set from GSC* | 15 | 40 | 100 |
| AI citations (manual prompt set) | 0 logged | 2/10 | 4/10 | 6/10 |
| Core Web Vitals (CrUX) | *measure* | all "Good" | maintain | maintain |
| Free submits from organic | *set* | +trend | 2× | 4× |

The north-star isn't traffic — it's **free submits and $6.95/$19.95 conversions from organic**. Tie every content decision back to that.

---

## 10. Phased roadmap

**Phase 1 — Foundation (this week).** P0.1–P0.4 (canonical/www, 301, canonical tags, robots disallow, blog schema). Set up GSC (www property) + GA4. Ship genre meta-title upgrade (§6.3). *This phase alone should move the needle on the existing 55 pages.*

**Phase 2 — Structure (weeks 2–4).** Add `/feedback` + `/alternatives` hub pages. Implement internal-linking rules (§4) + footer link block. Emit FAQPage schema sitewide. Add `/llms.txt`.

**Phase 3 — Expansion (weeks 5–12).** Weekly blog posts #1–8 (§6.1). Ship 3 remaining alternatives pages. Start Reddit presence. Run `/seo audit` again to re-baseline.

**Phase 4 — Authority (months 4–12).** GEO citation tracking + iteration, directory/founder backlinks, refresh top posts quarterly, expand genres/comparisons based on GSC winners.

---

## Appendix — Re-running the audit
- `/seo audit https://www.mixreflect.com` — full re-baseline after Phase 1
- `/seo technical https://www.mixreflect.com` — confirm CWV + crawl after the robots/canonical fixes
- `/seo schema https://www.mixreflect.com/blog/<slug>` — validate BlogPosting/FAQ output
- `/seo geo https://www.mixreflect.com` — score AI-search readiness once llms.txt + FAQ schema ship
