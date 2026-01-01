// PRODUCTION DATABASE - NO dotenv
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to PRODUCTION database...\n");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: PROD_DATABASE_URL }),
});

const reviewerNames = [
  "Marcus Chen", "Zara Williams", "Leo Martinez", "Priya Sharma", "Jordan Blake",
  "Aaliyah Robinson", "Kai Nakamura", "Sofia Rossi", "Ethan Wright", "Maya Johnson",
  "Dylan Cooper", "Ava Patel", "Noah Kim", "Isla Thompson", "Lucas Brown",
];

const reviewData = [
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
    bestPart: "Absolutely floored by this. The drop at 1:30 hits with surgical precision - you've nailed that delicate balance between power and restraint that separates good producers from great ones. The layered synths create this cascading waterfall effect that's genuinely hypnotic. The sidechain compression is textbook perfect, giving the track that classic house pump without ever feeling overdone. The way the bassline weaves between the kicks shows real understanding of frequency management. The vocal chops around 2:15 add this human element that elevates the whole production - they're processed just enough to feel ethereal but still emotionally resonant.",
    weakestPart: "If I'm being really picky - the intro could potentially be trimmed by 8-10 seconds for streaming optimization. Spotify's skip data shows most listeners make decisions in the first 30 seconds.",
    additionalNotes: "I've been reviewing tracks for 8 months and this genuinely stands out as one of the best. The mixdown is professional quality - I A/B'd this against Anjunadeep releases and it holds up remarkably well.",
    nextActions: "1. Submit to Spotify editorial playlists immediately\n2. Create a 30-second hook for TikTok/Reels\n3. Reach out to Magnetic Magazine for premiere\n4. Consider sending to Anjunadeep or Lane 8's label",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 45, note: "Filter sweep perfectly timed - builds anticipation" },
      { seconds: 90, note: "Masterclass buildup. The white noise riser is subtle but effective" },
      { seconds: 130, note: "THE DROP. This is it. Delivers completely" },
      { seconds: 175, note: "Breakdown gives listener room to breathe" },
      { seconds: 210, note: "Vocal chop layering adds emotional depth" },
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
    bestPart: "The emotional architecture of this track is remarkable. You've created a genuine journey - not just a loop with a drop, but a narrative arc. The pad work is especially impressive; those evolving textures feel almost orchestral. The reverb tails on the lead synth create this sense of infinite space. The way you've handled the stereo field is noteworthy - elements pan and move in a way that rewards headphone listeners.",
    weakestPart: "The sub-bass could use a touch more presence in the 40-60Hz range. A subtle boost could give the drop more physical impact.",
    additionalNotes: "This has serious Cercle set energy. I can picture this playing at a sunset rooftop show. The production quality is there. What's particularly impressive is how the track evolves without losing its core identity.",
    nextActions: "1. Consider mastering with a specialized melodic house engineer\n2. Create an extended 7-minute mix for DJ sets\n3. Submit to Spotify's 'Atmospheric Calm' playlist\n4. Reach out to visual artists for a music video",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 30, note: "Pads introduce beautifully - perfect low-pass filter work" },
      { seconds: 75, note: "Drums entry is perfectly weighted" },
      { seconds: 145, note: "This breakdown is emotional" },
      { seconds: 195, note: "The rebuild with new synth element - great arrangement" },
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
    bestPart: "The groove is absolutely infectious. I found myself physically moving within the first 16 bars. The kick and bass relationship is expertly crafted - there's this pocket they create together that's tight but never stiff. The chord progression has this bittersweet quality that's emotionally engaging without being maudlin.",
    weakestPart: "The B-section around 2:00-2:30 could use more development. Consider adding a counter-melody or textural element to maintain interest.",
    additionalNotes: "This would absolutely destroy in a club setting. The mix translates well to phone speakers while still having low-end power for proper sound systems. That's genuinely hard to achieve.",
    nextActions: "1. Submit to Defected, Toolroom, or Spinnin' Deep\n2. Create a DJ promo package\n3. This has sync licensing potential for fashion brands",
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
    bestPart: "The atmospheric depth is genuinely impressive. You've created a sonic landscape that feels three-dimensional. The reverb and delay work is sophisticated. The breakdown at 2:45 is genuinely moving - the way elements strip away to leave just that haunting pad gave me actual goosebumps. That's rare.",
    weakestPart: "The drop could have slightly more impact - consider layering a subtle impact hit or increasing the sidechain depth just slightly.",
    additionalNotes: "This has serious Afterlife/Innervisions energy. The emotional quality combined with the production polish puts this in premium territory. I'd be genuinely surprised if this didn't find a home on a notable label.",
    nextActions: "1. Submit to Afterlife, Innervisions, or Diynamic immediately\n2. This needs a music video\n3. Consider live set potential\n4. Reach out to Cercle",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 60, note: "Atmosphere is so thick - love the pad layering" },
      { seconds: 120, note: "Tension building beautifully" },
      { seconds: 165, note: "Breakdown starts - emotional" },
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
    bestPart: "The low-end is really well handled. The kick has that modern punch that cuts through without being harsh, and the bassline complements it beautifully. There's a nice groove pocket that develops - you can tell this was made by someone who understands how people move on a dancefloor.",
    weakestPart: "The vocal sample feels a bit stock compared to the quality of the production around it. Consider finding a more distinctive vocal hook or processing the current one more creatively.",
    additionalNotes: "This is a solid club track that would work well in a DJ set. The production fundamentals are clearly there. With a stronger hook element, this could really stand out.",
    nextActions: "1. Source a more distinctive vocal\n2. Clean up the 400-800Hz range\n3. Consider sending to smaller tech house labels",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 45, note: "Bass drops nicely here" },
      { seconds: 90, note: "Vocal enters - consider reworking" },
      { seconds: 150, note: "Good filter work on breakdown" },
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
    bestPart: "The organic textures woven throughout are beautiful. There's a warmth here that a lot of electronic music lacks. The vocal work is particularly stunning - the processing maintains the human emotion while adding just enough electronic character. This is headphones-at-midnight music in the best possible way.",
    weakestPart: "The low-end could have a bit more weight. The organic, airy quality is beautiful, but when the drop hits, I want to feel it more physically.",
    additionalNotes: "This is genuinely artistic work. It's not just functional dance music - it's expressive, emotional, and sophisticated. You're operating in a space that very few producers manage to inhabit successfully.",
    nextActions: "1. Target All Day I Dream or Exploited Ghetto\n2. Create a live performance version\n3. Sync licensing opportunities in film/TV",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 40, note: "Organic textures are gorgeous" },
      { seconds: 100, note: "Love how the vocal sits in the mix" },
      { seconds: 155, note: "Dynamic shift is really effective" },
      { seconds: 210, note: "Beautiful layering" },
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
    bestPart: "The mood and vibe you're going for is clear and the musical ideas are there. The chord progression has that emotional quality that connects with listeners. You clearly have a vision for the sound you want to achieve.",
    weakestPart: "The mix needs significant work. There's muddiness in the low-mids (200-500Hz) that's clouding the overall clarity. The bass and kick are fighting for space rather than complementing each other.",
    additionalNotes: "The creative and musical elements are there - what you need is to level up the technical execution. Consider investing in room treatment or getting a second pair of ears from a mixing engineer.",
    nextActions: "1. Book a mixing session with a professional\n2. Address frequency balance issues\n3. Invest in reference tracks and A/B comparison tools",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 60, note: "Mud building up here - check 200-500Hz" },
      { seconds: 120, note: "Kick and bass competing" },
      { seconds: 180, note: "High-end gets harsh on the lead" },
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
    bestPart: "The arrangement is masterclass level. Every single element knows exactly when to enter and exit. The way you build tension through the verse sections, the perfectly-timed breakdown, the anthemic drop - it all flows with a sense of inevitability that the best progressive house has. This is what polished, professional production sounds like.",
    weakestPart: "I genuinely had to listen three times to find something. If I'm being extremely critical, the hi-hats could have slightly more high-end sparkle above 10kHz.",
    additionalNotes: "This is ready for release. I don't say that lightly - I've reviewed hundreds of tracks. This has the polish, the emotional impact, and the technical quality to stand alongside releases on major labels.",
    nextActions: "1. Submit to Anjunabeats, Enhanced, or Armada immediately\n2. Get this on Spotify playlists - it has editorial potential\n3. Send to progressive house blogs for premiere",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 30, note: "Intro sets the tone perfectly" },
      { seconds: 90, note: "Tension building here is immaculate" },
      { seconds: 145, note: "Breakdown. Chills. This is the moment" },
      { seconds: 180, note: "The rebuild - textbook execution" },
      { seconds: 220, note: "Payoff is absolutely worth it" },
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
    bestPart: "This is catchy and accessible - you've clearly got an ear for what works commercially. The hook sticks in your head after one listen. The production is clean and the mix translates well across different systems.",
    weakestPart: "While well-executed, it feels sonically safe. It doesn't take any risks. To stand out in a crowded market, you need something that makes listeners stop and go 'what was that?'",
    additionalNotes: "You've clearly studied what works in commercial house music, and you can execute at that level. The next step is finding your unique voice within that framework.",
    nextActions: "1. Experiment with more adventurous sound design\n2. Study artists who balance commercial appeal with distinctiveness\n3. This could work for sync licensing",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 60, note: "Hook is catchy" },
      { seconds: 120, note: "Solid but predictable" },
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
    perceivedGenre: "Deep House / Indie Dance",
    similarArtists: "Ben Bohmer, Monolink, RÜFÜS DU SOL, Bob Moses",
    bestPart: "The emotional core of this track is powerful. You can feel intention behind every sound choice - nothing is arbitrary. The progression from intimate opening to expansive middle to reflective outro tells a complete story. The vocal has genuine emotional weight - it's not just a hook, it's an expression.",
    weakestPart: "The outro runs slightly long for streaming optimization. Consider creating a 'single version' that trims it for playlist purposes.",
    additionalNotes: "You're operating at an artistic level that goes beyond just making dance music. This is expressive, personal, and genuine. Keep developing this voice - it's distinctive.",
    nextActions: "1. Create a music video - this track demands visuals\n2. Submit to Cercle for potential live performance\n3. This could anchor an EP",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 45, note: "Vulnerability in the vocal is striking" },
      { seconds: 100, note: "This is where it opens up - beautiful" },
      { seconds: 170, note: "Peak emotion. Lands perfectly" },
      { seconds: 220, note: "Gentle comedown is well-handled" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 4,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Melodic House",
    similarArtists: "Yotto, Jeremy Olander, Dosem, Guy J",
    bestPart: "The sense of space in this mix is really impressive. You've created a soundscape where everything has room to breathe while still maintaining energy. The stereo imaging is well-executed - elements feel like they exist in a real space.",
    weakestPart: "The drop could hit a bit harder. Consider layering some parallel compression, adding a subtle impact hit, or increasing the sidechain depth.",
    additionalNotes: "Technically proficient with good musicality - that's a combination that serves artists well long-term. You're clearly developing your craft with intention.",
    nextActions: "1. Experiment with parallel compression on drops\n2. Consider submitting to Anjunaprogressive\n3. Build DJ set promo package",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 80, note: "Mix space opens up nicely" },
      { seconds: 135, note: "Good build tension" },
      { seconds: 160, note: "Drop lands but could hit harder" },
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
    perceivedGenre: "Future House / Deep House",
    similarArtists: "Fred Again.., Skrillex (recent stuff), Four Tet, Caribou",
    bestPart: "This feels fresh and modern in a way that a lot of submissions don't. You're clearly paying attention to where electronic music is going, not where it's been. The sound design choices are creative - things sound like you made them rather than pulled from presets. There's a fearlessness here that serves you well.",
    weakestPart: "During the busiest sections, some frequencies clash slightly - particularly in the upper mids around 2-4kHz. Some surgical EQ work would increase clarity.",
    additionalNotes: "You have a distinctive voice developing. Don't lose it by chasing what's already popular. The best artists define genres rather than follow them.",
    nextActions: "1. Address frequency clashing with surgical EQ\n2. Build your brand around this unique sound\n3. Document your process - people are curious",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 55, note: "Sound design here is really creative" },
      { seconds: 90, note: "Love this rhythmic complexity" },
      { seconds: 150, note: "Frequencies clashing slightly - needs EQ" },
      { seconds: 200, note: "This section is genuinely innovative" },
    ],
  },
  {
    firstImpression: "DECENT",
    productionScore: 4,
    vocalScore: 3,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: false,
    wouldShare: false,
    wouldFollow: true,
    perceivedGenre: "Tech House",
    similarArtists: "Solardo, CamelPhat, Eli Brown, Patrick Topping",
    bestPart: "The energy and drive are there. This is functional tech house that does what it needs to do - it grooves, it has movement, the rhythm section is tight. The kick is well-designed with good punch and clean sub extension.",
    weakestPart: "The high frequencies feel harsh at certain points, particularly on the hi-hats. This could cause listener fatigue. Spend time taming those peaks above 8kHz.",
    additionalNotes: "The bones are solid. This is clearly made by someone who understands house music. The technical polish and a stronger hook would elevate this from 'works in a set' to 'gets dropped at the peak moment.'",
    nextActions: "1. Address harsh high frequencies\n2. Develop a more distinctive hook\n3. Reference against pro releases",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 45, note: "Groove is working well" },
      { seconds: 100, note: "Hi-hats getting harsh - check 8kHz+" },
      { seconds: 160, note: "Needs stronger hook to land" },
    ],
  },
  {
    firstImpression: "STRONG_HOOK",
    productionScore: 4,
    vocalScore: 5,
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Progressive House",
    similarArtists: "Lane 8, RÜFÜS DU SOL, Above & Beyond",
    bestPart: "The journey this track takes you on is genuinely beautiful. It's sunset driving music, it's headphones-on-the-train music. The emotional progression feels natural and earned. The melody is memorable without being obvious, sophisticated without being inaccessible.",
    weakestPart: "Some sections could benefit from more dynamic variation. The difference between quietest and loudest moments could be greater. Don't be afraid to pull things back further.",
    additionalNotes: "Going into my driving playlist immediately. This is exactly the kind of track I look for - emotional, well-produced, and transportive. You've made something that will soundtrack moments in people's lives.",
    nextActions: "1. Create an extended mix for DJ sets\n2. Submit to mood-based playlists\n3. This would work well with nature/travel visuals",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 35, note: "Journey begins - nice intro" },
      { seconds: 95, note: "Emotional core emerging" },
      { seconds: 165, note: "Peak moment delivers" },
      { seconds: 210, note: "Comedown is as good as buildup" },
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
    bestPart: "This is genuinely special. I've listened four times and keep discovering new details. The production is pristine - every element sits perfectly, the master is loud without being crushed. But beyond technical excellence, there's real artistry here. The breakdown at 2:30 is legitimately moving. That moment where everything strips away - I felt that. This is what we're all trying to make.",
    weakestPart: "If I absolutely have to find something... the snare could cut through slightly more during the densest sections. A small 2dB boost around 180Hz and 4kHz would help. But honestly, this is reaching.",
    additionalNotes: "You're onto something here. This level of quality will get noticed. The combination of technical polish and emotional resonance is rare. Don't rush the release - this deserves proper marketing.",
    nextActions: "1. Plan a proper release campaign\n2. Send to premium labels - Anjuna, mau5trap, Exploited Ghetto\n3. Invest in professional press photos and branding\n4. Create EPK for label submissions",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 50, note: "Opening sets expectations high - and they're met" },
      { seconds: 105, note: "Love how this section unfolds" },
      { seconds: 150, note: "The breakdown - this is where it gets emotional" },
      { seconds: 195, note: "Rebuild is patient and rewarding" },
      { seconds: 240, note: "Ending is tasteful - leaves you wanting more" },
    ],
  },
];

