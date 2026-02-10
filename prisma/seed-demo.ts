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

// Demo reviewer names for realistic reviews
const reviewerNames = [
  "Marcus Chen",
  "Zara Williams",
  "Leo Martinez",
  "Priya Sharma",
  "Jordan Blake",
  "Aaliyah Robinson",
  "Kai Nakamura",
  "Sofia Rossi",
  "Ethan Wright",
  "Maya Johnson",
  "Dylan Cooper",
  "Ava Patel",
  "Noah Kim",
  "Isla Thompson",
  "Lucas Brown",
];

// Highly detailed, professional review data
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
    bestPart: "Absolutely floored by this. The drop at 1:30 hits with surgical precision - you've nailed that delicate balance between power and restraint that separates good producers from great ones. The layered synths create this cascading waterfall effect that's genuinely hypnotic. The sidechain compression is textbook perfect, giving the track that classic house pump without ever feeling overdone. The way the bassline weaves between the kicks shows real understanding of frequency management. The vocal chops around 2:15 add this human element that elevates the whole production - they're processed just enough to feel ethereal but still emotionally resonant. This is the kind of track that would stop me mid-scroll on Spotify.",
    weakestPart: "If I'm being really picky here - and honestly I'm reaching - the intro could potentially be trimmed by about 8-10 seconds for streaming optimization. Spotify's skip data shows most listeners make decisions in the first 30 seconds, so a slightly faster arrival to the first melodic hook could improve your stream-to-save ratio. But this is a minor polish point on an otherwise exceptional track.",
    additionalNotes: "I've been reviewing tracks on this platform for 8 months now and this genuinely stands out as one of the best I've heard. The mixdown is professional quality - I A/B'd this against some Anjunadeep releases and it holds up remarkably well. Your gain staging is clean, your stereo image is wide without being washy, and there's real clarity in every frequency band. The master has good loudness without sacrificing dynamics. You clearly know what you're doing.",
    nextActions: "1. Submit to Spotify editorial playlists immediately - this has 'Chill House' and 'mint' playlist potential\n2. Create a 30-second radio edit hook for TikTok/Reels promotion\n3. Reach out to Magnetic Magazine, Dancing Astronaut, and EDM.com for premiere consideration\n4. Consider sending to Anjunadeep, This Never Happened, or Lane 8's label for release consideration\n5. Set up a DistroKid or similar for release within 4-6 weeks to capitalize on momentum",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 45, note: "The filter sweep here is perfectly timed - builds anticipation without overstaying" },
      { seconds: 90, note: "This buildup is masterclass level tension. The white noise riser is subtle but effective" },
      { seconds: 130, note: "THE DROP. This is it. The moment the track was building toward and it delivers completely" },
      { seconds: 175, note: "Love the breakdown here - gives the listener room to breathe before the next section" },
      { seconds: 210, note: "The vocal chop layering here adds so much emotional depth" },
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
    bestPart: "The emotional architecture of this track is remarkable. You've created a genuine journey here - not just a loop with a drop, but a narrative arc that takes the listener somewhere. The pad work is especially impressive; those evolving textures feel almost orchestral in their complexity. The reverb tails on the lead synth create this sense of infinite space that's become a signature of the Anjuna/melodic house sound, but you've added your own flavor with those rhythmic elements in the mids. The way you've handled the stereo field is noteworthy - elements pan and move in a way that rewards headphone listeners without alienating speaker playback. That's a tricky balance and you've nailed it.",
    weakestPart: "The sub-bass could use a touch more presence in the 40-60Hz range. When I switched to monitors with extended low end, I noticed the low frequencies felt slightly thin compared to reference tracks in this genre. A subtle boost or layering an additional sub element could give the drop more physical impact. Also, the snare at around 2:45 could cut through the mix slightly better - try a small 2-3dB boost around 200Hz and 4kHz.",
    additionalNotes: "This has serious Cercle set energy. I can picture this playing at a sunset rooftop show or one of those destination festival moments. The production quality is there. The musicality is there. What's particularly impressive is how the track evolves without ever losing its core identity - each section introduces new elements while maintaining the emotional thread. That's sophisticated arrangement work that a lot of producers at this level haven't figured out yet.",
    nextActions: "1. Consider mastering with a specialized melodic house engineer - someone who's worked with Anjuna or mau5trap releases\n2. Create an extended 7-minute mix for DJ sets - this track has legs and could breathe even more\n3. Submit to Spotify's 'Atmospheric Calm' and 'Deep Focus' playlists\n4. This would work incredibly well in a video context - reach out to visual artists for a music video collab\n5. Build a press kit around this release",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 30, note: "The pads introduce beautifully here - perfect low-pass filter work" },
      { seconds: 75, note: "Drums entry is perfectly weighted - not too sudden" },
      { seconds: 145, note: "This breakdown is emotional. The way the elements strip back is really effective" },
      { seconds: 195, note: "The rebuild here with the new synth element is a great arrangement choice" },
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
    bestPart: "The groove on this is absolutely infectious. I found myself physically moving within the first 16 bars - that's the sign of a track that understands its purpose. The kick and bass relationship is expertly crafted; there's this pocket they create together that's tight but never stiff. The high-end percussion work adds this organic shuffle that elevates the whole thing above generic house. The chord progression in the main hook has this bittersweet quality that's emotionally engaging without being maudlin. Really tasteful harmonic choices throughout. The production shows real understanding of what makes club music work - it's not just loud, it's dynamic and interesting while maintaining dancefloor functionality.",
    weakestPart: "The B-section (around 2:00-2:30) could use a bit more development. It feels like it's setting up for something bigger that doesn't quite arrive. Consider adding a counter-melody or additional textural element here to maintain interest. Also, some of the hi-hat patterns become slightly repetitive over the track's duration - try adding subtle variations every 16 bars to keep producer-ears engaged.",
    additionalNotes: "This would absolutely destroy in a club setting. The mix translates well to phone speakers (tested it) while still having the low-end power for proper sound systems. That's genuinely hard to achieve. Your understanding of frequency balance across playback systems is clearly developed. I'm curious about your monitoring setup because this sounds like it was mixed on well-calibrated speakers.",
    nextActions: "1. Submit to Defected, Toolroom, or Spinnin' Deep - this fits their sound\n2. Create a DJ promo package and send to house DJs for support\n3. This track has sync licensing potential for fashion brands or lifestyle content\n4. Consider entering remix competitions to build profile\n5. Set up your Beatport and Traxsource profiles if you haven't already",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 20, note: "The bassline entry here sets the tone perfectly" },
      { seconds: 85, note: "This groove pocket is chef's kiss" },
      { seconds: 160, note: "The filter work here builds tension effectively" },
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
    bestPart: "The atmospheric depth here is genuinely impressive. You've created a sonic landscape that feels three-dimensional - there's a sense of space and air that a lot of producers struggle to achieve. The reverb and delay work is sophisticated; everything has its place in the stereo and depth field. The tension you build through the track is relentless in the best way - it never releases too early, which shows restraint and maturity as a producer. The breakdown at 2:45 is genuinely moving; the way the elements strip away to leave just that haunting pad and vocal texture gave me actual goosebumps. That's rare. The rebuild after is perfectly paced, adding elements back one by one until the full groove returns with new appreciation.",
    weakestPart: "The drop could have slightly more impact - consider layering a subtle impact hit or increasing the sidechain depth just slightly to give that moment more 'event' feeling. The track is so well-produced that this is really a taste thing more than a technical issue. Also, the outro could potentially be shorter for playlist purposes, though for DJ sets the current length is perfect.",
    additionalNotes: "This has serious Afterlife/Innervisions energy. The emotional quality combined with the production polish puts this in premium territory. I'd be genuinely surprised if this didn't find a home on a notable label. The sound design throughout shows real craft - nothing feels preset-y or generic. You've clearly spent time developing your sonic palette.",
    nextActions: "1. Submit to Afterlife, Innervisions, or Diynamic immediately\n2. This needs a music video - the visual potential is enormous\n3. Consider live set potential - this production style translates beautifully to live performance\n4. Reach out to Cercle or similar for potential live session consideration\n5. Build press narrative around your artistic vision",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 60, note: "The atmosphere is so thick here - love the pad layering" },
      { seconds: 120, note: "Tension building beautifully" },
      { seconds: 165, note: "The breakdown starts - and it's emotional" },
      { seconds: 200, note: "Goosebumps. This moment is special" },
      { seconds: 230, note: "The rebuild is perfectly paced" },
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
    bestPart: "The low-end is really well handled here. The kick has that modern punch that cuts through without being harsh, and the bassline complements it beautifully. There's a nice groove pocket that develops - you can tell this was made by someone who understands how people move on a dancefloor. The arrangement keeps things interesting with well-timed filter sweeps and FX. The overall mix is clean and translates well across different playback systems. The high-hat programming shows attention to detail with those subtle velocity variations that add human feel.",
    weakestPart: "The vocal sample feels a bit stock/generic compared to the quality of the production around it. The instrumental work is strong enough that the vocal almost undersells it. Consider either finding a more distinctive vocal hook or processing the current one more creatively - maybe some granular processing, pitch shifting, or formant manipulation to make it more unique to this track. The mids around 400-800Hz could also use some cleaning up - there's a slight build-up that's muddying the overall clarity.",
    additionalNotes: "This is a solid club track that would work well in a DJ set. The production fundamentals are clearly there - you understand EQ, compression, and arrangement. With a stronger hook element, this could really stand out. Consider what makes your favorite tracks memorable and apply that thinking to the top-line of your productions.",
    nextActions: "1. Source a more distinctive vocal or create a custom one\n2. Clean up the 400-800Hz range\n3. Consider sending to smaller tech house labels to build catalog\n4. This would work well for DJ promo - functional and well-produced\n5. Keep developing - the technical foundation is solid",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 45, note: "The bass drops nicely here" },
      { seconds: 90, note: "Vocal enters - consider reworking this element" },
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
    bestPart: "The organic textures woven throughout this production are beautiful. There's a warmth here that a lot of electronic music lacks - you can hear acoustic elements, field recordings, and natural sounds blended seamlessly with synthesized elements. The result feels alive and breathing rather than sterile and computer-generated. The vocal work is particularly stunning - the processing maintains the human emotion while adding just enough electronic character to fit the production. The dynamic range is impressive; the track breathes and moves in a way that rewards focused listening. This is headphones-at-midnight music in the best possible way.",
    weakestPart: "The low-end could have a bit more weight. The organic, airy quality of the production is beautiful, but when the drop hits, I want to feel it more physically. Consider layering a subtle sub-bass element or adding some gentle saturation to the bass to give it more presence in club contexts. The kick also could use a touch more click in the 2-4kHz range for definition.",
    additionalNotes: "This is genuinely artistic work. It's not just functional dance music - it's expressive, emotional, and sophisticated. The fact that it's also danceable is a bonus. You're operating in a space that very few producers manage to inhabit successfully. Keep developing this sound - it's distinctive and marketable.",
    nextActions: "1. This deserves a premium release - target All Day I Dream, Exploited Ghetto, or similar organic house labels\n2. Create a live performance version - the organic elements would translate beautifully\n3. Sync licensing opportunities in film/TV - this has serious mood potential\n4. Build visual identity around this aesthetic\n5. Document your creative process for content",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 40, note: "The organic textures here are gorgeous" },
      { seconds: 100, note: "Love how the vocal sits in the mix" },
      { seconds: 155, note: "The dynamic shift here is really effective" },
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
    bestPart: "The mood and vibe you're going for is clear and the musical ideas are there. The chord progression has that emotional quality that connects with listeners, and your arrangement sense shows understanding of how to build and release tension. The atmospheric elements and pads create a nice sense of space and the overall direction of the track is solid. You clearly have a vision for the sound you want to achieve.",
    weakestPart: "The mix needs significant work. There's muddiness in the low-mids (200-500Hz) that's clouding the overall clarity. The bass and kick are fighting for space rather than complementing each other. The high-end feels slightly harsh, particularly in the synth leads around 3-5kHz. The overall loudness is lower than commercial releases, suggesting the master needs attention. These are fixable issues, but they're currently holding back what could be a really solid track. I'd recommend spending dedicated time on EQ balance, referencing against commercial tracks in the same genre.",
    additionalNotes: "The creative and musical elements are there - what you need is to level up the technical execution. Consider investing in room treatment if you haven't, or getting a second pair of ears from a mixing engineer on your work. Also, compare your mix to reference tracks at every stage of production. The gap between where this is and where it could be isn't massive, but it is noticeable.",
    nextActions: "1. Book a mixing session with a professional or experienced friend\n2. Address the frequency balance issues before further distribution\n3. Invest in reference tracks and A/B comparison tools\n4. Consider room treatment or calibration for your monitoring environment\n5. Keep producing - the musical instincts are solid, just polish the technical side",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 60, note: "Mud building up here - check 200-500Hz range" },
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
    bestPart: "The arrangement on this is masterclass level. Every single element knows exactly when to enter and exit. The way you build tension through the verse sections, the perfectly-timed breakdown, the anthemic drop - it all flows with a sense of inevitability that the best progressive house has. The lead synth has this soaring quality that's emotional without being cheesy. The way the layers stack in the drop section creates this wall of sound that's powerful but still clear and defined. The mixdown supports the arrangement perfectly - nothing gets lost, everything has its moment. This is what polished, professional production sounds like.",
    weakestPart: "I genuinely had to listen three times to find something constructive here. If I'm being extremely critical, the hi-hats could have slightly more high-end sparkle (shelf boost above 10kHz), and the transition at 3:15 could be smoothed with a longer reverb tail on the outgoing element. But these are truly minor points on an excellent production.",
    additionalNotes: "This is ready for release. I don't say that lightly - I've reviewed hundreds of tracks on this platform. This has the polish, the emotional impact, and the technical quality to stand alongside releases on major labels. You should be actively shopping this to labels and playlist curators.",
    nextActions: "1. Submit to Anjunabeats, Enhanced, or Armada immediately\n2. Get this on Spotify playlists - it has editorial potential\n3. Send to progressive house blogs for premiere coverage\n4. Connect with A&R at relevant labels on socials\n5. Start planning the next release - you have momentum to maintain",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 30, note: "Intro sets the tone perfectly" },
      { seconds: 90, note: "The tension building here is immaculate" },
      { seconds: 145, note: "Breakdown. Chills. This is the moment" },
      { seconds: 180, note: "The rebuild - element by element - textbook execution" },
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
    bestPart: "This is catchy and accessible - you've clearly got an ear for what works commercially. The hook sticks in your head after one listen, which is genuinely difficult to achieve. The production is clean and the mix translates well across different systems. The chord progression has that feel-good quality that radio-friendly house needs. The track structure is solid, with clear sections and effective builds. This would work well in a mainstream playlist context or as background music in a commercial setting.",
    weakestPart: "While the track is well-executed, it feels sonically safe. It doesn't take any risks or offer anything that distinguishes it from other tracks in this style. The sound selection, while good, is fairly predictable. To stand out in a crowded market, you need something that makes listeners stop and go 'what was that?' Consider pushing your sound design in more unexpected directions, adding unique textural elements, or taking structural risks that subvert expectations while still maintaining commercial appeal.",
    additionalNotes: "You've clearly studied what works in commercial house music, and you can execute at that level. The next step is finding your unique voice within that framework. What can you do that nobody else does? What perspective do you bring? The technical foundation is there - now build something memorable on top of it.",
    nextActions: "1. Experiment with more adventurous sound design on your next track\n2. Study artists who balance commercial appeal with distinctiveness\n3. This track as-is could work for sync licensing opportunities\n4. Consider collaborating with vocalists for original top-lines\n5. Build your brand identity around a unique sonic signature",
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
    originalityScore: 4,
    wouldListenAgain: true,
    wouldAddToPlaylist: true,
    wouldShare: true,
    wouldFollow: true,
    perceivedGenre: "Deep House / Indie Dance",
    similarArtists: "Ben Bohmer, Monolink, RÜFÜS DU SOL, Bob Moses",
    bestPart: "The emotional core of this track is powerful. You can feel intention behind every sound choice - nothing is arbitrary, everything serves the mood. The progression from the intimate opening to the expansive middle section to the reflective outro tells a complete story. The way you use silence and space is particularly mature; not every moment needs to be filled, and you understand that. The vocal (if that's you) has genuine emotional weight - it's not just a hook, it's an expression. This is the kind of track that connects with people on a level beyond just 'good production.'",
    weakestPart: "The outro, while beautiful, runs slightly long for streaming optimization. Consider creating an 'album version' that keeps the current outro length and a 'single version' that trims it for playlist purposes. The current length might trigger skips on platforms like Spotify where playlist curators favor tracks under 4 minutes. Small thing, but worth considering for maximum reach.",
    additionalNotes: "You're operating at an artistic level that goes beyond just making dance music. This is expressive, personal, and genuine. Keep developing this voice - it's distinctive and in a world of formulaic productions, it stands out. The technical execution matches the artistic ambition, which is increasingly rare.",
    nextActions: "1. Create a music video - this track demands visuals\n2. Submit to Cercle or similar for potential live performance opportunity\n3. Build press narrative around your artistic journey\n4. Consider live performance arrangements\n5. This could anchor an EP - what other tracks exist in this world?",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 45, note: "The vulnerability in the vocal here is striking" },
      { seconds: 100, note: "This is where it starts to open up - beautiful" },
      { seconds: 170, note: "Peak emotion. This moment lands perfectly" },
      { seconds: 220, note: "The gentle comedown is well-handled" },
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
    bestPart: "The sense of space in this mix is really impressive. You've created a soundscape where everything has room to breathe while still maintaining energy and momentum. The stereo imaging is well-executed - elements feel like they exist in a real space rather than being hard-panned arbitrarily. The bass sits really well with the kick, never competing or masking. The progression through the track maintains interest without ever feeling forced or abrupt. It's sophisticated work that shows understanding of both technical mixing and artistic arrangement.",
    weakestPart: "The drop could hit a bit harder. Given the quality of the build, the payoff feels slightly underwhelming by comparison. Consider layering some parallel compression on the drop section, adding a subtle impact hit, or increasing the sidechain depth momentarily to give that moment more 'event' quality. The current version is tasteful, but you have room to push the contrast between build and drop further.",
    additionalNotes: "Technically proficient with good musicality - that's a combination that serves artists well long-term. You're clearly developing your craft with intention. Keep refining, keep pushing yourself, and keep releasing. The path from here to professional recognition is about consistency and continued growth, and you're on it.",
    nextActions: "1. Experiment with parallel compression on drops\n2. Study how your favorite producers create impact moments\n3. Consider submitting to Anjunaprogressive or similar labels\n4. Build DJ set promo package\n5. Keep developing your sound palette",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 80, note: "Mix space really opens up here nicely" },
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
    bestPart: "This feels fresh and modern in a way that a lot of submissions don't. You're clearly paying attention to where electronic music is going, not where it's been. The sound design choices are creative and effective - things sound like you made them rather than pulled them from a preset bank. The rhythmic complexity adds interest without sacrificing groove. The way organic and electronic elements blend is really well done. There's a fearlessness here that serves you well; you're taking risks and they're paying off. This is the kind of production that people share because it feels new and exciting.",
    weakestPart: "During the busiest sections, some frequencies clash slightly - particularly in the upper mids around 2-4kHz where multiple synth elements compete for space. Some surgical EQ work to carve out individual pockets for each element would increase clarity without sacrificing the density you're going for. It's a minor production note on an otherwise excellent track.",
    additionalNotes: "You have a distinctive voice developing. Don't lose it by chasing what's already popular. The best artists define genres rather than follow them, and you're showing signs of that potential. Keep pushing in the direction you're going.",
    nextActions: "1. Address the frequency clashing with surgical EQ\n2. Build your brand around this unique sound\n3. Connect with other forward-thinking producers for collaboration\n4. Submit to labels known for releasing boundary-pushing music\n5. Document your process - people are curious how sounds like this are made",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 55, note: "The sound design here is really creative" },
      { seconds: 90, note: "Love this rhythmic complexity" },
      { seconds: 150, note: "Frequencies clashing slightly here - needs EQ work" },
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
    bestPart: "The energy and drive are there. This is functional tech house that does what it needs to do - it grooves, it has movement, the rhythm section is tight. The kick is well-designed with good punch in the mids and clean sub extension. The arrangement understands dancefloor dynamics and when to add/remove elements for maximum effect. For a DJ tool, this works.",
    weakestPart: "The high frequencies feel harsh at certain points, particularly on the hi-hats and the main synth stab. This could cause listener fatigue over time and might not sit well in a DJ mix next to more polished productions. Spend time with a dynamic EQ or multiband compressor taming those peaks above 8kHz. Also, the track feels like it needs a more distinctive hook to be memorable - functional is good, but memorable is better.",
    additionalNotes: "The bones are solid. This is clearly made by someone who understands house music and its purpose. The technical polish and a stronger hook element would elevate this from 'works in a set' to 'gets dropped at the peak moment.'",
    nextActions: "1. Address the harsh high frequencies\n2. Develop a more distinctive hook or element\n3. Reference against professionally released tech house\n4. This level of production could get you on smaller/medium labels\n5. Keep building your catalog - consistency is key in this genre",
    addressedArtistNote: "PARTIALLY",
    timestamps: [
      { seconds: 45, note: "Groove is working well here" },
      { seconds: 100, note: "Hi-hats getting harsh - check 8kHz+" },
      { seconds: 160, note: "Needs a stronger hook element to land" },
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
    bestPart: "The journey this track takes you on is genuinely beautiful. It's sunset driving music, it's headphones-on-the-train music, it's close-your-eyes-and-feel-something music. The emotional progression feels natural and earned - nothing is rushed or forced. The melody in the main section is memorable without being obvious, sophisticated without being inaccessible. The way elements weave in and out creates a sense of movement and life. This is music for people who actually listen to music, not just have it on in the background.",
    weakestPart: "Some sections could benefit from more dynamic variation. The difference between the quietest and loudest moments could be greater - right now everything sits at a similar energy level. Don't be afraid to pull things back further before building them up again. Greater contrast creates greater impact.",
    additionalNotes: "Going into my driving playlist immediately. This is exactly the kind of track I look for - emotional, well-produced, and transportive. You've made something that will soundtrack moments in people's lives, and that's a genuine achievement.",
    nextActions: "1. Create an extended mix for DJ sets - this deserves more room to breathe\n2. Submit to mood-based playlists - this fits 'Evening Commute' energy\n3. Consider release timing around summer for maximum playlist placement\n4. This would work well with nature/travel visuals\n5. Build relationship with playlist curators who favor this sound",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 35, note: "The journey begins - nice intro" },
      { seconds: 95, note: "Emotional core emerging" },
      { seconds: 165, note: "This is the peak moment and it delivers" },
      { seconds: 210, note: "The comedown is as good as the buildup" },
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
    bestPart: "This is genuinely special. I've listened to this four times now and keep discovering new details. The production is pristine - every element sits perfectly in the mix, the master is loud without being crushed, the stereo field is immersive and interesting. But beyond the technical excellence, there's real artistry here. The emotional arc, the musical choices, the way tension builds and releases - it all points to someone who understands that great music is about connection, not just craft. The breakdown at 2:30 is legitimately moving. That moment where everything strips away and you're left with just that pad and vocal texture - I felt that. This is what we're all trying to make when we sit down at our DAWs, and you've actually done it.",
    weakestPart: "If I absolutely have to find something... the snare could cut through the mix slightly more during the densest sections. A small 2dB boost around 180Hz for body and 4kHz for crack would help it punch through without changing its character. But honestly, this is reaching. The track is excellent as-is.",
    additionalNotes: "You're onto something here. This level of quality will get noticed. The combination of technical polish and emotional resonance is rare, and labels and playlist curators recognize it when they hear it. Don't rush the release - this deserves proper marketing and rollout. It's too good to just quietly drop on a Friday.",
    nextActions: "1. Plan a proper release campaign - this deserves visibility\n2. Send to premium labels - Anjuna, mau5trap, Exploited Ghetto\n3. Invest in professional press photos and branding\n4. Create EPK for label submissions\n5. Start working on the next track to maintain momentum - you're building something here",
    addressedArtistNote: "YES",
    timestamps: [
      { seconds: 50, note: "Opening sets expectations high - and they're met" },
      { seconds: 105, note: "Love how this section unfolds" },
      { seconds: 150, note: "The breakdown - this is where it gets emotional" },
      { seconds: 195, note: "The rebuild is patient and rewarding" },
      { seconds: 240, note: "Ending is tasteful - leaves you wanting more" },
    ],
  },
];

