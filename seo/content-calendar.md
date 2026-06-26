# MixReflect SEO Content Calendar

The daily blog agent reads this file, picks the next PENDING item, writes the post, and marks it DONE.
The current highest cover image is tracked here — agent increments it after each post.

> **Full audit + strategy:** see `docs/seo/SEO-AUDIT-2026-06-26.md` (real funnel
> data) and `docs/seo/SEO-CHECKLIST.md` (canonical status).

## Where we are (snapshot 2026-06-26)

Real numbers pulled from the production DB this date:

- **Score product:** 110 reports created · 109 scored (99%) · 70 claimed (64%) ·
  **30 paid unlocks @ $6.95 (27.5% of scored)** · 6 active $19.95/mo subs
  (~$120 MRR) · 40 distinct artists.
- **What's working:** strong paid conversion, reliable scoring, honestly-harsh
  verdicts (only 5% release-ready), good repeat usage, solid technical SEO base.
- **🔴 Watch:** new report creation = **0 in the last 7 days** (was 90/wk on
  Jun 8). Top-of-funnel cliff coincides with the Jun 25-26 verdict-first +
  auth-gating changes. Pumping out content won't help until submissions flow
  again — see audit §0/§1.
- **Fixed this pass:** queue was empty (agent ran dry); image counter was stuck
  at blog23 (already used) → now blog24; `blog20.jpg` duplicate cover
  regenerated in the new grittier art style.

## Current image counter
Last used: blog25 → next post uses blog26

## Blog post queue

| Status | Date Done | Title | Target Keyword | Notes |
|--------|-----------|-------|---------------|-------|
| DONE | 2026-06-26 | How Do I Know When a Song Is Finished? | when is a song finished | blog24.jpg |
| DONE | 2026-06-26 | Why Do Listeners Skip My Song in the First 30 Seconds? | why do people skip my song | blog25.jpg |
| PENDING | | What Makes a Song Catchy? The Anatomy of a Hook That Sticks | what makes a song catchy | hook score dim |
| PENDING | | How Much Does It Cost to Get Your Music Reviewed in 2026? | cost to get music reviewed | bottom-funnel / pricing intent |
| PENDING | | Why Does Nobody Listen to My Music? | why does nobody listen to my music | high-emotion search |
| PENDING | | Is My Mix Too Loud? Loudness, LUFS and the Streaming Norm | is my mix too loud | production score dim |
| PENDING | | How to Get More Spotify Streams (Without Buying Them) | how to get more spotify streams | high volume |
| PENDING | | Song Structure: How to Arrange a Track That Holds Attention | how to structure a song | retention / arrangement |
| PENDING | | How to Make Your Chorus Hit Harder | how to make a chorus hit | hook / production |
| PENDING | | Is My Song Good? An Honest Way to Tell Before You Release | is my song good | core product query — high intent |
| PENDING | | Mixing vs Mastering: What's the Difference? | mixing vs mastering | high volume, evergreen |
| PENDING | | AI vs Human Music Feedback: Which Can You Trust? | ai vs human music feedback | INDUSTRY — product-aligned |
| PENDING | | Why Do All My Songs Sound the Same? | why do my songs sound the same | originality / variety |
| PENDING | | What Does It Mean for a Song to Be "Commercial"? | what makes a song commercial | commercial-pull score dim |
| PENDING | | How to Finish More Songs (And Stop Abandoning Them) | how to finish songs | workflow / habit |
| PENDING | | Is It Worth Paying for Music Feedback? | is paid music feedback worth it | bottom-funnel / product |
| DONE | 2026-06-24 | Best AI Tools for Music Feedback in 2026 | ai music feedback | blog23.jpg |
| DONE | 2026-06-23 | SoundCloud Alternatives (listicle) | soundcloud alternatives | blog22.jpg |
| DONE | 2026-06-22 | Splice Alternatives (listicle) | splice alternatives | blog21.jpg |
| DONE | 2026-06-21 | DistroKid Alternatives (listicle) | distrokid alternatives | blog20.jpg — regenerated 2026-06-26 (was dup of blog10) |
| DONE | 2026-06-20 | How to Copyright Your Music (What Artists Actually Need to Know) | how to copyright music | blog19.jpg |
| DONE | 2026-06-20 | How to Build a Fanbase as an Independent Artist | how to build a fanbase | blog18.jpg |
| DONE | 2026-06-18 | How to Master Music at Home (And When to Hire Out) | how to master music at home | blog17.jpg |
| DONE | 2026-06-17 | Is Your Mix Good? 6 Ways to Know Before You Release | how to know if your mix is good | blog16.jpg |
| DONE | 2026-06-17 | How to Get Music Reviews Online (Honest, Useful Ones) | how to get music reviews online | blog15.png |
| DONE | 2026-06-14 | How to Promote Your Music on Spotify (Without a Label) | how to promote music on spotify | blog14.jpg |
| DONE | 2026-06-14 | Music Release Checklist: What to Do Before You Drop | music release checklist | blog13.jpg |
| DONE | 2026-06-11 | How to Get on Spotify's Discover Weekly | how to get on discover weekly | blog12.jpg |
| DONE | 2026-06-07 | How to Mix Music at Home: A Beginner's Guide | how to mix music at home | blog11.jpg |
| DONE | 2026-06-06 | How to Release Music Independently in 2026 | how to release music independently | blog10.jpg |
| DONE | 2026-06-05 | Why Does My Music Sound Amateur? | why does my music sound amateur | |
| DONE | 2026-06-04 | Why Your Vocals Sound Buried in the Mix | vocals buried in mix | |
| DONE | 2026-05-31 | What Playlist Curators Actually Look For | what playlist curators look for | |
| DONE | 2026-05-30 | MixReflect vs SubmitHub: What's the Difference | mixreflect vs submithub | |
| DONE | 2026-05-29 | Best Music Feedback Platforms in 2026 | music feedback platforms 2026 | |
| DONE | 2026-05-28 | How to Know If Your Song Is Ready to Release | how to know if song is ready | |
| DONE | 2026-05-27 | What 5 People Hearing Your Track Tells You That 1 Person Can't | multiple listeners feedback | |
| DONE | 2026-05-26 | How to Get Feedback on Your Music Before Releasing | how to get feedback on music | |
| DONE | 2026-05-26 | The Best Way to Get Honest Feedback on a Beat | honest feedback on a beat | |
| DONE | 2026-05-26 | How Music Producers Get Their Tracks Reviewed | how producers get tracks reviewed | |

