import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import type { FirstImpression } from "@prisma/client";

const generateReviewSchema = z.object({
  count: z.number().int().min(1).max(20),
});

// Template data for generating realistic fake reviews
const FAKE_REVIEWERS = [
  { email: "marcus.chen.music@gmail.com", name: "Marcus Chen" },
  { email: "sarahbeatsldn@hotmail.com", name: "Sarah Thompson" },
  { email: "djmikewilliams@yahoo.com", name: "Mike Williams" },
  { email: "emilysounddesign@gmail.com", name: "Emily Rodriguez" },
  { email: "james.producer.uk@outlook.com", name: "James Bennett" },
  { email: "alexkimbeats@gmail.com", name: "Alex Kim" },
  { email: "olivia.musichead@icloud.com", name: "Olivia Martinez" },
  { email: "ryan.audioeng@gmail.com", name: "Ryan O'Connor" },
  { email: "natasha.beats@hotmail.com", name: "Natasha Patel" },
  { email: "chris.soundwave@gmail.com", name: "Chris Anderson" },
  { email: "jessica.melodic@yahoo.com", name: "Jessica Lee" },
  { email: "daniel.basshead@gmail.com", name: "Daniel Wright" },
  { email: "sophie.synths@outlook.com", name: "Sophie Turner" },
  { email: "kevin.grooves@gmail.com", name: "Kevin Nguyen" },
  { email: "amanda.vibes@icloud.com", name: "Amanda Foster" },
  { email: "tyler.mixmaster@gmail.com", name: "Tyler Jackson" },
  { email: "rachel.audiophile@hotmail.com", name: "Rachel Green" },
  { email: "brandon.lowend@gmail.com", name: "Brandon Scott" },
  { email: "megan.frequencies@yahoo.com", name: "Megan Harris" },
  { email: "david.waveform@gmail.com", name: "David Miller" },
];

// Password for all demo reviewer accounts
const DEMO_PASSWORD = "demo123456";

const FIRST_IMPRESSIONS: FirstImpression[] = ["STRONG_HOOK", "DECENT", "LOST_INTEREST"];

const BEST_PARTS = [
  "The intro really grabbed me - the way it opens sets up the whole vibe perfectly. It's catchy without being overbearing and makes you want to keep listening to see where the track goes.",
  "The energy in the chorus section is fantastic. Everything comes together really well and creates this satisfying moment that you want to hear again. Great job on the arrangement there.",
  "The breakdown in the middle is honestly my favorite part. The way you strip everything back and then build it up again creates this really satisfying tension and release. Smart arrangement choice.",
  "The main hook is absolutely infectious. It sits perfectly in the mix and has this groove that makes you want to move. Really well executed.",
  "The melody is super memorable. After just one listen it was already stuck in my head. That's the sign of good songwriting - simple but effective.",
  "The atmosphere you've created is really immersive. It adds this emotional quality without being overwhelming. The production choices complement the track's mood perfectly.",
  "The climax of the track is fantastic. Everything hits at the right moment and the layering creates this wall of energy that's really satisfying to hear.",
  "I really appreciate the attention to detail throughout. The little variations keep things interesting and show that you've put real thought into the arrangement.",
  "The harmonic choices have this emotional quality that really resonates. It's familiar enough to feel comfortable but has some unexpected turns that keep it fresh and interesting.",
  "The way you've balanced all the elements is impressive. Nothing fights for space and everything has its place in the mix. Really clean production work.",
];

const WEAKEST_PARTS = [
  "The transition around the middle section feels a bit abrupt to me. Maybe adding some kind of transitional element would help smooth it out and make the flow feel more natural between sections.",
  "I think some of the busier sections could use a bit of work. There are moments where elements are competing for space which creates a bit of harshness at higher volumes.",
  "The outro feels like it ends a bit suddenly. It might benefit from a longer fade or some kind of musical conclusion that gives the listener a sense of closure rather than just cutting off.",
  "There's a section where the arrangement feels a bit empty compared to the rest of the track. Adding some subtle layers or atmospheric elements could help fill out the sound without changing the vibe.",
  "The dynamics could be a bit more varied in places. There are moments where the track feels a bit flat and could benefit from more contrast between sections.",
  "I noticed the low end could be tightened up a bit. There's some muddiness that's eating up headroom and making the mix feel less clear than it could be.",
  "The second half feels like it could use a bit more variation from the first. Adding some new elements or changing things up would help maintain interest throughout the track.",
  "Some of the transitions feel a bit sudden in places. Smoother changes between sections would make the flow feel more organic and less jarring to the ear.",
  "There are moments where certain elements feel a little buried in the mix. Bringing them up slightly could help the track feel more balanced overall.",
  "The stereo spread could be wider in some parts. The track feels a bit narrow at times, and spreading some elements out would create a more immersive listening experience.",
];

