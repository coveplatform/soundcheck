import { prisma } from "../../src/lib/prisma";

const r = await prisma.review.findFirst({
  where: {
    status: "COMPLETED",
    bestPart: { not: null },
    productionScore: { gte: 4 },
  },
  select: {
    id: true,
    productionScore: true,
    firstImpression: true,
    bestPart: true,
    Track: { select: { title: true } },
  },
});

console.log(JSON.stringify(r, null, 2));
await prisma.$disconnect();
