// REAL-TRACK demo data: "Power Tools 5" (Ant & James Kinetec) pulled from
// YouTube and run through the actual worker pipeline — FULL TRACK (deep
// analysis with MAX_ANALYZE_SECS=480, stems via local demucs, 2026-06-10),
// proving the whole prod path: yt-dlp → transcode → DSP → stems → waveform.
// Every timestamp below is measured:
//   intro 0:00–0:27 · idle 0:27–1:20 (−11.4dB) · drop 1:20–2:41 · build
//   2:41–3:21 (−4.7dB) · drop 3:21–4:14 · breakdown 4:14–4:41 (−7.1dB) ·
//   THE MAIN EVENT: drop 4:41–7:02 (2m21s sustained) · outro 7:02–7:14
//   7:14 · 143.6 BPM · C major · loud master (−10.0 dB RMS) · drums 0.72 /
//   bass 0.73 / vocal stem 0.49× tucked = instrumental (no sung-vocal claims)
// Prose is hand-written placeholder grounded in those numbers — in prod the
// model writes it with timestamps locked to the analyzer.
import type { TeaserData } from "./free-teaser-view";
import wave from "./powertools-wave.json";

export const POWERTOOLS: TeaserData = {
  trackTitle: "Power Tools 5",
  genre: "Techno",
  scoredAt: "June 10, 2026",
  artworkUrl: "/activity-artwork/7.jpg",
  duration: "7:14",

  score: 76,

  verdictLine:
    "a seven-minute track that earns its length — but it makes you wait eighty seconds before it gives you a reason.",

  measured: [
    { n: "1:20", label: "first drop lands" },
    { n: "4:41", label: "the main event starts" },
    { n: "3", label: "energy dips mapped" },
  ],

  // timestamps = measured section bounds / dips; pct = sec / 433.9 × 100
  moments: [
    { at: "0:27", pct: 6.2, free: false, note: "the open cuts out — nearly a minute idles before the build" },
    { at: "1:20", pct: 18.5, free: false, note: "first drop — eighty seconds is a patient open" },
    { at: "4:14", pct: 58.6, free: false, note: "the floor drops out for one breath before the main event" },
    { at: "4:41", pct: 64.8, free: true, note: "the final drop — the strongest stretch of the track starts here" },
    { at: "7:02", pct: 97.1, free: false, note: "a twelve-second exit after two and a half minutes at full power" },
  ],

  freeInsight: {
    stamp: "4:41",
    headline: "the final drop at 4:41 is the best thing on this track.",
    body:
      "It's the longest sustained stretch in the whole arrangement — from 4:41 the track holds full power for nearly two and a half minutes, kit and bass locked the entire way. The read walked all seven minutes to find it: the first drop at 1:20 is good, but this is the one the track was building toward. What costs you is the front — the energy pulls back hard at 0:27 and idles for almost a minute before anything moves.",
  },

  fixes: [
    {
      label: "tighten the first eighty seconds",
      detail:
        "The open cuts out at 0:27 and sits low until the build finally lands the first drop at 1:20. Halving that idle stretch gets listeners into the track's world a half-minute sooner without touching the arc.",
      impact: "biggest lift",
      sealed: true,
    },
    {
      label: "shorten the mid-track build",
      detail:
        "The build between the first two drops runs a full forty seconds (2:41–3:21). Twenty would keep the floor moving and make the second drop hit harder.",
      impact: "medium",
      sealed: false,
    },
    {
      label: "give DJs a longer tail",
      detail:
        "After two and a half minutes at full power, the outro is twelve seconds. A 16–32 bar exit would make this far easier to mix out of — and this track will live in sets.",
      impact: "polish",
      sealed: false,
    },
  ],

  categories: [
    { label: "Hook Strength", score: 3.8, tag: null },
    { label: "Production Quality", score: 4.2, tag: "strongest" },
    { label: "Listener Retention", score: 3.3, tag: "weakest" },
    { label: "Emotional Impact", score: 3.6, tag: null },
    { label: "Commercial Potential", score: 3.7, tag: null },
  ],

  summaryHeadline: "the best stretch is the last one — and it's worth the ride.",
  summaryLead: "The final drop at 4:41 holds full power for nearly two and a half minutes —",
  summaryRest:
    " kit and bass locked in, the master loud and bright without smearing, and the track finally spending the credibility it built all the way up. The structure underneath is classic long-form: a patient open, a first drop at 1:20, a long mid-build, a second drop, one last breath at 4:14 — then the main event. What it asks in return is patience the first eighty seconds haven't earned yet, and the mid-build leans long. Trim the front, tighten the middle, and the seven minutes play like five.",

  angles: [
    {
      who: "as a producer",
      rating: 4,
      headline: "the master is doing real work",
      lead: "This is mixed loud and bright and it holds.",
      rest:
        " The kick and bass measure as the engine of the track and nothing up top fights them. The final-drop stretch is genuinely well sustained — no flagging across two-plus minutes. My note is the idle stretch up front; it's empty rather than tense.",
      positive: true,
    },
    {
      who: "as a first-time listener",
      rating: 3,
      headline: "nearly left before it started",
      lead: "Honest take —",
      rest:
        " the quiet minute near the start almost lost me. Once the first drop landed I stayed, and the last stretch is the best part by far. I just wonder how many people make it there.",
      positive: false,
    },
    {
      who: "as a playlist curator",
      rating: 4,
      headline: "a set tool, not a stream single",
      lead: "For club sets and mix shows this works as-is —",
      rest:
        " seven minutes with a huge back end is exactly the shape DJs want. For editorial streaming playlists, a tighter five-minute edit that gets to 1:20 faster would travel much further.",
      positive: true,
    },
    {
      who: "as a hook specialist",
      rating: 3,
      headline: "the groove is the hook",
      lead: "There's no melodic top-line doing the work here —",
      rest:
        " it's the groove, and at full power it's sticky. The risk is the front eighty seconds give a first-time listener nothing to hold while they wait for it.",
      positive: false,
    },
  ],

  receipts: {
    summaryWords: 446,
    categoryNotes: 5,
    weakest: "listener retention",
    fixes: 3,
    markers: 5,
  },

  room: {
    size: 5,
    matched: "techno · electronic",
    etaFirst: "a few hours",
    etaFull: "48 hours",
  },

  wave,
};

