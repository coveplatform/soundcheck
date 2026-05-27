export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
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

export const posts: BlogPost[] = [
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
      { type: "cta" },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