async function main() {
  console.log("Setting up demo data for TikTok...\n");

  // Get genres
  const houseGenre = await prisma.genre.findUnique({ where: { slug: "house" } });
  const deepHouseGenre = await prisma.genre.findUnique({ where: { slug: "deep-house" } });

  if (!houseGenre || !deepHouseGenre) {
    console.log("Genres not found. Run prisma db seed first.");
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync("demo123456", 10);

  // Create/update demo artist
  let demoUser = await prisma.user.findUnique({ where: { email: "demo-artist@soundcheck.com" } });

  if (demoUser) {
    await prisma.user.update({
      where: { email: "demo-artist@soundcheck.com" },
      data: { password: passwordHash, emailVerified: new Date(), isArtist: true }
    });
    console.log("Updated demo-artist@soundcheck.com");
  } else {
    demoUser = await prisma.user.create({
      data: {
        email: "demo-artist@soundcheck.com",
        password: passwordHash,
        name: "Aurora Nights",
        isArtist: true,
        emailVerified: new Date(),
      }
    });
    console.log("Created demo-artist@soundcheck.com");
  }

  // Create/get artist profile
  let artistProfile = await prisma.artistProfile.findUnique({ where: { userId: demoUser.id } });

  if (!artistProfile) {
    artistProfile = await prisma.artistProfile.create({
      data: {
        userId: demoUser.id,
        artistName: "Aurora Nights",
        totalTracks: 1,
        totalSpent: 2999,
        freeReviewCredits: 0,
        genres: { connect: [{ id: houseGenre.id }, { id: deepHouseGenre.id }] },
      }
    });
    console.log("Created artist profile");
  }

  // Clean up existing demo track
  const existingTrack = await prisma.track.findFirst({
    where: { artistId: artistProfile.id, title: "Midnight Echoes" }
  });

  if (existingTrack) {
    await prisma.review.deleteMany({ where: { trackId: existingTrack.id } });
    await prisma.payment.deleteMany({ where: { trackId: existingTrack.id } });
    await prisma.track.delete({ where: { id: existingTrack.id } });
    console.log("Cleaned up old demo track");
  }

  // Create demo track
  const track = await prisma.track.create({
    data: {
      artistId: artistProfile.id,
      sourceUrl: "https://soundcloud.com/user-587506684/sick-track",
      sourceType: "SOUNDCLOUD",
      title: "Midnight Echoes",
      duration: 285,
      bpm: 124,
      feedbackFocus: "Looking for honest feedback on the mix and overall vibe. Is the drop impactful enough?",
      status: "COMPLETED",
      packageType: "STANDARD",
      reviewsRequested: 15,
      reviewsCompleted: 15,
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      genres: { connect: [{ id: houseGenre.id }, { id: deepHouseGenre.id }] },
    }
  });
  console.log("Created track: Midnight Echoes");

  // Create payment
  await prisma.payment.create({
    data: {
      trackId: track.id,
      amount: 2999,
      stripeSessionId: `demo_session_${Date.now()}`,
      stripePaymentId: `demo_payment_${Date.now()}`,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    }
  });

  // Create reviewers and reviews
  console.log("\nCreating 15 reviews...");

  for (let i = 0; i < 15; i++) {
    const reviewerEmail = `reviewer-demo-${i + 1}@soundcheck.com`;

    let reviewerUser = await prisma.user.findUnique({ where: { email: reviewerEmail } });

    if (!reviewerUser) {
      reviewerUser = await prisma.user.create({
        data: {
          email: reviewerEmail,
          password: passwordHash,
          name: reviewerNames[i],
          isReviewer: true,
          emailVerified: new Date(),
        }
      });
    }

    let reviewerProfile = await prisma.reviewerProfile.findUnique({ where: { userId: reviewerUser.id } });

    if (!reviewerProfile) {
      reviewerProfile = await prisma.reviewerProfile.create({
        data: {
          userId: reviewerUser.id,
          tier: i < 5 ? "PRO" : "NORMAL",
          totalReviews: Math.floor(Math.random() * 100) + 30,
          averageRating: 4.2 + Math.random() * 0.6,
          completedOnboarding: true,
          onboardingQuizPassed: true,
          genres: { connect: [{ id: houseGenre.id }] },
        }
      });
    }

    const daysAgo = Math.floor((i / 15) * 5);
    const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const data = reviewData[i];

    await prisma.review.create({
      data: {
        trackId: track.id,
        reviewerId: reviewerProfile.id,
        status: "COMPLETED",
        listenDuration: 200 + Math.floor(Math.random() * 85),
        firstImpression: data.firstImpression as any,
        productionScore: data.productionScore,
        vocalScore: data.vocalScore,
        originalityScore: data.originalityScore,
        wouldListenAgain: data.wouldListenAgain,
        wouldAddToPlaylist: data.wouldAddToPlaylist,
        wouldShare: data.wouldShare,
        wouldFollow: data.wouldFollow,
        perceivedGenre: data.perceivedGenre,
        similarArtists: data.similarArtists,
        bestPart: data.bestPart,
        weakestPart: data.weakestPart,
        additionalNotes: data.additionalNotes,
        nextActions: data.nextActions,
        addressedArtistNote: data.addressedArtistNote as any,
        timestamps: data.timestamps,
        paidAmount: 200,
        artistRating: data.productionScore >= 4 ? (Math.random() > 0.3 ? 5 : 4) : null,
        isGem: i === 0 || i === 3 || i === 7 || i === 14,
        shareId: `demo${i + 1}${Date.now().toString(36)}`,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      }
    });

    console.log(`  Review ${i + 1}/15 from ${reviewerNames[i]}`);
  }

  // Clear rate limits
  await prisma.rateLimit.deleteMany({});
  console.log("\nCleared rate limits");

  console.log("\n========================================");
  console.log("PRODUCTION DEMO DATA READY!");
  console.log("========================================");
  console.log("\nLogin: demo-artist@soundcheck.com");
  console.log("Password: demo123456");
  console.log("\nTrack: Midnight Echoes (15 detailed reviews)");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
