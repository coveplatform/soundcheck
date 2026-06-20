# MixReflect SEO Content Calendar

The daily blog agent reads this file, picks the next PENDING item, writes the post, and marks it DONE.
The current highest cover image is tracked here — agent increments it after each post.

## Current image counter
Last used: blog18 → next post uses blog19
⚠️ blog19.jpg onward still need to be uploaded — pre-upload blog19.jpg–blog20.jpg before the next post runs. (gen-blog-cover.mjs requires OPENAI_API_KEY in the routine env; if it is missing, reuse an existing /blog/blogN.jpg rather than blocking the post.)

## Blog post queue

| Status | Date Done | Title | Target Keyword | Notes |
|--------|-----------|-------|---------------|-------|
| DONE | 2026-06-05 | Why Does My Music Sound Amateur? | why does my music sound amateur | |
| DONE | 2026-06-04 | Why Your Vocals Sound Buried in the Mix | vocals buried in mix | |
| DONE | 2026-05-31 | What Playlist Curators Actually Look For | what playlist curators look for | |
| DONE | 2026-05-28 | How to Know If Your Song Is Ready to Release | how to know if song is ready | |
| DONE | 2026-05-26 | How to Get Feedback on Your Music Before Releasing | how to get feedback on music | |
| DONE | 2026-05-26 | The Best Way to Get Honest Feedback on a Beat | honest feedback on a beat | |
| DONE | 2026-05-26 | How Music Producers Get Their Tracks Reviewed | how producers get tracks reviewed | |
| DONE | 2026-05-27 | What 5 People Hearing Your Track Tells You That 1 Person Can't | multiple listeners feedback | |
| DONE | 2026-05-29 | Best Music Feedback Platforms in 2026 | music feedback platforms 2026 | |
| DONE | 2026-05-30 | MixReflect vs SubmitHub: What's the Difference | mixreflect vs submithub | |
| DONE | 2026-06-06 | How to Release Music Independently in 2026 | how to release music independently | |
| DONE | 2026-06-07 | How to Mix Music at Home: A Beginner's Guide | how to mix music at home | blog11.jpg |
| DONE | 2026-06-11 | How to Get on Spotify's Discover Weekly | how to get on discover weekly | blog12.jpg |
| DONE | 2026-06-14 | Music Release Checklist: What to Do Before You Drop | music release checklist | blog13.jpg — AEO checklist format |
| DONE | 2026-06-14 | How to Promote Your Music on Spotify (Without a Label) | how to promote music on spotify | blog14.jpg |
| DONE | 2026-06-17 | How to Get Music Reviews Online (Honest, Useful Ones) | how to get music reviews online | blog15.png — compares Reddit/Discord/SubmitHub/friends honestly |
| DONE | 2026-06-17 | Is Your Mix Good? 6 Ways to Know Before You Release | how to know if your mix is good | blog16.jpg — Strong AEO format — numbered list with clear yes/no signals |
| DONE | 2026-06-18 | How to Master Music at Home (And When to Hire Out) | how to master music at home | High volume — cover basics then when to hand off |
| DONE | 2026-06-20 | How to Build a Fanbase as an Independent Artist | how to build a fanbase | blog18.jpg — top of funnel: social, live, release cadence |
| PENDING | | How to Copyright Your Music (What Artists Actually Need to Know) | how to copyright music | High volume, question-based — demystify PROs, ISRC, copyright registration |

## Alternatives pages queue

| Status | Date Done | Slug | Competitor |
|--------|-----------|------|------------|
| DONE | 2026-06-06 | /alternatives/submithub | SubmitHub |
| DONE | 2026-06-06 | /alternatives/groover | Groover |
| DONE | 2026-06-06 | /alternatives/playlist-push | Playlist Push |
| DONE | 2026-06-06 | /alternatives/landr | LANDR |
| DONE | 2026-06-06 | /alternatives/soundbetter | SoundBetter |
| DONE | 2026-06-06 | /alternatives/musosoup | Musosoup |
| DONE | 2026-06-06 | /alternatives/reverbnation | ReverbNation |
| PENDING | | /alternatives/distrokid | DistroKid — distribution; "distrokid alternative" is massive volume |
| PENDING | | /alternatives/splice | Splice — sample library + some collab; different product but huge search |
| PENDING | | /alternatives/soundcloud | SoundCloud — discovery/distribution; broad but massive |

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
