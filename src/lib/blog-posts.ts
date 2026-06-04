export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "cta" };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  coverImage?: string;
  content: ContentBlock[];
};

const _posts: BlogPost[] = [
  {
    slug: "why-your-vocals-sound-buried-in-the-mix",
    title: "Why Your Vocals Sound Buried in the Mix (And How to Fix It)",
    coverImage: "/blog/blog8.jpg",
    excerpt:
      "Buried vocals are the single most common issue listeners flag on a finished track. Here's why it happens, why you can't hear it yourself, and how to actually fix it.",
    category: "GUIDE",
    date: "June 4, 2026",
    readTime: "5 min read",
    content: [
      {
        type: "paragraph",
        text: "If you ask a room full of strangers to listen to an unreleased track and tell you the one thing they'd change, the answer comes back more often than any other: I can't hear the words. The vocals are sitting under the mix instead of on top of it. It's the most common note independent artists get — and the one they're least likely to catch on their own.",
      },
      {
        type: "paragraph",
        text: "The frustrating part is that buried vocals are almost always a quick fix. It's rarely a fundamental problem with the song. It's a balance issue, a frequency issue, or an arrangement issue that you've stopped being able to hear because you already know every word by heart.",
      },
      {
        type: "h2",
        text: "Why you can't hear it yourself",
      },
      {
        type: "paragraph",
        text: "By the time you're mixing, you've heard the vocal take hundreds of times. You know exactly what every line says. So your brain fills it in — even when the actual audio is masking it. You're not hearing the mix a first-time listener hears. You're hearing your memory of the vocal sitting on top of it.",
      },
      {
        type: "paragraph",
        text: "This is the same reason you stop noticing the intro is too long or the mid-section drifts. Familiarity edits the track for you. A fresh listener has none of that context — they hear exactly what's in the file, and if the vocal is two decibels too low or fighting the guitars for the same frequency space, they notice immediately.",
      },
      {
        type: "quote",
        text: "You know every word, so your brain fills them in. A first-time listener only hears what's actually in the file.",
      },
      {
        type: "h2",
        text: "The real reasons vocals get buried",
      },
      {
        type: "paragraph",
        text: "Buried vocals usually come down to one of a handful of causes, and it helps to know which one you're dealing with before you start moving faders.",
      },
      {
        type: "list",
        items: [
          "Level — the simplest case: the vocal is just too quiet relative to the instrumental. Often the fix is nothing more than turning it up a couple of dB.",
          "Frequency masking — the vocal and another element (synths, guitars, a busy pad) are crowding the same midrange. Even at the right level, they smear into each other.",
          "Too much low-end or reverb — a muddy low-mid buildup or a wash of reverb pushes the vocal back and softens its edges.",
          "Lack of dynamic control — the vocal jumps from too quiet to too loud, so it ducks under the mix on the quieter words and never sits consistently.",
          "Arrangement density — too much happening at once. The vocal isn't given any space to breathe in the frequency spectrum.",
        ],
      },
      {
        type: "h2",
        text: "How to actually fix it",
      },
      {
        type: "paragraph",
        text: "Start with the cheapest fix and work up. Before reaching for EQ or compression, just turn the vocal up. A surprising number of buried-vocal problems are solved by a 1.5–3 dB level bump. If that makes the vocal too loud on the choruses but still buried on the verses, the issue is dynamics — gentle compression or volume automation will even it out so the vocal sits in the same place throughout.",
      },
      {
        type: "paragraph",
        text: "If level isn't enough, the problem is usually masking. Carve a little space in the competing element — a small dip in the guitars or synths around the vocal's core frequencies (often somewhere in the 1–4 kHz range, where consonants and intelligibility live) lets the voice cut through without you having to crank it. Clearing low-mid mud around 200–500 Hz on the busier instruments often does as much for vocal clarity as anything you do to the vocal itself.",
      },
      {
        type: "paragraph",
        text: "Reverb is the silent culprit people forget. A lush vocal reverb feels great in solo, but in the full mix it can smear the vocal backwards and rob it of presence. Pull the reverb down, or use a shorter, drier setting, and the vocal often snaps back to the front.",
      },
      {
        type: "quote",
        text: "Try the cheapest fix first. Most buried vocals are solved by a couple of dB, not a plugin chain.",
      },
      {
        type: "h2",
        text: "The check that tells you if it worked",
      },
      {
        type: "paragraph",
        text: "Here's the trap: you'll fix the vocal, listen back, and — because you already know the words — it'll sound fine to you. You have no reliable way to judge your own vocal balance after you've heard the track this many times. The only real test is a set of ears that has never heard the song before.",
      },
      {
        type: "paragraph",
        text: "And not just one set. One person saying the vocal is buried might be their headphones or their taste. But when several listeners independently flag the same thing — without hearing each other's responses — that's not preference anymore. That's a pattern, and patterns are the only feedback worth acting on before you release.",
      },
      {
        type: "paragraph",
        text: "This is exactly what MixReflect is built for. You upload a track before release and genre-matched artists fill out a structured review independently — including whether the vocals cut through or sit under the mix. When multiple reviewers flag the same buried vocal, you know it's real and worth fixing. When they don't, you know your balance is landing and you can release with confidence.",
      },
      {
        type: "faq",
        items: [
          {
            q: "Why do my vocals sound buried in the mix?",
            a: "Buried vocals usually come down to one of a few causes: the vocal level is simply too low, the vocal is competing with another instrument for the same midrange frequencies (masking), too much reverb or low-end mud is pushing it back, or the vocal's dynamics are uneven so it ducks under the mix on quieter words. Start by checking the level — often a 1.5–3 dB bump is all it takes — before reaching for EQ or compression.",
          },
          {
            q: "How do I make my vocals cut through the mix?",
            a: "Work cheapest fix first: turn the vocal up a couple of dB, then even out its dynamics with compression or automation so it sits consistently. If it's still buried, carve a small dip in competing instruments around the vocal's core frequencies (roughly 1–4 kHz for intelligibility) and clear low-mid mud around 200–500 Hz on busier elements. Finally, check your reverb — too much smears the vocal backwards.",
          },
          {
            q: "Why can't I tell if my own vocals are too quiet?",
            a: "Because you've heard the vocal take hundreds of times and already know every word, your brain fills the lyrics in even when the audio is masking them. You're hearing your memory of the vocal, not the actual balance a first-time listener gets. The only reliable test is fresh ears — ideally several independent listeners, since a pattern of multiple people flagging the same thing is far more trustworthy than one opinion.",
          },
          {
            q: "How do I get feedback on whether my vocals are buried?",
            a: "Get structured feedback from multiple independent listeners before you release. Platforms like MixReflect have genre-matched artists fill out a structured review that specifically covers whether the vocals cut through or sit under the mix. Because reviewers respond independently, you can see where multiple people converge — if several flag buried vocals without hearing each other, it's a real issue to fix before release.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "what-playlist-curators-look-for",
    title: "What Playlist Curators Actually Look For (And Why Most Tracks Get Rejected)",
    coverImage: "/blog/blog7.jpg",
    excerpt:
      "Curators reject over 90% of submissions without explanation. Here's what they're actually evaluating — and what disqualifies most tracks before the second verse.",
    category: "INDUSTRY",
    date: "May 31, 2026",
    readTime: "5 min read",
    content: [
      {
        type: "paragraph",
        text: "The rejection rate on SubmitHub hovers around 90% for most independent artists. What almost nobody tells you is the specific criteria being applied — because curators don't publish them. But the patterns are consistent enough that you can work backwards from rejections and figure out exactly what's happening.",
      },
      {
        type: "paragraph",
        text: "Knowing what curators look for doesn't guarantee placement. But it changes the calculus on when to submit — and what your track needs to clear before you spend credits on a pitch that was never going to land.",
      },
      {
        type: "h2",
        text: "The first 20 seconds",
      },
      {
        type: "paragraph",
        text: "Most playlist curators make their decision in the first 20 seconds. Not because they're lazy — because that's genuinely how fast a listener who doesn't know you decides whether to stay or skip. The intro needs to establish something: a mood, a hook, an energy level, a distinctive element. A 40-second ambient build before anything lands is a skip on a streaming platform, and curators know that.",
      },
      {
        type: "paragraph",
        text: "The threshold varies by genre. Electronic and hip-hop intros are judged harshly on speed-to-hook. Singer-songwriter and acoustic tracks have slightly more runway, but even then there's an invisible clock ticking on how long a curator will wait before moving on.",
      },
      {
        type: "h2",
        text: "Production quality relative to the playlist",
      },
      {
        type: "quote",
        text: "Curators are protecting a sound. Your track needs to fit into their playlist without the listener noticing the seam.",
      },
      {
        type: "paragraph",
        text: "Every playlist has a production standard — implicit, but consistent. An indie chill playlist featuring polished bedroom-pop isn't going to include a track where the low end is muddy, the vocals are buried, or the master sounds quiet compared to everything around it. The track needs to sound like it belongs, not like it's aspiring to belong.",
      },
      {
        type: "paragraph",
        text: "This isn't about needing a major-label budget. Many curators specifically prefer the lo-fi or DIY aesthetic. The standard is internal consistency with the playlist's existing sound — which means knowing which playlists actually match your production level before you start submitting.",
      },
      {
        type: "h2",
        text: "Genre fit and context",
      },
      {
        type: "paragraph",
        text: "The clearest disqualifier artists consistently underestimate is genre mismatch. Curators receive a high volume of submissions that are adjacent to their playlist's genre but don't actually fit. Submitting a cinematic hip-hop track to a straight-up trap playlist, or an indie folk track to an acoustic pop playlist, wastes credits and often earns you a permanent 'not a fit' from that curator.",
      },
      {
        type: "paragraph",
        text: "Do the work before submitting: listen to 5–10 tracks on the playlist and ask whether your track would sit naturally between them. Not adjacent to them — between them. If the energy, tempo, production style, or mood breaks the flow, it will break it for the curator too.",
      },
      {
        type: "h2",
        text: "The flow criterion most artists miss",
      },
      {
        type: "paragraph",
        text: "Even if your track passes on production quality and genre fit, there's a third check that's rarely discussed: how does it flow into and out of other tracks on the playlist? Curators building a cohesive listening experience are thinking about energy arc across the whole playlist, not just whether any individual track is good.",
      },
      {
        type: "paragraph",
        text: "A track that's excellent in isolation but shifts the energy too abruptly — too loud, too soft, too different in tempo — won't make the cut even if everything else is right. This is harder to control for without knowing the specific playlist intimately. But it explains why a track you think is perfectly positioned still doesn't land.",
      },
      {
        type: "quote",
        text: "The question isn't just 'is this a good track.' It's 'does this track belong in this specific playlist right now.'",
      },
      {
        type: "h2",
        text: "What gets you rejected before the second verse",
      },
      {
        type: "list",
        items: [
          "Intro runs longer than 25–30 seconds before anything interesting happens",
          "Vocals or lead element buried in the mix — doesn't cut through clearly",
          "Production sounds demo-quality compared to the playlist's existing tracks",
          "Track length is out of range for the genre (8-minute electronic track for a background chill playlist)",
          "Obvious distortion, clipping, or technical issues anywhere in the audio",
          "Link is dead, private, or requires a follow to listen",
        ],
      },
      {
        type: "h2",
        text: "The prep that actually changes your odds",
      },
      {
        type: "paragraph",
        text: "The artists who consistently get placed don't submit cold. They run a quality check before pitching — making sure the track has cleared the production standard, the intro lands fast, and the mix sits where it needs to. That check is the step most artists skip because it requires honest feedback, not just a gut feeling after 300 listens.",
      },
      {
        type: "paragraph",
        text: "After producing a track you can no longer hear it the way a first-time listener does. You know what the intro is building to, so it doesn't feel slow. You know the vocals are there, so the burial in the mix doesn't register. A curator hears it cold. What they experience in the first 20 seconds is exactly what a new listener gets — no context, no forgiveness.",
      },
      {
        type: "paragraph",
        text: "MixReflect is built for this gap. Upload a track before you release it and genre-matched artists fill out a structured review independently — covering first impression, production quality, what's working, and what to fix. When multiple reviewers flag the same thing, you know it's real. When they don't, the track is ready to pitch.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What do playlist curators look for?",
            a: "Curators evaluate four main things: the first 20–30 seconds (does it hook them?), production quality relative to the playlist's existing sound, genre and mood fit, and whether the track flows naturally between other tracks on the playlist. Most rejections come down to one of these — often the intro taking too long to establish something interesting, or production that sounds under-polished compared to what's already on the playlist.",
          },
          {
            q: "Why do playlist curators reject tracks?",
            a: "The most common reasons are intro too long before the hook, production quality below the playlist's standard, genre mismatch, or the track not fitting the energy flow of the playlist. Many rejections have nothing to do with the quality of the song itself — they're about fit. A great track submitted to the wrong playlist will get rejected every time.",
          },
          {
            q: "How do I get my music on a Spotify playlist?",
            a: "For editorial playlists: use Spotify for Artists to pitch tracks at least 7 days before release. For independent playlists: use SubmitHub or direct outreach. Before either, make sure your track has cleared a quality check — listen to 5 tracks on the playlist and ask whether yours would sit naturally between them in terms of production quality, energy, and mood. Get structured feedback from other listeners first if you haven't already.",
          },
          {
            q: "How can I improve my odds of playlist placement?",
            a: "The single biggest lever is submitting a track that's already been through structured feedback and has no obvious weak points a first-time listener would catch. The intro needs to land within 20 seconds, the mix needs to match the playlist's production level, and the genre needs to actually fit — not just be adjacent. Using MixReflect before submitting gives you genre-matched listeners who'll flag any issues before you spend credits on a cold pitch.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "how-to-know-if-your-song-is-ready-to-release",
    title: "How to Know If Your Song Is Ready to Release",
    coverImage: "/blog/blog4.jpg",
    excerpt:
      "Most artists release too early — or hold on too long. Here's how to actually tell when a track is ready, and the one check most people skip.",
    category: "GUIDE",
    date: "May 28, 2026",
    readTime: "5 min read",
    content: [
      {
        type: "paragraph",
        text: "There's no moment where a track tells you it's finished. You could keep tweaking it forever — another pass on the mix, a different drum sample, adjusting the intro length. At some point you just decide. The problem is most artists make that call at the wrong time, either before the track is genuinely ready or after holding it so long the window has passed.",
      },
      {
        type: "paragraph",
        text: "The artists who release consistently and improve fast aren't guessing. They have a standard — a set of things a track needs to clear before it goes out. Here's what that actually looks like.",
      },
      {
        type: "h2",
        text: "The two release traps",
      },
      {
        type: "paragraph",
        text: "The first trap is releasing too early. You're excited, the track feels fresh, it sounds good on your headphones after 10 listens. But 10 listens isn't the same as a fresh set of ears. You've already filled in the gaps — you're hearing the track as you intended it, not as a stranger would hear it for the first time.",
      },
      {
        type: "paragraph",
        text: "The second trap is holding forever. You've listened to it so many times that nothing sounds right anymore. You start second-guessing things that aren't actually problems. The track gets worse through overthinking, not better. Or you sit on it for six months and lose momentum entirely.",
      },
      {
        type: "quote",
        text: "The goal isn't a perfect track. It's a track with no obvious weak points a first-time listener would catch.",
      },
      {
        type: "h2",
        text: "What 'ready' actually means",
      },
      {
        type: "paragraph",
        text: "Ready doesn't mean perfect. Perfect doesn't exist, and chasing it is how good tracks die in hard drives. Ready means: a first-time listener can get through the track without being pulled out of it by something that feels unfinished, off, or unintentional.",
      },
      {
        type: "paragraph",
        text: "The threshold is lower than most artists think, and higher than their confidence lets them apply. A track with a strong opening, a sustained energy arc, and a clean resolution is ready — even if the mix isn't exactly where a professional engineer would land it. A track where the vocals disappear in the chorus, or the mid-section loses energy and doesn't recover, is not ready — even if every other element is technically polished.",
      },
      {
        type: "h2",
        text: "The pre-release checklist",
      },
      {
        type: "list",
        items: [
          "First impression: does something interesting happen within the first 20 seconds?",
          "Hook strength: is there a moment in the track that a listener would come back for?",
          "Energy arc: does the track build and resolve with intention, or does it drift in the middle?",
          "Vocal presence: if there are vocals, do they sit on top of the mix and cut through?",
          "Endings: does the track end cleanly, or does it feel cut off or drag past its natural close?",
          "Runtime: at what point would a casual listener stop? Is that before or after the natural end?",
          "Fresh ears: has anyone who isn't trying to protect your feelings actually listened to it?",
          "Pattern check: have multiple listeners independently flagged the same problem?",
        ],
      },
      {
        type: "paragraph",
        text: "The last two items are the ones most artists skip — and they're the most important. Self-assessment breaks down because you've stopped hearing the track the way a new listener does. After 50 listens, you're not evaluating the music anymore. You're remembering how you feel about it.",
      },
      {
        type: "h2",
        text: "Why you can't hear your own track clearly anymore",
      },
      {
        type: "paragraph",
        text: "Listener fatigue is real, and it happens faster than people think. By the time you're 30-40 listens in during production, your brain has started filling in gaps and correcting small issues automatically. The vocal that's sitting slightly low in the mix? You've unconsciously compensated. The chorus that loses energy? You know what it should feel like, so you feel it.",
      },
      {
        type: "paragraph",
        text: "A first-time listener has none of that context. They hear exactly what's in the file — no more, no less. Which means they'll catch the buried vocal, notice the energy dip, feel the intro drag. Things you've been mentally editing out for weeks.",
      },
      {
        type: "quote",
        text: "After 40 listens you're not hearing the track. You're hearing your memory of it.",
      },
      {
        type: "h2",
        text: "The test most people skip: pattern feedback from fresh ears",
      },
      {
        type: "paragraph",
        text: "The most reliable signal that a track is ready — or not — is when multiple people who don't know each other listen independently and land on the same notes. One person flagging something might be taste. Three people flagging the same thing without hearing each other's responses is a pattern, and patterns mean something real.",
      },
      {
        type: "paragraph",
        text: "This is harder to arrange than it sounds. Your friends will soften their feedback. A single Discord post anchors everyone on the first reply. The feedback needs to be structured (everyone responding to the same questions) and independent (nobody seeing each other's answers). Most artists never achieve both at the same time.",
      },
      {
        type: "h2",
        text: "When to release even if it's not perfect",
      },
      {
        type: "paragraph",
        text: "There's a version of readiness-checking that turns into indefinite delay. If you've cleared the checklist above, got feedback from multiple listeners, and there's no consistent pattern pointing to a real problem — the track is ready. At that point, holding it is costing you more than releasing it.",
      },
      {
        type: "paragraph",
        text: "The artists who build momentum release regularly. Each release is practice. Each round of real-world feedback — stream data, comments, listener drop-off — teaches you things no amount of solo tweaking will. The goal is to release something you've done due diligence on, not something you've convinced yourself is perfect.",
      },
      {
        type: "paragraph",
        text: "MixReflect exists for exactly this stage. You upload a track before release, and genre-matched artists listen and fill out a structured review independently — covering first impression, what's working, what to fix, and production quality. When multiple reviewers flag the same thing, it shows up clearly. When they don't, you know the track is ready and you can release with confidence.",
      },
      {
        type: "faq",
        items: [
          {
            q: "How do I know if my song is ready to release?",
            a: "Your song is ready to release when multiple independent listeners — people who haven't heard your previous drafts — can get through it without flagging the same issue. If three or more reviewers independently note the same problem (vocals buried, energy drops in the mid-section, intro too long), that's a real signal to fix before release. If reviewers all flag different things, the track is likely ready.",
          },
          {
            q: "What should I check before releasing a song?",
            a: "Check the first 20 seconds (does something interesting happen?), the hook (is there a moment worth coming back for?), the energy arc (does it build and resolve without drifting?), vocal presence (do vocals cut through the mix?), and the ending (does it resolve cleanly?). Most importantly, get feedback from people who haven't heard the track before — listener fatigue means you can no longer hear it the way a first-time listener does.",
          },
          {
            q: "How long should I wait before releasing a song?",
            a: "There's no fixed timeline — the signal is feedback, not time. Get structured feedback from multiple independent listeners, act on any patterns (things multiple people flag without hearing each other), and release once no consistent weak point remains. Holding a track past that point costs momentum without improving the music.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "how-to-get-feedback-on-music-before-releasing",
    title: "How to Get Feedback on Your Music Before Releasing",
    coverImage: "/blog/blog-hero.jpg",
    excerpt:
      "Most artists release into a void and wonder why nothing sticks. Here's how to get real feedback before you hit publish.",
    category: "GUIDE",
    date: "May 26, 2026",
    readTime: "5 min read",
    content: [
      {
        type: "paragraph",
        text: "Most artists release music and hope for the best. They post to Instagram, send it to SoundCloud, maybe throw it at a playlist submission service — and then wait. When nothing happens, they assume the algorithm is broken, the market doesn't get them, or they just need more followers.",
      },
      {
        type: "paragraph",
        text: "But there's a step they skipped. The step that separates artists who improve fast from those who spin their wheels: structured feedback before release.",
      },
      {
        type: "h2",
        text: "Why feedback before release actually matters",
      },
      {
        type: "paragraph",
        text: "Once a track is out, it's hard to change. You can update the file on some platforms, but the first impression has already been made — with your audience, playlist curators, and the algorithm. A cold start with a weaker track drags down your catalogue's overall performance.",
      },
      {
        type: "paragraph",
        text: "Feedback before release gives you a chance to catch things you've gone deaf to. When you've listened to a track 400 times in production, you stop hearing it the way a fresh listener does. A mix that sounds fine to you might be burying the vocals, losing energy in the middle eight, or taking too long to hit.",
      },
      {
        type: "quote",
        text: "You've listened to your track 400 times. A fresh listener hears something completely different on the first play.",
      },
      {
        type: "h2",
        text: "The problem with asking friends and family",
      },
      {
        type: "paragraph",
        text: "The first instinct is to send it to people you know. That feedback feels good — supportive, enthusiastic, encouraging. But it's almost useless for improvement. People who care about you will protect your feelings over your growth. They'll say it's great when they mean it's fine. They'll talk about what they liked and skip what they didn't.",
      },
      {
        type: "paragraph",
        text: "Useful feedback requires two things your friends often can't give you: genuine listening (not listening-to-be-supportive) and the language to articulate what they're actually hearing. A music producer who hears 50 tracks a week has a reference point. Most of the people in your life do not.",
      },
      {
        type: "h2",
        text: "Where to get feedback that actually helps",
      },
      {
        type: "list",
        items: [
          "Online communities (r/WeAreTheMusicMakers, r/makinghiphop) — free but inconsistent, often surface-level",
          "Discord production servers — better if you find an active, genre-specific one",
          "Peer review platforms — structured feedback from artists in your genre who are also making music",
          "Paid critique services — expensive, quality varies widely, overkill for most tracks at early stages",
        ],
      },
      {
        type: "paragraph",
        text: "The most underrated option is structured peer review — feedback from other artists who are actively making music in your genre. They understand the technical side, they have a taste reference point that's relevant to your sound, and because it's a structured exchange, there's genuine incentive to be honest and thorough.",
      },
      {
        type: "h2",
        text: "What good feedback actually looks like",
      },
      {
        type: "paragraph",
        text: "Not all feedback is created equal. Vague reactions like 'this is fire' or 'needs work on the mix' don't give you anything to act on. Good feedback should tell you specifically what's landing and what to change — with enough detail that you know exactly what to do.",
      },
      {
        type: "paragraph",
        text: "Look for feedback that covers the opening hook (did it grab them?), the structure and energy arc (where did they stay engaged vs. drift?), the mix balance (what's sitting right, what's buried or harsh?), and the overall production quality relative to your genre.",
      },
      {
        type: "paragraph",
        text: "MixReflect was built around this. Artists upload a track and get structured feedback from other artists in their genre — covering the first impression, production quality, what's working, and the one thing to fix before release. The goal is feedback specific enough to actually change something while you still can.",
      },
      {
        type: "faq",
        items: [
          {
            q: "How do I get feedback on my music before releasing it?",
            a: "The most reliable method is structured peer review — submitting your track to other active musicians who fill out a structured format independently, without seeing each other's responses. This lets you identify patterns: if multiple reviewers flag the same issue, it's real and worth fixing. Platforms like MixReflect are built specifically for this. Reddit and Discord communities are also options, but the feedback is less structured and reviewers anchor on each other's opinions.",
          },
          {
            q: "Is it worth getting feedback on music before releasing?",
            a: "Yes — especially because after producing a track you've heard it hundreds of times and can no longer evaluate it the way a first-time listener can. Pre-release feedback catches the things you've gone deaf to: vocals sitting too low, energy dips in the mid-section, intros that run too long. These are usually quick fixes, but you can't hear them yourself after 200 listens.",
          },
          {
            q: "Where can I get honest feedback on my music online?",
            a: "MixReflect is designed specifically for honest pre-release feedback — genre-matched artists review your track using a structured format, independently, so you can see where multiple people converge on the same issue. Reddit communities (r/WeAreTheMusicMakers, r/makinghiphop) and genre-specific Discord servers are free alternatives, though feedback quality is inconsistent and not independent.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "best-way-to-get-honest-feedback-on-a-beat",
    title: "The Best Way to Get Honest Feedback on a Beat",
    coverImage: "/blog/blog1.jpg",
    excerpt:
      "Honest feedback is rare. Here's why most feedback you get is useless — and what to look for instead.",
    category: "GUIDE",
    date: "May 26, 2026",
    readTime: "4 min read",
    content: [
      {
        type: "paragraph",
        text: "Here's the uncomfortable truth about feedback: most of it is worthless. Not because people are dishonest — but because giving genuinely useful feedback on music is hard, and most people default to whatever keeps the interaction comfortable.",
      },
      {
        type: "paragraph",
        text: "If you want to improve faster, you need to understand why most feedback fails — and how to find the kind that actually moves you forward.",
      },
      {
        type: "h2",
        text: "Why social media feedback doesn't help",
      },
      {
        type: "paragraph",
        text: "Posting a clip on Instagram or TikTok gives you engagement data, not feedback. Likes and comments tell you how the content performed socially — not whether the track is actually strong or what needs fixing. These are very different things.",
      },
      {
        type: "paragraph",
        text: "Comments on social are almost always positive. People who don't connect with it just scroll past. The people who do react comment 'heat' or 'this goes hard.' You end up with a filtered, skewed sample that tells you nothing about the track's weaknesses.",
      },
      {
        type: "quote",
        text: "Social media tells you how content performs. It doesn't tell you what's wrong with the music.",
      },
      {
        type: "image",
        src: "/blog/blog2.jpg",
        alt: "Getting honest feedback on a beat",
      },
      {
        type: "h2",
        text: "What makes feedback on a beat actually honest",
      },
      {
        type: "paragraph",
        text: "Honest feedback requires three conditions: the listener has no personal stake in your feelings, they have relevant musical knowledge, and there's a structure that forces them to address weaknesses — not just strengths.",
      },
      {
        type: "paragraph",
        text: "The structure part is often missed. If you ask someone 'what do you think?', they'll naturally talk about what they liked. That's human nature. But ask them 'where did your attention drift?' or 'what would you change before this is released?' and you get something different — because the question is framed around improvement, not approval.",
      },
      {
        type: "h2",
        text: "The best sources of honest beat feedback",
      },
      {
        type: "paragraph",
        text: "Producers who don't know you personally. They have no reason to protect your ego, and if they're making music themselves, they understand the craft well enough to say something specific. The key is finding a context where honest feedback is the norm, not the exception.",
      },
      {
        type: "paragraph",
        text: "Some Discord servers and subreddits have this culture. r/makinghiphop and r/edmproduction have feedback threads where critique is expected and people take it seriously. The quality is uneven, but you'll occasionally get something genuinely useful.",
      },
      {
        type: "paragraph",
        text: "Structured peer review platforms take this further. On MixReflect, artists review each other's tracks using a set format — covering the first impression, what's working, the weakest element, and the one change to make before release. Because the format forces reviewers to address weaknesses specifically, you get feedback that's harder to dodge with vague positivity.",
      },
      {
        type: "h2",
        text: "What to do with feedback once you have it",
      },
      {
        type: "paragraph",
        text: "One rule: don't act on every piece of feedback. Collect multiple responses, look for patterns, and only act on things multiple listeners flagged independently. One person saying the bass is too heavy might be their preference. Three people saying it means there's something to fix.",
      },
      {
        type: "paragraph",
        text: "The goal isn't to make a track everyone loves — it's to remove the things that are making listeners disengage. Those are different targets, and keeping them separate will save you from chasing your tail.",
      },
      { type: "cta" },
    ],
  },
  {
    slug: "how-music-producers-get-their-tracks-reviewed",
    title: "How Music Producers Get Their Tracks Reviewed",
    coverImage: "/blog/blog2.jpg",
    excerpt:
      "From blog submissions to peer platforms — the different ways producers get ears on their work, and what each one is actually good for.",
    category: "INDUSTRY",
    date: "May 26, 2026",
    readTime: "5 min read",
    content: [
      {
        type: "paragraph",
        text: "Getting your track heard is one thing. Getting it actually listened to — critically, attentively, with someone articulating exactly what they're hearing — is another thing entirely. Most of the music review ecosystem is built around the first. Very little of it is built around the second.",
      },
      {
        type: "paragraph",
        text: "Here's a breakdown of the main ways producers get their tracks reviewed, and what each one is genuinely useful for.",
      },
      {
        type: "h2",
        text: "Music blog submissions",
      },
      {
        type: "paragraph",
        text: "Music blogs range from major outlets (Pitchfork, The Fader) down to niche genre blogs with a few thousand loyal readers. Most accept submissions via email or through platforms like SubmitHub.",
      },
      {
        type: "paragraph",
        text: "Acceptance rates are low — often under 5% — and the feedback you receive, if any, is usually brief. The value here is distribution (getting in front of a new audience), not development (improving the track). By the time a blog reviews your music, the track should already be as strong as it can be.",
      },
      {
        type: "h2",
        text: "Playlist curator submissions",
      },
      {
        type: "paragraph",
        text: "Spotify for Artists has a built-in pitch tool. Independent curators can be reached through SubmitHub or direct outreach. Like blog submissions, this is about placement — curators accept or reject without telling you why. You learn nothing about the music itself.",
      },
      {
        type: "quote",
        text: "Blog and playlist submissions tell you if you got in. They don't tell you what to fix.",
      },
      {
        type: "h2",
        text: "Online communities and forums",
      },
      {
        type: "paragraph",
        text: "Subreddits like r/WeAreTheMusicMakers and r/makinghiphop have regular feedback threads. Discord servers for specific genres — there are large ones for lo-fi, electronic, hip-hop, and bedroom pop — often have dedicated feedback channels.",
      },
      {
        type: "paragraph",
        text: "Quality varies enormously. You might get a detailed paragraph from a producer who really listened, or a one-line reaction that tells you nothing. There's no structure enforcing thoroughness and no incentive rewarding good feedback, so it's hit or miss depending on who happens to be online.",
      },
      {
        type: "h2",
        text: "Paid critique services",
      },
      {
        type: "paragraph",
        text: "Some producers and engineers offer paid feedback sessions — a video or written critique for $20-100. Quality here is usually high if you pick the right person, but it's expensive for regular use and often overkill for early-stage work when the direction isn't locked in.",
      },
      {
        type: "paragraph",
        text: "Best for: a nearly finished track where you want one expert opinion before finalising the mix. Not ideal for: getting regular feedback across multiple tracks, or pre-production feedback when the arrangement is still evolving.",
      },
      {
        type: "h2",
        text: "Peer review platforms",
      },
      {
        type: "paragraph",
        text: "The newest category — and the most useful for producers making music regularly. Platforms like MixReflect work on a reciprocal model: you review other artists' tracks and earn credits to get your own reviewed.",
      },
      {
        type: "paragraph",
        text: "The advantages over other methods: feedback comes from other active musicians (relevant taste reference), it's structured (reviewers address specific elements), it scales (you can get feedback across multiple tracks over time), and the reciprocal model creates genuine incentive to be thorough rather than superficial.",
      },
      {
        type: "h2",
        text: "The right approach at the right stage",
      },
      {
        type: "list",
        items: [
          "Early draft — peer review communities, Discord feedback channels",
          "Pre-release — structured peer review platforms, paid critique if budget allows",
          "Release-ready — blog submissions, playlist pitching, Spotify for Artists pitch tool",
        ],
      },
      {
        type: "paragraph",
        text: "Most producers only use the last category. Adding structured feedback earlier in the process is the fastest way to close the gap between where you are and release-ready — and it means that when you do send your track to a blog or curator, it's already as strong as it can be.",
      },
      { type: "cta" },
    ],
  },
  {
    slug: "what-multiple-listeners-tell-you-that-one-person-cant",
    title: "What 5 People Hearing Your Track Tells You That 1 Person Can't",
    coverImage: "/blog/blog3.jpg",
    excerpt:
      "One listener's opinion is just their taste. Five listeners saying the same thing is something you can actually act on. Here's the difference.",
    category: "GUIDE",
    date: "May 27, 2026",
    readTime: "4 min read",
    content: [
      {
        type: "paragraph",
        text: "One person tells you the intro's too long. Do you cut it? Probably not — it might just be their taste. But what if four out of five people say the same thing, independently, without hearing each other's responses? Now it's not taste. It's a pattern. And patterns are the only feedback worth acting on before you release.",
      },
      {
        type: "h2",
        text: "Why single opinions are almost useless",
      },
      {
        type: "paragraph",
        text: "Every listener brings their own baggage. Their mood that day. Their genre preferences. What they had for breakfast. One person saying 'the drop doesn't hit' might be completely wrong for your target audience. Or they might be the only one telling you the truth. You have no way to know from a single data point.",
      },
      {
        type: "paragraph",
        text: "This is why most pre-release feedback fails artists. You send the track to a friend, they say it's great, you release it, nothing happens. Or you send it to one producer you respect, they give you a note, you change the whole arrangement, and it turns out that note was just personal preference. Single opinions move you in random directions.",
      },
      {
        type: "quote",
        text: "One person's feedback is a guess. Five people's feedback is a signal.",
      },
      {
        type: "h2",
        text: "What patterns actually look like",
      },
      {
        type: "paragraph",
        text: "When multiple independent listeners flag the same thing, the math starts working in your favour. If two people mention the vocals feel a bit quiet — worth noting. If four people say it without prompting, it's real. The thing they're flagging isn't a matter of taste anymore. It's something about the track that consistently pulls people out of the experience.",
      },
      {
        type: "paragraph",
        text: "The most common patterns we see: the intro runs too long before anything interesting happens, the energy dips in the mid-section and doesn't recover cleanly, the vocals sit under the mix instead of on top of it, and the ending feels abrupt or unresolved. None of these are hard to fix. But most artists never hear them because they only get one or two opinions before releasing.",
      },
      {
        type: "list",
        items: [
          "1 person flags something → ask someone else specifically about it",
          "2 people flag the same thing → it's probably real, start paying attention",
          "3+ people flag the same thing independently → fix it before you release",
          "Everyone says something different → the track is fine, trust yourself",
        ],
      },
      {
        type: "h2",
        text: "What a single reviewer genuinely can't tell you",
      },
      {
        type: "paragraph",
        text: "A single reviewer can't tell you whether their note is taste or truth. They don't know either. They can tell you what they felt, but they have no way to know if it's a them problem or a track problem. That distinction only emerges when you have multiple independent listeners — and it emerges fast.",
      },
      {
        type: "paragraph",
        text: "Five people who don't know each other, listening separately, and landing on the same note? The odds of that being coincidence or shared bias drop to almost zero. You now know something real about your track. That's a completely different thing to having an opinion about it.",
      },
      {
        type: "h2",
        text: "The release trap most artists fall into",
      },
      {
        type: "paragraph",
        text: "Most artists release first and find out what's wrong after. The streams come in slow, a couple of comments mention something feels off, and by then the first impression is burned. On Spotify, on playlists, with the algorithm — the first few days of a release carry disproportionate weight. A track that starts cold rarely recovers.",
      },
      {
        type: "paragraph",
        text: "Getting five structured listens before you release costs you maybe a week. It can save you from putting out a version of a track that's 80% of what it could be. The fix is usually small — a vocal level, a transition, trimming 16 bars from an intro. Small things that you've gone completely deaf to because you've heard the track 300 times.",
      },
      {
        type: "quote",
        text: "The fix is almost always smaller than you think. The problem is you can't hear it anymore.",
      },
      {
        type: "h2",
        text: "How to actually collect pattern feedback",
      },
      {
        type: "paragraph",
        text: "The feedback needs to be structured and independent. Structured means every listener is responding to the same questions — first impression, what's working, what to fix — so you can compare responses directly. Independent means they aren't reading each other's notes before they write their own. Group chats and Discord servers break the independence. Everyone anchors on the first opinion posted.",
      },
      {
        type: "paragraph",
        text: "MixReflect is built around this exact model. You upload a track, genre-matched artists listen and fill out a structured review independently, and then you get to see where the responses converge. When four reviewers flag the same moment in your track, it shows up clearly. That's the signal. That's what you fix.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What is the best way to get honest feedback on a beat?",
            a: "The best feedback on a beat comes from producers who don't know you personally and are responding to a structured format that requires them to address weaknesses, not just strengths. Platforms like MixReflect use genre-matched peer reviewers who fill out structured reviews independently — covering what works, the weakest element, and the one change to make before release. This format makes it harder to default to vague positivity.",
          },
          {
            q: "How do I get producers to review my beats?",
            a: "MixReflect's reciprocal model works well for this — you review other producers' tracks and earn credits to get your own reviewed. Because both parties are active producers, the feedback is musically informed. Reddit's r/makinghiphop has feedback threads, and genre-specific Discord servers often have dedicated critique channels, though the quality and depth varies significantly.",
          },
          {
            q: "Should I trust feedback from one person on my beat?",
            a: "Not as a basis for making changes. One person's feedback reflects their taste, their mood, and their genre biases — you have no way to know if it's a them problem or a track problem. Collect feedback from multiple independent listeners and only act on things that multiple people flag without having heard each other's responses. That's the difference between noise and signal.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "best-music-feedback-platforms-2026",
    title: "Best Music Feedback Platforms in 2026",
    coverImage: "/blog/blog5.jpg",
    excerpt:
      "From Reddit threads to peer review platforms — here's what every major option is actually good for, and when to use each one.",
    category: "GUIDE",
    date: "May 29, 2026",
    readTime: "6 min read",
    content: [
      {
        type: "paragraph",
        text: "If you search for ways to get feedback on your music, you'll find the same names mentioned over and over — Reddit, SubmitHub, Discord, paid critique services. What most articles skip is what each option is actually useful for. They're not interchangeable. Using SubmitHub when you need development feedback is like using a playlist pitching tool as a mixing tool — it's designed for a completely different job.",
      },
      {
        type: "paragraph",
        text: "Here's a breakdown of every major platform artists use to get feedback on their music in 2026, what each one is genuinely good for, and which stage of production it actually serves.",
      },
      {
        type: "h2",
        text: "Reddit (r/WeAreTheMusicMakers, r/makinghiphop, r/edmproduction)",
      },
      {
        type: "paragraph",
        text: "Reddit has some of the most active music production communities online. r/WeAreTheMusicMakers, r/makinghiphop, and r/edmproduction all have regular feedback threads where you can post a track and get responses from other producers and musicians.",
      },
      {
        type: "paragraph",
        text: "The upside: it's free, there are a lot of people, and some of them know what they're talking about. The downside: there's no structure. You might get a detailed paragraph from someone who really listened, or a one-line reaction that tells you nothing. Quality is inconsistent, and once the first reply goes up, everyone else anchors on it — which means the feedback stops being independent the moment the thread gets going.",
      },
      {
        type: "paragraph",
        text: "Best for: early-stage drafts where you just want a quick gut check. Not reliable for pre-release feedback on a finished track.",
      },
      {
        type: "h2",
        text: "Discord music servers",
      },
      {
        type: "paragraph",
        text: "Genre-specific Discord servers — there are large ones for lo-fi, hip-hop, electronic, and bedroom pop — usually have dedicated feedback channels. The community tends to be more tight-knit than Reddit, and if you find a well-run server with active members, the feedback can be genuinely good.",
      },
      {
        type: "paragraph",
        text: "The same anchoring problem applies though. Feedback channels are public, so whoever responds first shapes what everyone else says. Real-time chat also means feedback is often short and reactive rather than considered. Good for community, less reliable for structured critique.",
      },
      {
        type: "h2",
        text: "SubmitHub",
      },
      {
        type: "paragraph",
        text: "SubmitHub is not a feedback platform — it's a placement platform. You pay credits to submit your track to blogs, playlist curators, labels, and influencers, who then accept or reject it. If they pass, some will leave a brief note explaining why.",
      },
      {
        type: "paragraph",
        text: "The notes you get from a rejection are useful context, but they're not the same as feedback designed to improve the track. Curators are evaluating fit — does this track work for my audience, my playlist, my brand. That's a different question than 'what should this artist fix before releasing.'",
      },
      {
        type: "quote",
        text: "SubmitHub tells you if a curator wants to feature your track. It doesn't tell you how to make it better.",
      },
      {
        type: "paragraph",
        text: "Use SubmitHub after your track is as strong as it can be. Using it earlier wastes credits and creates a first impression with curators who may remember your name the next time you submit.",
      },
      {
        type: "h2",
        text: "Paid critique services",
      },
      {
        type: "paragraph",
        text: "Some producers and mix engineers offer paid feedback — a video or written critique for anywhere from $20 to $150 depending on who you're working with. When you pick someone with a relevant background and a genuine track record, the quality is usually high. They'll catch things you've been deaf to for weeks and give you specific, actionable notes.",
      },
      {
        type: "paragraph",
        text: "The limitation is cost and scale. At $50 a session, getting feedback across five tracks costs $250. That's a real budget for most independent artists, and it's hard to justify for every track you're working on. Paid critique makes most sense for a nearly-finished track where you want one expert perspective before finalising the mix.",
      },
      {
        type: "h2",
        text: "MixReflect",
      },
      {
        type: "paragraph",
        text: "MixReflect is a structured peer review platform built specifically for pre-release feedback. You upload a track before you release it, and genre-matched artists — other musicians actively making music in your space — listen and fill out a structured review independently. The structured format covers first impression, what's working, the main weakness, and production quality.",
      },
      {
        type: "paragraph",
        text: "The key difference from other options is independence and pattern detection. Because every reviewer fills out the same format without seeing each other's responses, you can see where multiple people converge on the same note. When three reviewers flag the same thing — the intro runs too long, the vocals are sitting under the mix, the mid-section loses energy — it's no longer one person's taste. It's a real signal about the track.",
      },
      {
        type: "paragraph",
        text: "The model is reciprocal: you review other artists' tracks to earn credits for your own reviews. It scales in a way paid critique doesn't, and because the reviewers are other active musicians, the feedback has a relevant taste reference rather than just being a random listener's reaction.",
      },
      {
        type: "h2",
        text: "Which platform to use and when",
      },
      {
        type: "list",
        items: [
          "Early draft, still arranging — Reddit feedback threads, genre Discord servers",
          "Pre-release, finished track — MixReflect for structured peer review, paid critique if budget allows",
          "Release-ready, seeking placement — SubmitHub for blogs and playlists, Spotify for Artists pitch tool for editorial",
          "Post-release, building audience — social, SoundCloud reposts, playlist communities",
        ],
      },
      {
        type: "paragraph",
        text: "Most artists only use the last category. They skip the pre-release step entirely and go straight to pitching a track they've heard 300 times and can no longer evaluate honestly. The artists who close the gap fastest are the ones who build structured feedback into the process before release — when there's still time to change something.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What is the best platform to get feedback on music in 2026?",
            a: "For pre-release feedback from other musicians, MixReflect is the strongest option in 2026 — it's structured, genre-matched, and independent (reviewers don't see each other's responses before submitting). For placement with curators and blogs, SubmitHub is the most established. For free community feedback, Reddit and genre Discord servers work for early drafts. The right platform depends on what stage your track is at and what you actually need.",
          },
          {
            q: "Is MixReflect free?",
            a: "Yes. MixReflect has a free plan with no credit card required. You get one review credit on signup, and you earn more credits by reviewing other artists' tracks. The Pro plan ($24.95/month) gives you 30 credits per month, three active slots, and priority queue placement.",
          },
          {
            q: "What is the difference between MixReflect and SubmitHub?",
            a: "MixReflect is a development tool — you submit pre-release tracks to get structured feedback from genre-matched peers so you can improve the track before it goes public. SubmitHub is a distribution tool — you submit release-ready tracks to curators, blogs, and playlist owners to get placement and exposure. They serve different stages of the release process and work best when used in sequence.",
          },
          {
            q: "How do music producers get feedback online?",
            a: "The main options are Reddit communities (r/WeAreTheMusicMakers, r/makinghiphop), genre-specific Discord servers, structured peer review platforms like MixReflect, and paid critique services. Reddit and Discord are free but inconsistent. MixReflect uses a structured format and genre-matching to produce more reliable, actionable feedback. Paid critique is high quality but expensive for regular use.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "mixreflect-vs-submithub",
    title: "MixReflect vs SubmitHub: What's the Difference",
    coverImage: "/blog/blog6.jpg",
    excerpt:
      "Both platforms take music submissions from independent artists. They're solving completely different problems — and using the wrong one at the wrong stage is one of the most common mistakes artists make.",
    category: "GUIDE",
    date: "May 30, 2026",
    readTime: "4 min read",
    content: [
      {
        type: "paragraph",
        text: "MixReflect and SubmitHub both accept music submissions from independent artists. That's roughly where the similarity ends. One is a development tool. One is a distribution tool. Using the wrong one at the wrong stage costs you time, money, and sometimes a first impression with curators you can't take back.",
      },
      {
        type: "h2",
        text: "What SubmitHub is",
      },
      {
        type: "paragraph",
        text: "SubmitHub is a platform for submitting music to curators — blogs, Spotify playlist owners, YouTube channels, labels, and influencers. You purchase credits and spend them submitting your track. Curators listen and either accept or decline. If they decline, most will leave a short note explaining why.",
      },
      {
        type: "paragraph",
        text: "The goal of SubmitHub is placement. You're trying to get your music featured in front of someone else's audience. Acceptance rates are typically under 10%, and the brief feedback you get on rejections is a byproduct of the process, not the core purpose. SubmitHub is designed for tracks that are already ready to release.",
      },
      {
        type: "h2",
        text: "What MixReflect is",
      },
      {
        type: "paragraph",
        text: "MixReflect is a structured peer review platform for pre-release tracks. You upload a track before it goes out, and genre-matched artists listen and fill out a detailed structured review — covering first impression, what's working, the main weakness, and production quality. Reviewers respond independently, without seeing each other's answers.",
      },
      {
        type: "paragraph",
        text: "The goal of MixReflect is improvement. You're trying to find out what to fix before anyone outside your inner circle hears the track. The structured format means you can identify patterns — if multiple reviewers flag the same moment in your track, it shows up clearly. That pattern is the signal.",
      },
      {
        type: "quote",
        text: "SubmitHub tells you if you got in. MixReflect tells you if you're ready.",
      },
      {
        type: "h2",
        text: "The difference in what you get back",
      },
      {
        type: "paragraph",
        text: "From SubmitHub: accepted or declined, and sometimes a sentence or two about why. Useful for knowing if a curator wanted to feature your track. Not useful for knowing what to change about the music.",
      },
      {
        type: "paragraph",
        text: "From MixReflect: multiple structured reviews covering specific elements — where the listener's attention dropped, what pulled them in, what felt off in the mix, how it compares to release-ready tracks in your genre. Enough to know exactly what to fix and whether the fix is worth making before you release.",
      },
      {
        type: "h2",
        text: "Why submitting to SubmitHub too early is expensive",
      },
      {
        type: "paragraph",
        text: "SubmitHub credits add up fast, especially if you're submitting to premium curators. Spending $30-50 on submissions for a track that isn't ready yet means burning budget on a bad first impression. Curators see thousands of submissions — if your track underperforms, you may be remembered the next time you submit under the same name.",
      },
      {
        type: "paragraph",
        text: "The more useful order: get structured feedback first, fix what comes up, then submit to curators once the track has cleared a real quality check. A track that's already been reviewed by five genre-matched listeners and had its weak points addressed is going to perform better on SubmitHub than one going out cold.",
      },
      {
        type: "h2",
        text: "How the pricing models compare",
      },
      {
        type: "paragraph",
        text: "SubmitHub charges per submission. Costs vary depending on whether you use basic or premium credits and which curators you target, but regular use adds up quickly — especially if you're releasing multiple tracks a year.",
      },
      {
        type: "paragraph",
        text: "MixReflect runs on a reciprocal model: you review other artists' tracks to earn credits for your own reviews. There's no per-submission fee for the core review loop. The cost is time, not money — which also means the feedback you receive comes from people with a genuine stake in the exchange, not a transactional curator interaction.",
      },
      {
        type: "h2",
        text: "Which one to use",
      },
      {
        type: "list",
        items: [
          "Track is still in development or pre-release → MixReflect for structured peer feedback",
          "Track is finished and you want to identify any remaining weak points → MixReflect before going anywhere else",
          "Track has been through feedback, fixes are done, it's release-ready → SubmitHub for placement and distribution",
          "Both at different stages → use MixReflect first, SubmitHub after",
        ],
      },
      {
        type: "paragraph",
        text: "They're not competing products — they're sequential steps. MixReflect is the quality check before release. SubmitHub is the distribution push after. Using both in the right order gives your track the best possible version to pitch, and the best possible chance of placement when you do.",
      },
      {
        type: "faq",
        items: [
          {
            q: "What is the difference between MixReflect and SubmitHub?",
            a: "MixReflect is for pre-release feedback — you submit a track to get structured critique from genre-matched peers so you can improve it before release. SubmitHub is for placement — you submit a finished track to curators, blogs, and playlist owners who accept or reject it for their audience. MixReflect is a development tool. SubmitHub is a distribution tool. They work best used in sequence: MixReflect first, SubmitHub after.",
          },
          {
            q: "Should I use MixReflect or SubmitHub?",
            a: "Use both, but in the right order. Use MixReflect before your track is released to get structured feedback from other artists and identify what to fix. Once the track has been through feedback and any patterns have been addressed, use SubmitHub to pitch it to curators for placement. Submitting an unfinished track to curators wastes credits and creates a poor first impression.",
          },
          {
            q: "Is MixReflect free to use?",
            a: "Yes. MixReflect is free to sign up — no credit card required. You receive one review credit on signup and earn more by reviewing other artists' tracks. The reciprocal model means there's no per-submission fee for the core review loop.",
          },
          {
            q: "How much does SubmitHub cost compared to MixReflect?",
            a: "SubmitHub charges per submission using a credit system — costs vary by curator type and volume, but regular use adds up quickly. MixReflect's core model is free and credit-based: you earn credits by reviewing others, so the main cost is time rather than money. MixReflect also offers a Pro plan at $24.95/month for artists who want more volume.",
          },
        ],
      },
      { type: "cta" },
    ],
  },
];

export const posts = _posts.sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