// ── full-report extras (the unlocked page) ───────────────────────────

export const POWERTOOLS_FULL = {
  scoreStanding: "a strong score",

  humanReviews: [
    {
      initial: "S",
      genre: "techno · house",
      rating: 4,
      when: "1h ago",
      quote:
        "Basically the last drop is the whole reason this track exists and its a good reason. Kick and bass lock in properly and it holds for ages without getting boring. For me the start is the only issue — that quiet stretch goes on too long before anything happens. Also as a DJ I'd want a longer outro to mix out of. Strong track.",
    },
    {
      initial: "L",
      genre: "electronic",
      rating: 4,
      when: "2h ago",
      quote:
        "This is clean! I was nodding the whole back half. The build in the middle felt a bit long to me, like it was somthing I'd skip through in the booth, but when the final section hits it all makes sense. The loudness feels intentional, not squashed. Would play this out.",
    },
    {
      initial: "P",
      genre: "techno",
      rating: 3,
      when: "5h ago",
      quote:
        "Good groove, no question, and the long final stretch is definitley the highlight. My honest issue is pacing — the intro idles and the mid build overstays a little. The bones are proper club techno though. Tighten the edges and this is a keeper.",
    },
  ],

  dimensionNotes: [
    {
      label: "Hook Strength",
      score: 3.8,
      tag: null,
      note: "The groove is the hook — no melodic top-line, and at full power it doesn't need one. The weakness is the front eighty seconds, where there's no groove to hold onto yet.",
    },
    {
      label: "Production Quality",
      score: 4.2,
      tag: "strongest" as const,
      note: "Loud, bright and deliberate — drums and bass measure as the twin engines, and the master holds together across a two-and-a-half-minute peak without smearing. This is the track's real asset.",
    },
    {
      label: "Listener Retention",
      score: 3.3,
      tag: "weakest" as const,
      note: "Three measured dips: the near-minute idle from 0:27 (the expensive one — it sits where new listeners decide), the long 2:41 build, and the 4:14 breath. The last one works; the first two cost attention.",
    },
    {
      label: "Emotional Impact",
      score: 3.6,
      tag: null,
      note: "This is a body track and it knows it — the payoff is physical, and the 4:14 pull-back right before the main event is the one moment of real tension. The opening idle reads as empty rather than tense; that's the difference between anticipation and waiting.",
    },
    {
      label: "Commercial Potential",
      score: 3.7,
      tag: null,
      note: "As-is, this is a DJ tool with real legs — seven minutes, huge back end, loud master. The streaming ceiling is the front eighty seconds; a tighter edit would open editorial doors the current shape can't.",
    },
  ],

  fullRead: [
    "The read walked all seven minutes, and the verdict is simple: the best stretch is the last one. From 4:41 the track holds full power for nearly two and a half minutes — the longest sustained section in the arrangement, kick and bass locked the whole way, the master loud and bright without falling apart. Long-form techno lives or dies on whether the final payoff justifies the journey, and this one does.",
    "The journey itself is mostly well built. The first drop at 1:20 establishes the engine, the second at 3:21 deepens it, and the breakdown at 4:14 is the track's smartest moment — one genuine breath before the main event, real tension instead of filler. Two stretches work against it: the opening, which cuts out at 0:27 and idles near-silent for almost a minute (empty, not tense — a first-time listener gets nothing to hold), and the mid-build from 2:41, which spends forty seconds doing twenty seconds of work.",
    "The fixes are proportion, not surgery. Halve the front idle so the first drop lands around the minute mark, tighten the mid-build, and give the outro more than twelve seconds — this track will live in DJ sets, and a 16–32 bar tail is the difference between getting played and getting reached for. The engine is already built; trim the chassis around it and seven minutes play like five.",
  ],
};
