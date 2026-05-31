export type GenrePage = {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  reviewerBlurb: string;
  catchItems: string[];
  faq: { q: string; a: string }[];
};

export const genrePages: GenrePage[] = [
  {
    slug: "hip-hop",
    name: "Hip-Hop",
    metaTitle: "Hip-Hop Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your hip-hop track from genre-matched producers and MCs. Find out what's landing, what to fix, and whether it's ready to release.",
    h1: "Hip-hop feedback from producers who actually make hip-hop",
    intro:
      "MixReflect is a structured music feedback platform where independent hip-hop artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers — producers and MCs who actively make hip-hop. You find out what's landing, what's not, and what to fix before you release.",
    reviewerBlurb:
      "For hip-hop, your track gets heard by producers and artists who understand 808 weight, pocket, bar structure, and mix balance from the inside — not from a passive listening perspective.",
    catchItems: [
      "Hook isn't strong enough to carry the track — no moment worth coming back for",
      "Bars sitting under the beat — flow getting lost in the mix",
      "Intro running too long before the first bar or drop",
      "Energy flattening in the mid-section without recovery",
      "Vocal mix balance — are the lyrics intelligible and present above the production?",
    ],
    faq: [
      {
        q: "Where can I get honest feedback on my hip-hop track?",
        a: "MixReflect is built specifically for pre-release feedback on hip-hop tracks. You upload your track and genre-matched hip-hop artists review it using a structured format — covering first impression, what's landing, the main weakness, and production quality. Because reviewers respond independently without seeing each other's answers, you can identify patterns: if multiple people flag the same issue, it's real. Reddit communities like r/makinghiphop also have feedback threads, but quality is inconsistent and reviewers anchor on each other's opinions.",
      },
      {
        q: "How do I know if my hip-hop track is ready to release?",
        a: "Your hip-hop track is ready to release when multiple independent listeners can get through it without flagging the same problem. The key checks: does the hook land within the first 30 seconds? Do the vocals sit clearly on top of the beat? Does the energy hold through the mid-section? If three or more reviewers flag the same thing independently, fix it before releasing. If they each flag different things, the track is likely ready.",
      },
      {
        q: "How do I get feedback on my hip-hop beats?",
        a: "The most useful beat feedback comes from other producers who know the genre. MixReflect matches your beat to hip-hop producers who fill out a structured review covering the hook, energy arc, mix quality, and what to change before release. For beats specifically, the key feedback points are 808 balance, hi-hat patterns, loop variation, and whether there's a moment in the beat that carries the track.",
      },
      {
        q: "What are the most common problems with independent hip-hop mixes?",
        a: "The most common issue in independent hip-hop is vocals sitting too low — the beat overpowers the bars and the listener loses the flow. After that: 808s that are too loud and muddy the low end, intros that run too long before anything happens, and hooks that don't have enough separation from the verse in terms of energy or production texture. These are all things a first-time listener catches immediately but producers stop hearing after 50 listens.",
      },
    ],
  },
  {
    slug: "trap",
    name: "Trap",
    metaTitle: "Trap Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your trap beats and tracks from genre-matched trap producers. Find out if the 808s hit, the hi-hats work, and what to fix before you drop.",
    h1: "Trap beat feedback from producers who know the genre",
    intro:
      "MixReflect is a structured music feedback platform where trap artists and beatmakers upload unreleased tracks and get honest, detailed reviews from genre-matched trap producers. You find out whether the 808s are hitting, the vocal mix is right, and what to fix before you release.",
    reviewerBlurb:
      "Trap reviewers on MixReflect understand 808 weight and sub balance, hi-hat programming, trap vocal production, and what separates a trap beat that locks in from one that doesn't.",
    catchItems: [
      "808s not sitting cleanly — too loud, too quiet, or muddying the low end",
      "Hi-hat patterns feeling too mechanical or too repetitive",
      "No energy build toward a drop or hook moment",
      "Vocals sitting too high or buried against the production",
      "Track looping without enough variation to hold attention past the first minute",
    ],
    faq: [
      {
        q: "Where can I get feedback on my trap beats?",
        a: "MixReflect connects trap beatmakers with genre-matched trap producers who review tracks using a structured format. You get specific feedback on 808 balance, hi-hat programming, energy arc, and mix quality — from producers who actively make trap music. Reddit's r/makinghiphop has beat feedback threads, and trap-specific Discord servers exist, but feedback there is unstructured and often surface-level.",
      },
      {
        q: "How should 808s sit in a trap mix?",
        a: "In a trap mix, the 808 should be felt as much as heard — sitting in the sub and low-mid frequencies without muddying the kick drum. A common mistake is boosting the 808 too loud until it dominates, or letting it ring too long and compete with the next bar. The kick and 808 should complement each other: the kick punches, the 808 sustains underneath. The best way to know if yours is landing correctly is to get feedback from a listener without your studio reference context.",
      },
      {
        q: "How do I know if my trap beat is ready to sell or release?",
        a: "A trap beat is ready when multiple independent listeners can get through it without flagging the same issue. The common pre-release checks: does the 808 hit cleanly on different playback systems? Does the hi-hat pattern have enough variation to hold attention? Is there a clear moment in the beat — a switch, a drop, a break — that anchors it? Get feedback from other producers before uploading to leasing platforms.",
      },
      {
        q: "What makes a trap beat sound professional?",
        a: "A professional trap beat has clear low-end separation between the kick and 808, hi-hat velocity variation that feels human rather than programmed, a mix that translates well on both speakers and earbuds, and a structure with enough variation to hold attention across 2-3 minutes. The most common amateur mistake is a flat arrangement with no energy curve — the beat sounds the same from start to finish with no moment that makes the listener want to replay it.",
      },
    ],
  },
  {
    slug: "boom-bap",
    name: "Boom Bap",
    metaTitle: "Boom Bap Beat Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your boom bap beats from producers who know the genre. Drum punch, sample chops, low end — find out what's working before you release.",
    h1: "Boom bap feedback from producers who grew up on the genre",
    intro:
      "MixReflect is a music feedback platform where boom bap beatmakers upload unreleased beats and receive structured, honest reviews from genre-matched producers. Find out whether the drums are punching, the samples are chopped right, and the overall vibe lands before you release.",
    reviewerBlurb:
      "Boom bap reviewers understand drum punch, sample texture, loop construction, and the specific aesthetic the genre demands — the difference between a boom bap beat that hits and one that just sounds like the right era.",
    catchItems: [
      "Drums lacking punch — kick and snare not cutting through with weight",
      "Sample chops feeling choppy or unnatural in their placement",
      "Low end muddiness competing with the bass line",
      "Loop getting too repetitive without enough variation to hold 3 minutes",
      "Atmosphere and texture not matching the intended vibe",
    ],
    faq: [
      {
        q: "Where can I get feedback on my boom bap beats?",
        a: "MixReflect matches boom bap beats with producers who know the genre and review using a structured format. You get specific notes on drum punch, sample chop quality, low end balance, and whether the beat has the right feel. r/makinghiphop and boom bap Discord servers are free options, but depth and consistency of feedback varies significantly.",
      },
      {
        q: "What makes boom bap drums sound right?",
        a: "Boom bap drums need punch and presence without being overpowering. The kick should thump with weight, the snare should crack with snap, and the combination should feel like a physical impact. Common issues: kick samples that are too thin, snares that get lost in the sample, or hi-hats that feel too programmed rather than swung. The drum pattern needs a natural feel — slight timing variations and velocity differences matter more in boom bap than in other genres.",
      },
      {
        q: "How do I know if my boom bap beat is ready?",
        a: "A boom bap beat is ready when the drums punch through the sample, the low end sits cleanly, and the loop has enough texture to sustain attention across a full verse length. Get feedback from 3-5 producers independently and look for patterns — if multiple people flag the same element (drums, sample placement, vibe), fix it. If feedback is scattered, the beat is likely ready.",
      },
    ],
  },
  {
    slug: "drill",
    name: "Drill",
    metaTitle: "Drill Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your drill track from genre-matched producers. UK drill, Chicago drill, NY drill — find out what's landing before you release.",
    h1: "Drill feedback from producers who know the sound",
    intro:
      "MixReflect is a structured music feedback platform where drill artists and producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. UK drill, Chicago drill, NY drill — reviewers are matched to your specific sound, not just the parent genre.",
    reviewerBlurb:
      "Drill reviewers understand the dark atmosphere, slide bass movement, vocal cadence, and production texture that define the genre — and can tell you whether your track is hitting that standard or falling short of it.",
    catchItems: [
      "Slide bass not sitting correctly in the low end",
      "Dark atmosphere not fully landing — production feels too bright or too clean",
      "Vocal delivery and ad-lib placement not matching the production's energy",
      "Energy curve of the track — no variation across the runtime",
      "Mix balance between vocals and the instrumental",
    ],
    faq: [
      {
        q: "Where can I get feedback on my drill track?",
        a: "MixReflect matches drill tracks with genre-matched producers and artists who review using a structured format. You get specific feedback on atmosphere, vocal mix, bass balance, and energy arc. Drill-specific Discord servers exist and some Reddit threads cover the genre, but structured, independent feedback is hard to get through those channels.",
      },
      {
        q: "What makes a drill beat hit correctly?",
        a: "A drill beat needs a dark, menacing atmosphere created through minor melodies, dark bass movement, and specific drum patterns — typically a sliding 808 bass line, rolling hi-hats, and a snare that sits in the pocket. The most common issues: production that's too clean or bright (kills the atmosphere), 808 slides that aren't timed correctly to the melody, and a mix that lets the instrumental overpower the vocal delivery.",
      },
      {
        q: "How do I know if my drill track is ready to release?",
        a: "Get feedback from multiple independent drill producers before releasing. The critical checks: does the atmosphere hit immediately? Is the vocal delivery sitting right against the beat without being buried? Does the energy hold across the full track? If multiple reviewers flag the same element, fix it. Drill has a very specific sonic standard — tracks that miss the atmosphere or have the wrong bass balance stand out immediately to genre listeners.",
      },
    ],
  },
  {
    slug: "rnb",
    name: "R&B",
    metaTitle: "R&B Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your R&B track from genre-matched artists. Vocals, production, emotional arc — find out what's landing before you release.",
    h1: "R&B feedback from artists who understand the genre",
    intro:
      "MixReflect is a structured music feedback platform where R&B artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. R&B is detail work — vocal runs, chord resolution, emotional arc — and feedback from artists who understand the genre is the only kind worth acting on.",
    reviewerBlurb:
      "R&B reviewers on MixReflect understand vocal production, chord progressions, the emotional arc of an R&B track, and what the genre's production standard sounds like in 2026 — across both contemporary and neo-soul directions.",
    catchItems: [
      "Vocal runs feeling rushed, pitchy, or out of pocket with the production",
      "Chord progression not resolving with enough emotional weight",
      "Production too polished and overwhelming the vocal vulnerability",
      "Ad-libs cluttering the main melody rather than supporting it",
      "Dynamic curve between verse and chorus — not differentiated enough",
    ],
    faq: [
      {
        q: "Where can I get honest feedback on my R&B track?",
        a: "MixReflect matches R&B tracks with genre-matched artists who review using a structured format covering first impression, vocal performance, production quality, and what to fix before release. R&B feedback specifically requires reviewers who understand vocal production, chord movement, and the genre's emotional expectations — casual listeners can feel when something's off but often can't say why. Genre-matched peer review gives you feedback that's specific enough to act on.",
      },
      {
        q: "How do I know if my R&B vocals are mixed correctly?",
        a: "In a well-mixed R&B track, the lead vocal sits clearly above the production with presence and warmth — not buried, not harsh, not so loud it sounds disconnected from the beat. Reverb should give depth without pushing the vocal too far back. The common issues: too much reverb making the vocal feel distant and less intimate, or a vocal that's too dry and exposed against a lush production. The best test is to get a fresh listener to tell you whether the vocal feels present and emotional — after 100 listens you can no longer hear it clearly.",
      },
      {
        q: "What makes an R&B track feel emotionally complete?",
        a: "An emotionally complete R&B track has a vocal performance that commits to the feeling, a chord progression that builds and resolves with intent, and an arrangement that creates space for the emotion to land. The most common issues in independent R&B: vocal performances that hold back (playing it safe rather than committing), productions that are so layered they leave no space for the voice to breathe, and bridges that disconnect from the track's emotional arc rather than deepening it.",
      },
    ],
  },
  {
    slug: "electronic",
    name: "Electronic",
    metaTitle: "Electronic Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your electronic music from genre-matched producers. Arrangement, mixdown, sound design — find out what to fix before you release.",
    h1: "Electronic music feedback from producers who know the craft",
    intro:
      "MixReflect is a structured music feedback platform where electronic music producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Whether you're making house, techno, ambient, or anything in between, reviewers are matched to your specific sound within the electronic umbrella.",
    reviewerBlurb:
      "Electronic music reviewers understand arrangement structure, sound design quality, mixdown clarity, and whether a track achieves what it sets out to do — from the first synth to the final fade.",
    catchItems: [
      "Build-up doesn't create enough anticipation — drop feels anticlimactic",
      "Sound design lacks a distinctive identity or feels generic",
      "Arrangement too repetitive — not enough variation to hold attention",
      "Low end muddiness or lack of clarity in the mix",
      "Transitions between sections feeling abrupt rather than intentional",
    ],
    faq: [
      {
        q: "Where can I get feedback on my electronic music?",
        a: "MixReflect matches electronic tracks with producers who understand the genre and review using a structured format. You get specific feedback on arrangement, sound design, mixdown, and energy arc. For sub-genres (house, techno, ambient, lo-fi), the platform matches your track to reviewers within that specific sound. Reddit communities like r/edmproduction and genre Discord servers are free alternatives but feedback is inconsistent and unstructured.",
      },
      {
        q: "How do I know if my electronic track arrangement is working?",
        a: "A working electronic arrangement creates clear tension and release — the listener knows something is building and feels it pay off. The most common arrangement problems: builds that go on too long and lose tension, drops that don't differentiate enough from what came before, and mid-sections that drift without enough variation to hold attention. The key test is whether a first-time listener can feel the structure of the track — where the energy is going and whether it gets there.",
      },
      {
        q: "What makes an electronic mix sound professional?",
        a: "A professional electronic mix has clear separation between elements, a low end that translates across different playback systems, and enough stereo width in the mid-high frequencies without phasing issues. The most common amateur mistakes: low end that's too heavy and muddy on non-studio speakers, a mix that sounds good on headphones but loses energy on speakers, and high frequencies that are too harsh on cheaper playback systems. Getting feedback from listeners on different setups is the fastest way to catch these issues.",
      },
    ],
  },
  {
    slug: "house",
    name: "House",
    metaTitle: "House Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your house music from genre-matched producers. Groove, mix, arrangement — find out if your track would actually work on a dance floor.",
    h1: "House music feedback from producers who play and make it",
    intro:
      "MixReflect is a structured music feedback platform where house producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. House is groove, feel, and function — feedback from other house producers is the only feedback that tells you whether it actually works.",
    reviewerBlurb:
      "House reviewers on MixReflect understand groove, kick-bass pocket, chord movement, and what makes a track function on a dance floor versus just sounding like house music.",
    catchItems: [
      "Groove not locking — kick and bass not sitting in pocket with each other",
      "Build-up releasing without enough payoff at the drop",
      "Low end muddiness undermining the groove",
      "Track running too long without enough variation to hold the floor",
      "Whether the energy sustains across a full listen without losing momentum",
    ],
    faq: [
      {
        q: "Where can I get feedback on my house music?",
        a: "MixReflect matches house tracks with genre-matched house producers who review using a structured format. You get specific feedback on groove, low end clarity, arrangement, and whether the track would function in a DJ set. House-specific Discord servers and producer communities on Reddit exist, but structured, independent feedback from people who actively make house music is rare through those channels.",
      },
      {
        q: "How do I know if my house track has the right groove?",
        a: "A house track with the right groove has a kick and bass that lock together — the listener feels the pulse immediately and doesn't have to think about it. The most common groove issues: a kick that's slightly off the grid in a way that feels wrong rather than human, a bass line that doesn't complement the kick's timing, or a chord stab timing that breaks the pocket. The honest test is whether a producer who didn't make the track feels compelled to move — that's groove, and it's either there or it isn't.",
      },
      {
        q: "What makes a house track work in a DJ set?",
        a: "A DJ-functional house track has a clean intro and outro that allow mixing, enough repetition to let the groove lock in before transitioning, and an energy level that fits within a set rather than disrupting the flow. The most common issues for independent house producers: tracks with intros too short for mixing in, arrangements that peak too early and leave nothing for the last two minutes, and productions whose energy doesn't match the BPM (a track can feel slow even at 125bpm if the groove doesn't lock).",
      },
    ],
  },
  {
    slug: "deep-house",
    name: "Deep House",
    metaTitle: "Deep House Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your deep house track from genre-matched producers. Atmosphere, groove, warmth — find out if the vibe is landing before you release.",
    h1: "Deep house feedback from producers who understand the vibe",
    intro:
      "MixReflect is a structured music feedback platform where deep house producers upload unreleased tracks and receive honest reviews from genre-matched peers. Deep house is atmosphere, subtlety, and feel — the kind of feedback that matters comes from producers who understand the genre deeply, not just listeners who like the sound.",
    reviewerBlurb:
      "Deep house reviewers understand the warmth, chord complexity, and atmospheric texture the genre demands — and can tell you whether your track genuinely achieves that or just sounds adjacent to it.",
    catchItems: [
      "Atmosphere too thin — lacks the warmth and depth the genre requires",
      "Chord progression too predictable or lacking the harmonic complexity deep house demands",
      "Low end muddiness undermining the groove",
      "Arrangement overstaying its welcome without enough subtle evolution",
      "Whether the track would actually work in a late-night deep house context",
    ],
    faq: [
      {
        q: "Where can I get feedback on my deep house track?",
        a: "MixReflect matches deep house tracks with genre-matched producers who review using a structured format. Deep house is a genre where the difference between 'getting it' and 'missing it' is subtle — feedback from producers who actively make deep house is meaningfully different from generic electronic feedback. That specificity is what makes the feedback worth acting on.",
      },
      {
        q: "What makes deep house feel right versus just house music?",
        a: "Deep house is defined by atmosphere, warmth, and harmonic depth. Where regular house is about groove and energy, deep house is about texture and mood. The chord progressions tend to be more complex, the production warmer and more organic-feeling, and the arrangement more patient — willing to sit in a groove without needing to build to a peak. The most common mistake is producing something that has house structure but lacks the atmospheric quality that makes it deep.",
      },
      {
        q: "How do I know if my deep house mix has the right warmth?",
        a: "A warm deep house mix has softened high frequencies, a full and present low-mid range, and a sense of space and room around the elements. Common issues: mixes that are too bright and clinical (sounds more like tech house), too much sub-bass creating muddiness, or a stereo image that's too narrow. The warmth test: play the track in a room and ask whether it makes the listener feel settled and immersed. If it still feels sharp or restless, the atmosphere isn't there yet.",
      },
    ],
  },
  {
    slug: "techno",
    name: "Techno",
    metaTitle: "Techno Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your techno track from genre-matched producers. Drive, mix, arrangement — find out whether your track holds up before you release.",
    h1: "Techno feedback from producers who make it",
    intro:
      "MixReflect is a structured music feedback platform where techno producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Techno is function — does it drive, does it hold, does it build? Feedback from other techno producers is the only kind that answers those questions accurately.",
    reviewerBlurb:
      "Techno reviewers understand drive, tension, low-end weight, and what it means for a track to function over a 10-minute play in a club environment — not just sound correct in headphones.",
    catchItems: [
      "Drive missing — not enough propulsive energy through the groove",
      "Mix too clean or too dirty for the intended context",
      "Build and release structure not delivering the expected payoff",
      "Whether the track has enough variation to sustain a long play",
      "Low-end weight and clarity — kick and bass relationship",
    ],
    faq: [
      {
        q: "Where can I get feedback on my techno track?",
        a: "MixReflect matches techno tracks with genre-matched producers who review using a structured format. Techno is a genre where feedback needs to come from people who understand the context — how the track would function in a DJ set, whether the kick has the right weight, whether the drive sustains over a long runtime. Generic electronic feedback doesn't answer these questions.",
      },
      {
        q: "What makes a techno track work in a DJ set?",
        a: "A DJ-functional techno track has a long enough intro and outro for mixing, a kick drum that has weight without frequency clashes with other tracks at similar BPMs, a drive that sustains across 8-10 minutes without becoming monotonous, and a build structure that gives a DJ options for layering and transitioning. Common issues: tracks that peak too early, mixes that sound good on headphones but lose their drive on a club system, and arrangements that are too minimal to function over a long play.",
      },
      {
        q: "How do I know if my techno kick sounds right?",
        a: "A techno kick needs weight in the low frequencies without muddying the sub-bass, enough attack to punch through the mix, and a tail that complements rather than clashes with the bass element. The most common kick issues: too much low-mid buildup creating boominess, a kick that sounds strong in headphones but disappears on a club system, or a tail that's too long and muddies consecutive hits. Test on multiple systems — headphones, monitors, and ideally a system with genuine sub response.",
      },
    ],
  },
  {
    slug: "lo-fi",
    name: "Lo-Fi",
    metaTitle: "Lo-Fi Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your lo-fi track from genre-matched producers. Texture, warmth, vibe — find out if the atmosphere is landing before you release.",
    h1: "Lo-fi feedback from producers who know what the vibe actually is",
    intro:
      "MixReflect is a structured music feedback platform where lo-fi producers upload unreleased tracks and receive honest reviews from genre-matched peers. Lo-fi is texture, warmth, and mood — and the difference between lo-fi that works and lo-fi that misses is subtle enough that you need feedback from producers who are genuinely inside the genre.",
    reviewerBlurb:
      "Lo-fi reviewers understand vinyl texture, drum feel, chord atmosphere, and what makes a lo-fi beat feel lived-in versus produced — the specific quality that separates lo-fi that works from lo-fi that just sounds like lo-fi.",
    catchItems: [
      "Vinyl crackle and texture not sitting naturally — feels applied rather than intrinsic",
      "Samples feeling too digital and clean, losing the lo-fi warmth",
      "Drum pattern too stiff — needs to breathe and swing",
      "Chord progression not matching the emotional mood of the beat",
      "Whether the atmosphere is consistent throughout or breaks unexpectedly",
    ],
    faq: [
      {
        q: "Where can I get feedback on my lo-fi beats?",
        a: "MixReflect matches lo-fi beats with genre-matched producers who review using a structured format. Lo-fi has a very specific quality that's hard to evaluate from outside the genre — the warmth, the texture, the looseness of the drums. Genre-matched feedback from other lo-fi producers gives you notes specific enough to act on. Lo-fi communities on Reddit and Discord exist but feedback is usually brief reactions rather than structured critique.",
      },
      {
        q: "What makes lo-fi music feel authentic?",
        a: "Authentic lo-fi has drum timing that breathes — slightly loose, slightly human — a warmth in the production from tape saturation or vinyl processing, chord progressions that feel melancholic and unhurried, and a texture that sounds like it's been lived in rather than produced in a clean studio. The most common mistake is applying lo-fi effects (crackle, filters, saturation) to a production that's fundamentally too clean — the effects sit on top rather than being part of the sound.",
      },
      {
        q: "How long should a lo-fi beat be?",
        a: "Most lo-fi beats released on streaming platforms run between 2 and 4 minutes. Lo-fi for YouTube compilations and Spotify playlists often runs 2:30–3:30. The key is whether the beat sustains its atmosphere across the runtime — lo-fi that starts repeating without enough subtle variation loses the listener around the 90-second mark. The test: does the beat still feel interesting at the 2-minute point on a first listen?",
      },
      {
        q: "How do I get my lo-fi music on Spotify playlists?",
        a: "Lo-fi Spotify playlists have a specific production standard — the tracks need to sound cohesive with each other, which means your lo-fi needs to match the warmth, tempo range (typically 70-90 BPM), and atmospheric quality of the playlist you're targeting. Before pitching to curators, get feedback from lo-fi producers on whether your track's texture and vibe is consistent with current lo-fi standards. Then use the Spotify for Artists pitch tool for editorial playlists and SubmitHub for independent lo-fi curators.",
      },
    ],
  },
  {
    slug: "edm",
    name: "EDM",
    metaTitle: "EDM Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your EDM track from genre-matched producers. Drop, build, energy — find out what's working before you release.",
    h1: "EDM feedback from producers who know whether the drop actually hits",
    intro:
      "MixReflect is a structured music feedback platform where EDM producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Drop, build, energy — reviewers evaluate your track against the standard of the genre and tell you exactly what's landing and what isn't.",
    reviewerBlurb:
      "EDM reviewers understand build structure, drop design, mix width, and what it takes for a track to hold up in a festival context — not just sound good in a studio.",
    catchItems: [
      "Build not creating enough anticipation — tension releasing too early or too weakly",
      "Drop not hitting hard enough — lacks the punch and impact the genre demands",
      "Mix lacking the width and stereo presence expected in the genre",
      "Track structure too predictable — no moment that surprises",
      "Sound design that sounds generic rather than distinctive",
    ],
    faq: [
      {
        q: "Where can I get feedback on my EDM track?",
        a: "MixReflect matches EDM tracks with genre-matched producers who review using a structured format covering build structure, drop impact, mix quality, and sound design. EDM-specific communities on Reddit (r/edmproduction) and Discord servers are free options, but feedback quality varies and isn't independent — early opinions in a thread shape everything that follows.",
      },
      {
        q: "How do I make my EDM drop hit harder?",
        a: "A harder-hitting drop needs low-end weight, stereo width, and a clear contrast from what came before. The most common issues: drops that don't differentiate enough from the build (the listener doesn't feel the moment clearly), drops with low end that's muddy rather than punchy, and drops with too many elements competing instead of a focused punch. The build needs to strip elements away so the drop feels like an addition — not just a continuation at a higher volume.",
      },
      {
        q: "What makes an EDM track ready for a playlist or festival context?",
        a: "A playlist-ready EDM track has a drop that hits clearly and immediately, a build that creates genuine anticipation, a mix that translates across different sound systems (not just studio monitors), and a structure that makes sense as a standalone track — not just as a DJ tool. For festival context specifically: the drop needs to function at high volume and low frequencies, which requires testing on a system with real sub-bass, not just headphones or desktop speakers.",
      },
    ],
  },
  {
    slug: "ambient",
    name: "Ambient",
    metaTitle: "Ambient Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your ambient music from genre-matched producers. Texture, space, emotional arc — find out if it's working before you release.",
    h1: "Ambient music feedback from producers who understand the form",
    intro:
      "MixReflect is a structured music feedback platform where ambient producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Ambient lives or dies on texture, space, and emotional arc — and only listeners who understand the genre can tell you whether it's genuinely transporting or just filling space.",
    reviewerBlurb:
      "Ambient reviewers understand textural depth, dynamic space, emotional arc, and what separates ambient that genuinely transports a listener from ambient that sounds like background noise.",
    catchItems: [
      "Texture too thin — lacks the depth and presence that makes ambient immersive",
      "Emotional arc not developing across the track — it doesn't go anywhere",
      "Mix too clinical — doesn't breathe or feel like a space",
      "Track overstaying its welcome without enough evolution to justify its length",
      "Whether it creates genuine atmosphere or just occupies sonic space",
    ],
    faq: [
      {
        q: "Where can I get feedback on my ambient music?",
        a: "MixReflect matches ambient tracks with genre-matched producers who review using a structured format. Ambient is a genre where 'does it work' is a subtle question — it requires listeners who understand the form and can tell you whether the texture, space, and emotional arc are doing what they should. Generic music feedback platforms don't give you that specificity.",
      },
      {
        q: "How do I know if my ambient track has enough development?",
        a: "An ambient track with sufficient development creates a journey — even a subtle one. The listener arrives somewhere different from where they started, even if the changes are gradual. The most common issue is ambient that establishes an atmosphere in the first minute and then simply maintains it for 8 minutes without evolution. Small changes in texture, filter movement, layering and unfolding of elements, or shifts in register all provide the development that makes the runtime feel intentional rather than indulgent.",
      },
      {
        q: "What makes ambient music feel immersive versus generic?",
        a: "Immersive ambient creates a specific place or mood — it feels like it could only be that track, not a generic ambient texture. Generic ambient uses the same reverb presets, pad sounds, and structures. The differentiator is specificity: specific textural choices, a specific emotional target, a specific kind of space. The easiest way to identify whether yours has it is to ask a producer who makes ambient music whether they could describe what's distinctive about the track's atmosphere — if they can't, it's probably too generic.",
      },
    ],
  },
  {
    slug: "synthwave",
    name: "Synthwave",
    metaTitle: "Synthwave Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your synthwave track from genre-matched producers. Aesthetic, production, emotional arc — find out if it's hitting before you release.",
    h1: "Synthwave feedback from producers who live in the aesthetic",
    intro:
      "MixReflect is a structured music feedback platform where synthwave producers upload unreleased tracks and receive honest reviews from genre-matched peers. Synthwave is aesthetic, mood, and production style — feedback from producers who understand the genre tells you whether your track nails it or misses the mark.",
    reviewerBlurb:
      "Synthwave reviewers understand the production aesthetic, the cinematic quality the genre demands, and the specific balance between nostalgia and originality that makes a synthwave track work in 2026.",
    catchItems: [
      "Aesthetic not landing — production feels too modern, too generic, or too imitative",
      "Bass and synth lead not sitting correctly together in the frequency space",
      "Drum programming feeling too mechanical rather than having a driving, intentional feel",
      "Atmosphere lacking the cinematic quality the genre demands",
      "Whether the emotional arc resolves in a satisfying way",
    ],
    faq: [
      {
        q: "Where can I get feedback on my synthwave track?",
        a: "MixReflect matches synthwave tracks with genre-matched producers who review using a structured format. Synthwave has a very specific aesthetic standard — the feedback needs to come from people who understand the genre's production conventions and can tell you whether your track genuinely achieves the sound or just sounds retro-adjacent.",
      },
      {
        q: "What makes a synthwave track feel authentic?",
        a: "Authentic synthwave balances genuine nostalgia references with a production quality that doesn't sound like it was made on 1980s equipment. The lead synths should have warmth and character, the bass should have weight and movement, the drums should have a driving, gated quality, and the overall production should feel cinematic without being generic. The most common mistake is stacking clichés — gated reverb, arpeggiated synths, driving bassline — without the underlying musical quality to make them interesting.",
      },
      {
        q: "How do I know if my synthwave mix is right for the genre?",
        a: "A well-mixed synthwave track has the lead synth cutting through with presence and character, a bass that drives underneath without competing with the kick, and a drum sound that's present and punchy without dominating. The stereo image should be wide and immersive. Common issues: mixes that are too sparse and thin (the retro aesthetic doesn't excuse a lack of presence), kick drums that don't have enough punch, or lead synths that compete with the bass in the low-mid frequencies.",
      },
    ],
  },
  {
    slug: "pop",
    name: "Pop",
    metaTitle: "Pop Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your pop song from genre-matched artists. Hook, production, vocal mix — find out if it's ready to release.",
    h1: "Pop music feedback from artists who know what makes a song land",
    intro:
      "MixReflect is a structured music feedback platform where pop artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Pop is hook, feel, and commercial clarity — and the only way to know if your song has those things is to hear from listeners who haven't already heard it 300 times in production.",
    reviewerBlurb:
      "Pop reviewers understand hook strength, chorus payoff, vocal mix, production clarity, and what the genre's release standard sounds like — across mainstream pop, indie pop, and bedroom pop directions.",
    catchItems: [
      "Chorus not hitting hard enough — hook needs more energy and payoff",
      "Production mix too cluttered — lead vocal not cutting through clearly",
      "Pre-chorus not building enough tension before the chorus releases",
      "Bridge feeling disconnected from the rest of the track emotionally",
      "Whether the song has a clear, memorable identity a listener could describe afterward",
    ],
    faq: [
      {
        q: "Where can I get feedback on my pop song?",
        a: "MixReflect matches pop tracks with genre-matched artists who review using a structured format covering first impression, hook strength, vocal clarity, production quality, and what to fix before release. For pop specifically, the most critical feedback is on the chorus — whether it has enough payoff — and the vocal mix — whether the lead sits clearly above the production. Friends and family feedback on pop songs is particularly unreliable because they'll respond to the familiarity of the artist rather than the objective quality of the song.",
      },
      {
        q: "How do I know if my pop chorus is strong enough?",
        a: "A strong pop chorus creates a moment — the listener feels something shift when it arrives, and they want to hear it again. The most common issues with independent pop choruses: the melodic hook isn't distinctive enough to be remembered after one listen, the production doesn't differentiate enough from the verse (the chorus should feel bigger, wider, or higher energy), or the vocal performance holds back rather than committing. The honest test: play the chorus to someone who hasn't heard the track and ask if they could hum it 10 minutes later.",
      },
      {
        q: "What makes a pop vocal mix sound professional?",
        a: "A professional pop vocal mix has the lead vocal clearly above the production — present, warm, and intelligible — with backing vocals supporting without competing. The common issues in independent pop: lead vocals that are too wet with reverb (sounds dreamy but loses presence), backing harmonies that are too loud and pull focus, and a lead vocal that's over-compressed and loses its natural dynamics. The vocal should feel like the center of the track, not like one element among many.",
      },
      {
        q: "How do I get my pop song on Spotify playlists?",
        a: "For editorial playlists, use the Spotify for Artists pitch tool at least 7 days before your release date. For independent curators, use SubmitHub or direct outreach. Before either, make sure your pop song has cleared a quality check: the chorus needs to hit immediately, the production needs to match the playlist's sonic standard, and the vocal needs to be clearly mixed. Independent pop tracks are often rejected from pop playlists because the production standard is below the playlist's existing tracks — get feedback from pop artists first.",
      },
    ],
  },
  {
    slug: "indie-pop",
    name: "Indie Pop",
    metaTitle: "Indie Pop Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your indie pop track from genre-matched artists. Hook, personality, production — find out what's working before you release.",
    h1: "Indie pop feedback from artists who understand the balance",
    intro:
      "MixReflect is a structured music feedback platform where indie pop artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Indie pop balances commercial hooks with artistic personality — and that balance is exactly what makes it hard to self-evaluate after weeks in the studio.",
    reviewerBlurb:
      "Indie pop reviewers understand what makes the genre feel fresh versus generic, how much polish is too much, and whether your track has the personality and hook quality to stand out.",
    catchItems: [
      "Production too polished — losing the indie character that makes it distinctive",
      "Chorus hook not distinctive enough to be remembered after one listen",
      "Vocal performance sitting uncomfortably in the mix",
      "Energy between verse and chorus not differentiated enough",
      "Whether the track has a genuine sonic identity or sounds like a reference track imitation",
    ],
    faq: [
      {
        q: "Where can I get feedback on my indie pop track?",
        a: "MixReflect matches indie pop tracks with genre-matched artists who review using a structured format. Indie pop is a genre where the line between 'tastefully lo-fi' and 'underproduced' is genuinely hard to find on your own — feedback from other indie pop artists who understand that balance is more useful than generic music feedback.",
      },
      {
        q: "How polished should an indie pop production be?",
        a: "Indie pop exists on a spectrum from very lo-fi bedroom recordings to near-major-label polish. The right production level depends on the specific sound you're going for. The common mistake is not committing to a level — tracks that are half-polished feel unintentional. Either lean into the rawness or commit to the polish. The other common issue is over-producing a fundamentally good song until the personality is gone. If your reference artists make music that feels slightly rough, match that and don't over-correct.",
      },
      {
        q: "What makes an indie pop song feel like it has personality?",
        a: "An indie pop song with personality has something specific about it — a vocal quirk, an unusual instrument choice, a production texture, a lyrical angle — that a listener could point to as distinctive. Generic indie pop uses all the right sounds but doesn't have a quality that makes it feel like it could only be that artist. The honest test: would someone who knows the genre be able to describe what's unique about your track? If not, it may be too derivative.",
      },
    ],
  },
  {
    slug: "indie-rock",
    name: "Indie Rock",
    metaTitle: "Indie Rock Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your indie rock track from genre-matched artists. Energy, mix, arrangement — find out what's landing before you release.",
    h1: "Indie rock feedback from artists who know the sound",
    intro:
      "MixReflect is a structured music feedback platform where indie rock artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Indie rock lives in the energy, the arrangement, and whether the song has something to say — and getting honest feedback on all three is exactly what the platform is built for.",
    reviewerBlurb:
      "Indie rock reviewers understand guitar mix, band dynamics, song structure, and the specific quality that makes an indie rock track feel like it has something behind it rather than just the right sounds.",
    catchItems: [
      "Guitar mix too muddy — instruments competing in the same frequency range",
      "Vocal not cutting through the band with enough presence",
      "Song structure too predictable — needs a moment that surprises",
      "Energy not building and releasing with enough impact across the track",
      "Whether the arrangement is serving the song or just filling space",
    ],
    faq: [
      {
        q: "Where can I get feedback on my indie rock track?",
        a: "MixReflect matches indie rock tracks with genre-matched artists who review using a structured format. Indie rock feedback is most useful when it comes from people who understand both the sonic conventions of the genre and what makes a song feel like it has something to say — not just whether the guitar sounds good.",
      },
      {
        q: "How do I get my indie rock mix to sound clear without losing the energy?",
        a: "The indie rock mixing challenge is preserving energy while creating separation. The most common issue is guitars competing in the same frequency range — two rhythm guitars both fighting for the same mid-range space. Solutions: frequency complementing between guitar tracks, slightly different amp tones, and keeping guitars panned differently. The vocal needs its own clear window in the mid-range, which often means cutting competing guitar frequencies at the vocal's fundamental range. The energy comes from the performance, not from everything being louder.",
      },
      {
        q: "What makes an indie rock song feel like it has something behind it?",
        a: "Indie rock songs with something behind them have a genuine emotional or lyrical point of view — the listener feels that the song is about something specific, not just going through the motions of a song structure. Production-wise, they have a moment — a guitar line, a vocal delivery, a dynamic shift — that feels like it was placed with intention. The easiest way to evaluate this objectively is to ask a fresh listener what they think the song is about or what moment they'd go back to. If they can't answer, the song may not have enough of it yet.",
      },
    ],
  },
  {
    slug: "rock",
    name: "Rock",
    metaTitle: "Rock Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your rock track from genre-matched artists. Mix, arrangement, energy — find out what's working before you release.",
    h1: "Rock music feedback from artists who know the genre",
    intro:
      "MixReflect is a structured music feedback platform where rock artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Whether you're making classic rock, modern rock, or anything in between, get feedback on your mix, your arrangement, and whether the energy lands the way you intend.",
    reviewerBlurb:
      "Rock reviewers on MixReflect understand guitar tone, rhythm section balance, vocal presence, and what it takes for a rock track to have the energy and impact the genre demands.",
    catchItems: [
      "Guitar tone too muddy, too thin, or too harsh for the track's needs",
      "Drums sitting too low in the mix and losing the track's physical impact",
      "Vocal not sitting clearly above the band",
      "Arrangement not building to a satisfying peak or release",
      "Whether the track has a hook worth coming back for",
    ],
    faq: [
      {
        q: "Where can I get feedback on my rock track?",
        a: "MixReflect matches rock tracks with genre-matched artists who review using a structured format covering the mix, the arrangement, energy, and what to fix before release. Rock feedback from people who actively make rock is more useful than generic listener feedback — they can tell you specifically whether the guitar tone is serving the song, whether the rhythm section is locked in, and whether the vocal is sitting right.",
      },
      {
        q: "How do I get my rock mix to sound powerful?",
        a: "A powerful rock mix has drums with real impact (kick that punches, snare that cracks), guitars that are thick without muddying each other, and a vocal that cuts through without fighting the band. The most common issues: kick drums that don't punch through a dense guitar arrangement, rhythm guitars that compete in the same frequency range creating mud, and vocals that are too low to feel like the lead element. The key is frequency separation — every element needs its own space in the mix.",
      },
      {
        q: "What makes a rock song feel like it has real energy?",
        a: "Real energy in a rock song comes from the performance, not the production. A track with a tight, committed performance will feel energetic even with a raw mix. The production's job is to not lose that energy — specifically, not over-compressing the drums until they lose dynamics, not burying the vocal until it sounds passive, and not layering so many guitars that the arrangement becomes a wall of sound with no space to breathe. Energy is destroyed more often by over-production than under-production.",
      },
    ],
  },
  {
    slug: "alternative",
    name: "Alternative",
    metaTitle: "Alternative Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your alternative track from genre-matched artists. Find out if your sound is landing and what to fix before you release.",
    h1: "Alternative music feedback from artists who get it",
    intro:
      "MixReflect is a structured music feedback platform where alternative artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Alternative covers a lot of ground — what matters is whether your specific sound has the identity and impact you're going for, and that's exactly what structured peer feedback tells you.",
    reviewerBlurb:
      "Alternative reviewers understand sonic identity, emotional intensity, and what separates alternative music that stands out from music that sits safely in the middle of its genre.",
    catchItems: [
      "Production lacking a distinctive character — sounds like a genre reference rather than an original",
      "Emotional intensity not building through the track the way it should",
      "Mix balance between instruments and vocals not serving the song",
      "Song structure too safe — not taking risks worth taking",
      "Whether the track stands out from the genre or blends into it",
    ],
    faq: [
      {
        q: "Where can I get feedback on my alternative music?",
        a: "MixReflect matches alternative tracks with genre-matched artists who review using a structured format. Alternative is broad, so specifying your reference sound when uploading helps match you to reviewers who understand your specific direction. The feedback covers first impression, sonic identity, mix quality, and what to change before release.",
      },
      {
        q: "How do I know if my alternative track has enough identity?",
        a: "An alternative track with identity has something specific that a listener could point to as distinctive — a production texture, a vocal approach, a structural choice, a sonic element. The easiest test: ask someone to describe what's unique about your track. If they can't identify anything specific, the track may be too derivative of its references. Identity doesn't require being experimental — it just requires committing to something specific rather than defaulting to genre conventions.",
      },
    ],
  },
  {
    slug: "singer-songwriter",
    name: "Singer-Songwriter",
    metaTitle: "Singer-Songwriter Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your singer-songwriter music from genre-matched artists. Lyrics, melody, arrangement — find out if it's connecting before you release.",
    h1: "Singer-songwriter feedback from artists who understand the format",
    intro:
      "MixReflect is a structured music feedback platform where singer-songwriters upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Singer-songwriter tracks live on lyrics, melody, and emotional truth — and after weeks in the studio, you've completely lost the ability to hear whether yours is achieving that.",
    reviewerBlurb:
      "Singer-songwriter reviewers understand vocal performance, lyrical arc, arrangement balance, and whether the emotional core of a song is landing — things that casual listeners feel but often can't articulate.",
    catchItems: [
      "Vocal performance holding back — the emotion isn't fully committing",
      "Arrangement too sparse or too busy for the song",
      "A lyrical line or couplet that breaks the mood or feels out of place",
      "Melody not strong enough to carry a minimal production across the full runtime",
      "Whether the song feels like it has something genuine to say",
    ],
    faq: [
      {
        q: "Where can I get feedback on my singer-songwriter music?",
        a: "MixReflect matches singer-songwriter tracks with genre-matched artists who review using a structured format. Singer-songwriter feedback is most useful when it comes from people who understand the format — they can tell you whether the melody is strong enough, whether the lyrical arc lands, and whether the vocal performance is committing to the emotion. Generic listener feedback on singer-songwriter music tends to be vague because the things that make or break the format are specific and technical.",
      },
      {
        q: "How do I know if my singer-songwriter vocal performance is landing?",
        a: "A landing vocal performance feels like the singer believes every word. The most common issues: vibrato used as a default rather than intentionally, breath patterns that feel rehearsed rather than natural, and performances that play it safe on the emotionally demanding lines rather than committing. The honest test is to record the vocal when you're thinking about what the song is actually about rather than whether you're singing it correctly. That shift in focus often produces the take that connects.",
      },
      {
        q: "How sparse is too sparse for a singer-songwriter arrangement?",
        a: "Too sparse is when the production doesn't give the listener enough to hold onto between vocal phrases — when the spaces feel empty rather than intentional. A single guitar or piano is enough if the playing has texture and the vocal is strong. The mistake is assuming that minimal automatically means intimate. Minimal only works when every element placed is intentional and the vocal performance is strong enough to carry the listener without production support.",
      },
      {
        q: "How do I get feedback on my lyrics before releasing a song?",
        a: "Singer-songwriter feedback on MixReflect includes lyrical notes — reviewers flag lines that break the mood, couplets that feel out of place, or themes that don't resolve. For more focused lyric feedback, songwriter-specific communities and forums can give you line-by-line notes. The key is getting feedback from listeners who engage with lyrics rather than casual listeners who primarily process music as sound — the two groups will give you very different responses to the same song.",
      },
    ],
  },
  {
    slug: "folk",
    name: "Folk",
    metaTitle: "Folk Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your folk music from genre-matched artists. Authenticity, arrangement, vocal — find out if it's landing before you release.",
    h1: "Folk music feedback from artists who understand the tradition",
    intro:
      "MixReflect is a structured music feedback platform where folk artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Folk is about authenticity, story, and feel — and the feedback that matters is from artists who can hear whether yours is genuinely achieving that.",
    reviewerBlurb:
      "Folk reviewers understand authenticity, storytelling, instrumental arrangement, and the specific quality that makes folk music feel lived-in versus performed.",
    catchItems: [
      "Production too polished — losing the folk character and authenticity",
      "Story or lyrical arc not resolving cleanly by the end",
      "Vocal delivery feeling too stiff or overworked rather than natural",
      "Instrumental arrangement cluttering the song rather than serving it",
      "Whether the track has a genuine emotional core or feels like an exercise in the genre",
    ],
    faq: [
      {
        q: "Where can I get feedback on my folk music?",
        a: "MixReflect matches folk tracks with genre-matched artists who review using a structured format. Folk feedback specifically requires reviewers who understand authenticity and storytelling — the things that make folk work are often the same things that are hard to evaluate from inside the production process. Genre-matched peer review gives you notes from artists who can tell you whether your track feels genuine.",
      },
      {
        q: "How do I know if my folk track sounds authentic?",
        a: "Authentic folk sounds like it comes from a real place — the vocal performance feels natural rather than performed, the instrumental playing has character and slight imperfection, and the storytelling has a specific point of view. The most common issue is folk that's technically proficient but emotionally distant — the singer sounds like they're performing a folk song rather than telling a story they care about. Authenticity is usually in the performance rather than the production.",
      },
    ],
  },
  {
    slug: "soul",
    name: "Soul",
    metaTitle: "Soul Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your soul music from genre-matched artists. Vocal, groove, emotion — find out if it's hitting before you release.",
    h1: "Soul music feedback from artists who understand the feeling",
    intro:
      "MixReflect is a structured music feedback platform where soul artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Soul is feeling, groove, and vocal truth — and after making a track, you need feedback from artists who know the difference between a soul track that moves people and one that just sounds like soul.",
    reviewerBlurb:
      "Soul reviewers understand vocal performance, rhythmic pocket, arrangement space, and what the genre demands in terms of emotional commitment — both from the performer and the production.",
    catchItems: [
      "Vocal performance not fully committing to the emotion — playing it safe",
      "Groove not locking — rhythm section feels stiff or disconnected",
      "Arrangement too busy — needs more space for the vocal and emotion to breathe",
      "Chord resolution not landing with enough emotional weight",
      "Whether the track has a genuine emotional core or feels imitative",
    ],
    faq: [
      {
        q: "Where can I get feedback on my soul music?",
        a: "MixReflect matches soul tracks with genre-matched artists who review using a structured format covering vocal performance, groove, production quality, and emotional impact. Soul is a genre where the most important feedback is on the performance — whether the emotion is genuinely landing — and that requires reviewers who understand what authentic soul sounds like.",
      },
      {
        q: "What makes a soul vocal performance connect?",
        a: "A soul vocal that connects is one where the singer is thinking about the meaning of the lyric rather than the execution of the melody. The technical elements — control, tone, dynamics — matter, but they're in service of the emotion, not the center of it. The most common issue is over-controlled performances that are technically clean but emotionally distant. Soul traditionally values a voice that sounds like it's been through something — not manufactured perfection.",
      },
    ],
  },
  {
    slug: "metal",
    name: "Metal",
    metaTitle: "Metal Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your metal track from genre-matched artists. Mix, performance, arrangement — find out what's working before you release.",
    h1: "Metal feedback from artists who know the standard",
    intro:
      "MixReflect is a structured music feedback platform where metal artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Metal is about impact, clarity, and intention — and the only way to know if your mix, performance, and arrangement actually deliver is through feedback from listeners who understand the genre.",
    reviewerBlurb:
      "Metal reviewers understand guitar tone, low-end clarity, vocal presence in a dense mix, and what the genre's production standard actually sounds like — across subgenres from thrash to doom.",
    catchItems: [
      "Guitar tone too muddy or too thin — not cutting through or competing",
      "Low end muddiness — kick and bass competing rather than complementing",
      "Vocal sitting too low in the mix and getting lost in the band",
      "Arrangement not building to a satisfying peak or breakdown",
      "Whether the mix has the weight and clarity the genre demands",
    ],
    faq: [
      {
        q: "Where can I get feedback on my metal track?",
        a: "MixReflect matches metal tracks with genre-matched artists who review using a structured format. Metal mixing is technically demanding — the feedback needs to come from people who understand the genre's production standards and can tell you specifically whether the guitar tone, low end, and vocal balance are working.",
      },
      {
        q: "How do I get my metal mix to sound clear with so many elements?",
        a: "Metal mix clarity comes from frequency separation. The key zones: kick drum needs punch in the 60-100Hz range without competing with the bass guitar's fundamental, rhythm guitars live in the 200-800Hz range and need to be tightly cut to avoid muddying each other, and the vocal needs a clear window around 2-4kHz to cut through. High-gain guitar tones naturally produce a lot of mid-range information — scooping competing frequencies from each element is what creates clarity in a dense arrangement.",
      },
      {
        q: "What makes a metal track feel heavy without being muddy?",
        a: "Heaviness without muddiness requires low-end clarity. The kick and bass guitar need to sit in complementary frequency zones — the kick punches, the bass sustains — without competing in the same sub range. High-gain guitars should have their low-mid information (200-400Hz) tightened to avoid adding muddiness on top of the bass. The result is a low end that hits hard and clearly rather than just being loud.",
      },
    ],
  },
  {
    slug: "drum-and-bass",
    name: "Drum & Bass",
    metaTitle: "Drum and Bass Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your drum and bass track from genre-matched producers. Energy, mix, arrangement — find out if it's hitting before you release.",
    h1: "Drum and bass feedback from producers who know the genre",
    intro:
      "MixReflect is a structured music feedback platform where DnB producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. DnB is energy, movement, and mix clarity at high speeds — and only feedback from producers who understand the genre tells you whether yours is genuinely hitting.",
    reviewerBlurb:
      "DnB reviewers understand break programming, bass design, low-end clarity, and what makes a drum and bass track function at the energy level the genre demands.",
    catchItems: [
      "Reese bass or bass element not sitting cleanly in the low end",
      "Drum programming — whether the break has real energy and movement",
      "Low end clarity — kick and bass relationship at high volume",
      "Build not creating enough anticipation before the drop",
      "Whether the track holds its energy across the full runtime without flatting",
    ],
    faq: [
      {
        q: "Where can I get feedback on my drum and bass track?",
        a: "MixReflect matches DnB tracks with genre-matched producers who review using a structured format. DnB feedback needs to come from people who understand the genre's energy and production requirements — break programming, bass design, and low-end clarity at high BPMs are all technical elements that generic feedback won't address accurately.",
      },
      {
        q: "What makes drum and bass breaks sound like they have real energy?",
        a: "Energetic DnB breaks have velocity variation — not every hit is at full volume — swing that makes the groove feel human rather than mechanical, and processing (compression, saturation, layering) that gives the samples punch and presence. The most common issue is breaks that are too flat dynamically — every element the same velocity — which makes the track feel like it's sprinting at a constant pace rather than pushing and releasing.",
      },
    ],
  },
  {
    slug: "dubstep",
    name: "Dubstep",
    metaTitle: "Dubstep Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your dubstep track from genre-matched producers. Bass design, drop impact, mix — find out if it's working before you release.",
    h1: "Dubstep feedback from producers who know whether the drop hits",
    intro:
      "MixReflect is a structured music feedback platform where dubstep producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Dubstep is bass design, energy, and drop impact — and the feedback that matters tells you specifically whether yours is achieving all three.",
    reviewerBlurb:
      "Dubstep reviewers understand bass design, build tension, drop impact, and what makes a dubstep track hit in the way the genre demands — not just sound like dubstep.",
    catchItems: [
      "Bass design not distinctive enough — sounds generic rather than original",
      "Build not creating enough tension before the drop",
      "Drop not hitting with enough impact — lacks the punch the genre demands",
      "Low end clarity — sub and mid-bass relationship",
      "Whether the sound design is genuinely original or derivative",
    ],
    faq: [
      {
        q: "Where can I get feedback on my dubstep track?",
        a: "MixReflect matches dubstep tracks with genre-matched producers who review using a structured format. Dubstep feedback specifically needs to address bass design (is it distinctive?), drop impact (does it hit?), and build tension (does the anticipation pay off?) — these are the critical elements of the genre and they need to be evaluated by producers who understand the standard.",
      },
      {
        q: "How do I make my dubstep drop hit harder?",
        a: "A harder-hitting dubstep drop needs low-end weight, a clear contrast from the build, and bass design with enough character to carry the drop section. The most common issues: drops that don't differentiate enough from the build, bass that sounds powerful on studio monitors but loses energy on a real sound system, and too many competing elements in the drop that prevent any single one from hitting clearly. Strip the build down before the drop to maximize the contrast — the more you take away before the drop, the harder it lands.",
      },
    ],
  },
  {
    slug: "future-bass",
    name: "Future Bass",
    metaTitle: "Future Bass Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your future bass track from genre-matched producers. Emotion, sound design, drop energy — find out if it's landing before you release.",
    h1: "Future bass feedback from producers who know the feel",
    intro:
      "MixReflect is a structured music feedback platform where future bass producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Future bass is emotion, sound design, and drop energy — and feedback from producers who understand those elements is what tells you whether yours is working.",
    reviewerBlurb:
      "Future bass reviewers understand chordal emotion, vocal chop production, drop design, and the specific feel the genre demands — the euphoric, emotionally saturated quality that defines it.",
    catchItems: [
      "Chords not conveying enough emotion — harmony feels flat rather than lush",
      "Drop lacking the punchy, euphoric quality the genre demands",
      "Vocal chops not sitting right in the mix or feeling disconnected from the production",
      "Build not creating enough anticipation and emotional tension",
      "Whether the overall emotional arc resolves with enough payoff",
    ],
    faq: [
      {
        q: "Where can I get feedback on my future bass track?",
        a: "MixReflect matches future bass tracks with genre-matched producers who review using a structured format. Future bass is a genre where the emotional quality of the chords, the design of the drop, and the treatment of vocal elements are all critical and require genre-specific feedback to evaluate accurately.",
      },
      {
        q: "How do I make my future bass chords feel more emotional?",
        a: "Future bass chords get their emotional quality from richness and movement — stacked chord voicings, layered synth textures with different timbres, and subtle movement in the chord tones (slight pitch modulation, filter sweeps) that create a sense of breath and life. The most common issue is chords that are harmonically correct but sonically thin — they don't have enough texture and layering to create the lush, overwhelming emotional quality the genre demands.",
      },
    ],
  },
  {
    slug: "progressive-house",
    name: "Progressive House",
    metaTitle: "Progressive House Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your progressive house track from genre-matched producers. Build, arrangement, mixdown — find out if it's working before you release.",
    h1: "Progressive house feedback from producers who build journeys",
    intro:
      "MixReflect is a structured music feedback platform where progressive house producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Progressive house is journey, tension, and release — and the feedback that matters evaluates your arrangement and build the way a listener inside a set would experience it.",
    reviewerBlurb:
      "Progressive house reviewers understand long-form arrangement, tension building, melodic development, and what it takes for a 7-10 minute track to justify its runtime.",
    catchItems: [
      "Build not creating enough tension across its runtime — energy plateaus too early",
      "Drop feeling anticlimactic — doesn't pay off the anticipation the build created",
      "Arrangement too formulaic with no distinctive moment that anchors the track",
      "Mix lacking the width and clarity the genre demands",
      "Whether the track tells a story across its runtime or just maintains a mood",
    ],
    faq: [
      {
        q: "Where can I get feedback on my progressive house track?",
        a: "MixReflect matches progressive house tracks with genre-matched producers who review using a structured format. Progressive house requires feedback on arrangement over a long runtime — whether the tension develops correctly, whether the drop pays off, whether the track justifies its length. That kind of evaluation requires listeners who understand how the genre works.",
      },
      {
        q: "How do I know if my progressive house arrangement is working?",
        a: "A working progressive house arrangement creates a sense of inevitability — the listener doesn't know exactly what's coming, but when it arrives it feels like it had to. The most common issues: builds that plateau and lose energy before the drop, drops that don't differentiate enough from the build to feel like a release, and arrangements that are technically correct but don't have a distinctive melodic or textural element that makes the track memorable.",
      },
    ],
  },
  {
    slug: "trance",
    name: "Trance",
    metaTitle: "Trance Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your trance track from genre-matched producers. Melody, build, emotional impact — find out if it's working before you release.",
    h1: "Trance feedback from producers who understand the journey",
    intro:
      "MixReflect is a structured music feedback platform where trance producers upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Trance lives on tension, release, and melodic impact — and getting feedback from producers who understand the genre tells you whether your track achieves the emotional journey it needs to.",
    reviewerBlurb:
      "Trance reviewers understand lead melody quality, emotional build structure, breakdown impact, and what the genre demands in terms of the feeling it creates — the specific euphoria or transcendence that defines the best trance.",
    catchItems: [
      "Lead melody not strong enough to carry the track — lacks the hook quality trance demands",
      "Build not creating enough emotional anticipation before the breakdown or climax",
      "Drop resolution not landing with the full emotional impact",
      "Mix clarity on the synth layers — elements competing rather than complementing",
      "Whether the track delivers the emotional journey the genre promises",
    ],
    faq: [
      {
        q: "Where can I get feedback on my trance track?",
        a: "MixReflect matches trance tracks with genre-matched producers who review using a structured format. Trance is a genre where the melodic quality and emotional impact are the primary criteria — and those need to be evaluated by producers who understand what a genuinely moving trance melody feels like versus one that's technically correct but emotionally flat.",
      },
      {
        q: "What makes a trance melody emotionally impactful?",
        a: "An emotionally impactful trance melody has a clear melodic identity — a sequence of notes that feels like it means something, not just a technically correct progression. The best trance melodies create a sense of uplift or longing through their specific note choices and timing. The most common issue is melodies that are harmonically correct but don't have a distinctive contour — they rise and fall in expected ways without a specific emotional peak that the listener would remember.",
      },
    ],
  },
  {
    slug: "jazz",
    name: "Jazz",
    metaTitle: "Jazz Music Feedback | MixReflect",
    metaDescription:
      "Get structured feedback on your jazz music from genre-matched musicians. Feel, interaction, mix — find out if it's landing before you release.",
    h1: "Jazz feedback from musicians who understand the conversation",
    intro:
      "MixReflect is a structured music feedback platform where jazz musicians upload unreleased recordings and receive honest, detailed reviews from genre-matched peers. Jazz is interaction, feel, and musical conversation — and the feedback that tells you whether yours is working comes from musicians who live in the genre.",
    reviewerBlurb:
      "Jazz reviewers understand rhythmic feel, ensemble interaction, solo development, mix balance, and what separates jazz that genuinely swings from jazz that's technically proficient but missing the conversation.",
    catchItems: [
      "Rhythm section not locking — feel is stiff or overly mechanical",
      "Solos feeling disconnected from the ensemble or the harmonic context",
      "Mix balance between instruments — one element dominating",
      "Whether the track has a genuine jazz feel or just jazz-adjacent sounds",
      "Interaction between players — is the musical conversation happening?",
    ],
    faq: [
      {
        q: "Where can I get feedback on my jazz music?",
        a: "MixReflect matches jazz recordings with genre-matched musicians who review using a structured format. Jazz feedback requires reviewers who understand the specific qualities that make jazz work — feel, interaction, harmonic sensitivity — rather than just listeners who appreciate the genre. The platform's structured format ensures you get notes on the specific elements that matter.",
      },
      {
        q: "How do I know if my jazz recording has the right feel?",
        a: "The right feel in jazz is when the music sounds like it's breathing — the ensemble is responding to each other rather than each player executing their part in isolation. The most reliable indicator is whether the rhythm section is locking in a way that makes the listener want to nod their head. Stiff jazz often comes from recording each element separately and over-quantizing, or from players who are so focused on their own part that they're not listening to the ensemble.",
      },
    ],
  },
  {
    slug: "funk",
    name: "Funk",
    metaTitle: "Funk Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your funk track from genre-matched musicians. Groove, pocket, arrangement — find out if it's moving people before you release.",
    h1: "Funk feedback from musicians who know whether the groove locks",
    intro:
      "MixReflect is a structured music feedback platform where funk musicians upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Funk is groove, pocket, and feel — and the only feedback worth acting on is from musicians who can tell you whether it makes them want to move.",
    reviewerBlurb:
      "Funk reviewers understand rhythmic pocket, bass and drum interaction, syncopation, and the quality that makes funk actually make people move — as opposed to just sounding like funk.",
    catchItems: [
      "Groove not locking — rhythm section not sitting in the pocket together",
      "Bass too buried — losing the rhythmic foundation of the track",
      "Horns or synth lines too cluttered and competing",
      "Energy not building and releasing naturally across the track",
      "Whether the track actually makes the listener want to move",
    ],
    faq: [
      {
        q: "Where can I get feedback on my funk track?",
        a: "MixReflect matches funk tracks with genre-matched musicians who review using a structured format. Funk feedback has to come from musicians who understand the groove — the bass-drum relationship, the syncopation, the pocket — because those elements are what determine whether a funk track works, and they require someone inside the genre to evaluate accurately.",
      },
      {
        q: "How do I know if my funk groove is locked in?",
        a: "A locked funk groove makes the listener move without thinking about it. The test is physical — if someone hearing it for the first time is nodding their head or tapping their foot by the first verse, the groove is working. If they're listening analytically, it's probably not locked yet. The most common issue is a rhythm section where each player is playing the right notes in the right rhythm but they're not listening to each other — technically correct but not truly together.",
      },
    ],
  },
  {
    slug: "punk",
    name: "Punk",
    metaTitle: "Punk Music Feedback | MixReflect",
    metaDescription:
      "Get honest feedback on your punk track from genre-matched artists. Energy, rawness, impact — find out if it's hitting before you release.",
    h1: "Punk feedback from artists who know whether the energy is real",
    intro:
      "MixReflect is a structured music feedback platform where punk artists upload unreleased tracks and receive honest, detailed reviews from genre-matched peers. Punk is energy, attitude, and raw impact — and the feedback worth having comes from artists who know whether yours is genuine or going through the motions.",
    reviewerBlurb:
      "Punk reviewers understand raw energy, rhythm section tightness, vocal urgency, and the specific quality that makes punk feel like it has something to say rather than just being loud.",
    catchItems: [
      "Energy feeling forced rather than genuine — going through the motions of punk",
      "Production too polished — losing the raw character that makes the genre work",
      "Rhythm section not tight enough — losing the drive that holds the track together",
      "Vocals not cutting through with enough urgency and attitude",
      "Whether the track has genuine urgency or is just fast and loud",
    ],
    faq: [
      {
        q: "Where can I get feedback on my punk track?",
        a: "MixReflect matches punk tracks with genre-matched artists who review using a structured format. Punk feedback needs to evaluate whether the energy is real — whether the track has genuine urgency — and that requires reviewers who understand the genre and can tell the difference between authentic punk energy and technically proficient punk-adjacent music.",
      },
      {
        q: "How polished should a punk recording be?",
        a: "Punk recordings exist on a spectrum from very raw and lo-fi to professionally produced. The key is that the production shouldn't sanitize the energy — over-produced punk loses the rawness that makes it work. The right level depends on the specific sound you're going for: some punk subgenres embrace a more produced sound, others reject it entirely. The wrong answer is getting halfway between raw and polished without committing to either.",
      },
    ],
  },
];

export function getGenrePage(slug: string): GenrePage | undefined {
  return genrePages.find((p) => p.slug === slug);
}