async function main() {
  console.log("Creating demo data for TikTok video...\n");

  // Get or create House genre
  const houseGenre = await prisma.genre.findUnique({
    where: { slug: "house" },
  });
  const deepHouseGenre = await prisma.genre.findUnique({
    where: { slug: "deep-house" },
  });

  if (!houseGenre || !deepHouseGenre) {
    console.log("Genres not found. Run the main seed first: npx prisma db seed");
    process.exit(1);
  }

  // Create demo artist user
  const passwordHash = await hash("demo123456", 12);

  const demoArtistUser = await prisma.user.upsert({
    where: { email: "demo-artist@soundcheck.com" },
    update: {},
    create: {
      email: "demo-artist@soundcheck.com",
      password: passwordHash,
      name: "Aurora Nights",
      isArtist: true,
      emailVerified: new Date(),
    },
  });

  console.log(`Created/found demo artist user: ${demoArtistUser.email}`);

  // Create artist profile
  const artistProfile = await prisma.artistProfile.upsert({
    where: { userId: demoArtistUser.id },
    update: {
      totalTracks: 1,
      totalSpent: 2999,
    },
    create: {
      userId: demoArtistUser.id,
      artistName: "Aurora Nights",
      totalTracks: 1,
      totalSpent: 2999,
      reviewCredits: 0,
      genres: {
        connect: [{ id: houseGenre.id }, { id: deepHouseGenre.id }],
      },
    },
  });

  console.log(`Created/found artist profile: ${artistProfile.artistName}`);

  // Check if track already exists
  const existingTrack = await prisma.track.findFirst({
    where: {
      artistId: artistProfile.id,
      title: "Midnight Echoes",
    },
  });

  if (existingTrack) {
    console.log(`Demo track already exists. Cleaning up old data...`);
    await prisma.review.deleteMany({ where: { trackId: existingTrack.id } });
    await prisma.payment.deleteMany({ where: { trackId: existingTrack.id } });
    await prisma.track.delete({ where: { id: existingTrack.id } });
  }

  // Create demo track with CORRECT SoundCloud URL
  const track = await prisma.track.create({
    data: {
      artistId: artistProfile.id,
      sourceUrl: "https://soundcloud.com/user-587506684/sick-track",
      sourceType: "SOUNDCLOUD",
      title: "Midnight Echoes",
      artworkUrl: null,
      duration: 285,
      bpm: 124,
      feedbackFocus: "Looking for honest feedback on the mix and overall vibe. Is the drop impactful enough?",
      status: "COMPLETED",
      packageType: "STANDARD",
      reviewsRequested: 15,
      reviewsCompleted: 15,
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      genres: {
        connect: [{ id: houseGenre.id }, { id: deepHouseGenre.id }],
      },
    },
  });

  console.log(`Created demo track: ${track.title}`);
  console.log(`SoundCloud URL: ${track.sourceUrl}`);

  // Create fake payment
  await prisma.payment.create({
    data: {
      trackId: track.id,
      amount: 2999,
      stripeSessionId: `demo_session_${Date.now()}`,
      stripePaymentId: `demo_payment_${Date.now()}`,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Created fake payment record");

  // Create reviewer users and reviews
  console.log("\nCreating reviewers and reviews...");

  for (let i = 0; i < 15; i++) {
    const reviewerName = reviewerNames[i];
    const reviewerEmail = `reviewer-demo-${i + 1}@soundcheck.com`;

    // Create reviewer user
    const reviewerUser = await prisma.user.upsert({
      where: { email: reviewerEmail },
      update: {},
      create: {
        email: reviewerEmail,
        password: passwordHash,
        name: reviewerName,
        isReviewer: true,
        emailVerified: new Date(),
      },
    });

    // Create reviewer profile
    const reviewerProfile = await prisma.reviewerProfile.upsert({
      where: { userId: reviewerUser.id },
      update: {},
      create: {
        userId: reviewerUser.id,
        tier: i < 5 ? "PRO" : "NORMAL",
        totalReviews: Math.floor(Math.random() * 100) + 30,
        averageRating: 4.2 + Math.random() * 0.6,
        completedOnboarding: true,
        onboardingQuizPassed: true,
        genres: {
          connect: [{ id: houseGenre.id }, { id: deepHouseGenre.id }],
        },
      },
    });

    // Create review with varied dates
    const daysAgo = Math.floor((i / 15) * 5);
    const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const data = reviewData[i];

    await prisma.review.create({
      data: {
        trackId: track.id,
        reviewerId: reviewerProfile.id,
        status: "COMPLETED",
        listenDuration: 200 + Math.floor(Math.random() * 85),
        firstImpression: data.firstImpression as "STRONG_HOOK" | "DECENT" | "LOST_INTEREST",
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
        addressedArtistNote: data.addressedArtistNote as "YES" | "PARTIALLY" | "NO",
        timestamps: data.timestamps,
        paidAmount: 200,
        artistRating: data.productionScore >= 4 ? (Math.random() > 0.3 ? 5 : 4) : null,
        isGem: i === 0 || i === 3 || i === 7 || i === 14,
        shareId: `demo${i + 1}${Date.now().toString(36)}`,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      },
    });

    console.log(`  Created review ${i + 1}/15 from ${reviewerName}`);
  }

  console.log("\n========================================");
  console.log("Demo data created successfully!");
  console.log("========================================\n");
  console.log(`Artist: Aurora Nights`);
  console.log(`Email: demo-artist@soundcheck.com`);
  console.log(`Password: demo123456`);
  console.log(`\nTrack: Midnight Echoes`);
  console.log(`SoundCloud: https://soundcloud.com/user-587506684/sick-track`);
  console.log(`Reviews: 15 completed (highly detailed)`);
  console.log(`\nTo view the demo:`);
  console.log(`1. Log in as demo-artist@soundcheck.com`);
  console.log(`2. Go to Artist Dashboard`);
  console.log(`3. Click on "Midnight Echoes" to see all reviews and analytics`);
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
