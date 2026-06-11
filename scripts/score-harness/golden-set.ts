/**
 * The golden set — tracks with expected score bands, used to regression-test
 * every scorer change (prompt, model, engine, norms). Run via:
 *
 *   npx tsx scripts/score-harness/run.ts
 *
 * Two kinds of entries:
 *  - "hit": commercially released, widely-loved music. The bands here are real
 *    expectations — a premier scorer that puts Blinding Lights at 71 is broken.
 *  - "indie" / "demo": real submissions from the live DB. True quality unknown,
 *    so bands are SANITY ranges (wide); their primary value is measuring SPREAD
 *    and run-to-run stability across realistic material. `prodNote` records the
 *    score the v1 engine gave in production (the 62–76 compression era).
 */

export type GoldenTrack = {
  id: string;
  url: string;
  title: string;
  artist?: string;
  genre: string;
  kind: "hit" | "indie" | "demo";
  /** [min, max] acceptable score. */
  expect: [number, number];
  note?: string;
};

export const GOLDEN_SET: GoldenTrack[] = [
  // ── known hits (real expectations) ─────────────────────────────────
  {
    id: "blinding-lights",
    url: "https://www.youtube.com/watch?v=fHI8X4OXluQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    genre: "Pop",
    kind: "hit",
    expect: [85, 97],
    note: "#1 single, pro master, instant hook — the ceiling test.",
  },
  {
    id: "humble",
    url: "https://www.youtube.com/watch?v=5rHerTQpZec",
    title: "HUMBLE.",
    artist: "Kendrick Lamar",
    genre: "Hip-Hop",
    kind: "hit",
    expect: [85, 97],
    note: "modern hip-hop classic; tests the loop-tolerance rule (sparse beat ≠ monotony).",
  },
  {
    id: "strobe",
    url: "https://www.youtube.com/watch?v=tKi9Z-f6qX4",
    title: "Strobe",
    artist: "deadmau5",
    genre: "Electronic",
    kind: "hit",
    expect: [84, 96],
    note: "10-min progressive classic with a very long intro — the genre-convention test (long build must NOT read as a weak intro).",
  },
  {
    id: "skinny-love",
    url: "https://www.youtube.com/watch?v=Daz-_OLM-is",
    title: "Skinny Love",
    artist: "Bon Iver",
    genre: "Singer-Songwriter",
    kind: "hit",
    expect: [80, 95],
    note: "deliberately raw recording — quiet, wide master is CORRECT for the genre (acoustic norms test).",
  },
  {
    id: "old-town-road",
    url: "https://www.youtube.com/watch?v=r7qovpFAGrQ",
    title: "Old Town Road",
    artist: "Lil Nas X",
    genre: "Hip-Hop",
    kind: "hit",
    expect: [85, 97],
    note: "verified through the live pipeline before (v1 scored it 91).",
  },

  // ── real submissions (spread + stability; wide sanity bands) ───────
  {
    id: "knockout-beat",
    url: "https://youtu.be/JSrJEzSdpdA?si=_eGmcpfJFcoF9TZ-",
    title: "Travis Scott - KNOCKOUT (Prod. 6sixx)",
    genre: "Trap",
    kind: "indie",
    expect: [50, 80],
    note: "type beat; v1 gave 73.",
  },
  {
    id: "grail-beat",
    url: "https://youtu.be/0FFUS_x4OGo?si=svRh8TkT9N4vBh1m",
    title: "GRAIL | Dark Trap Type Beat",
    genre: "Trap",
    kind: "indie",
    expect: [45, 78],
    note: "type beat; v1 gave 68.",
  },
  {
    id: "summers-ready",
    url: "https://youtu.be/yWBYHnS1jj8?si=_WLDRQAGx9DQbNSg",
    title: "Summer's Ready",
    genre: "Hip-Hop",
    kind: "indie",
    expect: [45, 80],
    note: "v1 gave 73.",
  },
  {
    id: "right-here",
    url: "https://youtu.be/mEu2Pg-2lc8?si=e-cfvG3eajlf5BEP",
    title: "KTO K4 - Right Here",
    genre: "Hip-Hop",
    kind: "indie",
    expect: [45, 80],
    note: "v1 gave 74.",
  },
  {
    id: "match",
    url: "https://youtu.be/om9IOhyFQzU",
    title: "Match",
    genre: "Pop",
    kind: "indie",
    expect: [45, 80],
    note: "paying customer's track; v1 gave 74 (room rated it 4-5/5).",
  },
  {
    id: "riku-strings",
    url: "https://on.soundcloud.com/fzRKnyLfzNcZdm1gfC",
    title: "Piece for String Ensemble",
    artist: "Riku Korkiamäki",
    genre: "Classical",
    kind: "indie",
    expect: [50, 85],
    note: "classical ensemble — the out-of-distribution genre test; v1 gave 74.",
  },
  {
    id: "dynasty-of-fire",
    url: "https://d1gm7q4p33g3v8.cloudfront.net/tracks/3f037d088669142f0fea44a8c2fdebd2.mp3",
    title: "Dynasty of Fire",
    genre: "Rock",
    kind: "indie",
    expect: [40, 88],
    note: "direct mp3 upload; v1 gave 74. v2's listen pass rates it release-grade with receipts (audited 2026-06-11) — band widened; worth an ears-check.",
  },
  {
    id: "hotel-california-cover",
    url: "https://d1gm7q4p33g3v8.cloudfront.net/tracks/760aa70810df7c28d7b56ecb20ddefe0.mp3",
    title: "Hotel California (submission)",
    genre: "Pop",
    kind: "indie",
    expect: [40, 78],
    note: "v1 gave 75.",
  },
  {
    id: "getease-1",
    url: "https://d1gm7q4p33g3v8.cloudfront.net/tracks/904ee58bffa020db1393618fa4e9c80d.mp3",
    title: "(untitled submission A)",
    genre: "Pop",
    kind: "demo",
    expect: [30, 72],
    note: "v1 gave 68.",
  },
  {
    id: "hyperkodi-1",
    url: "https://d1gm7q4p33g3v8.cloudfront.net/tracks/6af07bf40d85667a573716467bde07f6.mp3",
    title: "(untitled submission B)",
    genre: "Hip-Hop",
    kind: "demo",
    expect: [30, 72],
    note: "v1 gave 64.",
  },
  {
    id: "tyler-1",
    url: "https://d1gm7q4p33g3v8.cloudfront.net/tracks/08c568138b9161dcc1e74bd6bdce2a73.mp3",
    title: "(untitled submission C)",
    genre: "Hip-Hop",
    kind: "demo",
    expect: [30, 72],
    note: "v1 gave 65.",
  },

  // ── your own anchors (fill in: tracks where YOU know the truth) ────
  // { id: "my-rough-demo", url: "", title: "", genre: "", kind: "demo", expect: [25, 50], note: "a sketch you know is rough — the floor test." },
  // { id: "my-best-finished", url: "", title: "", genre: "", kind: "indie", expect: [70, 90], note: "a track you know is genuinely finished." },
];
