import { prisma } from "../src/lib/prisma";
async function main() {
  const id = "cmk7ph6ql000004l8bzi302sx";

  // Test if feedbackViewedAt column exists by selecting it
  try {
    const t = await prisma.track.findUnique({
      where: { id },
      select: { feedbackViewedAt: true },
    });
    console.log("feedbackViewedAt select OK:", t);
  } catch (err: any) {
    console.error("feedbackViewedAt select FAILED:", err.message);
  }

  // Test the update
  try {
    await prisma.track.update({
      where: { id },
      data: { feedbackViewedAt: new Date() },
    });
    console.log("feedbackViewedAt update OK");
  } catch (err: any) {
    console.error("feedbackViewedAt update FAILED:", err.message);
  }

  await prisma.$disconnect();
}
main();