## Alternatives pages queue

| Status | Date Done | Slug | Competitor |
|--------|-----------|------|------------|
| PENDING | | /alternatives/bandlab | BandLab — free DAW + community, huge volume |
| PENDING | | /alternatives/fiverr-music | Fiverr (music feedback/mixing gigs) |
| DONE | 2026-06-23 | /alternatives/soundcloud | SoundCloud |
| DONE | 2026-06-22 | /alternatives/splice | Splice |
| DONE | 2026-06-21 | /alternatives/distrokid | DistroKid |
| DONE | 2026-06-06 | /alternatives/reverbnation | ReverbNation |
| DONE | 2026-06-06 | /alternatives/musosoup | Musosoup |
| DONE | 2026-06-06 | /alternatives/soundbetter | SoundBetter |
| DONE | 2026-06-06 | /alternatives/landr | LANDR |
| DONE | 2026-06-06 | /alternatives/playlist-push | Playlist Push |
| DONE | 2026-06-06 | /alternatives/groover | Groover |
| DONE | 2026-06-06 | /alternatives/submithub | SubmitHub |

## Blog post format rules

Every post MUST have these content blocks in blog-posts.ts:

```
{ type: "paragraph" }   — opening paragraph: directly answers title in 2-3 sentences (AEO target)
{ type: "h2" }          — phrased as questions where possible ("Why does X?" not "X")
{ type: "quote" }       — at least one per post
{ type: "list" }        — at least one per post
{ type: "faq" }         — 4-6 questions with schema auto-applied by renderer
{ type: "cta" }         — always last block
```

Voice: direct, no fluff, slightly contrarian, no overused em dashes. Same register as existing posts.
Category: "GUIDE" for how-tos, "INDUSTRY" for platform/industry topics.
MixReflect tie-in: woven in as a genuine solution in the body, not bolted on as a pitch.
Cover art: auto-generated by `scripts/gen-blog-cover.mjs <N> "<title>"` in the gritty riso style.
