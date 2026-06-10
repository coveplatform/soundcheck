// REAL-TRACK demo data: "Cut and Run" run through the actual worker pipeline
// (deep analysis, stems via local demucs, 2026-06-10). The waveform JSON is the
// genuine per-column LOW/MID/HIGH output of worker `_report_waveform`; every
// timestamp below comes from the measured section map / energy dips:
//   intro 0:00–0:50 · breakdown 0:50–1:40 · drop 1:40–3:51 (the peak stretch)
//   · long −7.5dB falloff 3:51–5:43 · outro 5:43–5:59
//   154 BPM · A minor · lead 1.46× the rhythm section (demucs vocal stem = the synth lead here; instrumental, no sung vocals)
// The prose is hand-written placeholder grounded in those numbers — in prod it
// comes from the model with timestamps locked to the analyzer.
import type { TeaserData } from "./free-teaser-view";
import wave from "./cutandrun-wave.json";

export const CUTANDRUN: TeaserData = {
  trackTitle: "Cut and Run",
  genre: "Techno",
  scoredAt: "June 10, 2026",
  artworkUrl: "/activity-artwork/3.jpg",
  duration: "5:59",

  score: 71,

  verdictLine:
    "there's a real song in here — but it asks for patience on the way in, and even more on the way out.",

  measured: [
    { n: "0:50", label: "first lift" },
    { n: "1:40", label: "the drop lands" },
    { n: "2", label: "drift risks flagged" },
  ],

  // timestamps = measured section bounds / dips; pct = sec / 358.7 × 100
  moments: [
    { at: "0:50", pct: 13.97, free: false, note: "first lift — fifty seconds is a patient open" },
    { at: "1:40", pct: 27.85, free: true, note: "the drop — the best stretch starts here" },
    { at: "2:40", pct: 44.6, free: false, note: "the lead rides clear above the kit through the drop" },
    { at: "3:51", pct: 64.37, free: false, note: "the floor drops out and stays down a long time" },
    { at: "5:43", pct: 95.65, free: false, note: "a 15-second exit after a two-minute descent" },
  ],

  freeInsight: {
    stamp: "1:40",
    headline: "the drop at 1:40 is the best thing on this track.",
    body:
      "It's the longest sustained stretch of energy in the arrangement — once it lands, the track holds its peak for over two minutes, and the lead synth sits clearly on top the whole way. It also takes 100 seconds to arrive: nothing lifts until 0:50, and the build holds almost another full minute after that. The full read covers what to tighten so the best stretch starts working sooner.",
  },

  fixes: [
    {
      label: "tighten the first 100 seconds",
      detail:
        "The first lift doesn't land until 0:50 and the drop not until 1:40. Trimming the intro and shortening the first build gets listeners to the strongest stretch before they drift.",
      impact: "biggest lift",
      sealed: true,
    },
    {
      label: "give the long back section a destination",
      detail:
        "From 3:51 the energy falls hard and stays down for nearly two minutes. A wind-down can work — but it needs something new to follow, or it reads as the song ending three times.",
      impact: "medium",
      sealed: false,
    },
    {
      label: "let the ending land, not stop",
      detail:
        "After a two-minute descent the outro is only 15 seconds. Either shorten the descent or give the exit more room — right now the proportions feel inverted.",
      impact: "polish",
      sealed: false,
    },
  ],

  categories: [
    { label: "Hook Strength", score: 3.6, tag: null },
    { label: "Production Quality", score: 3.9, tag: null },
    { label: "Listener Retention", score: 2.9, tag: "weakest" },
    { label: "Emotional Impact", score: 4.1, tag: "strongest" },
    { label: "Commercial Potential", score: 3.2, tag: null },
  ],

  summaryHeadline: "the drop earns it — the road there and back is long.",
  summaryLead: "Once it opens up at 1:40 this track knows exactly what it is —",
  summaryRest:
    " the energy holds for over two minutes and the lead never gets buried under the kit. The first fifty seconds are a slow ask, and the build after them nearly doubles it. Then the back half lets go at 3:51 and doesn't come back: a long descent into a very short exit. The bones of the song are genuinely good — this is an arrangement edit, not a rewrite.",

  angles: [
    {
      who: "as a producer",
      rating: 4,
      headline: "the drop section is doing real work",
      lead: "The mix opens up beautifully at the drop.",
      rest:
        " The lead sits right on top where it should and the low end has real weight under it. My note is structural — I checked the clock twice before 1:40, and I shouldnt be checking the clock.",
      positive: true,
    },
    {
      who: "as a first-time listener",
      rating: 3,
      headline: "almost left before it got going",
      lead: "Honest take —",
      rest:
        " the first minute nearly lost me. Then the drop hit and I was in. The long quiet stretch near the end had me reaching for the skip button again though.",
      positive: false,
    },
    {
      who: "as a playlist curator",
      rating: 3,
      headline: "six minutes is a big ask",
      lead: "There's a strong four-minute song in here.",
      rest:
        " The peak stretch is playlist-worthy, but the 0:50 intro and the two-minute falloff at the back are both places where skip rates would spike.",
      positive: false,
    },
    {
      who: "as a hook specialist",
      rating: 4,
      headline: "the lead carries it",
      lead: "The lead line is the hook here.",
      rest:
        " It cuts through cleanly the whole way and the melody in the drop section stuck with me after one listen. Get people to it faster and this works.",
      positive: true,
    },
  ],

  receipts: {
    summaryWords: 430,
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

export const CUTANDRUN_FULL = {
  scoreStanding: "a strong score",

  humanReviews: [
    {
      initial: "D",
      genre: "techno · house",
      rating: 4,
      when: "1h ago",
      quote:
        "Basically the drop is where this comes alive. The lead sits really nicely on top of the kit and the energy through that middle stretch is great. For me the intro is the thing — it takes a while before anything happens and I think you could cut a good chunk of it without loosing anything. Strong song underneath though.",
    },
    {
      initial: "K",
      genre: "electronic · ambient",
      rating: 4,
      when: "3h ago",
      quote:
        "I really liked the feel of this... it's emotional without trying too hard. The long quiet part near the end actually worked on me, but I can see people skipping there. Also the ending felt sudden after all that wind down. The sound design is lovely, genuinly.",
    },
    {
      initial: "R",
      genre: "techno",
      rating: 3,
      when: "4h ago",
      quote:
        "Solid track but it tested my patience twice — once at the start and once near the end. The middle section is honestly great, everthing clicks there. Tighten the edges and this is a keeper. You've got somthing real here.",
    },
  ],

  dimensionNotes: [
    {
      label: "Hook Strength",
      score: 3.6,
      tag: null,
      note: "The lead melody in the drop section is the hook, and it's a real one — it just doesn't appear until 1:40. A hint of it earlier would change how the whole open feels.",
    },
    {
      label: "Production Quality",
      score: 3.9,
      tag: null,
      note: "The mix is clean and the lead placement is genuinely good — measured at 1.46× the rhythm section, it never fights for space. The bright top end gives it air without harshness.",
    },
    {
      label: "Listener Retention",
      score: 2.9,
      tag: "weakest" as const,
      note: "Two measured drift zones: the 0:50 ramp-in and the long −7.5dB falloff from 3:51. Both are arrangement choices, which means both are fixable without touching a fader.",
    },
    {
      label: "Emotional Impact",
      score: 4.1,
      tag: "strongest" as const,
      note: "This is the track's real asset — the song feels like it's about something, and the long descent reads as intentional melancholy rather than emptiness. It earns feelings; it just spends attention to do it.",
    },
    {
      label: "Commercial Potential",
      score: 3.2,
      tag: null,
      note: "At 5:59 with a 100-second ramp-in, editorial placement is a hard sell as-is. A tightened edit keeps everything that matters and opens real doors.",
    },
  ],

  fullRead: [
    "Once it opens up at 1:40 this track knows exactly what it is. The drop is the longest sustained stretch of energy in the arrangement — it holds its peak for over two minutes, the kit has real weight, and the lead sits clearly on top the entire time. That's measured, not vibes: the lead rides at nearly one-and-a-half times the rhythm section, which is exactly where a track like this wants it.",
    "The cost is everything around that stretch. Nothing lifts until 0:50, and the build holds almost another minute after that — a hundred seconds of patience before the track plays its best card. Then at 3:51 the floor drops out and stays down: a long, deliberate descent that runs nearly two minutes into a fifteen-second exit. The descent itself has feeling — it reads as intentional, and the emotional thread never breaks — but the proportions are inverted: a long goodbye with an abrupt door-slam at the end.",
    "The fix here is an edit, not a rewrite. Tighten the first hundred seconds so the drop arrives while the listener is still leaning in, give the back-half descent one new element or a destination, and let the ending breathe for more than fifteen seconds. The track underneath — the melody, the lead, the feeling — is already doing its job.",
  ],
};
