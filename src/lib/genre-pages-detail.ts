// Companion content for genre landing pages (src/lib/genre-pages.ts).
// Adds genuinely unique, substantive per-genre content so each page is
// defensible against thin-content / doorway-page filters. Keyed by the
// same slug used in genre-pages.ts.

export type GenreDetail = {
  // 5 genre-specific pre-release checks
  releaseChecklist: string[];
  // One substantial, genre-specific paragraph: the single change that
  // improves most tracks in this genre. Written to be citable by LLMs.
  proTip: string;
};

export const genreDetails: Record<string, GenreDetail> = {
  "hip-hop": {
    releaseChecklist: [
      "The hook lands within the first 30 seconds and is distinct from the verses in energy",
      "Vocals sit clearly on top of the beat — every bar is intelligible without straining",
      "The 808 and kick occupy complementary frequencies rather than fighting for the low end",
      "There's at least one moment — a switch, an ad-lib, a beat change — that earns a replay",
      "The track holds energy through the second verse instead of sagging after the first hook",
    ],
    proTip:
      "The single highest-leverage fix in independent hip-hop is vocal level. Most producers mix the beat to sound huge, then drop the vocal in too low because they already know every word. A first-time listener doesn't. If listeners consistently say the bars get lost, raise the vocal 1.5–3 dB and add light compression so it stays present through the loud sections of the beat — it's usually the difference between a track that sounds amateur and one that sounds finished.",
  },
  trap: {
    releaseChecklist: [
      "The 808 translates on phone speakers and earbuds, not just studio monitors",
      "Hi-hat rolls and patterns have enough variation to avoid feeling mechanical",
      "There's a clear energy peak — a drop, switch, or beat change — within the first minute",
      "The kick and 808 don't mask each other in the sub frequencies",
      "Vocal mix keeps the lyrics present without sitting awkwardly above the beat",
    ],
    proTip:
      "The most common trap mistake is an 808 that sounds enormous on monitors but disappears on phones and laptops — where most of your audience actually listens. Layer a short mid-range click or distortion on the 808 so the pitch is audible on small speakers, and sidechain it tightly to the kick so the low end stays clean. Test every mix on actual earbuds before you call it done.",
  },
  "boom-bap": {
    releaseChecklist: [
      "The drums punch through the sample with real weight on kick and snare",
      "Sample chops sit naturally rather than feeling abrupt or misaligned",
      "The low end is clean — bass line and kick aren't muddying each other",
      "The loop has enough texture or variation to sustain a full verse without fatigue",
      "The overall vibe matches the era and mood you're going for",
    ],
    proTip:
      "Boom bap lives and dies on drum punch. The most common issue is a kick or snare that's too thin to cut through a dense, dusty sample. Before anything else, make sure your drums hit with physical weight — layer samples if you need to, and carve room in the sample's frequency range so the drums have space to land. A great boom bap beat makes you nod your head involuntarily; if it doesn't, the drums usually aren't punching hard enough.",
  },
  drill: {
    releaseChecklist: [
      "The dark atmosphere lands immediately — the production isn't too bright or clean",
      "The sliding 808 bass is timed correctly to the melody and sits cleanly in the low end",
      "Vocal delivery and ad-libs match the energy of the instrumental",
      "The mix lets the vocal sit right without the beat overpowering it",
      "There's enough variation across the runtime to hold attention",
    ],
    proTip:
      "The thing that separates real drill from drill-adjacent is the 808 slide. The gliding bass needs to follow the melody and land in pocket with the drum pattern — when the timing is even slightly off, genre listeners feel it instantly. Spend the time getting your 808 glides musically locked to the melody, and keep the rest of the production dark and sparse so the atmosphere does the work. Over-producing kills drill faster than almost anything.",
  },
  rnb: {
    releaseChecklist: [
      "The lead vocal sits clearly above the production — present and warm, not distant",
      "Reverb adds depth without pushing the vocal so far back it loses intimacy",
      "The chord progression resolves with genuine emotional weight",
      "Ad-libs and harmonies support the lead rather than cluttering it",
      "There's a clear dynamic lift between verse and chorus",
    ],
    proTip:
      "The most common R&B mix issue is too much reverb on the lead vocal. Producers chase a lush, dreamy sound and end up pushing the voice so far back it loses the intimacy the genre depends on. R&B is close and personal — the listener should feel like the vocal is right in front of them. Pull the reverb back, keep the vocal dry and present, and let the production create the space around it instead of drowning the voice in it.",
  },
  electronic: {
    releaseChecklist: [
      "The arrangement creates clear tension and release rather than drifting",
      "The mix translates across headphones, laptop speakers, and a real system",
      "Transitions between sections feel intentional, not abrupt",
      "There's a distinctive sonic element rather than stock presets throughout",
      "The low end is controlled and doesn't turn muddy on non-studio speakers",
    ],
    proTip:
      "The biggest gap between amateur and professional electronic music is arrangement, not sound design. Most producers can make a good 8-bar loop; far fewer can build an arrangement that takes a listener somewhere. Before you polish the mix, make sure the track has a clear emotional shape — a build, a moment of release, a return — that a first-time listener can feel without analyzing. A perfectly mixed loop with no journey still loses people by the second minute.",
  },
  house: {
    releaseChecklist: [
      "The kick and bass lock together in a pocket that makes you move immediately",
      "The intro is long enough and clean enough for a DJ to mix into",
      "The low end is tight — no muddiness undermining the groove",
      "There's enough variation across the track to hold a floor for its full length",
      "The energy sustains rather than peaking too early and leaving nothing for the back half",
    ],
    proTip:
      "House is groove first, everything else second. The single most important thing is the relationship between your kick and bass — they need to lock so tightly that a listener feels the pulse without thinking about it. If the groove doesn't make a producer who didn't write it want to move, no amount of sound design or arrangement will save the track. Get the kick-bass pocket right before you add anything else.",
  },
  "deep-house": {
    releaseChecklist: [
      "The atmosphere feels warm and immersive, not bright or clinical",
      "The chord progression has the harmonic depth the genre demands",
      "The low end is full but controlled, never muddy",
      "The arrangement evolves subtly rather than sitting completely static",
      "The track would genuinely work in a late-night, settled context",
    ],
    proTip:
      "Deep house is defined by warmth, and the most common mistake is a mix that's too bright — which makes it sound like tech house instead. Soften the high frequencies, keep the low-mids full and present, and create a sense of space and room around the elements. The test is physical: a real deep house track makes the listener feel settled and immersed. If it still feels sharp, restless, or clinical, the warmth that defines the genre isn't there yet.",
  },
  techno: {
    releaseChecklist: [
      "The kick has weight without clashing with the sub frequencies",
      "The drive sustains across a long runtime without becoming monotonous",
      "Intro and outro are built for mixing in a set",
      "The build-and-release structure delivers a genuine payoff",
      "The track holds up at volume on a real system, not just headphones",
    ],
    proTip:
      "Techno is functional music — it has to work over a long play on a loud system, and that's a different target than sounding good in headphones. The most common failure is a track that's interesting in the studio but has no sustained drive on a floor. Focus relentlessly on the kick weight and the hypnotic forward momentum of the groove. Test loud, test long, and ask whether the track still pulls you forward at the seven-minute mark.",
  },
  "lo-fi": {
    releaseChecklist: [
      "The vinyl texture and crackle feel intrinsic, not pasted on top",
      "The drums breathe and swing rather than sitting rigidly on the grid",
      "The chords match the melancholic, unhurried mood the genre lives in",
      "The atmosphere stays consistent across the full runtime",
      "The beat still feels interesting at the two-minute mark on a first listen",
    ],
    proTip:
      "The most common lo-fi mistake is applying lo-fi effects to a fundamentally clean, rigid production — the crackle and saturation sit on top instead of being part of the sound. Authentic lo-fi starts with loose, human drum timing and warm, slightly imperfect source material. Get the looseness and warmth into the foundation first; the vinyl texture and filtering should enhance something that's already got feel, not manufacture feel that isn't there.",
  },
  edm: {
    releaseChecklist: [
      "The build strips elements away so the drop lands as a genuine release",
      "The drop hits with low-end weight and clear contrast from the build",
      "The mix has the width and stereo presence the genre expects",
      "There's a moment that surprises rather than a fully predictable structure",
      "The drop translates at volume on a real system, not just monitors",
    ],
    proTip:
      "The single biggest fix for a weak EDM drop is the build that precedes it. Most amateur drops don't hit because the build doesn't create contrast — it just gets louder. Strip elements away in the bar or two before the drop so the drop feels like an addition, not a continuation. The more space you create right before it, the harder the drop lands. The drop's impact is set up before it ever arrives.",
  },
  ambient: {
    releaseChecklist: [
      "The texture has depth and presence rather than feeling thin",
      "There's an emotional arc — the track goes somewhere across its runtime",
      "The mix breathes and feels like a space, not a clinical render",
      "Subtle evolution justifies the length rather than a static loop",
      "It creates genuine atmosphere rather than just occupying sonic space",
    ],
    proTip:
      "The defining failure of amateur ambient is establishing a mood in the first minute and then maintaining it unchanged for eight more. Ambient still needs development — even subtle. Introduce slow filter movement, gradually unfold layers, shift the register or texture over time so the listener arrives somewhere different from where they started. The changes can be glacial, but they have to exist. Without them, the runtime feels indulgent rather than intentional.",
  },
  synthwave: {
    releaseChecklist: [
      "The aesthetic lands without sounding like it was made on actual 1980s gear",
      "The lead synth cuts through with warmth and character",
      "The bass drives underneath without competing with the kick",
      "The drums have the gated, driving quality the genre wants",
      "The emotional arc resolves in a satisfying, cinematic way",
    ],
    proTip:
      "The most common synthwave mistake is stacking clichés — gated reverb, arpeggios, driving bass — without the underlying musical quality to make them interesting. The aesthetic is necessary but not sufficient. Spend your energy on a genuinely memorable lead melody and a chord progression with real emotional movement. Get the songwriting right first, then layer the retro production on top of something that would work even without it.",
  },
  pop: {
    releaseChecklist: [
      "The chorus is bigger than the verse and creates a clear lift",
      "The lead vocal sits clearly on top of the production and is fully intelligible",
      "The pre-chorus builds tension before the chorus releases it",
      "The melodic hook is distinctive enough to remember after one listen",
      "The song has a clear, describable identity",
    ],
    proTip:
      "In pop, the chorus is everything, and the most common failure is a chorus that doesn't lift. The chorus has to feel bigger, wider, or higher energy than the verse — and the melodic hook has to be memorable on the first listen. The real test: play the chorus to someone who's never heard the song and ask if they can hum it ten minutes later. If they can't, the hook isn't strong enough yet, and no amount of production polish will fix that.",
  },
  "indie-pop": {
    releaseChecklist: [
      "The production commits to a level — either embraces rawness or commits to polish",
      "The chorus hook is distinctive enough to remember after one listen",
      "The vocal sits comfortably and intentionally in the mix",
      "There's enough energy contrast between verse and chorus",
      "The track has a genuine sonic identity rather than imitating a reference",
    ],
    proTip:
      "Indie pop's biggest trap is the uncanny middle ground between raw and polished — tracks that are half-produced read as unintentional rather than aesthetic. Pick a lane. If your references sound intimate and slightly rough, commit to that and don't over-correct into sterile polish. If you're going for a bigger sound, finish it properly. The other common failure is over-producing a good song until its personality is gone. Protect the quirk that makes it yours.",
  },
  "indie-rock": {
    releaseChecklist: [
      "Guitars occupy complementary frequencies rather than fighting in the mids",
      "The vocal has its own clear window and cuts through the band",
      "There's a moment — a dynamic shift or hook — that surprises the listener",
      "The energy builds and releases with intention across the track",
      "The arrangement serves the song rather than just filling space",
    ],
    proTip:
      "The classic indie rock mix problem is two guitars fighting for the same mid-range space, turning the whole thing to mud. The fix is frequency complementing — give each guitar a slightly different tone and EQ window, pan them apart, and carve room around the vocal's fundamental so the voice stays clear. Crucially, energy comes from the performance, not from making everything louder. A committed take in a clean mix beats a tentative take buried in volume every time.",
  },
  rock: {
    releaseChecklist: [
      "The drums have real impact — the kick punches and the snare cracks",
      "Rhythm guitars are thick without muddying each other",
      "The vocal cuts through the band without fighting it",
      "The arrangement builds to a satisfying peak or release",
      "There's a hook or moment worth coming back for",
    ],
    proTip:
      "Energy in a rock track comes from the performance, and it's destroyed more often by over-production than under-production. The common mistakes are over-compressing the drums until they lose their dynamics, burying the vocal until it sounds passive, and layering so many guitars that there's no space left to breathe. A tight, committed performance will sound energetic even in a raw mix. Protect the dynamics and the space — don't flatten the life out of it chasing loudness.",
  },
  alternative: {
    releaseChecklist: [
      "The production has a distinctive character rather than sounding generic",
      "The emotional intensity builds through the track as intended",
      "The mix balance between instruments and vocals serves the song",
      "The structure takes the risks that are worth taking",
      "The track stands out from its genre rather than blending in",
    ],
    proTip:
      "Alternative succeeds on identity, and the most common failure is a track that uses all the right sounds but has nothing specifically its own. Before release, ask a fresh listener to describe what's unique about the track — a texture, a vocal approach, a structural choice. If they can't point to anything specific, it's too derivative of its references. Identity doesn't require being experimental; it requires committing to something specific instead of defaulting to genre convention.",
  },
  "singer-songwriter": {
    releaseChecklist: [
      "The vocal performance commits to the emotion, especially on the demanding lines",
      "The arrangement is intentional — neither too sparse nor too busy for the song",
      "No lyrical line breaks the mood or feels out of place",
      "The melody is strong enough to carry a minimal arrangement",
      "The song feels like it has something genuine to say",
    ],
    proTip:
      "The make-or-break element is the vocal performance, and the most common failure is playing it safe on the emotionally demanding lines. The fix is a mindset shift: record the take while thinking about what the song is actually about, not whether you're singing it correctly. That single change in focus usually produces the take that connects. Minimal arrangements only work when the performance is strong enough to carry the listener without production support.",
  },
  folk: {
    releaseChecklist: [
      "The vocal feels natural and lived-in rather than performed",
      "The story or lyrical arc resolves cleanly by the end",
      "The instrumental arrangement serves the song without cluttering it",
      "The production keeps the folk character rather than over-polishing it",
      "There's a genuine emotional core, not just a genre exercise",
    ],
    proTip:
      "Authenticity in folk lives in the performance, not the production. The most common failure is a track that's technically proficient but emotionally distant — the singer sounds like they're performing a folk song rather than telling a story they care about. Don't over-rehearse the feeling out of it, and don't over-polish the character out of it. A take with genuine emotional commitment and a little imperfection will always beat a clean, careful one that doesn't mean anything.",
  },
  soul: {
    releaseChecklist: [
      "The vocal performance fully commits to the emotion rather than playing it safe",
      "The rhythm section locks into a pocket that moves the listener",
      "The arrangement leaves space for the vocal and emotion to breathe",
      "The chord resolutions land with genuine emotional weight",
      "The track has a real emotional core, not an imitative one",
    ],
    proTip:
      "Soul is about emotional commitment, and the most common failure is an over-controlled performance that's technically clean but emotionally distant. The technical elements — tone, control, dynamics — should serve the feeling, not be the center of it. Soul traditionally values a voice that sounds like it's been through something over manufactured perfection. When you're tracking vocals, prioritize the take that means it, even if it's slightly less clean than the one that doesn't.",
  },
  metal: {
    releaseChecklist: [
      "Guitar tone cuts through without competing with the bass in the low-mids",
      "The kick and bass guitar sit in complementary frequency zones",
      "The vocal has a clear window to cut through the dense mix",
      "The arrangement builds to a satisfying peak or breakdown",
      "The low end hits hard and clearly rather than just being loud",
    ],
    proTip:
      "Metal mix clarity comes from frequency separation, not volume. The most common failure is heaviness that turns to mud because the high-gain guitars, kick, and bass are all piling into the same low-mid range. Tighten the low-mids (200–400 Hz) on the guitars so they're not competing with the bass, give the kick its punch zone, and carve a clear window around 2–4 kHz for the vocal. Real heaviness is about clarity in the low end — a track that hits hard and clean, not one that's just dense and loud.",
  },
  "drum-and-bass": {
    releaseChecklist: [
      "The bass element sits cleanly in the low end at high energy",
      "The breaks have velocity variation and swing rather than flat, mechanical hits",
      "The kick and bass relationship stays clean at volume",
      "The build creates genuine anticipation before the drop",
      "The track holds its energy across the full runtime without flattening",
    ],
    proTip:
      "Energetic DnB breaks come from dynamics, not speed. The most common failure is a break where every hit is at the same velocity — which makes the track feel like it's sprinting at a constant pace with no push or release. Add velocity variation, swing, and processing (compression, saturation, layering) so the break has punch and human feel. The genre is fast, but the energy comes from the breaks breathing, not just from the tempo.",
  },
  dubstep: {
    releaseChecklist: [
      "The bass design is distinctive rather than generic",
      "The build creates real tension before the drop",
      "The drop hits with the impact the genre demands",
      "The sub and mid-bass occupy clean, separate space",
      "The sound design feels original, not derivative",
    ],
    proTip:
      "The hardest-hitting dubstep drops are set up by what you remove, not what you add. The most common failure is a drop that doesn't differentiate enough from the build, so the moment never lands. Strip the build down right before the drop to maximize contrast, and make sure your bass design has enough character to carry the drop section on its own. Test the low end on a real system — a bass that sounds powerful on monitors often loses all its weight on actual speakers.",
  },
  "future-bass": {
    releaseChecklist: [
      "The chords convey real emotion through rich, layered voicings",
      "The drop has the punchy, euphoric quality the genre demands",
      "Vocal chops sit naturally in the mix and connect to the production",
      "The build creates genuine emotional anticipation",
      "The overall arc resolves with a satisfying payoff",
    ],
    proTip:
      "Future bass is emotional music, and the most common failure is chords that are harmonically correct but sonically thin. The lush, overwhelming feeling the genre depends on comes from richness — stacked voicings, layered synth textures with different timbres, and subtle movement (pitch modulation, filter sweeps) that gives the chords breath and life. A bare chord progression, however well-written, won't carry future bass. The texture is the emotion.",
  },
  "progressive-house": {
    releaseChecklist: [
      "The build develops tension across its runtime rather than plateauing early",
      "The drop pays off the anticipation the build created",
      "There's a distinctive melodic or textural element that anchors the track",
      "The mix has the width and clarity the genre demands",
      "The track tells a story across its length rather than just holding a mood",
    ],
    proTip:
      "Progressive house is about the journey, and the most common failure is a build that plateaus and loses tension before the drop ever arrives. The whole point of the genre is the sense of inevitability — the listener doesn't know exactly what's coming, but when it lands it feels like it had to. Keep the energy genuinely climbing through the build, and make sure you have one distinctive melodic or textural hook that makes the track memorable rather than just competent.",
  },
  trance: {
    releaseChecklist: [
      "The lead melody is strong enough to carry the track and has a memorable contour",
      "The build creates genuine emotional anticipation before the breakdown or climax",
      "The drop or climax lands with full emotional impact",
      "The synth layers stay clear rather than competing with each other",
      "The track delivers the emotional journey the genre promises",
    ],
    proTip:
      "Trance is melody-driven, and the most common failure is a lead that's harmonically correct but emotionally flat — it rises and falls in expected ways without a distinctive peak the listener remembers. The best trance melodies have a specific emotional contour, a moment of uplift or longing that lands. Spend your energy on the melody above everything else. A genuinely moving lead line in a rough mix beats a technically perfect production with a forgettable melody every time.",
  },
  jazz: {
    releaseChecklist: [
      "The rhythm section locks into a feel that makes you want to move",
      "Solos connect to the ensemble and the harmonic context",
      "The mix balance lets every instrument sit in its place",
      "The track has a genuine jazz feel rather than jazz-adjacent sounds",
      "The musical conversation between players is actually happening",
    ],
    proTip:
      "The right feel in jazz comes from players responding to each other, not executing parts in isolation. The most common failure in independent jazz is recording each element separately and over-quantizing, which kills the conversational interaction the genre depends on. If you can, track the rhythm section together so they're genuinely listening and responding. The music should sound like it's breathing — and that only happens when the players are reacting to each other in real time.",
  },
  funk: {
    releaseChecklist: [
      "The rhythm section sits in the pocket together",
      "The bass is present enough to anchor the rhythmic foundation",
      "Horns or synth lines support the groove without cluttering it",
      "The energy builds and releases naturally across the track",
      "The track genuinely makes the listener want to move",
    ],
    proTip:
      "Funk is pure groove, and the test is physical: if a first-time listener is nodding their head or tapping their foot by the first verse, the groove is locked. The most common failure is a rhythm section where everyone plays the right notes in the right rhythm but isn't truly listening to each other — technically correct but not together. The pocket comes from the players locking in as a unit, not from any individual part. Get the bass and drums breathing together before anything else.",
  },
  punk: {
    releaseChecklist: [
      "The energy feels genuine rather than going through the motions",
      "The production keeps the raw character the genre depends on",
      "The rhythm section is tight enough to hold the drive together",
      "The vocals cut through with urgency and attitude",
      "The track has real urgency, not just speed and volume",
    ],
    proTip:
      "Punk is about genuine energy and urgency, and the most common failure is production that sanitizes it. Over-produced punk loses the rawness that makes it work — but the wrong answer is getting stuck halfway between raw and polished without committing to either. Pick a lane based on your subgenre and commit fully. And remember the energy has to be real: a tight, urgent performance recorded roughly will always beat a careful one that's just fast and loud.",
  },
};

export function getGenreDetail(slug: string): GenreDetail | undefined {
  return genreDetails[slug];
}