const ADDITIONAL_NOTES = [
  "Overall this is a really solid track and I can tell you've put a lot of work into it. The production quality is there and the musical ideas are strong. With a bit of polish, this could really shine. I'd definitely listen to this again and I'm curious to hear what else you've been working on. Keep pushing your sound!",
  "I genuinely enjoyed listening to this one. It's got a vibe that feels authentic and not like you're trying to copy anyone else's style. That's rare and valuable. The technical side of things is mostly there - just needs some small tweaks to really compete with commercial releases. Looking forward to hearing more from you!",
  "This track has a lot of potential and shows real promise. You've got a good ear for melody and the overall arrangement works well. I think with a few adjustments and maybe some mastering, this could be ready for release. Don't be afraid to experiment more - you clearly have the skills.",
  "Really enjoyed the journey this track takes you on. It's got dynamics, it's got emotion, and it keeps you engaged throughout. The production is clean and professional-sounding for the most part. A few small things to address but nothing major. You should be proud of this one!",
  "This is the kind of track I'd add to my playlist without hesitation. It's got that quality where you want to hear it again as soon as it ends. The mix could use some refinement but the core musical ideas are really strong. You've definitely got something here - keep developing this style!",
  "I can hear a lot of influences in this track but you've managed to make it your own thing. That's not easy to do. The production choices make sense for the genre and the energy is consistent throughout. Would love to hear how this sounds with a professional master on it.",
  "Solid work here. The track has a clear identity and knows what it wants to be. Sometimes artists try to do too much in one song but you've shown restraint and let the ideas breathe. That's a sign of maturity in production. Keep refining your craft!",
  "This track has a great foundation and the main ideas are really working. It's catchy, it's well-produced, and it's got replay value. The areas for improvement are minor and mostly technical. I think you're onto something good here and should keep developing this sound.",
  "Listening to this made me want to check out more of your music. It's got character and doesn't sound like a generic template track. The production is tight and the arrangement keeps things interesting. Just needs a bit more polish and this would be release-ready.",
  "I appreciate the creativity and effort that went into this. It's clear you have a vision for your sound and the skills to execute it. The track flows well and has memorable moments. With some refinements, this could compete with anything out there in the genre.",
];

