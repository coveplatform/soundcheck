/**
 * Injects seeded peer reviews onto an existing track for testing.
 *
 * Usage:
 *   tsx prisma/seed-inject-reviews.ts --track <trackId> [--count <n>]
 *
 * --track   Required. The Track.id to inject reviews onto.
 * --count   Optional. Number of reviews to inject (default: all reviewers, up to 10).
 *
 * Safe to run multiple times — reviewers are upserted and duplicate
 * review records are skipped via the unique constraint.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("Database URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// ── CLI args ────────────────────────────────────────────────────
function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const trackId = getArg("--track");
const countArg = getArg("--count");

if (!trackId) {
  console.error("Error: --track <trackId> is required.\n");
  console.error("Usage: tsx prisma/seed-inject-reviews.ts --track <trackId> [--count <n>]");
  process.exit(1);
}

const maxCount = countArg ? parseInt(countArg, 10) : 10;

// ── Seeded peer-reviewer accounts ───────────────────────────────
const SEED_REVIEWERS = [
  { name: "Marcus Chen",      email: "seed-reviewer-1@soundcheck.internal" },
  { name: "Zara Williams",    email: "seed-reviewer-2@soundcheck.internal" },
  { name: "Leo Martinez",     email: "seed-reviewer-3@soundcheck.internal" },
  { name: "Priya Sharma",     email: "seed-reviewer-4@soundcheck.internal" },
  { name: "Jordan Blake",     email: "seed-reviewer-5@soundcheck.internal" },
  { name: "Aaliyah Robinson", email: "seed-reviewer-6@soundcheck.internal" },
  { name: "Kai Nakamura",     email: "seed-reviewer-7@soundcheck.internal" },
  { name: "Sofia Rossi",      email: "seed-reviewer-8@soundcheck.internal" },
  { name: "Ethan Wright",     email: "seed-reviewer-9@soundcheck.internal" },
  { name: "Maya Johnson",     email: "seed-reviewer-10@soundcheck.internal" },
];

// ── Review content pool ──────────────────────────────────────────
type ReviewContent = {
  firstImpression: "STRONG_HOOK" | "DECENT" | "LOST_INTEREST";
  productionScore: number;
  vocalScore: number;
  originalityScore: number;
  wouldListenAgain: boolean;
  wouldAddToPlaylist: boolean;
  wouldShare: boolean;
  wouldFollow: boolean;
  perceivedGenre: string;
  similarArtists: string;
  bestPart: string;
  weakestPart: string;
  additionalNotes: string;
  nextActions: string;
  addressedArtistNote: "YES" | "PARTIALLY" | "NO";
  timestamps: { seconds: number; note: string }[];
};

const REVIEW_POOL: ReviewContent[] = [
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Deep House",
    similarArtists: "Fred Again.., Rufus Du Sol, Lane 8, Jamie xx",
    bestPart:
      "The drop at 1:30 hits with surgical precision — you've nailed that balance between power and restraint that separates good producers from great ones. The layered synths create a cascading waterfall effect that's genuinely hypnotic. Sidechain compression is textbook perfect. The vocal chops around 2:15 add a human element that elevates everything — processed just enough to feel ethereal but still emotionally resonant.",
    weakestPart:
      "If I'm really reaching — the intro could be trimmed by about 8 seconds for streaming optimization. Spotify's skip data shows most listeners decide in the first 30 seconds, so a slightly faster arrival to the melodic hook could improve your stream-to-save ratio. Minor polish point on an otherwise exceptional track.",
    additionalNotes:
      "I've been reviewing tracks for 8 months and this genuinely stands out as one of the best. The mixdown is professional quality — I A/B'd it against Anjunadeep releases and it holds up remarkably well. Clean gain staging, wide stereo image without being washy, real clarity in every frequency band.",
    nextActions:
      "1. Submit to Spotify editorial — 'Chill House' and 'mint' playlist potential\n2. Create a 30-second radio edit for TikTok/Reels\n3. Reach out to Magnetic Magazine and Dancing Astronaut for premiere consideration\n4. Consider Anjunadeep or Lane 8's label for release",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 45, note: "Filter sweep perfectly timed — builds anticipation without overstaying" },
      { seconds: 90, note: "Buildup is masterclass tension. White noise riser is subtle but effective" },
      { seconds: 130, note: "THE DROP. This is the moment the track was building toward and it delivers" },
      { seconds: 175, note: "Breakdown gives the listener room to breathe before the next section" },
      { seconds: 210, note: "Vocal chop layering adds real emotional depth here" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic House / Progressive House",
    similarArtists: "Ben Bohmer, Lane 8, Yotto, Tinlicker, Monolink",
    bestPart:
      "The emotional architecture is remarkable. This is a genuine journey — not just a loop with a drop, but a narrative arc. The pad work is especially impressive; those evolving textures feel almost orchestral. The reverb tails on the lead synth create a sense of infinite space. The way you've handled the stereo field is noteworthy — elements pan and move in a way that rewards headphone listeners without alienating speaker playback.",
    weakestPart:
      "The sub-bass could use a touch more presence in the 40-60Hz range. When I switched to monitors with extended low end, the low frequencies felt slightly thin compared to reference tracks. A subtle boost or additional sub layer could give the drop more physical impact. Also the snare around 2:45 could cut through slightly better — try a small 2-3dB boost at 200Hz and 4kHz.",
    additionalNotes:
      "This has serious Cercle set energy. I can picture this playing at a sunset rooftop or a destination festival. The production quality is there, the musicality is there. The track evolves without ever losing its core identity — sophisticated arrangement work that a lot of producers at this level haven't figured out yet.",
    nextActions:
      "1. Consider mastering with a specialist who's worked with Anjuna or mau5trap releases\n2. Create an extended 7-minute mix for DJ sets\n3. Submit to Spotify 'Atmospheric Calm' and 'Deep Focus' playlists\n4. This works incredibly well in video context — reach out to visual artists for collab",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 30, note: "Pads introduce beautifully — perfect low-pass filter work" },
      { seconds: 75, note: "Drums entry is perfectly weighted, not too sudden" },
      { seconds: 145, note: "This breakdown is emotional. The way elements strip back really works" },
      { seconds: 195, note: "Rebuild with new synth element is a great arrangement choice" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Deep House / Nu Disco",
    similarArtists: "Disclosure, Duke Dumont, Purple Disco Machine, Gorgon City",
    bestPart:
      "The groove on this is absolutely infectious — I was physically moving within the first 16 bars. The kick and bass relationship is expertly crafted; there's a pocket they create together that's tight but never stiff. High-end percussion work adds an organic shuffle that elevates it above generic house. The chord progression has a bittersweet quality that's emotionally engaging without being maudlin.",
    weakestPart:
      "The B-section (around 2:00-2:30) could use more development. It feels like it's setting up for something bigger that doesn't quite arrive. Consider adding a counter-melody or textural element to maintain interest. Some hi-hat patterns become slightly repetitive — try adding subtle variations every 16 bars.",
    additionalNotes:
      "This would destroy in a club setting. The mix translates well to phone speakers while still having low-end power for proper sound systems. That's genuinely hard to achieve. Your understanding of frequency balance across playback systems is clearly developed.",
    nextActions:
      "1. Submit to Defected, Toolroom, or Spinnin' Deep — this fits their sound\n2. Create a DJ promo package and send to house DJs for support\n3. Sync licensing potential for fashion brands or lifestyle content\n4. Set up your Beatport and Traxsource profiles if you haven't already",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 20, note: "Bassline entry sets the tone perfectly" },
      { seconds: 85, note: "This groove pocket is chef's kiss" },
      { seconds: 160, note: "Filter work builds tension effectively" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic Techno / Deep House",
    similarArtists: "Tale Of Us, Anyma, Mind Against, Afterlife artists",
    bestPart:
      "The atmospheric depth is genuinely impressive. You've created a sonic landscape that feels three-dimensional — real sense of space and air that most producers struggle to achieve. The tension you build is relentless in the best way; it never releases too early, showing restraint and maturity. The breakdown at 2:45 is genuinely moving — the way the elements strip away to leave just that haunting pad and vocal texture gave me actual goosebumps.",
    weakestPart:
      "The drop could have slightly more impact — consider layering a subtle impact hit or increasing sidechain depth just a touch to give that moment more 'event' feeling. The track is so well-produced that this is really a taste thing more than a technical issue. The outro could also be shorter for playlist purposes, though for DJ sets the current length is perfect.",
    additionalNotes:
      "This has serious Afterlife/Innervisions energy. The emotional quality combined with production polish puts this in premium territory. I'd be genuinely surprised if this didn't find a home on a notable label. Nothing feels preset-y or generic — you've clearly developed your sonic palette.",
    nextActions:
      "1. Submit to Afterlife, Innervisions, or Diynamic immediately\n2. This needs a music video — the visual potential is enormous\n3. Consider live set potential — this style translates beautifully to live performance\n4. Reach out to Cercle for potential live session consideration",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 60, note: "Atmosphere is so thick here — love the pad layering" },
      { seconds: 120, note: "Tension building beautifully" },
      { seconds: 165, note: "Breakdown starts — and it's emotional" },
      { seconds: 200, note: "Goosebumps. This moment is special" },
      { seconds: 230, note: "Rebuild is perfectly paced" },
    ],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "House / Tech House",
    similarArtists: "Chris Lake, Fisher, Dom Dolla, Sonny Fodera",
    bestPart:
      "The low-end is really well handled. The kick has that modern punch that cuts through without being harsh, and the bassline complements it beautifully. There's a nice groove pocket that develops — you can tell this was made by someone who understands how people move on a dancefloor. The hi-hat programming shows attention to detail with subtle velocity variations that add human feel.",
    weakestPart:
      "The vocal sample feels a bit stock/generic compared to the quality of the production around it. The instrumental work is strong enough that the vocal almost undersells it. Consider finding a more distinctive vocal hook or processing the current one more creatively — granular processing, pitch shifting, or formant manipulation. The mids around 400-800Hz could also use some cleaning up.",
    additionalNotes:
      "Solid club track that would work well in a DJ set. The production fundamentals are clearly there — you understand EQ, compression, and arrangement. With a stronger hook element, this could really stand out. Consider what makes your favorite tracks memorable and apply that thinking to the top-line.",
    nextActions:
      "1. Source a more distinctive vocal or create a custom one\n2. Clean up the 400-800Hz range\n3. Consider sending to smaller tech house labels to build catalog\n4. This would work well for DJ promo — functional and well-produced",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 45, note: "Bass drops nicely here" },
      { seconds: 90, note: "Vocal enters — consider reworking this element" },
      { seconds: 150, note: "Good filter work on this breakdown" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 5,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Organic House / Melodic House",
    similarArtists: "Ben Bohmer, Monolink, Jan Blomqvist, Rodriguez Jr.",
    bestPart:
      "The organic textures woven throughout are beautiful. There's a warmth that a lot of electronic music lacks — you can hear acoustic elements blended seamlessly with synthesized ones. The result feels alive and breathing rather than sterile. The vocal work is particularly stunning — processing maintains human emotion while adding just enough electronic character. This is headphones-at-midnight music in the best possible way.",
    weakestPart:
      "The low-end could have a bit more weight. The organic, airy quality is beautiful, but when the drop hits, I want to feel it more physically. Consider layering a subtle sub-bass element or adding gentle saturation to give it more presence in club contexts. The kick could also use a touch more click in the 2-4kHz range for definition.",
    additionalNotes:
      "This is genuinely artistic work. It's not just functional dance music — it's expressive, emotional, and sophisticated. The fact that it's also danceable is a bonus. You're operating in a space that very few producers manage to inhabit successfully.",
    nextActions:
      "1. Target All Day I Dream, Exploited Ghetto, or similar organic house labels\n2. Create a live performance version — the organic elements would translate beautifully\n3. Sync licensing opportunities in film/TV — serious mood potential\n4. Document your creative process for content",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 40, note: "Organic textures here are gorgeous" },
      { seconds: 100, note: "Love how the vocal sits in the mix" },
      { seconds: 155, note: "Dynamic shift here is really effective" },
      { seconds: 210, note: "Beautiful layering in this section" },
    ],
  },
  {
    firstImpression: "DECENT",
    productionScore: 3,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Deep House",
    similarArtists: "Eli & Fur, CamelPhat, Cristoph",
    bestPart:
      "The mood and vibe you're going for is clear and the musical ideas are there. The chord progression has that emotional quality that connects, and your arrangement sense shows understanding of how to build and release tension. The atmospheric pads create a nice sense of space and the overall direction is solid.",
    weakestPart:
      "The mix needs work. There's muddiness in the low-mids (200-500Hz) clouding overall clarity. The bass and kick are fighting for space rather than complementing each other. High-end feels slightly harsh on the synth leads around 3-5kHz. Overall loudness is lower than commercial releases, suggesting the master needs attention. These are fixable, but they're holding back what could be a really solid track.",
    additionalNotes:
      "The creative and musical elements are there — what you need is to level up the technical execution. Consider investing in room treatment if you haven't, or getting a second pair of ears from a mixing engineer. Compare your mix to reference tracks at every stage of production.",
    nextActions:
      "1. Book a mixing session with a professional or experienced friend\n2. Address the frequency balance issues before further distribution\n3. Invest in reference tracks and A/B comparison tools\n4. Keep producing — the musical instincts are solid, just polish the technical side",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 60, note: "Mud building up here — check 200-500Hz range" },
      { seconds: 120, note: "Kick and bass competing in this section" },
      { seconds: 180, note: "High-end gets harsh here on the lead" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 4,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Progressive House",
    similarArtists: "Above & Beyond, Arty, Spencer Brown, Andrew Bayer",
    bestPart:
      "The arrangement is masterclass level. Every element knows exactly when to enter and exit. The way you build tension through the verse, the perfectly-timed breakdown, the anthemic drop — it all flows with a sense of inevitability. The lead synth has a soaring quality that's emotional without being cheesy. The layers stacking in the drop create a wall of sound that's powerful but still clear and defined.",
    weakestPart:
      "I genuinely had to listen three times to find something constructive. If I'm being extremely critical, the hi-hats could have slightly more high-end sparkle (shelf boost above 10kHz), and the transition at 3:15 could be smoothed with a longer reverb tail on the outgoing element. Truly minor points on an excellent production.",
    additionalNotes:
      "This is ready for release. I don't say that lightly — I've reviewed hundreds of tracks. This has the polish, emotional impact, and technical quality to stand alongside major label releases. You should be actively shopping this to labels and playlist curators.",
    nextActions:
      "1. Submit to Anjunabeats, Enhanced, or Armada immediately\n2. Get this on Spotify playlists — it has editorial potential\n3. Send to progressive house blogs for premiere coverage\n4. Connect with A&R at relevant labels on socials",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 30, note: "Intro sets the tone perfectly" },
      { seconds: 90, note: "Tension building here is immaculate" },
      { seconds: 145, note: "Breakdown. Chills." },
      { seconds: 180, note: "Rebuild element by element — textbook execution" },
      { seconds: 220, note: "The payoff is absolutely worth it" },
    ],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 3,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "House",
    similarArtists: "MK, Gorgon City, Sonny Fodera, Endor",
    bestPart:
      "This is catchy and accessible — you've clearly got an ear for what works commercially. The hook sticks in your head after one listen, which is genuinely difficult to achieve. The production is clean and translates well across different systems. The chord progression has that feel-good quality that radio-friendly house needs.",
    weakestPart:
      "While well-executed, it feels sonically safe. It doesn't take risks or offer anything that distinguishes it from other tracks in this style. The sound selection is fairly predictable. To stand out in a crowded market, you need something that makes listeners stop and go 'what was that?' Consider pushing your sound design in unexpected directions.",
    additionalNotes:
      "You've clearly studied what works in commercial house music and can execute at that level. The next step is finding your unique voice within that framework. What can you do that nobody else does? The technical foundation is there — now build something memorable on top of it.",
    nextActions:
      "1. Experiment with more adventurous sound design on your next track\n2. Study artists who balance commercial appeal with distinctiveness\n3. This track as-is could work for sync licensing\n4. Consider collaborating with vocalists for original top-lines",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 60, note: "Hook is catchy here" },
      { seconds: 120, note: "This section is solid but predictable" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 5,
    vocalScore: 5,
    originalityScore: 5,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic House / Deep House",
    similarArtists: "RÜFÜS DU SOL, Ben Bohmer, Lane 8, Elderbrook",
    bestPart:
      "This is genuinely special. I've listened to this four times and keep discovering new details. The production is pristine — every element sits perfectly in the mix, the master is loud without being crushed, the stereo field is immersive. But beyond the technical excellence, there's real artistry here. The breakdown at 2:30 is legitimately moving. That moment where everything strips away and you're left with just that pad and vocal texture — I felt that.",
    weakestPart:
      "If I absolutely have to find something... the snare could cut through slightly more during the densest sections. A small 2dB boost around 180Hz for body and 4kHz for crack would help it punch through without changing its character. But honestly, this is really reaching. The track is excellent as-is.",
    additionalNotes:
      "You're onto something here. This level of quality will get noticed. The combination of technical polish and emotional resonance is rare, and labels and playlist curators recognize it when they hear it. Don't rush the release — this deserves proper marketing and rollout.",
    nextActions:
      "1. Plan a proper release campaign — this deserves visibility\n2. Send to premium labels — Anjuna, mau5trap, Exploited Ghetto\n3. Invest in professional press photos and branding\n4. Create EPK for label submissions",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 50, note: "Opening sets expectations high — and they're met" },
      { seconds: 105, note: "Love how this section unfolds" },
      { seconds: 150, note: "The breakdown — this is where it gets emotional" },
      { seconds: 195, note: "Rebuild is patient and rewarding" },
      { seconds: 240, note: "Ending is tasteful — leaves you wanting more" },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\nInjecting peer reviews onto track: ${trackId}\n`);

  // Verify track exists
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { ArtistProfile: true },
  });

  if (!track) {
    console.error(`Track not found: ${trackId}`);
    process.exit(1);
  }

  console.log(`Track:   "${track.title}"`);
  console.log(`Artist:  ${track.ArtistProfile.artistName}`);
  console.log(`Status:  ${track.status}`);
  console.log(`Reviews: ${track.reviewsCompleted}/${track.reviewsRequested} completed\n`);

  const passwordHash = await hash("SeedReviewer123!", 10);

  // Get genres to connect to reviewer ArtistProfiles
  const genres = await prisma.genre.findMany({ take: 5 });

  const reviewersToCreate = SEED_REVIEWERS.slice(0, maxCount);
  let injected = 0;
  let skipped = 0;

  for (let i = 0; i < reviewersToCreate.length; i++) {
    const reviewer = reviewersToCreate[i];
    const content = REVIEW_POOL[i % REVIEW_POOL.length];

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: reviewer.email },
      update: { name: reviewer.name },
      create: {
        email: reviewer.email,
        password: passwordHash,
        name: reviewer.name,
        isArtist: true,
        isReviewer: true,
        emailVerified: new Date(),
      },
    });

    // Upsert ArtistProfile (peer reviewers use ArtistProfile)
    const artistProfile = await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        artistName: reviewer.name,
        completedOnboarding: true,
        reviewCredits: 5,
        totalPeerReviews: Math.floor(Math.random() * 30) + 5,
        peerReviewRating: parseFloat((4.0 + Math.random() * 0.8).toFixed(2)),
        genres: {
          connect: genres.slice(0, 3).map((g) => ({ id: g.id })),
        },
      },
    });

    // Check if review already exists for this reviewer on this track
    const existing = await prisma.review.findFirst({
      where: { trackId: trackId!, peerReviewerArtistId: artistProfile.id },
    });

    if (existing) {
      console.log(`  Skipped  ${reviewer.name} — review already exists`);
      skipped++;
      continue;
    }

    // Spread review dates over the past few days
    const daysAgo = Math.floor((i / reviewersToCreate.length) * 4);
    const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 6 * 60 * 60 * 1000);

    await prisma.review.create({
      data: {
        trackId: trackId!,
        peerReviewerArtistId: artistProfile.id,
        reviewerId: null,
        isPeerReview: true,
        status: "COMPLETED",
        listenDuration: 185 + Math.floor(Math.random() * 120),
        firstImpression: content.firstImpression,
        productionScore: content.productionScore,
        vocalScore: content.vocalScore,
        originalityScore: content.originalityScore,
        wouldListenAgain: content.wouldListenAgain,
        wouldAddToPlaylist: content.wouldAddToPlaylist,
        wouldShare: content.wouldShare,
        wouldFollow: content.wouldFollow,
        perceivedGenre: content.perceivedGenre,
        similarArtists: content.similarArtists,
        bestPart: content.bestPart,
        weakestPart: content.weakestPart,
        additionalNotes: content.additionalNotes,
        nextActions: content.nextActions,
        addressedArtistNote: content.addressedArtistNote,
        timestamps: content.timestamps,
        paidAmount: 0,
        artistRating: content.productionScore >= 4 ? (Math.random() > 0.3 ? 5 : 4) : null,
        isGem: i === 0 || i === 3,
        countsTowardAnalytics: true,
        countsTowardCompletion: true,
        shareId: `seed${i + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      },
    });

    console.log(`  Injected review ${injected + 1} from ${reviewer.name}`);
    injected++;
  }

  // Update track counters
  const newCompleted = track.reviewsCompleted + injected;
  const newStatus =
    newCompleted >= track.reviewsRequested && track.reviewsRequested > 0
      ? "COMPLETED"
      : track.status;

  await prisma.track.update({
    where: { id: trackId! },
    data: {
      reviewsCompleted: newCompleted,
      status: newStatus,
      completedAt: newStatus === "COMPLETED" ? new Date() : track.completedAt,
    },
  });

  console.log(`\n========================================`);
  console.log(`Injected:  ${injected} review(s)`);
  console.log(`Skipped:   ${skipped} (already existed)`);
  console.log(`Progress:  ${newCompleted}/${track.reviewsRequested}`);
  console.log(`Status:    ${newStatus}`);
  console.log(`========================================\n`);
  console.log(`Log in as the artist to see the reviews in the dashboard.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
