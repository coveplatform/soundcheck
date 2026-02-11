import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    const t = await (prisma as any).supportTicket.findMany({
      take: 1,
      select: {
        id: true,
        subject: true,
        status: true,
        SupportMessage: { take: 1, select: { body: true } },
      },
    });
    console.log("OK with SupportMessage:", JSON.stringify(t));
  } catch (e: any) {
    console.error("ERROR with SupportMessage:", e.message?.slice(0, 200));
  }

  try {
    const t2 = await (prisma as any).supportTicket.findMany({
      take: 1,
      select: {
        id: true,
        subject: true,
        status: true,
        messages: { take: 1, select: { body: true } },
      },
    });
    console.log("OK with messages:", JSON.stringify(t2));
  } catch (e: any) {
    console.error("ERROR with messages:", e.message?.slice(0, 200));
  }

  await prisma.$disconnect();
}
main();