const NEXT_ACTIONS = [
  "I'd suggest doing an A/B comparison with some reference tracks in a similar style. It can really help identify where your mix might need adjustment and give you a target to aim for in terms of overall balance.",
  "Consider getting a fresh perspective after taking a break from the track. Sometimes stepping away for a day or two and coming back with fresh ears reveals things you might have missed when you were deep in the production.",
  "It might be worth experimenting with the arrangement to add more contrast between sections. Having clearer distinctions between parts can really help the track feel more dynamic.",
  "Try listening to the track on different sound systems - car speakers, earbuds, laptop speakers. This will help you identify any issues that might not be apparent on your usual setup.",
  "Consider sending this to a few trusted friends or fellow musicians for feedback before finalizing. A second opinion can catch things you might be too close to the track to notice.",
  "You might benefit from adding some subtle variation and movement throughout the track. Small changes between sections can make a big difference in keeping the listener engaged.",
  "Think about the mastering stage - professional mastering can really help the track translate better across different playback systems and give it that final polish.",
  "Keep building on this style and sound. You're developing something unique and the more you work on it, the more refined it will become. Trust your instincts and keep experimenting.",
  "Consider getting feedback from other artists or a professional if possible. Sometimes an outside perspective on the mixing and arrangement can elevate a track significantly.",
  "Keep working on your ear training and critical listening skills. The more music you analyze and study, the better your own productions will become. You're clearly on the right track already.",
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(arr: readonly T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate multiple unique reviews - ensures no duplicate content for the same track
function generateUniqueReviews(count: number, trackDuration: number) {
  // Shuffle all content arrays to get unique content for each review
  const shuffledBestParts = shuffleArray(BEST_PARTS);
  const shuffledWeakestParts = shuffleArray(WEAKEST_PARTS);
  const shuffledAdditionalNotes = shuffleArray(ADDITIONAL_NOTES);
  const shuffledNextActions = shuffleArray(NEXT_ACTIONS);
  const shuffledFirstImpressions = shuffleArray(FIRST_IMPRESSIONS);

  const reviews = [];
  for (let i = 0; i < count; i++) {
    reviews.push({
      firstImpression: shuffledFirstImpressions[i % shuffledFirstImpressions.length],
      productionScore: getRandomInt(3, 5),
      originalityScore: getRandomInt(3, 5),
      wouldListenAgain: Math.random() > 0.3,
      wouldAddToPlaylist: Math.random() > 0.4,
      wouldShare: Math.random() > 0.5,
      wouldFollow: Math.random() > 0.4,
      bestPart: shuffledBestParts[i % shuffledBestParts.length],
      weakestPart: shuffledWeakestParts[i % shuffledWeakestParts.length],
      additionalNotes: shuffledAdditionalNotes[i % shuffledAdditionalNotes.length],
      nextActions: shuffledNextActions[i % shuffledNextActions.length],
      listenDuration: Math.max(60, trackDuration - getRandomInt(0, 30)),
    });
  }
  return reviews;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Admin check
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { count } = generateReviewSchema.parse(body);

    // Get track info
    const track = await prisma.track.findUnique({
      where: { id },
      select: {
        id: true,
        duration: true,
        reviewsRequested: true,
        reviewsCompleted: true,
        status: true,
        reviews: { select: { id: true } },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const trackDuration = track.duration || 180; // Default 3 minutes if no duration

    // Hash the demo password once
    const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

    // Get or create demo reviewers
    const reviewerData = FAKE_REVIEWERS.slice(0, count);
    const reviewers = [];

    for (const { email, name } of reviewerData) {
      let user = await prisma.user.findUnique({
        where: { email },
        include: { listenerProfile: true },
      });

      // Create demo user and listener profile if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            password: passwordHash,
            emailVerified: new Date(),
            isReviewer: true,
            listenerProfile: {
              create: {
                tier: "NORMAL",
              },
            },
          },
          include: { listenerProfile: true },
        });
      } else if (!user.name) {
        // Update existing user with name if missing
        user = await prisma.user.update({
          where: { email },
          data: { name },
          include: { listenerProfile: true },
        });
      }

      if (user.listenerProfile) {
        reviewers.push(user.listenerProfile);
      }
    }

    if (reviewers.length === 0) {
      return NextResponse.json(
        { error: "Failed to create demo reviewers" },
        { status: 500 }
      );
    }

    // Generate unique fake reviews (no duplicate content for the same track)
    const reviewCount = Math.min(count, reviewers.length);
    const uniqueReviewData = generateUniqueReviews(reviewCount, trackDuration);

    const createdReviews = [];
    for (let i = 0; i < reviewCount; i++) {
      const reviewer = reviewers[i]!;
      const fakeData = uniqueReviewData[i]!;

      const review = await prisma.review.create({
        data: {
          trackId: track.id,
          reviewerId: reviewer.id,
          status: "COMPLETED",
          countsTowardCompletion: true,
          countsTowardAnalytics: true, // Include in analytics for realistic data
          ...fakeData,
        },
      });

      createdReviews.push(review);
    }

    // Update track completion count
    await prisma.track.update({
      where: { id: track.id },
      data: {
        reviewsCompleted: {
          increment: count,
        },
        // If all reviews are now completed, mark track as completed
        ...(track.reviewsCompleted + count >= track.reviewsRequested
          ? { status: "COMPLETED", completedAt: new Date() }
          : track.status === "PENDING_PAYMENT" || track.status === "UPLOADED"
          ? { status: "IN_PROGRESS" }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      count: createdReviews.length,
      message: `Generated ${createdReviews.length} fake reviews`,
    });
  } catch (error) {
    console.error("Generate fake reviews error:", error);
    return NextResponse.json(
      { error: "Failed to generate fake reviews" },
      { status: 500 }
    );
  }
}
