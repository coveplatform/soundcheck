import { prisma } from "../src/lib/prisma";

// More natural, human-sounding artist notes
const NATURAL_NOTES: Record<string, string[]> = {
  electronic: [
    "Curious if the low end sits right on different speakers",
    "Been going back and forth on the drop — does it land?",
    "Tried something different with the synth layers here",
    "Not sure if the build feels long enough before the payoff",
    "Would love thoughts on the overall energy and flow",
    "Wondering if the bass is too heavy or just right",
    "The breakdown is new territory for me — honest thoughts?",
    "Spent ages on the mix — can you hear everything clearly?",
  ],
  hiphop: [
    "Does the vocal sit right against the beat?",
    "Wondering if the 808 pattern gets repetitive",
    "Tried a different flow on the second verse",
    "Not sure about the hook — catchy enough?",
    "Would love feedback on the overall bounce",
    "The sample chop was tricky — does it feel natural?",
    "Honest thoughts on the lyrical delivery",
  ],
  pop: [
    "Is the chorus memorable enough on first listen?",
    "Wondering if the production feels too busy",
    "The bridge was a last-minute addition — thoughts?",
    "Does the vocal sit well in the mix?",
    "Curious about the overall vibe and feel",
    "Not sure if it needs more energy or if it's right",
  ],
  rock: [
    "Does the guitar tone work for this style?",
    "Wondering if the drums hit hard enough",
    "The breakdown was experimental — does it work?",
    "Curious about the energy level throughout",
    "Not sure if the mix is too raw or just right",
    "Would love thoughts on the overall arrangement",
  ],
  other: [
    "Does the mood come through clearly?",
    "Wondering about the pacing — too slow?",
    "Tried blending a few styles here",
    "Curious if the arrangement holds your attention",
    "Would love honest thoughts on the overall feel",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectGenreFolder(genreSlugs: string[]): string {
  const slugSet = new Set(genreSlugs);
  if (slugSet.has("electronic") || slugSet.has("house") || slugSet.has("techno") || slugSet.has("edm")) return "electronic";
  if (slugSet.has("hip-hop-rnb") || slugSet.has("hip-hop") || slugSet.has("trap") || slugSet.has("rnb")) return "hiphop";
  if (slugSet.has("pop-dance") || slugSet.has("pop") || slugSet.has("indie-pop")) return "pop";
  if (slugSet.has("rock-metal") || slugSet.has("rock") || slugSet.has("metal")) return "rock";
  return "other";
}

async function main() {
  const seedTracks = await prisma.track.findMany({
    where: { ArtistProfile: { User: { email: { endsWith: "@seed.mixreflect.com" } } } },
    select: { id: true, title: true, Genre: { select: { slug: true } } },
  });

  console.log(`Updating ${seedTracks.length} seed track notes...`);

  for (const track of seedTracks) {
    const folder = detectGenreFolder(track.Genre.map(g => g.slug));
    const notes = NATURAL_NOTES[folder] ?? NATURAL_NOTES.other;
    const newNote = pickRandom(notes);

    await prisma.track.update({
      where: { id: track.id },
      data: { feedbackFocus: newNote },
    });
    console.log(`  ${track.title}: "${newNote}"`);
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}
main();
